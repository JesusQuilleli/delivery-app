import { type ReactNode, useContext, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Package, History, Settings, LogOut, LayoutDashboard, Store, Users, Bike, 
  AlertTriangle, Palette, Share2, Copy, Check, ExternalLink, MessageCircle 
} from 'lucide-react';
import { Button } from './ui/button';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const storePublicUrl = slug ? `${origin}/${slug}` : '';

  const handleLogout = async () => {
    await logout(); // Llama al endpoint /auth/logout que borra la cookie httpOnly
    navigate('/admin-login');
  };

  const handleCopyLink = async () => {
    if (!storePublicUrl) return;
    try {
      await navigator.clipboard.writeText(storePublicUrl);
      setCopied(true);
      toast.success('¡Enlace de tu tienda copiado al portapapeles!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('No se pudo copiar el enlace al portapapeles');
    }
  };

  const handleShareWhatsApp = () => {
    if (!storePublicUrl) return;
    const storeDisplayName = (slug || '').replace(/-/g, ' ');
    const message = `¡Hola! 👋 Te invito a conocer nuestro catálogo digital de *${storeDisplayName.toUpperCase()}* y hacer tus pedidos directo aquí:\n👉 ${storePublicUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const navItems = [
    { name: 'Tablero', icon: LayoutDashboard, path: `/admin/${slug}` },
    { name: 'Catálogo', icon: Package, path: `/admin/${slug}/inventory` },
    { name: 'Historial', icon: History, path: `/admin/${slug}/history` },
    { name: 'Diseño CMS', icon: Palette, path: `/admin/${slug}/cms` },
    { name: 'Clientes', icon: Users, path: `/admin/${slug}/customers` },
    { name: 'Motorizados', icon: Bike, path: `/admin/${slug}/drivers` },
    { name: 'Configuración', icon: Settings, path: `/admin/${slug}/settings` },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans print:p-0 print:bg-white flex flex-col">
      {/* Header Modernizado */}
      <header className="mb-4 flex flex-col lg:flex-row justify-between items-center bg-card text-card-foreground p-5 sm:p-6 rounded-2xl shadow-sm border border-border gap-4 relative overflow-hidden print:hidden">
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
              <span className="text-primary font-bold">{(slug || '').replace(/-/g, ' ')}</span> — Panel Administrativo
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

          <Button variant="destructive" onClick={handleLogout} className="gap-2 h-10 font-bold shadow-sm ml-2">
            <LogOut size={16} /> <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </header>

      {/* Barra de Difusión / Compartir Catálogo para el Vendedor */}
      {slug && (
        <div className="mb-6 p-3 sm:p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-blue-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
              <Share2 size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Enlace Público de tu Tienda
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-200/70 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                  Catálogo Activo
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 truncate mt-0.5 font-mono select-all">
                {storePublicUrl}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-9 px-3 rounded-xl border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 font-bold gap-1.5 text-xs shadow-sm flex-1 sm:flex-initial"
            >
              {copied ? <Check size={14} className="text-emerald-600 font-extrabold" /> : <Copy size={14} />}
              <span>{copied ? '¡Copiado!' : 'Copiar Enlace'}</span>
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleShareWhatsApp}
              className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs shadow-sm shadow-emerald-600/20 flex-1 sm:flex-initial"
            >
              <MessageCircle size={14} />
              <span>Compartir en WhatsApp</span>
            </Button>

            <a
              href={storePublicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-9 px-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold gap-1.5 text-xs shadow-sm flex-1 sm:flex-initial"
            >
              <ExternalLink size={14} />
              <span>Ver Tienda</span>
            </a>
          </div>
        </div>
      )}

      {user?.store?.is_active === false && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-900 dark:text-amber-200 print:hidden">
          <AlertTriangle className="text-amber-600 shrink-0" size={24} />
          <div className="text-sm">
            <p className="font-bold">Tienda en pausa / inactiva</p>
            <p className="text-xs opacity-90 mt-0.5">El catálogo público y la recepción de pedidos están desactivados temporalmente. Los clientes verán la tienda como no disponible.</p>
          </div>
        </div>
      )}

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
