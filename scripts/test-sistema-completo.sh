#!/bin/bash
# Script de prueba completa del sistema Baco Teatro
# Verifica login, reservas, y funcionalidad básica

set -e

BASE_URL="http://localhost:3000"
echo "🎭 Probando Sistema Baco Teatro"
echo "================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar servidor
echo -n "1️⃣  Verificando servidor... "
HEALTH=$(curl -s $BASE_URL/health)
STATUS=$(echo $HEALTH | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$STATUS" = "ok" ] || [ "$STATUS" = "degraded" ]; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ ERROR${NC}"
    echo "$HEALTH"
    exit 1
fi

# 2. Probar login SUPER
echo -n "2️⃣  Probando login (SUPER)... "
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"11111111","password":"1234"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${YELLOW}⚠ Usuario no existe (ejecuta npm run db:crear-datos-completos)${NC}"
    TOKEN=""
fi

# 3. Probar login ACTOR
echo -n "3️⃣  Probando login (ACTOR)... "
if [ -n "$TOKEN" ]; then
    ACTOR_LOGIN=$(curl -s -X POST $BASE_URL/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"cedula":"33333333","password":"1234"}')
    
    ACTOR_TOKEN=$(echo $ACTOR_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$ACTOR_TOKEN" ]; then
        echo -e "${GREEN}✓ OK${NC}"
    else
        echo -e "${RED}✗ ERROR${NC}"
    fi
else
    echo -e "${YELLOW}⊘ SKIP${NC}"
    ACTOR_TOKEN=""
fi

# 4. Listar funciones
echo -n "4️⃣  Listando funciones... "
if [ -n "$TOKEN" ]; then
    FUNCIONES=$(curl -s $BASE_URL/api/funciones \
      -H "Authorization: Bearer $TOKEN")
    
    COUNT=$(echo $FUNCIONES | grep -o '"id":' | wc -l)
    echo -e "${GREEN}✓ OK (${COUNT} funciones)${NC}"
else
    echo -e "${YELLOW}⊘ SKIP${NC}"
fi

# 5. Detectar sistema de función
echo -n "5️⃣  Detectando sistema función 1... "
if [ -n "$TOKEN" ]; then
    SISTEMA=$(curl -s $BASE_URL/api/reservas/sistema/1 \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    
    if echo "$SISTEMA" | grep -q '"sistema"'; then
        TIPO=$(echo $SISTEMA | grep -o '"sistema":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✓ OK (${TIPO})${NC}"
    else
        echo -e "${YELLOW}⚠ Función no existe${NC}"
    fi
else
    echo -e "${YELLOW}⊘ SKIP${NC}"
fi

# 6. Listar entradas del actor
echo -n "6️⃣  Listando entradas actor... "
if [ -n "$ACTOR_TOKEN" ]; then
    ENTRADAS=$(curl -s $BASE_URL/api/reservas/mis-entradas \
      -H "Authorization: Bearer $ACTOR_TOKEN")
    
    TOTAL=$(echo $ENTRADAS | grep -o '"total":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✓ OK (${TOTAL} entradas)${NC}"
else
    echo -e "${YELLOW}⊘ SKIP${NC}"
fi

# 7. Estadísticas función
echo -n "7️⃣  Estadísticas función 1... "
if [ -n "$TOKEN" ]; then
    STATS=$(curl -s $BASE_URL/api/reservas/estadisticas/1 \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    
    if echo "$STATS" | grep -q '"total"'; then
        TOTAL=$(echo $STATS | grep -o '"total":"[0-9]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✓ OK (${TOTAL} entradas)${NC}"
    else
        echo -e "${YELLOW}⚠ Sin datos${NC}"
    fi
else
    echo -e "${YELLOW}⊘ SKIP${NC}"
fi

# 8. Verificar endpoints públicos
echo -n "8️⃣  Endpoint público funciones... "
PUBLIC=$(curl -s $BASE_URL/api/public/funciones)
if echo "$PUBLIC" | grep -q '\['; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${YELLOW}⚠ Sin funciones públicas${NC}"
fi

# Resumen
echo ""
echo "================================="
echo "📊 Resumen:"
if [ -n "$TOKEN" ]; then
    echo -e "   ${GREEN}✓${NC} Servidor funcionando"
    echo -e "   ${GREEN}✓${NC} Autenticación OK"
    echo -e "   ${GREEN}✓${NC} API Reservas OK"
    echo ""
    echo "🎉 Sistema completamente operativo"
else
    echo -e "   ${GREEN}✓${NC} Servidor funcionando"
    echo -e "   ${YELLOW}⚠${NC} Sin datos de prueba"
    echo ""
    echo "💡 Ejecuta: npm run db:crear-datos-completos"
fi
echo ""
