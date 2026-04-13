import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Agents() {
  const { getHeaders } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfiles();
    const interval = setInterval(fetchGatewayStatus, 3000);
    return () => clearInterval(interval);
  }, [getHeaders]);

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/agents/profiles', { headers: getHeaders() });
      setProfiles(await res.json());
      await fetchGatewayStatus();
    } catch (error) { console.error('Failed to fetch profiles:', error); }
    finally { setLoading(false); }
  };

  const fetchGatewayStatus = async () => {
    try {
      const res = await fetch('/api/agents/gateway/status', { headers: getHeaders() });
      setGatewayStatus(await res.json());
    } catch (error) { console.error('Failed to fetch gateway status:', error); }
  };

  const handleRestartGateway = async () => {
    try {
      await fetch('/api/agents/gateway/restart', { method: 'POST', headers: getHeaders(), body: JSON.stringify({}) });
      await fetchGatewayStatus();
    } catch (error) { console.error('Failed to restart gateway:', error); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}><LoadingSpinner size="lg" /></div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-mono)' }}>Agents & Profiles</h2>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>Gateway Status</h3>
        {gatewayStatus && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: gatewayStatus.running ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius)', color: gatewayStatus.running ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 500 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: gatewayStatus.running ? 'var(--color-success)' : 'var(--color-error)', display: 'inline-block' }} />
              {gatewayStatus.running ? `Running (PID ${gatewayStatus.pid})` : 'Stopped'}
            </span>
            <button onClick={handleRestartGateway}>
              {gatewayStatus.running ? 'Restart' : 'Start'} Gateway
            </button>
          </div>
        )}
      </div>

      <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>Profiles</h3>
      <div className="grid grid-2">
        {profiles.map(profile => (
          <div key={profile.name} className="card">
            <h4 style={{ fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>{profile.name}</h4>
            {profile.model && <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>Model: {profile.model}</p>}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="button-sm" onClick={() => { setSelectedProfile(profile); setShowModal(true); }}>Edit Config</button>
              {profile.name !== 'default' && <button className="button-sm button-danger">Delete</button>}
            </div>
          </div>
        ))}

        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '150px', cursor: 'pointer', backgroundColor: 'var(--color-bg-secondary)', border: '2px dashed var(--color-border)' }}>
          <button style={{ fontSize: '18px', background: 'none', color: 'var(--color-text-muted)' }}>+ New Profile</button>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Edit ${selectedProfile?.name} Config`}
        footer={<div className="button-group"><button className="button-secondary" onClick={() => setShowModal(false)}>Cancel</button><button onClick={() => setShowModal(false)}>Save</button></div>}>
        {selectedProfile && (
          <textarea defaultValue={JSON.stringify(selectedProfile, null, 2)}
            style={{ width: '100%', minHeight: '300px', fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
        )}
      </Modal>
    </div>
  );
}
