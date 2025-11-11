#!/bin/bash

# Script para desplegar API Service a Google Cloud Run
# Uso: ./deploy-api.sh [PROYECTO_ID] [REGION]

PROYECTO_ID=${1:-"TU_PROYECTO_ID"}
REGION=${2:-"us-central1"}

echo "🚀 Desplegando API Service a Google Cloud Run..."
echo "📋 Proyecto: $PROYECTO_ID"
echo "🌍 Región: $REGION"
echo ""

cd services/api

gcloud run deploy catalogo-productos-api \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3001 \
  --set-env-vars API_VERSION=v1 \
  --project $PROYECTO_ID

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ API Service desplegado exitosamente!"
  echo "📋 Obtén la URL con: gcloud run services describe catalogo-productos-api --region $REGION --format 'value(status.url)'"
else
  echo ""
  echo "❌ Error al desplegar API Service"
  exit 1
fi

