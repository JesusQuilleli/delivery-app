import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Lock, User } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/admin-login', { username, password });
      login(res.data.client_token, res.data.user);
      navigate(`/admin/farmacia-ayacucho`);
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al iniciar sesión");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-none bg-white/80 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Lock className="text-gray-900" size={32} />
          </div>
          <CardTitle className="text-3xl font-black text-gray-900 tracking-tight">Acceso Admin</CardTitle>
          <CardDescription className="text-gray-500 font-medium">
            Ingresa tus credenciales para gestionar pedidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2 relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <Input 
                placeholder="Nombre de Usuario" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all shadow-sm"
                required
              />
            </div>
            <div className="space-y-2 relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <Input 
                type="password"
                placeholder="Contraseña" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all shadow-sm"
                required
              />
            </div>
            <Button type="submit" className="w-full h-12 mt-6 text-lg font-bold shadow-md hover:shadow-lg transition-all" disabled={loading}>
              {loading ? 'Verificando...' : 'Entrar al Panel'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
