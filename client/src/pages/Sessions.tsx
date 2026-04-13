import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Search, Eye, Trash2, Edit2 } from 'lucide-react';

export function Sessions() {
  const { getHeaders } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => { fetchSessions(); }, [getHeaders]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions', { headers: getHeaders() });
      const data = await res.json();
      setSessions(data);
      setTotalCount(data.length);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s =>
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginatedSessions = filteredSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this session?')) return;
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE', headers: getHeaders() });
      fetchSessions();
    } catch (error) { console.error('Failed to delete session:', error); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}><LoadingSpinner size="lg" /></div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-mono)' }}>Sessions</h2>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
          <input type="text" placeholder="Search sessions..." value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: '14px' }} />
        </div>

        {paginatedSessions.length > 0 ? (
          <table style={{ width: '100%' }}>
            <thead>
              <tr><th>ID</th><th>Title</th><th>Profile</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {paginatedSessions.map(session => (
                <tr key={session.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{session.id.slice(0, 12)}...</td>
                  <td>{session.title || 'Untitled'}</td>
                  <td>{session.profile}</td>
                  <td>{new Date(session.timestamp).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="button-xs" title="View"><Eye size={16} /></button>
                      <button className="button-xs" title="Edit title"><Edit2 size={16} /></button>
                      <button className="button-xs button-danger" onClick={() => handleDelete(session.id)} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>No sessions found</p>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
            <button className="button-sm button-secondary" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} className={`button-sm ${currentPage === page ? '' : 'button-secondary'}`} onClick={() => setCurrentPage(page)}>{page}</button>
            ))}
            <button className="button-sm button-secondary" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>Next</button>
          </div>
        )}

        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Showing {paginatedSessions.length} of {filteredSessions.length} sessions (Total: {totalCount})
        </div>
      </div>
    </div>
  );
}
