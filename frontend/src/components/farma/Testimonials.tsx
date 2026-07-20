import { motion } from "framer-motion";
import { Star } from "lucide-react";

const items = [
  { name: "María Quispe", role: "Vecina de Huamanga", text: "Pedí los medicamentos de mi mamá un domingo a las 10 pm y llegaron en 30 minutos. Atención impecable." },
  { name: "Carlos Huamán", role: "Papá primerizo", text: "Siempre encuentro las fórmulas de mi bebé. Me asesoran con paciencia y el delivery nunca falla." },
  { name: "Lucía Berrocal", role: "Profesora", text: "Sus precios en vitaminas son los mejores de la ciudad y los productos son originales. Mi farmacia de confianza." },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-coral font-semibold text-sm uppercase tracking-widest">Testimonios</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-2">
            Lo que dicen nuestros clientes.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {items.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-3xl bg-card border border-border/60 p-7 flex flex-col"
            >
              <div className="flex gap-0.5 text-coral mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-foreground/90 leading-relaxed">"{t.text}"</p>
              <div className="mt-6 flex items-center gap-3">
                <span className="grid place-items-center w-11 h-11 rounded-full bg-primary text-primary-foreground font-bold">
                  {t.name.charAt(0)}
                </span>
                <div className="leading-tight">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
