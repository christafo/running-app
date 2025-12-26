import { useNavigate } from 'react-router-dom';
import { useRuns } from '../context/RunContext';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import { useState, useEffect, useCallback } from 'react';
import { Map, ExternalLink, Plus, Loader2, Edit2, Check, X, MapPin } from 'lucide-react';
import L from 'leaflet';
import { parseDurationToSeconds } from '../utils/calculations';
import { parseGPX } from '../services/gpx';
import { fetchLocationName } from '../services/location';

// Fix for default Leaflet icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to fit map bounds to route
const MapBounds = ({ coordinates }) => {
    const map = useMap();
    useEffect(() => {
        if (coordinates && coordinates.length > 0) {
            map.fitBounds(coordinates, { padding: [20, 20] });
            setTimeout(() => map.invalidateSize(), 100);
        }
    }, [coordinates, map]);
    return null;
};

// Component to force map resize on initial load
const ResizeMap = () => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 200);
    }, [map]);
    return null;
};

const RoutesPage = () => {
    const { routes, runs, addRoute, deleteRoute, updateRoute, clearAllRoutes } = useRuns();
    const navigate = useNavigate();

    const [isAdding, setIsAdding] = useState(false);
    const [newRouteName, setNewRouteName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [calculatedDistance, setCalculatedDistance] = useState(null);
    const [coordinates, setCoordinates] = useState([]);
    const [detectedLocation, setDetectedLocation] = useState(null);
    const [editingRouteId, setEditingRouteId] = useState(null);
    const [editName, setEditName] = useState('');

    // Helper: Calculate Stats for a specific route
    const getRouteStats = useCallback((routeId) => {
        const routeRuns = runs.filter(r => r.route_id === routeId);
        if (routeRuns.length === 0) return null;

        const processedRuns = routeRuns.map(run => {
            if (!run.total_seconds || run.total_seconds <= 0) {
                return { ...run, total_seconds: parseDurationToSeconds(run.duration) };
            }
            return run;
        });

        const lastRun = processedRuns[0];
        const validRuns = processedRuns.filter(r => r.total_seconds > 0);
        const bestRun = validRuns.length > 0
            ? validRuns.reduce((prev, curr) => (prev.total_seconds < curr.total_seconds ? prev : curr))
            : null;

        return {
            totalRuns: processedRuns.length,
            lastRunDate: new Date(lastRun.date).toLocaleDateString(),
            bestTime: bestRun ? bestRun.duration : '-',
            bestPace: bestRun ? bestRun.pace : '-',
        };
    }, [runs]);

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete route "${name}"? This action cannot be undone.`)) {
            await deleteRoute(id);
        }
    };

    const handleSaveEdit = async (routeId) => {
        if (!editName.trim()) return;
        await updateRoute(routeId, { name: editName });
        setEditingRouteId(null);
    };

    const handleClearAll = async () => {
        if (window.confirm('Are you sure you want to delete ALL routes? This will also unlink them from all runs in your history.')) {
            await clearAllRoutes();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsProcessing(true);
            try {
                const text = await file.text();
                const { coordinates: parsedCoords, distance } = parseGPX(text);

                setCalculatedDistance(distance);
                setCoordinates(parsedCoords);

                // Fetch Location
                const firstPoint = parsedCoords[0];
                const loc = await fetchLocationName(firstPoint[0], firstPoint[1]);
                if (loc) setDetectedLocation(loc);

                // Auto-suggest name if empty
                if (!newRouteName) {
                    setNewRouteName(file.name.replace('.gpx', ''));
                }
            } catch (error) {
                console.error("Error processing GPX:", error);
                alert(error.message || "Failed to parse GPX file.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleSaveRoute = async (e) => {
        e.preventDefault();
        if (!newRouteName || calculatedDistance === null) return;

        await addRoute({
            name: newRouteName,
            distance: calculatedDistance,
            coordinates: coordinates,
            location: detectedLocation
        });

        // Reset Form
        setIsAdding(false);
        setNewRouteName('');
        setCalculatedDistance(null);
        setCoordinates([]);
        setDetectedLocation(null);
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Map size={24} style={{ fill: '#dbeafe', color: '#3b82f6' }} />
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--primary-color)' }}>Available Routes</h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {routes.length > 0 && routes.every(r => !r.coordinates) && (
                        <button
                            onClick={async () => {
                                setIsProcessing(true);
                                // Seed a real map
                                await addRoute({
                                    name: 'South Beach Marina Loop',
                                    distance: 4.39,
                                    coordinates: [
                                        [25.7617, -80.1918], [25.7620, -80.1920], [25.7625, -80.1925], [25.7630, -80.1930],
                                        [25.7635, -80.1935], [25.7640, -80.1940], [25.7645, -80.1945], [25.7650, -80.1950],
                                        [25.7655, -80.1955], [25.7660, -80.1960], [25.7650, -80.1970], [25.7640, -80.1980],
                                        [25.7630, -80.1990], [25.7620, -80.2000], [25.7610, -80.2010], [25.7600, -80.2020]
                                    ],
                                    location: 'South Beach, Miami'
                                });
                                setIsProcessing(false);
                            }}
                            className="btn"
                            style={{ fontSize: '0.8rem', backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #6ee7b7' }}
                        >
                            Enable Sample Map
                        </button>
                    )}
                    {routes.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Clear All
                        </button>
                    )}
                    {!isAdding && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                        >
                            <Plus size={16} /> Add Route
                        </button>
                    )}
                </div>
            </div>

            {isAdding && (
                <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '1rem', backgroundColor: '#f8fafc' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Add New Route</h3>
                    <form onSubmit={handleSaveRoute} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Upload GPX File</label>
                            <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                                <input
                                    type="file"
                                    accept=".gpx"
                                    onChange={handleFileChange}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        background: 'white',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                            </div>
                            {isProcessing && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--accent-color)', marginTop: '0.5rem' }}><Loader2 size={14} className="spin" /> Calculating distance...</div>}
                            {calculatedDistance !== null && !isProcessing && (
                                <div style={{ fontSize: '0.875rem', color: '#10b981', marginTop: '0.5rem', fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div>Calculated Distance: {calculatedDistance.toFixed(2)} km</div>
                                    {detectedLocation && <div style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>📍 {detectedLocation}</div>}
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Route Name</label>
                            <input
                                type="text"
                                value={newRouteName}
                                onChange={(e) => setNewRouteName(e.target.value)}
                                placeholder="e.g. Morning Jog"
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="btn"
                                style={{ flex: 1, backgroundColor: 'white', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!calculatedDistance || !newRouteName}
                                className="btn btn-primary"
                                style={{ flex: 1, opacity: (!calculatedDistance || !newRouteName) ? 0.5 : 1 }}
                            >
                                Save Route
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 600px), 1fr))', gap: '2rem' }}>
                {routes.map(route => (
                    <div key={route.id} className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '1rem', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', flex: 1 }}>
                            {/* Route Info */}
                            <div style={{ padding: '1.5rem', flex: '1 1 300px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    {editingRouteId === route.id ? (
                                        <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                style={{ flex: 1, padding: '0.25rem 0.5rem', borderRadius: '0.25rem', border: '1px solid var(--primary-color)' }}
                                                autoFocus
                                            />
                                            <button onClick={() => handleSaveEdit(route.id)} style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer' }}><Check size={18} /></button>
                                            <button onClick={() => setEditingRouteId(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={18} /></button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--primary-color)' }}>{route.name}</h3>
                                            <button
                                                onClick={() => startEditing(route)}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', opacity: 0.6 }}
                                                className="edit-btn"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                                            <Map size={16} />
                                        </div>
                                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{route.distance.toFixed(2)} km</span>
                                    </div>
                                    {route.location && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
                                                <MapPin size={16} />
                                            </div>
                                            <span>{route.location}</span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <button
                                        onClick={() => handleLogRun(route.id)}
                                        className="btn btn-primary"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            backgroundColor: 'var(--primary-color)',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        Log Run
                                    </button>
                                    <button
                                        onClick={() => navigate(`/routes/${route.id}`)}
                                        className="btn"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            backgroundColor: 'white',
                                            border: '1px solid var(--border-color)',
                                            color: 'var(--primary-color)',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        View Details
                                    </button>
                                    {route.map_link && (
                                        <a
                                            href={route.map_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                backgroundColor: 'white',
                                                border: '1px solid var(--border-color)',
                                                color: 'var(--text-primary)',
                                                textDecoration: 'none',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            <ExternalLink size={14} /> Map
                                        </a>
                                    )}
                                </div>

                                {/* Route Stats Section */}
                                {(() => {
                                    const stats = getRouteStats(route.id);
                                    if (stats) {
                                        return (
                                            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                                                    <div>
                                                        <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Best Time</div>
                                                        <div style={{ fontWeight: '700', color: '#10b981' }}>{stats.bestTime}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{stats.bestPace}/km</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Runs</div>
                                                        <div style={{ fontWeight: '700' }}>{stats.totalRuns}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Since {stats.lastRunDate}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div style={{ padding: '1rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            No runs recorded for this route yet.
                                        </div>
                                    );
                                })()}

                                <button
                                    onClick={() => handleDelete(route.id, route.name)}
                                    style={{
                                        marginTop: '1.5rem',
                                        background: 'none',
                                        border: 'none',
                                        color: '#ef4444',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        opacity: 0.6,
                                        width: '100%',
                                        textAlign: 'left'
                                    }}
                                >
                                    Delete Route
                                </button>
                            </div>

                            {/* Map Segment */}
                            <div style={{ flex: '1 1 300px', height: 'auto', minHeight: '250px', position: 'relative', borderLeft: '1px solid var(--border-color)' }}>
                                {(() => {
                                    let coords = route.coordinates;
                                    // Defensive parsing if coordinates is a string
                                    if (typeof coords === 'string') {
                                        try {
                                            coords = JSON.parse(coords);
                                        } catch (e) {
                                            coords = null;
                                        }
                                    }

                                    if (coords && Array.isArray(coords) && coords.length > 0) {
                                        return (
                                            <div style={{ height: '300px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                                                <MapContainer
                                                    key={`${route.id}-${coords.length}`}
                                                    center={coords[0]}
                                                    zoom={13}
                                                    scrollWheelZoom={false}
                                                    style={{ height: '300px', width: '100%', minHeight: '300px' }}
                                                    dragging={true}
                                                    zoomControl={true}
                                                >
                                                    <TileLayer
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                    />
                                                    <Polyline
                                                        positions={coords}
                                                        color="#ef4444"
                                                        weight={5}
                                                        opacity={0.8}
                                                    />
                                                    <MapBounds coordinates={coords} />
                                                    <ResizeMap />
                                                </MapContainer>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', backgroundColor: '#f1f5f9', padding: '1rem', textAlign: 'center' }}>
                                            <MapPin size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                            <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>No Map Data</span>
                                            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Upload a GPX file when adding a new route to see it here.</p>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoutesPage;
