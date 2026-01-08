#!/bin/bash

echo "🎭 Creando grupos teatrales de prueba completos..."
echo ""

# Login como directores
echo "1. Login como María García (Director)"
TOKEN_MARIA=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula": "12345678", "password": "admin"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "2. Login como Juan Pérez (Director)"
TOKEN_JUAN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula": "23456789", "password": "admin"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Creando Grupos"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Grupo 1: Teatro Experimental (María)
echo "→ Grupo 1: Teatro Experimental BACO (María García)"
GRUPO1=$(curl -s -X POST http://localhost:3000/api/grupos \
  -H "Authorization: Bearer $TOKEN_MARIA" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Teatro Experimental BACO",
    "horario_fijo": "Lunes 19:00",
    "director_cedula": "12345678",
    "obra_nombre": "Hamlet Contemporáneo"
  }')

echo "$GRUPO1" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'   ✅ Creado: ID {d.get(\"id\", \"?\")}')" 2>/dev/null || echo "   ⚠️  Revisar respuesta"
GRUPO1_ID=$(echo "$GRUPO1" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

echo ""

# Grupo 2: Comedia Social (Juan)
echo "→ Grupo 2: Comedia Social (Juan Pérez)"
GRUPO2=$(curl -s -X POST http://localhost:3000/api/grupos \
  -H "Authorization: Bearer $TOKEN_JUAN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Comedia Social",
    "horario_fijo": "Miércoles 20:00",
    "director_cedula": "23456789",
    "obra_nombre": "Rescatate 2025"
  }')

echo "$GRUPO2" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'   ✅ Creado: ID {d.get(\"id\", \"?\")}')" 2>/dev/null || echo "   ⚠️  Revisar respuesta"
GRUPO2_ID=$(echo "$GRUPO2" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Grupos Creados"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Listar todos los grupos
echo "📋 Listado de grupos:"
curl -s -X GET http://localhost:3000/api/grupos \
  -H "Authorization: Bearer $TOKEN_MARIA" | python3 -m json.tool 2>&1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Proceso Completado"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
