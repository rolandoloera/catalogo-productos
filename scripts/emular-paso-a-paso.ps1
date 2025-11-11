# Script Paso a Paso para Emular Cloud Run Localmente
# Explica cada comando como si fuera para un examen de certificación

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EMULAR CLOUD RUN LOCALMENTE          " -ForegroundColor Cyan
Write-Host "  Guía Educativa Paso a Paso           " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# INTRODUCCIÓN
# ============================================
Write-Host "📚 INTRODUCCIÓN" -ForegroundColor Yellow
Write-Host ""
Write-Host "¿Por qué emular Cloud Run localmente?" -ForegroundColor Gray
Write-Host "  ✅ Ahorrar costos (no pagas por pruebas)" -ForegroundColor Green
Write-Host "  ✅ Desarrollo rápido (pruebas instantáneas)" -ForegroundColor Green
Write-Host "  ✅ Debugging fácil (logs inmediatos)" -ForegroundColor Green
Write-Host "  ✅ Misma configuración que Cloud Run" -ForegroundColor Green
Write-Host "  ✅ Aprender cómo funciona Cloud Run" -ForegroundColor Green
Write-Host ""

# ============================================
# PASO 1: VERIFICAR DOCKER
# ============================================
Write-Host "🐳 PASO 1: VERIFICAR DOCKER" -ForegroundColor Yellow
Write-Host ""

