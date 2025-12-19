"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Swimmer, SwimTime, QualifyingStandards, Competition } from './types';
import { DEFAULT_QT_DB } from './defaults';

interface SwimContextType {
    swimmers: Swimmer[];
    currentSwimmer: Swimmer | null;
    standards: QualifyingStandards;
    competitions: Competition[];
    login: (id: string, pin: string) => boolean;
    logout: () => void;
    createSwimmer: (name: string, pin: string, dateOfBirth: string, sex: 'M' | 'F') => void;
    updateProfile: (name: string, ageGroup: string, sex: 'M' | 'F', memberNumber?: string, dateOfBirth?: string, enteredCompetitions?: string[], targetPercentage?: number) => void;
    addTime: (time: SwimTime) => void;
    updateTime: (updatedTime: SwimTime) => void;
    deleteTime: (id: string) => void;
    bulkAddTimes: (newTimes: SwimTime[]) => void;
    mergeTimes: (newTimes: SwimTime[]) => number;
    updateStandard: (level: 'County' | 'Regional' | 'National', sex: string, ageGroup: string, eventKey: string, timeMs: number) => void;
    updateStandardMeta: (level: 'County' | 'Regional' | 'National', name: string, year: number) => void;
    resetStandards: () => void;
    addCompetition: (comp: Competition) => void;
    updateCompetition: (updatedComp: Competition) => void;
    deleteCompetition: (id: string) => void;
    overwriteTimes: (newTimes: SwimTime[]) => number;
}

const SwimContext = createContext<SwimContextType | undefined>(undefined);

