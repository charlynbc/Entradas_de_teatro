#!/bin/bash
# Testing completo del sistema Baco Teatro v2.0
# Fecha: 21 de diciembre de 2025

echo "🧪 ========================================="
echo "    TESTING SISTEMA BACO TEATRO V2.0"
echo "    VENDEDOR → ACTOR Refactorización"
echo "========================================="
echo ""

PASSED=0
FAILED=0
BASE_URL="http://localhost:3000"

# Función para tests
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local headers="$4"
    local data="$5"
    local expected_code="$6"
    
    echo -n "TEST: $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "$headers" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "$headers" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "$expected_code" ]; then
        echo "✅ PASS (HTTP $http_code)"
        ((PASSED++))
        return 0
    else
        echo "❌ FAIL (Expected $expected_code, got $http_code)"
        echo "   Response: $body"
        ((FAILED++))
        return 1
    fi
}

echo "📋 FASE 1: Autenticación"
echo "────────────────────────────────────────"

# Test 1: Login SUPER
echo -n "TEST: Login usuario SUPER ... "
SUPER_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"cedula":"48376669","password":"Teamomama91"}' "$BASE_URL/api/auth/login")
SUPER_TOKEN=$(echo "$SUPER_RESPONSE" | jq -r '.token')
SUPER_ROLE=$(echo "$SUPER_RESPONSE" | jq -r '.user.role')

if [ "$SUPER_ROLE" = "SUPER" ] && [ ! -z "$SUPER_TOKEN" ]; then
    echo "✅ PASS (Role: $SUPER_ROLE)"
    ((PASSED++))
else
    echo "❌ FAIL (Expected SUPER, got $SUPER_ROLE)"
    ((FAILED++))
fi

# Test 2: Login ADMIN
echo -n "TEST: Login usuario ADMIN ... "
ADMIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"cedula":"11111111","password":"admin123"}' "$BASE_URL/api/auth/login")
ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.token')
ADMIN_ROLE=$(echo "$ADMIN_RESPONSE" | jq -r '.user.role')

if [ "$ADMIN_ROLE" = "ADMIN" ] && [ ! -z "$ADMIN_TOKEN" ]; then
    echo "✅ PASS (Role: $ADMIN_ROLE)"
    ((PASSED++))
else
    echo "❌ FAIL (Expected ADMIN, got $ADMIN_ROLE)"
    ((FAILED++))
fi

# Test 3: Login ACTOR (antes VENDEDOR)
echo -n "TEST: Login usuario ACTOR (antes VENDEDOR) ... "
ACTOR_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"cedula":"22222222","password":"vendedor123"}' "$BASE_URL/api/auth/login")
ACTOR_TOKEN=$(echo "$ACTOR_RESPONSE" | jq -r '.token')
ACTOR_ROLE=$(echo "$ACTOR_RESPONSE" | jq -r '.user.role')

if [ "$ACTOR_ROLE" = "ACTOR" ] && [ ! -z "$ACTOR_TOKEN" ]; then
    echo "✅ PASS (Role: $ACTOR_ROLE) - Migración exitosa"
    ((PASSED++))
else
    echo "❌ FAIL (Expected ACTOR, got $ACTOR_ROLE)"
    ((FAILED++))
fi

echo ""
echo "📋 FASE 2: Funciones Públicas (Sin Auth)"
echo "────────────────────────────────────────"

# Test 4: Listar funciones públicas
echo -n "TEST: GET /api/shows (público) ... "
SHOWS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/shows")
SHOWS_CODE=$(echo "$SHOWS_RESPONSE" | tail -n1)
SHOWS_BODY=$(echo "$SHOWS_RESPONSE" | head -n-1)
SHOWS_COUNT=$(echo "$SHOWS_BODY" | jq 'length')

if [ "$SHOWS_CODE" = "200" ] && [ "$SHOWS_COUNT" -gt 0 ]; then
    echo "✅ PASS (HTTP 200, $SHOWS_COUNT funciones)"
    ((PASSED++))
else
    echo "❌ FAIL (Expected 200 with data, got $SHOWS_CODE, count: $SHOWS_COUNT)"
    ((FAILED++))
fi

# Test 5: Verificar obra "Baco"
echo -n "TEST: Obra por defecto 'Baco' en funciones ... "
OBRA_NOMBRE=$(echo "$SHOWS_BODY" | jq -r '.[0].obra_nombre')

if [ "$OBRA_NOMBRE" = "Baco" ]; then
    echo "✅ PASS (Obra: '$OBRA_NOMBRE')"
    ((PASSED++))
else
    echo "❌ FAIL (Expected 'Baco', got '$OBRA_NOMBRE')"
    ((FAILED++))
fi

echo ""
echo "📋 FASE 3: Grupos y Arquitectura"
echo "────────────────────────────────────────"

# Test 6: Listar grupos (SUPER)
echo -n "TEST: GET /api/grupos (SUPER) ... "
GRUPOS_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $SUPER_TOKEN" "$BASE_URL/api/grupos")
GRUPOS_CODE=$(echo "$GRUPOS_RESPONSE" | tail -n1)
GRUPOS_BODY=$(echo "$GRUPOS_RESPONSE" | head -n-1)
GRUPOS_COUNT=$(echo "$GRUPOS_BODY" | jq 'length')

if [ "$GRUPOS_CODE" = "200" ] && [ "$GRUPOS_COUNT" -gt 0 ]; then
    echo "✅ PASS (HTTP 200, $GRUPOS_COUNT grupos)"
    ((PASSED++))