Write-Host "1.1 Verificar que Docker está instalado..." -ForegroundColor Gray
Write-Host "   ¿Por qué? Cloud Run ejecuta contenedores Docker" -ForegroundColor DarkGray
Write-Host "   Comando: docker --version" -ForegroundColor White
$dockerVersion = docker --version 2>$null
if ($dockerVersion) {
    Write-Host "   ✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Docker no encontrado. Instala Docker Desktop primero." -ForegroundColor Red
    Write-Host "   Descarga desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

Write-Host "1.2 Verificar que Docker está ejecutándose..." -ForegroundColor Gray
Write-Host "   Comando: docker ps" -ForegroundColor White
try {
    docker ps | Out-Null
    Write-Host "   ✅ Docker está ejecutándose" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker no está ejecutándose. Inicia Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host ""

# ============================================
# PASO 2: ENTENDER DOCKERFILE
# ============================================
Write-Host "📄 PASO 2: ENTENDER DOCKERFILE" -ForegroundColor Yellow
Write-Host ""

Write-Host "2.1 ¿Qué es un Dockerfile?" -ForegroundColor Gray
Write-Host "   Un Dockerfile es un archivo con instrucciones para construir una imagen Docker" -ForegroundColor DarkGray
Write-Host "   Ubicación: services/api/Dockerfile" -ForegroundColor White
Write-Host ""

Write-Host "2.2 Ver el Dockerfile del API..." -ForegroundColor Gray
$dockerfilePath = "services/api/Dockerfile"
if (Test-Path $dockerfilePath) {
    Write-Host "   ✅ Dockerfile encontrado" -ForegroundColor Green
    Write-Host "   Contenido:" -ForegroundColor White
    Get-Content $dockerfilePath | ForEach-Object {
        Write-Host "   $_" -ForegroundColor DarkGray
    }
    Write-Host ""
    Write-Host "   Explicación breve:" -ForegroundColor DarkGray
    Write-Host "   - FROM: Imagen base (Node.js)" -ForegroundColor DarkGray
    Write-Host "   - WORKDIR: Directorio de trabajo" -ForegroundColor DarkGray
    Write-Host "   - COPY: Copiar archivos" -ForegroundColor DarkGray
    Write-Host "   - RUN: Ejecutar comandos" -ForegroundColor DarkGray
    Write-Host "   - ENV: Variables de entorno" -ForegroundColor DarkGray
    Write-Host "   - CMD: Comando al iniciar" -ForegroundColor DarkGray
} else {
    Write-Host "   ❌ Dockerfile no encontrado" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ============================================
# PASO 3: CONSTRUIR LA IMAGEN DOCKER
# ============================================
Write-Host "🔨 PASO 3: CONSTRUIR LA IMAGEN DOCKER" -ForegroundColor Yellow
Write-Host ""

Write-Host "3.1 ¿Qué es construir una imagen?" -ForegroundColor Gray
Write-Host "   Construir una imagen significa ejecutar las instrucciones del Dockerfile" -ForegroundColor DarkGray
Write-Host "   para crear una imagen Docker que podemos usar para crear contenedores." -ForegroundColor DarkGray
Write-Host ""

Write-Host "3.2 Navegar al directorio del API..." -ForegroundColor Gray
Write-Host "   ¿Por qué? Necesitamos estar en el directorio con el Dockerfile" -ForegroundColor DarkGray
Set-Location services/api
Write-Host "   ✅ Directorio actual: $(Get-Location)" -ForegroundColor Green
Write-Host ""

Write-Host "3.3 Construir la imagen..." -ForegroundColor Gray
Write-Host "   Comando: docker build -t catalogo-productos-api ." -ForegroundColor White
Write-Host "   Explicación:" -ForegroundColor DarkGray
Write-Host "   - docker build: Construye una imagen Docker" -ForegroundColor DarkGray
Write-Host "   - -t catalogo-productos-api: Le da un nombre (tag) a la imagen" -ForegroundColor DarkGray
Write-Host "   - .: Usa el Dockerfile en el directorio actual" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   Este proceso:" -ForegroundColor DarkGray
Write-Host "   1. Lee el Dockerfile" -ForegroundColor DarkGray
Write-Host "   2. Ejecuta cada instrucción en orden" -ForegroundColor DarkGray
Write-Host "   3. Crea capas (layers) de la imagen" -ForegroundColor DarkGray
Write-Host "   4. Guarda la imagen con el nombre especificado" -ForegroundColor DarkGray
Write-Host ""
$continue = Read-Host "   ¿Continuar con la construcción? (s/n)"
if ($continue -ne "s") {
    Write-Host "   Operación cancelada." -ForegroundColor Yellow
    Set-Location ../..
    exit 0
}

Write-Host "   Construyendo imagen (esto puede tardar unos minutos)..." -ForegroundColor Yellow
docker build -t catalogo-productos-api .
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Imagen construida exitosamente" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error al construir la imagen" -ForegroundColor Red
    Set-Location ../..
    exit 1
}
Write-Host ""

Write-Host "3.4 Verificar que la imagen se construyó..." -ForegroundColor Gray
Write-Host "   Comando: docker images | grep catalogo-productos-api" -ForegroundColor White
docker images | Select-String "catalogo-productos-api"
Write-Host ""

# ============================================
# PASO 4: EJECUTAR EL CONTENEDOR (EMULAR CLOUD RUN)
# ============================================
Write-Host "🚀 PASO 4: EJECUTAR EL CONTENEDOR (EMULAR CLOUD RUN)" -ForegroundColor Yellow
Write-Host ""

Write-Host "4.1 ¿Qué es ejecutar un contenedor?" -ForegroundColor Gray
Write-Host "   Ejecutar un contenedor significa crear una instancia de la imagen" -ForegroundColor DarkGray
Write-Host "   y ejecutarla. Esto es lo que Cloud Run hace en la nube." -ForegroundColor DarkGray
Write-Host ""

Write-Host "4.2 Detener contenedores existentes (si existen)..." -ForegroundColor Gray
docker stop api-service 2>$null
docker rm api-service 2>$null
Write-Host "   ✅ Limpieza completada" -ForegroundColor Green
Write-Host ""

Write-Host "4.3 Ejecutar el contenedor..." -ForegroundColor Gray
Write-Host "   Comando: docker run -d -p 3001:3001 -e PORT=3001 --name api-service catalogo-productos-api" -ForegroundColor White
Write-Host "   Explicación de cada flag:" -ForegroundColor DarkGray
Write-Host "   - docker run: Ejecuta un contenedor" -ForegroundColor DarkGray
Write-Host "   - -d: Ejecuta en segundo plano (detached)" -ForegroundColor DarkGray
Write-Host "   - -p 3001:3001: Mapea puerto 3001 del contenedor al puerto 3001 del host" -ForegroundColor DarkGray
Write-Host "   - -e PORT=3001: Establece variable de entorno PORT (igual que Cloud Run)" -ForegroundColor DarkGray
Write-Host "   - --name api-service: Le da un nombre al contenedor" -ForegroundColor DarkGray
Write-Host "   - catalogo-productos-api: Nombre de la imagen a ejecutar" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   ¿Por qué estos flags?" -ForegroundColor DarkGray
Write-Host "   - -p: Para acceder desde localhost:3001" -ForegroundColor DarkGray
Write-Host "   - -e PORT: Cloud Run también establece PORT" -ForegroundColor DarkGray
Write-Host "   - -d: Cloud Run siempre ejecuta en segundo plano" -ForegroundColor DarkGray
Write-Host ""
$continue = Read-Host "   ¿Continuar con la ejecución? (s/n)"
if ($continue -ne "s") {
    Write-Host "   Operación cancelada." -ForegroundColor Yellow
    Set-Location ../..
    exit 0
}

docker run -d -p 3001:3001 -e PORT=3001 --name api-service catalogo-productos-api
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Contenedor ejecutándose" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error al ejecutar el contenedor" -ForegroundColor Red
    Set-Location ../..
    exit 1
}
Write-Host ""

Write-Host "4.4 Esperar a que el servicio inicie..." -ForegroundColor Gray
Start-Sleep -Seconds 3
Write-Host ""

Write-Host "4.5 Verificar que el contenedor está ejecutándose..." -ForegroundColor Gray
Write-Host "   Comando: docker ps" -ForegroundColor White
docker ps | Select-String "api-service"
Write-Host ""

# ============================================
# PASO 5: PROBAR EL SERVICIO
# ============================================
Write-Host "🧪 PASO 5: PROBAR EL SERVICIO" -ForegroundColor Yellow
Write-Host ""

Write-Host "5.1 Probar el health check..." -ForegroundColor Gray
Write-Host "   Comando: curl http://localhost:3001/health" -ForegroundColor White
Write-Host "   ¿Por qué? Cloud Run también verifica health checks automáticamente" -ForegroundColor DarkGray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Health check exitoso" -ForegroundColor Green
        Write-Host "   Respuesta:" -ForegroundColor White
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor DarkGray
    }
} catch {
    Write-Host "   ⚠️  Health check falló. Esperando unos segundos más..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Health check exitoso" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ❌ Health check falló. Revisa los logs con: docker logs api-service" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "5.2 Probar el endpoint de productos..." -ForegroundColor Gray
Write-Host "   Comando: curl http://localhost:3001/api/v1/productos" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/productos" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Endpoint de productos funcionando" -ForegroundColor Green
        $productos = $response.Content | ConvertFrom-Json
        Write-Host "   Productos encontrados: $($productos.Count)" -ForegroundColor White
    }
} catch {
    Write-Host "   ⚠️  Error al probar endpoint de productos" -ForegroundColor Yellow
}
Write-Host ""

