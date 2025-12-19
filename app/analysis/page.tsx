"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSwimData } from "@/lib/hooks";
import { getQualifyingTime, calculateAge, getAgeGroup, convertTime, formatTime } from "@/lib/utils";
import { Stroke, Distance, Course } from "@/lib/types";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Legend,
    ScatterChart,
    Scatter,
    ZAxis,
    Cell,
    BarChart,
    Bar
} from "recharts";

export default function AnalysisPage() {
    const { swimmer, standards, competitions } = useSwimData();
    const [selectedStroke, setSelectedStroke] = useState<Stroke>('Freestyle');
    const [selectedDistance, setSelectedDistance] = useState<Distance>(50);
    const [selectedCourse, setSelectedCourse] = useState<Course>('SCM');
    const [selectedStandardId, setSelectedStandardId] = useState<string>('default');
    const [useLinearAxis, setUseLinearAxis] = useState<boolean>(false);
    const [useLogScale, setUseLogScale] = useState<boolean>(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load settings from localStorage
    useEffect(() => {
        if (swimmer?.id) {
            const savedSettings = localStorage.getItem(`swim_analytics_settings_${swimmer.id}`);
            if (savedSettings) {
                try {
                    const settings = JSON.parse(savedSettings);
                    if (settings.selectedStroke) setSelectedStroke(settings.selectedStroke);
                    if (settings.selectedDistance) setSelectedDistance(settings.selectedDistance);
                    if (settings.selectedCourse) setSelectedCourse(settings.selectedCourse);
                    if (settings.useLinearAxis !== undefined) setUseLinearAxis(settings.useLinearAxis);
                    if (settings.useLogScale !== undefined) setUseLogScale(settings.useLogScale);
                } catch (e) {
                    console.error("Failed to parse saved settings", e);
                }
            }
            setIsLoaded(true);
        }
    }, [swimmer?.id]);

    // Save settings to localStorage
    useEffect(() => {
        if (swimmer?.id && isLoaded) {
            const settings = {
                selectedStroke,
                selectedDistance,
                selectedCourse,
                useLinearAxis,
                useLogScale
            };
            localStorage.setItem(`swim_analytics_settings_${swimmer.id}`, JSON.stringify(settings));
        }
    }, [swimmer?.id, selectedStroke, selectedDistance, selectedCourse, useLinearAxis, useLogScale, isLoaded]);

    const chartData = useMemo(() => {
        if (!swimmer) return [];

        let filteredTimes = swimmer.times.filter(t =>
            t.event.stroke === selectedStroke &&
            t.event.distance === selectedDistance
        );

        // Filter by qualifying period if a competition is selected
        if (selectedStandardId !== 'default') {
            const comp = competitions.find(c => c.id === selectedStandardId);
            if (comp && comp.qualifyingPeriod) {
                const start = new Date(comp.qualifyingPeriod.start).getTime();
                const end = new Date(comp.qualifyingPeriod.end).getTime();
                filteredTimes = filteredTimes.filter(t => {
                    const timeDate = new Date(t.date).getTime();
                    return timeDate >= start && timeDate <= end;
                });
            }
        }

        // Convert all times to the selected course for comparison
        const normalizedTimes = filteredTimes.map(t => ({
            ...t,
            normalizedTime: convertTime(t.timeMs, t.event.course, selectedCourse),
            displayDate: new Date(t.date).toLocaleDateString(),
            timestamp: new Date(t.date).getTime(),
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return normalizedTimes;
    }, [swimmer, selectedStroke, selectedDistance, selectedCourse, selectedStandardId, competitions]);

    const scatterData = useMemo(() => {
        if (!swimmer) return [];

        // Filter by stroke only
        let filteredTimes = swimmer.times.filter(t => t.event.stroke === selectedStroke);

        // Filter by qualifying period if a competition is selected
        if (selectedStandardId !== 'default') {
            const comp = competitions.find(c => c.id === selectedStandardId);
            if (comp && comp.qualifyingPeriod) {
                const start = new Date(comp.qualifyingPeriod.start).getTime();
                const end = new Date(comp.qualifyingPeriod.end).getTime();
                filteredTimes = filteredTimes.filter(t => {
                    const timeDate = new Date(t.date).getTime();
                    return timeDate >= start && timeDate <= end;
                });
            }
        }

        // Group by distance to find best times
        const bestTimesByDistance = new Map<number, number>();
        filteredTimes.forEach(t => {
            const dist = t.event.distance;
            const time = convertTime(t.timeMs, t.event.course, selectedCourse);
            if (!bestTimesByDistance.has(dist) || time < bestTimesByDistance.get(dist)!) {
                bestTimesByDistance.set(dist, time);
            }
        });

        // Normalize times to selected course
        return filteredTimes.map(t => {
            const timeMs = convertTime(t.timeMs, t.event.course, selectedCourse);
            const pace25m = timeMs / (t.event.distance / 25);
            return {
                distance: t.event.distance,
                time: timeMs,
                pace25m: pace25m,
                formattedTime: formatTime(timeMs),
                formattedPace: formatTime(pace25m),
                originalTime: t.formattedTime,
                course: t.event.course,
                date: t.date,
                meetName: t.meetName,
                isBest: timeMs === bestTimesByDistance.get(t.event.distance)
            };
        });
    }, [swimmer, selectedStroke, selectedCourse, selectedStandardId, competitions]);

    const bestTime = useMemo(() => {
        if (chartData.length === 0) return null;
        return Math.min(...chartData.map(d => d.normalizedTime));
    }, [chartData]);

    const targetStandards = useMemo(() => {
        if (!swimmer) return [];

        const enteredCompIds = swimmer.enteredCompetitions || [];
        const targets: { name: string; time: number; color: string }[] = [];
        const colors = ['#ff7300', '#387908', '#8884d8', '#ff0000', '#00ff00'];

        const getConvertedTime = (comp: any, timeMs: number) => {
            const compCourse = comp.course || 'LCM'; // Default to LCM if not specified
            if (compCourse !== selectedCourse) {
                return convertTime(timeMs, compCourse, selectedCourse);
            }
            return timeMs;
        };

        if (selectedStandardId === 'default') {
            // Show all entered competitions
            enteredCompIds.forEach((id, index) => {
                const comp = competitions.find(c => c.id === id);
                if (comp && comp.ageAtDate && swimmer.dateOfBirth) {
                    const age = calculateAge(swimmer.dateOfBirth, comp.ageAtDate);
                    const ageGroup = getAgeGroup(age);
                    const timeMs = comp.standards[swimmer.sex]?.[ageGroup]?.[`${selectedStroke}${selectedDistance}`];
                    if (timeMs) {
                        targets.push({
                            name: comp.name,
                            time: getConvertedTime(comp, timeMs),
                            color: colors[index % colors.length]
                        });
                    }
                }
            });
        } else {
            // Show specific selected competition
            const comp = competitions.find(c => c.id === selectedStandardId);
            if (comp && comp.ageAtDate && swimmer.dateOfBirth) {
                const age = calculateAge(swimmer.dateOfBirth, comp.ageAtDate);
                const ageGroup = getAgeGroup(age);
                const timeMs = comp.standards[swimmer.sex]?.[ageGroup]?.[`${selectedStroke}${selectedDistance}`];
                if (timeMs) {
                    targets.push({
                        name: comp.name,
                        time: getConvertedTime(comp, timeMs),
                        color: '#ff7300'
                    });
                }
            }
        }
        return targets;
    }, [swimmer, competitions, selectedStandardId, selectedStroke, selectedDistance, selectedCourse]);

    if (!swimmer) return <div>Loading...</div>;

    const stalenessData = useMemo(() => {
        if (!swimmer) return [];

        const now = new Date().getTime();
        const oneWeekMs = 1000 * 60 * 60 * 24 * 7;

        // Group times by event (Stroke + Distance)
        const eventsMap = new Map<string, typeof swimmer.times>();
        swimmer.times.forEach(t => {
            const key = `${t.event.distance}m ${t.event.stroke}`;
            if (!eventsMap.has(key)) {
                eventsMap.set(key, []);
            }
            eventsMap.get(key)!.push(t);
        });

        const data = Array.from(eventsMap.entries()).map(([eventName, times]) => {
            // Normalize times to selected course to find the PB
            const normalizedTimes = times.map(t => ({
                ...t,
                normalizedTime: convertTime(t.timeMs, t.event.course, selectedCourse)
            }));

            // Find the absolute fastest time (PB)
            const pbSwim = normalizedTimes.reduce((prev, current) =>
                (prev.normalizedTime < current.normalizedTime) ? prev : current
            );

            // Calculate weeks since PB
            const pbDate = new Date(pbSwim.date).getTime();
            const weeksSincePB = Math.floor((now - pbDate) / oneWeekMs);

            // Find the most recent swim
            const lastSwim = times.reduce((prev, current) =>
                (new Date(prev.date).getTime() > new Date(current.date).getTime()) ? prev : current
            );

            const lastDate = new Date(lastSwim.date).getTime();
            const weeksSinceLast = Math.floor((now - lastDate) / oneWeekMs);

            return {
                eventName, // e.g., "50m Freestyle"
                stroke: pbSwim.event.stroke,
                distance: pbSwim.event.distance,
                weeksSincePB,
                weeksSinceLast: weeksSinceLast !== weeksSincePB ? weeksSinceLast : 0,
                rawWeeksSinceLast: weeksSinceLast,
                isDifferent: weeksSinceLast !== weeksSincePB
            };
        });

        // Sort by longest time since PB (descending)
        return data.sort((a, b) => b.weeksSincePB - a.weeksSincePB);
    }, [swimmer, selectedCourse]);

    if (!swimmer) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analysis</h1>
                <p className="text-muted-foreground">Track your progress over time.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters & Standards</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={selectedStroke}
                            onChange={(e) => setSelectedStroke(e.target.value as Stroke)}
                        >
                            <option value="Freestyle">Freestyle</option>
                            <option value="Backstroke">Backstroke</option>
                            <option value="Breaststroke">Breaststroke</option>
                            <option value="Butterfly">Butterfly</option>
                            <option value="Individual Medley">Individual Medley</option>
                        </select>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={selectedDistance}
                            onChange={(e) => setSelectedDistance(Number(e.target.value) as Distance)}
                        >
                            <option value="25">25m</option>
                            <option value="50">50m</option>
                            <option value="100">100m</option>
                            <option value="200">200m</option>
                            <option value="400">400m</option>
                            <option value="800">800m</option>
                            <option value="1500">1500m</option>
                        </select>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value as Course)}
                        >
                            <option value="SCM">Short Course (25m)</option>
                            <option value="LCM">Long Course (50m)</option>
                        </select>
                        <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={selectedStandardId}
                            onChange={(e) => setSelectedStandardId(e.target.value)}
                        >
                            <option value="default">Default Standards</option>
                            <optgroup label="Competitions">
                                {competitions.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                    <div className="mt-4 flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="linearAxis"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={useLinearAxis}
                                onChange={(e) => setUseLinearAxis(e.target.checked)}
                            />
                            <label htmlFor="linearAxis" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Linear Time Axis (Line Chart)
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="logScale"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={useLogScale}
                                onChange={(e) => setUseLogScale(e.target.checked)}
                            />
                            <label htmlFor="logScale" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Logarithmic Scale (Scatter Graph)
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Best</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {bestTime ? formatTime(bestTime) : '--:--.--'}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Converted to {selectedCourse}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Gap to Target</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {(() => {
                                const targets = targetStandards.map(t => t.time);
                                if (bestTime && targets.length > 0) {
                                    const unmetTargets = targets.filter(t => bestTime > t).sort((a, b) => a - b);

                                    if (unmetTargets.length === 0) {
                                        return <span className="text-green-500">Qualified All!</span>;
                                    }

                                    const nextTarget = unmetTargets[unmetTargets.length - 1];
                                    return `+${formatTime(bestTime - nextTarget)}`;
                                }
                                return '--';
                            })()}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Target: {(() => {
                                if (targetStandards.length === 0) return 'N/A';
                                return targetStandards.map(t => t.name).join(', ');
                            })()}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Pace per Length</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {bestTime ? formatTime(bestTime / (selectedDistance / (selectedCourse === 'LCM' ? 50 : 25))) : '--'}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Average per {selectedCourse === 'LCM' ? '50m' : '25m'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-2">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Time Evolution ({selectedStroke} {selectedDistance}m {selectedCourse})</CardTitle>
                            <span className="text-sm text-muted-foreground">
                                Target: {targetStandards.length > 0 ? targetStandards.map(t => t.name).join(', ') : 'None'}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    {useLinearAxis ? (
                                        <XAxis
                                            dataKey="timestamp"
                                            type="number"
                                            domain={['dataMin', 'dataMax']}
                                            tickFormatter={(val) => new Date(val).toLocaleDateString()}
                                            scale="time"
                                        />
                                    ) : (
                                        <XAxis dataKey="displayDate" />
                                    )}
                                    <YAxis
                                        domain={[
                                            (dataMin: number) => {
                                                const times = [dataMin, ...targetStandards.map(t => t.time)].filter(t => t > 0);
                                                return Math.min(...times) * 0.95;
                                            },
                                            (dataMax: number) => {
                                                const times = [dataMax, ...targetStandards.map(t => t.time)].filter(t => t > 0);
                                                return Math.max(...times) * 1.05;
                                            }
                                        ]}
                                        tickFormatter={(val) => formatTime(val)}
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                        <div className="grid gap-1">
                                                            <div className="font-bold">
                                                                {useLinearAxis && typeof label === 'number' ? new Date(label).toLocaleDateString() : label}
                                                            </div>
                                                            <div>
                                                                Time: {formatTime(data.normalizedTime)}
                                                            </div>
                                                            {data.meetName && (
                                                                <div className="text-xs text-muted-foreground">
                                                                    {data.meetName}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend />
                                    {targetStandards.map((target, i) => (
                                        <ReferenceLine key={i} y={target.time} label={target.name} stroke={target.color} strokeDasharray="3 3" />
                                    ))}

                                    <Line type="monotone" dataKey="normalizedTime" name="My Time" stroke="#8884d8" activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No data available for this event.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Distance vs Pace ({selectedStroke})</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        {scatterData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid />
                                    <XAxis
                                        type="number"
                                        dataKey="pace25m"
                                        name="Pace / 25m"
                                        tickFormatter={(val) => formatTime(val)}
                                        scale={useLogScale ? 'log' : 'auto'}
                                        domain={useLogScale ? ['dataMin', 'dataMax'] : ['auto', 'auto']}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="distance"
                                        name="Distance"
                                        unit="m"
                                        scale={useLogScale ? 'log' : 'auto'}
                                        domain={['dataMin', 'dataMax']}
                                    />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="grid gap-1">
                                                        <div className="font-bold">{data.distance}m {selectedStroke}</div>
                                                        <div>Time: {data.formattedTime}</div>
                                                        <div className="font-medium text-primary">Pace: {data.formattedPace} / 25m</div>
                                                        <div className="text-xs text-muted-foreground">{data.date}</div>
                                                        {data.meetName && <div className="text-xs text-muted-foreground">{data.meetName}</div>}
                                                        {data.isBest && <div className="text-xs font-bold text-red-500">Personal Best</div>}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }} />
                                    <Scatter name="Swims" data={scatterData}>
                                        {scatterData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.isBest ? '#ef4444' : '#8884d8'} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No data available for this stroke.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>PB Staleness by Event</CardTitle>
                        <CardDescription>Weeks elapsed since your Personal Best and Last Swim for each event, sorted by longest time since PB.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[600px]">
                        {stalenessData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stalenessData}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="eventName" type="category" width={150} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                        <div className="grid gap-1">
                                                            <div className="font-bold">{label}</div>
                                                            <div className="text-sm">Since PB: <span className="font-medium">{data.weeksSincePB} weeks</span></div>
                                                            {data.isDifferent && (
                                                                <div className="text-sm">Since Last: <span className="font-medium">{data.rawWeeksSinceLast} weeks</span></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="weeksSincePB" name="Weeks since PB" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                                    <Bar dataKey="weeksSinceLast" name="Weeks since Last Swim" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No data available.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>


        </div>
    );
}
