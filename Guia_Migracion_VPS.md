# Guia de Migracion a VPS — Plataforma Delivery Multitenant

---

## 1. Recursos y Costos

La app es **multitenant**: una sola instalacion atiende a todas las tiendas. No se crea una VPS ni un despliegue por farmacia; cada tienda es un registro en la base de datos con su `slug`, usuarios, catalogo, tasas, delivery y datos bancarios.

### Primeros 1-5 clientes (recomendado)

| Recurso | Minimo tecnico | Recomendado |
|---------|----------------|-------------|
| CPU | 2 vCPU | 2 vCPU |
| RAM | 2 GB + swap | 4 GB |
| Disco | 40 GB SSD | 80 GB NVMe |
| Bandwidth | 1 TB/mes | 2 TB/mes |
| SO | Ubuntu 22.04/24.04 LTS | Ubuntu 24.04 LTS |
| Costo estimado | $7-12/mes | $12-24/mes |

**Importante:** con 2 GB la app opera, pero compilar el frontend en la misma VPS puede quedarse sin memoria. Compila en tu maquina/CI y sube `frontend/dist`, o agrega 2 GB de swap. Con 4 GB puedes compilar, correr Node + PostgreSQL + Nginx y hacer backups sin problema.

### 6-20 tiendas (hasta ~100 pedidos/dia)

| Recurso | Recomendado |
|---------|-------------|
| CPU | 4 vCPU |
| RAM | 8 GB |
| Disco | 120-160 GB NVMe |
| Bandwidth | 3 TB/mes |
| Costo estimado | $24-50/mes |

### 20-50 tiendas

| Recurso | Recomendado |
|---------|-------------|
| CPU | 8 vCPU |
| RAM | 16 GB |
| Disco | 200 GB NVMe |
| Base de datos | PostgreSQL gestionado (Neon/RDS) |
| Costo estimado | $80-150/mes |

### Proveedores Recomendados

| Proveedor | Ventaja | Desde |
|-----------|---------|-------|
| Hetzner | Mejor relacion precio/calidad, EU | $4.50/mes (2 vCPU, 4 GB) |
| DigitalOcean | Facil de usar, buena documentacion | $24/mes (2 vCPU, 4 GB) |
| Vultr | Globales, buen rendimiento | $24/mes (2 vCPU, 4 GB) |
| Contabo | Mucho disco y RAM barato | $7/mes (4 vCPU, 8 GB) |
| Oracle Cloud | Gratis tier (limitado) | $0 (1-4 ARM) |

**Recomendacion:** Hetzner CX22/CX32 o Contabo VPS S para empezar. Si el publico esta en Venezuela, prioriza un proveedor con buena latencia hacia Miami/US-East (DigitalOcean/Vultr) o usa Cloudflare delante.

### Costos mensuales tipicos (primeros clientes)

| Concepto | Costo estimado |
|---|---:|
| VPS 2 vCPU / 4 GB | $12-24 |
| Dominio `.com` | $1-2 |
| SSL Let's Encrypt | $0 |
| Cloudinary (imagenes) | $0 (free tier) |
| Resend (correos OTP) | $0-20 |
| Backups externos (S3/Backblaze) | $0-5 |
| **Total** | **$15-50/mes** |

Con un solo cliente de $19/mes ya cubres la infraestructura basica; con 3 clientes hay margen para soporte y publicidad.

---

## 2. Stack del Servidor

```
Internet
    │
    ▼
┌─────────────────────────────────────┐
│            Nginx (Reverse Proxy)     │
│  - SSL/TLS (Let's Encrypt)          │
│  - Proxy /api/* → Backend (3000)    │
│  - Proxy /* → Frontend (estatico)   │
│  - Gzip compression                 │
│  - Rate limiting basico             │
│  - Headers de seguridad             │
└──────────┬──────────┬───────────────┘
           │          │
    ┌──────▼──┐  ┌────▼──────────┐
    │ Frontend│  │   Backend     │
    │ (Estatico│  │  Node.js     │
    │  dist/) │  │  Puerto 3000  │
    └─────────┘  │  + Socket.io  │
                 └───────┬───────┘
                         │
                 ┌───────▼───────┐
                 │  PostgreSQL   │
                 │  Puerto 5432  │
                 └───────────────┘
```

---

## 3. Pasos de Migracion

### Paso 1: Preparar la VPS

```bash
# Conectar via SSH
ssh root@TU_IP_VPS

# Actualizar sistema
apt update && apt upgrade -y

# Instalar dependencias
apt install -y curl git ufw nginx certbot python3-certbot-nginx

# Configurar firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### Paso 2: Instalar Node.js y PostgreSQL

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar
node -v  # v20.x.x
npm -v   # 10.x.x

# PostgreSQL
apt install -y postgresql postgresql-contrib

# Iniciar y habilitar
systemctl start postgresql
systemctl enable postgresql
```