# ============================================
# PASO 6: VER LOGS
# ============================================
Write-Host "📊 PASO 6: VER LOGS" -ForegroundColor Yellow
Write-Host ""

Write-Host "6.1 Ver logs del contenedor..." -ForegroundColor Gray
Write-Host "   Comando: docker logs api-service" -ForegroundColor White
Write-Host "   ¿Por qué? Los logs te ayudan a debuggear problemas" -ForegroundColor DarkGray
Write-Host "   Igual que Cloud Run: gcloud run services logs tail SERVICIO" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   Últimas 10 líneas de logs:" -ForegroundColor White
docker logs --tail 10 api-service
Write-Host ""

Write-Host "   Para ver logs en tiempo real:" -ForegroundColor Gray
Write-Host "   docker logs -f api-service" -ForegroundColor White
Write-Host ""

# ============================================
# PASO 7: DETENER Y LIMPIAR
# ============================================
Write-Host "🛑 PASO 7: DETENER Y LIMPIAR" -ForegroundColor Yellow
Write-Host ""

Write-Host "7.1 Comandos para detener y limpiar..." -ForegroundColor Gray
Write-Host "   Detener contenedor: docker stop api-service" -ForegroundColor White
Write-Host "   Eliminar contenedor: docker rm api-service" -ForegroundColor White
Write-Host "   O ambos: docker rm -f api-service" -ForegroundColor White
Write-Host ""

$cleanup = Read-Host "   ¿Detener y eliminar el contenedor ahora? (s/n)"
if ($cleanup -eq "s") {
    docker stop api-service 2>$null
    docker rm api-service 2>$null
    Write-Host "   ✅ Contenedor detenido y eliminado" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Contenedor sigue ejecutándose. Deténlo manualmente cuando termines." -ForegroundColor Yellow
}
Write-Host ""

# ============================================
# RESUMEN
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ EMULACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Resumen de lo aprendido:" -ForegroundColor Yellow
Write-Host "   1. Dockerfile define cómo construir la imagen" -ForegroundColor White
Write-Host "   2. docker build construye la imagen" -ForegroundColor White
Write-Host "   3. docker run ejecuta un contenedor (emula Cloud Run)" -ForegroundColor White
Write-Host "   4. Variables de entorno se pasan con -e" -ForegroundColor White
Write-Host "   5. Puertos se mapean con -p" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Probar el frontend también" -ForegroundColor White
Write-Host "   2. Usar docker-compose para ambos servicios" -ForegroundColor White
Write-Host "   3. Desplegar a Cloud Run real" -ForegroundColor White
Write-Host ""
Write-Host "📚 Comandos útiles:" -ForegroundColor Yellow
Write-Host "   - Ver contenedores: docker ps" -ForegroundColor White
Write-Host "   - Ver logs: docker logs -f api-service" -ForegroundColor White
Write-Host "   - Detener: docker stop api-service" -ForegroundColor White
Write-Host "   - Eliminar: docker rm api-service" -ForegroundColor White
Write-Host ""

Set-Location ../..

