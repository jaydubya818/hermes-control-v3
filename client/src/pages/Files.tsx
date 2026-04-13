import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { FolderIcon, FileIcon, Save } from 'lucide-react';

export function Files() {
  const { getHeaders } = useAuth();
  const [tree, setTree] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState('~/.hermes');
  const [fileContent, setFileContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchTree(); }, [currentPath, getHeaders]);

  const fetchTree = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/files/tree?path=${encodeURIComponent(currentPath)}`, { headers: getHeaders() });
      setTree(await res.json());
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  };

  const handleFileSelect = async (path: string) => {
    try {
      const res = await fetch(`/api/files/read?path=${encodeURIComponent(path)}`, { headers: getHeaders() });
      const data = await res.json();
      setFileContent(data.content); setSelectedFile(path);
    } catch (err) { setError((err as Error).message); }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    try {
      await fetch('/api/files/write', { method: 'POST', headers: getHeaders(), body: JSON.stringify({ path: selectedFile, content: fileContent }) });
      setError(null); alert('File saved successfully');
    } catch (err) { setError((err as Error).message); }
  };

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>Files</h2>
      {error && <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
        <div style={{ width: '280px', backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', padding: '12px', overflowY: 'auto' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>{currentPath}</div>
          {loading ? <LoadingSpinner size="sm" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {tree.map((item: any) => (
                <div key={item.path}
                  onClick={() => item.type === 'file' ? handleFileSelect(item.path) : setCurrentPath(item.path)}
                  style={{ padding: '8px 12px', backgroundColor: selectedFile === item.path ? 'var(--color-bg-secondary)' : 'transparent', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-bg-secondary)'; }}
                  onMouseLeave={e => { if (selectedFile !== item.path) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                  {item.type === 'dir' ? <FolderIcon size={16} /> : <FileIcon size={16} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {selectedFile ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{selectedFile.split('/').pop()}</span>
                <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} /> Save
                </button>
              </div>
              <textarea value={fileContent} onChange={e => setFileContent(e.target.value)}
                style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '13px', padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text)', resize: 'none', lineHeight: '1.5' }} />
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              Select a file to edit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
