#!/bin/bash

# Script para arreglar las credenciales del superusuario
# Uso: ./arreglar-credenciales.sh

echo "🔧 ARREGLANDO CREDENCIALES DEL SUPERUSUARIO"
echo "============================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar si tenemos DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo -e "${YELLOW}⚠️  DATABASE_URL no está configurada${NC}"
  echo ""
  echo "Para arreglar esto necesitas la URL de tu base de datos de Render."
  echo ""
  echo "📍 Cómo obtenerla:"
  echo "   1. Ve a https://dashboard.render.com"
  echo "   2. Selecciona tu base de datos PostgreSQL"
  echo "   3. Copia la 'Internal Database URL'"
  echo ""
  echo "💡 Luego ejecuta:"
  echo "   export DATABASE_URL='postgresql://...'"
  echo "   ./arreglar-credenciales.sh"
  echo ""
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "🔄 OPCIÓN ALTERNATIVA (más fácil):"
  echo ""
  echo "Ejecuta esto directamente en la Shell de PostgreSQL en Render:"
  echo ""
  echo -e "${GREEN}-- Copiar y pegar en PSQL:${NC}"
  echo ""
  cat << 'EOF'
DELETE FROM users WHERE cedula = '48376669';
EOF
  echo ""
  echo "Luego genera el hash del password ejecutando:"
  echo ""
  echo "   cd teatro-tickets-backend"
  echo "   node generar-hash.js"
  echo ""
  echo "Y finalmente ejecuta el INSERT con el hash generado."
  echo ""
  echo "📚 Para más detalles, lee: SOLUCION-RAPIDA-LOGIN.md"
  exit 1
fi

echo "✅ DATABASE_URL detectada"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "teatro-tickets-backend/reset-superusuario.js" ]; then
  echo -e "${RED}❌ Error: No se encuentra reset-superusuario.js${NC}"
  echo "   Asegúrate de ejecutar este script desde la raíz del proyecto"
  exit 1
fi

# Cambiar al directorio del backend
cd teatro-tickets-backend

echo "🔄 Ejecutando script de reset..."
echo ""

# Ejecutar el script de Node.js
node reset-superusuario.js

# Verificar el resultado
if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ ¡CREDENCIALES ARREGLADAS EXITOSAMENTE!${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "📱 Ahora puedes iniciar sesión con:"
  echo "   Cédula: 48376669"
  echo "   Password: Teamomama91"
  echo "   Rol: SUPER"
  echo ""
  echo "🧪 Probando login..."
  cd ..
  ./probar-login.sh
else
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}❌ Hubo un error al resetear las credenciales${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "📚 Consulta los siguientes archivos para más opciones:"
  echo "   - SOLUCION-RAPIDA-LOGIN.md"
  echo "   - RESETEAR-SUPERUSUARIO.md"
  echo "   - resetear-superusuario.sql"
  exit 1
fi
