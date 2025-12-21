import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { calculatePace } from '../utils/calculations';
import { getWeekIdentifier } from '../utils/dateUtils';
import { ArrowUpRight, ArrowDownRight, Minus, Calendar } from 'lucide-react';
import { useState } from 'react';
import { subWeeks, subMonths, subYears, isAfter, parseISO } from 'date-fns';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const AnalyticsCharts = ({ runs, routes }) => {
    // Date range state
    const [dateRange, setDateRange] = useState('last4weeks');

    // Filter runs by date range
    const getFilteredRuns = () => {
        const now = new Date();
        let cutoffDate;

        switch (dateRange) {
            case 'last4weeks':
                cutoffDate = subWeeks(now, 4);
                break;
            case 'monthly':
                cutoffDate = subMonths(now, 1);
                break;
            case 'quarterly':
                cutoffDate = subMonths(now, 3);
                break;
            case 'yearly':
                cutoffDate = subYears(now, 1);
                break;
            default:
                return runs;
        }

        return runs.filter(run => {
            const runDate = typeof run.date === 'string' ? parseISO(run.date) : new Date(run.date);
            return isAfter(runDate, cutoffDate);
        });
    };

    const filteredRuns = getFilteredRuns();
    const sortedRuns = [...filteredRuns].sort((a, b) => new Date(a.date) - new Date(b.date));

    // --- Weekly Analysis Logic ---
    // Group runs by Week Identifier (ISO)
    const getWeekKey = (d) => {
        return getWeekIdentifier(d);
    };

    // Simple helper: Get stats for a set of runs
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

    // Calculate "Current Week" (most recent run's week) vs "Previous Week"
    let trends = null;
    if (sortedRuns.length > 0) {
        const lastRunDate = new Date(sortedRuns[sortedRuns.length - 1].date);
        const currentWeekId = getWeekKey(lastRunDate);

        // Filter runs for current week
        const currentWeekRuns = sortedRuns.filter(r => getWeekKey(r.date) === currentWeekId);

        // Calculate previous week identifier
        // Parse "2025-W51" format to get year and week number
        const [yearStr, weekStr] = currentWeekId.split('-W');
        let prevYear = parseInt(yearStr);
        let prevWeek = parseInt(weekStr) - 1;

        // Handle year rollover (week 0 becomes week 52/53 of previous year)
        if (prevWeek < 1) {
            prevYear -= 1;
            prevWeek = 52; // Most years have 52 weeks, some have 53
        }

        const prevWeekId = `${prevYear}-W${String(prevWeek).padStart(2, '0')}`;

        // Filter runs for previous week
        const prevWeekRuns = sortedRuns.filter(r => getWeekKey(r.date) === prevWeekId);

        const curStats = getStats(currentWeekRuns);
        const prevStats = getStats(prevWeekRuns);

        const distDiff = curStats.dist - prevStats.dist;
        const paceDiff = (curStats.paceSeconds > 0 && prevStats.paceSeconds > 0)
            ? curStats.paceSeconds - prevStats.paceSeconds
            : 0; // Negative is faster (good)

        trends = {
            dist: {
                current: curStats.dist.toFixed(1),
                diff: distDiff,
                positive: distDiff >= 0,
                hasPrev: prevStats.dist > 0
            },
            pace: {
                current: calculatePace(1, curStats.paceSeconds), // Normalized pace
                diff: paceDiff,
                positive: paceDiff <= 0, // Lower pace is good
                hasPrev: prevStats.paceSeconds > 0
            }
        };
    }


    const labels = sortedRuns.map(r => new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));

    // Calculate average distance for trend line
    const avgDistance = sortedRuns.length > 0
        ? sortedRuns.reduce((acc, r) => acc + parseFloat(r.distance), 0) / sortedRuns.length
        : 0;

    const distanceData = {
        labels,
        datasets: [
            {
                type: 'bar',
                label: 'Distance',
                data: sortedRuns.map(r => r.distance),
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: '#3b82f6',
                borderWidth: 1,
                // Store full run data for tooltips
                runData: sortedRuns,
            },
            {
                type: 'line',
                label: 'Average',
                data: Array(sortedRuns.length).fill(avgDistance),
                borderColor: '#10b981',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
            },
        ],
    };

    // Calculate average pace for trend line
    const validPaceRuns = sortedRuns.filter(r => r.pace && r.pace.includes(':'));
    const avgPaceDecimal = validPaceRuns.length > 0
        ? validPaceRuns.reduce((acc, r) => {
            const [m, s] = r.pace.split(':').map(Number);
            return acc + (m + s / 60);
        }, 0) / validPaceRuns.length
        : 0;

    const paceData = {
        labels,
        datasets: [
            {
                type: 'bar',
                label: 'Pace',
                data: sortedRuns.map(r => {
                    if (!r.pace || !r.pace.includes(':')) return 0;
                    const [m, s] = r.pace.split(':').map(Number);
                    return m + s / 60;
                }),
                backgroundColor: 'rgba(236, 72, 153, 0.7)',
                borderColor: '#ec4899',
                borderWidth: 1,
                runData: sortedRuns,
            },
            {
                type: 'line',
                label: 'Average',
                data: Array(sortedRuns.length).fill(avgPaceDecimal),
                borderColor: '#10b981',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
            },
        ],
    };

    // Get route name helper
    const getRouteName = (routeId) => {
        if (!routes) return 'Unknown';
        const route = routes.find(r => r.id === routeId);
        return route ? route.name : 'No route';
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: false },
            tooltip: {
                callbacks: {
                    title: (context) => {
                        const index = context[0].dataIndex;
                        const run = sortedRuns[index];
                        return new Date(run.date).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                        });
                    },
                    afterTitle: (context) => {
                        const index = context[0].dataIndex;
                        const run = sortedRuns[index];
                        return getRouteName(run.route_id);
                    },
                    label: (context) => {
                        const index = context.dataIndex;
                        const run = sortedRuns[index];

                        if (context.dataset.label === 'Average') {
                            return `Average: ${context.formattedValue}`;
                        }

                        if (context.dataset.label === 'Distance') {
                            return [
                                `Distance: ${parseFloat(run.distance).toFixed(2)} km`,
                                `Time: ${run.duration}`,
                                `Pace: ${run.pace}/km`
                            ];
                        }

                        if (context.dataset.label === 'Pace') {
                            const mins = Math.floor(context.parsed.y);
                            const secs = Math.round((context.parsed.y - mins) * 60);
                            return [
                                `Pace: ${mins}:${secs.toString().padStart(2, '0')}/km`,
                                `Distance: ${parseFloat(run.distance).toFixed(2)} km`,
                                `Time: ${run.duration}`
                            ];
                        }

                        return context.formattedValue;
                    }
                }
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#f1f5f9' }, beginAtZero: true }
        }
    };

    const paceOptions = {
        ...options,
        scales: {
            ...options.scales,
            y: {
                ...options.scales?.y,
                beginAtZero: false,
                ticks: {
                    callback: function (value) {
                        const m = Math.floor(value);
                        const s = Math.round((value - m) * 60);
                        return `${m}:${s.toString().padStart(2, '0')}`;
                    }
                }
            }
        }
    }

    if (runs.length < 2) {
        return (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                Not enough data to show trends. Log more runs!
            </div>
        );
    }

    return (
        <div>
            {/* Date Range Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setDateRange('last4weeks')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: dateRange === 'last4weeks' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        backgroundColor: dateRange === 'last4weeks' ? '#eff6ff' : 'white',
                        color: dateRange === 'last4weeks' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        fontWeight: dateRange === 'last4weeks' ? '600' : '400',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}
                >
                    <Calendar size={14} /> Last 4 Weeks
                </button>
                <button
                    onClick={() => setDateRange('monthly')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: dateRange === 'monthly' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        backgroundColor: dateRange === 'monthly' ? '#eff6ff' : 'white',
                        color: dateRange === 'monthly' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        fontWeight: dateRange === 'monthly' ? '600' : '400',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    Monthly
                </button>
                <button
                    onClick={() => setDateRange('quarterly')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: dateRange === 'quarterly' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        backgroundColor: dateRange === 'quarterly' ? '#eff6ff' : 'white',
                        color: dateRange === 'quarterly' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        fontWeight: dateRange === 'quarterly' ? '600' : '400',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    Quarterly
                </button>
                <button
                    onClick={() => setDateRange('yearly')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: dateRange === 'yearly' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        backgroundColor: dateRange === 'yearly' ? '#eff6ff' : 'white',
                        color: dateRange === 'yearly' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        fontWeight: dateRange === 'yearly' ? '600' : '400',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    Yearly
                </button>
            </div>

            {/* Weekly Analysis Cards */}
            {trends && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>

                    {/* Distance Summary Card */}
                    <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                            <ArrowUpRight size={14} /> Weekly Distance Summary
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <div style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--primary-color)' }}>{trends.dist.current} <span style={{ fontSize: '1rem', fontWeight: '500' }}>km</span></div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>this week</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                {trends.dist.hasPrev ? (
                                    <div style={{
                                        backgroundColor: trends.dist.positive ? '#ecfdf5' : '#fef2f2',
                                        color: trends.dist.positive ? '#059669' : '#dc2626',
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '2rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}>
                                        {trends.dist.diff >= 0 ? '+' : ''}{trends.dist.diff.toFixed(1)} km
                                        {trends.dist.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Baseline Week</div>
                                )}
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>vs. last week</div>
                            </div>
                        </div>
                    </div>

                    {/* Pace Summary Card */}
                    <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                            <Minus size={14} /> Weekly Pace Summary
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <div style={{ fontSize: '1.875rem', fontWeight: '800', color: '#ec4899' }}>{trends.pace.current} <span style={{ fontSize: '1rem', fontWeight: '500' }}>/km</span></div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>avg this week</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                {trends.pace.hasPrev ? (
                                    <div style={{
                                        backgroundColor: trends.pace.positive ? '#ecfdf5' : '#fef2f2',
                                        color: trends.pace.positive ? '#059669' : '#dc2626',
                                        padding: '0.25rem 0.6rem',
                                        borderRadius: '2rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}>
                                        {trends.pace.diff <= 0 ? '-' : '+'}{Math.round(Math.abs(trends.pace.diff))}s
                                        {trends.pace.positive ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Baseline Week</div>
                                )}
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>vs. last week</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts - Stacked Vertically */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--secondary-color)', fontWeight: '600' }}>Distance Trend</h3>
                    <div style={{ height: '300px' }}>
                        <Bar data={distanceData} options={{ ...options, maintainAspectRatio: false }} />
                    </div>
                </div>
                <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--secondary-color)', fontWeight: '600' }}>Pace Trend</h3>
                    <div style={{ height: '300px' }}>
                        <Bar data={paceData} options={{ ...paceOptions, maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsCharts;
