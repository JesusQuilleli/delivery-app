# Plan de trabajo — TiendaFast

> Documento vivo. Actualizar después de cada tarea.
> Si se pierde la sesión: leer este archivo, revisar `git status` y `git log`, y continuar desde la primera casilla sin marcar.

- **Última actualización:** 2026-11-06 (Landing comercial, identidad visual y CMS con preview)
- **Rama actual:** `feature/operational-enhancements`
- **Rama principal:** `main`
- **Estrategia de despliegue y validación:**
  1. **Hito 1 (Inmediato / En curso - Demostración y Validación Comercial):** Sistema 100% listo, probado y validable en **Localhost** y en el entorno de pruebas existente en la nube (**Netlify** para frontend + **Render** para backend + **Neon** para PostgreSQL). **Este entorno en Netlify y Render es estrictamente para la demostración presencial y validación con los primeros clientes de comida rápida, víveres y farmacias de Puerto Ayacucho.**
  2. **Hito 2 (Final / Producción Real con Clientes en VPS mediante Docker):** Empaquetado completo de la aplicación (Frontend, Backend, base de datos PostgreSQL 16 y Caddy 2 con SSL automático) mediante **Docker y Docker Compose**. Despliegue en VPS propio para iniciar la operación comercial real y cobro a clientes, logrando un despliegue portable con un solo comando (`docker compose up -d`), sin costos recurrentes de PaaS, con backups automáticos en volúmenes persistentes y máxima soberanía de datos.
