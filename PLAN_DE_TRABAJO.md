# Plan de trabajo — TiendaFast

> Documento vivo. Actualizar después de cada tarea.
> Si se pierde la sesión: leer este archivo, revisar `git status` y `git log`, y continuar desde la primera casilla sin marcar.

- **Última actualización:** 2026-11-05
- **Rama actual:** `feature/security-hardening`
- **Rama principal:** `main`
- **Estrategia de despliegue y validación:**
  1. **Hito 1 (Inmediato / En curso):** Sistema 100% listo, probado y validable en **Localhost** y en el entorno de pruebas existente en la nube (**Netlify** para frontend + **Render** para backend + **Neon** para PostgreSQL). Con esta base lista y pulida se realizarán las demostraciones presenciales y la validación comercial con negocios de comida rápida, víveres y farmacias de Puerto Ayacucho.
  2. **Hito 2 (Final / Producción autónoma):** Migración y despliegue definitivo a **VPS propio** (PostgreSQL 16 local, Nginx, Let's Encrypt, backups automáticos). Los accesos SSH y credenciales del VPS se solicitarán al usuario en el momento exacto de ejecutar esta fase.
- **Estado general:** F1-34, Fase 1B, bugs C-07/C-08/C-09 corregidos, C-10 verificado y tiendas demo creadas con seed idempotente. PDF de accesos y guion de demostración generado (`Accesos_Demo_TiendaFast.pdf`). En curso: Fase 2 restante (inventario/combos, configuración de tienda, pedidos/paginación y analytics).
- **Zona del piloto:** Puerto Ayacucho, Estado Amazonas
- **Verticales comerciales prioritarias:**
  1. **Comida Rápida:** Puestos de perros calientes, hamburgueserías, pizzerías y comida rápida nocturna (alta rotación de pedidos vespertinos/nocturnos, combos y necesidad de despacho express).
  2. **Víveres y Bodegones:** Abastos, mini-mercados, bodegones familiares y venta de víveres/cesta básica (pedidos para el hogar, entrega de compras pesadas y actualización diaria a tasa BCV).
  3. **Farmacias:** Farmacias independientes y cadenas locales (medicamentos OTC, analgésicos, fórmulas y cuidado personal).

---

## 1. Cómo usar este documento

1. Antes de empezar una tarea, marcarla como `En curso` en el registro de avance.
2. Al terminarla, cambiar `- [ ]` a `- [x]`, agregar una línea al registro y hacer commit.
3. No borrar entradas anteriores del registro; solo agregar.
4. Si una tarea queda bloqueada, marcarla como `Bloqueado` y explicar el motivo.
5. Cada commit debe incluir la fase o el identificador de la tarea:
   `fix(cliente): restaurar sesión desde cookie httpOnly (F1-01)`.
6. Nunca subir `.env`, secretos, contraseñas ni claves API al repositorio.
7. Al finalizar cada fase, ejecutar pruebas y actualizar "Estado de pruebas".

### Cómo retomar después de perder la sesión

```bash
git status
git log --oneline -15
git branch --show-current
```

Luego buscar en este archivo la primera tarea sin marcar y continuar. Si hay cambios sin commitear, revisar el diff antes de seguir:

```bash
git diff
```

---

## 2. Contexto del proyecto

Plataforma de delivery y gestión de inventario **multitenant** para negocios venezolanos, diseñada para resolver la caótica gestión de pedidos por WhatsApp en **Puerto Ayacucho, Estado Amazonas**, cubriendo tres necesidades comerciales críticas:
1. **Comida Rápida:** Hamburgueserías, puestos de perros calientes, pizzerías y comida nocturna.
2. **Víveres y Bodegones:** Abastos, mini-mercados familiares y venta de cesta básica con entrega a domicilio.
3. **Farmacias:** Medicamentos de venta libre, cuidado personal y productos de salud.

- **Arquitectura:** Multitenant con **una sola base de datos PostgreSQL** y **una sola instancia de la app**. Cada tienda es un registro en la tabla `Store` con su `slug`, catálogo, industria (`PHARMACY`, `RESTAURANT`, `SUPERMARKET`), plantilla visual adaptada, usuarios, tasas, zonas de delivery y datos bancarios. Todos los datos se aíslan por `store_id`. No se crea un servidor ni una base de datos por cliente.
- **Frontend:** React 19 + TypeScript + Vite + Tailwind (plantillas especializadas por industria: `RestaurantTemplate`, `SupermarketTemplate`, `PharmacyTemplate`).
- **Backend:** Node.js + Express + Prisma + PostgreSQL + Socket.io.
- **Entorno de Pruebas, Staging y Demostración:**
  - **Frontend:** Netlify (`https://test.shop-mg.com` o URL asignada en Netlify).
  - **Backend:** Render (`https://delivery-app-3ewq.onrender.com`).
  - **Base de datos:** Neon (PostgreSQL serverless).
  - **Objetivo de este entorno:** Permitir el desarrollo rápido en `localhost`, el testeo continuo en la nube y la **demostración presencial/remota a comerciantes reales de Puerto Ayacucho** (dueños de puestos de hamburguesas/perros, bodegones y farmacias) desde navegadores y teléfonos móviles sin barreras de infraestructura previa.
- **Entorno de Producción Definitiva (Objetivo):**
  - **Servidor:** VPS propio (Ubuntu 24.04 LTS con Nginx reverse proxy y SSL Let's Encrypt).
  - **Base de datos:** PostgreSQL 16 local en el VPS (escuchando solo en `127.0.0.1`, backups automáticos diarios).
  - **Objetivo de este entorno:** Salida a producción autónoma, sin costos recurrentes de PaaS, con máximo rendimiento y soberanía de los datos. Se activa tras la validación de la demo y los datos de acceso serán cargados al momento de iniciar dicho despliegue.
- **Multimedia:** Cloudinary.
- **Correo:** Resend.
- **Autenticación:** JWT en cookie httpOnly, OTP por correo para clientes y usuario/contraseña para administradores.

### Arquitectura multitenant

```
Internet
    │
    ▼
┌───────────────────────────────────────┐
│        Nginx (Reverse Proxy)          │
│  SSL/TLS (Let's Encrypt)              │
│  /* → frontend/dist (estático)        │
│  /api/* → Node.js :3000               │
│  /socket.io/* → Node.js :3000 (WS)    │
└──────────┬────────────────────────────┘
           │
    ┌──────▼──────────────┐
    │  Node.js + Express  │
    │  PM2 (auto-restart) │
    │  Puerto 3000        │
    │  Socket.io (tiempo  │
    │  real)              │
    └──────┬──────────────┘
           │
    ┌──────▼──────────────┐
    │  PostgreSQL 16      │
    │  LOCAL en el VPS     │
    │  Puerto 5432        │
    │  (solo 127.0.0.1)   │
    │                     │
    │  UNA sola DB:       │
    │  delivery_db        │
    │                     │
    │  Tablas con         │
    │  store_id (FK):     │
    │  Store, User,       │
    │  Product, Order,    │
    │  Category, Driver,  │
    │  DeliveryZone...    │
    └─────────────────────┘
```

- **Slug = identidad pública de la tienda.** Catálogo en `https://dominio.com/<slug>`. Panel admin en `https://dominio.com/admin-login`.
- **Un solo `DATABASE_URL`** apuntando a `localhost:5432`. PostgreSQL escucha solo en `127.0.0.1` (sin exposición externa).
- **Aislamiento por `store_id`:** Todas las queries (productos, pedidos, usuarios, categorías, combos, drivers, zonas) filtran por `store_id`. La identidad del cliente ya es compuesta `@@unique([store_id, email])`.

### Estado real del repositorio

- El núcleo funcional existe: catálogo, carrito, checkout, OTP, pedidos, dashboard, inventario, combos, motorizados, historial y SuperAdmin.
- La rama `feature/security-hardening` tiene mejoras sin commitear de F1-27/F1-28 (bloqueo de tiendas inactivas y admin como cliente).
- Las migraciones Prisma ya tienen baseline; precios y totales usan `Decimal(12,2)` y las tasas `Decimal(14,6)`.
- La base de datos actual es Neon (pruebas/staging); la de producción será PostgreSQL local en VPS.
- No hay CI, healthchecks, backups automatizados ni pruebas E2E.
- La documentación y los PDFs actuales prometen funciones que aún no están implementadas.
- No existe un módulo de planes, suscripciones, límites ni cobros.

---

## 3. Decisiones cerradas

| Tema | Decisión |
|---|---|
| Modelo comercial | Suscripción mensual + implementación única |
| Precios | Emprendedor $9 / Negocio $19 / Pro $35 |
| Implementación | $90; $60 para los primeros 5 clientes; gratis con anualidad |
| Anualidad | 10 meses por 12; precio congelado |
| Comisión por pedido | 0% |
| Prueba | 14 días |
| Piloto | 60 días gratis, implementación incluida |
| Después del piloto | 50% de descuento por 3 meses |
| Indexación | Precios en USD; cobro en Bs al BCV del día; revisión trimestral |
| Arquitectura | Multitenant, una sola app y una sola BD PostgreSQL para todos los clientes |
| Entorno de demo y pruebas | Netlify (frontend) + Render (API) + Neon (Postgres) para desarrollo, validación y demostraciones |
| Base de datos producción | PostgreSQL 16 local en el VPS (no Neon, no RDS; se migra al desplegar producción) |
| Producción definitiva | VPS propio con Nginx, PostgreSQL local, frontend y API en el mismo dominio (al concluir demostraciones) |
| Clientes | Una cuenta por tienda; mismo correo puede existir en varias tiendas |
| Ventas y soporte | El fundador |
| Facturación fiscal | Se define con contador antes del primer cobro |
| Recetas y lotes | Se validan con farmacias antes de construir |

---

## 4. Esquema de negocio

### 4.1 Clientes ideales (Tres verticales prioritarias en Puerto Ayacucho)

En Puerto Ayacucho, el comercio depende casi exclusivamente de pedidos por WhatsApp con atención manual, errores en transferencias y motorizados desorientados en la noche. TiendaFast atiende tres verticales con alta necesidad y sin solución local moderna:

#### Vertical 1: Comida Rápida (Hamburgueserías, Perros Calientes, Pizzas y Comida Nocturna)
- **Perfil:** Puestos de perros calientes, carritos, trailers y hamburgueserías en avenidas transitadas (Av. 23 de Enero, Av. Orinoco, Av. Aguerrevere) y negocios de comida nocturna.
- **Operación:** Horario vespertino/nocturno (6:00 PM a 12:00 AM). Picos intensos de jueves a domingo.
- **Problema en Puerto Ayacucho:** En horas pico el encargado de cocina no puede responder decenas de chats de WhatsApp, se pierden pedidos, se mezclan instrucciones ("sin cebolla", "salsa aparte"), clientes mandan comprobantes de Pago Móvil no verificados, y los motorizados dan vueltas buscando casas en sectores oscuros o sin números de calle.
- **Solución con TiendaFast:** Plantilla `RESTAURANT`, combos de comida rápida (hamburguesa + papas + refresco con descuento automático de insumos), notas de preparación del pedido, validación de referencia de Pago Móvil antes de encender la plancha, y botón directo a Google Maps/Waze para el repartidor.

#### Vertical 2: Víveres, Bodegones y Abastos (Cesta Básica y Mini-markets)
- **Perfil:** Abastos de barrio, mini-mercados familiares y bodegones en zonas residenciales y comerciales.
- **Operación:** Horario diurno (7:30 AM a 6:00 PM). Catálogo de 200 a 1.500 productos (harina, arroz, pasta, aceites, lácteos, embutidos, artículos de limpieza, licores y snacks).
- **Problema en Puerto Ayacucho:** Variación diaria de precios en bolívares por cambio del dólar; clientes que consultan precios constantemente por chat; necesidad de despachar compras pesadas a domicilio para evitar que el cliente cargue bolsas bajo el calor extremo o haga filas.
- **Solución con TiendaFast:** Plantilla `SUPERMARKET`, precios base en USD con conversión automática a tasa oficial BCV del día, catálogo estructurado por departamentos (Alimentos, Bebidas, Limpieza), cálculo de delivery por distancia/zona y control de stock para no vender lo agotado en mostrador.

#### Vertical 3: Farmacias Independientes
- **Perfil:** Farmacias independientes y pequeñas boticas de Puerto Ayacucho.
- **Operación:** Horario continuo diurno o turnos de turno nocturno.
- **Problema en Puerto Ayacucho:** Consultas repetitivas sobre disponibilidad y precio de medicamentos comunes (analgésicos, antipiréticos, pañales, vitaminas); pérdida de ventas por no contestar a tiempo.
- **Solución con TiendaFast:** Plantilla `PHARMACY`, catálogo organizado de medicamentos OTC y cuidado personal, precios indexados a BCV y pedido seguro.

---

### 4.2 Precios

| Plan | Precio | Límites | Adecuación por vertical |
|---|---:|---|---|
| Implementación | $90 único | Configuración, carga de catálogo/menú, BCV, capacitación y salida en vivo | Primeros 6 del piloto: $0 |
| Emprendedor | $9/mes | 1 tienda, 300 productos, 1 administrador | Ideal para carritos de perros calientes y puestos individuales |
| Negocio | $19/mes | Productos ilimitados, combos, 3 administradores, reportes | Ideal para hamburgueserías con cocina/caja y bodegones de víveres |
| Pro | $35/mes | Dominio propio, administradores ilimitados, soporte prioritario | Cadenas locales, abastos grandes o farmacias con múltiples turnos |
| Anualidad | 10 meses por 12 | Implementación gratis y precio congelado | Aplicable a cualquier plan |
| Comisión por pedido | 0% | Sin porcentaje sobre ventas | 100% de la ganancia es del negocio |

Cobro en bolívares a tasa BCV del día. Métodos: Pago Móvil, transferencia, efectivo, Zelle o USDT. Sin contratos de permanencia forzosa.

---

### 4.3 Piloto en Puerto Ayacucho (6 Negocios Representativos)

El piloto de 60 días gratis se estructurará con **6 negocios** para validar el comportamiento en las tres verticales y en diferentes horarios:
- **2 de Comida Rápida:** 1 puesto de perros calientes/hamburguesas de alto flujo nocturno + 1 local de pizzas o comida rápida mixta.
- **2 de Víveres / Bodegones:** 1 abasto de víveres/cesta básica + 1 bodegón de productos importados/snacks.
- **2 Farmacias:** 2 farmacias independientes de diferentes sectores (ej. Casco Central y San Enrique).

**Condiciones del piloto:**
- 60 días gratis, costo de implementación $0.
- Capacitación y soporte directo del fundador en sitio.
- Tres sesiones de retroalimentación para afinar usabilidad.
- Continuidad post-piloto con 50% de descuento por 3 meses.

**Meta de prospección local:**
- 15 negocios contactados en Puerto Ayacucho (5 de comida rápida, 5 de víveres, 5 farmacias).
- 8 demostraciones presenciales en teléfono móvil con las tiendas demo de prueba.
- 6 acuerdos de piloto firmados.

---

### 4.4 Unit economics ilustrativos

Supuesto: 30 clientes en Puerto Ayacucho (14 Comida Rápida, 10 Víveres/Bodegones, 6 Farmacias) distribuidos en: 15 Emprendedor ($9), 10 Negocio ($19), 5 Pro ($35) y 2 implementaciones al mes.

| Concepto | Mensual |
|---|---:|
| MRR (30 clientes) | $500 |
| Implementaciones (2/mes) | $180 |
| Infraestructura, correo y respaldo | $50–80 |
| Soporte y visitas (20 h) | $100 |
| Comisiones de cobro (~2%) | $14 |
| Margen bruto estimado | $480–500 |
| Punto de equilibrio | 10–12 clientes (totalmente viable dentro de Puerto Ayacucho) |

Al integrar comida rápida y víveres, el mercado potencial local se multiplica de inmediato, haciendo viable el punto de equilibrio dentro de Puerto Ayacucho sin depender de una expansión acelerada a otras ciudades.

---

### 4.5 Fiscalidad

- Consultar contador en la semana 1 sobre IVA, IGTF, facturación digital y tratamiento de servicios en USD/BCV.
- El piloto es gratuito: no se factura hasta tener la estructura definida.
- No lanzar el cobro público sin resolución fiscal.

---

### 4.6 Matriz de requisitos por vertical

| Característica | Comida Rápida (Perros/Hamburguesas) | Víveres y Bodegones (Abarrotes) | Farmacias (Salud) |
|---|---|---|---|
| **Plantilla Frontend** | `RestaurantTemplate` (tema cálido / rojo / naranja) | `SupermarketTemplate` (tema verde / esmeralda) | `PharmacyTemplate` (tema azul / cian) |
| **Combos** | Vital: Perro/Hamburguesa + Papas + Bebida | Vital: Combos Cesta Básica (Harina + Arroz + Aceite) | Opcional: Kits de primeros auxilios |
| **Notas de preparación** | Sí ("sin cebolla", "salsas aparte", "término de carne") | Opcional ("marca preferida") | No |
| **Horario clave** | Noche (6 PM a 12 AM) | Día (8 AM a 6 PM) | Todo el día / Guardias |
| **Navegación GPS Motorizado** | Imprescindible (calles oscuras y sin número) | Alta (dirección exacta del hogar) | Alta (entrega urgente) |
| **Actualización Tasa BCV** | Precios en USD indexados | Diario obligatorio (inflación en víveres) | Diario obligatorio |
| **Control de Stock** | Por unidad de producto o combo | Por stock físico en anaquel | Por unidad / presentación |

---

## 5. Problemas conocidos

| ID | Problema | Prioridad |
|---|---|---|
| C-01 | La sesión no se restaura al abrir nueva pestaña o reiniciar navegador | Crítica |
| C-02 | Checkout usa `current_store_id` de `localStorage` en vez del slug | Crítica |
| C-03 | El carrito es global y no está aislado por tienda | Crítica |
| C-04 | No se descuenta ni reserva stock; combos no validan componentes | Crítica |
| C-05 | `User.email` y `User.phone` son únicos globalmente | Crítica |
| S-01 | Salas Socket.io sin autenticación | Crítica |
| S-02 | OTP en texto plano y sin límite de intentos | Alta |
| S-03 | Cookies cross-site sin CSRF ni `trust proxy` | Alta |
| S-04 | Datos de Pago Móvil hardcodeados | Alta |
| A-01 | No existe flujo real de aprobación de pago | Alta |
| A-02 | Configuración de tienda incompleta | Alta |
| A-03 | Referencias cruzadas entre tiendas en productos/combos/categorías | Alta |
| A-04 | `markOrderViewed` sin validación de tienda | Media |
| A-05 | No existen planes, suscripciones, límites ni cobros | Crítica |
| P-01 | Multi-moneda incorrecta para base VES/COP | Alta |
| P-02 | Sin CI de API, healthchecks ni backups automatizados; migraciones ya iniciadas | Crítica |
| P-03 | Tiendas inactivas siguen operando | Alta |
| P-04 | Sin pruebas E2E ni pruebas de carga | Media |
| P-05 | Sin zonas ni tarifas de delivery configurables | Alta |
| P-06 | Lint con 86 advertencias: `any`, efectos con setState y exports de UI | Media |
| P-07 | Bundle principal de ~1 MB sin code splitting | Media |
| P-08 | Las pruebas de API requieren esperar a que el servidor esté listo | Baja |
| P-09 | Resend rechaza correos `example.com`; las pruebas usan el código de la DB | Baja |
| C-06 | Búsqueda y geolocalización de cliente con token expuesto, viewbox fijo y sin reverse geocoding al mover el pin | Alta |
| C-07 | Al cargar un usuario ya registrado, el teléfono se muestra con código de país inválido (regex codiciosa) y puede guardarse corrupto — **resuelto 2026-11-05** | Alta |
| C-08 | El cliente no percibe aceptación/preparación en tiempo real porque `createSocket` usa `path: '/'` en vez de `/socket.io/` — **resuelto 2026-11-05** | Crítica |
| C-09 | La ruta enviada al motorizado por Google Maps no incluye origen y no parte de la tienda — **resuelto 2026-11-05** | Alta |
| C-10 | El backend de Render responde 503 y bloquea la demo en la nube — **verificado 2026-11-05: 503 transitorio; productos responde 200** | Crítica |

---

## 6. Fases y tareas

### Fase 0 — Orden y línea base (1 día)

- [x] Crear este documento.
- [x] Revisar todos los cambios sin commitear de `feature/security-hardening`.
- [x] Commitear la línea base (`c7c0377`).
- [x] Crear `backend/.env.example` sin secretos.
- [x] Crear `frontend/.env.example`.
- [x] Agregar script `typecheck` al frontend.
- [x] Separar scripts de pruebas unitarias y de API en backend.
- [x] Crear CI mínimo (frontend + backend unitario).
- [x] Ejecutar lint, typecheck, tests unitarios y build.
- [x] Ejecutar pruebas de API con PostgreSQL.
- [x] Registrar resultados y commitear Fase 0.

**Resultado:**

- Backend unitario: 23/23.
- Backend API: 63/63.
- Frontend: 32/32.
- Lint: 0 errores, 89 advertencias.
- Typecheck: correcto.
- Build: correcto; advertencia de bundle de ~1 MB.
- Se corrigieron errores de typecheck en `Footer`, `Landing`, `RestaurantTemplate` y `SupermarketTemplate`.
- Se corrigieron errores de lint en `AuthContext`, `SuperAdmin`, `Checkout`, `sidebar` y `eslint.config.js`.
- Se ajustó la limpieza de `inventory.api.test.js` para respetar la FK de `OrderItem`.
- Las pruebas de API requieren esperar a que el servidor escuche antes de ejecutarse.
- No se ejecutó `db:seed` para no borrar los 501 productos y 15 pedidos existentes.
- El CI de API quedará para la Fase 5; por ahora corre frontend y pruebas unitarias.

**Criterio de terminado:** rama estable, CI verde, entorno reproducible y secretos fuera del repositorio.

---

### Fase 1 — Bugs críticos del cliente (5 días)

#### Sesión y contexto de tienda

- [x] F1-01 Restaurar sesión con `/auth/refresh` al iniciar la app.
- [x] F1-02 Manejar expiración real (401) sin cerrar sesión por errores de red.
- [x] F1-03 Derivar tienda, moneda y configuración desde el `slug`.
- [x] F1-04 Eliminar la dependencia de `current_store_id` en `localStorage`.
- [x] F1-05 Verificar checkout directo sin visitar el catálogo.
- [x] F1-06 Corregir redirección de `/mis-pedidos` para conservar el slug.

#### Carrito y stock

- [x] F1-07 Aislar el carrito por tienda.
- [x] F1-08 Limpiar o confirmar carrito al cambiar de tienda.
- [x] F1-09 Validar disponibilidad y stock antes de agregar o confirmar.
- [x] F1-10 Impedir cantidades superiores al stock.
- [x] F1-11 Descontar o reservar stock al crear el pedido en una transacción.
- [x] F1-12 Validar y descontar stock de componentes de combos.
- [x] F1-13 Rechazar pedidos con stock insuficiente.

#### Dinero y monedas

- [x] F1-14 Migrar precios y totales de `Float` a `Decimal` o centavos.
- [x] F1-15 Agregar al pedido: moneda, tasas, subtotal, delivery y total.
- [x] F1-16 Guardar snapshot de tasas para el historial.
- [x] F1-17 Corregir conversiones cuando la tienda base es VES o COP.
- [x] F1-18 Corregir formato de precios en COP.
- [x] F1-19 Integrar BCV desde backend con caché y endpoint de sincronización.
- [x] F1-20 Permitir override manual de tasas.
- [x] F1-21 Configurar zonas y tarifas de delivery.

#### Pagos y checkout

- [x] F1-22 Agregar datos bancarios por tienda al esquema.
- [x] F1-23 Eliminar datos bancarios hardcodeados de `Checkout.tsx`.
- [x] F1-24 Mostrar datos bancarios reales de la tienda.
- [x] F1-25 Validar referencia de Pago Móvil.
- [x] F1-26 Permitir cancelar pedidos `AWAITING_PAYMENT`.
- [x] F1-27 Bloquear compras en tiendas inactivas.
- [x] F1-28 Evitar que un administrador compre como cliente.

#### Identidad de clientes por tienda

- [x] F1-29 Quitar `@unique` global de `User.email` y `User.phone`.
- [x] F1-30 Agregar `@@unique([store_id, email])` y `@@unique([store_id, phone])`.
- [x] F1-31 Actualizar `checkEmail` y `verifyOtp` para buscar por `store_id + email`.
- [x] F1-32 Actualizar consultas que usan `findUnique({ where: { email } })`.
- [x] F1-33 Crear migración Prisma con respaldo previo.
- [x] F1-34 Probar que un mismo correo compra en dos tiendas sin mezclar datos.

**Criterio de terminado:** compra segura, sin sobreventa, precios correctos y cuentas aisladas por tienda.

---

### Fase 1B — Ubicación, Geocodificación y Experiencia de Entrega (1.5 días)

Optimización de la búsqueda y precisión de la dirección del cliente en el checkout:

- [x] F1B-01 **Input predictivo con autocompletado debounced (~350ms):**
  - Búsqueda en tiempo real al escribir con sugerencias visuales desplegables.
  - Centrado dinámico en las coordenadas de la tienda activa (`store.latitude`, `store.longitude`), eliminando el viewbox estático de Puerto Ayacucho.
  - Al seleccionar una sugerencia: rellena el input, posiciona el pin del mapa (`flyTo`) y cotiza delivery automáticamente.
- [x] F1B-02 **Botón "Ubicar mi casa por GPS" con Reverse Geocoding automático:**
  - Consulta al GPS del navegador/dispositivo con `enableHighAccuracy: true` y timeout de 15 s.
  - Si el usuario autoriza: obtiene coordenadas exactas y ejecuta Geocodificación Inversa (Reverse Geocoding) inmediata para rellenar de forma legible la calle, sector y ciudad en el input sin requerir tipeo manual.
  - Manejo amigable de permisos denegados o señales débiles con fallback a estimación por IP y aviso claro para ajustar el pin manualmente.
- [x] F1B-03 **Sincronización bidireccional mapa-input (Reverse Geocoding al interactuar con el mapa):**
  - Al hacer clic o arrastrar el marcador (pin) en el mapa Leaflet, ejecutar Reverse Geocoding para actualizar el texto de la dirección en el input y no dejar inconsistencias entre el mapa y el texto.
- [x] F1B-04 **Validación de cobertura y bloqueo fuera de zona:**
  - Validar contra las zonas activas de la tienda (`DeliveryZone`). Si las coordenadas del cliente superan el radio máximo de entrega, advertir de inmediato con alerta visual ("Tu ubicación está fuera del rango de entrega de esta tienda") y deshabilitar el botón de continuar al pago.
- [x] F1B-05 **Direcciones guardadas para clientes frecuentes:**
  - Para usuarios identificados (post-OTP), ofrecer selector de "Direcciones anteriores" (ej. "Casa", "Trabajo") para comprar en 1 clic sin tener que buscar o geolocalizar desde cero.
- [x] F1B-06 **Despacho y navegación para repartidor y admin:**
  - Guardar `latitude`, `longitude`, `address` y `address_details` (punto de referencia, color de casa) en el pedido.
  - Generar botones directos en la vista de órdenes del Admin y del Motorizado para abrir la ruta en **Google Maps** y **Waze** (`https://www.google.com/maps/search/?api=1&query=lat,lng`).
- [x] F1B-07 **Seguridad, variables de entorno y contingencia:**
  - Retirar token público de mapas del código fuente frontend y gestionarlo mediante variable de entorno (`VITE_LOCATIONIQ_KEY` o proxy backend).
  - Implementar fallback transparente a OpenStreetMap (Nominatim) o ingreso manual asistido si la cuota de la API se agota o hay cortes de servicio.

**Criterio de terminado:** el cliente ubica su casa en menos de 5 segundos (por GPS o texto predictivo), el mapa y la dirección quedan 100% sincronizados, se valida la cobertura de reparto y el repartidor recibe la ubicación exacta con enlace de navegación.

---

### Fase 2 — Bugs críticos del administrador (4 días)

#### Pagos y pedidos

- [x] F2-01 Crear pestaña o filtro real para `AWAITING_PAYMENT`.
- [x] F2-02 Aprobar pago: `AWAITING_PAYMENT` → `PENDING`.
- [x] F2-03 Rechazar pago: `AWAITING_PAYMENT` → `CANCELLED`.
- [x] F2-04 Soportar aprobación/rechazo por lote.
- [x] F2-05 Corregir acciones que aceptan pedidos sin pago aprobado.
- [x] F2-06 Agregar paginación y filtros server-side en pedidos.
- [x] F2-07 Validar pertenencia de tienda en `markOrderViewed`.

#### Configuración de tienda

- [x] F2-08 Permitir que SuperAdmin edite configuración.
- [x] F2-09 Editar industria, tema, nombre, coordenadas y WhatsApp.
- [x] F2-10 Editar datos bancarios y métodos de pago.
- [x] F2-11 Implementar cambio de contraseña de administrador.
- [x] F2-12 Implementar cierre de sesiones.
- [x] F2-13 Quitar o completar secciones "en desarrollo" de `Settings.tsx`.

#### Inventario y combos

- [x] F2-14 Validar que `category_id` pertenezca a la tienda.
- [x] F2-15 Validar que los componentes de un combo pertenezcan a la tienda.
- [x] F2-16 Calcular stock de combo como mínimo de `stock_componente / cantidad`.
- [x] F2-17 Mostrar stock de combo en catálogo y checkout.
- [x] F2-18 Evitar stock negativo.
- [x] F2-19 Manejar eliminación de productos usados en combos.
- [x] F2-20 Agregar alertas de bajo stock.
- [x] F2-25 Restaurar stock al cancelar o eliminar pedidos (cliente, admin y lote).

#### Historial y analytics

- [x] F2-21 Corregir filtros de fecha según zona horaria.
- [x] F2-22 Calcular ventas netas y totales coherentes.
- [x] F2-23 Corregir analytics con filtros aplicados.
- [x] F2-24 Verificar exportación e impresión de reportes.

#### Tiendas inactivas

- [x] F2-25B Bloquear catálogo y checkout de tiendas inactivas con pantalla amigable 404/no disponible.
- [x] F2-26 Bloquear recepción de pedidos en tiendas inactivas respondiendo 400 'Tienda inactiva o no disponible'.
- [x] F2-27 Definir acceso del admin de tienda inactiva (permite entrar pero muestra banner de advertencia amber persistente).
- [x] F2-28 Auditar activaciones y desactivaciones con actor, razón, slug y timestamp estructurado.

#### Demo, realtime y navegación (bugs reportados 2026-11-05)

- [x] F2-29 **(C-07)** Normalizar teléfono en backend/frontend, separar país y número sin regex codiciosa, permitir editar el teléfono de un usuario registrado y no sobrescribirlo si no cambió. Pruebas con `+58`, `0412`, `+58 412-...`, `+57` y `+593`. Implementado en `backend/utils/phone.js`, `backend/controllers/authController.js`, `frontend/src/utils/phone.ts` y `Checkout.tsx`.
- [x] F2-30 **(C-08)** Corregir `frontend/src/lib/socket.ts` (quitar `path: '/'`, usar `/socket.io/` y `withCredentials: true`), crear socket global de cliente, reconectar y re-unir a `client_{id}`, mostrar toast/sonido/notificación nativa ante `estado_actualizado` y agregar polling de respaldo. Implementado con `RealtimeContext.tsx`, `notifications.ts`, `Checkout.tsx` y `MyOrders.tsx`.
- [x] F2-31 **(C-09)** Crear helper único de navegación con `origin=<tienda>` + `destination=<cliente>` + `travelmode=driving`; aplicarlo en `Dashboard.tsx`, `OrderDetails.tsx` y el WhatsApp “Enviar Ruta al Motorizado”. Implementado en `frontend/src/utils/navigation.ts`.
- [x] F2-32 **(C-10)** Recuperar el backend en Render, validar `/api/health`, variables de entorno y conexión Socket.io desde Netlify. Verificado: `/api/stores/demo-farmacia/products` responde 200; `/api/health` no existe (404). Falta validar Socket.io live después del despliegue del fix.

**Criterio de terminado:** operación completa sin estados inconsistentes ni accesos cruzados; cliente recibe el cambio de estado en menos de 2 s sin recargar; el teléfono se precarga correcto; el enlace de Google Maps abre la ruta tienda→cliente; el backend responde 200 en Render.

---

### Fase 2B — Planes, suscripciones y onboarding SaaS (3 días)

- [ ] F2B-01 Agregar a `Store`: plan, ciclo, precio, estado, fin de prueba y próximo pago.
- [ ] F2B-02 Crear historial de pagos: monto, método, referencia, período y fecha.
- [ ] F2B-03 Crear panel SuperAdmin de clientes, planes y estados.
- [ ] F2B-04 Implementar marcar pagado, extender, suspender y cambiar plan.
- [ ] F2B-05 Aplicar límites por plan: productos y administradores.
- [ ] F2B-06 Vencimiento automático de prueba y suspensión por impago.
- [ ] F2B-07 Crear asistente de alta: tienda, admin, categorías y catálogo.
- [ ] F2B-08 Crear plantilla de recibo y recordatorios de pago.
- [ ] F2B-09 Crear panel de MRR y clientes activos.
- [ ] F2B-10 Registrar auditoría de acciones comerciales.

**Criterio de terminado:** se puede cobrar, suspender y administrar clientes sin planillas externas.

---

### Fase 2C — Requisitos de farmacia (condicional, 0–5 días)

Solo si el discovery con 5 farmacias lo confirma.

- [ ] F2C-01 Validar necesidad de receta médica y lotes/vencimiento.
- [ ] F2C-02 Implementar carga y revisión de recetas.
- [ ] F2C-03 Implementar lotes y fechas de vencimiento.
- [ ] F2C-04 Implementar alertas de vencimiento.
- [ ] F2C-05 Bloquear venta de productos vencidos.
- [ ] F2C-06 Documentar exclusión de medicamentos controlados.

---

### Fase 3 — Seguridad (4 días)

#### Socket.io

- [ ] F3-01 Autenticar el handshake con la cookie httpOnly.
- [ ] F3-02 Autorizar `join_store` según el token.
- [ ] F3-03 Autorizar `join_client` según el usuario.
- [ ] F3-04 Validar y limitar payloads.
- [ ] F3-05 Activar `withCredentials` en el cliente.
- [ ] F3-06 Probar aislamiento de salas.

#### Cookies y CSRF

- [ ] F3-07 Configurar `app.set('trust proxy', 1)`.
- [ ] F3-08 Migrar a mismo origen con `SameSite=Lax`.
- [ ] F3-09 Implementar CSRF si se mantiene cross-site.
- [ ] F3-10 Revisar expiración y rotación de JWT.
- [ ] F3-11 Implementar revocación de sesión.
- [ ] F3-12 Mantener `Secure` en producción.

#### OTP y autenticación

- [ ] F3-13 Guardar OTP con hash.
- [ ] F3-14 Limitar intentos por código.
- [ ] F3-15 Bloquear temporalmente tras fallos.
- [ ] F3-16 No devolver nombre ni teléfono en `checkEmail`.
- [ ] F3-17 Usar respuestas genéricas.
- [ ] F3-18 No imprimir OTP en logs.
- [ ] F3-19 Aplicar política de contraseñas.
- [ ] F3-20 Eliminar contraseñas demo de producción.

#### Validación y uploads

- [ ] F3-21 Schemas Zod para settings, clientes, motorizados y SuperAdmin.
- [ ] F3-22 Validar IDs, slugs y campos permitidos.
- [ ] F3-23 Evitar asignación masiva.
- [ ] F3-24 Limitar tamaño y tipo real de archivos.
- [ ] F3-25 Bloquear SVG.
- [ ] F3-26 Revisar permisos de Cloudinary.

#### Infraestructura

- [ ] F3-27 Helmet con CSP y HSTS.
- [ ] F3-28 Manejador centralizado de errores.
- [ ] F3-29 Request ID y auditoría.
- [ ] F3-30 `npm audit` y correcciones.
- [ ] F3-31 Dependabot.
- [ ] F3-32 Matriz de pruebas de autorización/IDOR.
- [ ] F3-33 Pruebas de sockets, OTP y CSRF.

---

### Fase 3B — Validación y Despliegue en Staging (Netlify + Render + Neon) para Demostración Comercial (1 día)

> **Objetivo:** Dejar la aplicación 100% operativa y probada en la nube actual para ejecutar demostraciones presenciales y pilotos con farmacias reales antes de la migración definitiva a VPS.

- [x] F3B-00 **Verificación previa obligatoria del backend en Render:**
  - Confirmado 2026-11-05: `GET /api/stores/demo-farmacia/products?limit=1` responde `200`; el `503` era transitorio. `GET /api/health` devuelve `404` porque no existe.
  - Variables y CORS ya estaban operativos; no fue necesario redeploy para esta verificación.
  - Contingencia de backend local contra Neon disponible si Render vuelve a fallar.
- [ ] F3B-01 **Alineación de base de datos en Neon:**
  - Ejecutar `npx prisma migrate deploy` contra la instancia de Neon para aplicar las migraciones de `money_decimal`, `user_identity_per_store`, delivery zones y datos bancarios sin tocar los datos existentes.
- [ ] F3B-02 **Verificación del Backend en Render:**
  - Comprobar que `ALLOWED_ORIGINS` en Render incluya el dominio de Netlify y `http://localhost:5173`.
  - Probar healthcheck y conexión a Socket.io desde navegadores externos.
  - Asegurar que el backend maneje adecuadamente cookies cross-site con `SameSite=None; Secure; Partitioned`.
- [ ] F3B-03 **Verificación y Build del Frontend en Netlify:**
  - Confirmar que `_redirects` o `netlify.toml` maneje correctamente las rutas del SPA (`/* /index.html 200`).
  - Configurar variables de entorno en Netlify (`VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_LOCATIONIQ_KEY`).
  - Validar build de producción sin errores de TypeScript ni assets faltantes.
- [x] F3B-04 **Preparación de las 3 tiendas de demostración por vertical:**
  - **Tienda 1 (`demo-comida`, ID 36):** 6 productos, 4 categorías, plantilla `RESTAURANT`, tema `orange`; incluye combo hamburguesa + papas + refresco.
  - **Tienda 2 (`demo-viveres`, ID 37):** 8 productos, 4 categorías, plantilla `SUPERMARKET`, tema `emerald`.
  - **Tienda 3 (`demo-farmacia`, ID 1):** 8 productos demo + catálogo previo, 4 categorías, plantilla `PHARMACY`, tema `blue`.
  - Las 3 con coordenadas de Puerto Ayacucho, 2 zonas de delivery, motorizado y datos de Pago Móvil de prueba. Creadas con `backend/scripts/seed-demo-stores.js` (idempotente).
  - Credenciales reseteadas y verificadas contra Render: `superadmin`, `admin_comida`, `admin_viveres`, `admin_demo` con `TiendaFast2026!`.
- [ ] F3B-05 **Validación integral en dispositivos móviles (Smartphone / 4G):**
  - Probar flujo de cliente en móvil en cada plantilla:
    - Comida rápida: pedir combo de hamburguesa/perro con notas especiales ("sin cebolla", "salsas aparte").
    - Víveres: agregar múltiples productos de la cesta básica, verificando total en USD y Bs a tasa BCV.
    - Farmacia: búsqueda rápida por nombre comercial.
  - Probar geolocalización en las tres: GPS "Ubicar mi casa" o búsqueda predictiva con mapa.
  - Probar panel de administración desde PC/Tablet: recepción instantánea por Socket.io, validación de Pago Móvil, cambio de estados.
  - Probar rol de repartidor: apertura de ruta directa en Google Maps y Waze hacia la casa del cliente.
- [x] F3B-06 **Guiones de demostración comercial adaptados (10 min por vertical):**
  - **Guion para Comida Rápida (dueño de hamburguesería/perros calientes):** Demostrar cómo atender 50 pedidos en horas pico sin colapsar el WhatsApp, evitar comprobantes falsos de Pago Móvil y enviar al motorizado directo por GPS sin perderse en la noche.
  - **Guion para Víveres y Bodegones (dueño de abasto/bodegón):** Demostrar la actualización automática de precios en Bs según tasa BCV, cómo exhibir cientos de productos por pasillos y ofrecer delivery de compras pesadas a las casas de los clientes.
  - **Guion para Farmacias:** Demostrar catálogo de medicamentos de alta rotación, stock visible y consulta rápida.
- [x] F3B-07 **PDF de accesos y guion de demostración:**
  - Generar `Accesos_Demo_TiendaFast.pdf` con URLs de las 3 tiendas, login admin, dashboards y SuperAdmin.
  - Incluir credenciales demo (`superadmin` y 3 administradores), guion de 10–15 min, checklist previo y contingencias.
  - No incluir claves de producción, JWT ni credenciales de base de datos.

---

### Fase 4 — Producción Definitiva en VPS con PostgreSQL local (Diferida al despliegue final)

> **Nota de ejecución:** Esta fase se mantiene completamente planificada y documentada con sus 45 sub-tareas. Se ejecutará una vez concluidas las demostraciones comerciales y validaciones del piloto en el entorno de pruebas actual (Netlify + Render + Neon). **Al momento de iniciar esta fase, el asistente solicitará al usuario la IP, accesos SSH y credenciales del VPS para proceder con el aprovisionamiento y migración.**

#### 4A — Provisionamiento del VPS

- [ ] F4-01 Contratar VPS (Hetzner/Contabo/DigitalOcean, mínimo 2 vCPU, 4 GB RAM, 80 GB NVMe, Ubuntu 24.04 LTS).
- [ ] F4-02 Acceso SSH con clave pública; deshabilitar login con contraseña.
- [ ] F4-03 Crear usuario no-root para la app (`adduser deploy`; desactivar login root por SSH).
- [ ] F4-04 Configurar firewall UFW: abrir solo 22 (SSH), 80 (HTTP) y 443 (HTTPS).
- [ ] F4-05 Instalar Fail2Ban y habilitar regla para SSH.
- [ ] F4-06 Habilitar actualizaciones automáticas de seguridad (`unattended-upgrades`).

#### 4B — PostgreSQL 16 local en el VPS

- [ ] F4-07 Instalar PostgreSQL 16 (`apt install postgresql-16 postgresql-contrib`).
- [ ] F4-08 Crear usuario `delivery_user` con contraseña segura (mín. 32 caracteres, generada con `openssl rand -base64 32`).
- [ ] F4-09 Crear base de datos `delivery_db` con owner `delivery_user`.
- [ ] F4-10 Configurar `pg_hba.conf`: solo conexiones locales (`127.0.0.1/32`), sin acceso remoto.
- [ ] F4-11 Configurar `postgresql.conf`: `listen_addresses = 'localhost'`, ajustar `shared_buffers`, `work_mem` y `effective_cache_size` para 4 GB RAM.
- [ ] F4-12 Verificar que PostgreSQL no escucha en interfaces públicas (`ss -tlnp | grep 5432`).

#### 4C — Migración de datos Neon → VPS

- [ ] F4-13 Exportar dump de la DB de Neon con `pg_dump` (schema + data de tiendas piloto, sin data de pruebas).
- [ ] F4-14 Restaurar dump en PostgreSQL del VPS con `pg_restore` o `psql < dump.sql`.
- [ ] F4-15 Ejecutar `npx prisma migrate deploy` para alinear el estado de migraciones.
- [ ] F4-16 Verificar integridad: contar registros (stores, products, users, orders) y comparar con Neon.
- [ ] F4-17 Actualizar `DATABASE_URL` en el `.env` del VPS para apuntar a `localhost:5432`.

#### 4D — Node.js, Backend y Frontend

- [ ] F4-18 Instalar Node.js 20 LTS (`nodesource` o `nvm`).
- [ ] F4-19 Clonar repositorio en `/var/www/delivery-app`.
- [ ] F4-20 Crear `.env` de producción: `NODE_ENV=production`, `DATABASE_URL=postgresql://delivery_user:PASS@localhost:5432/delivery_db`, `JWT_SECRET` de 128 caracteres, `ALLOWED_ORIGINS` con el dominio real.
- [ ] F4-21 `npm ci` + `npx prisma generate` + `npx prisma migrate deploy` en backend.
- [ ] F4-22 Crear `.env.production` en frontend con `VITE_API_URL` y `VITE_SOCKET_URL` apuntando al dominio real.
- [ ] F4-23 `npm ci` + `npm run build` en frontend (o compilar en CI y subir `dist/`).
- [ ] F4-24 Instalar PM2: `npm install -g pm2`; iniciar backend con `pm2 start server.js --name delivery-api`.
- [ ] F4-25 Configurar `pm2 startup` + `pm2 save` para auto-reinicio tras reboot.
- [ ] F4-26 Configurar `pm2-logrotate` para rotación de logs.

#### 4E — Nginx, SSL y Dominio

- [ ] F4-27 Instalar Nginx.
- [ ] F4-28 Crear configuración del sitio: frontend estático en `/`, API proxy en `/api/*`, Socket.io en `/socket.io/*`, compresión gzip y headers de seguridad.
- [ ] F4-29 Apuntar dominio (DNS A record) a la IP del VPS.
- [ ] F4-30 SSL con Let's Encrypt: `certbot --nginx -d dominio.com -d www.dominio.com`.
- [ ] F4-31 Verificar renovación automática: `certbot renew --dry-run`.
- [ ] F4-32 Habilitar HSTS en Nginx.

#### 4F — Backups y Recuperación (PostgreSQL local)

- [ ] F4-33 Script de backup diario: `pg_dump delivery_db | gzip > /var/backups/delivery_$(date).sql.gz`.
- [ ] F4-34 Cron: backup a las 2 AM diario + limpieza de backups > 30 días.
- [ ] F4-35 Copiar backups fuera del VPS (S3, Backblaze B2 o segundo servidor) con `rclone` o `s3cmd`.
- [ ] F4-36 Probar restauración completa: `pg_restore` en una DB temporal y verificar integridad.
- [ ] F4-37 Documentar procedimiento de restauración de emergencia en el Runbook.

#### 4G — Monitoreo, Healthchecks y Operaciones

- [ ] F4-38 Crear endpoints `/api/health` (app viva) y `/api/ready` (DB conectada, migraciones OK).
- [ ] F4-39 Monitoreo externo de uptime (UptimeRobot / BetterStack) con alertas por correo/Telegram.
- [ ] F4-40 Crear índices en PostgreSQL: `Order(store_id, status)`, `Product(store_id, is_available)`, `User(store_id, email)`, `DeliveryZone(store_id)`.
- [ ] F4-41 Script de deploy con rollback: `git pull`, `npm ci`, `prisma migrate deploy`, `pm2 restart`, validación de health; revert si falla.
- [ ] F4-42 Crear Runbook de incidentes (caída, DB corrupta, disco lleno, certificado expirado).
- [ ] F4-43 Configurar swap de 2 GB si la VPS tiene 4 GB RAM (seguridad ante picos).
- [ ] F4-44 Desconectar la app de Neon/Render: eliminar la referencia a `test.shop-mg.com` y a la DB de Neon en código y documentación.
- [ ] F4-45 Términos, privacidad y retención de datos.

**Criterio de terminado:** la app opera 100% desde el VPS con PostgreSQL local, sin dependencia de Neon ni Render. Backups probados, SSL activo, monitoreo en línea y rollback automatizado.

---

### Fase 5 — QA y aceptación (2 días)

- [ ] F5-01 Configurar Playwright.
- [ ] F5-02 E2E: registro/OTP en modo test.
- [ ] F5-03 E2E: pedido en efectivo.
- [ ] F5-04 E2E: pedido por transferencia y aprobación.
- [ ] F5-05 E2E: aceptar, despachar y entregar.
- [ ] F5-06 E2E: cancelar y calificar.
- [ ] F5-07 E2E: inventario y combos.
- [ ] F5-08 E2E: cambio de tienda y restauración de sesión.
- [ ] F5-09 E2E: permisos y aislamiento.
- [ ] F5-10 Pruebas de carga con k6.
- [ ] F5-11 Lighthouse y accesibilidad.
- [ ] F5-12 Revisión móvil.
- [ ] F5-13 Checklist de aceptación y go/no-go.

---

### Fase 6 — PDFs y documentación (2 días)

#### PDF A — Propuesta Comercial

- [ ] F6-01 Crear `docs/comercial/propuesta-comercial.html`.
- [ ] F6-02 Portada y promesa de valor.
- [ ] F6-03 Problema del comercio venezolano.
- [ ] F6-04 Solución y diferenciadores.
- [ ] F6-05 Planes y precios.
- [ ] F6-06 Pago e indexación.
- [ ] F6-07 Retorno de inversión.
- [ ] F6-08 Implementación y soporte.
- [ ] F6-09 CTA con WhatsApp/QR.

#### PDF B — Beneficios

- [ ] F6-10 Crear `docs/comercial/beneficios-suscripcion.html`.
- [ ] F6-11 Cinco problemas actuales.
- [ ] F6-12 Ocho beneficios.
- [ ] F6-13 Funciones por plan.
- [ ] F6-14 Cómo empezar.
- [ ] F6-15 Preguntas frecuentes.
- [ ] F6-16 CTA y contacto.

#### Producción y cierre

- [x] F6-17 Crear `scripts/generate-pdfs.ps1`.
- [ ] F6-18 Generar PDFs con Edge headless.
- [ ] F6-19 Revisar ortografía, precios y claims.
- [ ] F6-20 Verificar que no se prometan funciones no implementadas.
- [ ] F6-21 Actualizar `README.md` y documentación técnica.
- [ ] F6-22 Archivar PDFs antiguos.

#### PDF de accesos demo (2026-11-05)

- [x] F6-23 Crear `docs/demo/accesos-demo.html` con estilos A4, tabla de credenciales y guion.
- [x] F6-24 Generar `Accesos_Demo_TiendaFast.pdf` con Edge headless.
- [x] F6-25 Revisar que el PDF no exponga claves de producción y que las URLs/credenciales sean las demo.
- [x] F6-26 Verificar apertura y contenido del PDF generado.

---

## 7. Puertas de lanzamiento

- 6 negocios piloto en Puerto Ayacucho (2 de comida rápida/hamburguesas/perros, 2 de víveres/bodegones, 2 farmacias) usando el sistema activamente durante 60 días.
- Pedidos reales en horario diurno y nocturno sin errores críticos de stock, cobro ni entrega.
- Flujo de comprobantes de Pago Móvil y entrega con GPS funcionando con fluidez.
- Facturación fiscal definida antes de cobrar.
- Términos, privacidad y contrato listos.
- Backups restaurados y monitoreo activo.
- Aislamiento entre tiendas y seguridad verificados.
- PDFs alineados con funciones reales.

---

## 8. Comandos de referencia

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
npm test
```

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
npm run test:unit
npm run db:seed
npm run test:api
```

### Pruebas de API

Requieren:

- Servidor backend corriendo en `http://localhost:3000`.
- PostgreSQL accesible.
- Datos demo sembrados.
- `JWT_SECRET` configurado.

Advertencia: `npm run db:seed` elimina pedidos, productos y categorías. No ejecutar en una base con datos reales.

### Producción

```bash
cd /var/www/delivery-app
git pull origin main
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
pm2 restart delivery-api
cd ../frontend
npm ci
npm run build
```

---

## 9. Estado de pruebas

| Fecha | Backend unitario | Backend API | Frontend | Lint | Typecheck | Build | Notas |
|---|---|---|---|---|---|---|---|
| 2026-11-01 | 23/23 | 68/68 | 39/39 | 0 errores, 85 warnings | Correcto | Correcto | Fase 0 y F1-01–F1-13 completadas. Stock transaccional y combos. Bundle ~1 MB. |
| 2026-11-02 | 33/33 | 77/77 | 41/41 | 0 errores, 85 warnings | Correcto | Correcto | F1-14–F1-26 y F1-27/F1-28. Decimal, tasas BCV, delivery por zonas, datos bancarios por tienda. Bundle ~1 MB. |
| 2026-11-02 | 34/34 | 83/83 | 41/41 | 0 errores, 85 warnings | Correcto | Correcto | F1-29–F1-34. Identidad de clientes por tienda, mismo correo/teléfono en dos tiendas, compra aislada y timeout de transacción a 20 s. Bundle ~1 MB. |
| 2026-11-03 | 45/45 | 84/84 | 41/41 | 0 errores, 85 warnings | Correcto | Correcto | Fase 1B. Autocompletado, GPS, reverse geocoding, cobertura, direcciones guardadas, `address_details` y navegación Google Maps/Waze. Bundle ~1 MB. |
| 2026-11-03 | 45/45 | 89/89 | 41/41 | 0 errores, 85 warnings | Correcto | Correcto | F2-01–F2-05, F2-07 y F2-25. Pestaña de pagos, aprobación/rechazo individual y por lote, bloqueo de aceptación sin pago, pertenencia en `markOrderViewed` y restauración idempotente de stock. Bundle ~1 MB. |
| 2026-11-05 | 53/53 | 89/89 | 56/56 | 0 errores, 86 warnings | Correcto | Correcto | C-07/C-08/C-09 corregidos; C-10 verificado (200 en productos). Demo seed de 3 tiendas. API: auth/inventory/stock/store/superadmin 63/63 + orders 26/26 aislado; el run conjunto de 89 sufrió caída de conexión de Neon en el `before` de orders, no fallo de código. Se elevó el timeout de transacciones de cancelar/eliminar/actualizar a 20 s. Bundle 1,050.56 kB. |
| 2026-11-05 | 62/62 | 95/95 | 56/56 | 0 errores, 86 warnings | Correcto | Correcto | F2-14 a F2-20. Validación pertenencia categoría/combos, stock dinámico combo min(componente/qty), rechazo stock negativo, bloqueo eliminación si está en combo y stock visible en catálogo/admin. Bundle 1,053.67 kB. |
| 2026-11-05 | 62/62 | 96/96 | 56/56 | 0 errores, 86 warnings | Correcto | Correcto | F2-08 a F2-13. Edición de settings por superadmin, selectores industria/tema, datos de pago, cambio de contraseña admin con bcrypt, cierre de sesión, notificación sonora y permisos push. Bundle 1,060.87 kB. |
| 2026-11-05 | 66/66 | 99/99 | 56/56 | 0 errores, 86 warnings | Correcto | Correcto | F2-06, F2-21 a F2-24. Paginación y filtros server-side en órdenes e historial, fechas en America/Caracas UTC-4, ventas netas/brutas, analytics con período y exportación CSV/impresión. Bundle 1,065.64 kB. |

---

## 10. Registro de avance

| Fecha | Fase / ID | Estado | Notas |
|---|---|---|---|
| 2026-11-01 | Plan creado | Hecho | Decisiones comerciales y técnicas cerradas |
| 2026-11-01 | Fase 0 | Hecho | Línea base `c7c0377`, `.env.example`, scripts y CI |
| 2026-11-01 | Fase 0 pruebas | Hecho | Backend 86/86, frontend 32/32, lint sin errores, build OK |
| 2026-11-01 | F1-01 | Hecho | Refresh al montar, `isInitializing` y espera en `ProtectedRoute`; no cierra sesión por errores de red |
| 2026-11-01 | F1-02 | Hecho | Solo 401 limpia sesión; red y 500 conservan usuario; 2 pruebas nuevas |
| 2026-11-01 | F1-03 | Hecho | Checkout usa `storeConfig.id`; moneda y tasas tipadas desde el slug |
| 2026-11-01 | F1-04 | Hecho | Eliminado `current_store_id` de `localStorage` y de `Catalog` |
| 2026-11-01 | F1-05 | Hecho | Checkout directo funciona con `storeConfig.id`; carrito persiste por tienda |
| 2026-11-01 | F1-06 | Hecho | `/mis-pedidos` conserva el slug y espera la restauración de sesión |
| 2026-11-01 | F1-07 | Hecho | `CartProvider` dentro del router; carrito separado por slug |
| 2026-11-01 | F1-08 | Hecho | Al cambiar de tienda se carga su carrito; no se mezclan productos |
| 2026-11-01 | F1-09 | Hecho | Frontend bloquea agotados; backend revalida antes de crear |
| 2026-11-01 | F1-10 | Hecho | Carrito y botones respetan stock; no se supera el máximo |
| 2026-11-01 | F1-11 | Hecho | Descuento condicional dentro de `$transaction` |
| 2026-11-01 | F1-12 | Hecho | Combos descuentan componentes agregados por producto |
| 2026-11-01 | F1-13 | Hecho | `StockError` devuelve 400 con detalle y hace rollback |
| 2026-11-02 | F1-14 | Hecho | `Decimal(12,2)` para precios/totales y `Decimal(14,6)` para tasas; baseline de migraciones creado |
| 2026-11-02 | F1-15 | Hecho | Pedido guarda moneda, subtotal, `delivery_fee` y total; `delivery_fee` inicia en 0 |
| 2026-11-02 | F1-16 | Hecho | Snapshot de `currency`, `usd_rate`, `ves_rate` y `cop_rate` en cada pedido |
| 2026-11-02 | F1-17 | Hecho | Conversiones con pivote USD; funciona con base USD, VES o COP |
| 2026-11-02 | F1-18 | Hecho | COP sin decimales y con separador de miles es-CO |
| 2026-11-02 | F1-19 | Hecho | Servicio BCV con caché 10 min, `GET /api/rates/bcv` y `POST /stores/:slug/rates/sync-bcv`; fallback a tasa stale |
| 2026-11-02 | F1-20 | Hecho | Tasas VES/COP editables manualmente en Settings y persistidas con el resto de la configuración |
| 2026-11-02 | F1-21 | Hecho | `DeliveryZone` por tienda, tarifa plana, cotización pública y cálculo de `delivery_fee` en el pedido |
| 2026-11-02 | F1-22 | Hecho | Campos `bank_*` y `payment_note` en `Store` con migración |
| 2026-11-02 | F1-23 | Hecho | Checkout sin banco/teléfono/cédula hardcodeados |
| 2026-11-02 | F1-24 | Hecho | Settings edita y el catálogo público expone los datos bancarios de cada tienda |
| 2026-11-02 | F1-25 | Hecho | Referencia de Pago Móvil numérica de 4 a 10 dígitos (backend y UI) |
| 2026-11-02 | F1-26 | Hecho | Cliente puede cancelar pedidos `AWAITING_PAYMENT` y `PENDING` |
| 2026-11-02 | F1-27 | Hecho | Catálogo, detalle y checkout rechazan tiendas inactivas |
| 2026-11-02 | F1-28 | Hecho | Solo `CLIENT` puede crear pedidos; admin/superadmin reciben 403 |
| 2026-11-02 | F1-29 | Hecho | `User.email` y `User.phone` dejaron de ser únicos globalmente |
| 2026-11-02 | F1-30 | Hecho | `@@unique([store_id, email])` y `@@unique([store_id, phone])`; un mismo dato puede repetirse en tiendas distintas |
| 2026-11-02 | F1-31 | Hecho | `checkEmail` y `verifyOtp` exigen `store_id`, validan tienda activa y buscan el usuario por tienda |
| 2026-11-02 | F1-32 | Hecho | Consultas actualizadas a `findFirst({ email, store_id })` y updates por `id`; `VerificationCode` ahora incluye `store_id` |
| 2026-11-02 | F1-33 | Hecho | Migración `20261103022000_user_identity_per_store`; respaldo previo de usuarios y códigos OTP |
| 2026-11-02 | F1-34 | Hecho | Prueba: mismo correo y teléfono en dos tiendas, compra en tienda 2 y pedidos aislados por usuario |
| 2026-11-02 | F1-29 extra | Hecho | Transacción de `placeOrder` con `timeout: 20000` y `maxWait: 10000`; P2028 responde 503 en vez de 500 |
| 2026-11-03 | F1B-01 | Hecho | Autocompletado debounced 350 ms vía `/api/geocode/autocomplete`; viewbox centrado en la tienda y pin sincronizado |
| 2026-11-03 | F1B-02 | Hecho | GPS con `enableHighAccuracy`, timeout 15 s, reverse geocoding y fallback a estimación por IP |
| 2026-11-03 | F1B-03 | Hecho | Clic y arrastre del pin ejecutan reverse geocoding y actualizan la dirección |
| 2026-11-03 | F1B-04 | Hecho | `evaluateCoverage` en backend; aviso visual y bloqueo de continuar fuera de cobertura |
| 2026-11-03 | F1B-05 | Hecho | `GET /orders/my-addresses`; chips de direcciones anteriores en checkout |
| 2026-11-03 | F1B-06 | Hecho | `address_details` en `Order`; botones Google Maps/Waze en Dashboard y OrderDetails |
| 2026-11-03 | F1B-07 | Hecho | Proxy backend LocationIQ con fallback Nominatim; token retirado del frontend |
| 2026-11-03 | F2-01 | Hecho | Pestaña independiente "Por Validar" (`AWAITING_PAYMENT`) con contador y selección |
| 2026-11-03 | F2-02 | Hecho | Aprobar pago mueve `AWAITING_PAYMENT` → `PENDING` desde tarjeta, alerta y detalle |
| 2026-11-03 | F2-03 | Hecho | Rechazar pago mueve `AWAITING_PAYMENT` → `CANCELLED` y restaura stock |
| 2026-11-03 | F2-04 | Hecho | Acciones masivas contextuales: aprobar pagos o aceptar pedidos según la pestaña |
| 2026-11-03 | F2-05 | Hecho | `AWAITING_PAYMENT` → `ACCEPTED` responde 409; requiere aprobación previa |
| 2026-11-03 | F2-07 | Hecho | `markOrderViewed` valida `store_id` y devuelve 403 para admins de otra tienda |
| 2026-11-03 | F2-25 | Hecho | `stock_breakdown` y `stock_restored` en `Order`; restauración transaccional al cancelar/eliminar (cliente, admin y lote) sin duplicar |
| 2026-11-05 | Plan demo | Hecho | Agregados C-07..C-10, F2-29..F2-32, F3B-00, F3B-07 y F6-23..F6-26. Decisiones: 3 tiendas demo y contraseña única `TiendaFast2026!` (demo) |
| 2026-11-05 | Base de datos | Verificado | Neon accesible; solo existe `demo-farmacia`, `admin_demo` y `superadmin` antes de crear las tiendas demo |
| 2026-11-05 | F2-29 (C-07) | Hecho | Utilidades de teléfono backend/frontend, normalización en auth y teléfono editable en Checkout; pruebas unitarias y typecheck OK |
| 2026-11-05 | F2-30 (C-08) | Hecho | Socket sin `path`, `withCredentials`, `RealtimeProvider`, reconexión/rejoin, toast/sonido/notificación nativa y polling de respaldo |
| 2026-11-05 | F2-31 (C-09) | Hecho | `navigation.ts` con origen de tienda, `travelmode=driving` y `dir_action=navigate`; aplicado en Dashboard, OrderDetails y WhatsApp |
| 2026-11-05 | F2-32 (C-10) | Verificado | Render productos 200; `/api/health` 404 por inexistente; Socket.io live pendiente de despliegue |
| 2026-11-05 | F3B-04 Demo | Hecho | `demo-comida` (36), `demo-viveres` (37), `demo-farmacia` (1) activas; 6/8/8 productos demo, zonas, motorizados y Pago Móvil; credenciales verificadas contra Render |
| 2026-11-05 | Pruebas API | Hecho | Auth/inventory/stock/store/superadmin 63/63; orders 26/26 aislado. Se aislaron zonas/tarifas demo en tests y se actualizó la prueba de login demo |
| 2026-11-05 | Timeout transacciones | Hecho | `cancelOrderClient`, `deleteOrder` y `updateOrderStatus` con `maxWait: 10000` y `timeout: 20000`; corrige P2028 en cancelación AWAITING_PAYMENT |
| 2026-11-05 | Frontend build/lint/typecheck | Hecho | Build OK (1,050.56 kB); lint 0 errores / 86 warnings; typecheck OK |
| 2026-11-05 | PDF de accesos (F3B-07, F6-23..26) | Hecho | Creado docs/demo/accesos-demo.html, scripts/generate-pdfs.ps1 y compilado Accesos_Demo_TiendaFast.pdf con Edge headless (540 KB) |
| 2026-11-05 | F2-14 a F2-20 (Inventario y Combos) | Hecho | Validadas categorías/combos por tienda, stock de combo dinámico en catálogo y admin, rechazo stock negativo, guard de eliminación en combo y stock editable en admin |
| 2026-11-05 | F2-08 a F2-13 (Settings y Auth) | Hecho | SuperAdmin edita configuración, selectores de industria/tema, datos de pago completos, cambio seguro de contraseña de administrador, cierre de sesión y controles de notificación sonora |
| 2026-11-05 | F2-06, F2-21 a F2-24 (Pedidos, Fechas y Analytics) | Hecho | Paginación y filtros server-side (status, payment_method, search, page/limit), fechas America/Caracas UTC-4, métricas netas/brutas en analytics y exportación a CSV con impresión en OrderHistory |

Estados permitidos: `Pendiente`, `En curso`, `Bloqueado`, `Hecho`.

---

## 11. Decisiones abiertas

| Tema | Estado | Cuándo se resuelve |
|---|---|---|
| Facturación fiscal | Abierta | Semana 1, con contador |
| Recetas y lotes | Por validar | Discovery con 5 farmacias, semanas 2–3 |
| Candidatos del piloto | Sin candidatos | Prospección desde semana 1 |
| Zonas y tarifas de delivery | En alcance | Fase 1 |
| Expansión a otra ciudad | Futuro | Después del piloto |

---

## 12. Punto de continuación

**Fase 0, F1-01–F1-34, Fase 1B y bloque crítico de Fase 2 completados.** Siguiente prioridad: **Fase 2 restante** (paginación/filtros server-side, configuración de tienda, inventario/combos, analytics y tiendas inactivas).

### Decisiones de F1-14

- Se usó `Decimal(12,2)` para dinero y `Decimal(14,6)` para tasas; no centavos enteros.
- Un middleware serializa `Prisma.Decimal` como número en JSON para no romper el contrato del frontend.
- Las tasas se interpretan como unidades de la moneda por 1 USD (`ves_rate` = Bs por USD, `cop_rate` = COP por USD).
- Se creó baseline de migraciones y la migración `20261102120100_money_decimal`.

### Decisiones de F1-29–F1-34

- La identidad del cliente es por tienda: `@@unique([store_id, email])` y `@@unique([store_id, phone])`; un mismo correo o teléfono puede existir en tiendas distintas.
- `User.username` de administración sigue siendo único global; el teléfono de admin ya no bloquea la creación de tiendas distintas.
- `VerificationCode` incorporó `store_id` y su único pasó a `@@unique([store_id, email, code])`; los códigos antiguos quedan con `store_id = NULL`.
- `checkEmail` exige `store_id`, valida que la tienda exista y esté activa, y limita el reenvío por tienda + correo.
- `verifyOtp` valida el código contra la tienda, busca/crea al usuario por `store_id + email`, actualiza por `id` y devuelve 409 si el teléfono ya existe dentro de la misma tienda.
- Migración aplicada: `20261103022000_user_identity_per_store`.
- Respaldo previo: `C:\Users\Jesus\AppData\Local\Temp\opencode\users-backup-2026-11-03T02-18-39-374Z.json` (5 usuarios, 2 códigos OTP).
- La transacción de `placeOrder` ahora usa `maxWait: 10000` y `timeout: 20000`; si expira (P2028) responde 503 “La operación tardó demasiado. Intenta de nuevo.”.

### Decisiones de Fase 1B

- La geocodificación pasa por el backend (`/api/geocode/autocomplete` y `/api/geocode/reverse`); el frontend no expone claves de LocationIQ.
- Proveedor principal LocationIQ con fallback transparente a Nominatim y caché en memoria (TTL configurable).
- El viewbox se calcula con `store.latitude`/`store.longitude` y un radio configurable; el mapa usa tiles CARTO/OSM sin token.
- La cobertura se calcula contra las zonas activas de la tienda; `in_range = null` cuando no hay coordenadas o no hay zonas, `false` fuera de rango y `true` dentro.
- `Order.address_details` guarda el punto de referencia; `delivery_address` conserva la dirección legible.
- El pedido se rechaza con 400 si `delivery.in_range === false`; el frontend además deshabilita el botón de continuar.
- Migración aplicada: `20261103120000_order_address_details`.

### Decisiones de Fase 2 (bloque crítico)

- `AWAITING_PAYMENT` tiene pestaña propia y sus acciones no permiten saltar a `ACCEPTED`; primero debe pasar por `PENDING`.
- Las acciones masivas reutilizan `/orders/batch-status` y respetan las transiciones válidas; el frontend cambia las etiquetas según la pestaña activa.
- El stock se restaura dentro de la misma transacción que cancela o elimina el pedido.
- `Order.stock_breakdown` guarda el snapshot de productos/componentes descontados y `Order.stock_restored` evita restauraciones duplicadas.
- Los pedidos `DELIVERED` no restauran stock al eliminarse para no inflar inventario; los cancelados sí, una sola vez.
- Migración aplicada: `20261103130000_order_stock_restore`.

### Decisiones de Tiendas Inactivas (F2-25B a F2-28)

- Catálogo y Checkout responden 404 cuando la tienda está inactiva y el frontend muestra una vista limpia de 'Tienda no disponible' con redirección al inicio.
- `placeOrder` rechaza con 400 y mensaje `Tienda inactiva o no disponible`.
- El administrador de una tienda inactiva puede iniciar sesión para consultar reportes y realizar configuraciones, pero ve un banner ámbar persistente de advertencia informando el estado inactivo.
- SuperAdmin `toggleStoreStatus` registra eventos de auditoría estructurados con `{ store_id, store_slug, store_name, previous_status, new_status, action, actor, reason, timestamp }`.


- **Objetivo:** demostración comercial en la nube y PDF de accesos listo para usar en cualquier sesión.
- **Tiendas:** `demo-comida` (`RESTAURANT`), `demo-viveres` (`SUPERMARKET`) y `demo-farmacia` (`PHARMACY`), todas en Puerto Ayacucho.
- **Administradores:** `admin_comida`, `admin_viveres` y `admin_demo`.
- **SuperAdmin:** `superadmin`.
- **Contraseña demo única:** `TiendaFast2026!` (solo demo; rotar después del evento).
- **URLs base:** `https://test.shop-mg.com` (frontend) y `https://delivery-app-3ewq.onrender.com/api` (backend).
- **Causa raíz del bug de tiempo real:** `createSocket` usaba `path: '/'`; se corrige a `/socket.io/`.
- **Causa raíz del bug de teléfono:** regex `^(\+\d{1,3})(\d+)$` codiciosa; se reemplaza por normalización y split explícito.
- **Causa raíz del bug de ruta:** enlaces de Google Maps sin `origin`; se agrega origen desde la tienda.
- **No usar `npm run db:seed`** sobre la base actual porque borra pedidos, productos y categorías. La demo se crea con un script idempotente.

### Siguiente bloque recomendado (Ruta a Demostración y Validación)

1. **Bugs reportados 2026-11-05 (prioridad inmediata):**
   - **F2-29 (C-07):** teléfono del usuario registrado.
   - **F2-30 (C-08):** Socket.io del cliente y notificaciones en tiempo real.
   - **F2-31 (C-09):** ruta de Google Maps con origen en la tienda.
   - **F2-32 (C-10):** backend Render en `503`.
2. **Preparación de la demo:**
   - **F3B-00:** verificar Render antes de cualquier otra acción.
   - **F3B-01:** aplicar migraciones a Neon.
   - **F3B-04:** crear `demo-comida`, `demo-viveres` y `demo-farmacia`.
   - **F3B-07 / F6-23 a F6-26:** generar `Accesos_Demo_TiendaFast.pdf`.
3. **Fase 2 restante:**
   - **F2-06:** paginación y filtros server-side en pedidos.
   - **F2-08 a F2-13:** edición completa de configuración, contraseña y cierre de sesiones.
   - **F2-14 a F2-20:** validaciones de categorías/combos, stock de combos, stock negativo y alertas.
   - **F2-21 a F2-24:** fechas, ventas netas, analytics y reportes.
   - **F2-25B a F2-28:** tiendas inactivas y auditoría.
4. **Fase 3:** seguridad de Socket.io, cookies/CSRF, OTP, validación y uploads.
5. **Fase 3B (Validación en Staging Netlify + Render + Neon y Catálogo Demo):**
   - Verificar build de frontend en Netlify y backend en Render.
   - Validar las 3 tiendas demo en teléfonos y laptops.
6. **Fase 4 (Producción VPS Definitiva):**
   - Una vez realizada y validada la demostración comercial, se pedirán al usuario las credenciales del VPS para la instalación de PostgreSQL 16 local, Nginx, SSL y automatización de backups.

### Cómo ejecutar las pruebas de API

```powershell
$p = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "backend" -PassThru
# Esperar hasta que http://localhost:3000/api/stores/demo-farmacia/products?limit=1 responda 200
npm run test:api
Stop-Process -Id $p.Id -Force
```

No ejecutar `npm run db:seed` sobre la base actual: borra pedidos, productos y categorías.

El rate limiter de autenticación permite ~10 solicitudes por minuto e IP. Si se repite la suite muy seguido, reiniciar el servidor (el contador vive en memoria) antes de volver a correr `npm run test:api`.

### Bloqueos actuales

- **C-10:** el backend en Render responde `503` (verificado 2026-11-05); bloquea la demo en la nube hasta redeploy/verificación.
- **C-07/C-08/C-09:** bugs en corrección; el cliente no recibe eventos reales hasta desplegar el fix de Socket.io.
- Facturación fiscal pendiente de contador, no bloquea el piloto gratuito.
- Candidatos de piloto pendientes de prospección, no bloquean el desarrollo.
- CI de pruebas de API pendiente para Fase 5.
- Deuda de lint (85 advertencias) a reducir durante Fases 1–3.

---

## 13. Riesgos

| Riesgo | Mitigación |
|---|---|
| Mercado limitado en Puerto Ayacucho | Mitigado al expandir de solo farmacias a comida rápida (perros/hamburguesas/pizzas) y víveres/bodegones, multiplicando el volumen de pedidos diarios y clientes potenciales |
| Conectividad irregular | Optimizar imágenes, VPS en US East, evitar dependencias pesadas |
| Farmacias exigen recetas o lotes | Discovery temprano y Fase 2C condicional |
| Facturación fiscal incierta | Contador en semana 1; piloto gratuito |
| Un solo desarrollador | Documentar, commits pequeños y este registro |
| Alcance creciente | Fases cerradas y criterios de terminado |
| Cobro manual | Límite de clientes hasta automatizar |
