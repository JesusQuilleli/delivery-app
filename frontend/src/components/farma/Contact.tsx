import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Send, Check } from "lucide-react";

export function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3500);
  };

  return (
    <section id="contacto" className="py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 grid grid-cols-12 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="col-span-12 lg:col-span-5 rounded-3xl bg-primary text-primary-foreground p-8 lg:p-10 flex flex-col justify-between"
        >
          <div>
            <span className="font-semibold text-sm uppercase tracking-widest opacity-80">Contacto</span>
            <h2 className="font-display font-extrabold text-3xl lg:text-4xl mt-2 leading-tight">
              Estamos a un mensaje de distancia.
            </h2>
            <p className="mt-4 opacity-90">
              Usa el formulario para consultas, cotizaciones especiales o dudas sobre algún medicamento.
            </p>
            <div className="mt-8 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                <div>Jr. 28 de Julio 245, Huamanga — Ayacucho</div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 shrink-0 mt-0.5" />
                <div>+51 999 999 999</div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                <div>Lun–Dom · 24 horas</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="col-span-12 lg:col-span-7 rounded-3xl bg-card border border-border/60 p-8 lg:p-10"
        >
          <h3 className="font-display font-bold text-2xl">Solicita tu pedido o cotización</h3>
          <p className="text-sm text-muted-foreground mt-1">Te respondemos en minutos.</p>
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <Field label="Nombre" name="nombre" placeholder="Tu nombre" />
            <Field label="Teléfono" name="telefono" placeholder="+51 999 999 999" type="tel" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold mb-1.5">Producto o consulta</label>
            <textarea
              rows={5}
              required
              placeholder="Cuéntanos qué necesitas o adjunta tu receta cuando te contactemos."
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="submit"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 font-semibold hover:opacity-90 transition"
          >
            {sent ? <><Check className="w-4 h-4" /> Enviado</> : <><Send className="w-4 h-4" /> Enviar solicitud</>}
          </button>
        </motion.form>
      </div>
    </section>
  );
}

function Field({ label, name, placeholder, type = "text" }: { label: string; name: string; placeholder: string; type?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold mb-1.5">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
