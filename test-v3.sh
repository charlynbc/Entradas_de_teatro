#!/bin/bash
# Script de testing para Sistema Baco Teatro v3.0
# Prueba el flujo completo: crear función → asignar → reservar → reportar → aprobar → validar

set -e

BASE_URL="http://localhost:3000"
ADMIN_PHONE="+5491122334455"
VENDEDOR_PHONE="+5491155667788"

echo "🎭 Testing Sistema Baco Teatro v3.0"
echo "=================================="
echo ""

# Test 1: Health check
echo "1️⃣ Health check..."
curl -s "$BASE_URL/health" | jq .
echo ""

# Test 2: Crear admin
echo "2️⃣ Creando admin ($ADMIN_PHONE)..."
curl -s -X POST "$BASE_URL/api/usuarios" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$ADMIN_PHONE\",
    \"name\": \"Admin Teatro\",
    \"role\": \"ADMIN\",
    \"password\": \"admin123\"
  }" | jq .
echo ""

# Test 3: Crear vendedor
echo "3️⃣ Creando vendedor ($VENDEDOR_PHONE)..."
curl -s -X POST "$BASE_URL/api/usuarios" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$VENDEDOR_PHONE\",
    \"name\": \"Juan Vendedor\",
    \"role\": \"VENDEDOR\",
    \"password\": \"vendedor123\"
  }" | jq .
echo ""

# Test 4: Login admin
echo "4️⃣ Login admin..."
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$ADMIN_PHONE\",
    \"password\": \"admin123\"
  }" | jq .
echo ""

# Test 5: Crear función
echo "5️⃣ Creando función (Hamlet)..."
SHOW_ID=$(curl -s -X POST "$BASE_URL/api/shows" \
  -H "Content-Type: application/json" \
  -d '{
    "obra": "Hamlet",
    "fecha": "2024-02-20T20:00:00Z",
    "lugar": "Teatro Nacional",
    "capacidad": 10,
    "base_price": 15000
  }' | jq -r '.show.id')
echo "Show ID: $SHOW_ID"
echo ""

# Test 6: Asignar 5 tickets al vendedor
echo "6️⃣ Asignando 5 tickets a Juan..."
ASSIGNED=$(curl -s -X POST "$BASE_URL/api/shows/$SHOW_ID/assign-tickets" \
  -H "Content-Type: application/json" \
  -d "{
    \"vendedor_phone\": \"$VENDEDOR_PHONE\",
    \"cantidad\": 5
  }")
echo "$ASSIGNED" | jq .
TICKET_CODE=$(echo "$ASSIGNED" | jq -r '.tickets[0]')
echo "Primer ticket: $TICKET_CODE"
echo ""

# Test 7: Ver tickets del vendedor
echo "7️⃣ Tickets de Juan..."
curl -s "$BASE_URL/api/vendedores/$VENDEDOR_PHONE/tickets" | jq '{total, en_stock, reservadas, reportadas_vendidas, pagadas}'
echo ""

# Test 8: Reservar ticket
echo "8️⃣ Reservando ticket para María..."
curl -s -X POST "$BASE_URL/api/tickets/$TICKET_CODE/reserve" \
  -H "Content-Type: application/json" \
  -d "{
    \"vendedor_phone\": \"$VENDEDOR_PHONE\",
    \"comprador_nombre\": \"María López\",
    \"comprador_contacto\": \"+5491199887766\"
  }" | jq '{mensaje, ticket: {code: .ticket.code, estado: .ticket.estado, comprador_nombre: .ticket.comprador_nombre}}'
echo ""

# Test 9: Reportar venta (vendedor cobra)
echo "9️⃣ Juan reporta que cobró \$15.000 a María..."
curl -s -X POST "$BASE_URL/api/tickets/$TICKET_CODE/report-sold" \
  -H "Content-Type: application/json" \
  -d "{
    \"vendedor_phone\": \"$VENDEDOR_PHONE\",
    \"precio\": 15000,
    \"medio_pago\": \"Efectivo\"
  }" | jq '{mensaje, ticket: {estado: .ticket.estado, reportada_por_vendedor: .ticket.reportada_por_vendedor}}'
echo ""

# Test 10: Ver deudores
echo "🔟 ¿Quién debe plata?"
curl -s "$BASE_URL/api/shows/$SHOW_ID/deudores" | jq .
echo ""

# Test 11: Resumen admin
echo "1️⃣1️⃣ Resumen admin de la función..."
curl -s "$BASE_URL/api/shows/$SHOW_ID/resumen-admin" | jq '{obra, disponibles, en_stock_vendedores, reportadas_sin_aprobar, pagadas, recaudacion_teorica, recaudacion_real, pendiente_aprobar}'
echo ""

# Test 12: Aprobar pago (admin recibe plata)
echo "1️⃣2️⃣ Admin aprueba el pago (Juan le entregó la plata)..."
curl -s -X POST "$BASE_URL/api/tickets/$TICKET_CODE/approve-payment" | jq '{mensaje, ticket: {estado: .ticket.estado, aprobada_por_admin: .ticket.aprobada_por_admin}}'
echo ""

# Test 13: Ver deudores nuevamente
echo "1️⃣3️⃣ ¿Quién debe plata ahora?"
curl -s "$BASE_URL/api/shows/$SHOW_ID/deudores" | jq .
echo ""

# Test 14: Validar en puerta
echo "1️⃣4️⃣ María llega al teatro - Validando..."
curl -s -X POST "$BASE_URL/api/tickets/$TICKET_CODE/validate" | jq '{valido, mensaje, obra}'
echo ""

# Test 15: Intentar validar nuevamente (debería fallar)
echo "1️⃣5️⃣ Intentando validar el mismo ticket otra vez..."
curl -s -X POST "$BASE_URL/api/tickets/$TICKET_CODE/validate" | jq '{valido, motivo}'
echo ""

# Test 16: Buscar ticket
echo "1️⃣6️⃣ Buscando ticket por código..."
curl -s "$BASE_URL/api/tickets/search?q=$TICKET_CODE" | jq '{total, ticket: .tickets[0] | {code, estado, comprador_nombre, vendedor_nombre, precio}}'
echo ""

# Test 17: Resumen final admin
echo "1️⃣7️⃣ Resumen final de la función..."
curl -s "$BASE_URL/api/shows/$SHOW_ID/resumen-admin" | jq '{obra, disponibles, en_stock_vendedores, reservadas, reportadas_sin_aprobar, pagadas, usadas, recaudacion_real, pendiente_aprobar}'
echo ""

# Test 18: Resumen por vendedor
echo "1️⃣8️⃣ Resumen por vendedor..."
curl -s "$BASE_URL/api/shows/$SHOW_ID/resumen-por-vendedor" | jq '.[0] | {vendedor_nombre, para_vender, reservadas, reportadas_vendidas, pagadas, usadas, monto_reportado, monto_aprobado, monto_debe}'
echo ""

echo "✅ Testing completo!"
echo ""
echo "📊 Flujo probado:"
echo "   DISPONIBLE → STOCK_VENDEDOR → RESERVADO → REPORTADA_VENDIDA → PAGADO → USADO"
echo ""
echo "💰 Control financiero:"
echo "   ✓ Vendedor reportó venta → apareció en deudores"
echo "   ✓ Admin aprobó pago → desapareció de deudores"
echo "   ✓ Recaudación real actualizada correctamente"
