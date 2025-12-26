import { useMemo } from 'react';
import { subWeeks, subMonths, subYears, isAfter, parseISO } from 'date-fns';
import { getWeekIdentifier } from '../utils/dateUtils';
import { calculatePace } from '../utils/calculations';

/**
 * Hook for filtering runs based on date range
 */
export const useFilteredRuns = (runs, dateRange) => {
    return useMemo(() => {
        const now = new Date();
        let cutoffDate;

        switch (dateRange) {
            case 'last4weeks': cutoffDate = subWeeks(now, 4); break;
            case 'monthly': cutoffDate = subMonths(now, 1); break;
            case 'quarterly': cutoffDate = subMonths(now, 3); break;
            case 'yearly': cutoffDate = subYears(now, 1); break;
            default: return [...runs].sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        return runs
            .filter(run => {
                const runDate = typeof run.date === 'string' ? parseISO(run.date) : new Date(run.date);
                return isAfter(runDate, cutoffDate);
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [runs, dateRange]);
};

/**
 * Hook for calculating weekly trends
 */
export const useWeeklyTrends = (sortedRuns) => {
    return useMemo(() => {
        if (sortedRuns.length === 0) return null;

        const getWeekKey = (d) => getWeekIdentifier(d);

        const getStats = (runSet) => {
            if (!runSet || runSet.length === 0) return { dist: 0, seconds: 0, paceSeconds: 0 };
            const totalDist = runSet.reduce((acc, r) => acc + parseFloat(r.distance), 0);
            const totalSecs = runSet.reduce((acc, r) => acc + (r.total_seconds || 0), 0);
            return {
                dist: totalDist,
                seconds: totalSecs,
                paceSeconds: totalDist > 0 ? totalSecs / totalDist : 0
            };
        };

        const lastRunDate = new Date(sortedRuns[sortedRuns.length - 1].date);
        const currentWeekId = getWeekKey(lastRunDate);
        const currentWeekRuns = sortedRuns.filter(r => getWeekKey(r.date) === currentWeekId);

        const [yearStr, weekStr] = currentWeekId.split('-W');
        let prevYear = parseInt(yearStr);
        let prevWeek = parseInt(weekStr) - 1;

        if (prevWeek < 1) {
            prevYear -= 1;
            prevWeek = 52;
        }

        const prevWeekId = `${prevYear}-W${String(prevWeek).padStart(2, '0')}`;
        const prevWeekRuns = sortedRuns.filter(r => getWeekKey(r.date) === prevWeekId);

        const curStats = getStats(currentWeekRuns);
        const prevStats = getStats(prevWeekRuns);

        const distDiff = curStats.dist - prevStats.dist;
        const paceDiff = (curStats.paceSeconds > 0 && prevStats.paceSeconds > 0)
            ? curStats.paceSeconds - prevStats.paceSeconds
            : 0;

        return {
            dist: {
                current: curStats.dist.toFixed(1),
                diff: distDiff,
                positive: distDiff >= 0,
                hasPrev: prevStats.dist > 0
            },
            pace: {
                current: calculatePace(1, curStats.paceSeconds),
                diff: paceDiff,
                positive: paceDiff <= 0,
                hasPrev: prevStats.paceSeconds > 0
            }
        };
    }, [sortedRuns]);
};
