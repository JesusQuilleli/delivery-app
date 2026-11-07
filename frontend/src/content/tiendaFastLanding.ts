export const CONTACT_WHATSAPP = import.meta.env.VITE_CONTACT_WHATSAPP || '584124742535';
export const CONTACT_WHATSAPP_DISPLAY = '+58 412 474 2535';
export const CONTACT_WHATSAPP_MESSAGE =
  'Hola, quiero una cotización de TiendaFast para mi negocio.';

export function buildWhatsAppUrl(message = CONTACT_WHATSAPP_MESSAGE): string {
  const phone = CONTACT_WHATSAPP.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export const navLinks = [
  { href: '#producto', label: 'Producto' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#planes', label: 'Planes' },
  { href: '#preguntas', label: 'Preguntas' }
];

export const painPoints = [
  {
    title: 'Pedidos perdidos en el chat',
    text: 'Los mensajes se mezclan, se responden tarde y nadie sabe qué pedido sigue pendiente.'
  },
  {
    title: 'Precios y stock desactualizados',
    text: 'Cambiar la tasa, un precio o una disponibilidad obliga a repetirlo en cada conversación.'
  },
  {
    title: 'Comprobantes difíciles de controlar',
    text: 'El Pago Móvil llega por WhatsApp, pero confirmar el monto y el pedido correcto consume tiempo.'
  }
];

export const benefits = [
  {
    title: 'Un solo catálogo para todos',
    text: 'Tus productos, categorías, combos y precios se actualizan una vez y se reflejan en la web.'
  },
  {
    title: 'Pedidos ordenados',
    text: 'Cada pedido entra con cliente, productos, pago y dirección. El equipo deja de perseguir mensajes.'
  },
  {
    title: 'Pagos con comprobante',
    text: 'Pago Móvil, transferencia o efectivo. El administrador revisa y aprueba cada comprobante.'
  },
  {
    title: 'Delivery con zonas',
    text: 'Define tarifas por distancia y comparte la ubicación del cliente con el motorizado.'
  },
  {
    title: 'Inventario y combos',
    text: 'Controla stock, alerta productos bajos y calcula la disponibilidad real de cada combo.'
  },
  {
    title: 'Decisiones con datos',
    text: 'Ventas netas, pedidos por período y exportación CSV para entender qué está funcionando.'
  }
];

export const steps = [
  {
    number: '01',
    title: 'Creamos tu tienda',
    text: 'Configuramos tu catálogo, categorías, datos de pago y zonas de delivery.'
  },
  {
    number: '02',
    title: 'Compartes tu enlace',
    text: 'Tus clientes entran a tu catálogo, arman el pedido y eligen cómo pagar.'
  },
  {
    number: '03',
    title: 'Tu equipo despacha',
    text: 'El pedido aparece en el panel, confirmas el pago y el motorizado sale con la ruta.'
  }
];

export const verticals = [
  {
    tag: 'Comida rápida',
    title: 'Hamburgueserías, pizzerías y perros calientes',
    text: 'Menú visual, combos, pedidos nocturnos y delivery sin depender del chat.',
    accent: 'border-orange-200 bg-orange-50 text-orange-700'
  },
  {
    tag: 'Víveres y bodegones',
    title: 'Abastos, mini-mercados y cesta básica',
    text: 'Cientos de productos ordenados por categorías, precios en Bs y compras pesadas a domicilio.',
    accent: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  },
  {
    tag: 'Farmacias',
    title: 'Medicamentos de venta libre y cuidado personal',
    text: 'Catálogo claro, stock visible y solicitudes de récipe cuando el pedido lo requiere.',
    accent: 'border-sky-200 bg-sky-50 text-sky-700'
  }
];

export const features = [
  'Catálogo web por sucursal',
  'Carrito y checkout guiado',
  'Pedidos en tiempo real',
  'Pago Móvil, transferencia y efectivo',
  'Aprobación de comprobantes',
  'Zonas de delivery por distancia',
  'GPS y ruta para el motorizado',
  'Inventario, combos y alertas de stock',
  'Clientes con OTP por correo',
  'Panel de administración por tienda',
  'SuperAdmin para gestionar negocios',
  'Reportes, historial y exportación CSV'
];

export const pilotBenefits = [
  '60 días de uso sin costo del plan',
  'Implementación acompañada',
  'Ajustes de catálogo y configuración',
  'Acompañamiento directo por WhatsApp',
  'Precio especial al terminar el piloto'
];

export const plans = [
  {
    name: 'Emprendedor',
    price: 9,
    description: 'Para empezar a vender sin complicaciones.',
    features: ['Hasta 50 productos', '1 administrador', 'Catálogo digital', 'Pedidos en tiempo real'],
    highlighted: false
  },
  {
    name: 'Negocio',
    price: 19,
    description: 'Para comercios que ya reciben pedidos todos los días.',
    features: ['Hasta 250 productos', 'Hasta 3 administradores', 'Combos y zonas de reparto', 'Historial y exportación CSV'],
    highlighted: true
  },
  {
    name: 'Pro / Cadena',
    price: 35,
    description: 'Para operaciones con más volumen y varias personas.',
    features: ['Hasta 1.000 productos', 'Hasta 10 administradores', 'Reportes avanzados', 'Soporte prioritario'],
    highlighted: false
  }
];

export const faqs = [
  {
    question: '¿Necesito instalar una aplicación?',
    answer:
      'No. Tus clientes compran desde el navegador con tu enlace. Tu equipo administra los pedidos desde el panel web.'
  },
  {
    question: '¿Puedo cobrar en bolívares?',
    answer:
      'Sí. Configuras tus precios y la tasa BCV. El sistema muestra los montos en la moneda de tu tienda y registra el pago con comprobante.'
  },
  {
    question: '¿Funciona para mi tipo de negocio?',
    answer:
      'TiendaFast está pensado para comida rápida, víveres y bodegones, farmacias y comercios con delivery. El catálogo y la portada se adaptan a tu industria.'
  },
  {
    question: '¿Cómo se paga la suscripción?',
    answer:
      'Los planes van de $9 a $35 al mes. También existe pago anual con 10 meses por 12. La implementación inicial tiene un costo único de $90; para los primeros 5 clientes es de $60.'
  },
  {
    question: '¿Qué incluye el programa piloto?',
    answer:
      'Buscamos 6 negocios para usar TiendaFast durante 60 días. Incluye configuración acompañada, ajustes de catálogo y soporte directo. Al terminar, decides si continúas con un plan.'
  },
  {
    question: '¿Mis datos están separados de otras tiendas?',
    answer:
      'Sí. Cada tienda tiene su propio catálogo, pedidos, clientes y administradores. La plataforma es multitenant y aísla la información por tienda.'
  }
];
