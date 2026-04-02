import React, { createContext, useState, useEffect } from 'react';
import api, { setAccessToken } from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Instead of fetching '/me' using a likely-expired token, 
  // try to refresh immediately on app load.
  useEffect(() => {
    const silentRefresh = async () => {
      try {
        const res = await api.get('/auth/refresh');
        setAccessToken(res.data.accessToken);
        setUser(res.data.data.user);
      } catch (err) {
        setUser(null);
        setAccessToken(null);
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
    return res.data;
  };

  const register = async (email, password) => {
    const res = await api.post('/auth/register', { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.data.user);
    return res.data;
  };

  const logout = async () => {
    await api.get('/auth/logout');
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading ? children : <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>}
    </AuthContext.Provider>
  );
};
