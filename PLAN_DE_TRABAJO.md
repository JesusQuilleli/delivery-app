# Plan de trabajo — TiendaFast

> Documento vivo. Actualizar después de cada tarea.
> Si se pierde la sesión: leer este archivo, revisar `git status` y `git log`, y continuar desde la primera casilla sin marcar.

- **Última actualización:** 2026-11-01
- **Rama actual:** `feature/security-hardening`
- **Rama principal:** `main`
- **Estado general:** F1-02 completada; siguiente F1-03
- **Zona del piloto:** Puerto Ayacucho, Amazonas
- **Segmento:** farmacias independientes y cadenas pequeñas

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

Plataforma de delivery y gestión de inventario multitenant para negocios venezolanos. El piloto se enfoca en farmacias de Puerto Ayacucho.

- **Frontend:** React 19 + TypeScript + Vite + Tailwind.
- **Backend:** Node.js + Express + Prisma + PostgreSQL + Socket.io.
- **Multimedia:** Cloudinary.
- **Correo:** Resend.
- **Autenticación:** JWT en cookie httpOnly, OTP por correo para clientes y usuario/contraseña para administradores.
- **Producción actual documentada:** `https://test.shop-mg.com` con API en Render.
- **Producción objetivo:** VPS propio con Nginx, frontend y API en el mismo dominio.

### Estado real del repositorio

- El núcleo funcional existe: catálogo, carrito, checkout, OTP, pedidos, dashboard, inventario, combos, motorizados, historial y SuperAdmin.
- La rama `feature/security-hardening` tiene mejoras sin commitear: transiciones de estado, validaciones Zod de inventario y pruebas iniciales.
- No existen migraciones Prisma; se usa `db push`.
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
| Producción | VPS con Nginx, mismo dominio para frontend y API |
| Clientes | Una cuenta por tienda; mismo correo puede existir en varias tiendas |
| Ventas y soporte | El fundador |
| Facturación fiscal | Se define con contador antes del primer cobro |
| Recetas y lotes | Se validan con farmacias antes de construir |

---

## 4. Esquema de negocio

### 4.1 Cliente ideal

Farmacia independiente o cadena pequeña de Puerto Ayacucho, con 1–3 sucursales, 500–3.000 productos, pedidos por WhatsApp y delivery propio o tercerizado. Dueño o gerente accesible.

### 4.2 Precios

| Plan | Precio | Límites |
|---|---:|---|
| Implementación | $90 único | Configuración, catálogo, BCV, capacitación y salida en vivo |
| Emprendedor | $9/mes | 1 tienda, 300 productos, 1 administrador |
| Negocio | $19/mes | Productos ilimitados, combos, 3 administradores, reportes |
| Pro | $35/mes | Dominio propio, administradores ilimitados, capacitación 1:1, soporte prioritario |
| Anualidad | 10 meses por 12 | Implementación gratis y precio congelado |
| Comisión por pedido | 0% | Sin porcentaje sobre ventas |

Cobro en bolívares a tasa BCV del día. Métodos: Pago Móvil, transferencia, efectivo, Zelle o USDT. Revisión trimestral con aviso de 30 días. Sin contratos largos; cancelación con 30 días de aviso.

### 4.3 Piloto en Puerto Ayacucho

- 60 días gratis, sin implementación.
- Capacitación y soporte directo del fundador.
- Tres sesiones de retroalimentación.
- Permiso para usar métricas reales de forma anonimizada.
- Continuidad con 50% de descuento por 3 meses.

Meta: lista de 15–20 farmacias, 8 contactos efectivos, 5 demos y 3 acuerdos firmados.

Canales: visitas presenciales, referidos de distribuidores, visitadores médicos y motorizados, WhatsApp e Instagram local, grupos de dueños de farmacias y tienda demo.

Criterios de selección: dueño o gerente con decisión, pedidos por WhatsApp, delivery, catálogo exportable y disposición a dar retroalimentación semanal.

### 4.4 Unit economics ilustrativos

Supuesto: 30 clientes (15 Emprendedor, 10 Negocio, 5 Pro) y 2 implementaciones al mes.

