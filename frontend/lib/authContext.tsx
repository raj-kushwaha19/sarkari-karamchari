'use client';
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import api from './apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  onboarded?: boolean;
  language?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refetch: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      // Check for token in localStorage (cross-domain OAuth fallback)
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // On mount: check if token is in URL (after Google OAuth redirect)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        localStorage.setItem('token', urlToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${urlToken}`;
        // Clean token from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState({}, '', url.toString());
      }
    }
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore */ }
    setUser(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
