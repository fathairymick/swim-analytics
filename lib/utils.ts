import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Course, QualifyingStandards } from "./types";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);

    const mm = minutes > 0 ? `${minutes}:` : '';
    const ss = seconds.toString().padStart(2, '0');
    const hh = hundredths.toString().padStart(2, '0');

    return `${mm}${ss}.${hh}`;
}

export function parseTime(timeString: string): number {
    // Accepts "MM:SS.HH" or "SS.HH"
    const parts = timeString.split(':');
    let minutes = 0;
    let seconds = 0;
    let hundredths = 0;

    if (parts.length === 2) {
        minutes = parseInt(parts[0], 10);
        const secParts = parts[1].split('.');
        seconds = parseInt(secParts[0], 10);
        hundredths = parseInt(secParts[1] || '0', 10);
    } else {
        const secParts = parts[0].split('.');
        seconds = parseInt(secParts[0], 10);
        hundredths = parseInt(secParts[1] || '0', 10);
    }

    return (minutes * 60000) + (seconds * 1000) + (hundredths * 10);
}

// Simple conversion factors (approximate)
// SCM to LCM: +2% (approx)
export function convertTime(timeMs: number, from: Course, to: Course): number {
    if (from === to) return timeMs;

    let lcmTime = timeMs;

    // Convert to LCM first
    if (from === 'SCM') {
        lcmTime = timeMs * 1.02;
    }

    // Convert from LCM to target
    if (to === 'LCM') {
        return Math.round(lcmTime);
    } else if (to === 'SCM') {
        return Math.round(lcmTime / 1.02);
    }

    return timeMs;
}

export function getQualifyingTime(
    standards: QualifyingStandards,
    sex: 'M' | 'F',
    ageGroup: string,
    stroke: string,
    distance: number,
    level: 'County' | 'Regional' | 'National'
): number | null {
    const key = `${stroke}${distance}`;

    // Access the specific level's times
    const time = standards[level]?.times?.[sex]?.[ageGroup]?.[key];

    return time || null;
}

export function calculateAge(dobString: string, targetDateString: string): number {
    const dob = new Date(dobString);
    const target = new Date(targetDateString);
    let age = target.getFullYear() - dob.getFullYear();
    const m = target.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && target.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

export function getAgeGroup(age: number): string {
    if (age <= 11) return '10 & 11';
    if (age === 12) return '12';
    if (age === 13) return '13';
    if (age === 14) return '14';
    if (age === 15) return '15';
    if (age === 16) return '16';
    if (age === 17) return '17';
    return '18+';
}
