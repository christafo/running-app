import { Bar } from 'react-chartjs-2';
import { useRouteHelpers } from '../../hooks/useRouteHelpers';

export const DistanceChart = ({ sortedRuns, routes }) => {
    const { getRouteName } = useRouteHelpers(routes);

    const labels = sortedRuns.map(r => new Date(r.date).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric'
    }));

    const avgDistance = sortedRuns.length > 0
        ? sortedRuns.reduce((acc, r) => acc + parseFloat(r.distance), 0) / sortedRuns.length
        : 0;

    const data = {
        labels,
        datasets: [
            {
                type: 'bar',
                label: 'Distance',
                data: sortedRuns.map(r => r.distance),
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: '#3b82f6',
                borderWidth: 1,
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

    const distances = sortedRuns.map(r => parseFloat(r.distance));
    const minD = Math.min(...distances);
    const maxD = Math.max(...distances);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    title: (context) => {
                        const run = sortedRuns[context[0].dataIndex];
                        return new Date(run.date).toLocaleDateString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric'
                        });
                    },
                    afterTitle: (context) => {
                        const run = sortedRuns[context[0].dataIndex];
                        return getRouteName(run.route_id);
                    },
                    label: (context) => {
                        const run = sortedRuns[context.dataIndex];
                        if (context.dataset.label === 'Average') {
                            return `Average: ${context.formattedValue} km`;
                        }
                        return [
                            `Distance: ${parseFloat(run.distance).toFixed(2)} km`,
                            `Time: ${run.duration}`,
                            `Pace: ${run.pace}/km`
                        ];
                    }
                }
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: {
                grid: { color: '#f1f5f9' },
                beginAtZero: false,
                min: Math.max(0, Math.floor(minD - 1)),
                max: Math.ceil(maxD + 1)
            }
        }
    };

    return (
        <div style={{ height: '300px' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--secondary-color)', fontWeight: '600' }}>Distance Trend</h3>
            <Bar data={data} options={options} />
        </div>
    );
};
