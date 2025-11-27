#!/bin/bash

# Script de prueba para el sistema Baco Teatro
# Prueba el flujo completo: crear función, generar tickets, pagar y validar

echo "🎭 Prueba del Sistema Baco Teatro"
echo "=================================="
echo ""

API_URL="http://localhost:3000"

# 1. Healthcheck
echo "1️⃣  Verificando que el servidor esté funcionando..."
curl -s $API_URL
echo ""
echo ""

# 2. Crear una función
echo "2️⃣  Creando función: 'Romeo y Julieta'..."
SHOW_RESPONSE=$(curl -s -X POST $API_URL/api/shows \
  -H "Content-Type: application/json" \
  -d '{"obra":"Romeo y Julieta","fecha":"2025-12-31 20:00","capacidad":50}')
echo $SHOW_RESPONSE | jq .
SHOW_ID=$(echo $SHOW_RESPONSE | jq -r '.id')
echo "✅ Función creada con ID: $SHOW_ID"
echo ""

# 3. Generar tickets
echo "3️⃣  Generando 5 tickets para la función..."
TICKETS_RESPONSE=$(curl -s -X POST $API_URL/api/shows/$SHOW_ID/generate-tickets \
  -H "Content-Type: application/json" \
  -d '{"cantidad":5}')
echo $TICKETS_RESPONSE | jq .
TICKET_CODE=$(echo $TICKETS_RESPONSE | jq -r '.tickets[0].code')
echo "✅ Tickets generados. Primer código: $TICKET_CODE"
echo ""

# 4. Ver tickets de la función
echo "4️⃣  Consultando tickets de la función..."
curl -s $API_URL/api/shows/$SHOW_ID/tickets | jq .
echo ""

# 5. Marcar ticket como pagado
echo "5️⃣  Marcando ticket $TICKET_CODE como PAGADO..."
curl -s -X POST $API_URL/api/tickets/$TICKET_CODE/pay | jq .
echo "✅ Ticket marcado como pagado"
echo ""

# 6. Validar ticket (simula la app móvil)
echo "6️⃣  Validando ticket $TICKET_CODE (simulando app móvil)..."
VALIDATION_RESPONSE=$(curl -s -X POST $API_URL/api/tickets/$TICKET_CODE/validate)
echo $VALIDATION_RESPONSE | jq .
VALIDO=$(echo $VALIDATION_RESPONSE | jq -r '.valido')

if [ "$VALIDO" = "true" ]; then
  echo "✅ ¡Ticket validado exitosamente!"
else
  echo "❌ Ticket no válido"
fi
echo ""

# 7. Intentar validar de nuevo (debería fallar)
echo "7️⃣  Intentando validar el mismo ticket de nuevo..."
curl -s -X POST $API_URL/api/tickets/$TICKET_CODE/validate | jq .
echo "❌ Correctamente rechazado (ya usado)"
echo ""

echo "=================================="
echo "✅ Prueba completada"
echo ""
echo "📱 Ahora probá la app móvil:"
echo "   1. cd baco-teatro-app"
echo "   2. npm start"
echo "   3. Escanea el QR con Expo Go"
echo "   4. Usa el código: $TICKET_CODE"
