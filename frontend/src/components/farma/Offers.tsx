import { motion } from "framer-motion";
import { Tag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { formatPrice } from "../../utils/currency";

export function Offers({ offers, store }: { offers: any[], store?: any }) {
  const { slug } = useParams<{ slug: string }>();
  return (
    <section id="ofertas" className="py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="rounded-3xl bg-foreground text-background p-8 lg:p-12 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-coral/40 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <span className="text-coral font-semibold text-sm uppercase tracking-widest">Ofertas del mes</span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-2 leading-tight">
                Cuidarte cuesta menos.
              </h2>
            </div>
            <p className="max-w-sm text-background/70">
              Algunos de nuestros productos destacados. Pídelos directamente desde nuestro catálogo web.
            </p>
          </div>

          <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {offers.map((o, i) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="rounded-2xl bg-background text-foreground p-5 relative flex flex-col justify-between group"
              >
                <div>
                  <div className="aspect-square w-full bg-muted/20 rounded-xl overflow-hidden mb-4 relative flex items-center justify-center">
                    {o.image_url ? (
                      <img src={o.image_url} alt={o.name} className="w-full h-full object-contain mix-blend-multiply" />
                    ) : (
                      <img src="https://placehold.co/400x400/f8fafc/94a3b8?text=Sin+Imagen" alt={o.name} className="w-full h-full object-contain opacity-50" />
                    )}
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-coral text-coral-foreground text-xs font-bold px-2.5 py-1 z-10">
                      <Tag className="w-3 h-3" /> Destacado
                    </span>
                  </div>
                  {o.category && (
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{o.category.name}</div>
                  )}
                  <h3 className="font-display font-bold text-lg mt-2 leading-snug min-h-[3rem] line-clamp-2">{o.name}</h3>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-extrabold text-2xl text-primary">{formatPrice(o.price, store?.currency)}</span>
                  </div>
                  <Link 
                    to={`/${slug}/productos/${o.id}`} 
                    className="mt-2 text-center text-sm font-bold bg-primary/10 text-primary py-2 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    Ver Producto
                  </Link>
                </div>
              </motion.div>
            ))}
            {offers.length === 0 && (
              <div className="col-span-full py-10 text-center text-background/80">
                 No hay productos destacados por el momento.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
