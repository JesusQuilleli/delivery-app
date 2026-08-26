# Plataforma Delivery Multitenant
## Documentación Completa — Guía del Sistema v2.0

---

## 1. Resumen Ejecutivo

La Plataforma Delivery Multitenant es una solución tecnológica integral para digitalizar negocios de cualquier rubro: farmacias, restaurantes, supermercados, repuestos, bodegas y más. Permite gestionar tiendas virtuales independientes desde un único sistema central, con panel de administración privado, inventario completo, pedidos en tiempo real y soporte multi-monedas.

**Lo que ofrece:**
- Tienda virtual profesional con URL única por negocio
- Panel de administración en tiempo real con alertas sonoras y visuales
- Gestión de inventario, categorías, combos y precios
- Sistema de pedidos con flujo completo (creación → aceptación → despacho → entrega)
- Multi-monedas automáticas (USD, VES, COP) con tasas en tiempo real
- Notificaciones instantáneas vía WebSockets
- Mapas interactivos con cálculo de distancia y tiempo estimado
- Gestión de motorizados con integración WhatsApp
- Historial de pedidos con reportes e impresión
- Seguridad robusta: JWT, cookies httpOnly, rate limiting, validación de datos

---

## 2. Arquitectura del Sistema

### 2.1 Concepto Multitenant
Un único servidor y base de datos aloja múltiples tiendas. Cada tienda tiene:
- URL propia: `dominio.com/nombre-tienda`
- Inventario independiente
- Panel de administración aislado
- Configuraciones propias (moneda, ubicación GPS, logo, colores)
- Base de clientes propia

### 2.2 Stack Tecnológico

| Capa | Tecnología | Función |
|------|-----------|---------|
| Frontend | React 19 + TypeScript | Interfaz de usuario moderna y tipada |
| Bundler | Vite | Build ultra rápido para desarrollo y producción |
| Estilos | TailwindCSS + shadcn/ui | Diseño responsive con componentes profesionales |
| Mapas | React Leaflet | Mapas interactivos con rutas reales (OSRM) |
| Gráficas | Recharts | Dashboard con métricas visuales |
| Animaciones | Framer Motion | Transiciones suaves y micro-animaciones |
| Backend | Node.js + Express | API REST de alto rendimiento |
| Base de datos | PostgreSQL + Prisma ORM | Datos relacionales con integridad referencial |
| Tiempo real | Socket.io | Comunicación bidireccional instantánea |
| Almacenamiento | Cloudinary | Imágenes optimizadas en la nube |
| Email | Resend | Correos transaccionales (códigos OTP) |
| Autenticación | JWT + bcrypt | Tokens seguros en cookies httpOnly |

### 2.3 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTE                           │
│  ┌─────────┐  ┌──────────┐  ┌─────────────────┐   │
│  │ Landing │  │ Catálogo │  │ Checkout/Pedido │   │
│  └────┬────┘  └────┬─────┘  └───────┬─────────┘   │
│       └─────────────┴───────────────┘               │
│                         │                            │
│                    React Router                      │
└─────────────────────────┼───────────────────────────┘
                          │ HTTP + WebSocket
