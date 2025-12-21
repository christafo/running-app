import { useRuns } from '../context/RunContext';
import AnalyticsCharts from '../components/AnalyticsCharts';
import { TrendingUp } from 'lucide-react';

const Trends = () => {
    const { runs, routes } = useRuns();

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <TrendingUp size={24} style={{ fill: '#e0e7ff', color: '#6366f1' }} />
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--primary-color)' }}>Weekly Trends</h1>
            </div>

            <div className="card" style={{ padding: '1.5rem 1rem' }}>
                {runs.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No runs logged yet. Start logging runs to see weekly trends.</p>
                ) : (
                    <AnalyticsCharts runs={runs} routes={routes} />
                )}
            </div>
        </div>
    );
};

export default Trends;
