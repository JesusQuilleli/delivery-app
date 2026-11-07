import { MessageCircle, Store } from 'lucide-react';

export function Footer({ store }: { store?: any }) {
  const storeName = store?.name || 'Tienda';
  const landing = store?.landing_config || {};
  const phone = String(landing.whatsapp_contact || '').replace(/\D/g, '');
  const hasLocation = store?.latitude != null && store?.longitude != null;
  const mapUrl = hasLocation
    ? `https://www.google.com/maps?q=${store.latitude},${store.longitude}`
    : null;

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-12 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground">
              <Store className="w-5 h-5" strokeWidth={2.2} />
            </span>
            <span className="font-display font-extrabold text-lg">
              {storeName}
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">
            Catálogo y pedidos en línea de {storeName}. Consulta disponibilidad y coordina tu entrega directamente con el negocio.
          </p>
          {phone && (
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/15"
            >
              <MessageCircle className="w-4 h-4" />
              Escribir por WhatsApp
            </a>
          )}
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
            {mapUrl && (
              <li>
                <a href={mapUrl} target="_blank" rel="noreferrer" className="hover:text-foreground">
                  Ver ubicación
                </a>
              </li>
            )}
            <li>{phone ? `WhatsApp ${landing.whatsapp_contact}` : 'Contacto por WhatsApp'}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 py-5 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</div>
          <div>Catálogo y pedidos gestionados por {storeName}.</div>
        </div>
      </div>
    </footer>
  );
}
