# Base de Datos para Catálogo de Productos

## 🎯 Recomendación: PostgreSQL

### ¿Por qué PostgreSQL?

1. **Compatible con Cloud Run**
   - ✅ Funciona perfectamente con Cloud Run
   - ✅ Puedes usar Cloud SQL (PostgreSQL gestionado por Google)
   - ✅ O PostgreSQL en cualquier servidor

2. **Robusto y Escalable**
   - ✅ Base de datos relacional madura
   - ✅ Soporta transacciones ACID
   - ✅ Buen rendimiento

3. **Popular y Bien Soportado**
   - ✅ Mucha documentación
   - ✅ Buena integración con Node.js
   - ✅ Librerías maduras (pg)

4. **Flexible**
   - ✅ Puede crecer con tu aplicación
   - ✅ Soporta JSON si necesitas datos no estructurados
   - ✅ Buenas herramientas de administración

### Alternativas Consideradas

| Base de Datos | Ventajas | Desventajas | Recomendación |
|---------------|----------|-------------|---------------|
| **PostgreSQL** ✅ | Robusto, escalable, Cloud SQL | Requiere servidor | **Recomendado** |
| **MySQL** | Popular, Cloud SQL | Menos características avanzadas | Buena alternativa |
| **SQLite** | Simple, sin servidor | No ideal para Cloud Run | Solo desarrollo |
| **Firestore** | Serverless, nativo GCP | NoSQL, diferente modelo | Si prefieres NoSQL |
| **MongoDB** | NoSQL, flexible | Requiere servidor, diferente modelo | Si prefieres NoSQL |

## 🏗️ Arquitectura con Base de Datos

### Opción 1: PostgreSQL Local (Desarrollo/Emulación)
```
┌─────────────────┐      ┌─────────────────┐
│  API Service    │      │  Frontend        │
│  (Docker)       │      │  (Docker)        │
└────────┬────────┘      └─────────────────┘
         │
         │ PostgreSQL
         │
┌────────▼────────┐
│  PostgreSQL     │
│  (Docker)       │
└─────────────────┘
```

### Opción 2: Cloud SQL (Producción)
```
┌─────────────────┐      ┌─────────────────┐
│  API Service     │      │  Frontend        │
│  (Cloud Run)    │      │  (Cloud Run)     │
└────────┬────────┘      └─────────────────┘
         │
         │ Cloud SQL
         │
┌────────▼────────┐
│  Cloud SQL      │
│  (PostgreSQL)  │
└─────────────────┘
```

## 📊 Estructura de la Tabla

```sql
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `id`: Identificador único (auto-incremental)
- `nombre`: Nombre del producto (requerido)
- `descripcion`: Descripción del producto (opcional)
- `precio`: Precio del producto (requerido, 2 decimales)
- `stock`: Cantidad en inventario (por defecto 0)
- `fecha_creacion`: Fecha de creación (automática)
- `fecha_actualizacion`: Fecha de última actualización (automática)

## 🔧 Variables de Entorno

El API ahora requiere estas variables de entorno para conectarse a PostgreSQL:

```bash
DB_HOST=postgres          # Host de PostgreSQL
DB_PORT=5432             # Puerto de PostgreSQL
DB_NAME=catalogo_productos  # Nombre de la base de datos
DB_USER=postgres         # Usuario de PostgreSQL
DB_PASSWORD=postgres     # Contraseña de PostgreSQL
```

## 🚀 Uso Local con Docker Compose

### Iniciar todos los servicios (incluyendo PostgreSQL)

```bash
docker-compose up --build
```

Esto iniciará:
- ✅ PostgreSQL (puerto 5432)
- ✅ API Service (puerto 3001)
- ✅ Frontend Service (puerto 3000)

### Verificar que PostgreSQL está funcionando

```bash
# Ver logs de PostgreSQL
docker logs catalogo-productos-db

# Conectarse a PostgreSQL
docker exec -it catalogo-productos-db psql -U postgres -d catalogo_productos

# Ver productos
SELECT * FROM productos;
```

## ☁️ Usar Cloud SQL en Producción

### Crear instancia de Cloud SQL

```bash
gcloud sql instances create catalogo-productos-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1
```

### Crear base de datos

```bash
gcloud sql databases create catalogo_productos \
  --instance=catalogo-productos-db
```

### Configurar usuario

```bash
gcloud sql users create postgres \
  --instance=catalogo-productos-db \
  --password=TU_PASSWORD_SEGURO
```

### Obtener IP de conexión

```bash
gcloud sql instances describe catalogo-productos-db \
  --format='value(ipAddresses[0].ipAddress)'
```

### Configurar variables de entorno en Cloud Run

```bash
gcloud run services update catalogo-productos-api \
  --set-env-vars DB_HOST=IP_DE_CLOUD_SQL,DB_PORT=5432,DB_NAME=catalogo_productos,DB_USER=postgres,DB_PASSWORD=TU_PASSWORD
```

## 📝 Migraciones

El archivo `init-db.sql` se ejecuta automáticamente cuando PostgreSQL inicia por primera vez en Docker.

Para ejecutar manualmente:

```bash
# Desde el contenedor
docker exec -i catalogo-productos-db psql -U postgres -d catalogo_productos < services/api/init-db.sql
```

## 🔍 Verificar que Funciona

### Health Check

El health check ahora también verifica la conexión a la base de datos:

```bash
curl http://localhost:3001/health
```

**Respuesta exitosa:**
```json
{
  "status": "ok",
  "service": "catalogo-productos-api",
  "version": "v1",
  "database": "connected",
  "message": "API funcionando correctamente",
  "timestamp": "2025-11-11T21:40:21.898Z"
}
```

**Si hay error:**
```json
{
  "status": "error",
  "service": "catalogo-productos-api",
  "database": "disconnected",
  "message": "Error conectando a la base de datos"
}
```

## 🎓 Conceptos Clave

1. **Pool de Conexiones**: Reutiliza conexiones para mejor rendimiento
2. **Transacciones**: PostgreSQL soporta transacciones ACID
3. **Índices**: Creados automáticamente para búsquedas rápidas
4. **Migraciones**: Scripts SQL para crear/actualizar esquemas

## 📚 Recursos

- **Documentación PostgreSQL**: https://www.postgresql.org/docs/
- **Librería pg (Node.js)**: https://node-postgres.com/
- **Cloud SQL**: https://cloud.google.com/sql/docs/postgres
