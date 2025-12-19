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
                <div className="p-8 pb-24 md:pb-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex justify-around p-4 z-50 pb-safe">
                <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
                    <Home className="h-5 w-5" />
                    <span className="text-[10px]">Home</span>
                </Link>
                <Link href="/analysis" className={`flex flex-col items-center gap-1 ${pathname === '/analysis' ? 'text-primary' : 'text-muted-foreground'}`}>
                    <BarChart2 className="h-5 w-5" />
                    <span className="text-[10px]">Analysis</span>
                </Link>
                <Link href="/times" className={`flex flex-col items-center gap-1 ${pathname === '/times' ? 'text-primary' : 'text-muted-foreground'}`}>
                    <Clock className="h-5 w-5" />
                    <span className="text-[10px]">Times</span>
                </Link>
                <Link href="/competitions" className={`flex flex-col items-center gap-1 ${pathname === '/competitions' ? 'text-primary' : 'text-muted-foreground'}`}>
                    <Trophy className="h-5 w-5" />
                    <span className="text-[10px]">Events</span>
                </Link>
                <Link href="/profile" className={`flex flex-col items-center gap-1 ${pathname === '/profile' ? 'text-primary' : 'text-muted-foreground'}`}>
                    <Activity className="h-5 w-5" />
                    <span className="text-[10px]">Profile</span>
                </Link>
            </nav>
        </div>
    );
}
