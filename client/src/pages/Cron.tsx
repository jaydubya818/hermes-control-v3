import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Modal } from '../components/Modal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Clock, Play, Pause, Trash2, Plus } from 'lucide-react';

export function Cron() {
  const { getHeaders } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newJob, setNewJob] = useState({ name: '', schedule: '0 * * * *', command: '' });

  useEffect(() => { fetchJobs(); }, [getHeaders]);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/cron/', { headers: getHeaders() });
      setJobs(await res.json());
    } catch (error) { console.error('Failed to fetch cron jobs:', error); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    try {
      await fetch('/api/cron/', { method: 'POST', headers: getHeaders(), body: JSON.stringify(newJob) });
      setNewJob({ name: '', schedule: '0 * * * *', command: '' });
      setShowModal(false); fetchJobs();
    } catch (error) { console.error('Failed to create job:', error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this cron job?')) return;
    try { await fetch(`/api/cron/${id}`, { method: 'DELETE', headers: getHeaders() }); fetchJobs(); }
    catch (error) { console.error('Failed to delete job:', error); }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try { await fetch(`/api/cron/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ enabled: !enabled }) }); fetchJobs(); }
    catch (error) { console.error('Failed to toggle job:', error); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}><LoadingSpinner size="lg" /></div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={24} />Cron Jobs</h2>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={16} />New Job</button>
      </div>

      {jobs.length > 0 ? (
        <table className="card" style={{ width: '100%' }}>
          <thead><tr><th>Name</th><th>Schedule</th><th>Status</th><th>Last Run</th><th>Actions</th></tr></thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id}>
                <td style={{ fontWeight: 500 }}>{job.name}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{job.schedule}</td>
                <td>
                  <span className={`status-badge status-${job.enabled ? 'success' : 'idle'}`}>
                    <span className={`dot dot-${job.enabled ? 'success' : 'idle'}`} />
                    {job.enabled ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  {job.lastRun ? new Date(job.lastRun).toLocaleDateString() : 'Never'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="button-xs" onClick={() => handleToggle(job.id, job.enabled)}>
                      {job.enabled ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button className="button-xs button-danger" onClick={() => handleDelete(job.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <Clock size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>No cron jobs yet</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Cron Job"
        footer={<div className="button-group"><button className="button-secondary" onClick={() => setShowModal(false)}>Cancel</button><button onClick={handleCreate}>Create</button></div>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Job Name</label>
            <input type="text" value={newJob.name} onChange={e => setNewJob({ ...newJob, name: e.target.value })} placeholder="e.g., Daily Report" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Cron Expression</label>
            <input type="text" value={newJob.schedule} onChange={e => setNewJob({ ...newJob, schedule: e.target.value })} placeholder="0 * * * * (every hour)" style={{ width: '100%' }} />
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>Format: minute hour day month weekday</p>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Command</label>
            <input type="text" value={newJob.command} onChange={e => setNewJob({ ...newJob, command: e.target.value })} placeholder="hermes run my-skill" style={{ width: '100%' }} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
