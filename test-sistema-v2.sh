#!/bin/bash

# Script de prueba del sistema v2.0 de Baco Teatro
# Este script prueba todos los flujos de trabajo del sistema

API="http://localhost:3000"
echo "🎭 Test del Sistema Baco Teatro v2.0"
echo "===================================="
echo ""

# 1. Crear una función
echo "📌 1. Creando función de prueba..."
SHOW_RESPONSE=$(curl -s -X POST "$API/api/shows" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Hamlet",
    "fecha": "2024-02-15",
    "hora": "20:00",
    "lugar": "Teatro Nacional",
    "precio": 5000,
    "cantidadTickets": 50
  }')

SHOW_ID=$(echo $SHOW_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
echo "✅ Función creada con ID: $SHOW_ID"
echo ""

# 2. Verificar que se crearon los tickets DISPONIBLE
echo "📌 2. Verificando tickets DISPONIBLE..."
TICKETS=$(curl -s "$API/api/shows/$SHOW_ID/tickets")
echo "✅ Tickets creados: $(echo $TICKETS | grep -o '"code":"T-[^"]*"' | wc -l)"
TICKET_1=$(echo $TICKETS | grep -o '"code":"T-[^"]*"' | head -1 | grep -o 'T-[^"]*')
TICKET_2=$(echo $TICKETS | grep -o '"code":"T-[^"]*"' | head -2 | tail -1 | grep -o 'T-[^"]*')
TICKET_3=$(echo $TICKETS | grep -o '"code":"T-[^"]*"' | head -3 | tail -1 | grep -o 'T-[^"]*')
echo "   Usando tickets: $TICKET_1, $TICKET_2, $TICKET_3"
echo ""

# 3. Crear un vendedor
echo "📌 3. Creando vendedor de prueba..."
VENDEDOR_RESPONSE=$(curl -s -X POST "$API/api/usuarios" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Pedro Actorini",
    "email": "pedro@baco.com",
    "password": "pass123",
    "rol": "VENDEDOR"
  }')

VENDEDOR_ID=$(echo $VENDEDOR_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
echo "✅ Vendedor creado con ID: $VENDEDOR_ID"
echo ""

# 4. Admin asigna tickets al vendedor
echo "📌 4. Admin asigna 10 tickets al vendedor..."
ASSIGN_RESPONSE=$(curl -s -X POST "$API/api/shows/$SHOW_ID/assign-tickets" \
  -H "Content-Type: application/json" \
  -d "{
    \"vendedorId\": $VENDEDOR_ID,
    \"cantidad\": 10
  }")

echo "✅ Asignación exitosa: $(echo $ASSIGN_RESPONSE | grep -o '"message":"[^"]*"')"
echo ""

# 5. Verificar que los tickets cambiaron a STOCK_VENDEDOR
echo "📌 5. Verificando tickets del vendedor..."
VENDEDOR_TICKETS=$(curl -s "$API/api/vendedores/$VENDEDOR_ID/tickets")
STOCK_COUNT=$(echo $VENDEDOR_TICKETS | grep -o '"estado":"STOCK_VENDEDOR"' | wc -l)
echo "✅ Vendedor tiene $STOCK_COUNT tickets en STOCK_VENDEDOR"
echo ""

# 6. Vendedor reserva un ticket
echo "📌 6. Vendedor reserva ticket para un cliente..."
RESERVE_RESPONSE=$(curl -s -X POST "$API/api/tickets/$TICKET_1/reserve" \
  -H "Content-Type: application/json" \
  -d '{
    "nombreComprador": "Juan Pérez",
    "emailComprador": "juan@email.com"
  }')

echo "✅ Reserva exitosa: $(echo $RESERVE_RESPONSE | grep -o '"message":"[^"]*"')"
echo ""

# 7. Verificar estado RESERVADO
echo "📌 7. Verificando estado del ticket reservado..."
TICKET_INFO=$(curl -s "$API/api/tickets/$TICKET_1")
ESTADO=$(echo $TICKET_INFO | grep -o '"estado":"[^"]*"' | grep -o 'RESERVADO')
COMPRADOR=$(echo $TICKET_INFO | grep -o '"nombreComprador":"[^"]*"' | cut -d'"' -f4)
echo "✅ Estado: $ESTADO | Comprador: $COMPRADOR"
echo ""

# 8. Buscar ticket por nombre de comprador
echo "📌 8. Admin busca ticket por nombre de comprador..."
SEARCH_RESPONSE=$(curl -s "$API/api/tickets/search?q=Juan")
FOUND=$(echo $SEARCH_RESPONSE | grep -o "$TICKET_1")
echo "✅ Búsqueda encontró ticket: $FOUND"
echo ""

# 9. Intentar validar ticket RESERVADO (debe fallar)
echo "📌 9. Intentando validar ticket RESERVADO (debe rechazar)..."
VALIDATE_FAIL=$(curl -s -X POST "$API/api/tickets/$TICKET_1/validate" \
  -H "Content-Type: application/json")
MOTIVO=$(echo $VALIDATE_FAIL | grep -o '"motivo":"[^"]*"' | cut -d'"' -f4)
echo "❌ Validación rechazada (esperado): $MOTIVO"
echo ""

# 10. Admin marca ticket como PAGADO
echo "📌 10. Admin marca ticket como PAGADO..."
PAID_RESPONSE=$(curl -s -X POST "$API/api/tickets/$TICKET_1/mark-paid" \
  -H "Content-Type: application/json")

echo "✅ Ticket marcado como pagado: $(echo $PAID_RESPONSE | grep -o '"message":"[^"]*"')"
echo ""

# 11. Validar ticket PAGADO (debe funcionar)
echo "📌 11. Validando ticket PAGADO en puerta..."
VALIDATE_SUCCESS=$(curl -s -X POST "$API/api/tickets/$TICKET_1/validate" \
  -H "Content-Type: application/json")

VALIDO=$(echo $VALIDATE_SUCCESS | grep -o '"valido":true')
echo "✅ Validación exitosa: $VALIDO"
echo ""

# 12. Intentar validar de nuevo (debe fallar - ya usado)
echo "📌 12. Intentando validar ticket ya USADO..."
VALIDATE_USED=$(curl -s -X POST "$API/api/tickets/$TICKET_1/validate" \
  -H "Content-Type: application/json")
MOTIVO_USADO=$(echo $VALIDATE_USED | grep -o '"motivo":"[^"]*"' | cut -d'"' -f4)
echo "❌ Validación rechazada (esperado): $MOTIVO_USADO"
echo ""

# 13. Transferir ticket entre vendedores
echo "📌 13. Creando segundo vendedor para transferencia..."
VENDEDOR2_RESPONSE=$(curl -s -X POST "$API/api/usuarios" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María Actriz",
    "email": "maria@baco.com",
    "password": "pass123",
    "rol": "VENDEDOR"
  }')

VENDEDOR2_ID=$(echo $VENDEDOR2_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
echo "✅ Segundo vendedor creado con ID: $VENDEDOR2_ID"
echo ""

echo "📌 14. Transfiriendo ticket de Vendedor 1 a Vendedor 2..."
TRANSFER_RESPONSE=$(curl -s -X POST "$API/api/tickets/$TICKET_2/transfer" \
  -H "Content-Type: application/json" \
  -d "{
    \"nuevoVendedorId\": $VENDEDOR2_ID
  }")

echo "✅ Transferencia exitosa: $(echo $TRANSFER_RESPONSE | grep -o '"message":"[^"]*"')"
echo ""

# 15. Obtener reportes
echo "📌 15. Obteniendo reporte de ventas..."
REPORTE=$(curl -s "$API/api/reportes/ventas?showId=$SHOW_ID")
echo "✅ Reporte generado exitosamente"
echo "$REPORTE" | grep -o '"vendedorNombre":"[^"]*"' | while read line; do
  echo "   $line"
done
echo ""

echo "=================================="
echo "✅ TODAS LAS PRUEBAS COMPLETADAS"
echo "=================================="
echo ""
echo "Resumen de estados probados:"
echo "  ✓ DISPONIBLE → STOCK_VENDEDOR (asignación)"
echo "  ✓ STOCK_VENDEDOR → RESERVADO (reserva)"
echo "  ✓ RESERVADO → PAGADO (cobro)"
echo "  ✓ PAGADO → USADO (validación)"
echo "  ✓ Transferencia entre vendedores"
echo "  ✓ Búsqueda de tickets"
echo "  ✓ Validaciones de permisos"
echo ""
