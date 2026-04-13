import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
  gatewayRunning?: boolean;
  profile?: string;
  user?: { username: string };
  onLogout?: () => void;
}

export function Header({ title, onMenuClick, gatewayRunning, profile = 'default', user, onLogout }: HeaderProps) {
  const { theme, toggle } = useTheme();

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)', height: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {onMenuClick && (
          <button onClick={onMenuClick} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-text)' }}>
            <Menu size={24} />
          </button>
        )}
        <h1 style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', margin: 0 }}>{title}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {gatewayRunning !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius)', fontSize: '13px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: gatewayRunning ? 'var(--color-success)' : 'var(--color-error)' }} />
            {gatewayRunning ? 'Gateway Running' : 'Gateway Stopped'}
          </div>
        )}

        {profile && (
          <div style={{ padding: '6px 12px', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 500 }}>
            {profile}
          </div>
        )}

        <button onClick={toggle} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: 'var(--color-text)' }} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '12px', borderLeft: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '13px' }}>{user.username}</span>
            {onLogout && (
              <button onClick={onLogout} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: 'var(--color-text)' }} title="Logout">
                <LogOut size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
