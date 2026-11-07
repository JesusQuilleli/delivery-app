#!/usr/bin/env bash
# ==============================================================================
# Script de Vinculación de WhatsApp Oficial (+58 4161804831) vía Evolution API
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

if [ ! -f .env.production ]; then
    echo "❌ Error: Archivo .env.production requerido."
    exit 1
fi

# Cargar variables del entorno
set -a
source .env.production
set +a

INSTANCE_NAME="tiendafast"
EVO_URL="http://127.0.0.1:8080"

echo "📱 ========================================================"
echo "   Vinculando WhatsApp Oficial TiendaFast: +58 4161804831"
echo "============================================================"

# 1. Crear instancia si no existe
echo "1️⃣ Creando/Verificando instancia '${INSTANCE_NAME}' en Evolution API..."
curl -s -X POST "${EVO_URL}/instance/create" \
     -H "Content-Type: application/json" \
     -H "apikey: ${EVOLUTION_API_KEY}" \
     -d "{\"instanceName\": \"${INSTANCE_NAME}\", \"token\": \"${EVOLUTION_API_KEY}\", \"qrcode\": true, \"integration\": \"WHATSAPP-BAILEYS\"}" || true

echo ""
echo "2️⃣ Obteniendo código QR para escanear con la línea +58 4161804831..."
echo "Abre WhatsApp en el teléfono -> Ajustes (o Menú) -> Dispositivos Vinculados -> Vincular dispositivo"
echo ""

BOT_NUMBER="${WHATSAPP_BOT_NUMBER:-584161804831}"

# 2. Solicitar código de vinculación numérico directo (Pairing Code) y QR Code
echo "2️⃣ Obteniendo credenciales de vinculación para ${BOT_NUMBER}..."
PAIR_RESPONSE=$(curl -s -X GET "${EVO_URL}/instance/connect/${INSTANCE_NAME}?number=${BOT_NUMBER}" \
     -H "apikey: ${EVOLUTION_API_KEY}")

PAIR_CODE=$(echo "$PAIR_RESPONSE" | jq -r '.pairingCode // empty' 2>/dev/null || true)
BASE64_QR=$(echo "$PAIR_RESPONSE" | jq -r '.base64 // empty' 2>/dev/null || true)

if [ -n "$PAIR_CODE" ] && [ "$PAIR_CODE" != "null" ]; then
    echo "🔑 ========================================================"
    echo "   CÓDIGO DE VINCULACIÓN DIRECTO POR TELÉFONO: ${PAIR_CODE}"
    echo "============================================================"
    echo "En WhatsApp -> Dispositivos vinculados -> Vincular un dispositivo"
    echo "Toca abajo en 'Vincular con el número de teléfono' e ingresa: ${PAIR_CODE}"
fi

if [ -n "$BASE64_QR" ]; then
    echo "✅ Código QR también disponible para escaneo con cámara."
else
    echo "Estado de conexión:"
    echo "$PAIR_RESPONSE"
fi
