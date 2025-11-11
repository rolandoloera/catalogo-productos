# Script Paso a Paso para Desplegar a Cloud Run
# Explica cada comando como si fuera para un examen de certificación

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DESPLIEGUE A CLOUD RUN - PASO A PASO  " -ForegroundColor Cyan
Write-Host "  Guía Educativa para Certificación     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# PASO 1: PREPARAR EL ENTORNO
# ============================================
Write-Host "📚 PASO 1: PREPARAR EL ENTORNO" -ForegroundColor Yellow
Write-Host ""

Write-Host "1.1 Verificar Docker instalado..." -ForegroundColor Gray
Write-Host "   ¿Por qué? Cloud Run ejecuta contenedores Docker" -ForegroundColor DarkGray
Write-Host "   Comando: docker --version" -ForegroundColor White
$dockerVersion = docker --version 2>$null
if ($dockerVersion) {
    Write-Host "   ✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Docker no encontrado. Instala Docker Desktop primero." -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "1.2 Verificar Google Cloud SDK instalado..." -ForegroundColor Gray
Write-Host "   ¿Por qué? Necesitamos gcloud para desplegar a Cloud Run" -ForegroundColor DarkGray
Write-Host "   Comando: gcloud --version" -ForegroundColor White
$gcloudVersion = gcloud --version 2>$null
if ($gcloudVersion) {
    Write-Host "   ✅ Google Cloud SDK encontrado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Google Cloud SDK no encontrado. Instálalo primero." -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "1.3 Verificar autenticación en Google Cloud..." -ForegroundColor Gray
Write-Host "   ¿Por qué? Necesitamos estar autenticados para desplegar" -ForegroundColor DarkGray
Write-Host "   Comando: gcloud auth list" -ForegroundColor White
$authList = gcloud auth list 2>$null
if ($authList -match "ACTIVE") {
    Write-Host "   ✅ Autenticado en Google Cloud" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No estás autenticado. Ejecutando gcloud auth login..." -ForegroundColor Yellow
    Write-Host "   Comando: gcloud auth login" -ForegroundColor White
    Write-Host "   Esto abrirá tu navegador para autenticarte..." -ForegroundColor DarkGray
    gcloud auth login
}
Write-Host ""

Write-Host "1.4 Verificar proyecto configurado..." -ForegroundColor Gray
Write-Host "   ¿Por qué? Todos los recursos pertenecen a un proyecto" -ForegroundColor DarkGray
Write-Host "   Comando: gcloud config get-value project" -ForegroundColor White
$projectId = gcloud config get-value project 2>$null
if ($projectId) {
    Write-Host "   ✅ Proyecto actual: $projectId" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No hay proyecto configurado." -ForegroundColor Yellow
    $newProject = Read-Host "   Ingresa el ID de tu proyecto de Google Cloud"
    Write-Host "   Comando: gcloud config set project $newProject" -ForegroundColor White
    gcloud config set project $newProject
    $projectId = $newProject
}
Write-Host ""

Write-Host "1.5 Habilitar APIs necesarias..." -ForegroundColor Gray
Write-Host "   ¿Por qué? Google Cloud requiere habilitar APIs explícitamente" -ForegroundColor DarkGray
Write-Host "   APIs necesarias:" -ForegroundColor White
Write-Host "   - run.googleapis.com (Cloud Run API)" -ForegroundColor White
Write-Host "   - cloudbuild.googleapis.com (Cloud Build API)" -ForegroundColor White
Write-Host "   Comando: gcloud services enable run.googleapis.com cloudbuild.googleapis.com" -ForegroundColor White
gcloud services enable run.googleapis.com cloudbuild.googleapis.com --project $projectId
Write-Host "   ✅ APIs habilitadas" -ForegroundColor Green
Write-Host ""

# ============================================
# PASO 2: CONSTRUIR IMAGEN DOCKER DEL API
# ============================================
Write-Host "🐳 PASO 2: CONSTRUIR IMAGEN DOCKER DEL API" -ForegroundColor Yellow
Write-Host ""

Write-Host "2.1 Navegar al directorio del API..." -ForegroundColor Gray
Write-Host "   ¿Por qué? Necesitamos estar en el directorio con el Dockerfile" -ForegroundColor DarkGray
Set-Location services/api
Write-Host "   ✅ Directorio actual: $(Get-Location)" -ForegroundColor Green
Write-Host ""

Write-Host "2.2 Construir la imagen Docker..." -ForegroundColor Gray
Write-Host "   ¿Por qué? Cloud Run necesita una imagen Docker para ejecutar" -ForegroundColor DarkGray
Write-Host "   Comando: docker build -t catalogo-productos-api ." -ForegroundColor White
Write-Host "   Explicación:" -ForegroundColor DarkGray
Write-Host "   - docker build: Construye una imagen Docker" -ForegroundColor DarkGray
Write-Host "   - -t catalogo-productos-api: Le da un nombre (tag) a la imagen" -ForegroundColor DarkGray
Write-Host "   - .: Usa el Dockerfile en el directorio actual" -ForegroundColor DarkGray
Write-Host ""
$continue = Read-Host "   ¿Continuar con la construcción? (s/n)"
if ($continue -ne "s") {
    Write-Host "   Operación cancelada." -ForegroundColor Yellow
    exit 0
}
docker build -t catalogo-productos-api .
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Imagen construida exitosamente" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error al construir la imagen" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "2.3 Verificar que la imagen se construyó..." -ForegroundColor Gray
Write-Host "   Comando: docker images | grep catalogo-productos-api" -ForegroundColor White
docker images | Select-String "catalogo-productos-api"
Write-Host ""

# ============================================
# PASO 3: PROBAR LA IMAGEN LOCALMENTE
# ============================================
Write-Host "🧪 PASO 3: PROBAR LA IMAGEN LOCALMENTE (Opcional)" -ForegroundColor Yellow
Write-Host ""

Write-Host "3.1 Ejecutar el contenedor localmente..." -ForegroundColor Gray
Write-Host "   ¿Por qué? Verificar que la imagen funciona antes de subirla" -ForegroundColor DarkGray
Write-Host "   Comando: docker run -d -p 3001:3001 -e PORT=3001 --name test-api catalogo-productos-api" -ForegroundColor White
Write-Host "   Explicación:" -ForegroundColor DarkGray
Write-Host "   - docker run: Ejecuta un contenedor" -ForegroundColor DarkGray
Write-Host "   - -d: Ejecuta en segundo plano (detached)" -ForegroundColor DarkGray
Write-Host "   - -p 3001:3001: Mapea puerto 3001 del contenedor al puerto 3001 del host" -ForegroundColor DarkGray
Write-Host "   - -e PORT=3001: Establece variable de entorno PORT" -ForegroundColor DarkGray
Write-Host ""
$test = Read-Host "   ¿Probar la imagen localmente? (s/n)"
if ($test -eq "s") {
    docker stop test-api 2>$null
    docker rm test-api 2>$null
    docker run -d -p 3001:3001 -e PORT=3001 --name test-api catalogo-productos-api
    Start-Sleep -Seconds 2
    Write-Host "   Probando health check..." -ForegroundColor Gray
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Imagen funciona correctamente" -ForegroundColor Green
    }
    docker stop test-api
    docker rm test-api
    Write-Host "   ✅ Contenedor de prueba detenido" -ForegroundColor Green
}
Write-Host ""

# ============================================
# PASO 4: ETIQUETAR Y SUBIR A GCR
# ============================================
Write-Host "☁️  PASO 4: ETIQUETAR Y SUBIR A GOOGLE CONTAINER REGISTRY" -ForegroundColor Yellow
Write-Host ""

Write-Host "4.1 Etiquetar la imagen para GCR..." -ForegroundColor Gray
Write-Host "   ¿Por qué? Necesitamos etiquetar la imagen con la URL de GCR" -ForegroundColor DarkGray
Write-Host "   Formato: gcr.io/PROYECTO_ID/NOMBRE_IMAGEN" -ForegroundColor White
$gcrImage = "gcr.io/$projectId/catalogo-productos-api"
Write-Host "   Comando: docker tag catalogo-productos-api $gcrImage" -ForegroundColor White
docker tag catalogo-productos-api $gcrImage
Write-Host "   ✅ Imagen etiquetada: $gcrImage" -ForegroundColor Green
Write-Host ""

Write-Host "4.2 Configurar Docker para GCR..." -ForegroundColor Gray
Write-Host "   ¿Por qué? Necesitamos autenticar Docker para subir imágenes a GCR" -ForegroundColor DarkGray
Write-Host "   Comando: gcloud auth configure-docker" -ForegroundColor White
gcloud auth configure-docker
Write-Host "   ✅ Docker configurado para GCR" -ForegroundColor Green
Write-Host ""

Write-Host "4.3 Subir la imagen a GCR..." -ForegroundColor Gray
Write-Host "   ¿Por qué? Cloud Run necesita acceder a la imagen desde GCR" -ForegroundColor DarkGray
Write-Host "   Comando: docker push $gcrImage" -ForegroundColor White
Write-Host "   Esto puede tardar varios minutos..." -ForegroundColor DarkGray
Write-Host ""
$continue = Read-Host "   ¿Continuar con la subida? (s/n)"
if ($continue -ne "s") {
    Write-Host "   Operación cancelada." -ForegroundColor Yellow
    exit 0
}
docker push $gcrImage
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Imagen subida exitosamente a GCR" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error al subir la imagen" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ============================================
# PASO 5: DESPLEGAR A CLOUD RUN
# ============================================
Write-Host "🚀 PASO 5: DESPLEGAR A CLOUD RUN" -ForegroundColor Yellow
Write-Host ""

Write-Host "5.1 Desplegar el API Service..." -ForegroundColor Gray
Write-Host "   ¿Por qué? Cloud Run ejecuta contenedores en la nube" -ForegroundColor DarkGray
Write-Host "   Comando completo:" -ForegroundColor White
Write-Host "   gcloud run deploy catalogo-productos-api \`" -ForegroundColor Cyan
Write-Host "     --image $gcrImage \`" -ForegroundColor Cyan
Write-Host "     --platform managed \`" -ForegroundColor Cyan
Write-Host "     --region us-central1 \`" -ForegroundColor Cyan
Write-Host "     --allow-unauthenticated \`" -ForegroundColor Cyan
Write-Host "     --port 3001 \`" -ForegroundColor Cyan
Write-Host "     --set-env-vars API_VERSION=v1" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Explicación de cada flag:" -ForegroundColor DarkGray
Write-Host "   - --image: Especifica la imagen Docker a usar" -ForegroundColor DarkGray
Write-Host "   - --platform managed: Usa Cloud Run (managed) serverless" -ForegroundColor DarkGray
Write-Host "   - --region us-central1: Región donde se despliega" -ForegroundColor DarkGray
Write-Host "   - --allow-unauthenticated: Permite acceso público" -ForegroundColor DarkGray
Write-Host "   - --port 3001: Puerto donde escucha la aplicación" -ForegroundColor DarkGray
Write-Host "   - --set-env-vars: Variables de entorno para la aplicación" -ForegroundColor DarkGray
Write-Host ""
$continue = Read-Host "   ¿Continuar con el despliegue? (s/n)"
if ($continue -ne "s") {
    Write-Host "   Operación cancelada." -ForegroundColor Yellow
    exit 0
}

gcloud run deploy catalogo-productos-api `
  --image $gcrImage `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --port 3001 `
  --set-env-vars API_VERSION=v1 `
  --project $projectId

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ API Service desplegado exitosamente" -ForegroundColor Green
    
    # Obtener URL del servicio
    $apiUrl = gcloud run services describe catalogo-productos-api `
      --region us-central1 `
      --format 'value(status.url)' `
      --project $projectId
    
    Write-Host ""
    Write-Host "   📋 URL del API Service: $apiUrl" -ForegroundColor Cyan
    Write-Host ""
    
    # Probar el servicio
    Write-Host "   Probando health check..." -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri "$apiUrl/health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ Health check exitoso" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️  Health check falló (puede tardar unos segundos en estar disponible)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Error al desplegar el servicio" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ============================================
# RESUMEN
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ DESPLIEGUE COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Resumen:" -ForegroundColor Yellow
Write-Host "   - Proyecto: $projectId" -ForegroundColor White
Write-Host "   - API Service URL: $apiUrl" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Desplegar el Frontend Service (similar proceso)" -ForegroundColor White
Write-Host "   2. Usar la URL del API en el Frontend" -ForegroundColor White
Write-Host ""
Write-Host "📚 Comandos útiles:" -ForegroundColor Yellow
Write-Host "   - Ver servicios: gcloud run services list" -ForegroundColor White
Write-Host "   - Ver logs: gcloud run services logs read catalogo-productos-api --region us-central1" -ForegroundColor White
Write-Host "   - Ver detalles: gcloud run services describe catalogo-productos-api --region us-central1" -ForegroundColor White
Write-Host ""

