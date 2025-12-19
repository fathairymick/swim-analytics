"use client";

import { useSwimContext } from "@/lib/context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { LogOut, Home, BarChart2, Clock, Activity, Trophy } from "lucide-react";
import Link from "next/link";

export function MainLayout({ children }: { children: React.ReactNode }) {
    const { currentSwimmer, logout } = useSwimContext();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!currentSwimmer && pathname !== '/login') {
            router.push('/login');
        }
    }, [currentSwimmer, pathname, router]);

    if (pathname === '/login') {
        return <>{children}</>;
    }

    if (!currentSwimmer) {
        return null; // Or a loading spinner while redirecting
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-card hidden md:flex flex-col">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        SwimAnalytics
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Welcome, {currentSwimmer.name}
                    </p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-background/50 transition-colors">
                        <Home className="h-4 w-4" />
                        Dashboard
                    </Link>

                    <Link href="/analysis" className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-background/50 transition-colors">
                        <BarChart2 className="h-4 w-4" />
                        Analysis
                    </Link>
                    <Link href="/times" className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-background/50 transition-colors">
                        <Clock className="h-4 w-4" />
                        Times
                    </Link>
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-background/50 transition-colors">
                        <Activity className="h-4 w-4" />
                        Profile
                    </Link>

                    <Link href="/competitions" className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-background/50 transition-colors">
                        <Trophy className="h-4 w-4" />
                        Competitions
                    </Link>
                </nav>
                <div className="p-4 border-t">
                    <button
                        onClick={() => { logout(); router.push('/login'); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors w-full"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
