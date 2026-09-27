import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('symbieat-token');
    if (!token) {
      setBooting(false);
      return;
    }
    setAuthToken(token);
    api
      .get('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => {
        localStorage.removeItem('symbieat-token');
        setAuthToken(null);
      })
      .finally(() => setBooting(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await api.post('/auth/login', { email, password });
    localStorage.setItem('symbieat-token', d.token);
    setAuthToken(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  const register = useCallback(async (payload) => {
    const d = await api.post('/auth/register', payload);
    localStorage.setItem('symbieat-token', d.token);
    setAuthToken(d.token);
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('symbieat-token');
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      login,
      register,
      logout,
      is: (role) => user?.role === role,
      isStaff: ['chef', 'admin', 'staff'].includes(user?.role),
    }),
    [user, booting, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
