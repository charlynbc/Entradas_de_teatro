#!/bin/bash

# Script para crear grupos teatrales de prueba

echo "🎭 Creando grupos teatrales de prueba..."
echo ""

# Login como super usuario
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula": "48376669", "password": "Teamomama91"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo autenticar"
  exit 1
fi

echo "✅ Autenticado como Super Usuario"
echo ""

# Verificar endpoint de grupos
echo "📋 Verificando endpoint de grupos..."
GRUPOS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:3000/api/grupos" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$GRUPOS_RESPONSE" | tail -n1)
BODY=$(echo "$GRUPOS_RESPONSE" | head -n-1)

echo "Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Endpoint de grupos funcionando"
  echo ""
  echo "Grupos existentes:"
  echo "$BODY" | python3 -m json.tool 2>&1 || echo "$BODY"
elif [ "$HTTP_CODE" = "404" ]; then
  echo "⚠️  Endpoint /api/grupos no encontrado"
  echo "   Necesita implementarse la ruta de grupos"
elif [ "$HTTP_CODE" = "401" ]; then
  echo "❌ Error de autenticación"
elif [ "$HTTP_CODE" = "403" ]; then
  echo "❌ Sin permisos para acceder a grupos"
else
  echo "⚠️  Respuesta inesperada: $HTTP_CODE"
  echo "$BODY"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 PRÓXIMOS PASOS PARA GRUPOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Implementar ruta /api/grupos (CRUD)"
echo "2. Implementar ruta /api/grupos/:id/integrantes"
echo "3. Implementar ruta /api/ensayos"
echo "4. Implementar ruta /api/funciones"
echo ""
echo "Estructura sugerida para grupo:"
echo '{'
echo '  "nombre": "Grupo Experimental BACO",'
echo '  "descripcion": "Grupo de teatro experimental",'
echo '  "director_cedula": "12345678",'
echo '  "dia_semana": "Lunes",'
echo '  "hora_inicio": "19:00",'
echo '  "obra_a_realizar": "Hamlet",'
echo '  "fecha_inicio": "2025-01-15",'
echo '  "estado": "activo"'
echo '}'
echo ""
