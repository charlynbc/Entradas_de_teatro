#!/bin/bash

echo "🎭 Sistema de Venta de Entradas de Teatro"
echo "=========================================="
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias..."
pip install -q Flask

echo ""
echo "🚀 Iniciando aplicación..."
echo ""
echo "✅ La aplicación estará disponible en: http://localhost:5000"
echo ""
echo "👤 Usuarios de prueba:"
echo "   🔴 Super Usuario: superuser@teatro.com / super123"
echo "   🔵 Director: director@teatro.com / director123"
echo "   🟢 Actor: actor@teatro.com / actor123"
echo "   ⚪ Cliente: cliente@teatro.com / cliente123"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo "=========================================="
echo ""

# Ejecutar la aplicación
python app.py
