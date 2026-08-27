import { createContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import api from '../api';

const clearLocalSession = () => {
  sessionStorage.removeItem('user');
  localStorage.removeItem('client_token');
  localStorage.removeItem('user');
};

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

  const userRef = useRef(user);
  userRef.current = user;

  const token = user !== null;

  const login = useCallback((userData: User) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Si falla (ej. ya expiró), igualmente limpiamos el estado local
    }
    setUser(null);
    clearLocalSession();
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      clearLocalSession();
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const refreshSession = async () => {
      try {
        const res = await api.post('/auth/refresh');
        if (!cancelled && res.data.user) {
          const updatedUser = { ...userRef.current, ...res.data.user };
          setUser(updatedUser);
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (err: any) {
        // Solo cerrar sesión si es 401 real (token expirado/inválido)
        // No cerrar sesión por errores de red o timeouts
        if (!cancelled && err?.response?.status === 401) {
          setUser(null);
          sessionStorage.removeItem('user');
        }
      }
    };

    // Primer refresh después de 5 segundos (dar tiempo a que la cookie se establezca)
    const initialTimer = setTimeout(refreshSession, 5000);
    // Luego cada 30 minutos
    const interval = setInterval(refreshSession, 30 * 60 * 1000);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
