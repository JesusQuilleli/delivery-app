import { ShoppingBag, User, LogOut, Plus } from "lucide-react";
import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";

const links = [
  { href: "#inicio", label: "Inicio" },
  { href: "#categorias", label: "Categorías" },
  { href: "#ofertas", label: "Ofertas" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#contacto", label: "Contacto" },
];

export function Navbar() {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/75 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 h-16 flex items-center justify-between">
        <a href="#inicio" className="flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Plus className="w-5 h-5 fill-primary-foreground/50" strokeWidth={2.5} />
          </span>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-lg tracking-tight leading-none">
              Farma <span className="text-primary">Ayacucho</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none mt-1">
              Entregas al instante
            </span>
          </div>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-foreground transition">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {token && user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-foreground/80 mr-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <User size={16} />
                </div>
                Hola, {user.name?.split(' ')[0]}
              </div>
              <Link
                to="/farmacia-ayacucho/mis-pedidos"
                className="hidden sm:inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-700 px-4 py-2 text-sm font-semibold hover:bg-blue-200 transition"
              >
                Mis Pedidos
              </Link>
              <Link
                to="/farmacia-ayacucho/productos"
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Comprar</span>
              </Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="p-2 text-muted-foreground hover:text-red-600 transition ml-2"
                title="Cerrar sesión"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/farmacia-ayacucho/productos"
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Catálogo Online</span>
                <span className="sm:hidden">Comprar</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
