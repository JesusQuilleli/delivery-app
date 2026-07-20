import { motion } from "framer-motion";
import { MessageCircle, CreditCard, PackageCheck, MapPin } from "lucide-react";

const steps = [
  { icon: MessageCircle, title: "Pide", desc: "Envíanos tu lista o receta por WhatsApp." },
  { icon: CreditCard, title: "Confirmamos", desc: "Te confirmamos stock, precio y forma de pago." },
  { icon: PackageCheck, title: "Recibe", desc: "Llevamos tu pedido a tu puerta en menos de 45 min." },
];

export function Delivery() {
  return (
    <section id="delivery" className="py-20 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid grid-cols-12 gap-6 items-center">
          <div className="col-span-12 lg:col-span-5">
            <span className="text-coral font-semibold text-sm uppercase tracking-widest">Delivery</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-2 leading-tight">
              Tres pasos. Cero filas.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              Hicimos pedir tus medicamentos tan fácil como mandar un mensaje. Cobertura en todo el casco urbano de Ayacucho y distritos cercanos.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium border border-border/60">
              <MapPin className="w-4 h-4 text-primary" />
              Huamanga · Jesús Nazareno · Carmen Alto · San Juan Bautista
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 grid sm:grid-cols-3 gap-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-3xl bg-card border border-border/60 p-6 relative"
                >
                  <span className="absolute top-4 right-5 font-display font-extrabold text-3xl text-foreground/10">
                    0{i + 1}
                  </span>
                  <span className="grid place-items-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground">
                    <Icon className="w-6 h-6" />
                  </span>
                  <h3 className="font-display font-bold text-xl mt-5">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
