# Catálogo de Productos - Arquitectura de Microservicios

Aplicación web de catálogo de productos con operaciones CRUD (Crear, Leer, Actualizar, Eliminar). Diseñada con **arquitectura de microservicios** para probar Google Cloud Run localmente y en la nube.

## 🏗️ Arquitectura

La aplicación está dividida en **2 microservicios independientes**:

1. **API Service** (Backend) - Puerto 3001
   - Servicio REST que maneja todas las operaciones CRUD
   - Endpoints: `/api/v1/productos`
   - Health check: `/health`

2. **Frontend Service** (Frontend) - Puerto 3000
   - Interfaz web que consume la API
   - Servidor estático que sirve el HTML/CSS/JS
   - Health check: `/health`

## ✨ Características

- ✅ **Arquitectura de Microservicios** - Servicios independientes y desacoplados
- ✅ CRUD completo de productos
- ✅ Interfaz web simple y moderna
- ✅ API REST con versionado (`/api/v1/`)
- ✅ Base de datos PostgreSQL (persistente)
- ✅ Listo para Cloud Run (cada servicio se despliega independientemente)
- ✅ Se puede probar localmente sin necesidad de subirlo a la nube
- ✅ Docker Compose para orquestar servicios localmente
- ✅ Health checks para cada servicio

## 📦 Campos del Producto

- **ID**: Identificador único (generado automáticamente)
- **Nombre**: Nombre del producto (requerido)
- **Descripción**: Descripción del producto (opcional)
- **Precio**: Precio del producto (requerido)
- **Stock**: Cantidad en inventario (opcional, por defecto 0)

## 🚀 Instalación Local

### Opción 1: Emular Cloud Run con Docker (Recomendado para probar como producción)

Emula exactamente cómo funcionará en Cloud Run usando Docker:

**Windows (PowerShell):**
```powershell
.\scripts\emulate-cloud-run.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/emulate-cloud-run.sh
./scripts/emulate-cloud-run.sh
```

Esto:
- ✅ Construye las imágenes Docker (como Cloud Run)
- ✅ Ejecuta los servicios en contenedores (como Cloud Run)
- ✅ Usa las mismas variables de entorno (como Cloud Run)
- ✅ Health checks configurados (como Cloud Run)

**URLs:**
- **API Service**: `http://localhost:3001`
- **Frontend Service**: `http://localhost:3000`

### Opción 2: Usando Docker Compose (Incluye PostgreSQL)

La forma más fácil de probar todos los servicios juntos (incluyendo la base de datos):

```bash
# Construir y levantar todos los servicios
docker-compose up --build

# O en modo detached (background)
docker-compose up -d --build
```

Esto levantará:
- **PostgreSQL**: Puerto 5432 (base de datos)
- **API Service**: `http://localhost:3001`
- **Frontend Service**: `http://localhost:3000`

Abre `http://localhost:3000` en tu navegador.

**Nota:** La primera vez que ejecutes, PostgreSQL creará automáticamente la tabla e insertará productos de ejemplo.

Para detener los servicios:
```bash
docker-compose down
```

Para eliminar también los datos de PostgreSQL:
```bash
docker-compose down -v
```

### Opción 3: Servicios Individuales (Desarrollo)

#### API Service (Backend)

```bash
cd services/api
npm install
npm start
```

El API estará disponible en `http://localhost:3001`

#### Frontend Service

```bash
cd services/frontend
npm install
API_URL=http://localhost:3001 npm start
```

El frontend estará disponible en `http://localhost:3000`

## 📡 Uso de la API

### Base URL
```
http://localhost:3001/api/v1
```

### Endpoints

#### Obtener todos los productos
```bash
GET /api/v1/productos
```

#### Obtener un producto por ID
```bash
GET /api/v1/productos/:id
```

#### Crear un nuevo producto
```bash
POST /api/v1/productos
Content-Type: application/json

{
  "nombre": "Producto Ejemplo",
  "descripcion": "Descripción del producto",
  "precio": 99.99,
  "stock": 10
}
```

#### Actualizar un producto
```bash
PUT /api/v1/productos/:id
Content-Type: application/json

{
  "nombre": "Producto Actualizado",
  "precio": 149.99
}
```

#### Eliminar un producto
```bash
DELETE /api/v1/productos/:id
```

#### Health Check
```bash
GET /health
```

## 🐳 Probar con Docker Individualmente

### API Service

```bash
cd services/api
docker build -t catalogo-productos-api .
docker run -p 3001:3001 catalogo-productos-api
```

### Frontend Service

```bash
cd services/frontend
docker build -t catalogo-productos-frontend .
docker run -p 3000:3000 -e API_URL=http://localhost:3001 catalogo-productos-frontend
```

## ☁️ Desplegar en la Nube

### Opción 1: Render.com (Recomendado - Más fácil) 🚀

Render.com es una plataforma simple y gratuita para desplegar aplicaciones. **Perfecto para empezar rápido.**

#### Despliegue Rápido con Blueprint (1 click)

**⚠️ IMPORTANTE**: Render no puede crear bases de datos PostgreSQL automáticamente. Debes crear la BD **ANTES** de usar el blueprint.

**Pasos:**

