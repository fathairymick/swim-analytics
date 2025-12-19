import { NextRequest, NextResponse } from 'next/server';
import { SwimTime, Stroke, Course } from '@/lib/types';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const memberNumber = searchParams.get('memberNumber');

    if (!memberNumber) {
        return NextResponse.json({ error: 'Member number is required' }, { status: 400 });
    }

    try {
        const baseUrl = 'https://www.swimmingresults.org/individualbest';
        const mainUrl = `${baseUrl}/personal_best.php?mode=A&tiref=${memberNumber}`;
        const response = await fetch(mainUrl);
        const html = await response.text();

        if (html.includes("We do not recognise that membership number")) {
            return NextResponse.json({ error: 'Membership number not recognised or data hidden' }, { status: 404 });
        }

        const times: Partial<SwimTime>[] = [];
        const detailLinks: { url: string, event: string, course: Course }[] = [];

        // Regex to find links to detail pages in the main table
        // <a href="./personal_best_time_date.php?..." ...>50 Freestyle</a>
        const linkRegex = /<a\s+href="\.\/(personal_best_time_date\.php\?[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;

        // We need to know which course section we are in
        const lcSectionMatch = html.match(/<p class="rnk_sj">Long Course<\/p>[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/);
        const scSectionMatch = html.match(/<p class="rnk_sj">Short Course<\/p>[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/);

        const extractLinks = (sectionHtml: string | null, course: Course) => {
            if (!sectionHtml) return;
            const links = [...sectionHtml.matchAll(linkRegex)];
            for (const linkMatch of links) {
                const relativeUrl = linkMatch[1];
                const eventName = linkMatch[2].trim(); // e.g. "50 Freestyle"
                detailLinks.push({
                    url: `${baseUrl}/${relativeUrl}`,
                    event: eventName,
                    course
                });
            }
        };

        if (lcSectionMatch) extractLinks(lcSectionMatch[1], 'LCM');
        if (scSectionMatch) extractLinks(scSectionMatch[1], 'SCM');

        // Helper to parse detail page
        const fetchDetail = async (link: { url: string, event: string, course: Course }) => {
            try {
                const res = await fetch(link.url);
                const pageHtml = await res.text();

                // Find the "Swims in Date Order" table
                // It usually follows <p class="rnk_sj">Swims in Date Order</p>
                const dateOrderTableMatch = pageHtml.match(/Swims in Date Order<\/p>[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/);
                if (!dateOrderTableMatch) return;

                const tableHtml = dateOrderTableMatch[1];
                const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
                const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
                const clean = (str: string) => str.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();

                const rows = [...tableHtml.matchAll(rowRegex)];
                for (const rowMatch of rows) {
                    const row = rowMatch[1];
                    const cells = [...row.matchAll(cellRegex)].map(m => clean(m[1]));

                    // Detail Page Columns: Time, WA Pts, Round, Date, Meet, Venue, Club, Level
                    // Index: 0, 1, 2, 3, 4, 5, 6, 7
                    if (cells.length >= 5) {
                        const timeStr = cells[0];
                        const dateStr = cells[3];
                        const meetName = cells[4];

                        // Parse Event
                        const eventMatch = link.event.match(/(\d+)m?\s+(.+)/);
                        if (eventMatch) {
                            const distance = parseInt(eventMatch[1]);
                            const strokeStr = eventMatch[2].trim();

                            let stroke: Stroke | null = null;
                            if (strokeStr.includes('Freestyle')) stroke = 'Freestyle';
                            else if (strokeStr.includes('Backstroke')) stroke = 'Backstroke';
                            else if (strokeStr.includes('Breaststroke')) stroke = 'Breaststroke';
                            else if (strokeStr.includes('Butterfly')) stroke = 'Butterfly';
                            else if (strokeStr.includes('Individual Medley')) stroke = 'Individual Medley';
                            else if (strokeStr.includes('Individual')) stroke = 'Individual Medley';

                            if (stroke && !isNaN(distance)) {
                                const timeParts = timeStr.split(':');
                                let timeMs = 0;
                                if (timeParts.length === 2) {
                                    timeMs = (parseInt(timeParts[0]) * 60 * 1000) + (parseFloat(timeParts[1]) * 1000);
                                } else {
                                    timeMs = parseFloat(timeStr) * 1000;
                                }

                                const [day, month, year] = dateStr.split('/');
                                const fullYear = year.length === 2 ? `20${year}` : year;
                                const formattedDate = `${fullYear}-${month}-${day}`;

                                if (!isNaN(timeMs)) {
                                    times.push({
                                        id: crypto.randomUUID(),
                                        date: formattedDate,
                                        timeMs: Math.round(timeMs),
                                        formattedTime: timeStr,
                                        event: {
                                            stroke,
                                            distance: distance as any,
                                            course: link.course
                                        },
                                        isOfficial: true,
                                        meetName: meetName || 'Imported'
                                    });
                                }
                            }
                        }
                    }
                }

            } catch (err) {
                console.error(`Failed to fetch detail for ${link.event}:`, err);
            }
        };

        // Process links in batches to be polite
        const BATCH_SIZE = 5;
        for (let i = 0; i < detailLinks.length; i += BATCH_SIZE) {
            const batch = detailLinks.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(fetchDetail));
        }

        return NextResponse.json({ times });

    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json({ error: 'Failed to import times' }, { status: 500 });
    }
}
