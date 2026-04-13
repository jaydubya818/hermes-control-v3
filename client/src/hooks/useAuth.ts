import { useState, useCallback, useEffect } from 'react';

interface User {
  username: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const checkToken = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/system/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser({ username: data.username });
        localStorage.setItem('csrf', data.csrf);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('csrf');
        setUser(null);
      }
    } catch (err) {
      console.error('Token check failed:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/system/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return false; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('csrf', data.csrf);
      setUser({ username });
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const setupAdmin = useCallback(async (username: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/system/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Setup failed'); return false; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('csrf', data.csrf);
      setUser({ username });
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try { await fetch('/api/system/auth/logout', { method: 'POST' }); } catch { }
    localStorage.removeItem('token');
    localStorage.removeItem('csrf');
    setUser(null);
  }, []);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    const csrf = localStorage.getItem('csrf');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'X-CSRF-Token': csrf || '',
      'Content-Type': 'application/json'
    };
  }, []);

  return { user, loading, error, login, setupAdmin, logout, getHeaders, isAuthenticated: !!user };
}
