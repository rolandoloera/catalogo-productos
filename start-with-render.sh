#!/bin/bash

# Script para iniciar el proyecto usando la base de datos de Render

echo "🚀 Iniciando catálogo de productos con base de datos de Render..."

# Verificar que existe el archivo .env
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado"
    echo "📝 Creando .env desde env.example..."
    cp env.example .env
    echo ""
    echo "❌ Por favor, edita el archivo .env y configura tu DATABASE_URL de Render"
    echo "   Luego ejecuta este script nuevamente"
    exit 1
fi

# Verificar que DATABASE_URL está configurada
if ! grep -q "DATABASE_URL=" .env || grep -q "^#.*DATABASE_URL" .env; then
    echo "⚠️  DATABASE_URL no está configurada en .env"
    echo "   Por favor, edita .env y descomenta/configura DATABASE_URL"
    exit 1
fi

echo "✅ Configuración encontrada"
echo "📦 Iniciando servicios con docker-compose.render.yml..."
echo ""

docker-compose -f docker-compose.render.yml up --build -d

echo ""
echo "✅ Servicios iniciados"
echo ""
echo "📋 Para ver los logs:"
echo "   docker-compose -f docker-compose.render.yml logs -f api"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo ""