### Paso 3: Configurar Base de Datos

```bash
# Entrar a PostgreSQL
su - postgres
psql

# Crear usuario y base de datos
CREATE USER delivery_user WITH PASSWORD 'TU_PASSWORD_SEGURO';
CREATE DATABASE delivery_db OWNER delivery_user;
GRANT ALL PRIVILEGES ON DATABASE delivery_db TO delivery_user;
\q

# Salir de postgres user
exit
```

### Paso 4: Clonar el Proyecto

```bash
# Crear directorio
mkdir -p /var/www
cd /var/www

# Clonar repo
git clone https://github.com/JesusQuilleli/delivery-app.git
cd delivery-app
```

### Paso 5: Configurar Backend

```bash
cd backend

# Instalar dependencias (reproducible)
npm ci

# Crear archivo .env
cat > .env << 'EOF'
PORT=3000
DATABASE_URL="postgresql://delivery_user:TU_PASSWORD_SEGURO@localhost:5432/delivery_db"
JWT_SECRET="genera_un_secreto_de_128_caracteres_aqui"
RESEND_API_KEY="tu_clave_resend"
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"
ALLOWED_ORIGINS="https://tudominio.com,https://www.tudominio.com"
EOF

# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones a la DB (NO usar db push en produccion)
npx prisma migrate deploy

# Solo en desarrollo/demo: sembrar datos iniciales
# npm run db:seed

# Test: el backend debe funcionar
npm start
```

### Paso 6: Configurar Frontend

```bash
cd /var/www/delivery-app/frontend

# Instalar dependencias (reproducible)
npm ci

# Crear archivo de produccion
cat > .env.production << 'EOF'
VITE_API_URL=https://tudominio.com/api
VITE_SOCKET_URL=https://tudominio.com
EOF

# Build de produccion
npm run build

# El resultado queda en frontend/dist/
```

### Paso 7: Configurar Nginx

```bash
# Crear configuracion del sitio
cat > /etc/nginx/sites-available/delivery << 'EOF'
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Frontend estatico
    location / {
        root /var/www/delivery-app/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io WebSocket
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Compresion Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;
    gzip_vary on;

    # Seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Cache de assets estaticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/delivery-app/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Habilitar el sitio
ln -s /etc/nginx/sites-available/delivery /etc/nginx/sites-enabled/

# Eliminar configuracion default
rm /etc/nginx/sites-enabled/default

# Test de configuracion
nginx -t

# Recargar Nginx
systemctl reload nginx
```

### Paso 8: SSL con Let's Encrypt

```bash
# Obtener certificado
certbot --nginx -d tudominio.com -d www.tudominio.com

# Auto-renovacion (ya viene configurada)
certbot renew --dry-run
```

### Paso 9: Configurar PM2 (Proceso Manager)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar backend con PM2
cd /var/www/delivery-app/backend
pm2 start server.js --name "delivery-api"

# Configurar auto-reinicio al reiniciar servidor
pm2 startup
pm2 save

# Comandos utiles
pm2 status              # Ver procesos
pm2 logs delivery-api   # Ver logs
pm2 restart delivery-api # Reiniciar
pm2 stop delivery-api    # Detener
```

### Paso 10: Actualizar Frontend en el Repo

```bash
# En tu maquina local, actualizar .env.production
# frontend/.env.production:
# VITE_API_URL=https://tudominio.com/api
# VITE_SOCKET_URL=https://tudominio.com

# Push a GitHub
git add frontend/.env.production
git commit -m "chore: apuntar API a VPS"
git push
```

---

## 4. Comandos de Mantenimiento

### Actualizar la app
```bash
cd /var/www/delivery-app
git pull origin main

# Backend
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
pm2 restart delivery-api

# Frontend (o compilar en CI y subir dist/)
cd ../frontend
npm ci
npm run build
```

### Ver logs
```bash
pm2 logs delivery-api --lines 50
journalctl -u nginx --since "1 hour ago"
```

### Backup de base de datos
```bash
# Backup manual
pg_dump -U delivery_user delivery_db > backup_$(date +%Y%m%d).sql

# Backup automatico (cron cada 24h)
crontab -e
# Agregar:
0 2 * * * pg_dump -U delivery_user delivery_db | gzip > /var/backups/delivery_$(date +\%Y\%m\%d).sql.gz
```

### Monitoreo
```bash
# Estado del servidor
htop
df -h
free -m

