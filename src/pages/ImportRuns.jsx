import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { parse, isValid } from 'date-fns';
import { calculatePace, parseDurationToSeconds } from '../utils/calculations';
import { useRuns } from '../context/RunContext';
import { getWeekIdentifier } from '../utils/dateUtils';
import { Upload, AlertCircle, Check, ArrowRight, Save, X, Info } from 'lucide-react';

const ImportRuns = () => {
    const navigate = useNavigate();
    // const { addRun } = useRuns(); // Duplicate removed

    // Steps: 'upload' -> 'map' -> 'validate' -> 'importing'
    const [step, setStep] = useState('upload');
    const [rawData, setRawData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [columnMapping, setColumnMapping] = useState({
        date: '',
        distance: '',
        duration: '',
        effort: '',
    });
    const [dateFormat, setDateFormat] = useState('MM/dd/yyyy'); // Default US

    // New: Available Routes
    const { addRun, routes } = useRuns();
    const [processedData, setProcessedData] = useState([]);
    const [importStats, setImportStats] = useState({ success: 0, failed: 0 });

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    setRawData(results.data);
                    setHeaders(Object.keys(results.data[0]));
                    setStep('map');

                    // Auto-guess mapping
                    const keys = Object.keys(results.data[0]).map(k => k.toLowerCase());
                    const newMapping = { ...columnMapping };

                    Object.keys(results.data[0]).forEach(key => {
                        const lower = key.toLowerCase();
                        if (lower.includes('date') || lower.includes('time')) newMapping.date = key;
                        if (lower.includes('dist') || lower.includes('km') || lower.includes('mi')) newMapping.distance = key;
                        if (lower.includes('dur') || lower.includes('time') && !newMapping.duration) newMapping.duration = key;
                        if (lower.includes('note') || lower.includes('desc')) newMapping.notes = key;
                        if (lower.includes('effort') || lower.includes('intensity')) newMapping.effort = key;
                    });
                    setColumnMapping(newMapping);
                }
            },
            error: (err) => {
                console.error('CSV Parse Error:', err);
                alert('Failed to parse CSV file.');
            }
        });
    };

    const processData = () => {
        const processed = rawData.map((row, index) => {
            const dateStr = row[columnMapping.date];
            const distStr = row[columnMapping.distance];
            const durStr = row[columnMapping.duration];
            const notes = row[columnMapping.notes] || '';
            const effortStr = row[columnMapping.effort] || '';

            let status = 'valid';
            let errors = [];

            // Validate Date with Format
            let parsedDate;
            let formattedDate = dateStr;

            // 1. Try specific format chosen by user (Deteriminstic)
            if (dateFormat) {
                const rigorousDate = parse(dateStr, dateFormat, new Date());
                if (isValid(rigorousDate)) {
                    parsedDate = rigorousDate;
                }
            }

            // 2. Try common formats as fallback (Safest list)
            if (!parsedDate || !isValid(parsedDate)) {
                // If the user's date has slashes or dashes, try common variations
                const commonFormats = ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'dd/MM/yy', 'MM/dd/yy', 'dd-MM-yyyy', 'dd-MM-yy'];
                for (const fmt of commonFormats) {
                    const d = parse(dateStr, fmt, new Date());
                    if (isValid(d)) {
                        parsedDate = d;
                        break;
                    }
                }
            }

            // 3. Last ditch fallback: Browser's native parsing
            if (!parsedDate || !isValid(parsedDate)) {
                const d = new Date(dateStr);
                if (!isNaN(d.getTime())) {
                    parsedDate = d;
                }
            }

            if (!parsedDate || isNaN(parsedDate.getTime())) {
                status = 'error';
                errors.push('Invalid Date');
            } else {
                formattedDate = parsedDate.toISOString().split('T')[0];
            }

            // Validate Distance
            const distance = parseFloat(distStr);
            if (!distStr || isNaN(distance)) {
                status = 'error';
                errors.push('Invalid Distance');
            }

            return {
                id: index,
                original: row,
                dateDisplay: dateStr, // What user sees/edits
                dateISO: formattedDate, // What we save
                distance: distStr,
                duration: durStr,
                notes: notes,
                effort: effortStr,
                routeId: '', // Default to none
                status,
                errors
            };
        });

        setProcessedData(processed);
        setStep('validate');
    };

    const handleCellChange = (id, field, value) => {
        setProcessedData(prev => prev.map(row => {
            if (row.id === id) {
                const updated = { ...row, [field]: value };
                // Re-validate simple fields
                let newErrors = [];
                let newStatus = 'valid';

                if (field === 'dateDisplay') {
                    // Try to re-validate on edit
                    const rigorousDate = parse(value, dateFormat, new Date());
                    if (isValid(rigorousDate)) {
                        updated.dateISO = rigorousDate.toISOString().split('T')[0];
                    } else {
                        // Try fallback logic same as initial process
                        const commonFormats = ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'dd/MM/yy', 'MM/dd/yy', 'dd-MM-yyyy', 'dd-MM-yy'];
                        let found = false;
                        for (const fmt of commonFormats) {
                            const d = parse(value, fmt, new Date());
                            if (isValid(d)) {
                                updated.dateISO = d.toISOString().split('T')[0];
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            const d = new Date(value);
                            if (isNaN(d.getTime())) newErrors.push('Invalid Date');
                            else updated.dateISO = d.toISOString().split('T')[0];
                        }
                    }
                }
                if (field === 'distance') {
                    if (!value || isNaN(parseFloat(value))) newErrors.push('Invalid Distance');
                }

                if (newErrors.length > 0) newStatus = 'error';

                return { ...updated, status: newStatus, errors: newErrors };
            }
            return row;
        }));
    };

    const handleImport = async () => {
        setStep('importing');
        let successCount = 0;

        for (const row of processedData) {
            if (row.status === 'valid') {
                try {
                    const dist = parseFloat(row.distance);
                    const dur = row.duration;
                    const totalSeconds = parseDurationToSeconds(dur);
                    const pace = calculatePace(dist, totalSeconds);

                    await addRun({
                        date: row.dateISO || new Date().toISOString(), // Fallback
                        distance: dist,
                        duration: dur,
                        notes: row.notes,
                        routeId: row.routeId || null,
                        pace: pace,
                        totalSeconds: totalSeconds,
                        effort: parseInt(row.effort) || null
                    });
                    successCount++;
                } catch (e) {
                    console.error('Import failed for row', row, e);
                }
            }
        }

        setImportStats({ success: successCount, failed: processedData.length - successCount });
        setStep('complete');
    };

    return (
        <div style={{ paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Upload size={24} style={{ color: 'var(--primary-color)' }} />
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--primary-color)' }}>Import Runs</h1>
            </div>

            {step === 'upload' && (
                <div className="card" style={{ padding: '3rem', border: '2px dashed var(--border-color)', borderRadius: '1rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        id="csv-upload"
                    />
                    <label htmlFor="csv-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: '#dbeafe', color: '#3b82f6' }}>
                            <Upload size={32} />
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>Select CSV File to Upload</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Drag and drop or click to browse</span>
                    </label>
                </div>
            )}

            {step === 'map' && (
                <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '1rem', backgroundColor: 'white' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>Map Columns</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Match your CSV columns to the app fields.</p>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {Object.keys(columnMapping).map((field) => (
                            <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: '600', textTransform: 'capitalize' }}>{field}</label>
                                <select
                                    value={columnMapping[field]}
                                    onChange={(e) => setColumnMapping(prev => ({ ...prev, [field]: e.target.value }))}
                                    style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                                >
                                    <option value="">Select Column...</option>
                                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                        ))}

                        {/* Date Format Selection */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '0.5rem', border: '1px solid #ffedd5' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold', color: '#c2410c' }}>
                                <Info size={16} /> Date Format in CSV
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#9a3412', margin: 0 }}>
                                Tell us how dates look in your file to ensure week numbers (currently incorrect) are fixed.
                            </p>
                            <select
                                value={dateFormat}
                                onChange={(e) => setDateFormat(e.target.value)}
                                style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #fdba74', backgroundColor: 'white' }}
                            >
                                <option value="MM/dd/yyyy">MM/DD/YYYY (US - e.g. 12/06 is Dec 6)</option>
                                <option value="dd/MM/yyyy">DD/MM/YYYY (Intl - e.g. 12/06 is June 12)</option>
                                <option value="yyyy-MM-dd">YYYY-MM-DD (Standard)</option>
                                <option value="dd-MM-yyyy">DD-MM-YYYY</option>
                                <option value="MM-dd-yyyy">MM-DD-YYYY</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={processData}
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                    >
                        Next: Validate Data <ArrowRight size={16} />
                    </button>
                </div>
            )}

            {step === 'validate' && (
                <div>
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Review & Fix ({processedData.length})</h3>
                        <button
                            onClick={handleImport}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Save size={16} /> Import Valid Rows
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Date</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Week</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Distance</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Duration</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Notes</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedData.map((row) => (
                                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: row.status === 'error' ? '#fef2f2' : 'white' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            {row.status === 'error' ? (
                                                <div title={row.errors.join(', ')} style={{ color: '#ef4444', cursor: 'help' }}><AlertCircle size={18} /></div>
                                            ) : (
                                                <div style={{ color: '#10b981' }}><Check size={18} /></div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <input
                                                type="text"
                                                value={row.dateDisplay}
                                                onChange={(e) => handleCellChange(row.id, 'dateDisplay', e.target.value)}
                                                style={{ border: row.errors.includes('Invalid Date') ? '1px solid #ef4444' : '1px solid #e2e8f0', padding: '0.25rem', borderRadius: '0.25rem', width: '120px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {row.status === 'valid' ? getWeekIdentifier(row.dateISO) : '-'}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <input
                                                type="text"
                                                value={row.distance}
                                                onChange={(e) => handleCellChange(row.id, 'distance', e.target.value)}
                                                style={{ border: row.errors.includes('Invalid Distance') ? '1px solid #ef4444' : '1px solid #e2e8f0', padding: '0.25rem', borderRadius: '0.25rem', width: '80px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <input
                                                type="text"
                                                value={row.duration}
                                                onChange={(e) => handleCellChange(row.id, 'duration', e.target.value)}
                                                style={{ border: '1px solid #e2e8f0', padding: '0.25rem', borderRadius: '0.25rem', width: '80px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <input
                                                type="text"
                                                value={row.notes}
                                                onChange={(e) => handleCellChange(row.id, 'notes', e.target.value)}
                                                style={{ border: '1px solid #e2e8f0', padding: '0.25rem', borderRadius: '0.25rem', width: '150px' }}
                                            />
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <button
                                                onClick={() => setProcessedData(prev => prev.filter(p => p.id !== row.id))}
                                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {step === 'complete' && (
                <div className="card" style={{ padding: '3rem', border: '1px solid var(--border-color)', borderRadius: '1rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a' }}>
                            <Check size={32} />
                        </div>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'var(--primary-color)' }}>Import Complete</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Successfully imported <b>{importStats.success}</b> runs.
                        {importStats.failed > 0 && <span style={{ color: '#ef4444' }}> ({importStats.failed} rows skipped)</span>}
                    </p>
                    <button onClick={() => navigate('/history')} className="btn btn-primary">Go to History</button>
                </div>
            )}
        </div>
    );
};

export default ImportRuns;
