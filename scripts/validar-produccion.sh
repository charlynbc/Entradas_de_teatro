#!/bin/bash

# 🔍 VALIDACIÓN RÁPIDA - BACÓ TEATRO
# Verifica que el sistema esté listo para producción
# Ejecutar: ./scripts/validar-produccion.sh

set -e

echo "🔍 VALIDANDO BACÓ TEATRO - Estado de Producción"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

check() {
  local name=$1
  local cmd=$2
  local critical=$3  # 'CRITICAL', 'WARNING', or 'INFO'
  
  echo -n "  Validando: $name... "
  
  if eval "$cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
    ((PASS++))
  else
    if [ "$critical" = "CRITICAL" ]; then
      echo -e "${RED}❌ CRÍTICA${NC}"
      ((FAIL++))
    else
      echo -e "${YELLOW}⚠️  $critical${NC}"
      ((WARN++))
    fi
  fi
}

# ═════════════════════════════════════════════════════════════════════════════
echo -e "\n${BLUE}1. ESTRUCTURA DEL PROYECTO${NC}"
check "Backend folder existe" "[ -d teatro-tickets-backend ]" "CRITICAL"
check "Frontend folder existe" "[ -d baco-teatro-app ]" "CRITICAL"
check "Tests folder existe" "[ -d tests ]" "CRITICAL"
check ".env.example existe" "[ -f teatro-tickets-backend/.env.example ]" "CRITICAL"

# ═════════════════════════════════════════════════════════════════════════════
echo -e "\n${BLUE}2. DEPENDENCIAS${NC}"
check "Node.js instalado" "which node" "CRITICAL"
check "npm instalado" "which npm" "CRITICAL"
check "Backend dependencies" "[ -d teatro-tickets-backend/node_modules ]" "WARNING"
check "Frontend dependencies" "[ -d baco-teatro-app/node_modules ]" "WARNING"

# ═════════════════════════════════════════════════════════════════════════════
echo -e "\n${BLUE}3. ARCHIVOS DE CONFIGURACIÓN${NC}"
check ".env.example actualizado" "grep -q 'NODE_ENV' teatro-tickets-backend/.env.example" "CRITICAL"
check "JWT_SECRET no hardcodeado" "! grep -q 'JWT_SECRET=teatro-baco-secret-2024' teatro-tickets-backend/.env.example" "CRITICAL"
check "package.json backend" "[ -f teatro-tickets-backend/package.json ]" "CRITICAL"
check "package.json frontend" "[ -f baco-teatro-app/package.json ]" "CRITICAL"

# ═════════════════════════════════════════════════════════════════════════════
echo -e "\n${BLUE}4. ARCHIVOS DE DOCUMENTACIÓN${NC}"
check "README.md actualizado" "grep -q 'BACÓ Teatro' teatro-tickets-backend/README.md" "CRITICAL"
check "DEPLOYMENT_GUIDE.md existe" "[ -f DEPLOYMENT_GUIDE.md ]" "CRITICAL"
check "REPORTE-AUDITORIA-PRODUCCION.md" "[ -f REPORTE-AUDITORIA-PRODUCCION.md ]" "CRITICAL"
check "RESUMEN-FINAL-AUDITORIA.md" "[ -f RESUMEN-FINAL-AUDITORIA.md ]" "CRITICAL"

# ═════════════════════════════════════════════════════════════════════════════
echo -e "\n${BLUE}5. CÓDIGO FUENTE - RUTAS${NC}"
check "auth.routes.js existe" "[ -f teatro-tickets-backend/routes/auth.routes.js ]" "CRITICAL"
check "grupos.routes.js existe" "[ -f teatro-tickets-backend/routes/grupos.routes.js ]" "CRITICAL"
check "funciones.routes.js existe" "[ -f teatro-tickets-backend/routes/funciones.routes.js ]" "CRITICAL"
check "tickets.routes.js existe" "[ -f teatro-tickets-backend/routes/tickets.routes.js ]" "CRITICAL"
check "reportes.routes.js existe" "[ -f teatro-tickets-backend/routes/reportes.routes.js ]" "CRITICAL"

# ═════════════════════════════════════════════════════════════════════════════
echo -e "\n${BLUE}6. CÓDIGO FUENTE - CONTROLADORES${NC}"
check "grupos.controller.js tiene cerrarGrupoDefinitivo" \
  "grep -q 'cerrarGrupoDefinitivo' teatro-tickets-backend/controllers/grupos.controller.js" "CRITICAL"
