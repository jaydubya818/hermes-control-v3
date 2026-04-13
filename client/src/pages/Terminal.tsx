import { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

export function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { send, onMessage, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !containerRef.current) return;

    containerRef.current.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;background:var(--color-bg-secondary);color:var(--color-text);font-family:var(--font-mono);font-size:14px;padding:12px;';
    containerRef.current.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#e6edf3';
      ctx.font = '14px monospace';
      ctx.fillText('$ Terminal ready — xterm.js upgrade pending', 12, 30);
    }

    send('terminal-create', { cols: 80, rows: 24 });

    const unsubscribe = onMessage('terminal-output', (payload) => {
      if (ctx && payload.data) {
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e6edf3';
        ctx.font = '14px monospace';
        ctx.fillText(payload.data.replace(/\r?\n/g, ' '), 12, 30);
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'c') { e.preventDefault(); send('terminal-input', { data: '\x03' }); }
      else if (e.key === 'Enter') { send('terminal-input', { data: '\n' }); }
      else if (e.key.length === 1) { send('terminal-input', { data: e.key }); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); unsubscribe(); };
  }, [isConnected, send, onMessage]);

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ marginBottom: '16px', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TerminalIcon size={24} /> Terminal
      </h2>

      <div style={{ flex: 1, backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isConnected ? 'var(--color-success)' : 'var(--color-error)' }} />
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div ref={containerRef} style={{ flex: 1, overflow: 'auto', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '1.5', color: 'var(--color-text)' }} />
      </div>
    </div>
  );
}
