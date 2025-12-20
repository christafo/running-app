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
    // Group runs by Week Number (ISO)
    const getWeekKey = (d) => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        // Thursday in current week decides the year.
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        // Adjust to Thursday in week 1 and count number of weeks from date to week1.
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    };

    // Simple helper: Get stats for a set of runs
    const getStats = (runSet) => {
        if (!runSet || runSet.length === 0) return { dist: 0, seconds: 0, pace: 0 };
        const totalDist = runSet.reduce((acc, r) => acc + parseFloat(r.distance), 0);
        const totalSecs = runSet.reduce((acc, r) => acc + r.totalSeconds, 0);
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
        const paceDiff = curStats.paceSeconds - prevStats.paceSeconds; // Negative is faster (good)

        trends = {
            dist: {
                current: curStats.dist.toFixed(1),
                diff: distDiff,
                positive: distDiff >= 0 // More distance is usually good
            },
            pace: {
                current: calculatePace(1, curStats.paceSeconds), // Normalized pace
                diff: paceDiff,
                positive: paceDiff <= 0 // Lower pace is good
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>

                    {/* Distance Card */}
                    <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>This Week Distance</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{trends.dist.current} km</span>
                            <span style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: trends.dist.positive ? '#16a34a' : '#ef4444',
                                display: 'flex', alignItems: 'center'
                            }}>
                                {trends.dist.diff > 0 ? '+' : ''}{trends.dist.diff.toFixed(1)} km
                                {trends.dist.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            </span>
                        </div>
                    </div>

                    {/* Pace Card */}
                    <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Avg Pace (Week)</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{trends.pace.current}</span>
                            <span style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: trends.pace.positive ? '#16a34a' : '#ef4444',
                                display: 'flex', alignItems: 'center'
                            }}>
                                {trends.pace.diff <= 0 ? '' : '+'}{Math.round(trends.pace.diff)}s/km
                                {/* Logic: Negative diff means we got faster (Green), so ArrowUp? Or ArrowDown? usually "Down" on pace is good physically but "Up" visually means improvement? Let's stick to color: Green = Good. */}
                                {trends.pace.positive ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                            </span>
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
