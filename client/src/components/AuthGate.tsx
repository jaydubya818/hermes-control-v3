import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading, login, setupAdmin, error } = useAuth();
  const [needsSetup, setNeedsSetup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(false);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch('/api/system/auth/status');
        const data = await res.json();
        if (data.needsSetup) { setNeedsSetup(true); setIsSetupMode(true); }
      } catch (err) {
        console.error('Failed to check auth status:', err);
      }
    };
    checkSetup();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--color-bg)', padding: '20px' }}>
        <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius)', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow)' }}>
          <h1 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', marginBottom: '8px' }}>
            Hermes Control
          </h1>
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '32px' }}>
            {isSetupMode ? 'Set up admin account' : 'Sign in'}
          </p>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const success = isSetupMode ? await setupAdmin(username, password) : await login(username, password);
            if (success) { setUsername(''); setPassword(''); }
          }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" style={{ width: '100%' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                autoComplete={isSetupMode ? 'new-password' : 'current-password'} style={{ width: '100%' }} />
            </div>

            {error && <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>}

            <button type="submit" style={{ width: '100%', padding: '10px 16px' }}>
              {isSetupMode ? 'Set up Admin' : 'Sign In'}
            </button>

            {needsSetup && !isSetupMode && (
              <button type="button" onClick={() => setIsSetupMode(true)}
                style={{ width: '100%', marginTop: '12px', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                Create Admin Account
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  return children;
}
