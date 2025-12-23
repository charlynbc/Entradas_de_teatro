#!/bin/bash

echo "🎭 Iniciando Baco Teatro..."
echo ""

# Verificar si PostgreSQL está corriendo en Docker
if ! docker ps | grep -q teatro-postgres; then
    echo "📦 PostgreSQL no está corriendo. Iniciando contenedor..."
    docker start teatro-postgres 2>/dev/null || \
    docker run -d --name teatro-postgres \
        -e POSTGRES_PASSWORD=postgres \
        -e POSTGRES_DB=teatro \
        -p 5433:5432 \
        postgres:16-alpine
    echo "⏳ Esperando a que PostgreSQL esté listo..."
    sleep 5
else
    echo "✅ PostgreSQL ya está corriendo"
fi

# Verificar conexión a la base de datos
echo "🔌 Verificando conexión a la base de datos..."
if PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d teatro -c "SELECT 1" >/dev/null 2>&1; then
    echo "✅ Conexión a base de datos OK"
else
    echo "❌ Error conectando a la base de datos"
    exit 1
fi

# Detener servidor anterior si existe
echo "🛑 Deteniendo servidor anterior si existe..."
pkill -f "node index-v3-postgres.js" 2>/dev/null || true
sleep 1

# Iniciar servidor
cd /workspaces/Entradas_de_teatro/teatro-tickets-backend
echo "🚀 Iniciando servidor backend..."
nohup node index-v3-postgres.js > /tmp/backend.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > /tmp/backend.pid

# Esperar a que el servidor esté listo
echo "⏳ Esperando a que el servidor esté listo..."
for i in {1..10}; do
    if curl -s http://localhost:3000/health >/dev/null 2>&1; then
        echo ""
        echo "✅ ¡Servidor iniciado correctamente!"
        echo ""
        echo "📊 URLs disponibles:"
        echo "   🏠 Frontend: http://localhost:3000"
        echo "   🔌 API: http://localhost:3000/api"
        echo "   💚 Health: http://localhost:3000/health"
        echo ""
        echo "👤 Usuario Super:"
        echo "   📱 Teléfono/Cédula: 48376669"
        echo "   🔑 Contraseña: admin123"
        echo ""
        echo "📝 Para ver logs: tail -f /tmp/backend.log"
        echo "🛑 Para detener: pkill -f 'node index-v3-postgres.js'"
        exit 0
    fi
    sleep 1
done

echo ""
echo "❌ Error: El servidor no responde"
echo "📝 Revisa los logs: tail -f /tmp/backend.log"
exit 1
