"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSwimData } from "@/lib/hooks";
import { formatTime, getQualifyingTime, calculateAge, getAgeGroup, convertTime } from "@/lib/utils";
import { ArrowUpRight, Timer, Trophy, Medal, AlertCircle } from "lucide-react";
import { SwimTime } from "@/lib/types";

export default function Home() {
  const { swimmer, standards, competitions } = useSwimData();

  const enteredCompetitions = useMemo(() => {
    if (!swimmer || !swimmer.enteredCompetitions) return [];
    return competitions.filter(c => swimmer.enteredCompetitions?.includes(c.id));
  }, [swimmer, competitions]);

  const personalBests = useMemo(() => {
    if (!swimmer) return [];
    const bests: Record<string, SwimTime> = {};

    swimmer.times.forEach(time => {
      const key = `${time.event.stroke}-${time.event.distance}`;
      // Normalize to SCM for comparison to find the "true" best time
      const normalizedTimeMs = convertTime(time.timeMs, time.event.course, 'SCM');

      if (!bests[key]) {
        bests[key] = time;
      } else {
        const currentBestNormalized = convertTime(bests[key].timeMs, bests[key].event.course, 'SCM');
        if (normalizedTimeMs < currentBestNormalized) {
          bests[key] = time;
        }
      }
    });

    const strokeOrder: Record<string, number> = { 'Freestyle': 1, 'Backstroke': 2, 'Breaststroke': 3, 'Butterfly': 4, 'Individual Medley': 5 };

    return Object.values(bests).sort((a, b) => {
      const sA = strokeOrder[a.event.stroke] || 99;
      const sB = strokeOrder[b.event.stroke] || 99;
      if (sA !== sB) return sA - sB;
      return a.event.distance - b.event.distance;
    });
  }, [swimmer]);

  if (!swimmer) return <div className="p-8">Loading...</div>;

  const recentTimes = [...swimmer.times].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {swimmer.name}. Here is your recent activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Swims</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{swimmer.times.length}</div>
            <p className="text-xs text-muted-foreground">Recorded sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Best</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentTimes[0]?.formattedTime || '--'}</div>
            <p className="text-xs text-muted-foreground">
              {recentTimes[0] ? `${recentTimes[0].event.stroke} ${recentTimes[0].event.distance}m` : 'No recent swims'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-500" />
            Target Races
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Races within {swimmer.targetPercentage || 5}% of qualifying.
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Event</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Competition</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Best Time</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Qualifying Time</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Gap</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {(() => {
                  const targetRaces: any[] = [];
                  const targetPct = swimmer.targetPercentage || 5;

                  enteredCompetitions.forEach(comp => {
                    if (!swimmer.dateOfBirth || !comp.ageAtDate) return;
                    const age = calculateAge(swimmer.dateOfBirth, comp.ageAtDate);
                    const ageGroup = getAgeGroup(age);
                    const compCourse = comp.course || 'LCM'; // Default to LCM if not specified

                    // Iterate over all possible events in standards
                    const compStandards = comp.standards[swimmer.sex]?.[ageGroup];
                    if (!compStandards) return;

                    Object.entries(compStandards).forEach(([eventKey, qt]) => {
                      // Parse event key (e.g., 'Freestyle50')
                      let stroke = '';
                      let distance = 0;

                      const strokes = ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'Individual Medley'];
                      for (const s of strokes) {
                        if (eventKey.startsWith(s)) {
                          stroke = s;
                          distance = parseInt(eventKey.replace(s, ''));
                          break;
                        }
                      }

                      if (!stroke || !distance) return;

                      // Find best eligible time
                      let bestEligibleTime: number | null = null;
                      let bestTimeCourse: any = 'LCM';

                      if (comp.qualifyingPeriod) {
                        const start = new Date(comp.qualifyingPeriod.start).getTime();
                        const end = new Date(comp.qualifyingPeriod.end).getTime();

                        const eventTimes = swimmer.times.filter(t =>
                          t.event.stroke === stroke &&
                          t.event.distance === distance
                        );

                        const eligibleTimes = eventTimes.filter(t => {
                          const tDate = new Date(t.date).getTime();
                          return tDate >= start && tDate <= end;
                        });

                        if (eligibleTimes.length > 0) {
                          // Find best time by normalizing to SCM first
                          let bestTimeObj = eligibleTimes[0];
                          let bestTimeNormalized = convertTime(bestTimeObj.timeMs, bestTimeObj.event.course, 'SCM');

                          for (let i = 1; i < eligibleTimes.length; i++) {
                            const t = eligibleTimes[i];
                            const tNormalized = convertTime(t.timeMs, t.event.course, 'SCM');
                            if (tNormalized < bestTimeNormalized) {
                              bestTimeNormalized = tNormalized;
                              bestTimeObj = t;
                            }
                          }
                          bestEligibleTime = bestTimeObj.timeMs;
                          bestTimeCourse = bestTimeObj.event.course;
                        }
                      }

                      if (bestEligibleTime) {
                        // Convert best time to competition course for comparison
                        const convertedTime = convertTime(bestEligibleTime, bestTimeCourse, compCourse);
                        const isConverted = bestTimeCourse !== compCourse;

                        if (convertedTime > qt) {
                          const diff = convertedTime - qt;
                          const pct = (diff / convertedTime) * 100;

                          if (pct <= targetPct) {
                            targetRaces.push({
                              id: `${comp.id}-${eventKey}`,
                              compName: comp.name,
                              event: `${distance}m ${stroke}`,
                              bestTime: convertedTime,
                              isConverted: isConverted,
                              qt: qt,
                              diff: diff,
                              pct: pct
                            });
                          }
                        }
                      }
                    });
                  });

                  // Sort by percentage (lowest first)
                  targetRaces.sort((a, b) => a.pct - b.pct);

                  if (targetRaces.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">No target races found within {targetPct}%.</td>
                      </tr>
                    );
                  }

                  return targetRaces.map(race => (
                    <tr key={race.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle font-medium">{race.event}</td>
                      <td className="p-4 align-middle">{race.compName}</td>
                      <td className="p-4 align-middle font-bold">
                        {formatTime(race.bestTime)}
                        {race.isConverted && <span className="text-xs text-muted-foreground ml-1">C</span>}
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">{formatTime(race.qt)}</td>
                      <td className="p-4 align-middle text-muted-foreground">
                        +{formatTime(race.diff)} ({race.pct.toFixed(1)}%)
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Missing Times
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Races for selected competitions with no recorded time or no time within the qualifying period.
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Event</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Competition</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Best Time</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Gap</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {(() => {
                  const missingRaces: any[] = [];

                  enteredCompetitions.forEach(comp => {
                    if (!swimmer.dateOfBirth || !comp.ageAtDate) return;
                    const age = calculateAge(swimmer.dateOfBirth, comp.ageAtDate);
                    const ageGroup = getAgeGroup(age);

                    // Iterate over all possible events in standards
                    const compStandards = comp.standards[swimmer.sex]?.[ageGroup];
                    if (!compStandards) return;

                    Object.entries(compStandards).forEach(([eventKey, qt]) => {
                      // Parse event key (e.g., 'Freestyle50')
                      let stroke = '';
                      let distance = 0;

                      const strokes = ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'Individual Medley'];
                      for (const s of strokes) {
                        if (eventKey.startsWith(s)) {
                          stroke = s;
                          distance = parseInt(eventKey.replace(s, ''));
                          break;
                        }
                      }

                      if (!stroke || !distance) return;

                      // Check for times
                      const eventTimes = swimmer.times.filter(t =>
                        t.event.stroke === stroke &&
                        t.event.distance === distance
                      );

                      if (eventTimes.length === 0) {
                        missingRaces.push({
                          id: `${comp.id}-${eventKey}-missing`,
                          compName: comp.name,
                          event: `${distance}m ${stroke}`,
                          bestTime: 'No Time',
                          gap: '-',
                          date: '-'
                        });
                      } else if (comp.qualifyingPeriod) {
                        const start = new Date(comp.qualifyingPeriod.start).getTime();
                        const end = new Date(comp.qualifyingPeriod.end).getTime();

                        const eligibleTimes = eventTimes.filter(t => {
                          const tDate = new Date(t.date).getTime();
                          return tDate >= start && tDate <= end;
                        });

                        if (eligibleTimes.length === 0) {
                          // Find absolute best time regardless of date
                          let bestTimeObj = eventTimes[0];
                          let bestTimeNormalized = convertTime(bestTimeObj.timeMs, bestTimeObj.event.course, 'SCM');

                          for (let i = 1; i < eventTimes.length; i++) {
                            const t = eventTimes[i];
                            const tNormalized = convertTime(t.timeMs, t.event.course, 'SCM');
                            if (tNormalized < bestTimeNormalized) {
                              bestTimeNormalized = tNormalized;
                              bestTimeObj = t;
                            }
                          }

                          // Calculate gap
                          const compCourse = comp.course || 'LCM';
                          const convertedTime = convertTime(bestTimeObj.timeMs, bestTimeObj.event.course, compCourse);
                          const diff = convertedTime - qt;
                          const pct = (diff / convertedTime) * 100;
                          const isConverted = bestTimeObj.event.course !== compCourse;

                          missingRaces.push({
                            id: `${comp.id}-${eventKey}-expired`,
                            compName: comp.name,
                            event: `${distance}m ${stroke}`,
                            bestTime: formatTime(convertedTime) + (isConverted ? ' C' : ''),
                            gap: diff > 0 ? `+${formatTime(diff)} (${pct.toFixed(1)}%)` : 'Qualified',
                            date: bestTimeObj.date
                          });
                        }
                      }
                    });
                  });

                  if (missingRaces.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">No missing times found.</td>
                      </tr>
                    );
                  }

                  return missingRaces.map(race => (
                    <tr key={race.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle font-medium">{race.event}</td>
                      <td className="p-4 align-middle">{race.compName}</td>
                      <td className="p-4 align-middle font-bold">{race.bestTime}</td>
                      <td className="p-4 align-middle text-muted-foreground">{race.gap}</td>
                      <td className="p-4 align-middle text-muted-foreground text-xs">{race.date}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-yellow-500" />
            Personal Bests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Event</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Time</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Course</th>
                  {enteredCompetitions.map(comp => (
                    <th key={comp.id} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      {comp.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {personalBests.length > 0 ? (
                  personalBests.map((pb) => {
                    return (
                      <tr key={pb.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle font-medium">{pb.event.distance}m {pb.event.stroke}</td>
                        <td className="p-4 align-middle font-bold">{pb.formattedTime}</td>
                        <td className="p-4 align-middle text-muted-foreground">{pb.event.course}</td>

                        {enteredCompetitions.map(comp => {
                          // 1. Calculate QT for this competition
                          let qt: number | null = null;
                          const compCourse = comp.course || 'LCM';

                          if (swimmer.dateOfBirth && comp.ageAtDate) {
                            const age = calculateAge(swimmer.dateOfBirth, comp.ageAtDate);
                            const ageGroup = getAgeGroup(age);
                            qt = comp.standards[swimmer.sex]?.[ageGroup]?.[`${pb.event.stroke}${pb.event.distance}`] || null;
                          }

                          // 2. Find best time WITHIN qualifying period
                          let bestEligibleTime: number | null = null;
                          let bestTimeCourse: any = 'LCM';

                          if (comp.qualifyingPeriod) {
                            const start = new Date(comp.qualifyingPeriod.start).getTime();
                            const end = new Date(comp.qualifyingPeriod.end).getTime();

                            // Check all times for this event
                            const eventTimes = swimmer.times.filter(t =>
                              t.event.stroke === pb.event.stroke &&
                              t.event.distance === pb.event.distance
                            );

                            const eligibleTimes = eventTimes.filter(t => {
                              const tDate = new Date(t.date).getTime();
                              return tDate >= start && tDate <= end;
                            });

                            if (eligibleTimes.length > 0) {
                              // Find best time by normalizing to SCM first
                              let bestTimeObj = eligibleTimes[0];
                              let bestTimeNormalized = convertTime(bestTimeObj.timeMs, bestTimeObj.event.course, 'SCM');

                              for (let i = 1; i < eligibleTimes.length; i++) {
                                const t = eligibleTimes[i];
                                const tNormalized = convertTime(t.timeMs, t.event.course, 'SCM');
                                if (tNormalized < bestTimeNormalized) {
                                  bestTimeNormalized = tNormalized;
                                  bestTimeObj = t;
                                }
                              }
                              bestEligibleTime = bestTimeObj.timeMs;
                              bestTimeCourse = bestTimeObj.event.course;
                            }
                          }

                          // 3. Determine status
                          let content = <span className="text-muted-foreground text-xs">N/A</span>;

                          if (qt) {
                            if (bestEligibleTime) {
                              // Convert to competition course for comparison
                              const convertedTime = convertTime(bestEligibleTime, bestTimeCourse, compCourse);

                              if (convertedTime <= qt) {
                                content = (
                                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-500 text-white shadow hover:bg-green-600">
                                    Qualified
                                  </span>
                                );
                              } else {
                                content = (
                                  <span className="text-muted-foreground text-xs">
                                    +{formatTime(convertedTime - qt)} ({((convertedTime - qt) / convertedTime * 100).toFixed(1)}%)
                                  </span>
                                );
                              }
                            } else {
                              // Has QT but no eligible time
                              content = <span className="text-muted-foreground text-xs">No Time</span>;
                            }
                          } else {
                            // No QT for this event/age
                            content = <span className="text-muted-foreground text-xs">-</span>;
                          }

                          return (
                            <td key={comp.id} className="p-4 align-middle">
                              {content}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3 + enteredCompetitions.length} className="p-4 text-center text-muted-foreground">No times recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTimes.map((time) => (
              <div key={time.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Timer className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{time.event.distance}m {time.event.stroke}</p>
                    <p className="text-sm text-muted-foreground">{time.date} • {time.event.course}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{time.formattedTime}</p>
                  <p className="text-xs text-muted-foreground">{time.isOfficial ? 'Official' : 'Training'}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