export function SwimProvider({ children }: { children: ReactNode }) {
    const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
    const [currentSwimmer, setCurrentSwimmer] = useState<Swimmer | null>(null);
    const [standards, setStandards] = useState<QualifyingStandards>(DEFAULT_QT_DB);
    const [competitions, setCompetitions] = useState<Competition[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initial Load & Migration
    useEffect(() => {
        // Load standards
        const savedStandards = localStorage.getItem('swimStandards');
        if (savedStandards) {
            const parsed = JSON.parse(savedStandards);
            if (!parsed.County || !parsed.County.times?.['M']?.['13']) {
                console.log("Detected outdated standards format, resetting to defaults.");
                setStandards(DEFAULT_QT_DB);
                localStorage.setItem('swimStandards', JSON.stringify(DEFAULT_QT_DB));
            } else {
                setStandards(parsed);
            }
        }

        // Load competitions
        const savedCompetitions = localStorage.getItem('swimCompetitions');
        if (savedCompetitions) {
            const parsed = JSON.parse(savedCompetitions);
            // Migration logic for competitions (same as before)
            const migrated = parsed.map((comp: any) => {
                if (!comp.qualifyingPeriod && comp.date) {
                    return {
                        ...comp,
                        qualifyingPeriod: { start: comp.date, end: comp.date },
                        date: undefined
                    };
                }
                return comp;
            });
            setCompetitions(migrated);
            if (JSON.stringify(migrated) !== JSON.stringify(parsed)) {
                localStorage.setItem('swimCompetitions', JSON.stringify(migrated));
            }
        }

        // Load Swimmers & Migrate Legacy Data
        const savedSwimmers = localStorage.getItem('swimSwimmers');
        if (savedSwimmers) {
            setSwimmers(JSON.parse(savedSwimmers));
        } else {
            // Check for legacy single swimmer data
            const legacyData = localStorage.getItem('swimData');
            if (legacyData) {
                const parsedLegacy = JSON.parse(legacyData);
                const migratedSwimmer: Swimmer = {
                    ...parsedLegacy,
                    pin: '0000', // Default PIN for migrated user
                    color: 'blue'
                };
                const newSwimmers = [migratedSwimmer];
                setSwimmers(newSwimmers);
                localStorage.setItem('swimSwimmers', JSON.stringify(newSwimmers));
                localStorage.removeItem('swimData'); // Cleanup legacy
                console.log("Migrated legacy swimmer data to multi-user format.");
            }
        }

        // Check for active session
        const sessionSwimmerId = localStorage.getItem('swimSession');
        if (sessionSwimmerId) {
            // We can't set currentSwimmer here directly because swimmers state might not be updated yet in this closure if we just set it.
            // However, in this effect, we are setting swimmers.
            // Let's rely on a second effect or just find it from the loaded data.
            // Actually, we can just use the local variable `newSwimmers` or parsed data.
            let loadedSwimmers: Swimmer[] = [];
            if (savedSwimmers) loadedSwimmers = JSON.parse(savedSwimmers);
            else if (localStorage.getItem('swimData')) {
                const parsedLegacy = JSON.parse(localStorage.getItem('swimData')!);
                loadedSwimmers = [{ ...parsedLegacy, pin: '0000', color: 'blue' }];
            }

            const found = loadedSwimmers.find(s => s.id === sessionSwimmerId);
            if (found) setCurrentSwimmer(found);
        }

        setIsInitialized(true);
    }, []);

    // Persist Swimmers whenever they change
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('swimSwimmers', JSON.stringify(swimmers));
        }
    }, [swimmers, isInitialized]);

    // Persist Competitions
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('swimCompetitions', JSON.stringify(competitions));
        }
    }, [competitions, isInitialized]);

    // Persist Standards
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('swimStandards', JSON.stringify(standards));
        }
    }, [standards, isInitialized]);


    const login = (id: string, pin: string) => {
        const swimmer = swimmers.find(s => s.id === id);
        if (swimmer && swimmer.pin === pin) {
            setCurrentSwimmer(swimmer);
            localStorage.setItem('swimSession', swimmer.id);
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentSwimmer(null);
        localStorage.removeItem('swimSession');
    };

    const createSwimmer = (name: string, pin: string, dateOfBirth: string, sex: 'M' | 'F') => {
        const newSwimmer: Swimmer = {
            id: Date.now().toString(),
            name,
            pin,
            dateOfBirth,
            sex,
            ageGroup: '18+', // Will be calculated dynamically usually, but set default
            times: [],
            enteredCompetitions: [],
            targetPercentage: 5
        };
        setSwimmers(prev => [...prev, newSwimmer]);
        // Auto login? Maybe not.
    };

    // --- Data Modifiers (operate on currentSwimmer) ---

    const updateSwimmerState = (updated: Swimmer) => {
        setCurrentSwimmer(updated);
        setSwimmers(prev => prev.map(s => s.id === updated.id ? updated : s));
    };

    const updateProfile = (name: string, ageGroup: string, sex: 'M' | 'F', memberNumber?: string, dateOfBirth?: string, enteredCompetitions?: string[], targetPercentage?: number) => {
        if (!currentSwimmer) return;
        updateSwimmerState({ ...currentSwimmer, name, ageGroup, sex, memberNumber, dateOfBirth, enteredCompetitions, targetPercentage });
    };

    const addTime = (time: SwimTime) => {
        if (!currentSwimmer) return;
        updateSwimmerState({ ...currentSwimmer, times: [...currentSwimmer.times, time] });
    };

    const updateTime = (updatedTime: SwimTime) => {
        if (!currentSwimmer) return;
        const newTimes = currentSwimmer.times.map(t => t.id === updatedTime.id ? updatedTime : t);
        updateSwimmerState({ ...currentSwimmer, times: newTimes });
    };

    const deleteTime = (id: string) => {
        if (!currentSwimmer) return;
        const newTimes = currentSwimmer.times.filter(t => t.id !== id);
        updateSwimmerState({ ...currentSwimmer, times: newTimes });
    };

    const bulkAddTimes = (newTimes: SwimTime[]) => {
        if (!currentSwimmer) return;
        updateSwimmerState({ ...currentSwimmer, times: [...currentSwimmer.times, ...newTimes] });
    };

    const mergeTimes = (newTimes: SwimTime[]) => {
        if (!currentSwimmer) return 0;
        const existingSignatures = new Set(currentSwimmer.times.map(t =>
            `${t.date}-${t.event.stroke}-${t.event.distance}-${t.event.course}-${t.timeMs}`
        ));
        const uniqueNewTimes = newTimes.filter(t => {
            const signature = `${t.date}-${t.event.stroke}-${t.event.distance}-${t.event.course}-${t.timeMs}`;
            return !existingSignatures.has(signature);
        });

        if (uniqueNewTimes.length > 0) {
            updateSwimmerState({ ...currentSwimmer, times: [...currentSwimmer.times, ...uniqueNewTimes] });
        }
        return uniqueNewTimes.length;
    };

    const overwriteTimes = (newTimes: SwimTime[]) => {
        if (!currentSwimmer) return 0;
        // Identify signatures of the NEW times (Date + Stroke + Distance)
        // We will remove any OLD times that match these signatures
        const signaturesToRemove = new Set(newTimes.map(t =>
            `${t.date}-${t.event.stroke}-${t.event.distance}`
        ));

        // Filter out old times that match the new signatures
        const remainingTimes = currentSwimmer.times.filter(t => {
            const signature = `${t.date}-${t.event.stroke}-${t.event.distance}`;
            return !signaturesToRemove.has(signature);
        });

        // Add the new times
        updateSwimmerState({ ...currentSwimmer, times: [...remainingTimes, ...newTimes] });
        return newTimes.length;
    };

    // --- Shared Data Modifiers ---

    const updateStandard = (level: 'County' | 'Regional' | 'National', sex: string, ageGroup: string, eventKey: string, timeMs: number) => {
        const newStandards = { ...standards };
        if (!newStandards[level].times[sex]) newStandards[level].times[sex] = {};
        if (!newStandards[level].times[sex][ageGroup]) newStandards[level].times[sex][ageGroup] = {};
        newStandards[level].times[sex][ageGroup][eventKey] = timeMs;
        setStandards(newStandards);
    };

    const updateStandardMeta = (level: 'County' | 'Regional' | 'National', name: string, year: number) => {
        const newStandards = { ...standards };
        newStandards[level].name = name;
        newStandards[level].year = year;
        setStandards(newStandards);
    };

    const resetStandards = () => {
        setStandards(DEFAULT_QT_DB);
    };

    const addCompetition = (comp: Competition) => {
        setCompetitions(prev => [...prev, comp]);
    };

    const updateCompetition = (updatedComp: Competition) => {
        setCompetitions(prev => prev.map(c => c.id === updatedComp.id ? updatedComp : c));
    };

    const deleteCompetition = (id: string) => {
        setCompetitions(prev => prev.filter(c => c.id !== id));
    };

    return (
        <SwimContext.Provider value={{
            swimmers,
            currentSwimmer,
            standards,
            competitions,
            login,
            logout,
            createSwimmer,
            updateProfile,
            addTime,
            updateTime,
            deleteTime,
            bulkAddTimes,
            mergeTimes,
            updateStandard,
            updateStandardMeta,
            resetStandards,
            addCompetition,
            updateCompetition,
            deleteCompetition,
            overwriteTimes
        }}>
            {children}
        </SwimContext.Provider>
    );
}

export function useSwimContext() {
    const context = useContext(SwimContext);
    if (context === undefined) {
        throw new Error('useSwimContext must be used within a SwimProvider');
    }
    return context;
}
