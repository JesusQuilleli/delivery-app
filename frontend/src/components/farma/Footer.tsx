import { Plus, MessageCircle } from "lucide-react";

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-12 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground">
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </span>
            <span className="font-display font-extrabold text-lg">
              Farma <span className="text-primary">Ayacucho</span>
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">
            Tu salud, a un clic de tu puerta. Delivery de medicamentos y bienestar en Huamanga y distritos cercanos.
          </p>
          <div className="mt-5 flex gap-2">
            {[Instagram, Facebook, MessageCircle].map((Icon, i) => (
              <a key={i} href="#" className="grid place-items-center w-9 h-9 rounded-full bg-foreground/5 hover:bg-foreground/10 transition">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="font-semibold mb-3">Explora</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#categorias" className="hover:text-foreground">Categorías</a></li>
            <li><a href="#ofertas" className="hover:text-foreground">Ofertas</a></li>
            <li><a href="#nosotros" className="hover:text-foreground">Sobre nosotros</a></li>
            <li><a href="#contacto" className="hover:text-foreground">Contacto</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Contacto</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Jr. 28 de Julio 245</li>
            <li>Huamanga — Ayacucho</li>
            <li>+51 999 999 999</li>
            <li>hola@farmaayacucho.pe</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 py-5 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Farma Ayacucho. Todos los derechos reservados.</div>
          <div>Venta de medicamentos según normativa DIGEMID · Q.F. Responsable colegiado.</div>
        </div>
      </div>
    </footer>
  );
}
