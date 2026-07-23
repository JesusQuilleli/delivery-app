import { createContext, useState, type ReactNode } from 'react';
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
  token: boolean; // Ya no guardamos el JWT en el cliente — solo sabemos si hay sesión activa
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // El token ya no se guarda en localStorage — la cookie httpOnly lo maneja el navegador
  // Guardamos solo los datos del usuario (no sensibles) en sessionStorage para sobrevivir recargas
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // token es ahora un boolean que indica si hay sesión activa
  const token = user !== null;

  const login = (userData: User) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout'); // El servidor borra la cookie httpOnly
    } catch {
      // Si falla (ej. ya expiró), igualmente limpiamos el estado local
    }
    setUser(null);
    sessionStorage.removeItem('user');
    // Limpiar también cualquier token viejo de localStorage que pudiera quedar de versiones anteriores
    localStorage.removeItem('client_token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
