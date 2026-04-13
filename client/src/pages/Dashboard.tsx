import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';

export function Dashboard() {
  const { getHeaders } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [usage, setUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, gatewayRes, sessionsRes, usageRes] = await Promise.all([
          fetch('/api/system/metrics', { headers: getHeaders() }),
          fetch('/api/agents/gateway/status', { headers: getHeaders() }),
          fetch('/api/sessions', { headers: getHeaders() }),
          fetch('/api/analytics/usage?days=7', { headers: getHeaders() })
        ]);
        const [metricsData, gatewayData, sessionsData, usageData] = await Promise.all([
          metricsRes.json(), gatewayRes.json(), sessionsRes.json(), usageRes.json()
        ]);
        setMetrics(metricsData); setGatewayStatus(gatewayData);
        setSessions(sessionsData.slice(0, 5)); setUsage(usageData);
      } catch (error) { console.error('Failed to fetch dashboard data:', error); }
      finally { setLoading(false); }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [getHeaders]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}><LoadingSpinner size="lg" /></div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-mono)' }}>Dashboard</h2>

      <div className="grid grid-2" style={{ marginBottom: '20px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>System Metrics</h3>
          {metrics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>CPU Cores</label>
                <p style={{ fontSize: '18px', fontWeight: 600 }}>{metrics.cpu.cores}</p>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Memory Usage</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${metrics.memory.percentUsed}%`, backgroundColor: 'var(--color-primary)', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{metrics.memory.percentUsed.toFixed(1)}%</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Node Version</label>
                <p style={{ fontSize: '14px', fontWeight: 500 }}>{metrics.nodeVersion}</p>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>Gateway Status</h3>
          {gatewayStatus && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <StatusBadge status={gatewayStatus.running ? 'success' : 'error'} label={gatewayStatus.running ? 'Running' : 'Stopped'} />
              {gatewayStatus.running && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>PID</label>
                  <p style={{ fontSize: '14px', fontFamily: 'var(--font-mono)' }}>{gatewayStatus.pid}</p>
                </div>
              )}
              <button style={{ marginTop: '8px' }}>{gatewayStatus.running ? 'Restart' : 'Start'} Gateway</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>Recent Sessions</h3>
          {sessions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sessions.map((session: any) => (
                <div key={session.id} style={{ padding: '8px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius)', fontSize: '13px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{session.title || session.id.slice(0, 8)}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '2px' }}>{new Date(session.timestamp).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--color-text-muted)' }}>No sessions yet</p>}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>Token Usage (7d)</h3>
          {usage.length > 0 && (
            <div style={{ height: '200px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius)', padding: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {(usage.slice(-1)[0]?.tokens_in + usage.slice(-1)[0]?.tokens_out).toLocaleString()} tokens today
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '160px', marginTop: '12px' }}>
                {usage.map((day: any, i: number) => {
                  const total = day.tokens_in + day.tokens_out;
                  const max = Math.max(...usage.map((d: any) => d.tokens_in + d.tokens_out));
                  const height = max > 0 ? (total / max) * 100 : 0;
                  return <div key={i} style={{ flex: 1, height: `${height}%`, backgroundColor: 'var(--color-primary)', borderRadius: '2px', minHeight: '4px' }} title={`${total} tokens`} />;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
