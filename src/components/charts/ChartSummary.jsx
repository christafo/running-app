import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card } from '../ui/Card';

const SummaryCard = ({ title, icon: Icon, color, value, unit, trend }) => {
    return (
        <Card style={{ padding: '1.25rem' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: '700',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem'
            }}>
                <Icon size={14} /> {title}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ fontSize: '1.875rem', fontWeight: '800', color }}>
                        {value} <span style={{ fontSize: '1rem', fontWeight: '500' }}>{unit}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {title.includes('Pace') ? 'avg this week' : 'this week'}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {trend.hasPrev ? (
                        <div style={{
                            backgroundColor: trend.positive ? '#ecfdf5' : '#fef2f2',
                            color: trend.positive ? '#059669' : '#dc2626',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '2rem',
                            fontSize: '0.875rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}>
                            {title.includes('Distance')
                                ? `${trend.diff >= 0 ? '+' : ''}${trend.diff.toFixed(1)} km`
                                : `${trend.diff <= 0 ? '-' : '+'}${Math.round(Math.abs(trend.diff))}s`
                            }
                            {title.includes('Distance')
                                ? (trend.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />)
                                : (trend.positive ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />)
                            }
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Baseline Week</div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>vs. last week</div>
                </div>
            </div>
        </Card>
    );
};

export const ChartSummary = ({ trends }) => {
    if (!trends) return null;

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem'
        }}>
            <SummaryCard
                title="Weekly Distance Summary"
                icon={ArrowUpRight}
                color="var(--primary-color)"
                value={trends.dist.current}
                unit="km"
                trend={trends.dist}
            />
            <SummaryCard
                title="Weekly Pace Summary"
                icon={Minus}
                color="#ec4899"
                value={trends.pace.current}
                unit="/km"
                trend={trends.pace}
            />
        </div>
    );
};