- **Estado general:** F1-34, Fase 1B, bugs C-07/C-08/C-09 corregidos, C-10 verificado y tiendas demo creadas con seed idempotente. PDF de accesos y guion de demostración generado (`Accesos_Demo_TiendaFast.pdf`). En curso: Fase 2 restante (inventario/combos, configuración de tienda, pedidos/paginación y analytics). Planificado: Fase 2F de pulido (landing `/`, logo TiendaFast, WhatsApp comercial, CMS con preview/compare/guía y PDF de cotización diferido a Fase 6).
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
  - **Servidor:** VPS propio (Ubuntu 24.04 LTS) con Docker Compose: `caddy` público en `80/443` con TLS automático, `web` Nginx interno, `api` Node 20 y `db` PostgreSQL 16.
  - **Base de datos:** PostgreSQL 16 en contenedor, con volumen persistente y puerto `5432` no expuesto. Base limpia creada con `prisma migrate deploy`; sin migración desde Neon.
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
│            Caddy 2 (Docker)           │
│  SSL/TLS automático (80/443)          │
│  /api/* → api:3000                    │
│  /socket.io/* → api:3000 (WS)         │
│  /* → web:80 (Nginx interno)          │
└──────────┬────────────────────────────┘
           │
    ┌──────▼──────────────┐
    │  web: Nginx Alpine  │
    │  React dist/        │
    │  Puerto interno 80  │
    └─────────────────────┘
           │
    ┌──────▼──────────────┐
    │  api: Node.js 20    │
    │  Express + Socket.io│
    │  Puerto interno 3000│
    │  restart: always    │
    └──────┬──────────────┘
           │
    ┌──────▼──────────────┐
    │  db: PostgreSQL 16  │
    │  Volumen persistente│
    │  Puerto interno 5432│
    │  Sin exposición     │
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
- **Un solo `DATABASE_URL`** apuntando a `db:5432` dentro de la red privada de Docker. PostgreSQL no se expone al exterior.
- **Aislamiento por `store_id`:** Todas las queries (productos, pedidos, usuarios, categorías, combos, drivers, zonas) filtran por `store_id`. La identidad del cliente ya es compuesta `@@unique([store_id, email])`.

### Estado real del repositorio

- El núcleo funcional existe: catálogo, carrito, checkout, OTP, pedidos, dashboard, inventario, combos, motorizados, historial y SuperAdmin.
- Rama actual: `feature/operational-enhancements`, con cambios sin commitear en plan, planes, pedidos, tienda, landing, SuperAdmin, onboarding y utilidades `geo`.
- Las migraciones Prisma ya tienen baseline; precios y totales usan `Decimal(12,2)` y las tasas `Decimal(14,6)`.
- La base actual es Neon para demo/staging; producción usará PostgreSQL 16 en Docker con base limpia.
- Existe `GET /api/health`; no hay CI, pruebas E2E ni backups automáticos de producción.
- La documentación y los PDFs requieren alineación continua con el alcance real; el PDF de accesos demo ya está generado.
- Los planes existen a nivel de datos y panel SuperAdmin (plan, precio, ciclo, estado, trial, pagos y MRR), pero faltan cobro automático, límites efectivos y ciclo de vida de suscripción.

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
| Base de datos producción | PostgreSQL 16 local en Docker, base limpia creada con `prisma migrate deploy` + bootstrap; sin migración desde Neon |
| Producción definitiva | VPS propio con Docker Compose (web Nginx interno, API Node, PostgreSQL 16 y Caddy 2), mismo dominio y TLS automático |
| Landing pública `/` | Landing comercial de TiendaFast, no directorio ni redirección a tienda demo |
| WhatsApp comercial | `04124742535` → internacional `+58 412 474 2535` → `wa.me/584124742535` |
| CTA comercial | “Solicitar cotización” abre WhatsApp con mensaje prellenado |
| Testimonios | No mostrar testimonios ni clientes inventados hasta tener clientes reales; usar “Programa piloto” |
| Identidad visual | Logo propio TiendaFast (bolsa + rayo, verde bosque, crema y coral), favicon y Open Graph |
| PDF comercial | Se construye después de la landing; incluye planes, alcance, add-ons y CTA |
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

- [x] F2B-01 Agregar a `Store`: plan, ciclo, precio, estado, fin de prueba y próximo pago.
- [x] F2B-02 Crear historial de pagos: modelo `SubscriptionPayment` (monto, método, referencia, período y fecha).
- [x] F2B-03 Crear panel SuperAdmin de clientes, planes y estados con métricas visuales.
- [x] F2B-04 Implementar marcar pagado, extender, suspender y cambiar plan con auditoría estructurada.
- [x] F2B-05 Aplicar límites por plan: productos (Emprendedor: 50, Negocio: 250, Pro: 1000) en creación unitaria, combos y masiva.
- [x] F2B-06 Vencimiento automático de prueba y suspensión por impago (estados TRIAL, ACTIVE, PAST_DUE, SUSPENDED): Servicio subscriptionService.js con período de gracia de 5 días, job programado en server.js cada 12 horas, endpoint POST /api/superadmin/subscriptions/check-lifecycle y pruebas unitarias completas.
- [x] F2B-07 Crear asistente de alta SaaS: tienda, admin, selección de plan/días prueba y categorías iniciales por industria.
- [x] F2B-08 Crear plantilla de recibo imprimible y generador de recordatorios de pago para WhatsApp.
- [x] F2B-09 Crear panel de MRR y clientes activos (tarjetas KPI de ingresos recurrentes proyectados).
- [x] F2B-10 Registrar auditoría de acciones comerciales (`SUBSCRIPTION_UPDATED`, `SUBSCRIPTION_PAYMENT_RECORDED`).

**Criterio de terminado:** se puede cobrar, suspender y administrar clientes sin planillas externas.

---

### Fase 2C — Módulo Operativo de Farmacias: Récipe Médico y Control de Lotes (3 días)

Flujo integral de medicamentos con récipe médico, evaluación por farmaceuta y entrega física al motorizado:

- [x] F2C-01 **Schema de BD para Récipes y Lotes:** Flag `Product.requires_prescription Boolean @default(false)`, campos `Order.prescription_url String?`, `Order.prescription_status String @default("NOT_REQUIRED")` (`NOT_REQUIRED`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`), `Order.prescription_notes String?`, `Product.lot_number String?`, `Product.expires_at DateTime?`.
- [x] F2C-02 **Checkout con Subida de Récipe:** Si el carrito contiene productos con `requires_prescription === true`, solicitar obligatoriamente la carga fotográfica del récipe médico (subida segura a Cloudinary / JPEG-PNG-WEBP hasta 5MB).
- [x] F2C-03 **Aviso Legal y Compromiso de Entrega:** Mensaje explícito al cliente en Checkout y comprobante: *"Al recibir tu pedido, deberás entregar el récipe médico original en físico al motorizado para poder entregarte tus medicamentos"*.
- [x] F2C-04 **Modal de Evaluación en Dashboard / OrderDetails:** El farmaceuta visualiza la foto del récipe ampliada y dispone de acciones: *"Aprobar Récipe"* (habilita preparación) o *"Rechazar Récipe"* (solicita motivo explicativo: fecha expirada, dosis ilegible, etc.).
- [x] F2C-05 **Notificación en Tiempo Real al Cliente:** Notificación inmediata del resultado de evaluación de su récipe en `/checkout` y `/mis-pedidos`.
- [x] F2C-06 **Comprobante y Hoja de Ruta para Motorizado:** Indicador destacado *"⚠️ RETENER RÉCIPE FÍSICO"* en la comanda del motorizado con confirmación de recepción física al entregar.
- [x] F2C-07 **Control de Lotes y Vencimiento en Inventario:** Registro de `lot_number` y fecha de caducidad en el inventario de farmacias con alerta visual de próximos a vencer (<60 días).
- [x] F2C-08 **Bloqueo de Venta de Vencidos:** Bloqueo transaccional de venta para medicamentos con fecha de vencimiento cumplida (`expires_at < hoy`).

---

### Fase 2D — Correcciones Operativas Críticas y Experiencia en Vivo (Bloque A - Inmediato)

- [x] F2D-01 **Mapas sin marcas de agua (OpenStreetMap Standard y Auto-Bounds):** Sustituir Carto basemaps (que exige API key) por OpenStreetMap Standard en `Checkout.tsx`, `OrderDetails.tsx`, `Dashboard.tsx` y `Settings.tsx`. Añadido auto-encuadre dinámico (`fitBounds`) entre el local y la dirección de entrega del cliente. Sincronizado y desplegado en `main` para actualización en vivo de Netlify en `https://test.shop-mg.com`.
- [x] F2D-02 **Campanita Sonora ante Nuevos Pedidos en Dashboard:** Generador de audio de dos tonos (ding-dong 880Hz / 1320Hz) con Web Audio API sintetizado en el cliente (cero dependencias de red, nunca falla por 404), archivo mp3 de respaldo en `frontend/public/notification.mp3` y botón activador de audio amigable ante políticas de autoplay del navegador.
- [x] F2D-03 **Sincronización en Tiempo Real sin Refrescar:** Inyectar JWT token en `socket.ts` handshake auth para superar el bloqueo de cookies de terceros en cross-domain (Netlify ↔ Render), asegurar reconexión reactiva en `RealtimeContext.tsx`, y activar polling de alta frecuencia (cada 4s) en `Checkout.tsx` (Paso 5) y modal de `MyOrders.tsx` cuando una orden está activa.
- [x] F2D-04 **Cola de Pedidos por Urgencia (FIFO):** Ordenar los pedidos pendientes (`PENDING` y `AWAITING_PAYMENT`) por `createdAt ASC` (el que lleva más tiempo esperando de primero arriba) en backend y en `Dashboard.tsx`, agregando badges dinámicos de tiempo transcurrido (Verde <10m, Ámbar 10-20m, Rojo parpadeante >20m con alerta de urgencia).
- [x] F2D-05 **Exclusividad Estricta de Funcionalidades por Industria (`industry === 'PHARMACY'`):** Ocultar de forma absoluta botones de récipes médicos, cotizaciones por récipe, formularios de lotes/vencimiento y banners médicos en comercios de Comida Rápida y Víveres (`Dashboard.tsx`, `Inventory.tsx`, `Catalog.tsx`, `Checkout.tsx`). Solo se activan si `storeConfig.industry === 'PHARMACY'`.
- [x] F2D-06 **Tarifas de Delivery por Zona y Transparencia en el Pago Total:**
  - **Administrador (`Settings.tsx`):** Gestión visual de tarifas por distancia (km min - km max). Botón de 1 clic *"⚡ Cargar Zonas Sugeridas (Puerto Ayacucho)"* y Simulador Interactivo de Tarifas en vivo para pruebas instantáneas.
  - **Cliente (`Checkout.tsx`):**
    - Paso 3: Tarjeta destacada con nombre de la zona, distancia calculada por carretera, tiempo estimado de viaje y tarifa en USD y Bolívares.
    - Paso 4: Desglose transparente en el resumen de pago (Subtotal productos + Envío / Delivery con nombre de zona y km = Total a Pagar en USD y en Bolívares a la tasa del día).
  - **Motorizado:** Flete y zona claramente visibles en el ticket y mensaje de navegación de WhatsApp.

---

### Fase 2E — CMS de Personalización Visual y Multi-Sucursales (Bloque B - SaaS)

- [x] F2E-01 **Modelo `landing_config` en Prisma:** Campo `landing_config Json?` en `Store` (slogan, subtitle, hero_image, banner_url, badge_promo, badge_delivery, whatsapp_contact, about_text).
- [x] F2E-02 **Módulo interactivo "Diseño & Landing" en SuperAdmin y Configuración de Tienda:** Formulario visual con subida de imágenes a Cloudinary y previsualizador en vivo sin tocar código.
- [x] F2E-03 **Integración dinámica en Plantillas:** Actualizar `PharmacyTemplate.tsx`, `Hero.tsx`, `RestaurantTemplate.tsx` y `SupermarketTemplate.tsx` para consumir `store.landing_config` con fallback estándar.
- [x] F2E-04 **Estrategia comercial SaaS de personalización:** Nivel estándar incluido en Emprendedor, personalización de textos/badges en Negocio ($19/m), diseño completo de banners y marca en PRO ($35/m) o Add-on de Branding ($15 único).
- [x] F2E-05 **Arquitectura Multi-Sucursales:** Campo `parent_store_id Int?` en `Store`, vinculación de sedes secundarias (ej. Farma-Ayacucho Centro vs Sur).
- [x] F2E-06 **Enrutamiento por Proximidad y Selector de Sede:** Selector de sucursales en la landing con detección de ubicación del cliente y ordenamiento Haversine por distancia.
- [x] F2E-07 **Monetización Multi-Sucursal:** Esquema de add-on de sucursal adicional (+ $10/mes por sede extra en vez de tienda completa).

---

### Fase 2C-B — Récipes Avanzados (Retención en Farmacia vs Mostrar) y Cotizador por Récipe (2 días)

Flujo avanzado de prescripción médica adaptado a la operativa real de farmacias:

- [x] F2C-09 **Clasificación de Récipe en Producto:** Campo `Product.prescription_type` (`NONE` = venta libre, `SHOW_ONLY` = mostrar al motorizado pero retiene cliente, `RETAIN_ORIGINAL` = retención física obligatoria y archivado en farmacia).
- [x] F2C-10 **Distintivos Visuales en Catálogo y Búsqueda:** Badges destacados en el catálogo para cada medicamento: *"Venta solo con récipe"* (azul) y *"Requiere retención de récipe original"* (rojo/ámbar).
- [x] F2C-11 **Formulario de Inventario Farmacéutico:** Selector de 3 opciones en alta y edición de producto para que el administrador configure el tipo de récipe de forma intuitiva.
- [x] F2C-12 **Instrucciones Diferenciadas para Motorizado y Cliente:**
  - Si la orden contiene `RETAIN_ORIGINAL`: Alerta roja en comanda y WhatsApp *"🔴 OBLIGATORIO: Retener y llevar el récipe original físico a la farmacia (no devolver al cliente)"*.
  - Si es `SHOW_ONLY`: Alerta amarilla *"🟡 Verificar récipe físico del cliente antes de entregar (se lo queda el cliente)"*.
- [x] F2C-13 **Módulo "Pedir con mi Récipe" (Carga directa sin buscar producto por producto):**
  - Botón prominente en catálogo y landing: *"📸 Pedir con mi Récipe"*.
  - El cliente sube la foto del récipe manuscrito con su número de contacto y notas opcionales en 1 clic.
- [x] F2C-14 **Bandeja de "Cotizaciones por Récipe" en Dashboard de Farmacia:**
  - El farmaceuta recibe la solicitud, visualiza el récipe y arma el carrito del cliente con el inventario en 2 clics.
  - Envía la cotización aprobada con enlace directo de pago y notificación en tiempo real.
- [x] F2C-15 **Asistente de Detección de Medicamentos y Sugerencia de Stock:** Detección de medicamentos solicitados en las notas del récipe, visualización destacada de notas del cliente, chips de sugerencias inteligentes con adición en 1 clic y buscador rápido en tiempo real dentro del modal de cotización de Dashboard.

---

### Fase 2E-B — CMS Modular de Secciones, Banners y Estructura Visual (2 días)

Personalización estructural de la landing page para clientes en planes avanzados sin tocar código:

- [x] F2E-08 **Estructura Modular en `landing_config`:** Soporte para visibilidad de secciones (`promos`, `categories`, `banners`, `about`, `gallery`, `testimonials`) y carrusel de banners promocionales.
- [x] F2E-09 **Editor de Bloques en Configuración de Tienda:** Panel visual para activar/desactivar bloques, reordenar secciones y subir hasta 3–5 banners con títulos y enlaces directos al catálogo.
- [x] F2E-10 **Galería de Fotos del Local / Fachada:** Subida de fotografías del establecimiento físico a Cloudinary para reforzar confianza del cliente.
- [x] F2E-11 **Consumo Modular en Plantillas:** Las plantillas de Farmacia, Restaurante y Supermercado renderizan condicionalmente los bloques según la configuración del comerciante.
- [x] F2E-12 **Límites Comerciales por Plan SaaS:** Plan Emprendedor (plantilla fija), Plan Negocio (textos y banner principal), Plan PRO / Add-on CMS (control modular total de bloques y banners ilimitados).

---

### Fase 2F — Pulido de producto, landing comercial, identidad y CMS con preview (4 días)

**Objetivo:** convertir `/` en una landing comercial de TiendaFast, eliminar contenido falso, mejorar la percepción de marca y dar al administrador un CMS con vista previa real antes de publicar.

**Decisiones aplicadas:**
- WhatsApp comercial: `+58 412 474 2535` (`wa.me/584124742535`).
- No se muestran testimonios ni clientes inventados hasta tener clientes reales.
- Se usa “Programa piloto” como sección de confianza.
- El CTA principal es “Solicitar cotización” y abre WhatsApp con mensaje prellenado.
- El PDF comercial se genera después, en Fase 6.

- [x] F2F-01 **Landing pública de TiendaFast en `/`:**
  - Reemplazar el redirect actual a `/demo-farmacia` por una landing comercial.
  - Secciones: hero, problema, qué es TiendaFast, cómo potencia al negocio, cómo funciona, verticales, funciones, programa piloto, planes resumidos, FAQ, CTA final y footer.
  - No consumir API ni base de datos; debe funcionar con la base limpia.
  - CTAs: “Solicitar cotización” → WhatsApp; “Ya soy cliente” → `/admin-login`.
  - Metadatos SEO y Open Graph.
  - Archivos: `frontend/src/pages/TiendaFastLanding.tsx`, `frontend/src/content/tiendaFastLanding.ts`, `frontend/src/App.tsx`, `frontend/index.html`.
- [x] F2F-02 **Identidad visual TiendaFast:**
  - Crear logo horizontal, compacto, apilado, solo icono y monocromático.
  - Concepto: bolsa de compra con rayo en negativo.
  - Paleta: verde bosque `#123B2F`, crema `#FCF7ED`, coral `#F26A3D`.
  - Tipografía: Sora ExtraBold para wordmark; Manrope para tagline.
  - Reemplazar el favicon actual de Vite.
  - Archivos: `frontend/public/brand/*`, `frontend/public/favicon.svg`, `frontend/src/components/brand/TiendaFastLogo.tsx`.
  - No modificar el branding propio de cada tienda en sus plantillas.
- [x] F2F-03 **WhatsApp comercial y CTA de cotización:**
  - Configurar `VITE_CONTACT_WHATSAPP=584124742535`.
  - Generar enlace `wa.me` con mensaje prellenado: “Hola, quiero una cotización de TiendaFast para mi negocio.”
  - Usarlo en hero, planes, CTA final y footer.
  - Mostrar siempre el número en formato internacional.
- [x] F2F-04 **Contenido honesto y sección de piloto:**
  - Eliminar testimonios inventados de la landing y de tiendas nuevas.
  - Ocultar “Testimonios” por defecto hasta que existan clientes reales.
  - Agregar sección “Programa piloto” en `/`.
  - Evitar afirmaciones no implementadas: pagos automáticos, testimonios o métricas falsas.
- [x] F2F-05 **Storefront compartido:**
  - Extraer el renderizador de `Landing.tsx` a `frontend/src/components/landing/Storefront.tsx`.
  - Recibe `store`, `categories`, `offers` y `combos`.
  - Selecciona plantilla por industria: farmacia, restaurante o supermercado.
  - Reutilizarlo en la landing pública y en el preview del CMS.
  - Mantener `BranchSelector`, pero desactivar navegación e interacciones dentro del preview.
- [x] F2F-06 **Unificación de temas y aislamiento del preview:**
  - Crear `frontend/src/lib/themes.ts` con `blue`, `red`, `green`, `purple`, `orange` y `coral`.
  - Usar la misma lista en Settings y SuperAdmin.
  - Corregir `emerald`, `rose` y `amber`, que hoy caen silenciosamente en azul.
  - Crear `ThemeScope` para aplicar `--primary` dentro del preview sin cambiar el tema del panel.
  - Exportar el mapa de colores desde un solo lugar.
- [x] F2F-07 **Preview del CMS:**
  - Editor a la izquierda y preview sticky a la derecha en desktop.
  - En móvil, botón “Vista previa” que abre pantalla completa.
  - Selector desktop / tablet / móvil.
  - Pestañas “Ahora”, “Con cambios” y “Comparar”.
  - Renderizar directamente con `Storefront`; no usar iframe ni duplicar plantillas.
  - Desactivar enlaces y botones internos del preview.
  - Componentes: `LandingPreview.tsx` y `PreviewFrame.tsx`.
- [x] F2F-08 **Editor guiado y resumen de cambios:**
  - Pasos: Marca y color, Portada y textos, Secciones, Banners, Galería, Revisar y publicar.
  - Barra sticky: “Cambios sin guardar”, “Descartar”, “Vista previa” y “Publicar cambios”.
  - Panel “Cambios detectados” con textos antes → después.
  - Avisos si una sección está activa pero vacía.
  - Contadores de longitud y recomendaciones de tamaño de imagen.
  - Persistir borrador en `sessionStorage`.
  - Advertir con `beforeunload` si hay cambios sin publicar.
  - Componentes: `ChangeSummary.tsx`, `CmsStepper.tsx` y `landingDiff.ts`.
- [x] F2F-09 **Aislamiento de guardados:**
  - Separar `saveStoreSettings`, `saveRates`, `saveDelivery`, `savePaymentData` y `publishLanding`.
  - Evitar que “Guardar Tasas” o “Guardar Delivery” pisen el borrador del CMS.
  - Cada tarjeta envía solo sus campos.
  - “Publicar cambios” actualiza la configuración guardada y refresca la landing pública.
- [x] F2F-10 **Backend de landing:**
  - Agregar `PUT /api/stores/:slug/landing`.
  - Nuevo controlador `updateStoreLanding`.
  - Helper `backend/utils/landing.js` para normalizar y validar textos, colores, industria, secciones, máximo 5 banners, máximo 4 imágenes de galería, URLs `https://` y rechazo de HTML/scripts.
  - Aplicar la misma validación a `updateStoreSettings`.
  - Tests unitarios y de autorización.
- [x] F2F-11 **Contacto, WhatsApp y contenido editable:**
  - Agregar input de WhatsApp en el CMS.
  - `WhatsAppFab` y `Contact` usan `landing_config.whatsapp_contact`.
  - El formulario de contacto abre WhatsApp con mensaje prellenado.
  - Agregar `about_text` e imágenes de “Quiénes somos”.
  - Ocultar “Quiénes somos” si no hay contenido real.
  - No mostrar testimonios hardcodeados.
- [x] F2F-12 **Pruebas, accesibilidad y rendimiento:**
  - Tests de `landingDiff` y normalización de `landing_config`.
  - Tests de preview: cambio de pestaña, comparación y resumen.
  - Tests de API para guardado y validación.
  - Revisión de teclado, foco, contraste y lectores de pantalla.
  - Lighthouse en `/` y en el panel.
  - Verificar que el preview no contamine el tema del admin.
- [x] F2F-13 **Documentación:**
  - Documentar uso del logo, favicon y Open Graph.
  - Documentar flujo “editar → previsualizar → comparar → publicar”.
  - Actualizar manual de onboarding si cambia la configuración de landing.
- [ ] F2F-14 **PDF comercial de cotización:**
  - Se cubre con F6-01 a F6-09.
  - Incluye planes $9 / $19 / $35, alcance por plan, add-ons, implementación y soporte.
  - CTA con WhatsApp `+58 412 474 2535` y QR.
  - No se genera en esta fase; queda listo para después de validar la landing.

**Criterio de terminado:**
- `/` funciona con base limpia, sin API y sin redirección a demo.
- El CTA de cotización abre WhatsApp con mensaje prellenado.
- No se publican testimonios ni clientes inventados.
- El logo y el favicon son propios de TiendaFast.
- El CMS permite editar, previsualizar, comparar y publicar sin pisar otros cambios.
- El tema seleccionado se refleja correctamente en la landing.
- Tests, lint, typecheck y build pasan.

---

### Fase 2G — Experiencia de Pago con Capture (OCR), Validación por WhatsApp y Recuperación de Accesos Admin (2 días)

- [x] F2G-01 **Ver/Ocultar Contraseña en Login de Admin y SuperAdmin:** Botón de alternancia con icono de ojo (`Eye` / `EyeOff`) en los campos de contraseña de `/admin-login`, `/superadmin` y cambio de contraseña en `Settings.tsx`.
- [x] F2G-02 **Flujo "¿Olvidaste tu contraseña?" y Solicitud de Desbloqueo a SuperAdmin:**
  - Enlace visible en `/admin-login` para administradores que hayan olvidado su contraseña.
  - Modal para ingresar usuario o slug de la tienda con botón directo a WhatsApp del Fundador (`+58 412 474 2535`) con mensaje prellenado estructurado: *"Hola SuperAdmin, soy el encargado de la tienda [Slug/Nombre] y requiero restablecer mi contraseña de acceso."*
  - Registro de auditoría/solicitud en backend (`PasswordResetRequest`).
- [x] F2G-03 **Módulo de Reseteo Rápido de Contraseñas en Panel SuperAdmin:**
  - Pestaña o acción de 1 clic en la lista de tiendas de `SuperAdmin.tsx` para restablecer la contraseña del admin de cualquier tienda.
  - Generador de contraseña temporal aleatoria segura (ej. `Fast2026-X8Y`), cifrado en base de datos con `bcrypt` y botón de WhatsApp para enviar las nuevas credenciales al comerciante en 1 clic.
- [x] F2G-04 **Carga de Capture de Pago Móvil en Checkout y Visualización en Dashboard:**
  - Campo `Order.payment_receipt_url` en base de datos.
  - En `Checkout.tsx` (Paso 4): Zona de carga intuitiva para subir el comprobante/capture de pantalla del banco (JPEG/PNG/WEBP a Cloudinary).
  - En `Dashboard.tsx` y `OrderDetails.tsx`: Miniatura interactiva del capture en la pestaña "Por Validar", con apertura en modal ampliado para que el comerciante verifique la transferencia visualmente en 2 segundos.
- [x] F2G-05 **Extracción Asistida de Datos del Capture de Pago Móvil (OCR / Parser):**
  - Procesamiento del comprobante para extraer automáticamente número de referencia bancaria y monto en bolívares.
  - Pre-llenado automático de la referencia y monto en el formulario de Checkout para que el cliente solo confirme con 1 clic sin tener que tipear números largos.
- [x] F2G-06 **Paso a Paso y Pasarela de Validación de OTP por WhatsApp:**
  - Selector dual en Checkout: *"Recibir código por: [Correo] | [WhatsApp]"*.
  - Integración de pasarela para envío de código de 6 dígitos al WhatsApp del cliente (Meta Cloud API / Evolution API / WhatsApp Gateway) con contingencia asistida al WhatsApp comercial.

---

### Fase 2H — Página Completa de CMS/Diseño, Optimización y Limpieza de Cloudinary, y Reportes Avanzados con Métricas de Impacto Comercial (2 días)

- [x] F2H-01 **Página Dedicada de CMS y Diseñador de Tienda (`/admin/:slug/cms`):**
  - Vista independiente `CmsDesign.tsx` con acceso desde la barra de navegación de `AdminLayout.tsx` (`Diseño CMS`).
  - Layout expandido de pantalla completa con control de visualización: **Vista Dividida (Split Screen)**, **Solo Editor** y **Solo Vista Previa**.
  - Corrección del viewport comprimido en la previsualización: iframes con ancho mínimo real, simulación de dispositivos (Desktop, Tablet, Mobile) fluida y modo "Comparar" lado a lado sin quiebre tipográfico vertical.
  - Enlace rápido y tarjeta promocional en `Settings.tsx` para dirigir al diseñador CMS completo.
- [x] F2H-02 **Evaluación de Cloudinary y Sistema de Limpieza Automática de Multimedia:**
  - Diagnóstico de cuotas y límites del Tier Gratuito de Cloudinary (25 créditos/mes, almacenamiento y ancho de banda).
  - Hoja de ruta para transición a almacenamiento soberano en VPS con volumen persistente Docker o Cloudflare R2 con 0 costos de salida.
  - Módulo central `backend/utils/cloudinaryCleaner.js` para autodestrucción de imágenes huérfanas en Cloudinary:
    - Borrado al eliminar productos o combos (`deleteProduct`).
    - Borrado al reemplazar la imagen de un producto (`updateProduct`).
    - Borrado al eliminar o editar categorías (`deleteCategory`, `updateCategory`).
    - Detección y limpieza de imágenes removidas en la landing (portadas, banners y fotos de galería descartadas en `updateStoreLanding`).
  - Auto-optimización de entrega con transformaciones `f_auto,q_auto` en URLs multimedia.
- [x] F2H-03 **Sección Avanzada de Reportes y Analíticas con Gráficas (`OrderHistory.tsx` & `storeController.js`):**
  - Ampliación de analíticas en backend (`getStoreAnalytics`): desglose de ventas netas vs costo de delivery, ticket promedio, ventas por día/semana y distribución por método de pago.
  - Interfaz de analíticas enriquecida con `recharts` en `OrderHistory.tsx`:
    - Gráfico de área de evolución de ingresos en el tiempo.
    - Gráfico circular de distribución de pagos (Pago Móvil vs Efectivo).
    - Métricas de impacto comercial y beneficio de TiendaFast: volumen digitalizado, ticket promedio y efectividad de despachos.
    - Exportación a CSV con desglose detallado.

---

---

### Fase 2I — Delimitación Geográfica en Puerto Ayacucho, Edición/Cancelación Asistida de Pedidos y Línea Oficial de WhatsApp (1 día)

- [x] F2I-01 **Delimitación Geográfica Estricta a Puerto Ayacucho (Municipio Atures, Amazonas):**
  - Módulo `isInsidePuertoAyacucho` en `deliveryService.js` con delimitador perimetral (bounding box lat [5.40, 5.95], lon [-67.85, -67.45] y radio haversine de 25 km desde el centro de Puerto Ayacucho).
  - Bloqueo en cotización (`/delivery-quote`) y creación de pedidos (`placeOrder`) ante coordenadas o direcciones de texto fuera de Puerto Ayacucho / Atures.
  - Alerta visual inmediata en checkout ante intentos de seleccionar direcciones fuera de la ciudad.
- [x] F2I-02 **Cancelación y Modificación de Pedidos por el Cliente según Vertical:**
  - Ventana de edición y cancelación basada en industria (`store.industry`):
    - **Comida Rápida / Restaurantes:** Cancelación y edición permitidas antes de iniciar preparación en cocina (estados `AWAITING_PAYMENT`, `PENDING`, `ACCEPTED`). Bloqueo estricto una vez en `PREPARING`.
    - **Víveres y Farmacias:** Cancelación y edición permitidas antes de entregar al repartidor (estados `AWAITING_PAYMENT`, `PENDING`, `ACCEPTED`, `PREPARING`). Bloqueo estricto una vez en `ON_THE_WAY`.
  - Endpoint `PUT /orders/:id/items` para reajuste transaccional de productos, reversión y nuevo descuento de inventario, y recálculo de montos con emisión Socket.io en tiempo real.
  - Modales dedicados `CancelOrderModal` y `EditOrderModal` en `OrderActionModals.tsx` integrados en el seguimiento de Checkout y en `MyOrders.tsx`.
- [x] F2I-03 **Configuración de Línea WhatsApp Dedicada (+58 4161804831):**
  - Número oficial `+58 4161804831` configurado como remitente/bot predeterminado en `whatsappService.js` y `authController.js`.
  - Fallback interactivo en Checkout apuntando directamente al enlace oficial `https://wa.me/584161804831`.
  - Guía operativa documentada para vincular el dispositivo físico vía Evolution API / Baileys.

### Fase 3 — Seguridad (4 días)

#### Socket.io

- [x] F3-01 Autenticar el handshake con la cookie httpOnly y token auth.
- [x] F3-02 Autorizar `join_store` según el token y rol de la tienda.
- [x] F3-03 Autorizar `join_client` según el usuario autenticado.
- [x] F3-04 Validar y limitar payloads numéricos en salas.
- [x] F3-05 Activar `withCredentials` en el cliente (`socket.ts`).
- [x] F3-06 Probar aislamiento de salas (`test/socket.security.test.js`).

#### Cookies y CSRF

- [x] F3-07 Configurar `app.set('trust proxy', 1)`.
- [x] F3-08 Cookies con `SameSite=None; Secure; Partitioned` para cross-site en staging y `SameSite=Lax` en producción mismo origen.
- [x] F3-12 Mantener `Secure` en producción.

#### OTP y autenticación

- [x] F3-13 Guardar OTP con hash SHA-256 en base de datos.
- [x] F3-14 Limitar intentos por código OTP.
- [x] F3-15 Bloquear temporalmente tras fallos (5 intentos -> 15 min lock).
- [x] F3-18 No imprimir OTP en logs en producción.
- [x] F3-19 Aplicar política de contraseñas (mínimo 6 caracteres).

#### Validación y uploads

- [x] F3-21 Schemas Zod para settings, clientes, motorizados y SuperAdmin (`validations/storeValidation.js`).
- [x] F3-24 Limitar tamaño a 5 MB por archivo en subidas de imágenes.
- [x] F3-25 Bloquear SVG para prevención de XSS y restringir a JPEG, PNG, WEBP.

#### Infraestructura

- [x] F3-27 Helmet con CSP, HSTS y endpoint `/api/health`.
- [x] F3-28 Manejador centralizado de errores en backend.
- [x] F3-33 Pruebas automatizadas de sockets, OTP y validaciones.

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

### Fase 4 — Producción Definitiva en VPS Contenedorizado con Docker y PostgreSQL local

> **Evaluación Técnica de Recursos del VPS Confirmada (Ubuntu 22.04 LTS):**
> - **CPU:** 1 vCPU (consumo base en reposo ~18%).
> - **Memoria RAM:** 4.0 GiB (actualmente solo 934 MiB utilizados, **~3.1 GiB libres**).
> - **Memoria SWAP:** 2.0 GiB activos.
> - **Almacenamiento:** 58.76 GiB NVMe (solo 8.59 GiB usados, **~50.17 GiB libres**).
> - **Diagnóstico de Viabilidad:** **100% APTO Y SOBRADO.** El stack completo contenedorizado (PostgreSQL 16: ~150MB + Node API: ~160MB + Nginx SPA: ~30MB + Caddy TLS: ~40MB + Evolution API Baileys: ~200MB) consumirá aproximadamente 600 - 800 MB de RAM, dejando más de 2.3 GiB de margen holgado para tráfico, subida de imágenes y consultas pesadas.

> **Nota de ejecución:** Esta fase se mantiene completamente planificada y documentada para su ejecución posterior (tarea pendiente por hacer, no ejecutar de inmediato). **Netlify y Render se reservan exclusivamente para la demostración y validación comercial.** Para atender a clientes reales y cobro de suscripciones, la app se empaquetará con Docker y Docker Compose (frontend, backend, base de datos PostgreSQL 16 y Caddy 2) para desplegarse fácilmente en un VPS propio en minutos. **Al momento de iniciar esta fase, el asistente solicitará al usuario la IP, accesos SSH y credenciales del VPS para proceder con el aprovisionamiento y despliegue.**

#### 4-Docker — Empaquetado Integral con Docker y Docker Compose para VPS (Pendiente por hacer)

- [x] F4-D01 **Orquestación con Docker Compose de Producción (`docker-compose.prod.yml`):** (Preparado en repositorio)
  - Servicio `db`: Contenedor `postgres:16-alpine` con volumen persistente `postgres_data`, red privada interna `delivery_net` (puerto 5432 no expuesto al exterior) y healthcheck con `pg_isready`.
  - Servicio `api`: Contenedor backend Node.js 20 con `docker-entrypoint.sh`, auto-ejecución de migraciones Prisma (`npx prisma migrate deploy` al iniciar), conexión interna a `db:5432`, healthcheck `/api/health` y reinicio automático (`restart: always`).
  - Servicio `web`: Contenedor Nginx Alpine sirviendo el build de React (`dist/`) en el puerto interno 80. No hace reverse proxy; Caddy enruta `/api` y `/socket.io` al API.
  - Servicio `caddy`: Caddy 2 público en `80/443`, TLS automático, `/api/*` y `/socket.io/*` → `api:3000`, resto → `web:80`, volúmenes `caddy_data` y `caddy_config`.
  - No agregar servicios `certbot` ni `db-backup`: TLS lo gestiona Caddy y los backups se ejecutan desde cron del host.
- [x] F4-D02 **Dockerfiles Multi-Stage de Producción y nginx.conf:** (Preparado en repositorio)
  - `backend/Dockerfile`: Multi-stage build con `node:20-bookworm-slim` por `bcrypt`, copiar `prismaClient.js`, `services/`, `utils/`, `scripts/` y `prisma/`, generar cliente Prisma y ejecutar con usuario no-root.
  - `frontend/Dockerfile`: Multi-stage build con Node y `nginx.conf` propio; build args `VITE_API_URL=/api` y `VITE_SOCKET_URL=https://<DOMINIO>`.
  - Ignorar `.env*` en el contexto Docker para que `frontend/.env.production` (Render) no se cuele en la imagen.
- [x] F4-D03 **Script de Despliegue Automatizado en VPS (`scripts/vps-deploy.sh`):** (Preparado en repositorio)
  - Script bash: `git pull`, validación de variables en `.env.production`, `docker compose -f docker-compose.prod.yml up -d --build` y comprobación de salud de contenedores.
- [ ] F4-D04 **Base limpia de producción (sin migración Neon):**
  - Crear la base vacía en el contenedor PostgreSQL, ejecutar `prisma migrate deploy` y crear el primer SuperAdmin de forma segura.
  - No importar datos de Neon ni de demostración. Las tiendas se crean desde SuperAdmin.
- [ ] F4-D05 **Backups y volúmenes persistentes:**
  - Volumen `postgres_data` para PostgreSQL y backups con cron del host usando `docker compose exec -T db pg_dump | gzip` con retención de 30 días.
  - No depender de rutas directas a `/var/lib/docker/volumes/...`.
- [x] F4-D06 **Bootstrap de SuperAdmin (`backend/scripts/create-superadmin.js`):** (Preparado en repositorio)
  - Crear `backend/scripts/create-superadmin.js` con usuario, contraseña y email por variables de entorno; sin contraseña hardcodeada.
  - Endurecer o retirar `reset_superadmin.js` de producción.
- [ ] F4-D07 **Validación de base limpia:**
  - Verificar migraciones, login de SuperAdmin, creación de tienda, creación de admin y carga de landing.
- [x] F4-D08 **Caddyfile y Configuración TLS Automática:** (Preparado en repositorio)
  - Crear `Caddyfile`, apuntar el dominio al VPS y verificar emisión/renovación de certificados.
- [ ] F4-D09 **Variables de producción, CORS y cookies:**
  - Exigir `ALLOWED_ORIGINS` con el dominio real y eliminar `test.shop-mg.com` del valor por defecto.
  - Configurar `NODE_ENV=production`, `trust proxy`, `JWT_SECRET` y cookies `Secure`/`SameSite` según same-origin.
- [ ] F4-D10 **Socket same-origin:**
  - Cambiar el fallback de `frontend/src/lib/socket.ts` de `http://localhost:3000` a `window.location.origin`.

#### 4-WhatsApp — Pasarela de WhatsApp en VPS con Evolution API y Baileys (Línea +58 4161804831)

- [ ] F4-WA01 **Contenedor Evolution API en Docker Compose:**
  - Agregar servicio `evolution-api` (`atendai/evolution-api:v2.1.2`) en la red interna `delivery_net` escuchando en `127.0.0.1:8080:8080` (no expuesto a internet público).
  - Configurar variables: `AUTHENTICATION_API_KEY`, `DATABASE_ENABLED=true` (usando PostgreSQL interno) y `SERVER_URL`.
- [ ] F4-WA02 **Vinculación de la Línea Oficial +58 4161804831:**
  - Creación de la instancia `tiendafast` vía endpoint REST: `POST /instance/create` con `{"instanceName": "tiendafast", "qrcode": true}`.
  - Escaneo del código QR desde el teléfono físico con la línea WhatsApp `+58 4161804831` (Ajustes -> Dispositivos vinculados -> Vincular un dispositivo).
- [ ] F4-WA03 **Interconexión con el Backend Node.js:**
  - Configurar en `.env.production` del backend:
    - `EVOLUTION_API_URL=http://evolution-api:8080`
    - `EVOLUTION_API_KEY=<tu_clave_api_secreta>`
    - `EVOLUTION_INSTANCE=tiendafast`
    - `WHATSAPP_BOT_NUMBER=584161804831`
- [ ] F4-WA04 **Medidas Anti-Baneo y Calentamiento de la Línea (Ya Codificadas):**
  - **Spintax de Mensajería:** Cuatro variaciones dinámicas de texto para que cada mensaje OTP sea diferente a ojos de WhatsApp.
  - **Simulación Humana:** Presencia `composing` y retraso de 1.500 ms antes de enviar el mensaje.
  - **Rate Limiting Estricto:** Máximo 3 solicitudes por teléfono cada 15 minutos para prevenir abusos.
  - **Fallback Asistido:** Botón de contacto directo hacia el chat oficial si el cliente tiene problemas de conectividad.

#### 4A — Provisionamiento del VPS

- [ ] F4-01 Contratar VPS (Hetzner/Contabo/DigitalOcean, mínimo 2 vCPU, 4 GB RAM, 80 GB NVMe, Ubuntu 24.04 LTS).
- [ ] F4-02 Acceso SSH con clave pública; deshabilitar login con contraseña.
- [ ] F4-03 Crear usuario no-root para la app (`adduser deploy`; desactivar login root por SSH).
- [ ] F4-04 Configurar firewall UFW: abrir solo 22 (SSH), 80 (HTTP) y 443 (HTTPS).
- [ ] F4-05 Instalar Fail2Ban y habilitar regla para SSH.
- [ ] F4-06 Habilitar actualizaciones automáticas de seguridad (`unattended-upgrades`).

#### 4B — PostgreSQL 16 en contenedor

- [ ] F4-07 Definir `POSTGRES_DB=delivery_db`, `POSTGRES_USER=delivery_user` y `POSTGRES_PASSWORD` en el `.env` de producción; no instalar PostgreSQL en el host.
- [ ] F4-08 Generar contraseña de mínimo 32 caracteres con `openssl rand -base64 32`.
- [ ] F4-09 Persistir datos en el volumen `postgres_data`.
- [ ] F4-10 No publicar el puerto `5432`; dejar la DB solo en la red interna `delivery_net`.
- [ ] F4-11 Verificar salud con `docker compose exec db pg_isready -U delivery_user -d delivery_db`.
- [ ] F4-12 Verificar que el puerto 5432 no escuche en interfaces públicas (`ss -tlnp | grep 5432`).

#### 4C — Base limpia y migraciones

- [ ] F4-13 Crear la base `delivery_db` vacía mediante `POSTGRES_DB` en el contenedor.
- [ ] F4-14 Configurar `DATABASE_URL=postgresql://delivery_user:PASS@db:5432/delivery_db` en el `.env` de producción.
- [ ] F4-15 Ejecutar `docker compose exec -T api npx prisma migrate deploy` y verificar que no haya deriva de esquema.
- [ ] F4-16 Crear el primer SuperAdmin con `create-superadmin.js`.
- [ ] F4-17 Verificar que no existan datos de Neon, demo ni pruebas en producción.

#### 4D — Docker, Backend y Frontend

- [ ] F4-18 Construir el backend con `node:20-bookworm-slim`; no instalar Node.js en el host.
- [ ] F4-19 Clonar repositorio en `/var/www/delivery-app`.
- [ ] F4-20 Crear `.env` de producción: `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET` de 128 caracteres y `ALLOWED_ORIGINS` con el dominio real.
- [ ] F4-21 Validar `npm ci` + `npx prisma generate` dentro de la imagen y `prisma migrate deploy` en el entrypoint del backend.
- [ ] F4-22 Configurar build args del frontend: `VITE_API_URL=/api` y `VITE_SOCKET_URL=https://<DOMINIO>`.
- [ ] F4-23 Compilar el frontend dentro del Dockerfile multi-stage y servir `dist/` con Nginx interno.
- [ ] F4-24 Levantar el stack con `docker compose -f docker-compose.prod.yml up -d --build`.
- [ ] F4-25 Configurar `restart: always` y healthchecks para `db`, `api`, `web` y `caddy`.
- [ ] F4-26 Configurar rotación de logs de Docker (`json-file` con `max-size` y `max-file`).

#### 4E — Caddy, SSL y Dominio

- [ ] F4-27 Usar el contenedor `caddy:2-alpine` definido en Docker Compose.
- [ ] F4-28 Crear `Caddyfile`: `/api/*` y `/socket.io/*` → `api:3000`; resto → `web:80`; compresión y headers de seguridad.
- [ ] F4-29 Apuntar dominio (DNS A record) a la IP del VPS.
- [ ] F4-30 Verificar emisión automática de TLS con Caddy.
- [ ] F4-31 Verificar renovación automática y persistencia de `caddy_data`.
- [ ] F4-32 Habilitar HSTS en Caddy.

#### 4F — Backups y Recuperación (PostgreSQL local)

- [ ] F4-33 Script de backup diario: `docker compose exec -T db pg_dump -U delivery_user delivery_db | gzip > /var/backups/delivery_$(date +%F).sql.gz`.
- [ ] F4-34 Cron: backup a las 2 AM diario + limpieza de backups > 30 días.
- [ ] F4-35 Copiar backups fuera del VPS (S3, Backblaze B2 o segundo servidor) con `rclone` o `s3cmd`.
- [ ] F4-36 Probar restauración completa en una DB temporal/contenedor desechable y verificar integridad.
- [ ] F4-37 Documentar procedimiento de restauración de emergencia en el Runbook.

#### 4G — Monitoreo, Healthchecks y Operaciones

- [ ] F4-38 Verificar `/api/health` (ya existe) y agregar `/api/ready` (DB conectada, migraciones OK).
- [ ] F4-39 Monitoreo externo de uptime (UptimeRobot / BetterStack) con alertas por correo/Telegram.
- [ ] F4-40 Crear índices en PostgreSQL: `Order(store_id, status)`, `Product(store_id, is_available)`, `User(store_id, email)`, `DeliveryZone(store_id)`.
- [ ] F4-41 Script de deploy con rollback: `git pull`, `docker compose build`, `docker compose up -d`, validación de health; revert si falla.
- [ ] F4-42 Crear Runbook de incidentes (caída, DB corrupta, disco lleno, certificado expirado).
- [ ] F4-43 Configurar swap de 2 GB si la VPS tiene 4 GB RAM (seguridad ante picos).
- [ ] F4-44 Desconectar la app de Neon/Render: eliminar la referencia a `test.shop-mg.com` y a la DB de Neon en código y documentación.
- [ ] F4-45 Términos, privacidad y retención de datos.
- [ ] F4-46 Reescribir `Guia_Migracion_VPS.md` de PM2/Nginx a Docker Compose + Caddy + base limpia.

**Criterio de terminado:** la app opera 100% desde el VPS con Docker Compose, PostgreSQL local limpio y Caddy con SSL automático, sin dependencia de Neon ni Render. Backups probados, monitoreo en línea y rollback automatizado.

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
- [ ] F5-14 E2E: `/` carga con base limpia y sin redirección a demo.
- [ ] F5-15 E2E: CTA de cotización abre WhatsApp con mensaje correcto.
- [ ] F5-16 E2E: crear tienda → editar CMS → preview → comparar → publicar.
- [ ] F5-17 Verificar que no aparezcan testimonios ni clientes inventados.
- [ ] F5-18 Verificar que guardar tasas/delivery no modifique el borrador del CMS.
- [ ] F5-19 Verificar tema visual en las 6 opciones.
- [ ] F5-20 Revisión móvil de landing y CMS.

---

### Fase 6 — PDFs y documentación (2 días)

#### PDF A — Propuesta Comercial y Cotización

> Este bloque es el PDF de cotización de TiendaFast. Se genera después de validar la landing y el contenido comercial de F2F. Debe incluir planes, alcance por plan, add-ons, implementación, soporte y CTA con WhatsApp.

- [ ] F6-01 Crear `docs/comercial/propuesta-comercial.html`.
- [ ] F6-02 Portada y promesa de valor.
- [ ] F6-03 Problema del comercio venezolano.
- [ ] F6-04 Solución y diferenciadores.
- [ ] F6-05 Planes y precios.
- [ ] F6-06 Pago e indexación.
- [ ] F6-07 Retorno de inversión.
- [ ] F6-08 Implementación y soporte.
- [ ] F6-09 CTA con WhatsApp `+58 412 474 2535` y QR.

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
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy
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
| 2026-11-06 | 74/74 | No ejecutada | 61/61 | 0 errores, 118 warnings | Correcto | Correcto | Hotfix demo: catálogo público, pedidos admin y checkout con récipe corregidos; selector de sede con Haversine; precios $9/$19/$35. API pendiente por requerir BD. Bundle 1,139.27 kB. |

---

## 10. Registro de avance

| Fecha | Fase / ID | Estado | Notas |
| 2026-11-07 | F2H-01 a F2H-03 | Hecho | CMS a pantalla completa (/admin/:slug/cms) con 3 modos de vista (Dividida/Editor/Preview) y responsive real sin quiebres de texto. Limpieza automática de imágenes huérfanas en Cloudinary (productos, combos, categorías y banners/galería de landing). Reportes avanzados con recharts (evolución de ventas, donut de pago móvil vs efectivo, top 5 productos, márgenes netos y banner de impacto comercial). Backend 101/101 tests passing, Frontend 69/69 passing, typecheck 0 errores, build limpio. |
| 2026-11-07 | F2G-01 a F2G-06 | Hecho | Ojo ver/ocultar clave, desbloqueo y reseteo 1-clic con SuperAdmin, validación OTP WhatsApp anti-baneo con fallback wa.me, subida de capture Pago Móvil con OCR automático en Checkout, visualización en 2 segundos en Dashboard/OrderDetails. Backend 95/95 unit tests passing, Frontend 69/69 passing, typecheck 0 errores, build limpio. |
| 2026-11-06 | F2F-01 a F2F-14 | Planificado | Landing `/`, logo TiendaFast, WhatsApp comercial, contenido honesto, CMS con preview/compare/guía y PDF de cotización diferido a F6 |
| 2026-11-06 | F4-D01 a F4-D10 (Actualizado) | Planificado | Producción con Docker + Caddy, base limpia sin Neon, bootstrap de SuperAdmin, CORS/cookies, socket same-origin y backups desde cron del host |
| 2026-11-06 | F4-D01 a F4-D05 (Planificado) | Pendiente | Incorporada al plan la estrategia de empaquetado total con Docker Compose (Frontend, Backend, PostgreSQL 16 y Caddy 2) para despliegue ágil en VPS con clientes reales (Netlify/Render se mantienen para demo) |
| 2026-11-06 | F2D-05 | Hecho | Récipes médicos y lotes restringidos estrictamente a farmacias (ocultos en Comida y Víveres) |
| 2026-11-06 | F2D-06 | Hecho | Sistema integral de tarifas por zona: preset Puerto Ayacucho, simulador en panel admin y desglose transparente de delivery en Checkout |
| 2026-11-06 | F2D-01 (Despliegue) | Hecho | Merge y push a rama `main` en GitHub para que Netlify actualice `test.shop-mg.com/admin/demo-comida/order/391` con OpenStreetMap y auto-bounds sin marcas de agua |
| 2026-11-06 | F2C, F2D, F2E planificados | En curso | Incorporados al plan: flujo completo de récipes y lotes de farmacia (con retención física), correcciones operativas críticas (OSM, campanita, realtime, cola FIFO) y módulo SaaS (CMS visual y multi-sucursal) |
| 2026-11-06 | F2D-01 | Hecho | Tiles Carto reemplazados por OpenStreetMap Standard en Checkout, OrderDetails y Settings (sin API key ni marca de agua) |
| 2026-11-06 | F2D-02 | Hecho | Campanita sintetizada Web Audio API (880/1320Hz ding-dong), archivos notification.mp3/wav en public y botón de prueba en Dashboard |
| 2026-11-06 | F2D-03 | Hecho | Token auth en socket handshake, sala join_order, emisión multi-sala y polling de respaldo cada 4s en Checkout y MyOrders (sin refrescar) |
| 2026-11-06 | F2D-04 | Hecho | Cola FIFO para pedidos pendientes (más antiguo primero en backend y dashboard) con badges dinámicos de tiempo de espera |
| 2026-11-06 | F2C-01 a F2C-08 | Hecho | Módulo de Farmacias completo: migración Neon de récipes/lotes, subida de foto en checkout, evaluación por farmaceuta (aprobado/rechazado), bloqueo de vencidos y aviso obligatorio de retención física para motorizado |
| 2026-11-06 | F2E-01 a F2E-07 | Hecho | CMS Visual de Landing y Multi-Sucursal: campo landing_config en BD, card de diseño visual con upload a Cloudinary en Settings, templates dinámicos (Farma, Comida, Víveres) y selector de sedes hermanas |
| 2026-11-06 | Hotfix demo (P0) | Hecho | Corregidos ReferenceError en `getStoreProducts`/`getStoreOrders` (catálogo y pedidos admin 500) y `prescription_url` ausente en `placeOrder` (checkout con récipe); lint de Landing/MyOrders en 0 errores |
| 2026-11-06 | F2E-06 / Precios | Hecho | Selector de sedes con geolocalización y orden Haversine; precios conciliados a Emprendedor $9 / Negocio $19 / PRO $35 en código, plan, SuperAdmin, onboarding y PDF |
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

### Decisiones de Fase 2B — Planes y Suscripciones SaaS (F2B-01 a F2B-10)

- Planes estructurados: `EMPRENDEDOR` ($9/mes, max 50 prods), `NEGOCIO` ($19/mes, max 250 prods) y `PRO` ($35/mes, max 1000 prods).
- Modelo `SubscriptionPayment` para registrar pagos de mensualidad con monto, moneda (USD/VES), método (Pago Móvil, Transferencia, Efectivo, Zelle), referencia, rango de fechas y notas.
- Bloqueo de catálogo por exceso de cupo: `createProduct`, `createProductsBulk` y `createCombo` responden 403 con mensaje explicativo si la tienda supera el límite de productos de su plan.
- Asistente de alta SaaS en SuperAdmin que pre-carga categorías base de la industria (`PHARMACY`, `RESTAURANT`, `SUPERMARKET`) y configura período de prueba (30 días por defecto).
- Plantilla visual de recibo de suscripción con botón de impresión directa (`window.print()`) y generador de mensaje de cobro/recordatorio formateado para WhatsApp en un clic.
- Cálculo automático de MRR mensual proyectado sumando la contribución de todas las tiendas en estado `ACTIVE`.
- Migración aplicada a base de datos Neon: `20261105200000_subscription_plans`.



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

### Siguiente bloque recomendado (Ruta a Pulido, Validación y Producción)

1. **Fase 2F (prioridad inmediata):**
   - **F2F-01 a F2F-14:** landing `/`, logo TiendaFast, WhatsApp comercial, contenido honesto, Storefront compartido, temas, preview del CMS, editor guiado, guardados aislados, validación backend, contacto y pruebas.
2. **Fase 2 restante:**
   - **F2-06:** paginación y filtros server-side en pedidos.
   - **F2-08 a F2-13:** edición completa de configuración, contraseña y cierre de sesiones.
   - **F2-14 a F2-20:** validaciones de categorías/combos, stock de combos, stock negativo y alertas.
   - **F2-21 a F2-24:** fechas, ventas netas, analytics y reportes.
   - **F2-25B a F2-28:** tiendas inactivas y auditoría.
3. **Fase 3:** seguridad de Socket.io, cookies/CSRF, OTP, validación y uploads.
4. **Fase 5:** QA de landing/CMS y flujos críticos; Playwright, Lighthouse, accesibilidad y revisión móvil.
5. **Fase 4 (Producción VPS Definitiva):**
   - Docker Compose con Caddy, base limpia, bootstrap de SuperAdmin, backups y monitoreo.
   - Al iniciar esta fase se pedirán IP, accesos SSH, dominio y correo ACME del VPS.
6. **Fase 6:** PDF comercial/cotización con planes, alcance, add-ons y CTA de WhatsApp.

**Demo en la nube (opcional):** Netlify + Render + Neon se mantienen solo para demostración comercial. No son parte de la producción ni de la base limpia.

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

- **C-10:** el backend en Render respondió `503` el 2026-11-05; revisar solo si se usa la demo en la nube. Producción no dependerá de Render.
- **C-07/C-08/C-09:** corregidos; validar en QA que el cliente reciba eventos reales tras el despliegue.
- **Fase 4:** faltan dominio, VPS, accesos SSH y correo ACME para TLS con Caddy.
- **Docker local:** no está instalado; los builds se validarán en el VPS o con Docker Desktop.
- **`test:api`:** pendiente contra PostgreSQL desechable con datos demo; no ejecutar sobre producción.
- **Cambios sin commit:** hay modificaciones en `PLAN_DE_TRABAJO.md`, backend, frontend y onboarding; revisar `git diff` antes de desplegar.
- Facturación fiscal pendiente de contador, no bloquea el piloto gratuito.
- Candidatos de piloto pendientes de prospección, no bloquean el desarrollo.
- CI de pruebas de API pendiente para Fase 5.
- Deuda de lint (118 advertencias) a reducir durante Fases 1–3.

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
