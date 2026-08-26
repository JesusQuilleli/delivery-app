# Flujo Completo de la Aplicacion — Plataforma Delivery Multitenant

---

## 1. Vista General

La Plataforma Delivery Multitenant es un sistema completo de ventas y gestion de inventario para negocios de cualquier rubro (farmacias, restaurantes, supermercados, repuestos, bodegas). Permite crear multiples tiendas virtuales independientes desde un unico servidor, cada una con su URL propia, inventario, panel de administracion y base de clientes.

**URL de produccion:** `https://test.shop-mg.com`
**Backend API:** `https://delivery-app-3ewq.onrender.com/api`

---

## 2. Arquitectura del Sistema

### 2.1 Componentes Principales

| Componente | Tecnologia | Funcion |
|------------|-----------|---------|
| Frontend | React 19 + TypeScript + Vite 8 | Interfaz de usuario moderna y responsive |
| Backend | Node.js + Express.js | API REST y WebSockets |
| Base de datos | PostgreSQL + Prisma ORM | Almacenamiento relacional |
| Tiempo real | Socket.io | Notificaciones instantaneas |
| Imagenes | Cloudinary | Almacenamiento optimizado en la nube |
| Email | Resend | Envio de codigos OTP |
| Mapas | OSRM + Leaflet | Rutas reales y mapas interactivos |
| Auth | JWT + bcrypt | Autenticacion segura con cookies httpOnly |

### 2.2 Arquitectura Multitenant

Cada tienda opera de forma completamente aislada:
- URL propia: `dominio.com/nombre-tienda`
- Inventario independiente
- Panel de administracion privado
- Configuraciones propias (moneda, ubicacion GPS, logo, colores)
- Base de clientes propia
- Multiples administradores por tienda

### 2.3 Diagrama de Flujo de Datos

```
Cliente (Navegador)
    │
    │ HTTP/HTTPS
    │
    ▼
┌─────────────────────────────────────┐
│           Nginx (Reverse Proxy)      │
│  - SSL/TLS                           │
│  - Rutas /api/* → Backend            │
│  - Rutas /* → Frontend estatico      │
└──────────┬──────────┬───────────────┘
           │          │
    ┌──────▼──┐  ┌────▼──────────┐
    │Frontend │  │   Backend     │
    │React    │  │  Express.js   │
    │(Estatico│  │  + Socket.io  │
    │  dist/) │  │  Puerto 3000  │
    └─────────┘  └───────┬───────┘
                         │
                 ┌───────▼───────┐
                 │  PostgreSQL   │
                 │  + Prisma ORM │
                 └───────────────┘
```

---

## 3. Flujo del Cliente (Comprador)

### 3.1 Acceso a la Tienda

El cliente accede a la URL de la tienda:
```
https://test.shop-mg.com/farmacia-ayacucho
```

**Lo que ve:**
- Landing page profesional con banner principal
- Categorias populares con imagenes destacadas
- Productos destacados y ofertas
- Seccion de contacto y redes sociales
- Boton de WhatsApp flotante
- Barra de navegacion con buscador, carrito y pedidos

### 3.2 Navegacion del Catalogo

**Explorar categorias:**
- Haz clic en una categoria para ver solo sus productos
- Cada categoria tiene imagen y nombre descriptivo

**Buscar productos:**
- Usa la barra de busqueda en la parte superior
- Busqueda predictiva que tolera errores tipographicos
- Muestra resultados en tiempo real mientras escribes

**Ver producto:**
- Haz clic en cualquier producto del catalogo
- Ve imagen en alta calidad, nombre, descripcion, precio y stock disponible
- Selecciona cantidad y haz clic en "Agregar al Carrito"

### 3.3 Carrito de Compras

**Agregar productos:**
- Desde el catalogo o desde el detalle del producto
- El icono del carrito muestra la cantidad de items

**Ver carrito:**
- Haz clic en el icono del carrito en la barra superior
- Lista de productos con cantidad, precio unitario y subtotal
- Total calculado automaticamente en la moneda de la tienda
- Boton para eliminar productos
- Boton para proceder al checkout

### 3.4 Proceso de Checkout (5 Pasos)

#### Paso 1: Identificacion
- Ingresa tu correo electronico
- Si es la primera vez: completa nombre y telefono
- Si ya tienes cuenta: se cargan tus datos automaticamente

