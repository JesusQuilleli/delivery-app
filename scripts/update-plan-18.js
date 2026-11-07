const fs = require('fs');
const path = require('path');

const planPath = path.resolve(__dirname, '../PLAN_DE_TRABAJO.md');
let content = fs.readFileSync(planPath, 'utf8');

const section18 = `

---

## 18. Hitos en Ejecución / Completados - Despacho Automático WhatsApp Corregido, Modal Móvil Responsive, Permisos Push Interactivos y CMS Multidiseño con Paletas Dinámicas (2026-11-07)

### ✅ Tareas en Ejecución y Completadas:

- [x] **Corrección de Excepción Prisma en Despacho de Pedidos por WhatsApp (orderController.js):**
  - **Diagnóstico:** Al despachar un pedido (#3) con motorizado asignado, no llegaba el WhatsApp automático ni al cliente ni al repartidor. En los logs de delivery_api en el VPS se constató la excepción no capturada:
    Unknown field phone for select statement on model Store en orderController.js:369 y orderController.js:886.
    El modelo Store en Prisma no posee el campo phone (posee bank_phone). Esto abortaba la ejecución antes de llamar a sendOrderDispatchedToCustomer y sendOrderDispatchedToDriver.
  - **Resolución:**
    - Se corrigió la consulta en updateOrderStatus y batchUpdateStatus a select: { name: true, currency: true, bank_phone: true }.
    - Se añadieron trazas de registro detalladas ([WHATSAPP] Despachando pedido #...) para verificar de inmediato el envío exitoso al cliente y al motorizado asignado.

- [x] **Ajuste y Responsividad del Modal de Despacho en Teléfonos Móviles (OrderDetails.tsx):**
  - **Diagnóstico:** En dispositivos móviles, la barra fija inferior (fixed bottom-0 z-50) colisionaba con el modal de asignación de motorizado (fixed inset-0 z-50), provocando que los botones de acción quedaran tapados, se rompiera el diseño y se interceptaran los eventos táctiles.
  - **Resolución:**
    - Se elevó el modal a z-[100] con fondo oscurecido y desenfoque (bg-black/70 backdrop-blur-md).
    - Se configuró contención con max-h-[90vh] overflow-y-auto para pantallas compactas.
    - Se adaptó la botonera a flex flex-col sm:flex-row gap-2.5 para evitar textos truncados y facilitar el toque en teléfonos.
    - Se corrigió el texto del botón secundario a "Despachar sin Asignar" y se colocó el botón principal "Asignar y Despachar 🚀".

- [x] **Reemplazo de Botones Manuales por Banner de Confirmación de Despacho Automático:**
  - Al despacharse un pedido, en lugar de mostrar botones primarios que confunden al comerciante haciéndole pensar que debe pulsar manualmente para enviar el WhatsApp, se despliega una tarjeta de confirmación:
    ✅ Despacho Notificado Automáticamente - Se enviaron los mensajes automáticos por WhatsApp con los detalles de entrega al cliente y al motorizado.
  - Se proporcionan enlaces secundarios compactos para reenvío manual como plan de contingencia.

- [x] **Permisos Interactivos de Notificaciones Web en Segundo Plano (Cumplimiento de Políticas Móviles):**
  - **Diagnóstico:** Chrome en Android y Safari en iOS bloquean o ignoran las llamadas a Notification.requestPermission() si se disparan de forma pasiva dentro de un useEffect, requiriendo estrictamente un gesto explícito del usuario (tap/click).
  - **Resolución:**
    - Creación de componente interactivo NotificationPermissionBanner.
    - **Para Administradores (Dashboard.tsx / AdminLayout.tsx):** Franja interactiva con botón "Activar Alertas 🔔" para recibir alertas de sonido y vibración ([300, 100, 300, 100, 300]) ante nuevos pedidos, incluso si la pestaña está en segundo plano o el teléfono tiene otra app abierta.
    - **Para Clientes (Checkout.tsx / MyOrders.tsx):** Franja para suscribirse a notificaciones de entrega, notificando al instante cuando el pedido cambia a "En Camino" o "Entregado".

- [x] **CMS Storefront Multidiseño (3 Layouts) y Paletas de Color Dinámicas:**
  - **Diagnóstico:** RestaurantTemplate.tsx contenía clases fijas en Tailwind (text-orange-600, bg-orange-600, etc.), lo que impedía que los colores configurados por el comerciante (theme_color) tuvieran efecto visual. Adicionalmente, el CMS carecía de selector de variantes estructurales de storefront.
  - **Resolución:**
    - Desvinculación de colores fijos: se sustituyeron por variables semánticas bg-primary, text-primary, border-primary/20, shadow-primary/20 y gradientes adaptativos vinculados al theme_color de la tienda.
    - Incorporación de **3 Diseños Web Diferentes (Layout Variants)** configurables desde el CMS:
      1. **Hero Split (Moderno Gastronómico):** Dos columnas con titular de impacto, plato estrella con efecto halo dinámico y badge flotante de entrega rápida.
      2. **Banner Showcase (Marketplace Promocional):** Gran marquesina panorámica superior con buscador centrado, franja de 3 banners de ofertas destacadas y catálogo rápido.
      3. **Grid Gourmet (Vitrina Directa):** Vitrina de combos y productos estrella con insignias de ahorro, banners intercalados y menú visual categorizado.
    - Integración en LandingSettings.tsx del selector visual de los 3 layouts con previsualización en tiempo real en el iframe de comparación.
    - Normalización y persistencia en backend (backend/utils/landing.js) del campo layout_variant.
`;

if (!content.includes('## 18. Hitos en Ejecución / Completados')) {
  content += section18;
  fs.writeFileSync(planPath, content, 'utf8');
  console.log('Successfully added Section 18 to PLAN_DE_TRABAJO.md');
} else {
  console.log('Section 18 already present in PLAN_DE_TRABAJO.md');
}
