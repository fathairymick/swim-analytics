"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSwimData } from "@/lib/hooks";
import { UserPlus, LogIn, Users } from "lucide-react";

export default function LoginPage() {
    const { swimmers, login, createSwimmer } = useSwimData();
    const router = useRouter();

    const [view, setView] = useState<'list' | 'login' | 'register'>('list');
    const [selectedSwimmerId, setSelectedSwimmerId] = useState<string | null>(null);
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");

    // Register Form State
    const [newName, setNewName] = useState("");
    const [newPin, setNewPin] = useState("");
    const [newDob, setNewDob] = useState("");
    const [newSex, setNewSex] = useState<'M' | 'F'>('M');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedSwimmerId) {
            const success = login(selectedSwimmerId, pin);
            if (success) {
                router.push('/');
            } else {
                setError("Incorrect PIN");
            }
        }
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName && newPin && newDob) {
            createSwimmer(newName, newPin, newDob, newSex);
            setView('list');
            // Optional: Auto login or show success message
        }
    };

    const selectSwimmer = (id: string) => {
        setSelectedSwimmerId(id);
        setView('login');
        setPin("");
        setError("");
    };

    if (view === 'list') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                            <Users className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Welcome Back</CardTitle>
                        <CardDescription>Select your profile to continue</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {swimmers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No profiles found. Create one to get started!
                            </div>
                        ) : (
                            <div className="grid gap-2">
                                {swimmers.map(swimmer => (
                                    <Button
                                        key={swimmer.id}
                                        variant="outline"
                                        className="h-14 justify-start text-lg px-6"
                                        onClick={() => selectSwimmer(swimmer.id)}
                                    >
                                        {swimmer.name}
                                    </Button>
                                ))}
                            </div>
                        )}

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or</span>
                            </div>
                        </div>

                        <Button className="w-full" onClick={() => setView('register')}>
                            <UserPlus className="mr-2 h-4 w-4" /> Create New Profile
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (view === 'login') {
        const swimmerName = swimmers.find(s => s.id === selectedSwimmerId)?.name;
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-full max-w-sm">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                            <LogIn className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle>Hello, {swimmerName}</CardTitle>
                        <CardDescription>Enter your PIN to access your data</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="PIN"
                                    className="text-center text-2xl tracking-widest"
                                    maxLength={4}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    autoFocus
                                />
                                {error && <p className="text-sm text-destructive text-center">{error}</p>}
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" className="w-full" onClick={() => setView('list')}>Back</Button>
                                <Button type="submit" className="w-full">Login</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (view === 'register') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Create Profile</CardTitle>
                        <CardDescription>Set up a new swimmer profile</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Swimmer Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date of Birth</label>
                                <Input
                                    type="date"
                                    required
                                    value={newDob}
                                    onChange={(e) => setNewDob(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Sex</label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={newSex}
                                    onChange={(e) => setNewSex(e.target.value as 'M' | 'F')}
                                >
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Create PIN (4 digits)</label>
                                <Input
                                    type="password"
                                    required
                                    maxLength={4}
                                    placeholder="0000"
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button type="button" variant="ghost" className="w-full" onClick={() => setView('list')}>Cancel</Button>
                                <Button type="submit" className="w-full">Create Profile</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}
