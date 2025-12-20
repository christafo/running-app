import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { calculatePace } from '../utils/calculations';
import { getWeekIdentifier } from '../utils/dateUtils';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const AnalyticsCharts = ({ runs }) => {
    // Sort chronological
    const sortedRuns = [...runs].sort((a, b) => new Date(a.date) - new Date(b.date));

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
        const currentWeekNum = getWeekKey(lastRunDate);
        const currentYear = lastRunDate.getFullYear(); // Simplification

        const currentWeekRuns = sortedRuns.filter(r => {
            const d = new Date(r.date);
            return getWeekKey(d) === currentWeekNum && d.getFullYear() === currentYear;
        });

        // Find previous week runs (roughly)
        // Note: strict calendrical previous week might be empty. 
        // Let's just look for weekNum - 1
        const prevWeekRuns = sortedRuns.filter(r => {
            const d = new Date(r.date);
            return getWeekKey(d) === (currentWeekNum - 1) && d.getFullYear() === currentYear;
        });

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

    const distanceData = {
        labels,
        datasets: [
            {
                label: 'Distance (km)',
                data: sortedRuns.map(r => r.distance),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.3,
            },
        ],
    };

    const paceData = {
        labels,
        datasets: [
            {
                label: 'Pace (min/km)',
                // Convert pace string MM:SS to decimal minutes for charting
                data: sortedRuns.map(r => {
                    if (!r.pace || !r.pace.includes(':')) return 0;
                    const [m, s] = r.pace.split(':').map(Number);
                    return m + s / 60;
                }),
                borderColor: '#ec4899',
                backgroundColor: 'rgba(236, 72, 153, 0.5)',
                tension: 0.3,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: false },
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
                        <Line data={distanceData} options={{ ...options, maintainAspectRatio: false }} />
                    </div>
                </div>
                <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--secondary-color)', fontWeight: '600' }}>Pace Trend</h3>
                    <div style={{ height: '300px' }}>
                        <Line data={paceData} options={{ ...paceOptions, maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsCharts;