#### Paso 2: Verificacion OTP
- Se envia un codigo de 6 digitos a tu correo
- Ingresa el codigo en el campo correspondiente
- El codigo es valido por 10 minutos
- Rate limiting: 1 codigo por minuto por email

#### Paso 3: Direccion de Entrega
- Escribe tu direccion en el buscador
- Se autocompleta con sugerencias
- Ajusta la ubicacion exacta arrastrando el pin en el mapa
- O usa "Mi ubicacion" para GPS automatico
- Campo opcional para referencias (piso, casa, edificio, etc.)

#### Paso 4: Metodo de Pago
Dos opciones disponibles:

**Efectivo:**
- Selecciona la moneda (USD, VES o COP)
- El sistema muestra la tasa de cambio del dia
- Indica si necesitas cambio

**Pago Movil:**
- Se muestran los datos bancarios de la tienda
- Ingresa la referencia de 6 digitos de tu transferencia
- El pedido queda en estado "Por Aprobar" hasta que el admin valide

#### Paso 5: Confirmacion
- Revisa el resumen del pedido
- Haz clic en "Realizar Pedido"
- El pedido se envia al administrador en tiempo real

### 3.5 Seguimiento del Pedido

**Acceder a mis pedidos:**
- Ve a `https://test.shop-mg.com/farmacia-ayacucho/mis-pedidos`
- Requiere estar autenticado (login con OTP)

**Lo que ves:**
- Lista cronologica de todos tus pedidos
- Estado actual con colores:
  - Naranja: Pendiente (esperando aceptacion)
  - Azul: Preparando
  - Purpura: En Camino (con motorizado)
  - Verde: Entregado
  - Rojo: Cancelado
- Timeline detallado con actualizaciones en tiempo real
- Monto total pagado
- Direccion de entrega

**Acciones disponibles:**

| Estado | Accion |
|--------|--------|
| Pendiente | Cancelar pedido |
| Entregado | Calificar con 1-5 estrellas + resena |

### 3.6 Calificar un Pedido

Despues de que el pedido se marca como entregado:
- Haz clic en "Calificar"
- Selecciona de 1 a 5 estrellas
- Escribe una resena (opcional)
- Confirma la calificacion

---

## 4. Flujo del Administrador (Dueño de la Tienda)

### 4.1 Inicio de Sesion

**URL:** `https://test.shop-mg.com/admin-login`

**Credenciales:**
- Usuario: username del admin
- Contraseña: password encriptada

**Seguridad:**
- JWT en cookie httpOnly (no expuesto al JavaScript)
- Bloqueo de cuenta despues de 5 intentos fallidos (15 minutos)
- Rate limiting: maximo 5 intentos por minuto por IP
- Token de admin dura 1 dia (se renueva automaticamente cada 30 minutos)

### 4.2 Panel de Despachos (Dashboard Principal)

**URL:** `https://test.shop-mg.com/admin/farmacia-ayacucho`

El dashboard es el centro de control. Muestra 4 columnas/tabs:

#### Tab 1: Por Aprobar (Amarillo)
Pedidos con pago por transferencia que necesitan validacion:
- El admin ve los datos del pago (referencia, monto, banco)
- Puede aprobar el pago (cambia a PENDIENTE) o rechazarlo
- Ideal para verificar pagos moviles antes de procesar

#### Tab 2: Nuevas Ordenes (Naranja)
Pedidos en efectivo o pagos aprobados que esperan aceptacion:
- Alerta sonora cuando llega un pedido nuevo
- Modal emergente con detalles del pedido (articulos, direccion, monto)
- Botones de Aprobar y Rechazar directamente desde el modal
- Si hay multiples pedidos nuevos, se muestran en cola secuencialmente
- Indicador visual de pedidos sin leer (dot pulsante)
- Indicador de urgencia para pedidos de mas de 10 minutos sin atencion

#### Tab 3: Preparando (Azul)
Pedidos aceptados que la tienda esta preparando:
- Lista de pedidos en proceso
- Opcion de despachar con motorizado asignado
- Tiempo estimado de entrega visible

#### Tab 4: En Camino (Purpura)
Pedidos despachados con motorizado en ruta:
- Informacion del motorizado asignado
- Opcion de marcar como entregado
- Notificacion al cliente por WhatsApp (opcional)

### 4.3 Funcionalidades del Dashboard

#### Alertas de Nuevos Pedidos
- Sonido de notificacion al recibir pedido nuevo
- Notificacion nativa del navegador si la pestana esta en segundo plano
- Modal emergente con resumen del pedido
- Si llegan varios pedidos, se muestran en cola (no se sobreescribe)

