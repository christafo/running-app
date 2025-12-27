import { Bar } from 'react-chartjs-2';
import { useRouteHelpers } from '../../hooks/useRouteHelpers';

export const PaceChart = ({ sortedRuns, routes }) => {
    const { getRouteName } = useRouteHelpers(routes);

    const labels = sortedRuns.map(r => new Date(r.date).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric'
    }));

    const validPaceRuns = sortedRuns.filter(r => r.pace && r.pace.includes(':'));
    const avgPaceDecimal = validPaceRuns.length > 0
        ? validPaceRuns.reduce((acc, r) => {
            const [m, s] = r.pace.split(':').map(Number);
            return acc + (m + s / 60);
        }, 0) / validPaceRuns.length
        : 0;

    const data = {
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

    const paces = sortedRuns.map(r => {
        if (!r.pace || !r.pace.includes(':')) return avgPaceDecimal;
        const [m, s] = r.pace.split(':').map(Number);
        return m + s / 60;
    }).filter(p => p > 0);

    const minP = Math.min(...paces);
    const maxP = Math.max(...paces);

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
                            const m = Math.floor(context.parsed.y);
                            const s = Math.round((context.parsed.y - m) * 60);
                            return `Average Pace: ${m}:${s.toString().padStart(2, '0')}/km`;
                        }
                        const mins = Math.floor(context.parsed.y);
                        const secs = Math.round((context.parsed.y - mins) * 60);
                        return [
                            `Pace: ${mins}:${secs.toString().padStart(2, '0')}/km`,
                            `Distance: ${parseFloat(run.distance).toFixed(2)} km`,
                            `Time: ${run.duration}`
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
                min: Math.max(0, minP - 0.25), // 15 seconds buffer
                max: maxP + 0.25,
                ticks: {
                    callback: (value) => {
                        const m = Math.floor(value);
                        const s = Math.round((value - m) * 60);
                        return `${m}:${s.toString().padStart(2, '0')}`;
                    }
                }
            }
        }
    };

    return (
        <div style={{ height: '350px', paddingBottom: '10px' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', color: 'var(--secondary-color)', fontWeight: '600' }}>Pace Trend</h3>
            <Bar data={data} options={options} />
        </div>
    );
};
