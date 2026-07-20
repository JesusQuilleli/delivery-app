import { motion } from "framer-motion";
import { Clock, Truck, ShieldCheck, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import delivery from "@/assets/delivery-moto.jpg";
import productos from "@/assets/productos-flatlay.jpg";

export function Hero() {
  return (
    <section id="inicio" className="relative pt-10 lg:pt-16 pb-12">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid grid-cols-12 gap-4 lg:gap-5">
          {/* Main slogan */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="col-span-12 lg:col-span-8 rounded-3xl bg-card p-8 lg:p-12 border border-border/60 shadow-sm flex flex-col justify-between min-h-[420px] lg:min-h-[520px] relative overflow-hidden"
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary/70 text-secondary-foreground px-3 py-1 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                Delivery activo en Ayacucho
              </span>
              <h1 className="mt-6 font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
                Tu salud,{" "}
                <span className="text-primary">a un clic</span>
                <br className="hidden sm:block" /> de tu puerta.
              </h1>
              <p className="mt-5 max-w-xl text-base lg:text-lg text-muted-foreground">
                Medicamentos, cuidado personal y bienestar entregados en menos de 45 minutos.
                Farma Ayacucho — la farmacia de confianza de tu barrio, ahora también online.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/farmacia-ayacucho/productos"
                className="inline-flex items-center gap-2 rounded-full bg-coral text-coral-foreground px-6 py-3 font-semibold shadow-md hover:translate-y-[-1px] transition"
              >
                Pedir ahora <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/farmacia-ayacucho/productos"
                className="inline-flex items-center gap-2 rounded-full bg-foreground/5 text-foreground px-6 py-3 font-semibold hover:bg-foreground/10 transition"
              >
                Ver catálogo
              </Link>
            </div>
            <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-secondary/60 blur-3xl pointer-events-none" />
          </motion.div>

          {/* Delivery image */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="col-span-12 sm:col-span-7 lg:col-span-4 rounded-3xl overflow-hidden bg-secondary min-h-[280px] relative"
          >
            <img
              src={delivery}
              alt="Repartidor de Farma Ayacucho"
              width={1024}
              height={1280}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-background/90 backdrop-blur px-4 py-3 flex items-center gap-3">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground">
                <Truck className="w-4 h-4" />
              </span>
              <div className="leading-tight">
                <div className="font-semibold text-sm">Entrega en 45 min</div>
                <div className="text-xs text-muted-foreground">en zona urbana</div>
              </div>
            </div>
          </motion.div>

          {/* Stat 24/7 */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="col-span-6 sm:col-span-5 lg:col-span-3 rounded-3xl bg-primary text-primary-foreground p-6 flex flex-col justify-between min-h-[180px]"
          >
            <Clock className="w-7 h-7 opacity-80" />
            <div>
              <div className="font-display text-4xl font-extrabold">24/7</div>
              <div className="text-sm opacity-90 mt-1">Atención continua todos los días</div>
            </div>
          </motion.div>

          {/* Stat clients */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="col-span-6 lg:col-span-3 rounded-3xl bg-card border border-border/60 p-6 flex flex-col justify-between min-h-[180px]"
          >
            <div className="flex items-center gap-1 text-coral">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <div>
              <div className="font-display text-4xl font-extrabold">+10k</div>
              <div className="text-sm text-muted-foreground mt-1">Clientes que confían en nosotros</div>
            </div>
          </motion.div>

          {/* Productos image */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="col-span-12 lg:col-span-6 rounded-3xl overflow-hidden min-h-[200px] relative"
          >
            <img
              src={productos}
              alt="Productos farmacéuticos"
              width={1280}
              height={960}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Quality */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="col-span-12 lg:col-span-6 rounded-3xl bg-secondary/60 p-6 lg:p-8 flex items-center gap-5"
          >
            <span className="grid place-items-center w-14 h-14 shrink-0 rounded-2xl bg-primary text-primary-foreground">
              <ShieldCheck className="w-7 h-7" />
            </span>
            <div>
              <div className="font-display font-bold text-xl">Productos 100% originales</div>
              <p className="text-sm text-muted-foreground mt-1">
                Trabajamos con laboratorios certificados y cumplimos la normativa DIGEMID.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