#### Hotkeys de Teclado (Desktop)
- `Enter` → Aprobar el pedido actual
- `R` → Abrir dialog de rechazo
- `Escape` → Omitir el pedido actual (siguiente en la cola)

#### Acciones Rapidas
- Botones de Aprobar/Rechazar directamente en cada fila (desktop) o tarjeta (movil)
- No es necesario abrir el detalle del pedido para aceptar o rechazar

#### Seleccion Multiple
- Boton "Seleccionar" para activar modo seleccion
- Checkboxes en cada pedido para seleccionar varios
- Boton "Seleccionar todos" para marcar toda la pagina
- Barra de acciones batch: "Aceptar seleccionados" / "Rechazar seleccionados"

#### Indicadores Visuales
- Pedidos sin leer: dot pulsante al lado del ID
- Pedidos urgentes (>10 min): borde rojo + badge "URGENTE"
- Tiempo transcurrido actualizado cada 30 segundos ("Hace 5m")
- Badge de conexion WebSocket (verde = conectado, amarillo = reconectando)

### 4.4 Detalle de Pedido

**URL:** `https://test.shop-mg.com/admin/farmacia-ayacucho/order/ID`

Vista completa de un pedido:

**Mapa y Ruta:**
- Mapa interactivo con marcador de tienda y cliente
- Ruta real calculada por OSRM (Open Source Routing Machine)
- Distancia en kilometros y tiempo estimado

**Datos del Cliente:**
- Nombre y telefono (clickeable para llamar)
- Direccion de entrega completa
- Metodo de pago y referencia (si aplica)

**Lista de Articulos:**
- Productos con cantidad, precio unitario y subtotal
- Total del pedido

**Acciones segun Estado:**

| Estado Actual | Accion Disponible | Resultado |
|---------------|-------------------|-----------|
| AWAITING_PAYMENT | Aprobar Pago | Cambia a PENDING |
| AWAITING_PAYMENT | Rechazar | Cambia a CANCELLED |
| PENDING | Aceptar | Cambia a ACCEPTED |
| PENDING | Rechazar | Cambia a CANCELLED |
| ACCEPTED | Despachar | Abre selector de motorizado |
| DISPATCHED | Marcar Entregado | Cambia a DELIVERED |

**Selector de Motorizado:**
- Lista de motorizados activos de la tienda
- Opcion de omitir (despachar sin motorizado asignado)
- Al despachar: se envia WhatsApp al motorizado con datos del cliente y link de GPS

### 4.5 Gestion de Inventario

**URL:** `https://test.shop-mg.com/admin/farmacia-ayacucho/inventory`

Panel completo para gestionar productos:

**Pestana de Productos:**
- Lista paginada con busqueda en tiempo real
- Crear nuevo producto: nombre, precio, descripcion, imagen, categoria, stock
- Editar producto existente
- Activar/desactivar disponibilidad
- Carga masiva via CSV/Excel (cientos de productos a la vez)

**Pestana de Categorias:**
- Crear, editar y eliminar categorias
- Imagen de categoria para el catalogo publico
- Eliminar categoria elimina en cascada sus productos

**Pestana de Combos:**
- Crear combos seleccionando productos existentes
- Definir cantidad de cada producto en el combo
- Precio especial del combo
- Stock del combo calculado automaticamente

**Caracteristicas:**
- Busqueda predictiva (fuzzy search)
- Filtrado por categoria
- Paginacion server-side (nunca carga todo de golpe)
- Subida de imagenes a Cloudinary (formato WebP automatico)

### 4.6 Gestion de Clientes

**URL:** `https://test.shop-mg.com/admin/farmacia-ayacucho/customers`

- Lista de todos los clientes que han hecho pedidos
- Datos: nombre, email, telefono, cantidad de pedidos
- Editar informacion del cliente
- Eliminar cliente (con confirmacion)

### 4.7 Gestion de Motorizados

**URL:** `https://test.shop-mg.com/admin/farmacia-ayacucho/drivers`

- Crear motorizado: nombre, telefono, placa del vehiculo
- Activar/desactivar motorizado
- Editar informacion
- Eliminar motorizado
- Los motorizados activos aparecen en el selector al despachar pedidos

### 4.8 Configuracion de la Tienda

