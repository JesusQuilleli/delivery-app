import { type ReactNode } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Package, History, Settings, LogOut, LayoutDashboard, Store } from 'lucide-react';
import { Button } from './ui/button';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem('client_token');
    localStorage.removeItem('user');
    navigate('/admin-login');
  };

  const navItems = [
    { name: 'Tablero', icon: LayoutDashboard, path: `/admin/${slug}` },
    { name: 'Inventario', icon: Package, path: `/admin/${slug}/inventory` },
    { name: 'Historial', icon: History, path: `/admin/${slug}/history` },
    { name: 'Configuración', icon: Settings, path: `/admin/${slug}/settings` },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans print:p-0 print:bg-white flex flex-col">
      {/* Header Modernizado */}
      <header className="mb-8 flex flex-col lg:flex-row justify-between items-center bg-card text-card-foreground p-5 sm:p-6 rounded-2xl shadow-sm border border-border gap-4 relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-coral/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

        <div className="relative z-10 flex items-center gap-4 w-full lg:w-auto">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <Store size={24} className="fill-primary/20" />
          </div>
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight font-display">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 tracking-wider uppercase font-semibold">
              <span className="text-primary font-bold">{slug.replace(/-/g, ' ')}</span> — Panel Administrativo
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap justify-center lg:justify-end items-center gap-2 w-full lg:w-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (item.path === `/admin/${slug}` && location.pathname === `/admin/${slug}/`);
            return (
              <Button
                key={item.name}
                variant={isActive ? "default" : "outline"}
                className={`font-bold gap-2 text-sm h-10 ${!isActive ? 'border-primary/20 text-foreground hover:bg-primary/5' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={16} /> <span className="hidden sm:inline">{item.name}</span>
              </Button>
            );
          })}

          <Button variant="destructive" onClick={logout} className="gap-2 h-10 font-bold shadow-sm ml-2">
            <LogOut size={16} /> <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
