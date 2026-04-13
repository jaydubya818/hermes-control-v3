import { useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Bot, MessageSquare, Terminal, FolderOpen, Clock, BarChart3, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  user?: { username: string };
  onLogout?: () => void;
}

const ROUTES = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/agents', label: 'Agents', icon: Bot },
  { path: '/sessions', label: 'Sessions', icon: MessageSquare },
  { path: '/terminal', label: 'Terminal', icon: Terminal },
  { path: '/files', label: 'Files', icon: FolderOpen },
  { path: '/cron', label: 'Cron', icon: Clock },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 }
];

export function Sidebar({ isOpen = true, onClose, user, onLogout }: SidebarProps) {
  const location = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <nav style={{ width: '220px', backgroundColor: 'var(--color-sidebar)', color: 'var(--color-sidebar-text)', padding: '20px 0', display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid var(--color-border)', overflowY: 'auto' }}>
      <div style={{ padding: '0 16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-primary-light)', margin: 0 }}>
          Hermes
        </h1>
      </div>

      <div style={{ flex: 1 }}>
        {ROUTES.map(route => {
          const Icon = route.icon;
          const isActive = location.pathname === route.path;
          return (
            <Link key={route.path} to={route.path} onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                color: isActive ? 'var(--color-primary-light)' : 'var(--color-sidebar-text)',
                textDecoration: 'none',
                borderLeft: isActive ? '3px solid var(--color-primary-light)' : '3px solid transparent',
                backgroundColor: isActive ? 'var(--color-sidebar-hover)' : 'transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-sidebar-hover)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
            >
              <Icon size={20} />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{route.label}</span>
            </Link>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={toggle}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-sidebar-text)', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '14px' }}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>

        {user && (
          <div style={{ padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', fontSize: '12px', textAlign: 'center', color: 'var(--color-sidebar-text)' }}>
            {user.username}
          </div>
        )}

        {onLogout && (
          <button onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '8px 12px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '14px' }}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </nav>
  );
}
