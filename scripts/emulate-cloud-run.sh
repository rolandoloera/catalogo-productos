#!/bin/bash

# Script para emular Cloud Run localmente usando Docker
# Esto ejecuta los servicios exactamente como lo haría Cloud Run

echo "🐳 Emulando Cloud Run localmente..."
echo ""

# Construir imágenes
echo "📦 Construyendo imágenes Docker..."
docker build -t catalogo-productos-api ./services/api
docker build -t catalogo-productos-frontend ./services/frontend

echo ""
echo "🚀 Iniciando servicios..."

# Detener contenedores existentes si existen
docker stop catalogo-productos-api catalogo-productos-frontend 2>/dev/null
docker rm catalogo-productos-api catalogo-productos-frontend 2>/dev/null

# Iniciar API
echo "📦 Iniciando API Service (puerto 3001)..."
docker run -d \
  --name catalogo-productos-api \
  -p 3001:3001 \
  -e PORT=3001 \
  -e API_VERSION=v1 \
  catalogo-productos-api

# Esperar un momento para que el API inicie
sleep 2

# Iniciar Frontend
echo "📦 Iniciando Frontend Service (puerto 3000)..."
docker run -d \
  --name catalogo-productos-frontend \
  -p 3000:3000 \
  -e PORT=3000 \
  -e API_URL=http://localhost:3001 \
  --link catalogo-productos-api:api \
  catalogo-productos-frontend

echo ""
echo "✅ Servicios iniciados!"
echo ""
echo "📋 URLs:"
echo "   API:      http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo ""
echo "📊 Ver logs:"
echo "   docker logs -f catalogo-productos-api"
echo "   docker logs -f catalogo-productos-frontend"
echo ""
echo "🛑 Detener servicios:"
echo "   docker stop catalogo-productos-api catalogo-productos-frontend"
echo "   docker rm catalogo-productos-api catalogo-productos-frontend"

