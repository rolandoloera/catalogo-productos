# Script para subir código a GitHub
# Uso: .\scripts\subir-github.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  📤 SUBIR CÓDIGO A GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si estamos en la carpeta correcta
if (-not (Test-Path "services\api\package.json")) {
    Write-Host "❌ Error: No estás en la carpeta del proyecto" -ForegroundColor Red
    Write-Host "   Ejecuta este script desde: C:\Bitbucket\test_loera\catalogo-productos" -ForegroundColor Yellow
    exit 1
}

# Verificar si Git está instalado
try {
    $gitVersion = git --version
    Write-Host "✅ Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Git no está instalado" -ForegroundColor Red
    Write-Host "   Descarga Git desde: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Paso 1: Inicializar Git (si no está inicializado)
if (-not (Test-Path ".git")) {
    Write-Host "📦 Inicializando repositorio Git..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Repositorio Git inicializado" -ForegroundColor Green
} else {
    Write-Host "✅ Repositorio Git ya está inicializado" -ForegroundColor Green
}

Write-Host ""

# Paso 2: Verificar estado
Write-Host "📋 Verificando archivos..." -ForegroundColor Yellow
git status --short

Write-Host ""
$continuar = Read-Host "¿Deseas continuar y agregar todos los archivos? (S/N)"
if ($continuar -ne "S" -and $continuar -ne "s") {
    Write-Host "❌ Operación cancelada" -ForegroundColor Red
    exit 0
}

# Paso 3: Agregar archivos
Write-Host ""
Write-Host "➕ Agregando archivos al staging..." -ForegroundColor Yellow
git add .

# Verificar qué se agregó
$archivosAgregados = git status --short | Measure-Object -Line
Write-Host "✅ $($archivosAgregados.Lines) archivos agregados" -ForegroundColor Green

Write-Host ""

# Paso 4: Hacer commit
Write-Host "💾 Creando commit..." -ForegroundColor Yellow
$mensajeCommit = Read-Host "Mensaje del commit (Enter para usar mensaje por defecto)"
if ([string]::IsNullOrWhiteSpace($mensajeCommit)) {
    $mensajeCommit = "Initial commit: Catálogo de productos con microservicios"
}

git commit -m $mensajeCommit

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit creado exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al crear commit" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 5: Configurar remote (si no existe)
$remoteExists = git remote -v | Select-String "origin"
if (-not $remoteExists) {
    Write-Host "🔗 Configurando conexión con GitHub..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "IMPORTANTE: Primero crea el repositorio en GitHub:" -ForegroundColor Yellow
    Write-Host "  1. Ve a https://github.com/new" -ForegroundColor Cyan
    Write-Host "  2. Crea un nuevo repositorio (NO inicialices con README)" -ForegroundColor Cyan
    Write-Host "  3. Copia la URL del repositorio" -ForegroundColor Cyan
    Write-Host ""
    
    $repoUrl = Read-Host "Pega la URL de tu repositorio de GitHub (ej: https://github.com/usuario/catalogo-productos.git)"
    
    if ([string]::IsNullOrWhiteSpace($repoUrl)) {
        Write-Host "❌ URL no proporcionada. Configura el remote manualmente:" -ForegroundColor Red
        Write-Host "   git remote add origin https://github.com/USUARIO/REPOSITORIO.git" -ForegroundColor Yellow
        exit 1
    }
    
    git remote add origin $repoUrl
    Write-Host "✅ Remote configurado: $repoUrl" -ForegroundColor Green
} else {
    Write-Host "✅ Remote ya está configurado" -ForegroundColor Green
    git remote -v
}

Write-Host ""

# Paso 6: Cambiar a rama main
Write-Host "🌿 Configurando rama main..." -ForegroundColor Yellow
git branch -M main
Write-Host "✅ Rama configurada como 'main'" -ForegroundColor Green

Write-Host ""

# Paso 7: Push a GitHub
Write-Host "🚀 Subiendo código a GitHub..." -ForegroundColor Yellow
Write-Host "   (Puede pedirte autenticación)" -ForegroundColor Gray
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ ¡CÓDIGO SUBIDO EXITOSAMENTE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Ve a tu repositorio en GitHub para verificar" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Próximo paso: Desplegar en Render.com" -ForegroundColor Yellow
    Write-Host "   Sigue la guía en: DEPLOY-RENDER.md" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Error al subir código" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "  1. Verifica que el repositorio exista en GitHub" -ForegroundColor White
    Write-Host "  2. Verifica tus credenciales de GitHub" -ForegroundColor White
    Write-Host "  3. Usa un Personal Access Token si te pide autenticación" -ForegroundColor White
    Write-Host ""
    Write-Host "Para más ayuda, lee: GITHUB-SETUP.md" -ForegroundColor Cyan
}

Write-Host ""

