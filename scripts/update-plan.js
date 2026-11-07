const fs = require('fs');

const path = 'PLAN_DE_TRABAJO.md';
let content = fs.readFileSync(path, 'utf8');

const section15 = `

---

## 15. Hitos Completados — Acceso Admin Dual, OCR Pago Móvil Inteligente, Sanitización Telefónica y Blindaje Anti-Baneo WhatsApp (2026-11-07)

### ✅ Tareas Ejecutadas y Verificadas:

- [x] **Acceso Administrativo Dual (Email o Nombre de Usuario):**
  - **Diagnóstico:** Los administradores intentaban ingresar usando su correo electrónico (\`jqcelis092@gmail.com\` o \`admin@demo.com\`), mientras que el controlador backend únicamente consultaba por \`username\`. Adicionalmente, el usuario principal en BD tenía \`username: null\`.
  - **Resolución:**
    - Se actualizó el controlador \`backend/controllers/authController.js\` para consultar indistintamente por \`username\` o por \`email\` en minúsculas: \`OR: [{ username: trimmedInput }, { email: trimmedInput.toLowerCase() }]\`.
    - Se normalizaron las cuentas en PostgreSQL:
      - **SuperAdmin:** Usuario \`jqcelis092\`, Email \`jqcelis092@gmail.com\`, Contraseña \`SuperAdmin2026!\`.
      - **Admin Tienda:** Usuario \`admin_demo\`, Email \`admin@demo.com\`, Contraseña \`Admin123!\`.
    - Se verificó mediante peticiones HTTP que el inicio de sesión responde \`200 OK\` exitoso con ambas variantes (email o usuario).

- [x] **Estrategia y Blindaje Técnico Anti-Baneo de WhatsApp:**
  - **Causa raíz de bloqueos en Meta/WhatsApp:** WhatsApp suspende números cuando detecta spam masivo no solicitado enviado a destinatarios desconocidos que reportan o bloquean la cuenta.
  - **Blindaje de TiendaFast:**
    1. **100% Iniciado por el Usuario (Opt-in Transaccional):** El bot nunca inicia conversaciones en frío ni envía publicidad masiva; únicamente responde con un código de verificación solicitado expresamente por el cliente en el checkout.
    2. **Huella Digital Real de Navegador:** Se configuró en Evolution API / Baileys una huella legítima de navegador de escritorio Chrome (\`Chrome (Linux)\`), evitando las firmas sospechosas de clientes automatizados.
    3. **Técnica Spintax (Variabilidad de Textos):** Cada código OTP se envía con 4 estructuras de redacción diferentes rotadas al azar, evitando patrones de hash idénticos que los filtros de spam rastrean.
    4. **Simulación de Digitación Humana (\`presence: composing\`):** Se implementó un retardo natural de 1.5 segundos con estado "escribiendo..." antes de entregar el mensaje.
    5. **Rate Limiting Estricto en Servidor:** Máximo 3 solicitudes por número telefónico cada 15 minutos en el backend, previniendo abusos o ataques de saturación.

- [x] **Validación Inteligente de Comprobante de Pago Móvil (OCR Asistido):**
  - **Diagnóstico del error en checkout:** Al confirmar el pedido, el backend arrojaba \`Error interno al procesar el pedido\` debido a que la columna \`payment_receipt_url\` existía en la tabla física de PostgreSQL pero faltaba en el modelo \`Order\` del archivo \`backend/prisma/schema.prisma\`.
  - **Corrección en Base de Datos y Prisma:** Se añadió el campo \`payment_receipt_url String?\` en \`model Order\`, se regeneró el cliente de Prisma (\`npx prisma generate\`) y se actualizó el manejador de errores de \`orderController.js\` para devolver mensajes claros en caso de cualquier inconsistencia.
  - **Validación de Monto Insuficiente por OCR:**
    - Al subir el capture de Pago Móvil, el motor OCR extrae la referencia y el monto pagado en Bolívares.
    - Se añadió una comparación automática frente al total esperado de la orden (\`conversions.ves\`):
      - **Si el monto detectado es inferior al total:** Se despliega un banner de advertencia destacado en color ámbar/rojo informando: \`"⚠️ Monto insuficiente detectado: El comprobante registra Bs. X, pero el total del pedido es Bs. Y"\`, alertando al cliente y previniendo el envío de comprobantes incompletos o erróneos.
      - **Si el monto cubre el total:** Se muestra una insignia de validación verde: \`"✅ Monto verificado: Bs. X (Cubre la totalidad del pedido)"\`.

- [x] **Sanitización Automática de Teléfono con Cero Inicial (\`0412...\` / \`412...\`):**
  - En Venezuela es común que los usuarios escriban su número con el cero local (\`04124742535\`).
  - **Frontend (\`Checkout.tsx\`):** Se implementó una limpieza reactiva en tiempo real (\`val.replace(/\\D/g, '').replace(/^0+/, '')\`) tanto en el formulario de acceso por WhatsApp como en el paso de entrega. El cero se descarta de inmediato al escribirlo o pegarlo, evitando números malformados como \`+580412...\`.
  - **Backend (\`whatsappService.js\` y \`authController.js\`):** Se robusteció la normalización telefónica para detectar y corregir automáticamente formatos con prefijos \`580...\`, \`04...\` o \`4...\`, asegurando que Evolution API siempre reciba el formato E.164 estándar (\`58412xxxxxxx\`).
`;

if (!content.includes('## 15. Hitos Completados')) {
  fs.writeFileSync(path, content.trim() + section15, 'utf8');
  console.log('Successfully appended Section 15 to PLAN_DE_TRABAJO.md');
} else {
  console.log('Section 15 already exists');
}
