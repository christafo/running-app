import { useRuns } from '../context/RunContext';
import { Trash2, Upload, Edit3, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getWeekIdentifier } from '../utils/dateUtils';
import { useState } from 'react';
import { EFFORT_LEVELS, getEffortEmoji } from '../constants/effort';
import { useRouteHelpers } from '../hooks/useRouteHelpers';

const RunHistory = () => {
    const { runs, routes, deleteRun, updateRun } = useRuns();
    const [editingCell, setEditingCell] = useState(null); // { runId, field }
    const { getRouteName } = useRouteHelpers(routes);

    const handleRouteChange = async (runId, newRouteId) => {
        await updateRun(runId, { route_id: newRouteId });
        setEditingCell(null);
    };

    const handleEffortChange = async (runId, newEffort) => {
        await updateRun(runId, { effort: newEffort });
        setEditingCell(null);
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
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--background-color)' }}>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600', color: 'var(--secondary-color)' }}>Week</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600', color: 'var(--secondary-color)' }}>Date</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600', color: 'var(--secondary-color)', minWidth: '200px' }}>Route</th>
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
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    No runs logged yet.
                                </td>
                            </tr>
                        ) : (
                            runs.map(run => (
                                <tr key={run.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.75rem' }}>{getWeekNumber(run.date)}</td>
                                    <td style={{ padding: '0.75rem' }}>{new Date(run.date.includes('T') ? run.date : run.date + 'T00:00:00').toLocaleDateString()}</td>

                                    {/* Route Cell */}
                                    <td
                                        style={{ padding: '0.75rem', minWidth: '200px', cursor: 'pointer', position: 'relative' }}
                                        onClick={() => !editingCell && setEditingCell({ runId: run.id, field: 'route_id' })}
                                    >
                                        {editingCell?.runId === run.id && editingCell?.field === 'route_id' ? (
                                            <select
                                                autoFocus
                                                value={run.route_id || ''}
                                                onChange={(e) => handleRouteChange(run.id, e.target.value)}
                                                onBlur={() => setTimeout(() => setEditingCell(null), 200)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.4rem',
                                                    border: '1px solid var(--primary-color)',
                                                    borderRadius: '0.4rem',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <option value="">Select Route...</option>
                                                {routes.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                                                <span style={{ color: run.route_id ? 'inherit' : 'var(--text-secondary)', fontStyle: run.route_id ? 'normal' : 'italic' }}>
                                                    {getRouteName(run.route_id)}
                                                </span>
                                                <Edit3 size={14} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                                            </div>
                                        )}
                                    </td>

                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{Number(run.distance).toFixed(2)}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{run.duration}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{run.pace}</td>

                                    {/* Effort Cell */}
                                    <td
                                        style={{ padding: '0.75rem', textAlign: 'center', cursor: 'pointer' }}
                                        onClick={() => !editingCell && setEditingCell({ runId: run.id, field: 'effort' })}
                                    >
                                        {editingCell?.runId === run.id && editingCell?.field === 'effort' ? (
                                            <select
                                                autoFocus
                                                value={run.effort || ''}
                                                onChange={(e) => handleEffortChange(run.id, e.target.value)}
                                                onBlur={() => setTimeout(() => setEditingCell(null), 200)}
                                                style={{
                                                    padding: '0.4rem',
                                                    border: '1px solid var(--primary-color)',
                                                    borderRadius: '0.4rem',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <option value="">-</option>
                                                {EFFORT_LEVELS.map(lvl => (
                                                    <option key={lvl.value} value={lvl.value}>{lvl.emoji} {lvl.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                                                <span>{getEffortEmoji(run.effort)}</span>
                                                <Edit3 size={12} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
                                            </div>
                                        )}
                                    </td>

                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteRun(run.id); }}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
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