| Concepto | Mensual |
|---|---:|
| MRR | $500 |
| Implementaciones | $180 |
| Infraestructura, correo y respaldo | $50–80 |
| Soporte (20 h) | $100 |
| Comisiones de cobro (~2%) | $14 |
| Margen bruto estimado | $480–500 |
| Punto de equilibrio | 10–12 clientes |

Escenarios de planificación, no proyecciones garantizadas. Puerto Ayacucho sirve para validar, no para escalar; el crecimiento posterior requiere otra ciudad.

### 4.5 Fiscalidad

- Consultar contador en la semana 1 sobre IVA, IGTF, facturación digital y tratamiento de servicios en USD/BCV.
- El piloto es gratuito: no se factura hasta tener la estructura definida.
- No lanzar el cobro público sin resolución fiscal.

### 4.6 Requisitos específicos de farmacia

El esquema actual no tiene recetas, lotes ni vencimientos.

| Requisito | Situación | Decisión |
|---|---|---|
| Receta médica | No implementado | Validar con 5 farmacias |
| Lotes y vencimientos | No implementado | Validar con 5 farmacias |
| Medicamentos controlados | No implementado | Excluir del piloto |
| Factura fiscal con IVA | No implementado | Definir con contador |
| Alertas de vencimiento | No implementado | Evaluar Fase 2C |

Si 3 o más farmacias exigen recetas o lotes, agregar la Fase 2C (3–5 días).

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
| P-02 | Sin migraciones, CI, healthchecks ni backups | Crítica |
| P-03 | Tiendas inactivas siguen operando | Alta |
| P-04 | Sin pruebas E2E ni pruebas de carga | Media |
| P-05 | Sin zonas ni tarifas de delivery configurables | Alta |
| P-06 | Lint con 88 advertencias: `any`, efectos con setState y exports de UI | Media |
| P-07 | Bundle principal de ~1 MB sin code splitting | Media |
| P-08 | Las pruebas de API requieren esperar a que el servidor esté listo | Baja |
| P-09 | Resend rechaza correos `example.com`; las pruebas usan el código de la DB | Baja |

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
- [ ] F1-03 Derivar tienda, moneda y configuración desde el `slug`.
- [ ] F1-04 Eliminar la dependencia de `current_store_id` en `localStorage`.
- [ ] F1-05 Verificar checkout directo sin visitar el catálogo.
- [ ] F1-06 Corregir redirección de `/mis-pedidos` para conservar el slug.

#### Carrito y stock

- [ ] F1-07 Aislar el carrito por tienda.
- [ ] F1-08 Limpiar o confirmar carrito al cambiar de tienda.
- [ ] F1-09 Validar disponibilidad y stock antes de agregar o confirmar.
- [ ] F1-10 Impedir cantidades superiores al stock.
- [ ] F1-11 Descontar o reservar stock al crear el pedido en una transacción.
- [ ] F1-12 Validar y descontar stock de componentes de combos.
- [ ] F1-13 Rechazar pedidos con stock insuficiente.

#### Dinero y monedas

- [ ] F1-14 Migrar precios y totales de `Float` a `Decimal` o centavos.
- [ ] F1-15 Agregar al pedido: moneda, tasas, subtotal, delivery y total.
- [ ] F1-16 Guardar snapshot de tasas para el historial.
- [ ] F1-17 Corregir conversiones cuando la tienda base es VES o COP.
- [ ] F1-18 Corregir formato de precios en COP.
- [ ] F1-19 Integrar BCV desde backend con caché y endpoint de sincronización.
- [ ] F1-20 Permitir override manual de tasas.
- [ ] F1-21 Configurar zonas y tarifas de delivery.

#### Pagos y checkout

- [ ] F1-22 Agregar datos bancarios por tienda al esquema.
- [ ] F1-23 Eliminar datos bancarios hardcodeados de `Checkout.tsx`.
- [ ] F1-24 Mostrar datos bancarios reales de la tienda.
- [ ] F1-25 Validar referencia de Pago Móvil.
- [ ] F1-26 Permitir cancelar pedidos `AWAITING_PAYMENT`.
- [ ] F1-27 Bloquear compras en tiendas inactivas.
- [ ] F1-28 Evitar que un administrador compre como cliente.

