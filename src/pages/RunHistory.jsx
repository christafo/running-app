import { useRuns } from '../context/RunContext';
import { Trash2, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getWeekIdentifier } from '../utils/dateUtils';

const RunHistory = () => {
    const { runs, routes, deleteRun } = useRuns();

    const getRouteName = (routeId) => {
        const route = routes.find(r => r.id === routeId);
        return route ? route.name : 'Custom Route';
    };

    const getWeekNumber = (dateString) => {
        return getWeekIdentifier(dateString);
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: 'var(--primary-color)' }}>
                    Run History
                </h1>
                <Link to="/import" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <Upload size={16} /> Import CSV
                </Link>
            </div>

            <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--background-color)' }}>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600', color: 'var(--secondary-color)' }}>Week</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600', color: 'var(--secondary-color)' }}>Date</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600', color: 'var(--secondary-color)' }}>Route</th>
                            <th style={{ textAlign: 'right', padding: '1rem', fontWeight: '600', color: 'var(--secondary-color)' }}>Distance (km)</th>
                            <th style={{ textAlign: 'right', padding: '1rem', fontWeight: '600', color: 'var(--secondary-color)' }}>Time</th>
                            <th style={{ textAlign: 'right', padding: '1rem', fontWeight: '600', color: 'var(--secondary-color)' }}>Pace (min/km)</th>
                            <th style={{ textAlign: 'center', padding: '1rem', fontWeight: '600', color: 'var(--secondary-color)' }}>Effort</th>
                            <th style={{ padding: '1rem' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {runs.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    No runs logged yet.
                                </td>
                            </tr>
                        ) : (
                            runs.map(run => (
                                <tr key={run.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>{getWeekNumber(run.date)}</td>
                                    <td style={{ padding: '1rem' }}>{new Date(run.date.includes('T') ? run.date : run.date + 'T00:00:00').toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>{getRouteName(run.route_id)}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>{Number(run.distance).toFixed(2)}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>{run.duration}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>{run.pace}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        {run.effort ? ['😌', '🙂', '😐', '😓', '🥵'][run.effort - 1] : '-'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => deleteRun(run.id)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                            title="Delete Run"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RunHistory;