# Estado de servicios
systemctl status nginx
pm2 status
systemctl status postgresql
```

---

## 5. Seguridad Adicional

### Fail2Ban (proteccion SSH)
```bash
apt install -y fail2ban
systemctl enable fail2ban
```

### Actualizaciones automaticas de seguridad
```bash
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### Limpiar backups viejos
```bash
# Agregar a cron
0 3 * * 0 find /var/backups -name "delivery_*" -mtime +30 -delete
```

---

## 6. Verificar que Todo Funciona

```bash
# 1. Backend responde
curl https://tudominio.com/api/
# Debe retornar: "API Delivery Frictionless esta corriendo..."

# 2. Frontend carga
curl -I https://tudominio.com/
# Debe retornar: HTTP/2 200

# 3. WebSocket conecta
# Abrir https://tudominio.com/admin-login en el navegador
# Login como admin → debe cargar el dashboard

# 4. Pedidos en tiempo real
# Abrir https://tudominio.com/farmacia-ayacucho en otro navegador
# Hacer un pedido → el dashboard debe sonar y mostrar el pedido
```

---

## 7. Configurar cada tienda (onboarding)

**No se despliega una app por tienda.** Todas las tiendas viven en la misma app y base de datos:

- Catalogo publico: `https://tudominio.com/<slug>` (ej. `https://tudominio.com/farmacia-ayacucho`).
- Panel del negocio: `https://tudominio.com/admin-login` (usuario y contraseña unicos del administrador).
- Superadmin: `https://tudominio.com/superadmin`.

### Pasos para dar de alta una farmacia

1. Entrar como superadmin y crear la tienda con nombre, `slug` unico, moneda base, industria y credenciales del administrador.
2. Entrar como administrador y completar **Settings**:
   - Nombre y ubicacion GPS de la sucursal.
   - Moneda base (USD/VES/COP) y tasas (BCV o manuales).
   - Delivery: tarifa plana y zonas por rango de distancia.
   - Datos de pago: banco, codigo, telefono, cedula/RIF, titular y nota.
3. Cargar categorias y catalogo (productos, precios, stock, imagenes en Cloudinary).
4. Crear motorizados en **Drivers**.
5. Probar el flujo completo con un correo de prueba: agendar -> confirmar direccion -> pedido -> dashboard en tiempo real.
6. Entregar al dueno: URL publica, URL del panel, credenciales y guia rapida de 1 pagina.

### Dominios

- **Recomendado para empezar:** un solo dominio con rutas por `slug` (lo que ya soporta la app).
- Subdominios por tienda (`farmacia.tudominio.com`) requieren DNS wildcard, Nginx con `server_name *.tudominio.com` y que el backend resuelva el `slug` desde el `Host`. **No esta implementado todavia**; no lo prometas a clientes sin desarrollarlo.
- Dominio propio (plan Pro) requiere el mismo trabajo de resolucion por host o un proxy inverso por tienda.

### Aislamiento y limitaciones actuales

- Todos los datos de catalogo, pedidos, tasas, delivery y banco estan filtrados por `store_id`.
- **Identidad de clientes por tienda (resuelto en F1-29–F1-34):** un mismo correo y telefono pueden registrarse en tiendas distintas. El único es compuesto por `store_id`; dentro de una misma tienda el telefono no puede repetirse. Migracion `20261103022000_user_identity_per_store`.
- El usuario de administracion (`username`) sigue siendo unico global; el telefono del admin ya no impide crear otra tienda.
- No hay planes/suscripciones automaticas ni limites aplicados por el sistema (Fase 2B). Para los primeros clientes, cobra y controla limites manualmente.
- No hay facturacion fiscal venezolana; confirma con un contador antes de prometerla.

---

## 8. Pruebas con multiples usuarios

### Preparacion

- Usa un entorno de staging con una copia de la base de datos (rama de Neon o `pg_dump`/`pg_restore`).
- Crea al menos: 2 tiendas, 3 clientes por tienda, 1 administrador por tienda, 1 superadmin y 2 motorizados.
- Prueba en 2 navegadores distintos + 2 celulares reales (no solo incognito).

### Matriz minima

| Caso | Resultado esperado |
|---|---|
| Dos clientes compran la ultima unidad a la vez | Solo uno recibe 200; el otro recibe 400 de stock |
| Cliente A intenta ver pedido de cliente B | 403 |
| Admin A consulta pedidos/clientes de tienda B | 403 |
| Mismo correo y telefono compra en tienda A y B | Permitido; cada compra queda asociada a su tienda y sus pedidos no se mezclan |
| Pedido en efectivo | Aparece en dashboard en < 2 s |
| Pedido por Pago Movil con referencia invalida | 400 y mensaje claro |
| Cliente cancela `AWAITING_PAYMENT` | Estado `CANCELLED` |
| Tienda desactivada | Catalogo y checkout bloqueados |
| Zona de delivery coincide | Cobra la tarifa de la zona, no la plana |
| Reinicio de la VPS con pedidos activos | La app vuelve y los pedidos siguen en la DB |

