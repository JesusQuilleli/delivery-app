import { ShoppingBag, User, LogOut, Plus } from "lucide-react";
import { useContext } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";

const links = [
  { href: "#inicio", label: "Inicio" },
  { href: "#categorias", label: "Categorías" },
  { href: "#ofertas", label: "Ofertas" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#contacto", label: "Contacto" },
];

export function Navbar({ store }: { store?: any }) {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const storeName = store?.name || "Farmacia";
  const slug = store?.slug || routeSlug;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <a href="#inicio" className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground shadow-sm flex-shrink-0">
            <Plus className="w-5 h-5 fill-primary-foreground/50" strokeWidth={2.5} />
          </span>
          <div className="flex flex-col min-w-0">
            <span className="font-display font-extrabold text-base sm:text-lg tracking-tight leading-none truncate max-w-[140px] sm:max-w-[220px] xl:max-w-none">
              {storeName}
            </span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none mt-1 whitespace-nowrap">
              Entregas al instante
            </span>
          </div>
        </a>

        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-muted-foreground min-w-0 flex-shrink">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-foreground transition whitespace-nowrap">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {token && user ? (
            <>
              <div className="hidden md:flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground/80 mr-1">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <User size={15} />
                </div>
                <span className="truncate max-w-[100px]">Hola, {user.name?.split(' ')[0]}</span>
              </div>
              <Link
                to={`/${slug}/mis-pedidos`}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-700 px-3.5 py-1.5 text-xs sm:text-sm font-semibold hover:bg-blue-200 transition whitespace-nowrap"
              >
                Mis Pedidos
              </Link>
              <Link
                to={`/${slug}/productos`}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 py-1.5 text-xs sm:text-sm font-semibold hover:opacity-90 transition shadow-sm whitespace-nowrap"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Comprar</span>
              </Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="p-1.5 text-muted-foreground hover:text-red-600 transition ml-1"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link
                to={`/${slug}/productos`}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs sm:text-sm font-semibold hover:opacity-90 transition shadow-sm whitespace-nowrap"
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
