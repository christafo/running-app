import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Custom hook for run data management
 * @param {Object} session - Supabase session object
 * @param {Function} setDbHealth - Function to update DB health state
 * @returns {Object} { runs, addRun, updateRun, deleteRun, fetchRuns, migrateLocalData }
 */
export const useRunData = (session, setDbHealth) => {
    const [runs, setRuns] = useState([]);

    const fetchRuns = useCallback(async () => {
        if (!session) return;
        try {
            // Health Check for Runs (proactive)
            const { error: healthError } = await supabase
                .from('runs')
                .select('effort, total_seconds')
                .limit(1);

            if (healthError && healthError.message.includes('column')) {
                const missing = [];
                if (healthError.message.includes('effort')) missing.push('effort (runs table)');
                if (healthError.message.includes('total_seconds')) missing.push('total_seconds (runs table)');
                if (missing.length > 0) {
                    setDbHealth(prev => ({ ok: false, missingColumns: [...new Set([...prev.missingColumns, ...missing])] }));
                }
            }

            const { data, error } = await supabase
                .from('runs')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            if (data) setRuns(data);
        } catch (error) {
            console.error('Error fetching runs:', error.message);
        }
    }, [session, setDbHealth]);

    const addRun = useCallback(async (runData) => {
        if (!session) return;
        try {
            const payload = {
                user_id: session.user.id,
                date: runData.date,
                route_id: runData.routeId || null,
                distance: runData.distance,
                duration: runData.duration,
                pace: runData.pace,
                total_seconds: runData.totalSeconds,
                notes: runData.notes || null,
                effort: runData.effort ? parseInt(runData.effort) : null
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
            console.error('Error adding run:', error);
            alert(`Failed to save run: ${error.message || 'Unknown error'}`);
        }
    }, [session]);

    const updateRun = useCallback(async (runId, updates) => {
        if (!session) return;
        try {
            const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
                if (value !== undefined) acc[key] = value;
                return acc;
            }, {});

            const payload = {
                ...cleanUpdates,
                effort: cleanUpdates.effort ? parseInt(cleanUpdates.effort) : cleanUpdates.effort,
                total_seconds: cleanUpdates.total_seconds ? parseInt(cleanUpdates.total_seconds) : cleanUpdates.total_seconds
            };

            const { data, error } = await supabase
                .from('runs')
                .update(payload)
                .eq('id', runId)
                .select()
                .maybeSingle();

            if (error) throw error;

            const updatedRun = data || payload;
            setRuns(prev => prev.map(run =>
                run.id === runId ? { ...run, ...updatedRun } : run
            ));
        } catch (error) {
            console.error('Error updating run:', error);
            alert(`Failed to update run: ${error.message || 'Unknown error'}`);
        }
    }, [session]);

    const deleteRun = useCallback(async (id) => {
        if (!session) return;
        try {
            const { error } = await supabase.from('runs').delete().eq('id', id);
            if (error) throw error;
            setRuns(prev => prev.filter(run => run.id !== id));
        } catch (error) {
            console.error('Error deleting run:', error);
        }
    }, [session]);

    const migrateLocalData = useCallback(async () => {
        if (!session) return;
        const localRuns = localStorage.getItem('runs');
        if (localRuns) {
            try {
                const parsedRuns = JSON.parse(localRuns);
                if (parsedRuns.length > 0) {
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
                        localStorage.removeItem('runs');
                        fetchRuns();
                    }
                }
            } catch (e) {
                console.error("Migration failed", e);
            }
        }
    }, [session, fetchRuns]);

    return {
        runs,
        setRuns,
        addRun,
        updateRun,
        deleteRun,
        fetchRuns,
        migrateLocalData
    };
};
