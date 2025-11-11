#!/bin/bash

# Script para desplegar ambos servicios a Google Cloud Run
# Uso: ./deploy-all.sh [PROYECTO_ID] [REGION]

PROYECTO_ID=${1:-"TU_PROYECTO_ID"}
REGION=${2:-"us-central1"}

echo "🚀 Desplegando todos los servicios a Google Cloud Run..."
echo "📋 Proyecto: $PROYECTO_ID"
echo "🌍 Región: $REGION"
echo ""

# Paso 1: Desplegar API
echo "📦 Paso 1/2: Desplegando API Service..."
./scripts/deploy-api.sh $PROYECTO_ID $REGION

if [ $? -ne 0 ]; then
  echo "❌ Error al desplegar API. Abortando."
  exit 1
fi

# Obtener URL del API
API_URL=$(gcloud run services describe catalogo-productos-api \
  --region $REGION \
  --project $PROYECTO_ID \
  --format 'value(status.url)')

echo ""
echo "🔗 API URL: $API_URL"
echo ""

# Paso 2: Desplegar Frontend
echo "📦 Paso 2/2: Desplegando Frontend Service..."
./scripts/deploy-frontend.sh $API_URL $PROYECTO_ID $REGION

if [ $? -eq 0 ]; then
  FRONTEND_URL=$(gcloud run services describe catalogo-productos-frontend \
    --region $REGION \
    --project $PROYECTO_ID \
    --format 'value(status.url)')
  
  echo ""
  echo "✅ ¡Despliegue completado exitosamente!"
  echo ""
  echo "📋 URLs de los servicios:"
  echo "   API:      $API_URL"
  echo "   Frontend: $FRONTEND_URL"
  echo ""
  echo "🌐 Abre el frontend en tu navegador: $FRONTEND_URL"
else
  echo ""
  echo "❌ Error al desplegar Frontend"
  exit 1
fi