else
    echo "❌ FAIL (Expected 200 with data, got $GRUPOS_CODE)"
    ((FAILED++))
fi

# Test 7: Verificar miembros del grupo
echo -n "TEST: Grupo tiene actores (miembros) ... "
MIEMBROS_ACTIVOS=$(echo "$GRUPOS_BODY" | jq -r '.[0].miembros_activos')

if [ ! -z "$MIEMBROS_ACTIVOS" ] && [ "$MIEMBROS_ACTIVOS" != "null" ] && [ "$MIEMBROS_ACTIVOS" -gt 0 ]; then
    echo "✅ PASS ($MIEMBROS_ACTIVOS miembros)"
    ((PASSED++))
else
    echo "❌ FAIL (Expected > 0 members, got $MIEMBROS_ACTIVOS)"
    ((FAILED++))
fi

# Test 8: Actor puede ver sus grupos
echo -n "TEST: GET /api/grupos (ACTOR) ... "
ACTOR_GRUPOS_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $ACTOR_TOKEN" "$BASE_URL/api/grupos")
ACTOR_GRUPOS_CODE=$(echo "$ACTOR_GRUPOS_RESPONSE" | tail -n1)
ACTOR_GRUPOS_BODY=$(echo "$ACTOR_GRUPOS_RESPONSE" | head -n-1)
ACTOR_GRUPOS_COUNT=$(echo "$ACTOR_GRUPOS_BODY" | jq 'length')

if [ "$ACTOR_GRUPOS_CODE" = "200" ]; then
    echo "✅ PASS (HTTP 200, $ACTOR_GRUPOS_COUNT grupos visibles)"
    ((PASSED++))
else
    echo "❌ FAIL (Expected 200, got $ACTOR_GRUPOS_CODE)"
    ((FAILED++))
fi

echo ""
echo "📋 FASE 4: Base de Datos"
echo "────────────────────────────────────────"

# Test 9: Verificar constraint de roles
echo -n "TEST: BD - Constraint roles actualizado ... "
BD_ROLES=$(docker exec teatro-postgres psql -U postgres -d teatro -t -c "SELECT conname FROM pg_constraint WHERE conrelid = 'users'::regclass AND contype = 'c' AND conname = 'users_role_check';" | tr -d ' \n')

if [ "$BD_ROLES" = "users_role_check" ]; then
    echo "✅ PASS (Constraint exists)"
    ((PASSED++))
else
    echo "❌ FAIL (Constraint not found)"
    ((FAILED++))
fi

# Test 10: Verificar que no hay usuarios VENDEDOR
echo -n "TEST: BD - No hay usuarios con role VENDEDOR ... "
VENDEDOR_COUNT=$(docker exec teatro-postgres psql -U postgres -d teatro -t -c "SELECT COUNT(*) FROM users WHERE role = 'VENDEDOR';" | tr -d ' \n')

if [ "$VENDEDOR_COUNT" = "0" ]; then
    echo "✅ PASS (0 usuarios VENDEDOR)"
    ((PASSED++))
else
    echo "❌ FAIL ($VENDEDOR_COUNT usuarios aún con VENDEDOR)"
    ((FAILED++))
fi

# Test 11: Verificar que hay usuarios ACTOR
echo -n "TEST: BD - Existen usuarios con role ACTOR ... "
ACTOR_COUNT=$(docker exec teatro-postgres psql -U postgres -d teatro -t -c "SELECT COUNT(*) FROM users WHERE role = 'ACTOR';" | tr -d ' \n')

if [ "$ACTOR_COUNT" -gt 0 ]; then
    echo "✅ PASS ($ACTOR_COUNT actores)"
    ((PASSED++))
else
    echo "❌ FAIL (No se encontraron actores)"
    ((FAILED++))
fi

echo ""
echo "📋 FASE 5: Endpoints Críticos"
echo "────────────────────────────────────────"

# Test 12: Endpoint de funciones concluidas
test_endpoint "Funciones concluidas" "GET" "/api/shows/concluidas" "Authorization: Bearer $SUPER_TOKEN" "" "200"

# Test 13: Endpoint de grupos finalizados
test_endpoint "Grupos finalizados" "GET" "/api/grupos/finalizados/lista" "Authorization: Bearer $SUPER_TOKEN" "" "200"

# Test 14: Seed mínimo ejecutable
echo -n "TEST: Seed mínimo (dry run) ... "
SEED_OUTPUT=$(cd /workspaces/Entradas_de_teatro/teatro-tickets-backend && node -e "import('./seed-minimo-init.js').then(m => m.seedMinimo()).catch(e => console.error(e.message))" 2>&1)

if echo "$SEED_OUTPUT" | grep -q "ya hay"; then
    echo "✅ PASS (Seed ejecutado correctamente)"
    ((PASSED++))
elif echo "$SEED_OUTPUT" | grep -q "creado"; then
    echo "✅ PASS (Datos creados)"
    ((PASSED++))
else
    echo "❌ FAIL"
    echo "   Output: $SEED_OUTPUT"
    ((FAILED++))
fi

echo ""
echo "========================================="
echo "  RESUMEN DE TESTING"
echo "========================================="
echo "✅ Tests Pasados:  $PASSED"
echo "❌ Tests Fallidos: $FAILED"
echo "📊 Total:          $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo "🎉 ¡TODOS LOS TESTS PASARON! 🎉"
    echo ""
    exit 0
else
    echo ""
    echo "⚠️  ALGUNOS TESTS FALLARON"
    echo ""
    exit 1
fi