### Carga

- Usa k6 o Artillery contra staging, no contra produccion.
- Escenario inicial: 50 usuarios virtuales navegando 5 min + 10 pedidos/minuto.
- Criterios: 0 errores 5xx, p95 de API < 500 ms, stock sin negativos, sin pedidos duplicados.
- Repite con 100 y 200 usuarios para conocer el limite antes de la temporada alta.

### Cierre

- Cada bug encontrado se registra en `PLAN_DE_TRABAJO.md` y se prioriza.
- No se onboardea un cliente nuevo hasta pasar la matriz completa en staging.

---

## 9. Checklist de produccion

- [ ] `NODE_ENV=production`, `JWT_SECRET` de 128 caracteres, `.env` fuera de git.
- [ ] `npx prisma migrate deploy` (nunca `db push`) y backup antes de cada migracion.
- [ ] HTTPS con renovacion automatica, HSTS, CORS limitado al dominio real.
- [ ] Rate limiting activo en auth, pedidos y admin.
- [ ] PM2 con reinicio automatico y rotacion de logs (`pm2 install pm2-logrotate`).
- [ ] 2 GB de swap si la VPS tiene 2 GB de RAM; build del frontend fuera del servidor.
- [ ] Backup diario de PostgreSQL + copia externa (S3/Backblaze) + prueba de restauracion mensual.
- [ ] Monitoreo de uptime (UptimeRobot/BetterStack) y alertas por correo/Telegram.
- [ ] Cloudinary configurado con limites de tamano y formatos.
- [ ] Dominio de Resend verificado (SPF/DKIM) para que los OTP no caigan en spam.
- [ ] Cloudflare delante del dominio (opcional pero recomendado).
- [ ] Terminos, privacidad y tratamiento de datos redactados.
- [ ] Matriz de pruebas multi-usuario aprobada.
- [ ] Stock restaurado al cancelar pedidos (F2-25) antes de operar inventario real.

---

## 10. Esquema de negocio para vender

### Planes (alineados con `PLAN_DE_TRABAJO.md`)

| Plan | Precio | Incluye |
|---|---:|---|
| Implementacion | $90 unico | Configuracion, catalogo, BCV, capacitacion y salida en vivo |
| Emprendedor | $9/mes | 1 tienda, 300 productos, 1 administrador |
| Negocio | $19/mes | Productos ilimitados, combos, 3 administradores, reportes |
| Pro | $35/mes | Dominio propio, administradores ilimitados, capacitacion 1:1, soporte prioritario |
| Anualidad | 10 meses por 12 | Implementacion gratis y precio congelado |
| Comision por pedido | 0% | Sin porcentaje sobre ventas |

- Cobro en bolivares a tasa BCV del dia: Pago Movil, transferencia, efectivo, Zelle o USDT.
- Piloto: 60 dias gratis, sin implementacion, con 50% de descuento por 3 meses al continuar.
- Revision de precios trimestral con aviso de 30 dias; sin contratos largos.

### Margen con la infraestructura recomendada

| Clientes | Ingreso mensual | Infraestructura | Margen bruto aproximado |
|---|---:|---:|---:|
| 1 | $9-35 | $15-50 | Break-even |
| 3 | $27-105 | $15-50 | $0-90 |
| 5 | $45-175 | $24-50 | $20-150 |
| 10 | $90-350 | $24-50 | $40-300 |

Los primeros clientes pagan la VPS y el dominio. El costo real por tienda adicional es marginal (almacenamiento y correos). La implementacion de $90 cubre el tiempo de onboarding y capacitacion.

### Como vender los primeros 3-5 clientes sin modulo de suscripciones

1. Cobra la implementacion y el primer mes por transferencia/Pago Movil.
2. Lleva el control de plan, fecha de pago y limites en una hoja de calculo.
3. Aplica los limites por politica (no por software) hasta implementar Fase 2B.
4. Onboardea una tienda a la vez y espera 1 semana de estabilidad antes de la siguiente.
5. Pide retroalimentacion semanal y usa las metricas para el caso de exito.

### Bloqueantes antes de escalar a 10+ clientes

- Planes, limites y facturacion automatica (Fase 2B).
- Restauracion de stock al cancelar (F2-25).
- Aprobacion/rechazo de pagos en el panel (F2-01–F2-05).
- Backups probados y monitoreo (F4).
- Facturacion fiscal y terminos legales.

---

*Guia generada para Plataforma Delivery Multitenant v2.0*
