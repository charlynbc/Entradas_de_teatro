#!/bin/bash
# Script de prueba para endpoints de Grupos

API_URL="http://localhost:3000/api"

echo "=== TEST GRUPOS ===" 
echo ""

# 1. Login con usuario supremo
echo "1. Autenticando usuario supremo..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"cedula":"48376669","password":"Teamomama91"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Error en login:"
    echo "$LOGIN_RESPONSE" | jq .
    exit 1
fi

echo "✅ Token obtenido: ${TOKEN:0:20}..."
echo ""

# 2. Listar grupos
echo "2. Listando grupos existentes..."
GRUPOS=$(curl -s -X GET "$API_URL/grupos" \
  -H "Authorization: Bearer $TOKEN")

echo "$GRUPOS" | jq .
echo ""

# 3. Crear un grupo de prueba
echo "3. Creando grupo de prueba..."
GRUPO_NUEVO=$(curl -s -X POST "$API_URL/grupos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Grupo Teatro BACÓ - Prueba",
    "obra": "Obra de Prueba 2025",
    "fecha_inicio": "2025-01-15",
    "fecha_fin": "2025-02-28",
    "horarios": "Lunes y Miércoles 18:00-20:00"
  }')

echo "$GRUPO_NUEVO" | jq .
GRUPO_ID=$(echo "$GRUPO_NUEVO" | jq -r '.id')
echo ""

if [ "$GRUPO_ID" != "null" ] && [ -n "$GRUPO_ID" ]; then
    echo "✅ Grupo creado con ID: $GRUPO_ID"
    
    # 4. Obtener grupo por ID
    echo ""
    echo "4. Obteniendo grupo por ID..."
    GRUPO_DETALLE=$(curl -s -X GET "$API_URL/grupos/$GRUPO_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "$GRUPO_DETALLE" | jq .
fi

echo ""
echo "=== FIN TESTS ==="
