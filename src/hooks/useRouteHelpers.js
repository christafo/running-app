import { useCallback } from 'react';

/**
 * Custom hook for route-related helper functions
 * Consolidates route lookup logic used across multiple components
 * 
 * @param {Array} routes - Array of route objects
 * @returns {Object} Helper functions for route operations
 */
export const useRouteHelpers = (routes) => {
    /**
     * Get route name by ID
     * @param {string} routeId - Route ID to look up
     * @returns {string} Route name or fallback text
     */
    const getRouteName = useCallback((routeId) => {
        if (!routeId) return 'No route';
        if (!routes) return 'Unknown route';

        const route = routes.find(r => r.id === routeId);
        return route?.name || 'Unknown route';
    }, [routes]);

    /**
     * Get route distance by ID
     * @param {string} routeId - Route ID to look up
     * @returns {number} Route distance in km
     */
    const getRouteDistance = useCallback((routeId) => {
        if (!routeId || !routes) return 0;

        const route = routes.find(r => r.id === routeId);
        return route?.distance || 0;
    }, [routes]);

    /**
     * Get full route object by ID
     * @param {string} routeId - Route ID to look up
     * @returns {Object|null} Route object or null
     */
    const getRoute = useCallback((routeId) => {
        if (!routeId || !routes) return null;
        return routes.find(r => r.id === routeId) || null;
    }, [routes]);

    return {
        getRouteName,
        getRouteDistance,
        getRoute
    };
};
