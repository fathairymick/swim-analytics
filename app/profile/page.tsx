"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSwimData } from "@/lib/hooks";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { swimmer, updateProfile, resetStandards, competitions } = useSwimData();
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        ageGroup: '14',
        sex: 'M' as 'M' | 'F',
        memberNumber: '',
        dateOfBirth: '',
        enteredCompetitions: [] as string[],
        targetPercentage: 5
    });
    useEffect(() => {
        if (swimmer) {
            setFormData({
                name: swimmer.name,
                ageGroup: swimmer.ageGroup,
                sex: swimmer.sex,
                memberNumber: swimmer.memberNumber || '',
                dateOfBirth: swimmer.dateOfBirth || '',
                enteredCompetitions: swimmer.enteredCompetitions || [],
                targetPercentage: swimmer.targetPercentage || 5
            });
        }
    }, [swimmer]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile(formData.name, formData.ageGroup, formData.sex, formData.memberNumber, formData.dateOfBirth, formData.enteredCompetitions, formData.targetPercentage);
        alert('Profile updated!');
    };

    const handleResetStandards = () => {
        if (confirm('Are you sure you want to reset all qualifying times to the default Essex 2026 standards? This cannot be undone.')) {
            resetStandards();
            alert('Standards reset to defaults.');
        }
    };

    if (!swimmer) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground">Manage your profile and application preferences.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Swimmer Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <label htmlFor="name" className="text-sm font-medium">Name</label>
                            <input
                                id="name"
                                type="text"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="dob" className="text-sm font-medium">Date of Birth</label>
                            <input
                                id="dob"
                                type="date"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Used to calculate age for competitions.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Swim England Number</label>
                                <input
                                    type="text"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={formData.memberNumber}
                                    onChange={(e) => setFormData({ ...formData, memberNumber: e.target.value })}
                                    placeholder="e.g. 123456"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Sex</label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={formData.sex}
                                    onChange={(e) => setFormData({ ...formData, sex: e.target.value as 'M' | 'F' })}
                                >
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Target Percentage (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={formData.targetPercentage}
                                    onChange={(e) => setFormData({ ...formData, targetPercentage: parseFloat(e.target.value) })}
                                />
                                <p className="text-xs text-muted-foreground">Show races within this % of qualifying.</p>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-sm font-medium">Entered Competitions</label>
                            <div className="rounded-md border p-4 space-y-2">
                                {competitions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No competitions available.</p>
                                ) : (
                                    competitions.map(comp => {
                                        // Calculate age
                                        let ageDisplay = "N/A";
                                        if (formData.dateOfBirth && comp.ageAtDate) {
                                            const dob = new Date(formData.dateOfBirth);
                                            const ageAt = new Date(comp.ageAtDate);
                                            let age = ageAt.getFullYear() - dob.getFullYear();
                                            const m = ageAt.getMonth() - dob.getMonth();
                                            if (m < 0 || (m === 0 && ageAt.getDate() < dob.getDate())) {
                                                age--;
                                            }
                                            ageDisplay = age.toString();
                                        }

                                        return (
                                            <div key={comp.id} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`comp-${comp.id}`}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    checked={formData.enteredCompetitions.includes(comp.id)}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            enteredCompetitions: checked
                                                                ? [...prev.enteredCompetitions, comp.id]
                                                                : prev.enteredCompetitions.filter(id => id !== comp.id)
                                                        }));
                                                    }}
                                                />
                                                <label htmlFor={`comp-${comp.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1">
                                                    {comp.name}
                                                </label>
                                                <span className="text-xs text-muted-foreground">
                                                    Age: {ageDisplay}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 ml-auto">
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="font-medium">Reset Qualifying Times</p>
                            <p className="text-sm text-muted-foreground">
                                Revert all qualifying times to the default Essex 2026 standards. This cannot be undone.
                            </p>
                        </div>
                        <Button variant="destructive" onClick={handleResetStandards}>
                            Reset Standards
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
