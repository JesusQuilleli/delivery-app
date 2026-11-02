import { createContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
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
  isInitializing: boolean;
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

  const [isInitializing, setIsInitializing] = useState(true);
  const hadStoredUser = useRef(user !== null);
  const token = user !== null;

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      if (hadStoredUser.current) {
        setIsInitializing(false);
        return;
      }

      try {
        const res = await api.post('/auth/refresh');
        if (!cancelled && res.data.user) {
          setUser(res.data.user);
          sessionStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (!cancelled && status === 401 && !sessionStorage.getItem('user')) {
          setUser(null);
          clearLocalSession();
        }
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

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
          const updatedUser = { ...user, ...res.data.user };
          setUser(updatedUser);
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (err: unknown) {
        // Solo cerrar sesión si es 401 real (token expirado/inválido)
        // No cerrar sesión por errores de red o timeouts
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (!cancelled && status === 401) {
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
    <AuthContext.Provider value={{ token, user, isInitializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
