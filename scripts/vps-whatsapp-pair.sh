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

# 2. Solicitar QR Code
QR_RESPONSE=$(curl -s -X GET "${EVO_URL}/instance/connect/${INSTANCE_NAME}" \
     -H "apikey: ${EVOLUTION_API_KEY}")

# Extraer base64 si está presente
BASE64_QR=$(echo "$QR_RESPONSE" | jq -r '.base64 // empty' 2>/dev/null || true)

if [ -n "$BASE64_QR" ]; then
    echo "✅ Código QR generado con éxito."
    echo "Si estás en terminal con soporte o navegador, puedes verlo accediendo a:"
    echo "👉 ${EVO_URL}/instance/connect/${INSTANCE_NAME}"
    echo "(O haz un túnel SSH si estás accediendo de forma remota: ssh -L 8080:localhost:8080 usuario@tu-ip)"
else
    echo "Estado de conexión:"
    echo "$QR_RESPONSE"
fi
