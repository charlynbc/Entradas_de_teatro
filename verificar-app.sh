#!/bin/bash

echo "🔍 Verificando configuración de Baco Teatro App..."
echo ""

# Verificar .env
echo "📄 Archivo .env:"
if [ -f "/workspaces/Entradas_de_teatro/baco-teatro-app/.env" ]; then
  cat /workspaces/Entradas_de_teatro/baco-teatro-app/.env
  echo "✅ .env encontrado"
else
  echo "❌ .env NO encontrado"
fi

echo ""
echo "🌐 Probando backend en producción..."
curl -s https://baco-teatro-1jxj.onrender.com/api/health || echo "❌ Backend no responde"

echo ""
echo "🧪 Probando login API..."
RESPONSE=$(curl -s -X POST https://baco-teatro-1jxj.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"48376669","password":"super123"}')

if echo "$RESPONSE" | grep -q "token"; then
  echo "✅ Login funciona correctamente"
  echo "Token recibido: $(echo $RESPONSE | grep -o '"token":"[^"]*"' | head -1)"
else
  echo "❌ Error en login:"
  echo "$RESPONSE"
fi

echo ""
echo "📱 URL configurada en client.js:"
grep "API_URL" /workspaces/Entradas_de_teatro/baco-teatro-app/api/client.js

echo ""
echo "✅ Credenciales de prueba:"
echo "   Cédula: 48376669"
echo "   Password: super123"
echo "   Rol: SUPER"
