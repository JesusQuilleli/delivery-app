#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue de Producción en VPS con Docker Compose - TiendaFast
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

echo "🚀 Iniciando despliegue de TiendaFast en producción..."

if [ ! -f .env.production ]; then
    echo "❌ Error: Archivo .env.production no encontrado en la raíz del proyecto."
    echo "Copia .env.production.example como .env.production y define las claves reales."
    exit 1
fi

echo "📦 Levantando y compilando contenedores de Docker..."
docker compose -f docker-compose.prod.yml up -d --build

echo "⏳ Esperando que la base de datos PostgreSQL esté lista..."
until docker compose -f docker-compose.prod.yml exec -T db pg_isready -U delivery_user -d delivery_db > /dev/null 2>&1; do
    echo "   ... esperando PostgreSQL"
    sleep 2
done
echo "✅ Base de datos PostgreSQL saludable."

echo "🔄 Ejecutando migraciones de Prisma en la base de datos..."
docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy

echo "👤 Inicializando SuperAdmin si está configurado..."
docker compose -f docker-compose.prod.yml exec -T api node scripts/create-superadmin.js || true

echo "📊 Estado actual de los contenedores:"
docker compose -f docker-compose.prod.yml ps

echo "=============================================================================="
echo "🎉 ¡Despliegue completado exitosamente!"
echo "Para vincular el WhatsApp oficial (+58 4161804831), ejecuta: ./scripts/vps-whatsapp-pair.sh"
echo "=============================================================================="
