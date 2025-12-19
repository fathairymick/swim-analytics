"use client";

import { useSwimContext } from './context';

export function useSwimData() {
    const context = useSwimContext();

    // Map context values to match the expected interface of useSwimData
    // The context already exposes everything we need with the same names
    return {
        swimmer: context.currentSwimmer,
        standards: context.standards,
        competitions: context.competitions,
        updateProfile: context.updateProfile,
        addTime: context.addTime,
        updateTime: context.updateTime,
        deleteTime: context.deleteTime,
        updateStandard: context.updateStandard,
        updateStandardMeta: context.updateStandardMeta,
        resetStandards: context.resetStandards,
        bulkAddTimes: context.bulkAddTimes,
        addCompetition: context.addCompetition,
        updateCompetition: context.updateCompetition,
        deleteCompetition: context.deleteCompetition,
        mergeTimes: context.mergeTimes,
        overwriteTimes: context.overwriteTimes,
        // Expose new auth methods for components that need them
        swimmers: context.swimmers,
        login: context.login,
        logout: context.logout,
        createSwimmer: context.createSwimmer
    };
}
