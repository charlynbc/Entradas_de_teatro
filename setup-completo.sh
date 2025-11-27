#!/bin/bash

echo "🎭 Baco Teatro - Setup Completo"
echo "================================"
echo ""

API_URL="http://localhost:3000"

echo "📋 Este script va a:"
echo "  1. Crear 3 vendedores"
echo "  2. Crear una función de prueba"
echo "  3. Generar 20 tickets con QR"
echo "  4. Vender algunos tickets de ejemplo"
echo ""
read -p "¿Continuar? (s/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Cancelado"
    exit 1
fi

echo ""
echo "1️⃣  Creando vendedores..."
echo ""

# Crear vendedores
VENDEDOR1=$(curl -s -X POST $API_URL/api/vendedores \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan Pérez","alias":"Elenco","activo":true}')
echo "✅ Vendedor 1: $(echo $VENDEDOR1 | jq -r '.nombre')"

VENDEDOR2=$(curl -s -X POST $API_URL/api/vendedores \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana García","alias":"Producción","activo":true}')
echo "✅ Vendedor 2: $(echo $VENDEDOR2 | jq -r '.nombre')"

VENDEDOR3=$(curl -s -X POST $API_URL/api/vendedores \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Carlos López","alias":"Staff","activo":true}')
echo "✅ Vendedor 3: $(echo $VENDEDOR3 | jq -r '.nombre')"

echo ""
echo "2️⃣  Creando función de prueba..."
echo ""

SHOW=$(curl -s -X POST $API_URL/api/shows \
  -H "Content-Type: application/json" \
  -d '{"obra":"Romeo y Julieta","fecha":"2025-12-31 20:00","capacidad":50}')
SHOW_ID=$(echo $SHOW | jq -r '.id')
echo "✅ Función creada: $(echo $SHOW | jq -r '.obra') - ID: $SHOW_ID"

echo ""
echo "3️⃣  Generando 20 tickets con QR..."
echo ""

TICKETS=$(curl -s -X POST $API_URL/api/shows/$SHOW_ID/generate-tickets \
  -H "Content-Type: application/json" \
  -d '{"cantidad":20}')
echo "✅ 20 tickets generados"
echo ""

# Obtener algunos códigos de ticket
TICKET_CODES=($(echo $TICKETS | jq -r '.tickets[].code'))

echo "📝 Códigos de ejemplo:"
for i in {0..4}; do
    echo "   ${TICKET_CODES[$i]}"
done
echo ""

echo "4️⃣  Vendiendo algunos tickets de ejemplo..."
echo ""

# Vender 3 tickets con Juan (vendedorId: 1)
curl -s -X POST $API_URL/api/tickets/${TICKET_CODES[0]}/sell \
  -H "Content-Type: application/json" \
  -d '{"vendedorId":1,"compradorNombre":"María Rodríguez","compradorContacto":"099111222","medioPago":"EFECTIVO","monto":400}' > /dev/null
echo "✅ Ticket ${TICKET_CODES[0]} vendido por Juan"

curl -s -X POST $API_URL/api/tickets/${TICKET_CODES[1]}/sell \
  -H "Content-Type: application/json" \
  -d '{"vendedorId":1,"compradorNombre":"Pedro Gómez","compradorContacto":"099333444","medioPago":"TRANSFERENCIA","monto":400}' > /dev/null
echo "✅ Ticket ${TICKET_CODES[1]} vendido por Juan"

curl -s -X POST $API_URL/api/tickets/${TICKET_CODES[2]}/sell \
  -H "Content-Type: application/json" \
  -d '{"vendedorId":1,"compradorNombre":"Lucía Fernández","medioPago":"EFECTIVO","monto":400}' > /dev/null
echo "✅ Ticket ${TICKET_CODES[2]} vendido por Juan"

# Vender 2 tickets con Ana (vendedorId: 2)
curl -s -X POST $API_URL/api/tickets/${TICKET_CODES[3]}/sell \
  -H "Content-Type: application/json" \
  -d '{"vendedorId":2,"compradorNombre":"Jorge Martínez","compradorContacto":"099555666","medioPago":"PREX","monto":400}' > /dev/null
echo "✅ Ticket ${TICKET_CODES[3]} vendido por Ana"

curl -s -X POST $API_URL/api/tickets/${TICKET_CODES[4]}/sell \
  -H "Content-Type: application/json" \
  -d '{"vendedorId":2,"compradorNombre":"Sofía Castro","medioPago":"TRANSFERENCIA","monto":400}' > /dev/null
echo "✅ Ticket ${TICKET_CODES[4]} vendido por Ana"

echo ""
echo "5️⃣  Validando un ticket de ejemplo..."
echo ""

curl -s -X POST $API_URL/api/tickets/${TICKET_CODES[0]}/validate > /dev/null
echo "✅ Ticket ${TICKET_CODES[0]} validado (USADO)"

echo ""
echo "================================"
echo "✅ Setup completado!"
echo ""
echo "📊 Resumen:"
echo "   • 3 vendedores creados"
echo "   • 1 función creada (Romeo y Julieta)"
echo "   • 20 tickets generados"
echo "   • 5 tickets vendidos (3 por Juan, 2 por Ana)"
echo "   • 1 ticket validado"
echo "   • 15 tickets disponibles para vender"
echo ""
echo "🎯 Tickets para probar en la app:"
echo ""
echo "   VENDIDOS Y PAGADOS (listos para validar):"
echo "   • ${TICKET_CODES[1]}"
echo "   • ${TICKET_CODES[2]}"
echo "   • ${TICKET_CODES[3]}"
echo "   • ${TICKET_CODES[4]}"
echo ""
echo "   YA VALIDADOS (deben ser rechazados):"
echo "   • ${TICKET_CODES[0]}"
echo ""
echo "   DISPONIBLES (para vender desde la app):"
echo "   • ${TICKET_CODES[5]}"
echo "   • ${TICKET_CODES[6]}"
echo "   • ${TICKET_CODES[7]}"
echo ""
echo "📱 Ahora abrí la app móvil y probá:"
echo ""
echo "   cd baco-teatro-app"
echo "   npm start"
echo ""
echo "🎭 ¡A rockear!"
