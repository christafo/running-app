import { useRuns } from '../context/RunContext';
import { AlertTriangle, Database, Info } from 'lucide-react';

const DbHealthBanner = () => {
    const { dbHealth } = useRuns();

    if (dbHealth.ok) return null;

    return (
        <div style={{
            backgroundColor: '#fff7ed',
            border: '1px solid #fdba74',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#c2410c' }}>
                <AlertTriangle size={20} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Database Schema Update Required</h3>
            </div>

            <p style={{ margin: 0, fontSize: '0.875rem', color: '#9a3412', lineHeight: '1.5' }}>
                It looks like your Supabase database is missing some required columns. This is likely why maps and some stats are not working correctly.
            </p>

            <div style={{ backgroundColor: '#ffedd5', padding: '0.75rem', borderRadius: '0.5rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 'bold', color: '#7c2d12', textTransform: 'uppercase' }}>Missing Columns Detected:</p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#7c2d12' }}>
                    {dbHealth.missingColumns.map((col, idx) => (
                        <li key={idx}>{col}</li>
                    ))}
                </ul>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: '#ea580c', borderTop: '1px solid #fed7aa', paddingTop: '0.75rem' }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                    To fix this, please run the SQL scripts <code>supabase_schema.sql</code> and <code>add_coordinates_column.sql</code> in your Supabase SQL Editor.
                </span>
            </div>
        </div>
    );
};

export default DbHealthBanner;