#### Identidad de clientes por tienda

- [ ] F1-29 Quitar `@unique` global de `User.email` y `User.phone`.
- [ ] F1-30 Agregar `@@unique([store_id, email])` y `@@unique([store_id, phone])`.
- [ ] F1-31 Actualizar `checkEmail` y `verifyOtp` para buscar por `store_id + email`.
- [ ] F1-32 Actualizar consultas que usan `findUnique({ where: { email } })`.
- [ ] F1-33 Crear migración Prisma con respaldo previo.
- [ ] F1-34 Probar que un mismo correo compra en dos tiendas sin mezclar datos.

**Criterio de terminado:** compra segura, sin sobreventa, precios correctos y cuentas aisladas por tienda.

---

### Fase 2 — Bugs críticos del administrador (4 días)

#### Pagos y pedidos

- [ ] F2-01 Crear pestaña o filtro real para `AWAITING_PAYMENT`.
- [ ] F2-02 Aprobar pago: `AWAITING_PAYMENT` → `PENDING`.
- [ ] F2-03 Rechazar pago: `AWAITING_PAYMENT` → `CANCELLED`.
- [ ] F2-04 Soportar aprobación/rechazo por lote.
- [ ] F2-05 Corregir acciones que aceptan pedidos sin pago aprobado.
- [ ] F2-06 Agregar paginación y filtros server-side en pedidos.
- [ ] F2-07 Validar pertenencia de tienda en `markOrderViewed`.

#### Configuración de tienda

- [ ] F2-08 Permitir que SuperAdmin edite configuración.
- [ ] F2-09 Editar industria, tema, nombre, coordenadas y WhatsApp.
- [ ] F2-10 Editar datos bancarios y métodos de pago.
- [ ] F2-11 Implementar cambio de contraseña de administrador.
- [ ] F2-12 Implementar cierre de sesiones.
- [ ] F2-13 Quitar o completar secciones "en desarrollo" de `Settings.tsx`.

#### Inventario y combos

- [ ] F2-14 Validar que `category_id` pertenezca a la tienda.
- [ ] F2-15 Validar que los componentes de un combo pertenezcan a la tienda.
- [ ] F2-16 Calcular stock de combo como mínimo de `stock_componente / cantidad`.
- [ ] F2-17 Mostrar stock de combo en catálogo y checkout.
- [ ] F2-18 Evitar stock negativo.
- [ ] F2-19 Manejar eliminación de productos usados en combos.
- [ ] F2-20 Agregar alertas de bajo stock.

#### Historial y analytics

- [ ] F2-21 Corregir filtros de fecha según zona horaria.
- [ ] F2-22 Calcular ventas netas y totales coherentes.
- [ ] F2-23 Corregir analytics con filtros aplicados.
- [ ] F2-24 Verificar exportación e impresión de reportes.

#### Tiendas inactivas

- [ ] F2-25 Bloquear catálogo y checkout de tiendas inactivas.
- [ ] F2-26 Bloquear recepción de pedidos en tiendas inactivas.
- [ ] F2-27 Definir acceso del admin de tienda inactiva.
- [ ] F2-28 Auditar activaciones y desactivaciones.

**Criterio de terminado:** operación completa sin estados inconsistentes ni accesos cruzados.

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

### Fase 4 — Producción en VPS (3 días)

- [ ] F4-01 Crear migraciones Prisma reales.
- [ ] F4-02 Dejar de usar `db push` en producción.
- [ ] F4-03 Preparar VPS: Node 20, PostgreSQL, Nginx, PM2, UFW, Fail2Ban.
- [ ] F4-04 Configurar frontend y API en el mismo dominio.
- [ ] F4-05 SSL con Let's Encrypt y renovación automática.
- [ ] F4-06 Configurar `NODE_ENV=production` y `ALLOWED_ORIGINS`.
- [ ] F4-07 Backups diarios de PostgreSQL.
- [ ] F4-08 Copiar backups fuera del VPS.
- [ ] F4-09 Probar restauración.
- [ ] F4-10 Crear `/health` y `/ready`.
- [ ] F4-11 Logs con rotación.
- [ ] F4-12 Monitoreo externo y alertas.
- [ ] F4-13 Pipeline de despliegue y rollback.
- [ ] F4-14 Índices de base de datos.
- [ ] F4-15 Runbook de incidentes.
- [ ] F4-16 Términos, privacidad y retención de datos.

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

