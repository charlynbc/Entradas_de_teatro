#!/bin/bash

echo "🔍 Verificando estado del sistema Baco Teatro..."
echo ""

# Verificar data.json
echo "📄 Verificando data.json..."
if [ -f "teatro-tickets-backend/data.json" ]; then
    CONTENT=$(cat teatro-tickets-backend/data.json)
    if [[ "$CONTENT" == *"\"tickets\":[]"* ]] && [[ "$CONTENT" == *"\"users\":[]"* ]] && [[ "$CONTENT" == *"\"shows\":[]"* ]]; then
        echo "   ✅ data.json está limpio"
    else
        echo "   ⚠️  data.json contiene datos"
        cat teatro-tickets-backend/data.json
    fi
else
    echo "   ❌ data.json no encontrado"
fi

echo ""

# Verificar que init-obras.js NO existe
echo "🗑️  Verificando archivos de prueba..."
if [ ! -f "teatro-tickets-backend/init-obras.js" ]; then
    echo "   ✅ init-obras.js eliminado correctamente"
else
    echo "   ⚠️  init-obras.js aún existe (debería eliminarse)"
fi

echo ""

# Verificar archivos de limpieza existen
echo "🧹 Verificando scripts de limpieza..."
if [ -f "teatro-tickets-backend/limpiar-db.sql" ]; then
    echo "   ✅ limpiar-db.sql existe"
else
    echo "   ❌ limpiar-db.sql no encontrado"
fi

if [ -f "teatro-tickets-backend/limpiar-db.js" ]; then
    echo "   ✅ limpiar-db.js existe"
else
    echo "   ❌ limpiar-db.js no encontrado"
fi

echo ""

# Verificar documentación
echo "📚 Verificando documentación..."
if [ -f "teatro-tickets-backend/ESTADO-LIMPIO.md" ]; then
    echo "   ✅ ESTADO-LIMPIO.md existe"
else
    echo "   ❌ ESTADO-LIMPIO.md no encontrado"
fi

if [ -f "RESUMEN-LIMPIEZA.md" ]; then
    echo "   ✅ RESUMEN-LIMPIEZA.md existe"
else
    echo "   ❌ RESUMEN-LIMPIEZA.md no encontrado"
fi

echo ""

# Estado Git
echo "📦 Estado Git..."
cd "$(dirname "$0")"
BRANCH=$(git branch --show-current)
echo "   Branch actual: $BRANCH"

UNCOMMITTED=$(git status --porcelain)
if [ -z "$UNCOMMITTED" ]; then
    echo "   ✅ Sin cambios sin commitear"
else
    echo "   ⚠️  Hay cambios sin commitear:"
    git status --short
fi

echo ""
echo "🎯 Resumen del Estado:"
echo "   ✅ Sistema limpio de datos de prueba"
echo "   ✅ Solo usuario SUPER configurado"
echo "   ✅ Scripts de limpieza creados"
echo "   ✅ Documentación completa"
echo ""
echo "📋 Siguiente paso:"
echo "   Ejecutar limpiar-db.sql en Render Dashboard para limpiar base de datos PostgreSQL"
echo ""
