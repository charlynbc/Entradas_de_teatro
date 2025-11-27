#!/bin/bash

echo "🔥 Setup Baco Teatro Backend"
echo "=============================="
echo ""

# 1. Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# 2. Generar hash del admin
echo ""
echo "🔐 Generando hash de password admin123..."
ADMIN_HASH=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(h => console.log(h))")

echo ""
echo "✅ Hash generado:"
echo "$ADMIN_HASH"
echo ""

# 3. Crear .env si no existe
if [ ! -f .env ]; then
  echo "📝 Creando archivo .env..."
  cp .env.example .env
  
  # Generar JWT_SECRET
  JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  
  # Actualizar .env
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
  
  echo "✅ Archivo .env creado con JWT_SECRET generado"
  echo ""
  echo "⚠️  IMPORTANTE: Edita .env y configura DATABASE_URL con tus credenciales PostgreSQL"
else
  echo "ℹ️  Archivo .env ya existe (no se modificó)"
fi

echo ""
echo "=============================="
echo "✅ Setup completado!"
echo ""
echo "Próximos pasos:"
echo "1. Editar .env con tu DATABASE_URL"
echo "2. Crear base de datos: createdb baco_teatro"
echo "3. Ejecutar schema: psql baco_teatro < schema.sql"
echo "   (IMPORTANTE: Actualizar el hash del admin en schema.sql con el generado arriba)"
echo "4. Iniciar servidor: npm start"
echo ""
