import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BarChart3, Users, DollarSign } from 'lucide-react';

export function Analytics() {
  const { getHeaders } = useAuth();
  const [usage, setUsage] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [models, setModels] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => { fetchData(); }, [days, getHeaders]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usageRes, summaryRes, modelsRes] = await Promise.all([
        fetch(`/api/analytics/usage?days=${days}`, { headers: getHeaders() }),
        fetch('/api/analytics/summary', { headers: getHeaders() }),
        fetch('/api/analytics/models', { headers: getHeaders() })
      ]);
      const [usageData, summaryData, modelsData] = await Promise.all([usageRes.json(), summaryRes.json(), modelsRes.json()]);
      setUsage(usageData); setSummary(summaryData); setModels(modelsData);
    } catch (error) { console.error('Failed to fetch analytics:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}><LoadingSpinner size="lg" /></div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart3 size={24} />Analytics</h2>

      <div className="grid grid-4" style={{ marginBottom: '20px' }}>
        <div className="card">
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Total Tokens</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{(summary?.totalTokens || 0).toLocaleString()}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}><Users size={14} style={{ display: 'inline', marginRight: '4px' }} />Sessions</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{summary?.totalSessions || 0}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Avg Tokens/Session</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{Math.round(summary?.avgTokensPerSession || 0).toLocaleString()}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}><DollarSign size={14} style={{ display: 'inline', marginRight: '4px' }} />Est. Cost</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>${(summary?.estimatedCost || 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-mono)' }}>Usage over time</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[7, 30, 90].map(d => (
              <button key={d} className={`button-sm ${days === d ? '' : 'button-secondary'}`} onClick={() => setDays(d)}>{d}d</button>
            ))}
          </div>
        </div>
        {usage.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '8px', height: '200px', padding: '20px 0' }}>
            {usage.map((day: any, i: number) => {
              const total = day.tokens_in + day.tokens_out;
              const max = Math.max(...usage.map((d: any) => d.tokens_in + d.tokens_out));
              const height = max > 0 ? (total / max) * 100 : 0;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '100%', height: `${height}%`, backgroundColor: 'var(--color-primary)', borderRadius: '2px', minHeight: '4px', cursor: 'pointer', transition: 'opacity 0.2s' }} title={`${total.toLocaleString()} tokens`}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'} />
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px' }}>No usage data available</p>}
      </div>

      {Object.keys(models).length > 0 && (
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>Token Usage by Model</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(models).map(([model, tokens]: [string, number]) => {
              const totalTokens = Object.values(models).reduce((a, b) => a + (b as number), 0) as number;
              const percentage = totalTokens > 0 ? (tokens / totalTokens) * 100 : 0;
              return (
                <div key={model}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span>{model}</span><span style={{ fontWeight: 600 }}>{tokens.toLocaleString()}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: 'var(--color-success)', transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
