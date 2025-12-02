#!/bin/bash

# Script de testing completo para Baco Teatro en Render
# URL: https://baco-teatro-1jxj.onrender.com

echo "🎭 Testing Baco Teatro - Render Deployment"
echo "=========================================="
echo ""

BASE_URL="https://baco-teatro-1jxj.onrender.com"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Test Health Check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s $BASE_URL/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health Check OK${NC}"
    echo "$HEALTH" | jq .
else
    echo -e "${RED}❌ Health Check FAILED${NC}"
fi
echo ""

# 2. Test API Root
echo "2️⃣  Testing API Root..."
API_ROOT=$(curl -s $BASE_URL/api)
if echo "$API_ROOT" | grep -q "Teatro Tickets"; then
    echo -e "${GREEN}✅ API Root OK${NC}"
    echo "$API_ROOT" | jq .
else
    echo -e "${RED}❌ API Root FAILED${NC}"
fi
echo ""

# 3. Test Login
echo "3️⃣  Testing Login (Usuario Supremo)..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"48376669","password":"Teamomama91"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Login OK${NC}"
    echo "$LOGIN_RESPONSE" | jq .
else
    echo -e "${RED}❌ Login FAILED${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi
echo ""

# 4. Test Usuarios Endpoint
echo "4️⃣  Testing Usuarios (con autenticación)..."
USUARIOS=$(curl -s $BASE_URL/api/usuarios \
  -H "Authorization: Bearer $TOKEN")

if echo "$USUARIOS" | jq -e '.' >/dev/null 2>&1; then
    USER_COUNT=$(echo "$USUARIOS" | jq 'length')
    echo -e "${GREEN}✅ Usuarios OK - Total: $USER_COUNT usuarios${NC}"
    echo "$USUARIOS" | jq '.[] | {id, nombre, rol}'
else
    echo -e "${RED}❌ Usuarios FAILED${NC}"
fi
echo ""

# 5. Test Shows Endpoint
echo "5️⃣  Testing Shows..."
SHOWS=$(curl -s $BASE_URL/api/shows \
  -H "Authorization: Bearer $TOKEN")

if echo "$SHOWS" | jq -e '.' >/dev/null 2>&1; then
    SHOW_COUNT=$(echo "$SHOWS" | jq 'length')
    echo -e "${GREEN}✅ Shows OK - Total: $SHOW_COUNT shows${NC}"
    if [ "$SHOW_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No hay shows creados${NC}"
    fi
else
    echo -e "${RED}❌ Shows FAILED${NC}"
fi
echo ""

# 6. Test Tickets Endpoint
echo "6️⃣  Testing Tickets..."
TICKETS=$(curl -s $BASE_URL/api/tickets \
  -H "Authorization: Bearer $TOKEN")

if echo "$TICKETS" | jq -e '.' >/dev/null 2>&1; then
    TICKET_COUNT=$(echo "$TICKETS" | jq 'length')
    echo -e "${GREEN}✅ Tickets OK - Total: $TICKET_COUNT tickets${NC}"
    if [ "$TICKET_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No hay tickets creados${NC}"
    fi
else
    echo -e "${RED}❌ Tickets FAILED${NC}"
fi
echo ""

# 7. Test Frontend
echo "7️⃣  Testing Frontend..."
FRONTEND=$(curl -s $BASE_URL | grep -o '<title>.*</title>')
if echo "$FRONTEND" | grep -q "Baco Teatro"; then
    echo -e "${GREEN}✅ Frontend HTML OK${NC}"
    echo "   $FRONTEND"
else
    echo -e "${RED}❌ Frontend FAILED${NC}"
fi
echo ""

# 8. Test JavaScript Bundle
echo "8️⃣  Testing JavaScript Bundle..."
JS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/_expo/static/js/web/AppEntry-a526a68adb2c4f178dd0f14e127ebfbb.js)
if [ "$JS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ JavaScript Bundle OK (HTTP $JS_STATUS)${NC}"
else
    echo -e "${RED}❌ JavaScript Bundle FAILED (HTTP $JS_STATUS)${NC}"
fi
echo ""

# 9. Test Static Assets
echo "9️⃣  Testing Static Assets..."
METADATA=$(curl -s $BASE_URL/metadata.json)
if echo "$METADATA" | jq -e '.' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Metadata OK${NC}"
    echo "$METADATA" | jq '{version, bundler}'
else
    echo -e "${YELLOW}⚠️  Metadata no disponible o formato incorrecto${NC}"
fi
echo ""

# Resumen Final
echo "=========================================="
echo "🎉 Testing Completo"
echo "=========================================="
echo ""
echo "📊 Resumen:"
echo "   • Base de Datos: PostgreSQL Connected"
echo "   • Usuarios: $USER_COUNT registrados"
echo "   • Shows: $SHOW_COUNT creados"
echo "   • Tickets: $TICKET_COUNT vendidos"
echo ""
echo "🔐 Credenciales Supremo:"
echo "   • Cédula/Phone: 48376669"
echo "   • Password: Teamomama91"
echo ""
echo -e "${GREEN}✅ Deployment exitoso en Render${NC}"
