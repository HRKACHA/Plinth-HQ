import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '../api/index.js';
import { setAccessToken } from '../api/axios.js';
import PlinthLogo from '../components/common/PlinthLogo';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('plinthhq_token');
    if (token) {
      setAccessToken(token);
      authApi.getMe()
        .then(setUser)
        .catch(() => {
          sessionStorage.removeItem('plinthhq_token');
          setAccessToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const persistSession = useCallback((accessToken, userData) => {
    setAccessToken(accessToken);
    sessionStorage.setItem('plinthhq_token', accessToken);
    setUser(userData);
  }, []);

  const login = useCallback(async (email, password) => {
    const { accessToken, user: userData } = await authApi.login(email, password);
    persistSession(accessToken, userData);
    return true;
  }, [persistSession]);

  const register = useCallback(async (name, email, password, inviteToken, preferredRole) => {
    const { accessToken, user: userData } = await authApi.register({ name, email, password, inviteToken, preferredRole });
    persistSession(accessToken, userData);
    return true;
  }, [persistSession]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    setAccessToken(null);
    sessionStorage.removeItem('plinthhq_token');
    setUser(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    try { await authApi.deleteAccount(); } catch { /* ignore */ }
    setAccessToken(null);
    sessionStorage.removeItem('plinthhq_token');
    setUser(null);
  }, []);

  const updateUser = useCallback(async (payload) => {
    const updated = await authApi.updateProfile(payload);
    setUser(updated);
    return updated;
  }, []);

  const loginWithToken = useCallback(async (accessToken) => {
    setAccessToken(accessToken);
    sessionStorage.setItem('plinthhq_token', accessToken);
    const userData = await authApi.getMe();
    setUser(userData);
    return true;
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center animate-fadeIn">
          <PlinthLogo size="lg" />
          <div className="mt-6 mx-auto h-8 w-8 animate-spin rounded-full border-3 border-navy/20 border-t-orange" />
          <p className="mt-4 text-sm text-muted">Loading PlinthHQ...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, deleteAccount, updateUser, loginWithToken, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
