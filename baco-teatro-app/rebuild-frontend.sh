#!/bin/bash
set -e

echo "🧹 Limpiando directorio public del backend..."
rm -rf ../teatro-tickets-backend/public/*
mkdir -p ../teatro-tickets-backend/public

echo "🏗️  Compilando Frontend para Web..."
npx expo export --platform web --output-dir ../teatro-tickets-backend/public

echo "✅ Compilación completada."
ls -F ../teatro-tickets-backend/public/
