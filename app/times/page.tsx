"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSwimData } from "@/lib/hooks";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { LogTimeForm } from "@/components/LogTimeForm";

export default function TimesPage() {
    const { swimmer, deleteTime, mergeTimes, overwriteTimes } = useSwimData();

    const [selectedStroke, setSelectedStroke] = useState<string>('All');
    const [selectedDistance, setSelectedDistance] = useState<string>('All');
    const [selectedMeet, setSelectedMeet] = useState<string>('All');
    const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [importMessage, setImportMessage] = useState('');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleImport = async (mode: 'full' | 'update') => {
        if (!swimmer?.memberNumber) {
            setImportStatus('error');
            setImportMessage("Please add your Swim England Number in Profile first.");
            return;
        }

        setImportStatus('loading');
        setImportMessage('Fetching times from Swim England...');

        try {
            const res = await fetch(`/api/import-times?memberNumber=${swimmer.memberNumber}`);
            const data = await res.json();

            if (res.ok) {
                if (mode === 'full') {
                    const addedCount = overwriteTimes(data.times);
                    setImportStatus('success');
                    setImportMessage(`Successfully imported ${addedCount} times (overwriting existing matches based on date/stroke/distance)!`);
                } else {
                    const addedCount = mergeTimes(data.times);
                    setImportStatus('success');
                    setImportMessage(addedCount > 0 ? `Successfully added ${addedCount} new times!` : 'No new times found.');
                }
            } else {
                setImportStatus('error');
                setImportMessage(data.error || 'Failed to import times.');
            }
        } catch {
            setImportStatus('error');
            setImportMessage('An error occurred during import.');
        }
    };

    if (!swimmer) return <div className="p-8">Loading...</div>;

    // Get unique options
    const strokes = Array.from(new Set(swimmer.times.map(t => t.event.stroke))).sort();
    const distances = Array.from(new Set(swimmer.times.map(t => t.event.distance))).sort((a, b) => a - b);
    const meets = Array.from(new Set(swimmer.times.map(t => t.meetName || 'Unknown'))).sort();

    // Filter times
    const filteredTimes = swimmer.times.filter(time => {
        const matchStroke = selectedStroke === 'All' || time.event.stroke === selectedStroke;
        const matchDistance = selectedDistance === 'All' || time.event.distance.toString() === selectedDistance;
        const matchMeet = selectedMeet === 'All' || (time.meetName || 'Unknown') === selectedMeet;
        return matchStroke && matchDistance && matchMeet;
    });

    const sortedTimes = [...filteredTimes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this time?')) {
            deleteTime(id);
        }
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setIsFormOpen(true);
        setIsImportOpen(false);
        // Scroll to top to see form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
    };

    const toggleLogTime = () => {
        if (!isFormOpen) {
            setIsImportOpen(false);
        }
        setIsFormOpen(!isFormOpen);
        setEditingId(null);
    };

    const toggleImport = () => {
        if (!isImportOpen) {
            setIsFormOpen(false);
            setEditingId(null);
        }
        setIsImportOpen(!isImportOpen);
    };

    const clearFilters = () => {
        setSelectedStroke('All');
        setSelectedDistance('All');
        setSelectedMeet('All');
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Times</h1>
                    <p className="text-muted-foreground">Manage your recorded times.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={toggleImport}>
                        {isImportOpen ? <><X className="mr-2 h-4 w-4" /> Close Import</> : <><Plus className="mr-2 h-4 w-4" /> Import Times</>}
                    </Button>
                    <Button onClick={toggleLogTime}>
                        {isFormOpen ? <><X className="mr-2 h-4 w-4" /> Close Form</> : <><Plus className="mr-2 h-4 w-4" /> Log Time</>}
                    </Button>
                </div>
            </div>

            {isFormOpen && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <LogTimeForm
                        editId={editingId}
                        onSuccess={() => { if (editingId) closeForm(); }} // Close on edit success, keep open on add
                        onCancel={closeForm}
                    />
                </div>
            )}

            {isImportOpen && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle>Import Times</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => handleImport('full')} disabled={importStatus === 'loading'}>
                                        {importStatus === 'loading' ? 'Importing...' : 'Full Import (Replace)'}
                                    </Button>
                                    <Button onClick={() => handleImport('update')} disabled={importStatus === 'loading'}>
                                        {importStatus === 'loading' ? 'Updating...' : 'Update (Add New Only)'}
                                    </Button>
                                </div>
                                {importMessage && (
                                    <p className={`text-sm ${importStatus === 'error' ? 'text-destructive' : 'text-green-600'}`}>
                                        {importMessage}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    &quot;Full Import&quot; will add all times found, and DELETE any existing times that match the same Date, Stroke, and Distance. &quot;Update&quot; will only add times that don&#39;t already exist.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Filter Times</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Stroke</label>
                            <select
                                className="flex h-9 w-full min-w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={selectedStroke}
                                onChange={(e) => setSelectedStroke(e.target.value)}
                            >
                                <option value="All">All Strokes</option>
                                {strokes.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Distance</label>
                            <select
                                className="flex h-9 w-full min-w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={selectedDistance}
                                onChange={(e) => setSelectedDistance(e.target.value)}
                            >
                                <option value="All">All Distances</option>
                                {distances.map(d => <option key={d} value={d}>{d}m</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Meet</label>
                            <select
                                className="flex h-9 w-full min-w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={selectedMeet}
                                onChange={(e) => setSelectedMeet(e.target.value)}
                            >
                                <option value="All">All Meets</option>
                                {meets.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <Button variant="outline" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Results ({sortedTimes.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {sortedTimes.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No times found matching your filters.</p>
                        ) : (
                            sortedTimes.map((time) => (
                                <div key={time.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="font-medium">{time.event.distance}m {time.event.stroke}</p>
                                            <p className="text-sm text-muted-foreground">{time.date} • {time.event.course} • {time.formattedTime}</p>
                                            {time.meetName && <p className="text-xs text-muted-foreground">{time.meetName}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(time.id)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(time.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
