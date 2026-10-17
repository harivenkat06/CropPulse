import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User } from '../services/api/auth';
import { ApiError } from '../services/api/apiClient';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedUser = await authService.getStoredUser();
        const storedToken = await authService.getStoredToken();
        if (storedUser && storedToken) {
          try {
            setUser(await authService.getMe());
          } catch (error) {
            if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
              await authService.logout();
              setUser(null);
            } else {
              console.error('Failed to refresh session:', error);
              setUser(storedUser);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (phone: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.login(phone, password);
      setUser(res.user);
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      const res = await authService.register(data);
      setUser(res.user);
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
