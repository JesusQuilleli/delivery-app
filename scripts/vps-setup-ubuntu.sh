#!/usr/bin/env bash
# ==============================================================================
# Script de Preparación Inicial para VPS Ubuntu 22.04 LTS - TiendaFast
# ==============================================================================
set -euo pipefail

echo "🚀 Iniciando preparación del VPS Ubuntu 22.04 LTS para TiendaFast..."

# 1. Actualización del sistema
echo "📦 Actualizando paquetes del sistema..."
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg lsb-release ufw fail2ban git jq htop

# 2. Configuración de Firewall UFW (Seguridad mínima estricta)
echo "🛡️ Configurando Firewall UFW (abriendo puertos 22 SSH, 80 HTTP, 443 HTTPS)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP Caddy'
ufw allow 443/tcp comment 'HTTPS Caddy'
ufw --force enable

# 3. Instalación oficial de Docker Engine y Docker Compose Plugin
if ! command -v docker &> /dev/null; then
    echo "🐳 Instalando Docker Engine oficial..."
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker instalado correctamente:"
    docker --version
else
    echo "✅ Docker ya está instalado."
fi

echo "=============================================================================="
echo "🎉 VPS Ubuntu 22.04 LTS preparado con éxito para TiendaFast."
echo "Próximo paso: clonar el repositorio y ejecutar scripts/vps-deploy.sh"
echo "=============================================================================="
