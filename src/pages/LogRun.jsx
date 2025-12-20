import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRuns } from '../context/RunContext';
import { Calendar, MapPin, Clock, Zap } from 'lucide-react';

const LogRun = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { routes, addRun } = useRuns();

    // Pre-fill route if passed from Routes page
    const initialRouteId = location.state?.routeId || '';

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        routeId: initialRouteId,
        distance: '',
        durationHours: 0,
        durationMinutes: 0,
        durationSeconds: 0,
        effort: '3', // 1-5 scale
        notes: ''
    });

    // Handle route change to pre-fill distance
    useEffect(() => {
        if (formData.routeId && formData.routeId !== 'custom') {
            const selectedRoute = routes.find(r => r.id === formData.routeId);
            if (selectedRoute) {
                setFormData(prev => ({
                    ...prev,
                    distance: selectedRoute.distance
                }));
            }
        }
    }, [formData.routeId, routes]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTimeChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Calculate total seconds
        const totalSeconds =
            (Number(formData.durationHours) * 3600) +
            (Number(formData.durationMinutes) * 60) +
            Number(formData.durationSeconds);

        // Check reasonable duration
        if (totalSeconds === 0) {
            alert("Please enter a valid time");
            return;
        }

        // Format duration string for display
        const h = formData.durationHours > 0 ? `${formData.durationHours}:` : '';
        const m = formData.durationMinutes.toString().padStart(2, '0');
        const s = formData.durationSeconds.toString().padStart(2, '0');
        const duration = `${h}${m}:${s}`;

        const distanceNum = parseFloat(formData.distance);
        const paceSeconds = distanceNum > 0 ? totalSeconds / distanceNum : 0;

        const minutes = Math.floor(paceSeconds / 60);
        const seconds = Math.floor(paceSeconds % 60);
        const paceFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        addRun({
            date: formData.date,
            routeId: formData.routeId || null, // Ensure empty string becomes null
            distance: formData.distance,
            duration: duration,
            pace: paceFormatted,
            totalSeconds,
            notes: formData.notes,
            effort: parseInt(formData.effort)
        });

        navigate('/history');
    };

    const inputStyle = {
        backgroundColor: '#f1f5f9',
        border: 'none',
        padding: '1rem',
        borderRadius: '0.75rem',
        width: '100%',
        fontSize: '1rem',
        color: 'var(--text-primary)',
        fontWeight: '500'
    };

    const labelStyle = {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: 'var(--text-primary)',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '1.5rem' }}>📝</div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--primary-color)' }}>Log a Run</h1>
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '1rem' }}>

                {/* Route Selection */}
                <div>
                    <label style={labelStyle}><MapPin size={16} color="#3b82f6" /> Route</label>
                    <select
                        name="routeId"
                        value={formData.routeId}
                        onChange={handleChange}
                        style={inputStyle}
                    >
                        <option value="">No Route (Manual Entry)</option>
                        {routes.map(route => (
                            <option key={route.id} value={route.id}>
                                {route.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date Input */}
                <div>
                    <label style={labelStyle}><Calendar size={16} color="#8b5cf6" /> Date</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        style={inputStyle}
                        required
                    />
                </div>

                {/* Time Input Group */}
                <div>
                    <label style={labelStyle}><Clock size={16} color="#6366f1" /> Time</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Hours</label>
                            <input
                                type="number" min="0"
                                value={formData.durationHours}
                                onChange={(e) => handleTimeChange('durationHours', e.target.value)}
                                style={{ ...inputStyle, textAlign: 'center' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Minutes</label>
                            <input
                                type="number" min="0" max="59"
                                value={formData.durationMinutes}
                                onChange={(e) => handleTimeChange('durationMinutes', e.target.value)}
                                style={{ ...inputStyle, textAlign: 'center' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Seconds</label>
                            <input
                                type="number" min="0" max="59"
                                value={formData.durationSeconds}
                                onChange={(e) => handleTimeChange('durationSeconds', e.target.value)}
                                style={{ ...inputStyle, textAlign: 'center' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Effort Level */}
                <div>
                    <label style={labelStyle}><span style={{ fontSize: '1rem' }}>💪</span> Effort Level</label>
                    <select
                        name="effort"
                        value={formData.effort}
                        onChange={handleChange}
                        style={inputStyle}
                    >
                        <option value="1">😌 1 - Easy</option>
                        <option value="2">🙂 2 - Light</option>
                        <option value="3">😐 3 - Moderate</option>
                        <option value="4">😓 4 - Hard</option>
                        <option value="5">🥵 5 - Maximum</option>
                    </select>
                </div>

                <button
                    type="submit"
                    className="btn"
                    style={{
                        marginTop: '0.5rem',
                        backgroundColor: '#0f172a',
                        color: 'white',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    ✅ Log Run
                </button>

            </form>
        </div>
    );
};

export default LogRun;
