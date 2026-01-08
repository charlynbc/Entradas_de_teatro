#!/bin/bash

echo "=== TEST API BACO ==="
echo ""

# Login
echo "1. Login con usuario supremo..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula": "48376669", "password": "Teamomama91"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener el token"
  echo "Respuesta: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login exitoso"
echo ""

# Perfil
echo "2. Obtener perfil del usuario..."
PERFIL=$(curl -s -X GET http://localhost:3000/api/auth/perfil \
  -H "Authorization: Bearer $TOKEN")

echo "$PERFIL" | python3 -m json.tool 2>/dev/null || echo "$PERFIL"
echo ""

# Usuarios
echo "3. Listar usuarios..."
USUARIOS=$(curl -s -X GET http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer $TOKEN")

echo "$USUARIOS" | python3 -m json.tool 2>/dev/null | head -20 || echo "$USUARIOS" | head -20
echo ""

# Cumpleaños
echo "4. Verificar cumpleaños de hoy..."
CUMPLEANOS=$(curl -s -X GET http://localhost:3000/api/usuarios/cumpleanos/hoy \
  -H "Authorization: Bearer $TOKEN")

echo "$CUMPLEANOS" | python3 -m json.tool 2>/dev/null || echo "$CUMPLEANOS"
echo ""

echo "=== TEST COMPLETADO ==="
