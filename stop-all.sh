#!/bin/bash

# 🎭 BACO TEATRO - Script para Detener Todos los Servicios

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC} 🛑 DETENIENDO TODOS LOS SERVICIOS DE BACO TEATRO          ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Detener Frontend
echo -e "${BLUE}➜${NC} Deteniendo Frontend (Expo Metro)..."
if [ -f /tmp/frontend.pid ]; then
    kill $(cat /tmp/frontend.pid) 2>/dev/null || true
    rm -f /tmp/frontend.pid
fi
pkill -f "expo start" || true
echo -e "${GREEN}✅${NC} Frontend detenido"

# Detener Backend
echo -e "${BLUE}➜${NC} Deteniendo Backend (Node.js)..."
if [ -f /tmp/backend.pid ]; then
    kill $(cat /tmp/backend.pid) 2>/dev/null || true
    rm -f /tmp/backend.pid
fi
pkill -f "npm run dev" || true
pkill -f "nodemon" || true
pkill -f "index-v3-postgres.js" || true
echo -e "${GREEN}✅${NC} Backend detenido"

# Detener PostgreSQL
echo -e "${BLUE}➜${NC} Deteniendo PostgreSQL (Docker)..."
docker rm -f teatro-postgres 2>/dev/null || true
echo -e "${GREEN}✅${NC} PostgreSQL detenido"

echo ""
echo -e "${GREEN}✅ Todos los servicios han sido detenidos${NC}"
echo ""