**URL:** `https://test.shop-mg.com/admin/farmacia-ayacucho/settings`

- **Nombre de la tienda**
- **Moneda principal:** USD, VES o COP
- **Tasas de cambio:** Manual o automatica (API del BCV)
- **Ubicacion GPS:** Mapa interactivo para fijar la ubicacion exacta
- **Industria:** Farmacia, Restaurante, Supermercado, etc.
- **Color del tema:** Personalizacion visual

### 4.9 Historial de Pedidos

**URL:** `https://test.shop-mg.com/admin/farmacia-ayacucho/history`

- Lista de pedidos entregados y cancelados
- Filtros por rango de fechas
- KPIs: Ventas de Hoy, Ventas del Mes, Historico Total, Pedidos Entregados
- Opcion de imprimir reporte
- Eliminar pedidos del historial (con confirmacion)

---

## 5. Estados del Pedido

### 5.1 Diagrama de Estados

```
AWAITING_PAYMENT (pago por transferencia, esperando validacion)
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

### 5.2 Tabla de Transiciones

| Desde | Hasta | Quien la ejecuta |
|-------|-------|------------------|
| AWAITING_PAYMENT | PENDING | Admin (aprueba pago) |
| AWAITING_PAYMENT | CANCELLED | Admin (rechaza pago) |
| PENDING | ACCEPTED | Admin (acepta pedido) |
| PENDING | CANCELLED | Admin o Cliente |
| ACCEPTED | DISPATCHED | Admin (despacha) |
| ACCEPTED | CANCELLED | Admin |
| DISPATCHED | DELIVERED | Admin o Cliente (califica) |

### 5.3 Proteccion Contra Carrera

Si dos admins intentan modificar el mismo pedido simultaneamente:
- El primer cambio se aplica
- El segundo recibe error 409 "Pedido ya fue modificado"
- El dashboard recarga automaticamente la lista

---

## 6. Sistema de Notificaciones en Tiempo Real

### 6.1 Para el Administrador

| Evento | Notificacion |
|--------|-------------|
| Nuevo pedido | Sonido + modal emergente + notificacion nativa del SO |
| Pedido actualizado | Se refleja instantaneamente en el dashboard |
| Multiples pedidos | Cola secuencial con indicador de pendientes |
| Conexion perdida | Indicador "Reconectando..." + reconexion automatica |

### 6.2 Para el Cliente

| Evento | Notificacion |
|--------|-------------|
| Pedido aceptado | Timeline se actualiza en tiempo real |
| Pedido en camino | Se muestra datos del motorizado |
| Pedido entregado | Timeline completa + opcion de calificar |

### 6.3 Tecnologia WebSocket

- Comunicacion bidireccional sin recargar pagina
- Salas por tienda (`store_{id}`) y por cliente (`client_{id}`)
- Reconexion automatica con backoff exponencial
- Fallback a polling HTTP cada 60 segundos si WebSocket falla

---

## 7. Sistema de Seguridad

### 7.1 Autenticacion

| Medida | Implementacion |
|--------|---------------|
| JWT | Tokens firmados con secreto de 128 caracteres |
| Cookies | httpOnly, secure, sameSite: None |
| Clientes | OTP por email (codigo de 6 digitos, expira en 10 min) |
| Admins | Username + password (bcrypt hash) |
| Renovacion | Token se renueva automaticamente cada 30 minutos |
| Logout | Limpieza de cookie en servidor y estado en cliente |

### 7.2 Autorizacion

| Rol | Permisos |
|-----|----------|
| CLIENT | Crear pedidos, ver sus pedidos, cancelar/calificar |
| ADMIN | Gestionar su tienda completa (inventario, pedidos, clientes, drivers) |
| SUPERADMIN | Todo lo de ADMIN + crear tiendas, activar/desactivar tiendas |

### 7.3 Proteccion de Datos

- **Rate Limiting:** Limite de peticiones por IP y por ruta
- **Body Size Limit:** Maximo 1MB por request
- **Helmet:** Headers de seguridad HTTP (HSTS, CSP, X-Frame-Options)
- **CORS:** Lista blanca de dominios permitidos
- **Validacion Zod:** Todos los inputs validados con schemas tipados
- **Precios server-side:** El backend recalcula precios desde la DB (nunca confia en el cliente)
- **IDOR Protection:** Middlewares que verifican que cada admin solo acceda a su tienda
- **Contra carrera:** Updates con condicion WHERE para evitar conflictos multi-admin
- **Cuenta bloqueada:** 5 intentos fallidos → bloqueo de 15 minutos

---

## 8. Gestion de Monedas

### 8.1 Configuracion

Cada tienda define su moneda principal y tasas de cambio:
- **USD** (Dolares Americanos)
- **VES** (Bolivares Venezolanos)
- **COP** (Pesos Colombianos)

### 8.2 Conversion Automatica

- Tasas actualizadas manualmente o via API del BCV
- El cliente ve precios en la moneda de la tienda
- En el checkout, se muestra el desglose en todas las monedas
- El admin cobra en la moneda que el cliente elija

### 8.3 Ejemplo

Tienda configurada en USD con tasa VES = 36.5:
- Producto: $10.00 USD
- Cliente ve: Bs. 365.00 VES
- En checkout: "Total a pagar: $10.00 USD / Bs. 365.00 VES"

---

## 9. Panel de Super Administrador

**URL:** `https://test.shop-mg.com/superadmin`

