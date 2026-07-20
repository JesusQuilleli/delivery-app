import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { formatPrice } from "../../utils/currency";

export function Combos({ combos, store }: { combos: any[], store?: any }) {
  const { slug } = useParams<{ slug: string }>();

  if (!combos || combos.length === 0) return null;

  return (
    <section id="combos" className="py-20 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="relative flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <span className="text-purple-600 font-semibold text-sm uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Promociones Especiales
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-2 leading-tight">
              Combos de Salud y Bienestar.
            </h2>
          </div>
          <p className="max-w-sm text-muted-foreground">
            Ahorra llevando el paquete completo. Creados por nuestros especialistas pensando en ti.
          </p>
        </div>

        <div className="relative grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {combos.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="rounded-3xl bg-card text-card-foreground border border-border/60 p-6 relative flex flex-col justify-between group shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="aspect-video w-full bg-purple-50 rounded-2xl overflow-hidden mb-5 relative flex items-center justify-center">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="w-full h-full object-contain mix-blend-multiply" />
                  ) : (
                    <img src="https://placehold.co/600x400/f3e8ff/9333ea?text=Combo+Especial" alt={c.name} className="w-full h-full object-contain opacity-50" />
                  )}
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-purple-600 text-white text-xs font-black px-3 py-1 z-10 shadow-sm uppercase tracking-wider">
                    Combo
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl mt-2 leading-snug line-clamp-2">{c.name}</h3>
                {c.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.description}</p>
                )}
              </div>
              <div className="mt-5 pt-5 border-t border-border/50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Precio Total</span>
                  <div className="font-display font-extrabold text-3xl text-purple-600">{formatPrice(c.price, store?.currency)}</div>
                </div>
                <Link 
                  to={`/${slug}/productos/${c.id}`} 
                  className="inline-flex items-center justify-center font-bold bg-purple-600 text-white px-5 py-3 rounded-full hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  Ver Combo
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
