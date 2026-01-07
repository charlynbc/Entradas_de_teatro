#!/bin/bash
TOKEN=$(curl -s http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cedula":"48376669","password":"Teamomama91"}' | jq -r '.token')

curl -s http://localhost:3000/api/grupos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  -d "{
    \"nombre\": \"Grupo Test $(date +%s)\",
    \"obra\": \"Obra Test\",
    \"fecha_inicio\": \"2025-02-01\",
    \"fecha_fin\": \"2025-03-31\",
    \"horarios\": \"Lunes 18:00\"
  }" | jq .
