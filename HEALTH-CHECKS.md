# Health Checks - Explicación Completa

## 📍 ¿Dónde están los Health Checks?

Los health checks están implementados en **2 archivos principales**:

### 1. API Service - `services/api/server.js`

```javascript
// Línea 102-111
// Health check para Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'catalogo-productos-api',
    version: API_VERSION,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});
```

**Ubicación:** `services/api/server.js` (líneas 102-111)

**URL:** `http://localhost:3001/health`

### 2. Frontend Service - `services/frontend/server.js`

```javascript
// Línea 16-25
// Health check para Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'catalogo-productos-frontend',
    message: 'Frontend funcionando correctamente',
    apiUrl: API_URL,
    timestamp: new Date().toISOString()
  });
});
```

**Ubicación:** `services/frontend/server.js` (líneas 16-25)

**URL:** `http://localhost:3000/health`

### 3. Docker Compose - `docker-compose.yml`

También hay configuraciones de health checks para Docker:

```yaml
# Líneas 15-20 (API Service)
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s

# Líneas 38-43 (Frontend Service)
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Ubicación:** `docker-compose.yml` (líneas 15-20 y 38-43)

## 🎯 ¿Qué es un Health Check?

Un **health check** es un endpoint HTTP que permite verificar si un servicio está funcionando correctamente.

### Propósito:

1. **Monitoreo**: Verificar que el servicio está vivo
2. **Cloud Run**: Cloud Run usa health checks para saber si puede enviar tráfico al servicio
3. **Docker**: Docker usa health checks para saber si un contenedor está listo
4. **Load Balancers**: Los balanceadores de carga verifican la salud antes de enviar tráfico

## 🔍 Cómo Funcionan

### 1. Health Check del API

**Endpoint:** `GET /health`

**Respuesta exitosa (200 OK):**
```json
{
  "status": "ok",
  "service": "catalogo-productos-api",
  "version": "v1",
  "message": "API funcionando correctamente",
  "timestamp": "2025-11-11T18:52:30.600Z"
}
```

**Código:**
```102:111:services/api/server.js
// Health check para Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'catalogo-productos-api',
    version: API_VERSION,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});
```

### 2. Health Check del Frontend

**Endpoint:** `GET /health`

**Respuesta exitosa (200 OK):**
```json
{
  "status": "ok",
  "service": "catalogo-productos-frontend",
  "message": "Frontend funcionando correctamente",
  "apiUrl": "http://localhost:3001",
  "timestamp": "2025-11-11T18:52:35.967Z"
}
```

**Código:**
```16:25:services/frontend/server.js
// Health check para Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'catalogo-productos-frontend',
    message: 'Frontend funcionando correctamente',
    apiUrl: API_URL,
    timestamp: new Date().toISOString()
  });
});
```

## 🧪 Probar los Health Checks

### Desde el navegador:

1. **API Health Check:**
   ```
   http://localhost:3001/health
   ```

2. **Frontend Health Check:**
   ```
   http://localhost:3000/health
   ```

### Desde la terminal (PowerShell):

```powershell
# API Health Check
curl http://localhost:3001/health

# Frontend Health Check
curl http://localhost:3000/health
```

### Desde la terminal (curl):

```bash
# API Health Check
curl http://localhost:3001/health

# Frontend Health Check
curl http://localhost:3000/health
```

## 🐳 Health Checks en Docker Compose

En `docker-compose.yml`, los health checks se configuran así:

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
  interval: 30s      # Verifica cada 30 segundos
  timeout: 10s       # Timeout de 10 segundos
  retries: 3         # Reintenta 3 veces antes de marcar como no saludable
  start_period: 40s  # Espera 40 segundos antes de empezar a verificar
```

**¿Qué hace esto?**
- Docker ejecuta el comando cada 30 segundos
- Si el health check responde 200 OK, el contenedor está saludable
- Si falla 3 veces seguidas, el contenedor se marca como no saludable
- Durante los primeros 40 segundos, no se marca como no saludable (tiempo de inicio)

## ☁️ Health Checks en Cloud Run

Cloud Run **automáticamente** usa el endpoint `/health` si existe.

### Configuración automática:

Cloud Run verifica:
- `GET /health` (si existe)
- `GET /` (si no existe `/health`)

### Configuración manual:

También puedes configurar un health check personalizado:

```bash
gcloud run deploy catalogo-productos-api \
  --health-check-path /health \
  --health-check-interval 30 \
  --health-check-timeout 10 \
  --health-check-threshold 3
```

## 📊 Resumen de Archivos

| Archivo | Líneas | Tipo | Descripción |
|---------|--------|------|-------------|
| `services/api/server.js` | 102-111 | Endpoint HTTP | Health check del API |
| `services/frontend/server.js` | 16-25 | Endpoint HTTP | Health check del Frontend |
| `docker-compose.yml` | 15-20 | Docker config | Health check del API en Docker |
| `docker-compose.yml` | 38-43 | Docker config | Health check del Frontend en Docker |

## 🎯 ¿Por qué son importantes?

1. **Cloud Run**: Si el health check falla, Cloud Run no envía tráfico al servicio
2. **Docker Compose**: Si el health check falla, otros servicios pueden esperar antes de iniciar
3. **Monitoreo**: Puedes monitorear la salud de tus servicios
4. **Debugging**: Si un servicio no responde, el health check te dice si está vivo o no

## 🔧 Personalizar Health Checks

Puedes agregar más validaciones al health check:

```javascript
app.get('/health', async (req, res) => {
  try {
    // Verificar base de datos
    await db.ping();
    
    // Verificar servicios externos
    const apiStatus = await checkExternalAPI();
    
    res.status(200).json({ 
      status: 'ok',
      service: 'catalogo-productos-api',
      database: 'connected',
      externalAPI: apiStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error',
      message: error.message 
    });
  }
});
```

## 📝 Notas

- Los health checks deben responder **rápidamente** (< 1 segundo)
- Deben ser **ligeros** (no hacer operaciones pesadas)
- Deben verificar que el servicio está **realmente** funcionando
- Cloud Run espera respuesta 200 OK para considerar el servicio saludable

