import { useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bike,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  CreditCard,
  MapPinned,
  Menu,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  X
} from 'lucide-react';
import { TiendaFastLogo } from '@/components/brand/TiendaFastLogo';
import {
  benefits,
  buildWhatsAppUrl,
  CONTACT_WHATSAPP_DISPLAY,
  faqs,
  features,
  navLinks,
  painPoints,
  pilotBenefits,
  plans,
  steps,
  verticals
} from '@/content/tiendaFastLanding';

function WhatsAppButton({ className = '', label = 'Solicitar cotización' }: { className?: string; label?: string }) {
  return (
    <a
      href={buildWhatsAppUrl()}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#F26A3D] px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#F26A3D]/20 transition hover:-translate-y-0.5 hover:bg-[#df5a2f] ${className}`}
    >
      <MessageCircle className="h-4 w-4" />
      {label}
      <ArrowRight className="h-4 w-4" />
    </a>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
  align = 'center'
}: {
  eyebrow: string;
  title: string;
  text?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <span className="text-xs font-black uppercase tracking-[0.24em] text-[#F26A3D]">{eyebrow}</span>
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-[#123B2F] sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {text && <p className="mt-4 text-base leading-relaxed text-[#123B2F]/65 sm:text-lg">{text}</p>}
    </div>
  );
}

export default function TiendaFastLanding() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FCF7ED] text-[#123B2F] selection:bg-[#F26A3D] selection:text-white">
      <header className="sticky top-0 z-50 border-b border-[#123B2F]/10 bg-[#FCF7ED]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#inicio" className="flex items-center" aria-label="TiendaFast, ir al inicio">
            <TiendaFastLogo size={38} />
          </a>

          <nav className="hidden items-center gap-7 text-sm font-bold text-[#123B2F]/65 lg:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-[#123B2F]">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <a
              href="/admin-login"
              className="rounded-full px-4 py-2 text-sm font-bold text-[#123B2F]/70 transition hover:bg-[#123B2F]/5 hover:text-[#123B2F]"
            >
              Ya soy cliente
            </a>
            <WhatsAppButton label="Cotizar" className="px-5 py-2.5" />
          </div>

          <button
            type="button"
            className="rounded-xl border border-[#123B2F]/15 p-2 text-[#123B2F] sm:hidden"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#123B2F]/10 bg-[#FCF7ED] px-5 py-4 sm:hidden">
            <nav className="flex flex-col gap-3 text-sm font-bold text-[#123B2F]/75">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
              <a href="/admin-login" className="pt-2 text-[#F26A3D]">
                Ya soy cliente
              </a>
              <WhatsAppButton className="mt-2 w-full" />
            </nav>
          </div>
        )}
      </header>

      <main>
        <section id="inicio" className="relative overflow-hidden px-5 pb-20 pt-14 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#F26A3D]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-[#123B2F]/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#123B2F]/10 bg-white/70 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#123B2F]/70">
                <Sparkles className="h-3.5 w-3.5 text-[#F26A3D]" />
                Hecho en Puerto Ayacucho para negocios reales
              </span>
              <h1 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[0.98] tracking-[-0.06em] text-[#123B2F] sm:text-6xl lg:text-7xl">
                Tu negocio, más rápido que un mensaje de WhatsApp.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#123B2F]/65 sm:text-xl">
                TiendaFast reúne catálogo, pedidos, pagos y delivery en una sola plataforma.
                Tus clientes compran sin fricción y tu equipo despacha con orden.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <WhatsAppButton className="px-7 py-4 text-base" />
                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#123B2F]/15 bg-white/60 px-7 py-4 text-base font-extrabold text-[#123B2F] transition hover:bg-white"
                >
                  Ver cómo funciona
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[#123B2F]/55">
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#F26A3D]" /> Sin comisión por pedido</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#F26A3D]" /> Prueba de 14 días</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#F26A3D]" /> Soporte directo</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-[#123B2F]/5 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-[#123B2F]/10 bg-white p-4 shadow-2xl shadow-[#123B2F]/10 sm:p-5">
                <div className="flex items-center justify-between border-b border-[#123B2F]/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#123B2F] text-[#FCF7ED]">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#123B2F]">Pedido #1042</p>
                      <p className="text-xs font-semibold text-[#123B2F]/50">Hace 2 minutos</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700">
                    Nuevo
                  </span>
                </div>

                <div className="space-y-3 py-4">
                  {[
                    { icon: ShoppingBag, title: 'Combo familiar', detail: '2 hamburguesas + papas + refresco', price: '$12.00' },
                    { icon: MapPinned, title: 'Delivery', detail: 'Zona urbana · 4,5 km', price: '$2.50' },
                    { icon: CreditCard, title: 'Pago Móvil', detail: 'Comprobante recibido', price: 'Aprobado' }
                  ].map((item) => (
                    <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-[#123B2F]/8 bg-[#FCF7ED]/70 p-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#F26A3D] shadow-sm">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[#123B2F]">{item.title}</p>
                        <p className="truncate text-xs font-medium text-[#123B2F]/50">{item.detail}</p>
                      </div>
                      <span className="text-sm font-black text-[#123B2F]">{item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-[#123B2F] p-4 text-[#FCF7ED]">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span>Total del pedido</span>
                    <span className="text-lg font-black">$14.50</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-bold">
                    <Bike className="h-4 w-4 text-[#F26A3D]" />
                    Motorizado asignado · ruta lista
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-[#123B2F]/10 bg-white px-4 py-3 shadow-xl sm:block">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#123B2F]/45">Pedidos hoy</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-[#123B2F]">Sin chats perdidos</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#123B2F]/10 bg-white/50">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 py-5 text-[11px] font-black uppercase tracking-[0.14em] text-[#123B2F]/45 sm:grid-cols-4 lg:px-8">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#F26A3D]" /> Datos por tienda</span>
            <span className="inline-flex items-center gap-2"><Smartphone className="h-4 w-4 text-[#F26A3D]" /> Funciona en el navegador</span>
            <span className="inline-flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-[#F26A3D]" /> Precios en Bs y USD</span>
            <span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#F26A3D]" /> Soporte por WhatsApp</span>
          </div>
        </section>

        <section className="px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="El problema"
              title="Tu negocio no necesita más mensajes. Necesita orden."
              text="Cuando todo pasa por WhatsApp, el equipo improvisa. TiendaFast convierte esa conversación en un flujo claro para el cliente y para el negocio."
            />
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {painPoints.map((item, index) => (
                <article key={item.title} className="rounded-3xl border border-[#123B2F]/10 bg-white p-6 shadow-sm">
                  <span className="font-display text-4xl font-extrabold text-[#F26A3D]/25">0{index + 1}</span>
                  <h3 className="mt-4 font-display text-xl font-extrabold tracking-[-0.03em]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#123B2F]/60">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="producto" className="px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div className="lg:sticky lg:top-28">
                <SectionHeading
                  eyebrow="La plataforma"
                  title="Todo lo que tu negocio necesita para vender online."
                  text="Una tienda propia, un panel para administrar y una operación pensada para el comercio venezolano."
                  align="left"
                />
                <div className="mt-8 rounded-3xl border border-[#123B2F]/10 bg-[#123B2F] p-6 text-[#FCF7ED]">
                  <BadgeCheck className="h-8 w-8 text-[#F26A3D]" />
                  <p className="mt-4 font-display text-2xl font-extrabold tracking-[-0.03em]">
                    No reemplaza a tu equipo. Le quita el desorden.
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#FCF7ED]/65">
                    El administrador sigue tomando las decisiones. TiendaFast ordena el catálogo, los pedidos y la entrega para que pueda hacerlo más rápido.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <article key={benefit.title} className="rounded-3xl border border-[#123B2F]/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#123B2F]/5">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FCF7ED] text-[#F26A3D]">
                      <PackageCheck className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-extrabold tracking-[-0.02em]">{benefit.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#123B2F]/60">{benefit.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="border-y border-[#123B2F]/10 bg-white/60 px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Cómo funciona"
              title="De la configuración al primer pedido en tres pasos."
              text="Sin instalaciones raras ni capacitaciones eternas. El objetivo es que tu equipo empiece a vender."
            />
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map((step) => (
                <article key={step.number} className="relative overflow-hidden rounded-3xl border border-[#123B2F]/10 bg-[#FCF7ED] p-7">
                  <span className="font-display text-6xl font-extrabold text-[#123B2F]/10">{step.number}</span>
                  <h3 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.03em]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#123B2F]/60">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Para tu tipo de negocio"
              title="Una plataforma, tres formas de vender."
              text="El catálogo y la portada se adaptan a la industria. La operación de fondo es la misma: pedidos claros y entregas controladas."
            />
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {verticals.map((vertical) => (
                <article key={vertical.tag} className={`rounded-3xl border p-7 ${vertical.accent}`}>
                  <span className="text-xs font-black uppercase tracking-[0.2em]">{vertical.tag}</span>
                  <h3 className="mt-4 font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] text-[#123B2F]">
                    {vertical.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#123B2F]/60">{vertical.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#123B2F] px-5 py-20 text-[#FCF7ED] lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.24em] text-[#F26A3D]">Funciones</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Lo importante, sin adornos que estorben.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#FCF7ED]/65">
                TiendaFast cubre el recorrido completo: el cliente compra, el pago se revisa, el pedido se despacha y el negocio entiende qué pasó.
              </p>
              <WhatsAppButton className="mt-8" label="Quiero ver una demo" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#F26A3D]" />
                  <span className="text-sm font-bold text-[#FCF7ED]/80">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-[#123B2F]/10 bg-white shadow-xl shadow-[#123B2F]/5">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-7 sm:p-10 lg:p-12">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#FCF7ED] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#F26A3D]">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Programa piloto
                </span>
                <h2 className="mt-5 font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
                  Buscamos 6 negocios para probar TiendaFast en operación real.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-[#123B2F]/60">
                  No publicamos testimonios que todavía no existen. Estamos abriendo un piloto acompañado para aprender con negocios reales de Puerto Ayacucho y ajustar la plataforma con ellos.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <WhatsAppButton label="Postular mi negocio" />
                  <a href="#planes" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#123B2F]/15 px-6 py-3 text-sm font-extrabold transition hover:bg-[#FCF7ED]">
                    Ver planes
                  </a>
                </div>
              </div>
              <div className="bg-[#FCF7ED] p-7 sm:p-10 lg:p-12">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123B2F]/45">El piloto incluye</p>
                <ul className="mt-5 space-y-4">
                  {pilotBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3 text-sm font-bold text-[#123B2F]/75">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#123B2F] text-[#FCF7ED]">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="planes" className="border-y border-[#123B2F]/10 bg-white/60 px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Planes"
              title="Elige según el tamaño de tu operación."
              text="Precios mensuales en USD. Cobro en bolívares a la tasa BCV del día. Sin comisión por pedido."
            />
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`relative flex flex-col rounded-3xl border p-7 ${
                    plan.highlighted
                      ? 'border-[#F26A3D] bg-[#123B2F] text-[#FCF7ED] shadow-2xl shadow-[#123B2F]/20 lg:-translate-y-2'
                      : 'border-[#123B2F]/10 bg-white'
                  }`}
                >
                  {plan.highlighted && (
                    <span className="absolute right-5 top-5 rounded-full bg-[#F26A3D] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                      Recomendado
                    </span>
                  )}
                  <p className={`text-sm font-black uppercase tracking-[0.18em] ${plan.highlighted ? 'text-[#F26A3D]' : 'text-[#123B2F]/45'}`}>
                    {plan.name}
                  </p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="font-display text-5xl font-extrabold tracking-[-0.05em]">${plan.price}</span>
                    <span className={`pb-1 text-sm font-bold ${plan.highlighted ? 'text-[#FCF7ED]/55' : 'text-[#123B2F]/45'}`}>/mes</span>
                  </div>
                  <p className={`mt-3 text-sm leading-relaxed ${plan.highlighted ? 'text-[#FCF7ED]/65' : 'text-[#123B2F]/55'}`}>
                    {plan.description}
                  </p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm font-bold">
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlighted ? 'text-[#F26A3D]' : 'text-[#F26A3D]'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={buildWhatsAppUrl(`Hola, quiero información del plan ${plan.name} de TiendaFast.`)}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold transition ${
                      plan.highlighted
                        ? 'bg-[#F26A3D] text-white hover:bg-[#df5a2f]'
                        : 'bg-[#123B2F] text-[#FCF7ED] hover:bg-[#0b271f]'
                    }`}
                  >
                    Solicitar cotización
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </article>
              ))}
            </div>
            <p className="mt-8 text-center text-xs font-bold text-[#123B2F]/45">
              Implementación única de $90 · $60 para los primeros 5 clientes · Pago anual: 10 meses por 12.
            </p>
          </div>
        </section>

        <section id="preguntas" className="px-5 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHeading
              eyebrow="Preguntas"
              title="Lo que suelen preguntar antes de empezar."
              text="Si tu duda no está aquí, escríbenos por WhatsApp y la respondemos sin compromiso."
              align="left"
            />
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.question} className="group rounded-2xl border border-[#123B2F]/10 bg-white p-5 open:shadow-md">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-extrabold tracking-[-0.02em]">
                    {faq.question}
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#F26A3D] transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[#123B2F]/60">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 lg:px-8 lg:pb-28">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#123B2F] px-6 py-14 text-center text-[#FCF7ED] shadow-2xl shadow-[#123B2F]/20 sm:px-10 lg:py-20">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#F26A3D]">
                <Clock3 className="h-3.5 w-3.5" />
                Hablemos de tu negocio
              </span>
              <h2 className="mt-5 font-display text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">
                Si tu operación vive en WhatsApp, es momento de ordenarla.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#FCF7ED]/65 sm:text-lg">
                Cuéntanos qué vendes, cuántos pedidos manejas y cómo entregas. Te decimos si TiendaFast encaja y qué plan tiene sentido.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <WhatsAppButton className="px-7 py-4 text-base" label="Solicitar cotización" />
                <a
                  href={`https://wa.me/${CONTACT_WHATSAPP_DISPLAY.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-extrabold transition hover:bg-white/10"
                >
                  <MessageCircle className="h-4 w-4 text-[#F26A3D]" />
                  {CONTACT_WHATSAPP_DISPLAY}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#123B2F]/10 px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <TiendaFastLogo size={36} />
            <p className="mt-4 text-sm leading-relaxed text-[#123B2F]/55">
              Catálogo, pedidos, pagos y delivery para comercios que quieren vender con orden.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="font-black text-[#123B2F]">Producto</p>
              <div className="mt-3 flex flex-col gap-2 text-[#123B2F]/55">
                <a href="#producto" className="hover:text-[#123B2F]">Plataforma</a>
                <a href="#como-funciona" className="hover:text-[#123B2F]">Cómo funciona</a>
                <a href="#planes" className="hover:text-[#123B2F]">Planes</a>
              </div>
            </div>
            <div>
              <p className="font-black text-[#123B2F]">TiendaFast</p>
              <div className="mt-3 flex flex-col gap-2 text-[#123B2F]/55">
                <a href="/admin-login" className="hover:text-[#123B2F]">Ya soy cliente</a>
                <a href="#preguntas" className="hover:text-[#123B2F]">Preguntas</a>
                <a href={buildWhatsAppUrl()} target="_blank" rel="noreferrer" className="hover:text-[#123B2F]">WhatsApp</a>
              </div>
            </div>
            <div>
              <p className="font-black text-[#123B2F]">Contacto</p>
              <div className="mt-3 flex flex-col gap-2 text-[#123B2F]/55">
                <a href={buildWhatsAppUrl()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-[#123B2F]">
                  <MessageCircle className="h-4 w-4 text-[#F26A3D]" />
                  {CONTACT_WHATSAPP_DISPLAY}
                </a>
                <span>Puerto Ayacucho, Amazonas</span>
                <span>Venezuela</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-2 border-t border-[#123B2F]/10 pt-6 text-xs font-semibold text-[#123B2F]/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} TiendaFast. Todos los derechos reservados.</span>
          <span className="inline-flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" />
            Construido para operaciones reales.
          </span>
        </div>
      </footer>
    </div>
  );
}
