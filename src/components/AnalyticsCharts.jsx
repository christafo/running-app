import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    LineController,
    BarElement,
    BarController,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useFilteredRuns, useWeeklyTrends } from '../hooks/useAnalyticsData';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ChartSummary } from './charts/ChartSummary';
import { DistanceChart } from './charts/DistanceChart';
import { PaceChart } from './charts/PaceChart';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    LineController,
    BarElement,
    BarController,
    Title,
    Tooltip,
    Legend
);

const AnalyticsCharts = ({ runs, routes }) => {
    const [dateRange, setDateRange] = useState('last4weeks');
    const sortedRuns = useFilteredRuns(runs, dateRange);
    const trends = useWeeklyTrends(sortedRuns);

    if (sortedRuns.length < 2) {
        return (
            <Card style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                Not enough data to show trends. Log more runs!
            </Card>
        );
    }

    const DateFilterButton = ({ range, label, icon: Icon }) => (
        <Button
            variant={dateRange === range ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setDateRange(range)}
        >
            {Icon && <Icon size={14} />} {label}
        </Button>
    );

    return (
        <div>
            {/* Date Range Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <DateFilterButton range="last4weeks" label="Last 4 Weeks" icon={Calendar} />
                <DateFilterButton range="monthly" label="Monthly" />
                <DateFilterButton range="quarterly" label="Quarterly" />
                <DateFilterButton range="yearly" label="Yearly" />
            </div>

            {/* Weekly Analysis Cards */}
            <ChartSummary trends={trends} />

            {/* Charts - Stacked Vertically */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                <DistanceChart sortedRuns={sortedRuns} routes={routes} />
                <PaceChart sortedRuns={sortedRuns} routes={routes} />
            </div>
        </div>
    );
};

export default AnalyticsCharts;
