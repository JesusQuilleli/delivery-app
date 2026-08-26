import { createContext, useState, useEffect, type ReactNode } from 'react';
import api from '../api';

interface User {
  id: number;
  name: string | null;
  phone?: string;
  email?: string;
  role?: string;
  store_id?: number;
  store?: { slug: string } | null;
  username?: string;
}

interface AuthContextType {
  token: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const token = user !== null;

  const login = (userData: User) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Si falla (ej. ya expiró), igualmente limpiamos el estado local
    }
    setUser(null);
    sessionStorage.removeItem('user');
    localStorage.removeItem('client_token');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    if (!user) return;

    const refreshSession = async () => {
      try {
        const res = await api.post('/auth/refresh');
        if (res.data.user) {
          const updatedUser = { ...user, ...res.data.user };
          setUser(updatedUser);
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch {
        setUser(null);
        sessionStorage.removeItem('user');
      }
    };

    refreshSession();
    const interval = setInterval(refreshSession, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
