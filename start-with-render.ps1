# Script PowerShell para iniciar el proyecto usando la base de datos de Render

Write-Host "🚀 Iniciando catálogo de productos con base de datos de Render..." -ForegroundColor Cyan

# Verificar que existe el archivo .env
if (-not (Test-Path .env)) {
    Write-Host "⚠️  Archivo .env no encontrado" -ForegroundColor Yellow
    Write-Host "📝 Creando .env desde env.example..." -ForegroundColor Yellow
    Copy-Item env.example .env
    Write-Host ""
    Write-Host "❌ Por favor, edita el archivo .env y configura tu DATABASE_URL de Render" -ForegroundColor Red
    Write-Host "   Luego ejecuta este script nuevamente" -ForegroundColor Red
    exit 1
}

# Verificar que DATABASE_URL está configurada
$envContent = Get-Content .env -Raw
if (-not $envContent -match "DATABASE_URL\s*=" -or $envContent -match "#\s*DATABASE_URL") {
    Write-Host "⚠️  DATABASE_URL no está configurada en .env" -ForegroundColor Yellow
    Write-Host "   Por favor, edita .env y descomenta/configura DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Configuración encontrada" -ForegroundColor Green
Write-Host "📦 Iniciando servicios con docker-compose.render.yml..." -ForegroundColor Cyan
Write-Host ""

docker-compose -f docker-compose.render.yml up --build -d

Write-Host ""
Write-Host "✅ Servicios iniciados" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Para ver los logs:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.render.yml logs -f api"
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "🔌 API: http://localhost:3001" -ForegroundColor Green
Write-Host ""

