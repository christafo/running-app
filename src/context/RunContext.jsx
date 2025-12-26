import { createContext, useContext, useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { useRunData } from '../hooks/useRunData';
import { useRouteData, INITIAL_ROUTES } from '../hooks/useRouteData';

const RunContext = createContext();

export const RunProvider = ({ children }) => {
    const { session, isLoading } = useSupabase();
    const [dbHealth, setDbHealth] = useState({ ok: true, missingColumns: [] });

    // Internal hook for run state management
    const runData = useRunData(session, setDbHealth);
    const { runs, setRuns, fetchRuns, migrateLocalData } = runData;

    // Internal hook for route state management 
    // Pass setRuns from useRunData for unlinking routes from runs
    const routeData = useRouteData(session, setDbHealth, setRuns);
    const { routes, setRoutes, fetchRoutes } = routeData;

    // Fetch Data when Session Configured
    useEffect(() => {
        if (session) {
            fetchRuns();
            fetchRoutes();
            migrateLocalData();
        } else {
            // Reset state on logout
            setRuns([]);
            setRoutes(INITIAL_ROUTES);
        }
    }, [session, fetchRuns, fetchRoutes, migrateLocalData, setRuns, setRoutes]);

    const getRunStats = () => {
        const totalRuns = runs.length;
        const totalDistance = runs.reduce((acc, curr) => acc + Number(curr.distance), 0);
        return {
            totalRuns,
            totalDistance: totalDistance.toFixed(2),
        };
    };

    const value = {
        session,
        isLoading,
        dbHealth,
        ...runData,
        ...routeData,
        getRunStats
    };

    return (
        <RunContext.Provider value={value}>
            {children}
        </RunContext.Provider>
    );
};

export const useRuns = () => {
    const context = useContext(RunContext);
    if (!context) {
        throw new Error('useRuns must be used within a RunProvider');
    }
    return context;
};
