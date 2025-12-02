#!/bin/bash

echo "🎭 Build script para Render..."

# Si existe el directorio de la app, hacer build
if [ -d "../baco-teatro-app" ]; then
    echo "📱 Construyendo app React Native Web..."
    cd ../baco-teatro-app
    
    # Instalar dependencias de la app
    npm install
    
    # Generar build web
    npx expo export --platform web
    
    # Copiar al backend
    echo "📋 Copiando build al backend..."
    rm -rf ../teatro-tickets-backend/public
    cp -r dist ../teatro-tickets-backend/public
    
    cd ../teatro-tickets-backend
    echo "✅ Build de app completado"
else
    echo "⚠️  No se encontró baco-teatro-app, usando public existente"
fi

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
npm install

echo "✅ Build completado!"
