# Despliegue a Google Cloud Run - Guía Completa

## 🔍 Diferencia: Local vs Cloud Run

### Lo que tenemos ahora (Desarrollo Local)
```
┌─────────────────┐      ┌─────────────────┐
│  Frontend       │      │  API            │
│  localhost:3000 │      │  localhost:3001 │
│                 │      │                 │
│  npm start      │      │  npm start      │
└─────────────────┘      └─────────────────┘
```

**Características:**
- ✅ Ejecuta directamente con Node.js
- ✅ Desarrollo rápido
- ✅ Fácil de depurar
- ❌ No es exactamente como Cloud Run

### Cloud Run (Producción)
```
┌─────────────────┐      ┌─────────────────┐
│  Frontend       │      │  API            │
│  Cloud Run      │      │  Cloud Run      │
│  *.run.app      │      │  *.run.app      │
│                 │      │                 │
│  Docker         │      │  Docker         │
└─────────────────┘      └─────────────────┘
```

**Características:**
- ✅ Ejecuta en contenedores Docker
- ✅ Escalado automático
- ✅ HTTPS automático
- ✅ Variables de entorno de Cloud Run
- ✅ Health checks de Cloud Run

## 🐳 Emular Cloud Run Localmente

Para emular exactamente cómo funcionará en Cloud Run, usamos **Docker** con las mismas configuraciones.

### Opción 1: Docker Compose (Ya lo tenemos)

```bash
docker-compose up --build
```

Esto emula Cloud Run porque:
- ✅ Usa Docker (como Cloud Run)
- ✅ Variables de entorno configuradas
- ✅ Health checks
- ✅ Red interna entre servicios

### Opción 2: Docker Individual (Más parecido a Cloud Run)

Ejecutar cada servicio como lo haría Cloud Run:

```bash
# API Service
docker build -t catalogo-productos-api ./services/api
docker run -p 3001:3001 \
  -e PORT=3001 \
  -e API_VERSION=v1 \
  catalogo-productos-api

# Frontend Service
docker build -t catalogo-productos-frontend ./services/frontend
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e API_URL=http://localhost:3001 \
  catalogo-productos-frontend
```

## 🚀 Despliegue Real a Google Cloud Run

### Prerrequisitos

1. **Instalar Google Cloud SDK:**
   ```bash
   # Descargar desde: https://cloud.google.com/sdk/docs/install
   ```

2. **Autenticarse:**
   ```bash
   gcloud auth login
   ```

3. **Configurar proyecto:**
   ```bash
   gcloud config set project TU_PROYECTO_ID
   ```

4. **Habilitar APIs necesarias:**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

### Paso 1: Desplegar API Service

```bash
cd services/api

# Opción A: Desplegar desde código fuente (más fácil)
gcloud run deploy catalogo-productos-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --set-env-vars API_VERSION=v1

# Opción B: Usar Docker (más control)
# 1. Construir imagen
docker build -t gcr.io/TU_PROYECTO_ID/catalogo-productos-api .

# 2. Subir a Google Container Registry
docker push gcr.io/TU_PROYECTO_ID/catalogo-productos-api

# 3. Desplegar
gcloud run deploy catalogo-productos-api \
  --image gcr.io/TU_PROYECTO_ID/catalogo-productos-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001 \
  --set-env-vars API_VERSION=v1
```

**Obtendrás una URL como:**
```
https://catalogo-productos-api-xxxxx-uc.a.run.app
```

### Paso 2: Desplegar Frontend Service

```bash
cd ../frontend

# IMPORTANTE: Usar la URL del API desplegado
API_URL=https://catalogo-productos-api-xxxxx-uc.a.run.app

# Opción A: Desplegar desde código fuente
gcloud run deploy catalogo-productos-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars API_URL=${API_URL}

# Opción B: Usar Docker
docker build -t gcr.io/TU_PROYECTO_ID/catalogo-productos-frontend \
  --build-arg API_URL=${API_URL} .

docker push gcr.io/TU_PROYECTO_ID/catalogo-productos-frontend

gcloud run deploy catalogo-productos-frontend \
  --image gcr.io/TU_PROYECTO_ID/catalogo-productos-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars API_URL=${API_URL}
```

**Obtendrás una URL como:**
```
https://catalogo-productos-frontend-xxxxx-uc.a.run.app
```

### Paso 3: Verificar Despliegue

```bash
# Ver servicios desplegados
gcloud run services list

# Ver logs del API
gcloud run services logs read catalogo-productos-api

# Ver logs del Frontend
gcloud run services logs read catalogo-productos-frontend
```

## 🔧 Configuraciones Avanzadas de Cloud Run

### Escalado Automático

```bash
# Configurar mínimo y máximo de instancias
gcloud run deploy catalogo-productos-api \
  --min-instances 1 \
  --max-instances 10 \
  --cpu 1 \
  --memory 512Mi
```

### Variables de Entorno

```bash
# Agregar múltiples variables
gcloud run deploy catalogo-productos-api \
  --set-env-vars API_VERSION=v1,NODE_ENV=production
```

### Timeout y Concurrencia

```bash
# Configurar timeout y concurrencia
gcloud run deploy catalogo-productos-api \
  --timeout 300 \
  --concurrency 80
```

## 📊 Comparación: Local vs Cloud Run

| Aspecto | Local (npm) | Local (Docker) | Cloud Run |
|---------|-------------|----------------|-----------|
| **Ejecución** | Node.js directo | Docker | Docker |
| **URL** | localhost | localhost | *.run.app |
| **HTTPS** | ❌ | ❌ | ✅ Automático |
| **Escalado** | Manual | Manual | ✅ Automático |
| **Variables** | .env | Docker env | Cloud Run env |
| **Logs** | Console | Docker logs | Cloud Logging |
| **Costo** | Gratis | Gratis | Pay per use |

## 🎯 Emulación Exacta de Cloud Run

Para emular **exactamente** Cloud Run localmente, necesitamos:

1. ✅ Docker (ya lo tenemos)
2. ✅ Variables de entorno (ya configuradas)
3. ✅ Health checks (ya implementados)
4. ✅ Puerto desde variable PORT (ya configurado)

**Lo único que falta es HTTPS**, pero para desarrollo local no es necesario.

## 🚀 Scripts de Despliegue

Voy a crear scripts para facilitar el despliegue.

