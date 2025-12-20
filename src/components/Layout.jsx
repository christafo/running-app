import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, PlusCircle, Map, TrendingUp, LogOut } from 'lucide-react';
import { MonitorPlay } from 'lucide-react'; // Placeholder icon for header

const Layout = ({ children }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    const navItems = [
        { path: '/', label: 'Log', icon: PlusCircle }, // Log is now Home
        { path: '/routes', label: 'Routes', icon: Map },
        { path: '/stats', label: 'Stats', icon: LayoutDashboard },
        { path: '/trends', label: 'Trends', icon: TrendingUp },
        { path: '/history', label: 'History', icon: History },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--background-color)',
            fontFamily: 'var(--font-sans)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center' // Center for desktop 'mobile' view
        }}>

            {/* Mobile Container Limit */}
            <div style={{
                width: '100%',
                maxWidth: '800px', // Wider than mobile but constrained
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                backgroundColor: 'var(--background-color)'
            }}>

                {/* Header */}
                <header style={{
                    padding: '1.5rem 1rem 0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: '#f59e0b' }}>
                            {/* Running Icon Placeholder */}
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16" />
                                <path d="M20 10l-2.5-2.5" />
                                <path d="M9 10l.5-2.5L12 5h5" />
                                <circle cx="15" cy="2" r="2" />
                            </svg>
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--primary-color)' }}>Running Tracker</h1>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Track progress, analyze performance</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        title="Log Out"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <LogOut size={20} />
                    </button>
                </header>

                {/* Tab Navigation */}
                <nav style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#e2e8f0', // Light gray background for the pills container
                    margin: '0.5rem 1rem 1.5rem 1rem',
                    borderRadius: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                flex: 1,
                                textAlign: 'center',
                                padding: '0.5rem 0',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                borderRadius: '1.5rem',
                                color: isActive ? 'var(--primary-color)' : 'var(--text-primary)',
                                backgroundColor: isActive ? 'var(--surface-color)' : 'transparent',
                                boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            })}
                        >
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Main Content */}
                <main style={{ flex: 1, padding: '0 1rem 2rem 1rem' }}>
                    {children}
                </main>

            </div>
        </div>
    );
};

export default Layout;
