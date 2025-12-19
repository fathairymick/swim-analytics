"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSwimData } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { Competition } from "@/lib/types";
import { DEFAULT_QT_DB } from "@/lib/defaults";

export default function CompetitionsPage() {
    const { competitions, addCompetition, deleteCompetition } = useSwimData();
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [newComp, setNewComp] = useState({ name: '', startDate: '', endDate: '', ageAtDate: '' });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const competition: Competition = {
            id: crypto.randomUUID(),
            name: newComp.name,
            qualifyingPeriod: {
                start: newComp.startDate,
                end: newComp.endDate
            },
            ageAtDate: newComp.ageAtDate,
            // Initialize with default Essex times as a baseline
            standards: DEFAULT_QT_DB.County.times
        };
        addCompetition(competition);
        setIsCreating(false);
        setNewComp({ name: '', startDate: '', endDate: '', ageAtDate: '' });
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this competition?')) {
            deleteCompetition(id);
        }
    };


    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Competitions</h1>
                    <p className="text-muted-foreground">Manage competitions and specific qualifying times.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsCreating(true)}><Plus className="mr-2 h-4 w-4" /> New Competition</Button>
                </div>
            </div>

            {isCreating && (
                <Card className="border-primary">
                    <CardHeader>
                        <CardTitle>Create New Competition</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Competition Name</label>
                                <input
                                    required
                                    type="text"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={newComp.name}
                                    onChange={(e) => setNewComp({ ...newComp, name: e.target.value })}
                                    placeholder="e.g. Summer Nationals 2026"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Qualifying Start Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={newComp.startDate}
                                        onChange={(e) => setNewComp({ ...newComp, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Qualifying End Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        value={newComp.endDate}
                                        onChange={(e) => setNewComp({ ...newComp, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Age At Date</label>
                                <input
                                    required
                                    type="date"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={newComp.ageAtDate}
                                    onChange={(e) => setNewComp({ ...newComp, ageAtDate: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">Date used to calculate swimmer's age.</p>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                                <Button type="submit">Create</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {competitions.length === 0 && !isCreating && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No competitions created yet.
                    </div>
                )}
                {competitions.map((comp) => (
                    <Card key={comp.id} className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => router.push(`/competitions/${comp.id}`)}>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-semibold">{comp.name}</CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(comp.id); }}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm text-muted-foreground mb-2">
                                <Calendar className="mr-2 h-4 w-4" />
                                <span className="text-xs">
                                    {comp.qualifyingPeriod ? (
                                        `${new Date(comp.qualifyingPeriod.start).toLocaleDateString()} - ${new Date(comp.qualifyingPeriod.end).toLocaleDateString()}`
                                    ) : (
                                        "No dates set"
                                    )}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Age calculated at: {new Date(comp.ageAtDate).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
