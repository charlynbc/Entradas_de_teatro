#!/bin/bash

# Test del componente de cumpleaños
echo "=== TEST COMPONENTE CUMPLEAÑOS ==="
echo ""

# Login como super usuario
echo "1. Login como super usuario..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula": "48376669", "password": "Teamomama91"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener token"
  exit 1
fi

echo "✅ Login exitoso"
echo ""

# Verificar cumpleaños de hoy
echo "2. Verificando cumpleaños de hoy..."
CUMPLEANOS=$(curl -s -X GET "http://localhost:3000/api/usuarios/cumpleanos/hoy" \
  -H "Authorization: Bearer $TOKEN")

echo "$CUMPLEANOS" | python3 -m json.tool

# Contar cumpleaños
COUNT=$(echo "$CUMPLEANOS" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data))")

echo ""
if [ "$COUNT" -gt 0 ]; then
  echo "🎉 ¡Hay $COUNT cumpleaños hoy!"
  echo "$CUMPLEANOS" | python3 -c "import sys, json; data=json.load(sys.stdin); [print(f'  🎂 {u[\"nombre\"]} {u[\"apellido\"]} cumple {u.get(\"edad\", \"?\") if \"edad\" in u else \"N/A\"} años') for u in data]"
else
  echo "ℹ️  No hay cumpleaños hoy"
fi

echo ""
echo "=== TEST COMPLETADO ==="
