import React, { createContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../api/axios';

export const AuthContext = createContext();

// #10 Fix: lazy initializer — only runs once on mount, not on every re-render
const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// #8 Fix: only store safe, non-sensitive UI data — no internal _id
const storeUser = (user) => {
  if (user) {
    const safeUser = {
      email: user.email,
      createdAt: user.createdAt || user.created_at,
    };
    localStorage.setItem('user', JSON.stringify(safeUser));
    localStorage.setItem('isLoggedIn', 'true');
  }
};

const clearStorage = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('isLoggedIn');
};

export const AuthProvider = ({ children }) => {
  // #10 Fix: lazy initializer — runs synchronously once, not on every render
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(
    () => localStorage.getItem('isLoggedIn') === 'true' && !getStoredUser()
  );

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') !== 'true') return;

    const controller = new AbortController();

    const silentRefresh = async () => {
      try {
        const res = await api.get('/auth/refresh', { signal: controller.signal });
        setAccessToken(res.data.accessToken);
        const freshUser = res.data.data.user;
        setUser(freshUser);
        storeUser(freshUser);
      } catch (err) {
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
        setUser(null);
        setAccessToken(null);
        clearStorage();
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    silentRefresh();
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.data.user);
    storeUser(res.data.data.user);
    return res.data;
  };

  const register = async (email, password) => {
    const res = await api.post('/auth/register', { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.data.user);
    storeUser(res.data.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout'); // #1 Fix: POST not GET
    } finally {
      setUser(null);
      setAccessToken(null);
      clearStorage();
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', justifyContent: 'center',
        alignItems: 'center', background: '#0f172a'
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '3px solid rgba(99,102,241,0.2)',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
