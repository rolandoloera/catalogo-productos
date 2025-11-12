# Script para subir cambios a GitHub
# Uso: .\scripts\subir-cambios-github.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  📤 SUBIR CAMBIOS A GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la carpeta correcta
if (-not (Test-Path "services\api\package.json")) {
    Write-Host "❌ Error: No estás en la carpeta del proyecto" -ForegroundColor Red
    exit 1
}

# Verificar estado
Write-Host "📋 Verificando cambios..." -ForegroundColor Yellow
git status --short

Write-Host ""
$continuar = Read-Host "¿Deseas continuar y subir estos cambios? (S/N)"
if ($continuar -ne "S" -and $continuar -ne "s") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    exit 0
}

# Agregar todos los archivos
Write-Host ""
Write-Host "➕ Agregando archivos..." -ForegroundColor Yellow
git add .

# Verificar qué se agregó
$archivos = git status --short
if ($archivos) {
    Write-Host "✅ Archivos agregados:" -ForegroundColor Green
    $archivos | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "⚠️  No hay cambios para agregar" -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Hacer commit
Write-Host "💾 Creando commit..." -ForegroundColor Yellow
$mensaje = "Corregir render.yaml y agregar guías de despliegue en Render

- Corregir render.yaml: eliminar tipo 'pg' no soportado
- Agregar guía paso a paso para desplegar en Render
- Actualizar README.md con información sobre Render
- Mejorar .gitignore y agregar scripts útiles
- Actualizar database.js para soportar DATABASE_URL de Render"

git commit -m $mensaje

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit creado exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al crear commit" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar remote
$remote = git remote -v
if (-not $remote) {
    Write-Host "❌ No hay remote configurado" -ForegroundColor Red
    Write-Host "   Configura el remote primero:" -ForegroundColor Yellow
    Write-Host "   git remote add origin https://github.com/USUARIO/REPOSITORIO.git" -ForegroundColor White
    exit 1
}

Write-Host "🔗 Remote configurado:" -ForegroundColor Yellow
$remote | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }

Write-Host ""

# Hacer push
Write-Host "🚀 Subiendo cambios a GitHub..." -ForegroundColor Yellow
Write-Host "   (Puede pedirte autenticación)" -ForegroundColor Gray
Write-Host ""

git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ ¡CAMBIOS SUBIDOS EXITOSAMENTE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Ve a tu repositorio para verificar:" -ForegroundColor Cyan
    $remoteUrl = (git remote get-url origin) -replace '\.git$', ''
    Write-Host "   $remoteUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Próximo paso: Desplegar en Render.com" -ForegroundColor Yellow
    Write-Host "   Sigue la guía en: DEPLOY-RENDER-PASO-A-PASO.md" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Error al subir cambios" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "  1. Verifica tus credenciales de GitHub" -ForegroundColor White
    Write-Host "  2. Usa un Personal Access Token si te pide autenticación" -ForegroundColor White
    Write-Host "  3. Verifica que tengas permisos en el repositorio" -ForegroundColor White
    Write-Host ""
    Write-Host "Para más ayuda, lee: GITHUB-SETUP.md" -ForegroundColor Cyan
}

Write-Host ""