check "tickets.controller.js tiene validarTicket" \
  "grep -q 'validarTicket' teatro-tickets-backend/controllers/tickets.controller.js" "CRITICAL"
check "public.controller.js existe" "[ -f teatro-tickets-backend/controllers/public.controller.js ]" "CRITICAL"

# ═════════════════════════════════════════════════════════════════════════════
echo -e "\n${BLUE}7. MIDDLEWARE DE SEGURIDAD${NC}"
check "auth.middleware.js existe" "[ -f teatro-tickets-backend/middleware/auth.middleware.js ]" "CRITICAL"
check "Middleware authenticate" \
  "grep -q 'export.*authenticate' teatro-tickets-backend/middleware/auth.middleware.js" "CRITICAL"
check "Middleware requireRole" \
  "grep -q 'export.*requireRole' teatro-tickets-backend/middleware/auth.middleware.js" "CRITICAL"

# ═════════════════════════════════════════════════════════════════════════════
echo -e "\n${BLUE}8. MIGRACIONES BD${NC}"
check "Migrations folder existe" "[ -d teatro-tickets-backend/db/migrations ]" "CRITICAL"
check "Migration 007 existe" "[ -f teatro-tickets-backend/db/migrations/007-ticket-auditoria-anulacion.sql ]" "CRITICAL"
check "init-v3-postgres.sql existe" "[ -f teatro-tickets-backend/db/init-v3-postgres.sql ]" "CRITICAL"

# ═════════════════════════════════════════════════════════════════════════════
echo -e "\n${BLUE}9. TESTING${NC}"
check "test-super-usuario.js existe" "[ -f tests/test-super-usuario.js ]" "WARNING"
check "test-actor-e2e.js existe" "[ -f tests/test-actor-e2e.js ]" "CRITICAL"
check "test-director.js existe" "[ -f tests/test-director.js ]" "WARNING"

# ═════════════════════════════════════════════════════════════════════════════
echo -e "\n${BLUE}10. ARCHIVOS HTML FRONTEND${NC}"
check "sobre-baco.html actualizado" \
  "grep -q 'bacoteatro@montevideo.com.uy' baco-teatro-app/public/sobre-baco.html || \
   grep -q 'BACO Teatro' baco-teatro-app/public/sobre-baco.html" "WARNING"
check "login.html apunta a canonical" \
  "! grep -q 'onclick.*login.html' baco-teatro-app/public/index.html || \
   grep -q '/pages/auth/login.html' baco-teatro-app/public/index.html" "INFO"

# ═════════════════════════════════════════════════════════════════════════════
echo -e "\n${BLUE}11. SEGURIDAD - .env${NC}"
check ".env no tiene JWT_SECRET hardcodeado" \
  "! grep -q 'JWT_SECRET=teatro-baco' teatro-tickets-backend/.env 2>/dev/null || [ ! -f teatro-tickets-backend/.env ]" "WARNING"
check "Node modules excluido de git" \
  "grep -q 'node_modules' .gitignore 2>/dev/null" "INFO"

# ═════════════════════════════════════════════════════════════════════════════
echo -e "\n${BLUE}12. CONFIGURACIÓN CORS${NC}"
check "index-v3-postgres.js configura CORS" \
  "grep -q 'corsOptions\|cors' teatro-tickets-backend/index-v3-postgres.js" "CRITICAL"
check "FRONTEND_URL en corsOptions" \
  "grep -q 'FRONTEND_URL' teatro-tickets-backend/index-v3-postgres.js" "CRITICAL"

# ═════════════════════════════════════════════════════════════════════════════
echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "\n${BLUE}RESUMEN${NC}"
echo -e "  ${GREEN}✅ PASSOU:${NC} $PASS"
echo -e "  ${YELLOW}⚠️  ADVERTENCIAS:${NC} $WARN"
echo -e "  ${RED}❌ CRÍTICAS:${NC} $FAIL"

# ═════════════════════════════════════════════════════════════════════════════
if [ $FAIL -eq 0 ]; then
  echo -e "\n${GREEN}✅ VALIDACIÓN EXITOSA${NC}"
  echo -e "Sistema está listo para producción (resueltas todas las críticas)\n"
  exit 0
else
  echo -e "\n${RED}❌ VALIDACIÓN FALLIDA${NC}"
  echo -e "Hay $FAIL críticas que resolver antes de producción\n"
  exit 1
fi
