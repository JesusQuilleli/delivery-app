#!/usr/bin/env bash
# ==============================================================================
# Script de Renovación de Vinculación WhatsApp (+58 4161804831)
# ==============================================================================
set -e

cd /opt/delivery-app
source .env.production 2>/dev/null || true

EVO_KEY="${EVOLUTION_API_KEY:-EvoApi_TiendaFast_2026_SecKey!}"
BOT_NUM="${WHATSAPP_BOT_NUMBER:-584161804831}"

echo "🔄 Verificando estado previo de tiendafast..."
curl -s -X DELETE "http://127.0.0.1:8080/instance/logout/tiendafast" -H "apikey: ${EVO_KEY}" > /dev/null 2>&1 || true
curl -s -X DELETE "http://127.0.0.1:8080/instance/delete/tiendafast" -H "apikey: ${EVO_KEY}" > /dev/null 2>&1 || true
docker exec delivery_db psql -U delivery_user -d delivery_db -c "DELETE FROM \"Instance\" WHERE name = 'tiendafast';" > /dev/null 2>&1 || true
docker exec delivery_redis redis-cli flushall > /dev/null 2>&1 || true

echo "🚀 Registrando instancia limpia para el número ${BOT_NUM}..."
CREATE_RESP=$(curl -s -X POST http://127.0.0.1:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: ${EVO_KEY}" \
  -d "{\"instanceName\": \"tiendafast\", \"token\": \"${EVO_KEY}\", \"number\": \"${BOT_NUM}\", \"qrcode\": true, \"integration\": \"WHATSAPP-BAILEYS\"}")

sleep 3

# Solicitar código de vinculación y QR activo con query param number
RESP=$(curl -s "http://127.0.0.1:8080/instance/connect/tiendafast?number=${BOT_NUM}" -H "apikey: ${EVO_KEY}")

PAIR_CODE=$(echo "$RESP" | jq -r '.pairingCode // empty' 2>/dev/null || true)
if [ -z "$PAIR_CODE" ] || [ "$PAIR_CODE" = "null" ]; then
  PAIR_CODE=$(echo "$CREATE_RESP" | jq -r '.qrcode.pairingCode // empty' 2>/dev/null || true)
fi

RAW_CODE=$(echo "$RESP" | jq -r '.code // empty' 2>/dev/null || true)
if [ -z "$RAW_CODE" ] || [ "$RAW_CODE" = "null" ]; then
  RAW_CODE=$(echo "$CREATE_RESP" | jq -r '.qrcode.code // empty' 2>/dev/null || true)
fi

echo ""
echo "================================================================================"
echo "    👑 TIENDAFAST - VINCULACIÓN OFICIAL WHATSAPP (+58 4161804831)"
echo "================================================================================"
if [ -n "$PAIR_CODE" ] && [ "$PAIR_CODE" != "null" ]; then
  echo ""
  echo "    🔑 CÓDIGO DE VINCULACIÓN DIRECTO POR TELÉFONO:"
  echo "    👉 [  ${PAIR_CODE}  ] 👈"
  echo ""
  echo "    📌 PASOS EN TU CELULAR:"
  echo "    1. Abre WhatsApp en el teléfono (+58 4161804831)"
  echo "    2. Toca Menú (tres puntos) o Configuración -> 'Dispositivos vinculados'"
  echo "    3. Toca el botón verde 'Vincular dispositivo'"
  echo "    4. Toca 'Vincular con el número de teléfono' (en la parte inferior)"
  echo "    5. Introduce exactamente el código de 8 caracteres: ${PAIR_CODE}"
  echo ""
else
  echo "    ⚠️ No se pudo obtener el código numérico automáticamente."
fi
echo "================================================================================"
echo ""

if [ -n "$RAW_CODE" ] && [ "$RAW_CODE" != "null" ]; then
  echo "📱 CÓDIGO QR EN TERMINAL (Escanea alternativamente si prefieres cámara):"
  echo ""
  docker exec delivery_evolution_api node -e "try { require('qrcode-terminal').generate('${RAW_CODE}', {small: true}); } catch(e) { console.log('QR no renderizable'); }"
  echo ""
fi
