import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const INITIAL_ROUTES = [
    { id: '1', name: 'Freshmarket > Marina Loop', distance: 4.39, map_link: 'https://onthegomap.com/s/j26o9f49' },
    { id: '2', name: 'Kennedy Park > Marina Loop', distance: 6.4, map_link: 'https://onthegomap.com/s/919f3ltf' },
    { id: '3', name: 'Main highway > Ingrham Park', distance: 8.22, map_link: 'https://onthegomap.com/s/domqkvq8' },
    { id: '4', name: 'Freshmarket > Marina > Main', distance: 6.15, map_link: '' },
    { id: '5', name: 'Freshmarket > Marina > Grand', distance: 5.07, map_link: '' },
];

/**
 * Custom hook for route data management
 * @param {Object} session - Supabase session object
 * @param {Function} setDbHealth - Function to update DB health state
 * @param {Function} setRuns - Function to update runs state (for unlinking)
 * @returns {Object} { routes, addRoute, updateRoute, deleteRoute, clearAllRoutes, fetchRoutes }
 */
export const useRouteData = (session, setDbHealth, setRuns) => {
    const [routes, setRoutes] = useState(INITIAL_ROUTES);

    const fetchRoutes = useCallback(async () => {
        if (!session) return;
        try {
            // Health Check for Routes (proactive)
            const { error: healthError } = await supabase
                .from('routes')
                .select('coordinates, location')
                .limit(1);

            if (healthError && healthError.message.includes('column')) {
                const missing = [];
                if (healthError.message.includes('coordinates')) missing.push('coordinates (routes table)');
                if (healthError.message.includes('location')) missing.push('location (routes table)');
                if (missing.length > 0) {
                    setDbHealth(prev => ({ ok: false, missingColumns: [...new Set([...prev.missingColumns, ...missing])] }));
                }
            }

            const { data: allData, error } = await supabase.from('routes').select('*');
            if (error) throw error;

            if (allData && allData.length > 0) {
                setRoutes(allData);
            } else {
                setRoutes(INITIAL_ROUTES);
            }
        } catch (error) {
            console.error('Error fetching routes:', error.message);
        }
    }, [session, setDbHealth]);

    const addRoute = useCallback(async (routeData) => {
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
                setRoutes(prev => [data, ...prev]);
            }
        } catch (error) {
            console.error('Error adding route:', error);
        }
    }, [session]);

    const updateRoute = useCallback(async (id, updates) => {
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
    }, [session]);

    const deleteRoute = useCallback(async (id) => {
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
            setRuns(prev => prev.map(run => run.route_id === id ? { ...run, route_id: null } : run));
        } catch (error) {
            console.error('Error deleting route:', error);
            alert('Failed to delete route.');
        }
    }, [session, setRuns]);

    const clearAllRoutes = useCallback(async () => {
        if (!session) return;
        try {
            const { error: unlinkError } = await supabase
                .from('runs')
                .update({ route_id: null })
                .eq('user_id', session.user.id);

            if (unlinkError) throw unlinkError;

            const { error } = await supabase
                .from('routes')
                .delete()
                .eq('user_id', session.user.id);

            if (error) throw error;

            setRoutes([]);
            setRuns(prev => prev.map(run => ({ ...run, route_id: null })));
        } catch (error) {
            console.error('Error clearing routes:', error);
            alert('Failed to clear routes.');
        }
    }, [session, setRuns]);

    return {
        routes,
        setRoutes,
        addRoute,
        updateRoute,
        deleteRoute,
        clearAllRoutes,
        fetchRoutes
    };
};
