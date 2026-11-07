import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export interface TestimonialItem {
  name: string;
  role?: string;
  text: string;
}

export function Testimonials({ items = [] }: { items?: TestimonialItem[] }) {
  if (items.length === 0) return null;

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
          {items.map((testimonial, index) => (
            <motion.div
              key={`${testimonial.name}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="rounded-3xl bg-card border border-border/60 p-7 flex flex-col"
            >
              <div className="flex gap-0.5 text-coral mb-4">
                {[...Array(5)].map((_, starIndex) => <Star key={starIndex} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-foreground/90 leading-relaxed">"{testimonial.text}"</p>
              <div className="mt-6 flex items-center gap-3">
                <span className="grid place-items-center w-11 h-11 rounded-full bg-primary text-primary-foreground font-bold">
                  {testimonial.name.charAt(0)}
                </span>
                <div className="leading-tight">
                  <div className="font-semibold">{testimonial.name}</div>
                  {testimonial.role && <div className="text-xs text-muted-foreground">{testimonial.role}</div>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
