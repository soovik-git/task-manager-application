import React, { createContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../api/axios';

export const AuthContext = createContext();

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const silentRefresh = async () => {
      try {
        const res = await api.get('/auth/refresh');
        setAccessToken(res.data.accessToken);
        setUser(res.data.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.data.user));
      } catch {
        setUser(null);
        setAccessToken(null);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    silentRefresh();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.data.user);
    localStorage.setItem('user', JSON.stringify(res.data.data.user));
  };

  const register = async (email, password) => {
    const res = await api.post('/auth/register', { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.data.user);
    localStorage.setItem('user', JSON.stringify(res.data.data.user));
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.clear();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};