import { useRuns } from '../context/RunContext';
import {
    Activity,
    Map,
    Calendar as CalendarIcon,
    Timer,
    Zap,
    TrendingUp,
    Award
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color = 'var(--primary-color)' }) => (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {Icon && <Icon size={14} />} {title}
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color }}>
            {value}
        </div>
    </div>
);

const Stats = () => {
    const { runs } = useRuns();

    if (runs.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Activity size={48} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
                <h2 style={{ color: 'var(--text-secondary)' }}>No runs logged yet</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Start running to see your performance stats!</p>
            </div>
        );
    }

    // --- Calculations ---
    const totalRuns = runs.length;
    const totalDistance = runs.reduce((acc, curr) => acc + Number(curr.distance), 0);
    const totalSecondsValue = runs.reduce((acc, curr) => acc + (curr.total_seconds || 0), 0);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    const formatPace = (secondsPerKm) => {
        if (!secondsPerKm || !isFinite(secondsPerKm)) return '0:00';
        const m = Math.floor(secondsPerKm / 60);
        const s = Math.floor(secondsPerKm % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const avgDistance = totalDistance / totalRuns;
    const avgPaceSeconds = totalDistance > 0 ? totalSecondsValue / totalDistance : 0;

    // Personal Bests
    const longestRun = Math.max(...runs.map(r => Number(r.distance)));

    // Fastest pace (minimum seconds per km)
    // Only count runs with a distance > 0 to avoid Infinity
    const validRunsForPace = runs.filter(r => Number(r.distance) > 0 && r.total_seconds > 0);
    const fastestPaceSeconds = validRunsForPace.length > 0
        ? Math.min(...validRunsForPace.map(r => r.total_seconds / Number(r.distance)))
        : 0;

    // Fastest 5k (if we have a run >= 5k)
    const fiveKRuns = validRunsForPace.filter(r => Number(r.distance) >= 5);
    const fastest5k = fiveKRuns.length > 0
        ? Math.min(...fiveKRuns.map(r => (r.total_seconds / Number(r.distance)) * 5))
        : null;

    // Avg Runs Per Week
    // Calculate weeks between first and last run
    const sortedDates = runs.map(r => new Date(r.date)).sort((a, b) => a - b);
    const firstRunDate = sortedDates[0];
    const lastRunDate = sortedDates[sortedDates.length - 1];
    const diffTime = Math.abs(lastRunDate - firstRunDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    const totalWeeks = Math.max(1, diffDays / 7);
    const avgRunsPerWeek = totalRuns / totalWeeks;

    // Max runs in a single calendar week
    const weeksMap = {};
    runs.forEach(r => {
        const d = new Date(r.date);
        // ISO Week logic roughly
        const tempDate = new Date(d.getTime());
        tempDate.setHours(0, 0, 0, 0);
        tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
        const week1 = new Date(tempDate.getFullYear(), 0, 4);
        const weekNo = 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        const key = `${tempDate.getFullYear()}-W${weekNo}`;
        weeksMap[key] = (weeksMap[key] || 0) + 1;
    });
    const maxRunsPerWeek = Math.max(...Object.values(weeksMap));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <TrendingUp size={24} style={{ color: 'var(--primary-color)' }} />
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--primary-color)' }}>Stats & PBs</h1>
            </div>

            <section>
                <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={18} /> Totals
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <StatCard title="Total Distance" value={`${totalDistance.toFixed(2)} km`} icon={Map} />
                    <StatCard title="Total Runs" value={totalRuns} icon={Activity} />
                    <StatCard title="Total Time" value={formatTime(totalSecondsValue)} icon={Timer} />
                </div>
            </section>

            <section>
                <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={18} /> Averages
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <StatCard title="Avg Pace" value={`${formatPace(avgPaceSeconds)}/km`} icon={Zap} />
                    <StatCard title="Avg Distance" value={`${avgDistance.toFixed(2)} km`} icon={Map} />
                    <StatCard title="Runs per Week" value={avgRunsPerWeek.toFixed(1)} icon={CalendarIcon} />
                </div>
            </section>

            <section>
                <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={18} /> Personal Bests
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <StatCard title="Longest Run" value={`${longestRun.toFixed(2)} km`} icon={TrendingUp} color="#16a34a" />
                    <StatCard title="Fastest Pace" value={`${formatPace(fastestPaceSeconds)}/km`} icon={Zap} color="#16a34a" />
                    {fastest5k && <StatCard title="Fastest 5k (est.)" value={formatTime(Math.round(fastest5k))} icon={Timer} color="#16a34a" />}
                    <StatCard title="Most Runs / Week" value={maxRunsPerWeek} icon={Activity} />
                </div>
            </section>
        </div>
    );
};

export default Stats;
