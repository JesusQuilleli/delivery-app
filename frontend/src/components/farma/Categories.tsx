import { motion } from "framer-motion";
import { ArrowUpRight, FolderHeart } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export function Categories({ categories }: { categories: any[] }) {
  const { slug } = useParams<{ slug: string }>();
  return (
    <section id="categorias" className="py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <span className="text-coral font-semibold text-sm uppercase tracking-widest">Categorías</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-2 max-w-xl">
              Todo lo que tu familia necesita.
            </h2>
          </div>
          <p className="max-w-sm text-muted-foreground">
            Explora nuestras categorías. Todo nuestro inventario está disponible online.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c, i) => {
            const tone = i % 3 === 0 ? "bg-primary text-primary-foreground" : i % 3 === 1 ? "bg-secondary text-secondary-foreground" : "bg-card border border-border/60 text-foreground";
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              >
                <Link
                  to={`/${slug}/categorias/${c.id}`}
                  className={`block rounded-3xl p-6 min-h-[160px] flex flex-col justify-between relative overflow-hidden group ${tone}`}
                >
                  {c.image_url && (
                    <img
                      src={c.image_url}
                      alt={c.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition"
                    />
                  )}
                  <div className="relative flex items-start justify-between">
                    {!c.image_url && <FolderHeart className="w-7 h-7" />}
                    <ArrowUpRight className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition ml-auto" />
                  </div>
                  <div className="relative mt-4">
                    <h3 className="font-display font-bold text-2xl drop-shadow-md">{c.name}</h3>
                  </div>
                </Link>
              </motion.div>
            );
          })}
          {categories.length === 0 && (
            <div className="col-span-full py-10 text-center text-muted-foreground">
               No hay categorías disponibles por el momento.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
