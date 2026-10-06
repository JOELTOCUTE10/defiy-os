import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Profile } from '../api/types';
import { authApi, profileApi } from '../api/endpoints';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<Profile | null>;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    try {
      const p = await profileApi.get();
      setProfile(p);
      return p;
    } catch (err: any) {
      console.warn('Failed to load profile:', err);
      return null;
    }
  }, []);

  const loadUserAndProfile = useCallback(async () => {
    const t = localStorage.getItem('token');
    if (!t) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const u = await authApi.me();
      setUser(u);
      await refreshProfile();
    } catch (err: any) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    loadUserAndProfile();
  }, [loadUserAndProfile]);

  const login = async (email: string, pass: string) => {
    setError(null);
    try {
      const res = await authApi.login({ email, password: pass });
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
      await refreshProfile();
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      throw err;
    }
  };

  const register = async (email: string, pass: string) => {
    setError(null);
    try {
      const res = await authApi.register({ email, password: pass });
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
      await refreshProfile();
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        error,
        login,
        register,
        logout,
        refreshProfile,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
