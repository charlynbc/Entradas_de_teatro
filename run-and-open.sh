#!/bin/bash

# 🎭 BACO TEATRO - Script de Ejecución + Abrir Navegador
# Ejecuta todo y abre automáticamente http://localhost:8081

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Ejecutar el script principal
"$PROJECT_DIR/run-all.sh" &
RUN_PID=$!

# Esperar a que el frontend esté listo
echo ""
echo "⏳ Esperando a que el Frontend esté listo..."
for i in {1..30}; do
    if curl -s http://localhost:8081 >/dev/null 2>&1; then
        echo "✅ Frontend está listo!"
        
        # Determinar comando para abrir navegador según el OS
        if command -v xdg-open >/dev/null; then
            # Linux
            xdg-open "http://localhost:8081" &
        elif command -v open >/dev/null; then
            # macOS
            open "http://localhost:8081"
        elif command -v "$BROWSER" >/dev/null; then
            # Usar variable BROWSER si está disponible
            "$BROWSER" "http://localhost:8081" &
        fi
        
        break
    fi
    sleep 1
done

wait $RUN_PID
