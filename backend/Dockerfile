# --- Stage 1: Build y dependencias nativas ---
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Instalar dependencias del sistema para compilación de módulos nativos (bcrypt) y OpenSSL para Prisma
RUN apt-get update -y && \
    apt-get install -y openssl python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

# --- Stage 2: Imagen final de Producción ---
FROM node:20-bookworm-slim AS production

WORKDIR /app

# OpenSSL requerido por el engine binario de Prisma en Debian
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Crear usuario y grupo seguro sin privilegios root
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/bash -m appuser

# Copiar dependencias y cliente generado
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Copiar código fuente del backend
COPY server.js ./
COPY prismaClient.js ./
COPY controllers ./controllers
COPY routes ./routes
COPY middleware ./middleware
COPY config ./config
COPY validations ./validations
COPY services ./services
COPY utils ./utils
COPY scripts ./scripts

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

# Al iniciar en producción, ejecuta migraciones pendientes de Prisma y arranca Express
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
