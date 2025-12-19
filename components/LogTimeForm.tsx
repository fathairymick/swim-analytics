"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSwimData } from "@/lib/hooks";
import { parseTime, formatTime } from "@/lib/utils";
import { Stroke, Distance, Course } from "@/lib/types";

interface LogTimeFormProps {
    editId?: string | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function LogTimeForm({ editId, onSuccess, onCancel }: LogTimeFormProps) {
    const { addTime, updateTime, swimmer } = useSwimData();

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        stroke: 'Freestyle' as Stroke,
        distance: 50 as Distance,
        course: 'SCM' as Course,
        timeString: '',
        meetName: '',
        isOfficial: false,
        notes: ''
    });

    const [message, setMessage] = useState('');

    // Load data if editing
    useEffect(() => {
        if (editId && swimmer) {
            const timeToEdit = swimmer.times.find(t => t.id === editId);
            if (timeToEdit) {
                setFormData({
                    date: timeToEdit.date,
                    stroke: timeToEdit.event.stroke,
                    distance: timeToEdit.event.distance,
                    course: timeToEdit.event.course,
                    timeString: timeToEdit.formattedTime,
                    meetName: timeToEdit.meetName || '',
                    isOfficial: timeToEdit.isOfficial,
                    notes: timeToEdit.notes || ''
                });
            }
        } else if (!editId) {
            // Reset to defaults if not editing (or switching from edit to add)
            setFormData(prev => ({
                ...prev,
                timeString: '',
                meetName: '',
                isOfficial: false,
                notes: ''
                // Keep date/stroke/distance/course as they might be useful defaults
            }));
        }
    }, [editId, swimmer]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const timeMs = parseTime(formData.timeString);
        const newTime = {
            id: editId || Date.now().toString(),
            date: formData.date,
            timeMs,
            formattedTime: formatTime(timeMs),
            event: {
                stroke: formData.stroke,
                distance: Number(formData.distance) as Distance,
                course: formData.course
            },
            meetName: formData.meetName,
            isOfficial: formData.isOfficial,
            notes: formData.notes
        };

        if (editId) {
            updateTime(newTime);
            onSuccess(); // Close form on update
        } else {
            addTime(newTime);
            setMessage('Time saved! Add another?');

            // Reset only specific fields to allow rapid entry
            setFormData(prev => ({
                ...prev,
                timeString: '',
                notes: ''
                // Date, Stroke, Distance, Course, MeetName, isOfficial are RETAINED
            }));

            // Clear message after 3 seconds
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <Card className="border-2 border-primary/20">
            <CardHeader>
                <CardTitle>{editId ? 'Edit Time' : 'Log New Time'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <Input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Time (MM:SS.HH or SS.HH)</label>
                            <Input
                                type="text"
                                placeholder="e.g. 1:02.45"
                                required
                                value={formData.timeString}
                                onChange={(e) => setFormData({ ...formData, timeString: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Stroke</label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={formData.stroke}
                                onChange={(e) => setFormData({ ...formData, stroke: e.target.value as Stroke })}
                            >
                                <option value="Freestyle">Freestyle</option>
                                <option value="Backstroke">Backstroke</option>
                                <option value="Breaststroke">Breaststroke</option>
                                <option value="Butterfly">Butterfly</option>
                                <option value="Individual Medley">Individual Medley</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Distance</label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={formData.distance}
                                onChange={(e) => setFormData({ ...formData, distance: Number(e.target.value) as Distance })}
                            >
                                <option value="25">25m</option>
                                <option value="50">50m</option>
                                <option value="100">100m</option>
                                <option value="200">200m</option>
                                <option value="400">400m</option>
                                <option value="800">800m</option>
                                <option value="1500">1500m</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Course</label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={formData.course}
                                onChange={(e) => setFormData({ ...formData, course: e.target.value as Course })}
                            >
                                <option value="SCM">Short Course (25m)</option>
                                <option value="LCM">Long Course (50m)</option>

                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Meet / Event Name</label>
                        <Input
                            placeholder="Optional"
                            value={formData.meetName}
                            onChange={(e) => setFormData({ ...formData, meetName: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="official"
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            checked={formData.isOfficial}
                            onChange={(e) => setFormData({ ...formData, isOfficial: e.target.checked })}
                        />
                        <label htmlFor="official" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Official Time
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Notes</label>
                        <Input
                            placeholder="How did it feel?"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    {message && (
                        <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">
                            {message}
                        </div>
                    )}

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button type="submit">{editId ? 'Update Time' : 'Save Time'}</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