┌─────────────────────────┼───────────────────────────┐
│                    SERVIDOR                           │
│  ┌──────────────────────┴──────────────────────┐    │
│  │           Express.js + Socket.io             │    │
│  ├──────────┬──────────┬──────────┬────────────┤    │
│  │ Auth API │Store API │Order API │Inventory   │    │
│  │ (JWT)    │(tiendas) │(pedidos) │(productos) │    │
│  └────┬─────┴────┬─────┴────┬────┴─────┬──────┘    │
│       └──────────┴──────────┴──────────┘            │
│                         │                            │
│                   Prisma ORM                         │
│                         │                            │
│                  PostgreSQL DB                        │
└─────────────────────────────────────────────────────┘
```

---

## 3. Flujo Completo del Cliente

### 3.1 Descubrimiento y Navegación

**Paso 1: Landing Page**
El cliente accede a `dominio.com/nombre-tienda`. Ve una página de inicio profesional con:
- Banner principal con imagen de la tienda
- Categorías populares con imágenes
- Productos destacados y ofertas
- Sección de contacto y redes sociales
- Botón de WhatsApp flotante

**Paso 2: Catálogo de Productos**
El cliente navega al catálogo completo:
- Barra de búsqueda predictiva (tolera errores tipográficos)
- Filtros por categoría
- Vista de productos en cuadrícula con imagen, nombre y precio
- Precios mostrados en la moneda configurada por la tienda
- Indicador de disponibilidad (agotado vs disponible)

**Paso 3: Detalle de Producto**
Al hacer clic en un producto:
- Imagen en alta calidad
- Nombre, descripción y precio
- Stock disponible
- Botón "Agregar al Carrito"
- Productos relacionados (si existen)

**Paso 4: Carrito de Compras**
- Lista de productos agregados con cantidades
- Subtotal por producto
- Total con conversión automática de monedas
- Botón para proceder al checkout

### 3.2 Proceso de Checkout (5 Pasos)

**Paso 1: Identificación**
El cliente ingresa su correo electrónico. El sistema verifica si ya tiene cuenta:
- Si es registrado: muestra sus datos (nombre, teléfono)
- Si es nuevo: pide completar nombre y teléfono

**Paso 2: Verificación OTP**
Se envía un código de 6 dígitos al correo electrónico:
- Código válido por 10 minutos
- Rate limiting: 1 código por minuto por email
- El cliente ingresa el código para autenticarse

**Paso 3: Dirección de Entrega**
- Buscador de direcciones con autocompletado
- Mapa interactivo para ajustar la ubicación exacta
- Botón "Usar mi ubicación" (GPS del celular)
- Campo para referencias adicionales (piso, casa, etc.)

**Paso 4: Método de Pago**
Dos opciones:
- **Efectivo:** Selección de moneda (USD, VES, COP) con tasas del día
- **Pago Móvil:** Datos bancarios de la tienda + campo para ingresar referencia de 6 dígitos

**Paso 5: Confirmación en Tiempo Real**
- Timeline animado que muestra el estado del pedido
- El cliente ve cuando el admin acepta, prepara y despacha
- Notificaciones push si otorga permiso

### 3.3 Seguimiento del Pedido

El cliente puede ver sus pedidos en `dominio.com/tienda/mis-pedidos`:
- Lista cronológica de todos sus pedidos
- Estado actual con colores (Pendiente = naranja, Preparando = azul, En Camino = púrpura, Entregado = verde)
- Timeline detallado con actualizaciones en tiempo real
- Opción de cancelar pedidos pendientes
- Opción de calificar pedidos entregados (1-5 estrellas + reseña)
- Contactar motorizado asignado (si aplica)

---

## 4. Flujo Completo del Administrador

### 4.1 Acceso al Panel

**URL:** `dominio.com/admin-login`

El administrador ingresa con:
- Usuario (username)
- Contraseña (encriptada con bcrypt)

**Características de seguridad:**
- JWT en cookie httpOnly (no expuesto al JavaScript)
- Token de admin dura 1 día (se renueva automáticamente)
- Bloqueo de cuenta después de 5 intentos fallidos (15 minutos)
- Rate limiting: máximo 5 intentos de login por minuto por IP
- Headers de seguridad HTTP (Helmet)

### 4.2 Panel de Despachos (Dashboard)

**URL:** `dominio.com/admin/tienda-slug`

El dashboard es el centro de control principal. Muestra 4 columnas/tabs:

#### Tab 1: Por Aprobar (Amarillo)
Pedidos con pago por transferencia que necesitan validación:
- El admin ve los datos del pago (referencia, monto)
- Puede aprobar el pago (cambia a PENDIENTE) o rechazarlo
- Ideal para verificar pagos móviles antes de procesar

#### Tab 2: Nuevas Órdenes (Naranja)
Pedidos en efectivo o pagos aprobados que esperan aceptación:
- Alerta sonora cuando llega un pedido nuevo
- Modal emergente con detalles del pedido (artículos, dirección, monto)
- Botones de Aprobar y Rechazar directamente desde el modal
- Si hay múltiples pedidos nuevos, se muestran en cola secuencialmente
- Indicador visual de pedidos sin leer (dot pulsante)
- Indicador de urgencia para pedidos >10 minutos sin atención

#### Tab 3: Preparando (Azul)
Pedidos aceptados que la tienda está preparando:
- Lista de pedidos en proceso
- Opción de despachar con motorizado asignado
- Tiempo estimado de entrega visible

#### Tab 4: En Camino (Púrpura)
Pedidos despachados con motorizado en ruta:
- Información del motorizado asignado
- Opción de marcar como entregado
- Notificación al cliente por WhatsApp (opcional)

#### Funcionalidades del Dashboard

**Alertas de Nuevos Pedidos:**
- Sonido de notificación al recibir pedido nuevo
- Notificación nativa del navegador si la pestaña está en segundo plano
- Modal emergente con resumen del pedido
- Si llegan varios pedidos, se muestran en cola (no se sobreescribe)

**Hotkeys de Teclado (Desktop):**
- `Enter` → Aprobar el pedido actual
- `R` → Abrir dialog de rechazo
- `Escape` → Omitir el pedido actual (siguiente en la cola)

**Acciones Rápidas:**
- Botones de Aprobar/Rechazar directamente en cada fila (desktop) o tarjeta (móvil)
- No es necesario abrir el detalle del pedido para aceptar o rechazar

**Selección Múltiple:**
- Botón "Seleccionar" para activar modo selección
- Checkboxes en cada pedido para seleccionar varios
- Botón "Seleccionar todos" para marcar toda la página
- Barra de acciones batch: "Aceptar seleccionados" / "Rechazar seleccionados"

**Indicadores Visuales:**
- Pedidos sin leer: dot pulsante al lado del ID
- Pedidos urgentes (>10 min): borde rojo + badge "URGENTE"
- Tiempo transcurrido actualizado cada 30 segundos ("Hace 5m")
- Badge de conexión WebSocket (verde = conectado, amarillo = reconectando)

### 4.3 Detalle de Pedido

**URL:** `dominio.com/admin/tienda-slug/order/ID`

Vista completa de un pedido con:

**Mapa y Ruta:**
- Mapa interactivo con marcador de tienda y cliente
- Ruta real calculada por OSRM (Open Source Routing Machine)
- Distancia en kilómetros y tiempo estimado

**Datos del Cliente:**
- Nombre y teléfono (clickeable para llamar)
- Dirección de entrega completa
- Método de pago y referencia (si aplica)

**Lista de Artículos:**
- Productos con cantidad, precio unitario y subtotal
- Total del pedido

**Acciones según Estado:**

| Estado Actual | Acción Disponible | Resultado |
|---------------|-------------------|-----------|
| AWAITING_PAYMENT | Aprobar Pago | Cambia a PENDING |
| AWAITING_PAYMENT | Rechazar | Cambia a CANCELLED |
| PENDING | Aceptar | Cambia a ACCEPTED |
| PENDING | Rechazar | Cambia a CANCELLED |
| ACCEPTED | Despachar | Abre selector de motorizado |
| DISPATCHED | Marcar Entregado | Cambia a DELIVERED |

**Selector de Motorizado:**
- Lista de motorizados activos de la tienda
- Opción de omitir (despachar sin motorizado asignado)
- Al despachar: se envía WhatsApp al motorizado con datos del cliente y link de GPS

### 4.4 Gestión de Inventario

**URL:** `dominio.com/admin/tienda-slug/inventory`

Panel completo para gestionar productos:

**Pestaña de Productos:**
- Lista paginada con búsqueda en tiempo real
- Crear nuevo producto: nombre, precio, descripción, imagen, categoría, stock
- Editar producto existente
- Activar/desactivar disponibilidad
- Carga masiva via CSV/Excel (hundreds de productos a la vez)

**Pestaña de Categorías:**
- Crear, editar y eliminar categorías
- Imagen de categoría para el catálogo público
- Eliminar categoría elimina en cascada sus productos

**Pestaña de Combos:**
- Crear combos seleccionando productos existentes
- Definir cantidad de cada producto en el combo
- Precio especial del combo
- Stock del combo calculado automáticamente

**Características:**
- Búsqueda predictiva (fuzzy search)
- Filtrado por categoría
- Paginación server-side (nunca carga todo de golpe)
- Subida de imágenes a Cloudinary (formato WebP automático)

### 4.5 Gestión de Clientes

**URL:** `dominio.com/admin/tienda-slug/customers`

- Lista de todos los clientes que han hecho pedidos
- Datos: nombre, email, teléfono, cantidad de pedidos
- Editar información del cliente
- Eliminar cliente (con confirmación)

### 4.6 Gestión de Motorizados

**URL:** `dominio.com/admin/tienda-slug/drivers`

- Crear motorizado: nombre, teléfono, placa del vehículo
- Activar/desactivar motorizado
- Editar información
- Eliminar motorizado
- Los motorizados activos aparecen en el selector al despachar pedidos

### 4.7 Configuración de la Tienda

**URL:** `dominio.com/admin/tienda-slug/settings`

- **Nombre de la tienda**
- **Moneda principal:** USD, VES o COP
- **Tasas de cambio:** Manual o automática (API del BCV)
- **Ubicación GPS:** Mapa interactivo para fijar la ubicación exacta
- **Industria:** Farmacia, Restaurante, Supermercado, etc.
- **Color del tema:** Personalización visual

### 4.8 Historial de Pedidos

**URL:** `dominio.com/admin/tienda-slug/history`

- Lista de pedidos entregados y cancelados
- Filtros por rango de fechas
- KPIs: Ventas de Hoy, Ventas del Mes, Histórico Total, Pedidos Entregados
- Opción de imprimir reporte
- Eliminar pedidos del historial (con confirmación)

---

## 5. Sistema de Notificaciones en Tiempo Real

### 5.1 Para el Administrador

| Evento | Notificación |
|--------|-------------|
| Nuevo pedido | Sonido + modal emergente + notificación nativa del SO |
| Pedido actualizado | Se refleja instantáneamente en el dashboard |
| Múltiples pedidos | Cola secuencial con indicador de pendientes |
| Conexión perdida | Indicador "Reconectando..." + reconexión automática |

### 5.2 Para el Cliente

| Evento | Notificación |
|--------|-------------|
| Pedido aceptado | Timeline se actualiza en tiempo real |
| Pedido en camino | Se muestra datos del motorizado |
| Pedido entregado | Timeline completa + opción de calificar |

### 5.3 Tecnología WebSocket

- Comunicación bidireccional sin recargar página
- Salas por tienda (`store_{id}`) y por cliente (`client_{id}`)
- Reconexión automática con backoff exponencial
- Fallback a polling HTTP cada 60 segundos si WebSocket falla

---

## 6. Sistema de Seguridad

### 6.1 Autenticación

| Medida | Implementación |
|--------|---------------|
| JWT | Tokens firmados con secret de 128 caracteres |
| Cookies | httpOnly, secure, sameSite: None |
| Clientes | OTP por email (código de 6 dígitos, expira en 10 min) |
| Admins | Username + password (bcrypt hash) |
| Renovación | Token se renueva automáticamente cada 30 minutos |
| Logout | Limpieza de cookie en servidor y estado en cliente |

### 6.2 Autorización

| Rol | Permisos |
|-----|----------|
| CLIENT | Crear pedidos, ver sus pedidos, cancelar/calificar |
| ADMIN | Gestionar su tienda completa (inventario, pedidos, clientes, drivers) |
| SUPERADMIN | Todo lo de ADMIN + crear tiendas, activar/desactivar tiendas |

### 6.3 Protección de Datos

- **Rate Limiting:** Límite de peticiones por IP y por ruta
- **Body Size Limit:** Máximo 1MB por request
- **Helmet:** Headers de seguridad HTTP (HSTS, CSP, X-Frame-Options)
- **CORS:** Lista blanca de dominios permitidos
- **Validación Zod:** Todos los inputs validados con schemas tipados
- **Precios server-side:** El backend recalcula precios desde la DB (nunca confía en el cliente)
- **IDOR Protection:** Middlewares que verifican que cada admin solo acceda a su tienda
- **Contra carrera:** Updates con condición WHERE para evitar conflictos multi-admin
- **Cuenta bloqueada:** 5 intentos fallidos → bloqueo de 15 minutos

### 6.4 Infraestructura

- Base de datos PostgreSQL en Neon (cloud)
- Backend en Render (auto-scaling)
- Frontend en Vercel (CDN global)
- Imágenes en Cloudinary (optimización automática WebP)

---

## 7. Gestión de Monedas

### 7.1 Configuración

Cada tienda define su moneda principal y tasas de cambio:
- **USD** (Dólares Americanos)
- **VES** (Bolívares Venezolanos)
- **COP** (Pesos Colombianos)

### 7.2 Conversión Automática

- Tasas actualizadas manualmente o vía API del BCV
- El cliente ve precios en la moneda de la tienda
- En el checkout, se muestra el desglose en todas las monedas
- El admin cobra en la moneda que el cliente elija

### 7.3 Ejemplo

Tienda configurada en USD con tasa VES = 36.5:
- Producto: $10.00 USD
- Cliente ve: Bs. 365.00 VES
- En checkout: "Total a pagar: $10.00 USD / Bs. 365.00 VES"

---

## 8. Gestión de Pedidos — Estado y Flujo

### 8.1 Estados del Pedido

```
AWAITING_PAYMENT  (pago por transferencia, esperando validación)
        │
        ▼ (Admin aprueba pago)
      PENDING
     /      \
    ▼        ▼
