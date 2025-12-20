import { useParams, useNavigate } from 'react-router-dom';
import { useRuns } from '../context/RunContext';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { Map, MapPin, ArrowLeft, TrendingUp, Clock, History, Award } from 'lucide-react';

// Reusing helper components from Routes.jsx
const MapBounds = ({ coordinates }) => {
    const map = useMap();
    useEffect(() => {
        if (coordinates && coordinates.length > 0) {
            map.fitBounds(coordinates, { padding: [20, 20] });
        }
    }, [coordinates, map]);
    return null;
};

const ResizeMap = () => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 200);
    }, [map]);
    return null;
};

const RouteDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { routes, runs } = useRuns();

    const route = routes.find(r => r.id === id);
    const routeRuns = runs.filter(r => r.route_id === id);

    if (!route) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h3>Route not found</h3>
                <button onClick={() => navigate('/routes')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Back to Routes
                </button>
            </div>
        );
    }

    // Calculate Summary Stats
    const totalRuns = routeRuns.length;

    const validRuns = routeRuns.filter(r => r.total_seconds > 0);
    const bestRun = validRuns.length > 0
        ? validRuns.reduce((prev, curr) => (prev.total_seconds < curr.total_seconds ? prev : curr))
        : null;

    const avgPaceSecs = validRuns.length > 0
        ? validRuns.reduce((acc, curr) => acc + (curr.total_seconds / curr.distance), 0) / validRuns.length
        : 0;

    const formatPace = (secsPerKm) => {
        if (!secsPerKm) return '-';
        const mins = Math.floor(secsPerKm / 60);
        const secs = Math.round(secsPerKm % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button onClick={() => navigate('/routes')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: 'var(--primary-color)' }}>
                    {route.name}
                </h1>
            </div>

            {/* Top Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '50%', backgroundColor: '#dbeafe', color: '#1e40af' }}>
                        <History size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Runs</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{totalRuns}</div>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#166534' }}>
                        <Award size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Best Time</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{bestRun ? bestRun.duration : '-'}</div>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#92400e' }}>
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Avg Pace</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{formatPace(avgPaceSecs)}/km</div>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#475569' }}>
                        <MapPin size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Distance</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{route.distance.toFixed(2)} km</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                {/* Map Section */}
                <div className="card" style={{ padding: '0', overflow: 'hidden', height: 'fit-content' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '600' }}>Route Map</div>
                    <div style={{ height: '300px', width: '100%' }}>
                        {route.coordinates && route.coordinates.length > 0 ? (
                            <MapContainer
                                center={route.coordinates[0]}
                                zoom={14}
                                style={{ height: '100%', width: '100%' }}
                                scrollWheelZoom={false}
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Polyline positions={route.coordinates} color="#ef4444" weight={5} opacity={0.8} />
                                <MapBounds coordinates={route.coordinates} />
                                <ResizeMap />
                            </MapContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: 'var(--text-secondary)' }}>
                                <MapPin size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                <span>No GPS data for this route</span>
                            </div>
                        )}
                    </div>
                    {route.location && (
                        <div style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={14} /> {route.location}
                        </div>
                    )}
                </div>

                {/* History Section */}
                <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: '600' }}>Run History</div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ textAlign: 'left', padding: '0.75rem' }}>Date</th>
                                    <th style={{ textAlign: 'right', padding: '0.75rem' }}>Time</th>
                                    <th style={{ textAlign: 'right', padding: '0.75rem' }}>Pace</th>
                                    <th style={{ textAlign: 'center', padding: '0.75rem' }}>Effort</th>
                                </tr>
                            </thead>
                            <tbody>
                                {routeRuns.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No runs yet</td></tr>
                                ) : (
                                    routeRuns.map(run => (
                                        <tr key={run.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.75rem' }}>{new Date(run.date).toLocaleDateString()}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>{run.duration}</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>{run.pace}/km</td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                {run.effort ? ['😌', '🙂', '😐', '😓', '🥵'][run.effort - 1] : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RouteDetail;
