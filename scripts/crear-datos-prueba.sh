#!/bin/bash

echo "=== CREANDO DATOS DE PRUEBA BACO ==="
echo ""

# Login como super
echo "1. Autenticando como super usuario..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula": "48376669", "password": "Teamomama91"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No se pudo obtener el token"
  exit 1
fi

echo "✅ Autenticado"
echo ""

# Crear Director 1
echo "2. Creando director: María García..."
curl -s -X POST http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "12345678",
    "rol": "director",
    "nombre": "María",
    "apellido": "García",
    "fecha_nacimiento": "1985-03-15",
    "celular": "+598 99 123 456",
    "descripcion": "Directora con 10 años de experiencia"
  }' | python3 -m json.tool 2>/dev/null | head -5 || echo "Director creado"

echo ""

# Crear Director 2
echo "3. Creando director: Juan Pérez..."
curl -s -X POST http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "23456789",
    "rol": "director",
    "nombre": "Juan",
    "apellido": "Pérez",
    "fecha_nacimiento": "1990-07-22",
    "celular": "+598 99 234 567",
    "descripcion": "Director especializado en teatro clásico"
  }' | python3 -m json.tool 2>/dev/null | head -5 || echo "Director creado"

echo ""

# Crear Actor 1
echo "4. Creando actor: Ana Martínez..."
curl -s -X POST http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "34567890",
    "rol": "actor",
    "nombre": "Ana",
    "apellido": "Martínez",
    "fecha_nacimiento": "2000-01-08",
    "celular": "+598 99 345 678",
    "descripcion": "Actriz joven con mucho talento"
  }' | python3 -m json.tool 2>/dev/null | head -5 || echo "Actor creado"

echo ""

# Crear Actor 2
echo "5. Creando actor: Carlos Rodríguez..."
curl -s -X POST http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "45678901",
    "rol": "actor",
    "nombre": "Carlos",
    "apellido": "Rodríguez",
    "fecha_nacimiento": "1998-11-30",
    "celular": "+598 99 456 789",
    "descripcion": "Actor versátil"
  }' | python3 -m json.tool 2>/dev/null | head -5 || echo "Actor creado"

echo ""

# Crear Actor 3
echo "6. Creando actor: Laura Fernández..."
curl -s -X POST http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "56789012",
    "rol": "actor",
    "nombre": "Laura",
    "apellido": "Fernández",
    "fecha_nacimiento": "1995-05-20",
    "celular": "+598 99 567 890",
    "descripcion": "Actriz de teatro musical"
  }' | python3 -m json.tool 2>/dev/null | head -5 || echo "Actor creado"

echo ""

# Listar todos los usuarios
echo "7. Verificando usuarios creados..."
curl -s -X GET http://localhost:3000/api/usuarios \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'Total usuarios: {len(data)}')
    for u in data:
        print(f'  - {u[\"nombre\"]} {u[\"apellido\"]} ({u[\"rol\"]}) - CI: {u[\"cedula\"]}')
except:
    pass
"

echo ""
echo "=== DATOS DE PRUEBA CREADOS ==="
echo ""
echo "Credenciales por defecto para todos: password='admin'"
echo ""
echo "Usuarios creados:"
echo "  - Super: Charly Barrios (48376669) - password: Teamomama91"
echo "  - Director: María García (12345678) - password: admin"
echo "  - Director: Juan Pérez (23456789) - password: admin"
echo "  - Actor: Ana Martínez (34567890) - ¡CUMPLE HOY!"
echo "  - Actor: Carlos Rodríguez (45678901)"
echo "  - Actor: Laura Fernández (56789012)"
