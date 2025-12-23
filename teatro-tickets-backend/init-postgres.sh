#!/bin/bash

echo "🔧 Inicializando PostgreSQL..."

# Detener PostgreSQL si está corriendo
service postgresql stop 2>/dev/null || true

# Inicializar el cluster de PostgreSQL si no existe
if [ ! -d "/var/lib/postgresql/16/main" ]; then
    echo "📁 Creando cluster de PostgreSQL..."
    /usr/lib/postgresql/16/bin/initdb -D /var/lib/postgresql/16/main
fi

# Modificar pg_hba.conf para permitir autenticación trust
echo "🔑 Configurando autenticación..."
cat > /etc/postgresql/16/main/pg_hba.conf << 'EOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
EOF

# Iniciar PostgreSQL
echo "▶️ Iniciando PostgreSQL..."
service postgresql start

# Esperar a que PostgreSQL esté listo
sleep 2

# Crear rol codespace
echo "👤 Creando usuario codespace..."
psql -U postgres -c "CREATE ROLE codespace WITH SUPERUSER LOGIN;" 2>/dev/null || echo "Usuario codespace ya existe"

# Crear base de datos teatro
echo "🗄️ Creando base de datos teatro..."
psql -U postgres -c "DROP DATABASE IF EXISTS teatro;" 2>/dev/null || true
psql -U postgres -c "CREATE DATABASE teatro;" 2>/dev/null || echo "Base de datos teatro ya existe"

# Configurar permisos
echo "🔐 Configurando permisos..."
psql -U postgres -c "ALTER DATABASE teatro OWNER TO codespace;"

echo "✅ PostgreSQL inicializado correctamente"
