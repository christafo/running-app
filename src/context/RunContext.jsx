import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const RunContext = createContext();

const INITIAL_ROUTES = [
    { id: '1', name: 'Freshmarket > Marina Loop', distance: 4.39, mapLink: 'https://onthegomap.com/s/j26o9f49' },
    { id: '2', name: 'Kennedy Park > Marina Loop', distance: 6.4, mapLink: 'https://onthegomap.com/s/919f3ltf' },
    { id: '3', name: 'Main highway > Ingrham Park', distance: 8.22, mapLink: 'https://onthegomap.com/s/domqkvq8' },
    { id: '4', name: 'Freshmarket > Marina > Main', distance: 6.15, mapLink: '' },
    { id: '5', name: 'Freshmarket > Marina > Grand', distance: 5.07, mapLink: '' },
];

export const RunProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [runs, setRuns] = useState([]);
    const [routes, setRoutes] = useState([]);

    // Auth State Listener
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                setRuns([]); // Clear data on logout
                setRoutes(INITIAL_ROUTES); // Reset to defaults
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Fetch Data when Session Configured
    useEffect(() => {
        if (session) {
            fetchRuns();
            fetchRoutes();
            migrateLocalData();
        }
    }, [session]);

    const fetchRuns = async () => {
        try {
            const { data, error } = await supabase
                .from('runs')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            if (data) setRuns(data);
        } catch (error) {
            console.error('Error fetching runs:', error.message);
        }
    };

    const fetchRoutes = async () => {
        try {
            const { data, error } = await supabase
                .from('routes')
                .select('*');

            if (error) throw error;
            // If user has no custom routes, use initial ones locally, 
            // OR we could insert INITIAL_ROUTES into the DB for them? 
            // For now, let's just append API routes to INITIAL_ROUTES or just use API if it has any.
            if (data && data.length > 0) {
                setRoutes(data);
            } else {
                setRoutes(INITIAL_ROUTES);
            }
        } catch (error) {
            console.error('Error fetching routes:', error.message);
        }
    };

    const migrateLocalData = async () => {
        const localRuns = localStorage.getItem('runs');
        if (localRuns) {
            try {
                const parsedRuns = JSON.parse(localRuns);
                if (parsedRuns.length > 0) {
                    // Map to Snake Case Schema
                    const runsToUpload = parsedRuns.map(r => ({
                        user_id: session.user.id,
                        date: r.date,
                        route_id: r.routeId,
                        distance: r.distance,
                        duration: r.duration,
                        pace: r.pace,
                        total_seconds: r.totalSeconds,
                        notes: r.notes
                    }));

                    const { error } = await supabase.from('runs').insert(runsToUpload);
                    if (!error) {
                        console.log('Migrated runs to Supabase');
                        localStorage.removeItem('runs'); // Clear local to avoid re-migration
                        fetchRuns(); // Refresh
                    }
                }
            } catch (e) {
                console.error("Migration failed", e);
            }
        }
    };

    const addRun = async (runData) => {
        if (!session) return;

        // Optimistic Update
        // setRuns(prev => [runData, ...prev]);

        try {
            const payload = {
                user_id: session.user.id,
                date: runData.date,
                route_id: runData.routeId,
                distance: runData.distance,
                duration: runData.duration,
                pace: runData.pace,
                total_seconds: runData.totalSeconds,
                notes: runData.notes
            };

            const { data, error } = await supabase
                .from('runs')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setRuns(prev => [data, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
            }
        } catch (error) {
            console.error('Error adding run:', error.message);
            alert('Failed to save run');
        }
    };

    const deleteRun = async (id) => {
        if (!session) return;
        try {
            const { error } = await supabase.from('runs').delete().eq('id', id);
            if (error) throw error;
            setRuns(prev => prev.filter(run => run.id !== id));
        } catch (error) {
            console.error('Error deleting run:', error);
        }
    };

    const addRoute = async (routeData) => {
        if (!session) return;
        try {
            const payload = {
                user_id: session.user.id,
                name: routeData.name,
                distance: routeData.distance,
                map_link: routeData.map_link || routeData.mapLink || '',
                coordinates: routeData.coordinates || null,
                location: routeData.location || null
            };

            const { data, error } = await supabase
                .from('routes')
                .insert([payload])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setRoutes(prev => [...prev, data]);
            }
        } catch (error) {
            console.error('Error adding route:', error);
        }
    };

    const deleteRoute = async (id) => {
        if (!session) return;
        try {
            // Unlink from runs first
            const { error: unlinkError } = await supabase
                .from('runs')
                .update({ route_id: null })
                .eq('route_id', id);

            if (unlinkError) throw unlinkError;

            // Delete route
            const { error } = await supabase.from('routes').delete().eq('id', id);
            if (error) throw error;

            setRoutes(prev => prev.filter(r => r.id !== id));
            // Update local runs state
            setRuns(prev => prev.map(run => run.route_id === id ? { ...run, route_id: null } : run));

        } catch (error) {
            console.error('Error deleting route:', error);
            alert('Failed to delete route.');
        }
    };

    const clearAllRoutes = async () => {
        if (!session) return;
        try {
            // Unlink all from runs
            const { error: unlinkError } = await supabase
                .from('runs')
                .update({ route_id: null })
                .eq('user_id', session.user.id);

            if (unlinkError) throw unlinkError;

            // Delete all routes
            const { error } = await supabase
                .from('routes')
                .delete()
                .eq('user_id', session.user.id);

            if (error) throw error;

            setRoutes([]); // Or back to INITIAL_ROUTES if we prefer, but user said "clear out any routes"
            setRuns(prev => prev.map(run => ({ ...run, route_id: null })));

        } catch (error) {
            console.error('Error clearing routes:', error);
            alert('Failed to clear routes.');
        }
    };

    const updateRoute = async (id, updates) => {
        if (!session) return;
        try {
            const { data, error } = await supabase
                .from('routes')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setRoutes(prev => prev.map(r => r.id === id ? data : r));
            }
        } catch (error) {
            console.error('Error updating route:', error);
            alert('Failed to update route.');
        }
    };

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
        runs,
        routes,
        addRun,
        deleteRun,
        addRoute,
        deleteRoute,
        clearAllRoutes,
        updateRoute,
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
