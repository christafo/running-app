import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Custom hook for Supabase authentication and session management
 * @returns {Object} { session, isLoading }
 */
export const useSupabase = () => {
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initial session fetch
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return { session, isLoading };
};
