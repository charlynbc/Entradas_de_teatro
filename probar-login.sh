#!/bin/bash

echo "🔐 Probando login del superusuario..."
echo ""
echo "URL: https://baco-teatro-1jxj.onrender.com/api/auth/login"
echo "Cédula: 48376669"
echo "Password: Teamomama91"
echo ""

# Hacer login
response=$(curl -s -X POST "https://baco-teatro-1jxj.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone":"48376669","password":"Teamomama91"}')

echo "Respuesta del servidor:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"
echo ""

# Verificar si hay token
if echo "$response" | grep -q '"token"'; then
  echo "✅ Login exitoso! El superusuario funciona correctamente."
  
  # Extraer y guardar token
  token=$(echo "$response" | jq -r '.token' 2>/dev/null)
  if [ ! -z "$token" ] && [ "$token" != "null" ]; then
    echo "$token" > /workspaces/Entradas_de_teatro/token.txt
    echo "📝 Token guardado en token.txt"
  fi
else
  echo "❌ Login falló. Necesitas resetear el superusuario."
  echo ""
  echo "🔧 Opciones para resolver:"
  echo "   1. Ejecuta: cd /workspaces/Entradas_de_teatro/teatro-tickets-backend && DATABASE_URL='...' node reset-superusuario.js"
  echo "   2. Consulta el archivo RESETEAR-SUPERUSUARIO.md para más opciones"
fi
