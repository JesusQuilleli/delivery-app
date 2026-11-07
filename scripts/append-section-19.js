const fs = require('fs');
const path = require('path');

const planPath = path.join(__dirname, '..', 'PLAN_DE_TRABAJO.md');
let planContent = fs.readFileSync(planPath, 'utf8');

const section19 = `

---

## 19. Hitos Completados - Control de Disponibilidad Simple, CMS de 6 Plantillas por Plan, Eliminación y Suspensión en SuperAdmin, Retiro de Precios Públicos y Seguridad Anti-Baneo WhatsApp (2026-11-07)

### ✅ Tareas Completadas:

- [x] **Control de Disponibilidad (Disponible / Agotado) sin Gestión Numérica de Inventario:**
  - **Diagnóstico y Enfoque:** La propuesta de valor de la app para comercios locales y restaurantes es la inmediatez operativa, no la contabilidad de unidades físicas (20, 50 uds). Solicitar un conteo numérico de stock añadía fricción innecesaria.
  - **En Módulo de Inventario (\`Inventory.tsx\`):**
    - Se reemplazó el campo numérico "Stock (Uds)" en los modales de creación y edición por un selector visual de 2 estados: \`[🟢 Disponible]\` y \`[🔴 Agotado]\`.
    - Al crear o editar, se guarda \`is_available: true/false\` y \`stock: null\`.
    - En la tabla de productos y vista móvil, se unificaron las columnas en una única columna de **Disponibilidad** con botón interactivo de 1 clic para alternar al instante entre Disponible y Agotado sin abrir el modal.
  - **En Catálogo de Clientes y Detalle (\`Catalog.tsx\` y \`ProductDetails.tsx\`):**
    - Se actualizó la verificación de disponibilidad: \`const soldOut = p.is_available === false || (p.stock != null && p.stock <= 0);\`.
    - Si el producto está agotado: se muestra una insignia roja \`Agotado\`, se atenúa la fotografía del producto en escala de grises con opacidad reducida, y se deshabilita el botón de agregar al carrito mostrando \`Agotado\`.

- [x] **CMS de 6 Plantillas Estructurales con Gating por Plan SaaS:**
  - **Ampliación de Layouts (\`backend/utils/landing.js\` y \`frontend/src/lib/landing.ts\`):**
    - Se expandió la oferta visual de 3 a **6 plantillas web**:
      1. \`hero_split\` (Hero Split Moderno Gastronómico) - Desbloqueado en **todos los planes**.
      2. \`minimal_banner\` (Banner Showcase Marketplace) - Desbloqueado en **Negocio y Pro**.
      3. \`grid_showcase\` (Grid Gourmet / Vitrina Directa) - Desbloqueado en **Negocio y Pro**.
      4. \`clean_catalog\` (Boutique Minimalista / Catálogo Limpio) - Desbloqueado en **Pro / Corporativo**.
      5. \`story_reel\` (Stories App / Visual Móvil) - Desbloqueado en **Pro / Corporativo**.
      6. \`magazine_editorial\` (Editorial Gourmet / Dark Mode) - Desbloqueado en **Pro / Corporativo**.
  - **Reglas por Plan y Protección de Acceso (\`LandingSettings.tsx\`):**
    - **Plan Emprendedor:** Acceso a la plantilla por defecto (\`hero_split\`), banners, imágenes, logo y personalización total de colores.
    - **Plan Negocio:** Acceso a las 3 primeras plantillas y personalización completa.
    - **Plan Pro / Corporativo:** Acceso total a las 6 plantillas de diseño y personalización máxima.
    - Las tarjetas de diseño bloqueadas para planes inferiores muestran una insignia de candado y guían al comerciante con una notificación explicativa.
    - **Importante:** Todos los planes mantienen acceso irrestricto para modificar los colores de su marca (\`theme_color\`), logotipo, redes sociales y textos de portada.

- [x] **Corrección de Color Anaranjado Residual en Carrito y Encabezado (\`Layout.tsx\`, \`Checkout.tsx\`):**
  - Se eliminaron las clases fijas \`bg-orange-500\` y \`text-orange-600\` presentes en el botón de tienda de la cabecera del catálogo y en el stepper del checkout.
  - Se enlazaron dinámicamente a las variables CSS de la tienda (\`bg-primary\`, \`text-primary\`, \`border-primary/20\`, \`bg-primary/10\`), garantizando que tiendas como "Bambu" luzcan su color verde configurado en toda la experiencia de compra.

- [x] **Retiro de Precios Fijos Públicos en Web y Documentos Comerciales:**
  - **Motivación:** En fase de prospección y validación de mercado en Puerto Ayacucho, las tarifas mensuales no deben ser públicas ni fijas para permitir negociaciones personalizadas según volumen de pedidos.
  - **En Panel SuperAdmin (\`SuperAdmin.tsx\`):**
    - Se retiraron los precios de los selectores de creación y asignación de planes (\`Emprendedor\`, \`Negocio\`, \`Pro / Cadena\`).
    - En la tabla de tiendas, se reemplazó el texto con precio por la insignia pura del plan.
    - En la métrica superior, se reemplazó la tarjeta de MRR mensual en dólares por **Total de Tiendas Registradas / Activas**.
  - **En Propuestas Comerciales y Guía Maestra (\`Propuesta_Comercial_TiendaFast_Socio.html\` y \`Guia_Maestra_TiendaFast_Dueno.html\`):**
    - Se sustituyeron las cifras ($9, $19, $35) por modalidades a la medida (*"Plan Inicial / A tu medida"*, *"Crecimiento / Recomendado"*, *"Corporativo / Alto Volumen"*).
    - Se recompilaron los archivos PDF limpios mediante Edge Headless:
      - \`Propuesta_Comercial_TiendaFast_Socio.pdf\` (729 KB).
      - \`Guia_Maestra_TiendaFast_Dueno.pdf\` (1,063 KB).

- [x] **Módulo SuperAdmin: Suspensión y Eliminación Transaccional de Tiendas:**
  - **Suspensión / Reactivación Inmediata:** Botón conmutador que actualiza \`is_active\` y \`subscription_status: SUSPENDED\`. Tiendas suspendidas no pueden recibir pedidos ni mostrar su catálogo.
  - **Eliminación Definitiva en Cascada (\`DELETE /api/superadmin/stores/:id\`):**
    - Endpoint protegido para SuperAdmin con transacción Prisma en cascada que elimina de forma limpia todas las entidades vinculadas: pedidos (\`Order\`), items (\`OrderItem\`), cotizaciones de recetas (\`PrescriptionQuote\`), productos (\`Product\`), categorías (\`Category\`), combos (\`Combo\`, \`ComboItem\`), zonas de delivery (\`DeliveryZone\`), repartidores (\`Driver\`), notificaciones push (\`PushSubscription\`), configuraciones (\`StoreSettings\`, \`LandingDraft\`) y usuarios administradores de la tienda.
    - En el frontend, el botón "Eliminar" solicita escribir obligatoriamente el \`slug\` de la tienda como medida de seguridad ante borrados accidentales.

- [x] **Análisis de Seguridad y Protección Anti-Baneo de WhatsApp:**
  - **Naturaleza 100% Transaccional:** A diferencia del marketing masivo no solicitado (spam), los mensajes de TiendaFast son notificaciones esperadas directamente por el cliente (*"Tu pedido #X va en camino con el repartidor"*).
  - **Técnicas de Protección en Funcionamiento:**
    - Rotación dinámica de texto con técnica Spintax (3 plantillas semánticas diferentes con variaciones léxicas para no enviar nunca hashes repetidos).
    - Presencia humana emulada (\`presence: composing\` durante 1.5 a 3.5 segundos).
    - Sanitización de formato internacional E.164.
    - Pausa aleatoria entre envíos para simular tipeo humano.
`;

fs.writeFileSync(planPath, planContent + section19, 'utf8');
console.log('Successfully appended Section 19 to PLAN_DE_TRABAJO.md!');
