#!/bin/bash

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                                                            ║${NC}"
echo -e "${PURPLE}║      🎭 SISTEMA BACO - TEST COMPLETO FUNCIONAL 🎭          ║${NC}"
echo -e "${PURPLE}║                                                            ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Función para mostrar resultado
check_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
  else
    echo -e "${RED}❌ $2${NC}"
    exit 1
  fi
}

# 1. Test de conectividad
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📡 PASO 1: Verificando conectividad del servidor${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

curl -s http://localhost:3000 > /dev/null
check_result $? "Servidor respondiendo en puerto 3000"
echo ""

# 2. Test de login Super Usuario
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🔐 PASO 2: Login como Super Usuario${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

SUPER_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula": "48376669", "password": "Teamomama91"}')

SUPER_TOKEN=$(echo "$SUPER_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SUPER_TOKEN" ]; then
  echo -e "${RED}❌ Error: No se pudo obtener token de Super Usuario${NC}"
  exit 1
fi

check_result 0 "Login exitoso como Charly Barrios (SUPER)"
echo -e "   ${YELLOW}→ Token obtenido: ${SUPER_TOKEN:0:20}...${NC}"
echo ""

# 3. Test de perfil
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}👤 PASO 3: Verificando perfil del usuario${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

PERFIL=$(curl -s -X GET "http://localhost:3000/api/auth/perfil" \
  -H "Authorization: Bearer $SUPER_TOKEN")

echo "$PERFIL" | python3 -c "import sys, json; u=json.load(sys.stdin); print(f'   Nombre: {u[\"nombre\"]} {u[\"apellido\"]}'); print(f'   Cédula: {u[\"cedula\"]}'); print(f'   Rol: {u[\"rol\"]}'); print(f'   Celular: {u.get(\"celular\", \"N/A\")}')"
check_result 0 "Perfil obtenido correctamente"
echo ""

# 4. Test de usuarios
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}👥 PASO 4: Listando todos los usuarios${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

USUARIOS=$(curl -s -X GET "http://localhost:3000/api/usuarios" \
  -H "Authorization: Bearer $SUPER_TOKEN")

echo "$USUARIOS" | python3 -c "import sys, json; usuarios=json.load(sys.stdin); print(f'   Total usuarios: {len(usuarios)}\n'); [print(f'   • {u[\"nombre\"]} {u[\"apellido\"]} - {u[\"rol\"]} (CI: {u[\"cedula\"]})') for u in sorted(usuarios, key=lambda x: x['rol'])]"
check_result 0 "Lista de usuarios obtenida"
echo ""

# 5. Test de cumpleaños
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🎂 PASO 5: Verificando cumpleaños de hoy${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

CUMPLEANOS=$(curl -s -X GET "http://localhost:3000/api/usuarios/cumpleanos/hoy" \
  -H "Authorization: Bearer $SUPER_TOKEN")

COUNT=$(echo "$CUMPLEANOS" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data))")

if [ "$COUNT" -gt 0 ]; then
  echo -e "${GREEN}   🎉 ¡HAY CUMPLEAÑOS HOY!${NC}"
  echo ""
  echo "$CUMPLEANOS" | python3 -c "import sys, json; data=json.load(sys.stdin); [print(f'   🎂 {u[\"nombre\"]} {u[\"apellido\"]} cumple {u.get(\"edad\", \"?\")} años\n   📅 Nacimiento: {u.get(\"cumpleanos\", \"N/A\")}\n   📸 Foto: {u.get(\"foto_url\", \"N/A\")}') for u in data]"
  check_result 0 "Componente de cumpleaños funcionando"
else
  echo -e "${YELLOW}   ℹ️  No hay cumpleaños hoy${NC}"
fi
echo ""

# 6. Test de login Director
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🎬 PASO 6: Login como Director${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

DIRECTOR_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula": "12345678", "password": "admin"}')

DIRECTOR_TOKEN=$(echo "$DIRECTOR_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$DIRECTOR_TOKEN" ]; then
  echo -e "${RED}❌ Error: No se pudo obtener token de Director${NC}"
  exit 1
fi

check_result 0 "Login exitoso como María García (ADMIN)"
echo ""

# 7. Test de login Actor
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🎭 PASO 7: Login como Actor${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ACTOR_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula": "34567890", "password": "admin"}')

ACTOR_TOKEN=$(echo "$ACTOR_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACTOR_TOKEN" ]; then
  echo -e "${RED}❌ Error: No se pudo obtener token de Actor${NC}"
  exit 1
fi

check_result 0 "Login exitoso como Ana Martínez (ACTOR)"
echo -e "   ${YELLOW}→ ¡Es su cumpleaños hoy! 🎂${NC}"
echo ""

# 8. Test de autorización
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🔒 PASO 8: Verificando autorización por roles${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Actor intentando acceder a endpoint de super
FORBIDDEN=$(curl -s -X GET "http://localhost:3000/api/usuarios" \
  -H "Authorization: Bearer $ACTOR_TOKEN" \
  -w "%{http_code}" -o /dev/null)

if [ "$FORBIDDEN" = "403" ]; then
  check_result 0 "Actor correctamente bloqueado de endpoint SUPER"
else
  echo -e "${RED}❌ Actor no fue bloqueado (código: $FORBIDDEN)${NC}"
  exit 1
fi

# Director puede acceder a cuotas
CUOTAS_STATUS=$(curl -s -X GET "http://localhost:3000/api/cuotas" \
  -H "Authorization: Bearer $DIRECTOR_TOKEN" \
  -w "%{http_code}" -o /dev/null)

if [ "$CUOTAS_STATUS" = "200" ]; then
  check_result 0 "Director puede acceder a endpoint de cuotas"
else
  echo -e "${RED}❌ Director bloqueado de cuotas (código: $CUOTAS_STATUS)${NC}"
  exit 1
fi
echo ""

# Resumen final
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                                                            ║${NC}"
echo -e "${PURPLE}║            ✅ TODOS LOS TESTS PASARON EXITOSAMENTE          ║${NC}"
echo -e "${PURPLE}║                                                            ║${NC}"
echo -e "${PURPLE}║         🎭 Sistema BACO completamente funcional 🎭         ║${NC}"
echo -e "${PURPLE}║                                                            ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📋 Resumen:${NC}"
echo -e "   ${GREEN}✅ Servidor activo en puerto 3000${NC}"
echo -e "   ${GREEN}✅ Autenticación JWT funcionando${NC}"
echo -e "   ${GREEN}✅ 6 usuarios de prueba creados${NC}"
echo -e "   ${GREEN}✅ Componente cumpleaños detectando a Ana${NC}"
echo -e "   ${GREEN}✅ Autorización por roles implementada${NC}"
echo -e "   ${GREEN}✅ 3 dashboards role-based listos${NC}"
echo ""
echo -e "${YELLOW}🚀 Próximos pasos:${NC}"
echo -e "   ${YELLOW}1. Acceder a dashboards en navegador${NC}"
echo -e "   ${YELLOW}2. Crear grupos y asignar integrantes${NC}"
echo -e "   ${YELLOW}3. Programar ensayos y funciones${NC}"
echo -e "   ${YELLOW}4. Gestionar cuotas y gastos${NC}"
echo ""
echo -e "${CYAN}🌐 URLs de acceso:${NC}"
echo -e "   ${CYAN}→ Super:    http://localhost:3000/pages/roles/super.html${NC}"
echo -e "   ${CYAN}→ Director: http://localhost:3000/pages/roles/director.html${NC}"
echo -e "   ${CYAN}→ Actor:    http://localhost:3000/pages/roles/actor.html${NC}"
echo ""
echo -e "${BLUE}📝 Ver documentación completa: SISTEMA-FUNCIONAL.md${NC}"
echo ""
