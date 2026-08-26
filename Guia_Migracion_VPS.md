# Guia de Migracion a VPS — Plataforma Delivery Multitenant

---

## 1. Recursos Recomendados

### Fase Actual (1-10 tiendas activas)

| Recurso | Minimo | Recomendado |
|---------|--------|-------------|
| CPU | 2 vCPU | 2 vCPU |
| RAM | 2 GB | 4 GB |
| Disco | 20 GB SSD | 40 GB SSD |
| Bandwidth | 1 TB/mes | 2 TB/mes |
| SO | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Costo estimado | $10-15/mes | $20-25/mes |

### Fase de Crecimiento (10-50 tiendas)

| Recurso | Minimo | Recomendado |
|---------|--------|-------------|
| CPU | 4 vCPU | 4 vCPU |
| RAM | 8 GB | 8 GB |
| Disco | 80 GB SSD | 100 GB SSD |
| Bandwidth | 3 TB/mes | 5 TB/mes |
| Costo estimado | $40-50/mes | $60-80/mes |

### Proveedores Recomendados

| Proveedor | Ventaja | Desde |
|-----------|---------|-------|
| Hetzner | Mejor relacion precio/calidad, EU | $4.50/mes (2 vCPU, 4 GB) |
| DigitalOcean | Facil de usar, buena documentacion | $24/mes (2 vCPU, 4 GB) |
| Vultr | Globales, buen rendimiento | $24/mes (2 vCPU, 4 GB) |
| Contabo | Mucho disco y RAM barato | $7/mes (4 vCPU, 8 GB) |
| Oracle Cloud | Gratis tier (limitado) | $0 (1-4 ARM) |

**Recomendacion:** Hetzner CX22 ($4.50/mes) o Contabo VPS S ($7/mes) para empezar.

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

# Instalar dependencias
npm install

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

# Aplicar migraciones a la DB
npx prisma db push

# (Opcional) Sembrar datos iniciales
npm run db:seed

# Test: el backend deve funcionar
npm start
```

### Paso 6: Configurar Frontend

```bash
cd /var/www/delivery-app/frontend

# Instalar dependencias
npm install

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
npm install
npx prisma generate
npx prisma db push
pm2 restart delivery-api

# Frontend
cd ../frontend
npm install
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

*Guia generada para Plataforma Delivery Multitenant v2.0*
