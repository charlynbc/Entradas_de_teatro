#!/bin/bash

# Colores
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

clear
echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                                                          ║${NC}"
echo -e "${PURPLE}║        🎭 DEMO VISUAL - Sistema BACO 🎭                  ║${NC}"
echo -e "${PURPLE}║                                                          ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}📋 PREPARANDO DEMOSTRACIÓN VISUAL${NC}"
echo ""

# Verificar que el servidor esté corriendo
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${YELLOW}⚠️  El servidor no está respondiendo${NC}"
    echo -e "${YELLOW}   Por favor, asegúrate de que el backend esté corriendo:${NC}"
    echo -e "${YELLOW}   cd teatro-tickets-backend && npm run dev${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Servidor activo en puerto 3000${NC}"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📱 DASHBOARDS DISPONIBLES${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}1. Dashboard Super Usuario${NC}"
echo -e "   URL: ${YELLOW}http://localhost:3000/pages/roles/super.html${NC}"
echo -e "   Login: ${PURPLE}48376669${NC} / ${PURPLE}Teamomama91${NC}"
echo -e "   Rol: SUPER (Administrador total)"
echo ""

echo -e "${GREEN}2. Dashboard Director${NC}"
echo -e "   URL: ${YELLOW}http://localhost:3000/pages/roles/director.html${NC}"
echo -e "   Login: ${PURPLE}12345678${NC} / ${PURPLE}admin${NC} (María García)"
echo -e "   Login: ${PURPLE}23456789${NC} / ${PURPLE}admin${NC} (Juan Pérez)"
echo -e "   Rol: ADMIN (Director de grupo)"
echo ""

echo -e "${GREEN}3. Dashboard Actor${NC}"
echo -e "   URL: ${YELLOW}http://localhost:3000/pages/roles/actor.html${NC}"
echo -e "   Login: ${PURPLE}34567890${NC} / ${PURPLE}admin${NC} (Ana Martínez 🎂 cumple hoy)"
echo -e "   Login: ${PURPLE}45678901${NC} / ${PURPLE}admin${NC} (Carlos Rodríguez)"
echo -e "   Login: ${PURPLE}56789012${NC} / ${PURPLE}admin${NC} (Laura Fernández)"
echo -e "   Rol: ACTOR (Vista personal)"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🎂 COMPONENTE CUMPLEAÑOS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}⭐ Ana Martínez cumple HOY (08/01)${NC}"
echo -e "   El componente de cumpleaños aparecerá automáticamente"
echo -e "   en cualquier dashboard al hacer login."
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🧪 QUÉ PROBAR${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}Como Super Usuario:${NC}"
echo "  ✓ Ver lista de todos los usuarios"
echo "  ✓ Crear nuevo usuario"
echo "  ✓ Editar información de usuarios"
echo "  ✓ Ver y gestionar cuotas"
echo "  ✓ Registrar gastos"
echo "  ✓ Ver componente de cumpleaños de Ana"
echo ""

echo -e "${GREEN}Como Director:${NC}"
echo "  ✓ Ver información de su grupo"
echo "  ✓ Gestionar integrantes"
echo "  ✓ Programar ensayos"
echo "  ✓ Crear funciones"
echo "  ✓ Ver cuotas del grupo"
echo "  ✓ Ver componente de cumpleaños"
echo ""

echo -e "${GREEN}Como Actor:${NC}"
echo "  ✓ Ver perfil personal"
echo "  ✓ Estado de cuotas"
echo "  ✓ Próximos ensayos"
echo "  ✓ Próximas funciones"
echo "  ✓ Entradas asignadas"
echo "  ✓ Ver cumpleaños de compañeros"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🚀 ABRIR DASHBOARDS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}Selecciona una opción:${NC}"
echo "  1) Abrir Dashboard Super Usuario"
echo "  2) Abrir Dashboard Director"
echo "  3) Abrir Dashboard Actor"
echo "  4) Abrir todos los dashboards"
echo "  5) Ver documentación"
echo "  0) Salir"
echo ""

read -p "Opción: " opcion

case $opcion in
    1)
        echo ""
        echo -e "${GREEN}🌐 Abriendo Dashboard Super Usuario...${NC}"
        echo -e "${PURPLE}Login: 48376669 / Teamomama91${NC}"
        echo ""
        "$BROWSER" "http://localhost:3000/pages/roles/super.html" 2>/dev/null || \
        xdg-open "http://localhost:3000/pages/roles/super.html" 2>/dev/null || \
        open "http://localhost:3000/pages/roles/super.html" 2>/dev/null || \
        echo -e "${YELLOW}Abre manualmente: http://localhost:3000/pages/roles/super.html${NC}"
        ;;
    2)
        echo ""
        echo -e "${GREEN}🌐 Abriendo Dashboard Director...${NC}"
        echo -e "${PURPLE}Login: 12345678 / admin (María) o 23456789 / admin (Juan)${NC}"
        echo ""
        "$BROWSER" "http://localhost:3000/pages/roles/director.html" 2>/dev/null || \
        xdg-open "http://localhost:3000/pages/roles/director.html" 2>/dev/null || \
        open "http://localhost:3000/pages/roles/director.html" 2>/dev/null || \
        echo -e "${YELLOW}Abre manualmente: http://localhost:3000/pages/roles/director.html${NC}"
        ;;
    3)
        echo ""
        echo -e "${GREEN}🌐 Abriendo Dashboard Actor...${NC}"
        echo -e "${PURPLE}Login: 34567890 / admin (Ana 🎂)${NC}"
        echo ""
        "$BROWSER" "http://localhost:3000/pages/roles/actor.html" 2>/dev/null || \
        xdg-open "http://localhost:3000/pages/roles/actor.html" 2>/dev/null || \
        open "http://localhost:3000/pages/roles/actor.html" 2>/dev/null || \
        echo -e "${YELLOW}Abre manualmente: http://localhost:3000/pages/roles/actor.html${NC}"
        ;;
    4)
        echo ""
        echo -e "${GREEN}🌐 Abriendo todos los dashboards...${NC}"
        echo ""
        "$BROWSER" "http://localhost:3000/pages/roles/super.html" 2>/dev/null &
        sleep 1
        "$BROWSER" "http://localhost:3000/pages/roles/director.html" 2>/dev/null &
        sleep 1
        "$BROWSER" "http://localhost:3000/pages/roles/actor.html" 2>/dev/null &
        echo -e "${GREEN}✅ Dashboards abiertos en pestañas separadas${NC}"
        ;;
    5)
        echo ""
        echo -e "${GREEN}📚 Documentación disponible:${NC}"
        echo ""
        echo -e "${CYAN}cat GUIA-ACCESO.md${NC}"
        echo -e "${CYAN}cat SISTEMA-FUNCIONAL.md${NC}"
        echo -e "${CYAN}cat RESUMEN-EJECUTIVO-08-01.md${NC}"
        echo ""
        ;;
    0)
        echo ""
        echo -e "${GREEN}👋 ¡Hasta luego!${NC}"
        echo ""
        exit 0
        ;;
    *)
        echo ""
        echo -e "${YELLOW}❌ Opción no válida${NC}"
        echo ""
        exit 1
        ;;
esac

echo ""
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}✨ ¡Disfruta probando el sistema! ✨${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