ACCEPTED   CANCELLED
    │
    ▼ (Admin asigna motorizado)
DISPATCHED
    │
    ▼ (Admin marca entregado O cliente califica)
DELIVERED
```

### 8.2 Transiciones Válidas

| Desde | Hasta | Quién |
|-------|-------|-------|
| AWAITING_PAYMENT | PENDING | Admin (aprueba pago) |
| AWAITING_PAYMENT | CANCELLED | Admin (rechaza pago) |
| PENDING | ACCEPTED | Admin (acepta pedido) |
| PENDING | CANCELLED | Admin o Cliente |
| ACCEPTED | DISPATCHED | Admin (despacha) |
| ACCEPTED | CANCELLED | Admin |
| DISPATCHED | DELIVERED | Admin o Cliente (califica) |

### 8.3 Protección Contra Carrera

Si dos admins intentan modificar el mismo pedido simultáneamente:
- El primer cambio se aplica
- El segundo recibe error 409 "Pedido ya fue modificado"
- El dashboard recarga automáticamente la lista

---

## 9. Panel de Super Administrador

**URL:** `dominio.com/superadmin`

Acceso exclusivo para el propietario de la plataforma:

- **Crear tiendas:** Registra una nueva tienda con su admin asociado
- **Activar/Desactivar tiendas:** Control de acceso por tienda
- **Listar todas las tiendas:** Vista general de todas las tiendas del sistema
- **Acceso a cualquier tienda:** Puede ver y gestionar cualquier tienda

---

## 10. Funcionalidades Técnicas Avanzadas

### 10.1 Cálculo de Distancia y Tiempo

- Fórmula de Haversine para calcular distancia entre tienda y cliente
- Factor de corrección x1.4 para distancia real (no recta)
- Tiempo estimado: `(distancia_km / 25) * 60 + 15` minutos
- Ruta real calculada por OSRM (Open Source Routing Machine)

### 10.2 Carga Masiva de Productos

- Subir archivo CSV o Excel con productos
- Validación de columnas requeridas
- Creación en lote con `createMany` de Prisma
- Manejo de errores por fila

### 10.3 Integración WhatsApp

- Al despachar pedido: envía WhatsApp al motorizado con:
  - Datos del cliente (nombre, teléfono)
  - Dirección de entrega
  - Link de navegación GPS
- Opcionalmente notifica al cliente con datos del motorizado

### 10.4 Impresión de Reportes

- Historial de pedidos con filtro por fechas
- KPIs de ventas (hoy, mes, histórico)
- Botón de imprimir con estilos optimizados para papel

---

## 11. Experiencia de Usuario

### 11.1 Diseño Visual

- **Glassmorphism:** Elementos translúcidos con desenfoques de fondo
- **Micro-animaciones:** Transiciones suaves entre páginas
- **Fuentes:** Manrope (cuerpo) + Sora (encabezados)
- **Colores:** Tema personalizable por tienda

### 11.2 Responsive

- **Desktop:** Tabla completa con todas las columnas
- **Móvil:** Tarjetas verticales con acciones rápidas
- **Tablet:** Layout adaptativo entre ambos

### 11.3 Accesibilidad

- Contraste de colores WCAG AA
- Navegación por teclado (hotkeys en admin)
- Labels en formularios
- Estados visuales claros (colores + iconos)

---

## 12. Requisitos para Implementación

### 12.1 Para el Cliente (Tienda)

| Requisito | Descripción |
|-----------|-------------|
| Dominio | Un nombre de dominio (ej: `mitienda.com`) |
| Logo | Imagen de la tienda para la landing page |
| Productos | Lista de productos con nombre, precio, descripción e imagen |
| Categorías | Clasificación de productos (mínimo 1) |
| Ubicación GPS | Coordenadas exactas de la tienda |
| Datos bancarios | Para pagos móviles (opcional) |
| Número WhatsApp | Para notificaciones a motorizados (opcional) |

### 12.2 Para el Proveedor (Nosotros)

| Requisito | Descripción |
|-----------|-------------|
| Servidor | Render (ya configurado) |
| Base de datos | PostgreSQL en Neon (ya configurado) |
| Cloudinary | Cuenta para almacenamiento de imágenes |
| Dominio DNS | Configuración de subdominios |
| SSL | Certificado HTTPS (automático en Vercel/Render) |

---

## 13. Roadmap de Mejoras Futuras

### Fase 3 (Próximamente)
- Notificaciones push móviles (PWA)
- App móvil nativa para administradores
- Sistema de suscripciones y planes
- Múltiples motorizados por pedido
- Chat en tiempo real cliente-admin
- Sistema de devoluciones
- Cupones y descuentos
- Programa de fidelidad

### Fase 4 (Escalabilidad)
- Subdominios por tienda (`farmacia.dominio.com`)
- Branding completo por tienda (logo, colores, fuentes)
- API pública para integraciones externas
- Webhooks para sistemas de inventario
- Analytics avanzados con ML
- Multi-idioma (i18n)

---

## 14. Soporte y Mantenimiento

### 14.1 Actualizaciones
- El sistema se actualiza sin downtime (deploy continuo)
- Frontend: Vercel (deploy automático al hacer push)
- Backend: Render (deploy automático al hacer push)

### 14.2 Backups
- Base de datos: Neon realiza backups automáticos diarios
- Imágenes: Cloudinary mantiene original + backups

### 14.3 Monitoreo
- Logs de errores en el servidor
- Métricas de rendimiento
- Alertas de caída del servicio

---

## 15. Preguntas Frecuentes

**¿Puedo tener más de una tienda?**
Sí. La arquitectura multitenant permite crear infinitas tiendas desde el panel de Super Admin.

**¿Necesito saber programar?**
No. El panel de administración es 100% visual. Puedes gestionar productos, pedidos, clientes y configuraciones sin tocar código.

**¿Funciona en el celular?**
Sí. Tanto la tienda pública como el panel de administración son 100% responsive y funcionan en cualquier dispositivo.

**¿Cuántos productos puedo cargar?**
No hay límite. El sistema usa paginación inteligente que carga productos de forma gradual.

**¿Cómo se actualizan las tasas de cambio?**
Puedes configurarlas manualmente en ajustes o conectar la API del BCV para actualización automática.

**¿Puedo personalizar los colores de mi tienda?**
Sí. Cada tienda tiene su propio color de tema configurable desde el panel de administración.

**¿Los pedidos se pierden si se cae internet?**
No. Los pedidos se guardan en la base de datos. Si la conexión se restaura, todo se sincroniza automáticamente.

**¿Puedo tener varios admins en la misma tienda?**
Sí. Cada tienda puede tener múltiples administradores con las mismas credenciales o credenciales separadas.

---

*Documento generado para la Plataforma Delivery Multitenant v2.0*
*Última actualización: Agosto 2026*
