#!/bin/bash

echo "🎭 Construyendo Baco Teatro App para Render..."

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar que @expo/vector-icons esté instalado
if ! grep -q "@expo/vector-icons" package.json; then
    echo "❌ Error: @expo/vector-icons no está en package.json"
    exit 1
fi

# Generar build web
echo "🌐 Generando build web..."
npx expo export:web

# Verificar que el build se generó
if [ ! -d "web-build" ]; then
    echo "❌ Error: No se generó la carpeta web-build"
    exit 1
fi

# Copiar al backend
echo "📋 Copiando build al backend..."
rm -rf ../teatro-tickets-backend/public
cp -r web-build ../teatro-tickets-backend/public

echo "✅ ¡Build completado! Los archivos están en teatro-tickets-backend/public"
echo "🚀 Ahora puedes hacer commit y push para desplegar en Render"
