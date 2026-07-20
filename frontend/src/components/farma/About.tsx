import { motion } from "framer-motion";
import fachada from "@/assets/farmacia-fachada.jpg";
import equipo from "@/assets/equipo.jpg";

const values = ["Cercanía", "Confianza", "Rapidez"];

export function About() {
  return (
    <section id="nosotros" className="py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 grid grid-cols-12 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-4"
        >
          <div className="rounded-3xl overflow-hidden col-span-2 aspect-[16/9]">
            <img src={fachada} alt="Fachada Farma Ayacucho" loading="lazy" className="w-full h-full object-cover" />
          </div>
          <div className="rounded-3xl overflow-hidden aspect-square">
            <img src={equipo} alt="Equipo de farmacéuticos" loading="lazy" className="w-full h-full object-cover" />
          </div>
          <div className="rounded-3xl bg-primary text-primary-foreground p-6 flex flex-col justify-between aspect-square">
            <div className="font-display text-5xl font-extrabold">12</div>
            <div className="text-sm opacity-90">años cuidando la salud de Ayacucho</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="col-span-12 lg:col-span-5 lg:pl-6 flex flex-col justify-center"
        >
          <span className="text-coral font-semibold text-sm uppercase tracking-widest">Sobre nosotros</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-2 leading-tight">
            La farmacia del barrio, con alma de Ayacucho.
          </h2>
          <p className="mt-5 text-muted-foreground">
            Desde 2013 acompañamos a familias huamanguinas con medicamentos originales, atención farmacéutica responsable y delivery puntual. Detrás del mostrador hay un equipo de químicos colegiados que te asesora con la misma confianza con la que atendemos en persona.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {values.map((v) => (
              <span
                key={v}
                className="inline-flex items-center rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground"
              >
                {v}
              </span>
            ))}
          </div>
          <div className="mt-6 text-sm text-muted-foreground">
            Q.F. Responsable colegiado · Autorización sanitaria DIGEMID vigente.
          </div>
        </motion.div>
      </div>
    </section>
  );
}
