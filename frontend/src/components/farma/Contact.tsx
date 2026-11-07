import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { MapPin, MessageCircle, Clock, Send, Check } from 'lucide-react';

function toWhatsAppPhone(value?: string) {
  return String(value || '').replace(/\D/g, '');
}

export function Contact({ store }: { store?: any }) {
  const [sent, setSent] = useState(false);
  const landing = store?.landing_config || {};
  const phone = toWhatsAppPhone(landing.whatsapp_contact);
  const hasLocation = store?.latitude != null && store?.longitude != null;
  const mapUrl = hasLocation
    ? `https://www.google.com/maps?q=${store.latitude},${store.longitude}`
    : null;

  if (!phone) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('nombre') || '').trim();
    const customerPhone = String(form.get('telefono') || '').trim();
    const message = String(form.get('mensaje') || '').trim();
    const text = [
      `Hola ${store?.name || ''}, quiero hacer una consulta.`.replace(' ,', ','),
      name ? `Mi nombre es ${name}.` : '',
      customerPhone ? `Mi teléfono es ${customerPhone}.` : '',
      message
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    setSent(true);
    window.setTimeout(() => setSent(false), 3500);
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
              Escríbenos por WhatsApp para consultar disponibilidad, precios o coordinar tu entrega.
            </p>
            <div className="mt-8 space-y-4 text-sm">
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noreferrer" className="flex items-start gap-3 hover:underline">
                  <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>Ver nuestra ubicación en el mapa</div>
                </a>
              )}
              <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="flex items-start gap-3 hover:underline">
                <MessageCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>WhatsApp {landing.whatsapp_contact}</div>
              </a>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                <div>Horario coordinado directamente con el negocio</div>
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
          <p className="text-sm text-muted-foreground mt-1">El mensaje se abrirá en WhatsApp con tus datos.</p>
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <Field label="Nombre" name="nombre" placeholder="Tu nombre" />
            <Field label="Teléfono" name="telefono" placeholder="+58 412 000 0000" type="tel" />
          </div>
          <div className="mt-4">
            <label htmlFor="mensaje" className="block text-sm font-semibold mb-1.5">Producto o consulta</label>
            <textarea
              id="mensaje"
              name="mensaje"
              rows={5}
              required
              placeholder="Cuéntanos qué necesitas."
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="submit"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 font-semibold hover:opacity-90 transition"
          >
            {sent ? <><Check className="w-4 h-4" /> Abriendo WhatsApp</> : <><Send className="w-4 h-4" /> Enviar por WhatsApp</>}
          </button>
        </motion.form>
      </div>
    </section>
  );
}

function Field({ label, name, placeholder, type = 'text' }: { label: string; name: string; placeholder: string; type?: string }) {
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
