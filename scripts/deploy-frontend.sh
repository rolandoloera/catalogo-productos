#!/bin/bash

# Script para desplegar Frontend Service a Google Cloud Run
# Uso: ./deploy-frontend.sh [API_URL] [PROYECTO_ID] [REGION]

API_URL=${1:-"http://localhost:3001"}
PROYECTO_ID=${2:-"TU_PROYECTO_ID"}
REGION=${3:-"us-central1"}

if [ "$API_URL" == "http://localhost:3001" ]; then
  echo "⚠️  ADVERTENCIA: Estás usando localhost como API_URL"
  echo "   Para producción, usa la URL del API desplegado en Cloud Run"
  echo "   Ejemplo: https://catalogo-productos-api-xxxxx-uc.a.run.app"
  echo ""
  read -p "¿Continuar de todas formas? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "🚀 Desplegando Frontend Service a Google Cloud Run..."
echo "📋 Proyecto: $PROYECTO_ID"
echo "🌍 Región: $REGION"
echo "🔗 API URL: $API_URL"
echo ""

cd services/frontend

gcloud run deploy catalogo-productos-frontend \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars API_URL=$API_URL \
  --project $PROYECTO_ID

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Frontend Service desplegado exitosamente!"
  echo "📋 Obtén la URL con: gcloud run services describe catalogo-productos-frontend --region $REGION --format 'value(status.url)'"
else
  echo ""
  echo "❌ Error al desplegar Frontend Service"
  exit 1
fi

