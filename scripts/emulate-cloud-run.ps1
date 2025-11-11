# Script PowerShell para emular Cloud Run localmente usando Docker
# Esto ejecuta los servicios exactamente como lo haría Cloud Run

Write-Host "🐳 Emulando Cloud Run localmente..." -ForegroundColor Cyan
Write-Host ""

# Construir imágenes
Write-Host "📦 Construyendo imágenes Docker..." -ForegroundColor Yellow
docker build -t catalogo-productos-api ./services/api
docker build -t catalogo-productos-frontend ./services/frontend

Write-Host ""
Write-Host "🚀 Iniciando servicios..." -ForegroundColor Yellow

# Detener contenedores existentes si existen
Write-Host "🛑 Deteniendo contenedores existentes..." -ForegroundColor Gray
docker stop catalogo-productos-api 2>$null
docker stop catalogo-productos-frontend 2>$null
docker rm catalogo-productos-api 2>$null
docker rm catalogo-productos-frontend 2>$null

# Iniciar API
Write-Host "📦 Iniciando API Service (puerto 3001)..." -ForegroundColor Green
docker run -d `
  --name catalogo-productos-api `
  -p 3001:3001 `
  -e PORT=3001 `
  -e API_VERSION=v1 `
  catalogo-productos-api

# Esperar un momento para que el API inicie
Start-Sleep -Seconds 2

# Iniciar Frontend
Write-Host "📦 Iniciando Frontend Service (puerto 3000)..." -ForegroundColor Green
docker run -d `
  --name catalogo-productos-frontend `
  -p 3000:3000 `
  -e PORT=3000 `
  -e API_URL=http://localhost:3001 `
  catalogo-productos-frontend

Write-Host ""
Write-Host "✅ Servicios iniciados!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 URLs:" -ForegroundColor Cyan
Write-Host "   API:      http://localhost:3001" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📊 Ver logs:" -ForegroundColor Cyan
Write-Host "   docker logs -f catalogo-productos-api" -ForegroundColor Gray
Write-Host "   docker logs -f catalogo-productos-frontend" -ForegroundColor Gray
Write-Host ""
Write-Host "🛑 Detener servicios:" -ForegroundColor Cyan
Write-Host "   docker stop catalogo-productos-api catalogo-productos-frontend" -ForegroundColor Gray
Write-Host "   docker rm catalogo-productos-api catalogo-productos-frontend" -ForegroundColor Gray

