import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, setToken, clearToken } from '../services/api';
import { User, UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    education_level?: string;
    target_role_id?: number | null;
    weekly_study_hours?: number;
    learning_style?: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<UserProfile>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.get<User>('/auth/me');
      setUser(data);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; user: any }>('/auth/login', {
      email,
      password,
    });
    setToken(res.access_token);
    await fetchCurrentUser();
  };

  const register = async (data: any) => {
    const res = await api.post<{ access_token: string; user: any }>('/auth/register', data);
    setToken(res.access_token);
    await fetchCurrentUser();
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    const updated = await api.put<UserProfile>('/users/profile', profileData);
    if (user) {
      setUser({
        ...user,
        profile: updated,
      });
    }
    return updated;
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
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
