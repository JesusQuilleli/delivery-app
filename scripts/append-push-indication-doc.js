const fs = require('fs');
const path = require('path');

const planPath = path.join(__dirname, '..', 'PLAN_DE_TRABAJO.md');
let planContent = fs.readFileSync(planPath, 'utf8');

const docSection = `
- [x] **Indicación Activa y Permanente de Notificaciones Push (Administradores y Clientes):**
  - **Componente Mejorado (\`NotificationPermissionBanner.tsx\`):**
    - **Para el Administrador:** Franja destacada interactiva que explica detalladamente la importancia de activar las alertas sonoras (\`🔔 ¡Activa las Notificaciones Push del Administrador! - Para que la app web pueda avisarte con sonido de timbre y vibración inmediata cada vez que un cliente realice un nuevo pedido, incluso con la pantalla bloqueada o estando en otra aplicación\`). Incluye botón de activación y checklist visual de beneficios (\`✓ Sonido en vivo\`, \`✓ Avisos en segundo plano\`, \`✓ Vibración en teléfono\`).
    - **Para el Cliente:** Franja informativa desplegada tanto en el storefront (\`Layout.tsx\`) como en la pantalla de seguimiento en vivo de la orden (\`Checkout.tsx\` y \`MyOrders.tsx\`): \`🛵 ¡Activa las Notificaciones de tu Pedido! - Para que la app web pueda avisarte al instante cuando tu orden sea aceptada, esté en camino con el repartidor o haya llegado a tu puerta, sin mantener la pantalla abierta\`.
    - **Botón de Estado en Cabecera Administrativa (\`NotificationStatusButton\` en \`AdminLayout.tsx\`):** Píldora interactiva persistente en el encabezado de todas las páginas de gestión. Muestra \`[🔔 Alertas Activas]\` (permite probar el timbre con 1 clic) o \`[🔕 Activar Alertas 🔔]\` con animación de llamada a la acción si el dispositivo aún no tiene permisos.
    - **Guía de Desbloqueo Asistido (Permisos Denegados):** Si el navegador tiene las notificaciones bloqueadas (\`denied\`), se despliega una tarjeta explicativa con 3 pasos guiados indicando cómo tocar el icono del candado 🔒 y permitir alertas.
`;

planContent += docSection;
fs.writeFileSync(planPath, planContent, 'utf8');
console.log('Successfully appended Push Indication doc to PLAN_DE_TRABAJO.md!');