- [ ] F6-17 Crear `scripts/generate-pdfs.ps1`.
- [ ] F6-18 Generar PDFs con Edge headless.
- [ ] F6-19 Revisar ortografía, precios y claims.
- [ ] F6-20 Verificar que no se prometan funciones no implementadas.
- [ ] F6-21 Actualizar `README.md` y documentación técnica.
- [ ] F6-22 Archivar PDFs antiguos.

---

## 7. Puertas de lanzamiento

- 3 farmacias usando el sistema durante 60 días.
- Pedidos reales sin errores críticos.
- Stock y vencimientos bajo control, si se implementan.
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
| 2026-11-01 | 23/23 | 63/63 | 35/35 | 0 errores, 88 warnings | Correcto | Correcto | Fase 0, F1-01 y F1-02 completadas. Bundle ~1 MB. |

---

## 10. Registro de avance

| Fecha | Fase / ID | Estado | Notas |
|---|---|---|---|
| 2026-11-01 | Plan creado | Hecho | Decisiones comerciales y técnicas cerradas |
| 2026-11-01 | Fase 0 | Hecho | Línea base `c7c0377`, `.env.example`, scripts y CI |
| 2026-11-01 | Fase 0 pruebas | Hecho | Backend 86/86, frontend 32/32, lint sin errores, build OK |
| 2026-11-01 | F1-01 | Hecho | Refresh al montar, `isInitializing` y espera en `ProtectedRoute`; no cierra sesión por errores de red |
| 2026-11-01 | F1-02 | Hecho | Solo 401 limpia sesión; red y 500 conservan usuario; 2 pruebas nuevas |
| 2026-11-01 | F1-03 | Pendiente | Derivar tienda, moneda y configuración desde el slug |
|  |  |  |  |

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

**Fase 0, F1-01 y F1-02 completadas.** Continuar con **F1-03**.

### Primeros pasos de F1-03

1. Rastrear todos los usos de `current_store_id`, `localStorage` y `slug` en el frontend.
2. Revisar cómo `Layout`, `Catalog`, `Checkout`, `MyOrders` y las plantillas obtienen la tienda.
3. Hacer que la tienda, moneda y configuración se derivan de la respuesta de `/stores/:slug/products`.
4. Eliminar la dependencia de `current_store_id` en `localStorage`.
5. Probar checkout directo con el slug y `/mis-pedidos` conservando el slug.
6. Ejecutar `npm run typecheck`, `npm test` y `npm run lint`; registrar y commitear `F1-03`.

### Cómo ejecutar las pruebas de API

```powershell
$p = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "backend" -PassThru
# Esperar hasta que http://localhost:3000/api/stores/demo-farmacia/products?limit=1 responda 200
npm run test:api
Stop-Process -Id $p.Id -Force
```

No ejecutar `npm run db:seed` sobre la base actual: borra pedidos, productos y categorías.

### Bloqueos actuales

- Ninguno técnico.
- Facturación fiscal pendiente de contador, no bloquea el piloto gratuito.
- Candidatos de piloto pendientes de prospección, no bloquean el desarrollo.
- CI de pruebas de API pendiente para Fase 5.
- Deuda de lint (89 advertencias) a reducir durante Fases 1–3.

---

## 13. Riesgos

| Riesgo | Mitigación |
|---|---|
| Mercado pequeño en Puerto Ayacucho | Validar y luego expandir a otra ciudad |
| Conectividad irregular | Optimizar imágenes, VPS en US East, evitar dependencias pesadas |
| Farmacias exigen recetas o lotes | Discovery temprano y Fase 2C condicional |
| Facturación fiscal incierta | Contador en semana 1; piloto gratuito |
| Un solo desarrollador | Documentar, commits pequeños y este registro |
| Alcance creciente | Fases cerradas y criterios de terminado |
| Cobro manual | Límite de clientes hasta automatizar |
