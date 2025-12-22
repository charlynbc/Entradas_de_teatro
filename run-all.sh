#!/bin/bash

# 🎭 BACO TEATRO - Script de Ejecución Completa
# Este script inicia automáticamente todos los servicios:
# - PostgreSQL (Docker)
# - Backend (Node.js/Express)
# - Frontend (React Native Web/Expo Metro)

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/teatro-tickets-backend"
FRONTEND_DIR="$PROJECT_DIR/baco-teatro-app"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC} 🎭 BACO TEATRO - INICIANDO TODOS LOS SERVICIOS             ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Función para imprimir pasos
log_step() {
    echo -e "${BLUE}➜${NC} $1"
}

# Función para imprimir éxito
log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

# Función para imprimir error
log_error() {
    echo -e "${RED}❌${NC} $1"
}

# 1. VERIFICAR E INICIAR POSTGRESQL
log_step "Verificando Base de Datos (PostgreSQL)..."

if docker ps --filter "name=teatro-postgres" --filter "status=running" | grep -q teatro-postgres; then
    log_success "PostgreSQL ya está corriendo"
else
    log_step "Iniciando contenedor PostgreSQL..."
    docker rm -f teatro-postgres 2>/dev/null || true
    docker run -d \
        --name teatro-postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_DB=teatro \
        -p 5432:5432 \
        postgres:15 > /dev/null 2>&1
    log_success "PostgreSQL iniciado en puerto 5432"
    sleep 3
fi

# 2. VERIFICAR E INICIAR BACKEND
log_step "Iniciando Backend (Node.js/Express)..."

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_success "Backend ya está corriendo en puerto 3000"
else
    cd "$BACKEND_DIR"
    
    # Aplicar migraciones
    log_step "Aplicando migraciones de BD..."
    export DATABASE_URL="postgres://postgres:postgres@localhost:5432/teatro"
    npm run db:migrate-phone-fk >/dev/null 2>&1 || true
    
    # Iniciar backend en background
    npm run dev > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/backend.pid
    log_success "Backend iniciado (PID: $BACKEND_PID, puerto 3000)"
    
    # Esperar a que el backend esté listo
    log_step "Esperando a que Backend esté listo..."
    for i in {1..15}; do
        if curl -s http://localhost:3000/health >/dev/null 2>&1; then
            log_success "Backend está respondiendo"
            break
        fi
        sleep 1
    done
fi

# 3. INICIAR FRONTEND
log_step "Iniciando Frontend (React Native Web/Expo Metro)..."

if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_success "Frontend ya está corriendo en puerto 8081"
else
    cd "$FRONTEND_DIR"
    npm run web > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > /tmp/frontend.pid
    log_success "Frontend iniciado (PID: $FRONTEND_PID, puerto 8081)"
fi

# 4. VERIFICAR QUE TODO ESTÉ FUNCIONANDO
echo ""
log_step "Verificando servicios..."
sleep 2

BACKEND_OK=false
FRONTEND_OK=false
POSTGRES_OK=false

# Verificar Backend
if curl -s http://localhost:3000/health | grep -q "ok"; then
    log_success "Backend respondiendo correctamente"
    BACKEND_OK=true
else
    log_error "Backend no está respondiendo"
fi

# Verificar Frontend
if curl -s http://localhost:8081 >/dev/null 2>&1; then
    log_success "Frontend está sirviendo"
    FRONTEND_OK=true
else
    log_error "Frontend no está disponible (probablemente aún compilando)"
fi

# Verificar PostgreSQL
if docker ps --filter "name=teatro-postgres" --filter "status=running" | grep -q teatro-postgres; then
    log_success "PostgreSQL está corriendo"
    POSTGRES_OK=true
else
    log_error "PostgreSQL no está corriendo"
fi

# 5. MOSTRAR RESUMEN
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}                    🎯 SERVICIOS ACTIVOS                     ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Frontend (Expo Metro)  │  ${BLUE}http://localhost:8081${NC}"
echo -e "Backend (Express API)  │  ${BLUE}http://localhost:3000${NC}"
echo -e "Base de Datos          │  ${BLUE}postgresql://localhost:5432${NC}"
echo ""

# 6. MOSTRAR CREDENCIALES
echo -e "${YELLOW}🔓 Credenciales de acceso:${NC}"
echo "   Cédula:      ${BLUE}48376669${NC}"
echo "   Contraseña:  ${BLUE}Teamomama91${NC}"
echo ""

# 7. MOSTRAR INSTRUCCIONES DE PARADA
echo -e "${YELLOW}💡 Para detener todos los servicios:${NC}"
echo "   ${BLUE}./stop-all.sh${NC}"
echo ""

# 8. INSTRUCCIONES EN VIVO
echo -e "${YELLOW}📝 Durante la ejecución:${NC}"
echo "   • Abre ${BLUE}http://localhost:8081${NC} en tu navegador"
echo "   • Presiona ${BLUE}r${NC} en la terminal para recargar (Hot Reload)"
echo "   • Los logs están en:"
echo "     - Backend: /tmp/backend.log"
echo "     - Frontend: /tmp/frontend.log"
echo ""

echo -e "${GREEN}✅ ¡APLICACIÓN LISTA! Abre http://localhost:8081${NC}"
echo ""

# Mantener el script en ejecución mostrando logs en tiempo real
log_step "Esperando servicios..."
wait