1. **Primero, crea la base de datos PostgreSQL** en Render Dashboard → "New +" → "PostgreSQL"
2. Sube tu código a GitHub/GitLab/Bitbucket
3. Ve a [Render Dashboard](https://dashboard.render.com/)
4. Click en **"New +"** → **"Blueprint"**
5. Conecta tu repositorio
6. Render detectará el archivo `render.yaml` y desplegará los servicios web
7. **Después**, configura `DATABASE_URL` en el API Service desde la sección "Connections" de tu BD

#### Despliegue Manual

Sigue la guía completa en: **[DEPLOY-RENDER.md](./DEPLOY-RENDER.md)**

**Ventajas de Render:**
- ✅ Plan gratuito disponible
- ✅ PostgreSQL gestionado incluido
- ✅ Despliegue automático desde Git
- ✅ SSL/HTTPS automático
- ✅ Muy fácil de configurar

**Nota:** En el plan gratuito, los servicios se "duermen" después de 15 minutos de inactividad. La primera petición puede tardar ~30 segundos.

### Opción 2: Google Cloud Run

Cada servicio se despliega **independientemente** en Cloud Run.

#### Prerrequisitos
- Google Cloud SDK instalado
- Proyecto de Google Cloud configurado

### Desplegar API Service

```bash
cd services/api

# Desplegar directamente desde el código fuente
gcloud run deploy catalogo-productos-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001
```

O usando Docker:

```bash
# Construir la imagen
docker build -t gcr.io/TU_PROYECTO_ID/catalogo-productos-api .

# Subir a Google Container Registry
docker push gcr.io/TU_PROYECTO_ID/catalogo-productos-api

# Desplegar en Cloud Run
gcloud run deploy catalogo-productos-api \
  --image gcr.io/TU_PROYECTO_ID/catalogo-productos-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3001
```

### Desplegar Frontend Service

Después de desplegar el API, obtén la URL del servicio API y úsala para configurar el frontend:

```bash
cd services/frontend

# Obtener la URL del API (reemplaza con tu URL real)
API_URL=https://catalogo-productos-api-xxxxx.run.app

# Desplegar el frontend
gcloud run deploy catalogo-productos-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars API_URL=${API_URL}
```

O usando Docker:

```bash
# Construir la imagen
docker build -t gcr.io/TU_PROYECTO_ID/catalogo-productos-frontend \
  --build-arg API_URL=https://catalogo-productos-api-xxxxx.run.app .

# Subir a Google Container Registry
docker push gcr.io/TU_PROYECTO_ID/catalogo-productos-frontend

# Desplegar en Cloud Run
gcloud run deploy catalogo-productos-frontend \
  --image gcr.io/TU_PROYECTO_ID/catalogo-productos-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars API_URL=https://catalogo-productos-api-xxxxx.run.app
```

## 📁 Estructura del Proyecto

```
catalogo-productos/
├── services/
│   ├── api/                    # Microservicio API (Backend)
│   │   ├── server.js          # Servidor Express con API REST
│   │   ├── package.json       # Dependencias del API
│   │   ├── Dockerfile        # Dockerfile para API
│   │   └── .dockerignore     # Archivos a ignorar
│   │
│   └── frontend/              # Microservicio Frontend
│       ├── server.js         # Servidor Express estático
│       ├── package.json      # Dependencias del Frontend
│       ├── Dockerfile        # Dockerfile para Frontend
│       ├── .dockerignore     # Archivos a ignorar
│       └── public/
│           └── index.html    # Interfaz web
│
├── docker-compose.yml         # Orquestación de servicios localmente
├── .gitignore                # Archivos a ignorar en Git
└── README.md                 # Este archivo
```

## 🔧 Variables de Entorno

### API Service
- `PORT`: Puerto del servidor (default: 3001)
- `API_VERSION`: Versión de la API (default: v1)
- `DATABASE_URL`: URL completa de PostgreSQL (Render lo proporciona automáticamente)
- O variables individuales:
  - `DB_HOST`: Host de PostgreSQL
  - `DB_PORT`: Puerto de PostgreSQL (default: 5432)
  - `DB_NAME`: Nombre de la base de datos
  - `DB_USER`: Usuario de PostgreSQL
  - `DB_PASSWORD`: Contraseña de PostgreSQL

### Frontend Service
- `PORT`: Puerto del servidor (default: 3000)
- `API_URL`: URL del servicio API (default: http://localhost:3001)

## 📝 Notas

- **Base de datos**: PostgreSQL (persistente, los datos se guardan)
- **Docker Compose**: Incluye PostgreSQL automáticamente
- **Producción**: Usa Cloud SQL (PostgreSQL gestionado por Google)
- Cada servicio puede escalarse independientemente en Cloud Run
- Los servicios se comunican mediante HTTP REST
- El frontend usa CORS para comunicarse con el API
- Ver `BASE-DATOS.md` para más información sobre la base de datos

## 🛠️ Tecnologías Utilizadas

- **Node.js**: Runtime de JavaScript
- **Express**: Framework web
- **PostgreSQL**: Base de datos relacional
- **pg**: Librería de PostgreSQL para Node.js
- **CORS**: Para comunicación entre servicios
- **HTML/CSS/JavaScript**: Interfaz de usuario
- **Docker**: Containerización
- **Docker Compose**: Orquestación local

## 🎯 Ventajas de la Arquitectura de Microservicios

1. **Independencia**: Cada servicio se puede desarrollar, desplegar y escalar independientemente
2. **Escalabilidad**: Puedes escalar solo el servicio que necesita más recursos
3. **Tecnología**: Cada servicio puede usar diferentes tecnologías si es necesario
4. **Falla aislada**: Si un servicio falla, los demás continúan funcionando
5. **Despliegue**: Puedes actualizar un servicio sin afectar a los demás
