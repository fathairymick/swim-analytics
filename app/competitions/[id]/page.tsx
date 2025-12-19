"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSwimData } from "@/lib/hooks";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Competition, TimeStandard } from "@/lib/types";
import { formatTime, parseTime } from "@/lib/utils";

export default function CompetitionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { competitions, updateCompetition } = useSwimData();
    const [competition, setCompetition] = useState<Competition | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'standards'>('details');

    // Standards editing state
    const [selectedSex, setSelectedSex] = useState<'M' | 'F'>('M');
    const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('14');
    const [editingCell, setEditingCell] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        if (competitions.length > 0 && params.id) {
            const found = competitions.find(c => c.id === params.id);
            if (found) {
                setCompetition(found);
                // Initialize selected sex based on swimmer if possible, but default M is fine
            } else {
                router.push('/competitions');
            }
        }
    }, [competitions, params.id, router]);

    if (!competition) return <div className="p-8">Loading...</div>;

    const handleSaveDetails = (e: React.FormEvent) => {
        e.preventDefault();
        updateCompetition(competition);
        alert('Competition details saved.');
    };

    const handleStandardUpdate = (eventKey: string, timeMs: number) => {
        const newStandards = { ...competition.standards };
        if (!newStandards[selectedSex]) newStandards[selectedSex] = {};
        if (!newStandards[selectedSex][selectedAgeGroup]) newStandards[selectedSex][selectedAgeGroup] = {};

        newStandards[selectedSex][selectedAgeGroup][eventKey] = timeMs;

        const updatedComp = { ...competition, standards: newStandards };
        setCompetition(updatedComp);
        updateCompetition(updatedComp);
        setEditingCell(null);
    };

    const handleCellClick = (eventKey: string, currentMs: number) => {
        setEditingCell(eventKey);
        setEditValue(currentMs ? formatTime(currentMs) : '');
    };

    const handleKeyDown = (e: React.KeyboardEvent, eventKey: string) => {
        if (e.key === 'Enter') {
            const ms = parseTime(editValue);
            if (ms > 0) {
                handleStandardUpdate(eventKey, ms);
            }
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            // Expected headers: Distance, Stroke, Age Group, Sex, Qualifying Time
            const distIdx = headers.findIndex(h => h.includes('distance'));
            const strokeIdx = headers.findIndex(h => h.includes('stroke'));
            const ageIdx = headers.findIndex(h => h.includes('age'));
            const sexIdx = headers.findIndex(h => h.includes('sex'));
            const timeIdx = headers.findIndex(h => h.includes('time'));

            if (distIdx === -1 || strokeIdx === -1 || ageIdx === -1 || sexIdx === -1 || timeIdx === -1) {
                alert('Error: CSV must contain Distance, Stroke, Age Group, Sex, and Qualifying Time columns.');
                return;
            }

            // Clear existing standards before import
            const newStandards: TimeStandard = {};
            let count = 0;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Handle CSV parsing more robustly if needed, but simple split for now
                const cols = line.split(',').map(c => c.trim());
                if (cols.length < 5) continue;

                const rawDist = cols[distIdx];
                const rawStroke = cols[strokeIdx];
                const rawAge = cols[ageIdx];
                const rawSex = cols[sexIdx];
                const rawTime = cols[timeIdx];

                // Map Sex
                let sex: 'M' | 'F' | null = null;
                if (rawSex.toLowerCase().includes('women') || rawSex.toLowerCase().includes('female')) sex = 'F';
                else if (rawSex.toLowerCase().includes('men') || rawSex.toLowerCase().includes('open') || rawSex.toLowerCase().includes('male')) sex = 'M';

                // Map Age Group
                let ageGroup: string | null = null;
                if (rawAge === '10/11' || rawAge === '11-12' || rawAge === '10 & 11') ageGroup = '10 & 11';
                else if (rawAge === '12') ageGroup = '12';
                else if (rawAge === '13') ageGroup = '13';
                else if (rawAge === '14') ageGroup = '14';
                else if (rawAge === '15') ageGroup = '15';
                else if (rawAge === '16') ageGroup = '16';
                else if (rawAge === '17') ageGroup = '17';
                else if (rawAge === '18+' || rawAge === '18/Over' || rawAge === '17/Over') ageGroup = '18+';

                // Map Event
                let eventKey: string | null = null;
                const dist = rawDist.replace('m', '').trim();
                const stroke = rawStroke.toLowerCase();

                if (stroke.includes('free')) eventKey = `Freestyle${dist}`;
                else if (stroke.includes('back')) eventKey = `Backstroke${dist}`;
                else if (stroke.includes('breast')) eventKey = `Breaststroke${dist}`;
                else if (stroke.includes('fly') || stroke.includes('butter')) eventKey = `Butterfly${dist}`;
                else if (stroke.includes('medley') || stroke.includes('im')) eventKey = `Individual Medley${dist}`;

                // Parse Time
                const timeMs = parseTime(rawTime);

                if (sex && ageGroup && eventKey && timeMs > 0) {
                    if (!newStandards[sex]) newStandards[sex] = {};
                    if (!newStandards[sex][ageGroup]) newStandards[sex][ageGroup] = {};
                    newStandards[sex][ageGroup][eventKey] = timeMs;
                    count++;
                }
            }

            const updatedComp = { ...competition, standards: newStandards };
            setCompetition(updatedComp);
            updateCompetition(updatedComp);
            alert(`Successfully imported ${count} qualifying times!`);
        };
        reader.readAsText(file);
    };

    const events = [
        { key: 'Freestyle50', label: '50m Freestyle' },
        { key: 'Freestyle100', label: '100m Freestyle' },
        { key: 'Freestyle200', label: '200m Freestyle' },
        { key: 'Freestyle400', label: '400m Freestyle' },
        { key: 'Freestyle800', label: '800m Freestyle' },
        { key: 'Freestyle1500', label: '1500m Freestyle' },
        { key: 'Backstroke50', label: '50m Backstroke' },
        { key: 'Backstroke100', label: '100m Backstroke' },
        { key: 'Backstroke200', label: '200m Backstroke' },
        { key: 'Breaststroke50', label: '50m Breaststroke' },
        { key: 'Breaststroke100', label: '100m Breaststroke' },
        { key: 'Breaststroke200', label: '200m Breaststroke' },
        { key: 'Butterfly50', label: '50m Butterfly' },
        { key: 'Butterfly100', label: '100m Butterfly' },
        { key: 'Butterfly200', label: '200m Butterfly' },
        { key: 'Individual Medley100', label: '100m Individual Medley' },
        { key: 'Individual Medley200', label: '200m Individual Medley' },
        { key: 'Individual Medley400', label: '400m Individual Medley' },
    ];

    const ageGroups = ['10 & 11', '12', '13', '14', '15', '16', '17', '18+'];

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => router.push('/competitions')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{competition.name}</h1>
                    <p className="text-muted-foreground">Edit competition details and qualifying times.</p>
                </div>
            </div>

            <div className="flex gap-4 border-b">
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('details')}
                >
                    Details
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'standards' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('standards')}
                >
                    Qualifying Times
                </button>
            </div>

            {activeTab === 'details' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Competition Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSaveDetails} className="space-y-4 max-w-md">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Name</label>
                                <input
                                    required
                                    type="text"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={competition.name}
                                    onChange={(e) => setCompetition({ ...competition, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Qualifying Start Date</label>
                                <input
                                    required
                                    type="date"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={competition.qualifyingPeriod.start}
                                    onChange={(e) => setCompetition({
                                        ...competition,
                                        qualifyingPeriod: { ...competition.qualifyingPeriod, start: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Qualifying End Date</label>
                                <input
                                    required
                                    type="date"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={competition.qualifyingPeriod.end}
                                    onChange={(e) => setCompetition({
                                        ...competition,
                                        qualifyingPeriod: { ...competition.qualifyingPeriod, end: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Age At Date</label>
                                <input
                                    required
                                    type="date"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={competition.ageAtDate}
                                    onChange={(e) => setCompetition({ ...competition, ageAtDate: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">This date determines the swimmer's age for this competition.</p>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Course</label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={competition.course || 'LCM'}
                                    onChange={(e) => setCompetition({ ...competition, course: e.target.value as 'SCM' | 'LCM' })}
                                >
                                    <option value="LCM">Long Course (50m)</option>
                                    <option value="SCM">Short Course (25m)</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Race Requirements</label>
                                <textarea
                                    className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Enter qualification requirements, notes, or important details..."
                                    value={competition.requirements || ''}
                                    onChange={(e) => setCompetition({ ...competition, requirements: e.target.value })}
                                />
                            </div>
                            <Button type="submit"><Save className="mr-2 h-4 w-4" /> Save Details</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'standards' && (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle>Qualifying Times</CardTitle>
                            <div className="flex items-center gap-2">
                                <label htmlFor="csv-upload">
                                    <Button variant="outline" size="sm" className="cursor-pointer" type="button" onClick={() => document.getElementById('csv-upload')?.click()}>
                                        Import CSV
                                    </Button>
                                </label>
                                <input
                                    id="csv-upload"
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center rounded-md border p-1">
                                    <button
                                        className={`px-3 py-1 text-sm rounded-sm transition-colors ${selectedSex === 'M' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => setSelectedSex('M')}
                                    >
                                        Male
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-sm rounded-sm transition-colors ${selectedSex === 'F' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => setSelectedSex('F')}
                                    >
                                        Female
                                    </button>
                                </div>
                                <select
                                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={selectedAgeGroup}
                                    onChange={(e) => setSelectedAgeGroup(e.target.value)}
                                >
                                    {ageGroups.map(age => (
                                        <option key={age} value={age}>Age {age}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="p-3 text-left font-medium">Event</th>
                                        <th className="p-3 text-right font-medium">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((event) => {
                                        const timeMs = competition.standards[selectedSex]?.[selectedAgeGroup]?.[event.key];
                                        const isEditing = editingCell === event.key;

                                        return (
                                            <tr key={event.key} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                                <td className="p-3 font-medium">{event.label}</td>
                                                <td
                                                    className="p-3 text-right cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                                    onClick={() => handleCellClick(event.key, timeMs)}
                                                >
                                                    {isEditing ? (
                                                        <input
                                                            autoFocus
                                                            className="w-24 text-right bg-transparent border-b border-primary focus:outline-none"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onKeyDown={(e) => handleKeyDown(e, event.key)}
                                                            onBlur={() => setEditingCell(null)}
                                                        />
                                                    ) : (
                                                        timeMs ? formatTime(timeMs) : <span className="text-muted-foreground italic">--:--.--</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">Click on a time to edit. Press Enter to save.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