Acceso exclusivo para el propietario de la plataforma:

- **Crear tiendas:** Registra una nueva tienda con su admin asociado
- **Activar/Desactivar tiendas:** Control de acceso por tienda
- **Listar todas las tiendas:** Vista general de todas las tiendas del sistema
- **Acceso a cualquier tienda:** Puede ver y gestionar cualquier tienda

---

## 10. Funcionalidades Tecnicas Avanzadas

### 10.1 Calculo de Distancia y Tiempo

- Formula de Haversine para calcular distancia entre tienda y cliente
- Factor de correccion x1.4 para distancia real (no recta)
- Tiempo estimado: `(distancia_km / 25) * 60 + 15` minutos
- Ruta real calculada por OSRM (Open Source Routing Machine)

### 10.2 Carga Masiva de Productos

- Subir archivo CSV o Excel con productos
- Validacion de columnas requeridas
- Creacion en lote con `createMany` de Prisma
- Manejo de errores por fila

### 10.3 Integracion WhatsApp

- Al despachar pedido: envia WhatsApp al motorizado con:
  - Datos del cliente (nombre, telefono)
  - Direccion de entrega
  - Link de navegacion GPS
- Opcionalmente notifica al cliente con datos del motorizado

### 10.4 Impresion de Reportes

- Historial de pedidos con filtro por fechas
- KPIs de ventas (hoy, mes, historico)
- Boton de imprimir con estilos optimizados para papel

---

## 11. Experiencia de Usuario

### 11.1 Diseno Visual

- **Glassmorphism:** Elementos translucidos con desenfoques de fondo
- **Micro-animaciones:** Transiciones suaves entre paginas
- **Fuentes:** Manrope (cuerpo) + Sora (encabezados)
- **Colores:** Tema personalizable por tienda

### 11.2 Responsive

- **Desktop:** Tabla completa con todas las columnas
- **Movil:** Tarjetas verticales con acciones rapidas
- **Tablet:** Layout adaptativo entre ambos

### 11.3 Accesibilidad

- Contraste de colores WCAG AA
- Navegacion por teclado (hotkeys en admin)
- Labels en formularios
- Estados visuales claros (colores + iconos)

---

## 12. Resumen de URLs

### Cliente

| Pagina | URL |
|--------|-----|
| Landing | `dominio.com/:slug` |
| Catalogo | `dominio.com/:slug/productos` |
| Categoria | `dominio.com/:slug/categorias/:id` |
| Detalle producto | `dominio.com/:slug/productos/:id` |
| Checkout | `dominio.com/:slug/checkout` |
| Mis pedidos | `dominio.com/:slug/mis-pedidos` |

### Administrador

| Pagina | URL |
|--------|-----|
| Login | `dominio.com/admin-login` |
| Dashboard | `dominio.com/admin/:slug` |
| Detalle pedido | `dominio.com/admin/:slug/order/:id` |
| Inventario | `dominio.com/admin/:slug/inventory` |
| Clientes | `dominio.com/admin/:slug/customers` |
| Motorizados | `dominio.com/admin/:slug/drivers` |
| Configuracion | `dominio.com/admin/:slug/settings` |
| Historial | `dominio.com/admin/:slug/history` |

### Super Admin

| Pagina | URL |
|--------|-----|
| Panel | `dominio.com/superadmin` |

---

*Documento generado para la Plataforma Delivery Multitenant v2.0*
*Ultima actualizacion: Agosto 2026*
