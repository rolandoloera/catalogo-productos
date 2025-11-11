# 🚀 Guía de Despliegue en Render.com

Esta guía te ayudará a desplegar tu aplicación de catálogo de productos en [Render.com](https://dashboard.render.com/).

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Paso 1: Crear Base de Datos PostgreSQL](#paso-1-crear-base-de-datos-postgresql)
3. [Paso 2: Desplegar el API Service](#paso-2-desplegar-el-api-service)
4. [Paso 3: Desplegar el Frontend Service](#paso-3-desplegar-el-frontend-service)
5. [Paso 4: Configurar Variables de Entorno](#paso-4-configurar-variables-de-entorno)
6. [Paso 5: Inicializar la Base de Datos](#paso-5-inicializar-la-base-de-datos)
7. [Verificación y Pruebas](#verificación-y-pruebas)
8. [Troubleshooting](#troubleshooting)

---

## 📦 Requisitos Previos

- ✅ Cuenta en [Render.com](https://dashboard.render.com/) (gratis)
- ✅ Código en un repositorio Git (GitHub, GitLab, o Bitbucket)
- ✅ Aplicación funcionando localmente con Docker Compose

---

## 🗄️ Paso 1: Crear Base de Datos PostgreSQL

### 1.1 Crear Nueva Base de Datos

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Click en **"New +"** → **"PostgreSQL"**
3. Configura la base de datos:
   - **Name**: `catalogo-productos-db`
   - **Database**: `catalogo_productos` (o déjalo por defecto)
   - **User**: Se genera automáticamente
   - **Region**: Elige la más cercana a ti
   - **PostgreSQL Version**: `15` (recomendado)
   - **Plan**: `Free` (para empezar)

4. Click en **"Create Database"**

### 1.2 Obtener Credenciales de Conexión

Una vez creada la base de datos:

1. Ve a la página de tu base de datos
2. En la sección **"Connections"**, encontrarás:
   - **Internal Database URL**: Para servicios dentro de Render
   - **External Database URL**: Para conexiones externas
   - **Host**: `dpg-xxxxx-a.oregon-postgres.render.com`
   - **Port**: `5432`
   - **Database**: `catalogo_productos_xxxx`
   - **User**: `catalogo_productos_user`
   - **Password**: (se muestra una vez, guárdala)

**⚠️ IMPORTANTE**: Guarda estas credenciales, las necesitarás para el API.

---

## 🔌 Paso 2: Desplegar el API Service

### 2.1 Crear Nuevo Web Service

1. En Render Dashboard, click en **"New +"** → **"Web Service"**
2. Conecta tu repositorio Git:
   - Si es la primera vez, autoriza Render para acceder a tu repositorio
   - Selecciona el repositorio que contiene tu código
   - Selecciona la rama (generalmente `main` o `master`)

### 2.2 Configurar el Build

Configura el servicio con estos valores:

**Basic Settings:**
- **Name**: `catalogo-productos-api`
- **Region**: Misma región que la base de datos
- **Branch**: `main` (o tu rama principal)
- **Root Directory**: `services/api`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Environment Variables:**
Por ahora déjalas vacías, las configuraremos después.

### 2.3 Configurar Variables de Entorno

Antes de hacer deploy, ve a **"Environment"** y agrega:

```
PORT=3001
API_VERSION=v1
DB_HOST=<HOST_DE_TU_POSTGRES>
DB_PORT=5432
DB_NAME=<NOMBRE_DE_BD>
DB_USER=<USUARIO_DE_BD>
DB_PASSWORD=<PASSWORD_DE_BD>
```

**Ejemplo:**
```
PORT=3001
API_VERSION=v1
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=catalogo_productos_xxxx
DB_USER=catalogo_productos_user
DB_PASSWORD=tu_password_aqui
```

**💡 Tip**: Render puede usar la **Internal Database URL** completa. Si prefieres, puedes usar:
```
DATABASE_URL=<INTERNAL_DATABASE_URL_COMPLETA>
```

Y modificar `database.js` para usar `DATABASE_URL` si está disponible.

### 2.4 Hacer Deploy

1. Click en **"Create Web Service"**
2. Render comenzará a construir y desplegar tu API
3. Espera a que el build termine (puede tomar 2-5 minutos)
4. Una vez desplegado, obtendrás una URL como: `https://catalogo-productos-api.onrender.com`

---

## 🎨 Paso 3: Desplegar el Frontend Service

### 3.1 Crear Nuevo Web Service

1. Click en **"New +"** → **"Web Service"**
2. Selecciona el mismo repositorio

### 3.2 Configurar el Build

**Basic Settings:**
- **Name**: `catalogo-productos-frontend`
- **Region**: Misma región que los otros servicios
- **Branch**: `main`
- **Root Directory**: `services/frontend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Environment Variables:**
```
PORT=3000
API_URL=https://catalogo-productos-api.onrender.com
```

**⚠️ IMPORTANTE**: Reemplaza `catalogo-productos-api.onrender.com` con la URL real de tu API.

### 3.3 Hacer Deploy

1. Click en **"Create Web Service"**
2. Espera a que termine el build
3. Obtendrás una URL como: `https://catalogo-productos-frontend.onrender.com`

---

## 🔧 Paso 4: Configurar Variables de Entorno (Actualizar)

### 4.1 Actualizar Frontend con URL del API

Una vez que tengas la URL del API:

1. Ve a tu servicio Frontend en Render
2. Ve a **"Environment"**
3. Actualiza `API_URL` con la URL real del API:
   ```
   API_URL=https://catalogo-productos-api.onrender.com
   ```
4. Click en **"Save Changes"**
5. Render reiniciará automáticamente el servicio

---

## 🗃️ Paso 5: Inicializar la Base de Datos

### 5.1 Opción A: Usar Render Shell (Recomendado)

1. Ve a tu base de datos PostgreSQL en Render
2. Click en **"Connect"** → **"Render Shell"**
3. Se abrirá una terminal
4. Ejecuta:

```sql
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO productos (nombre, descripcion, precio, stock) VALUES
('Producto 1', 'Descripción del producto 1', 100.50, 10),
('Producto 2', 'Descripción del producto 2', 250.75, 5),
('Producto 3', 'Descripción del producto 3', 50.00, 20)
ON CONFLICT (id) DO NOTHING;
```

### 5.2 Opción B: Usar el Script SQL

1. Ve a tu servicio API en Render
2. Click en **"Shell"** (terminal)
3. O usa un cliente PostgreSQL local conectándote con la **External Database URL**

### 5.3 Opción C: El API lo crea automáticamente

Si tu `database.js` tiene la función `initializeDatabase()`, el API debería crear la tabla automáticamente al iniciar. Verifica los logs del API para confirmar.

---

## ✅ Verificación y Pruebas

### 6.1 Verificar Health Check del API

```bash
curl https://catalogo-productos-api.onrender.com/health
```

Deberías recibir:
```json
{
  "status": "ok",
  "service": "catalogo-productos-api",
  "version": "v1",
  "database": "connected",
  "message": "API funcionando correctamente",
  "timestamp": "2024-..."
}
```

### 6.2 Verificar Endpoint de Productos

```bash
curl https://catalogo-productos-api.onrender.com/api/v1/productos
```

Deberías recibir un array de productos.

### 6.3 Probar el Frontend

1. Abre en tu navegador: `https://catalogo-productos-frontend.onrender.com`
2. Deberías ver la interfaz del catálogo
3. Los productos deberían cargarse correctamente

---

## 🔍 Troubleshooting

### Problema: API no se conecta a la base de datos

**Solución:**
1. Verifica que las variables de entorno estén correctas
2. Asegúrate de usar la **Internal Database URL** (no la External) si ambos servicios están en Render
3. Verifica los logs del API en Render Dashboard

### Problema: Frontend no carga productos

**Solución:**
1. Verifica que `API_URL` en el Frontend apunte a la URL correcta del API
2. Abre la consola del navegador (F12) y revisa errores
3. Verifica que el API esté funcionando con el health check

### Problema: Build falla

**Solución:**
1. Verifica que `Root Directory` esté correcto (`services/api` o `services/frontend`)
2. Asegúrate de que `package.json` tenga el script `start`
3. Revisa los logs de build en Render

### Problema: Servicio se duerme (Free Plan)

**Solución:**
- En el plan gratuito, los servicios se "duermen" después de 15 minutos de inactividad
- La primera petición puede tardar ~30 segundos en "despertar"
- Considera usar un servicio de "ping" como [UptimeRobot](https://uptimerobot.com/) para mantenerlo activo

---

## 📝 Checklist Final

- [ ] Base de datos PostgreSQL creada en Render
- [ ] Credenciales de base de datos guardadas
- [ ] API Service desplegado y funcionando
- [ ] Health check del API responde correctamente
- [ ] Frontend Service desplegado
- [ ] `API_URL` configurado en Frontend
- [ ] Base de datos inicializada con tabla `productos`
- [ ] Frontend carga productos correctamente
- [ ] CRUD completo funcionando

---

## 🎯 Mejoras Opcionales

### Usar DATABASE_URL en lugar de variables separadas

Render proporciona `DATABASE_URL` automáticamente. Puedes modificar `database.js`:

```javascript
// database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});
```

### Agregar Script de Build

Puedes crear un `render.yaml` para automatizar el despliegue:

```yaml
services:
  - type: web
    name: catalogo-productos-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: PORT
        value: 3001
      - key: API_VERSION
        value: v1
      - key: DATABASE_URL
        fromDatabase:
          name: catalogo-productos-db
          property: connectionString

  - type: web
    name: catalogo-productos-frontend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: PORT
        value: 3000
      - key: API_URL
        fromService:
          name: catalogo-productos-api
          type: web
          property: host

databases:
  - name: catalogo-productos-db
    databaseName: catalogo_productos
    user: catalogo_productos_user
```

---

## 📚 Recursos Adicionales

- [Render Documentation](https://render.com/docs)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Web Services on Render](https://render.com/docs/web-services)
- [Environment Variables](https://render.com/docs/environment-variables)

---

¡Felicitaciones! 🎉 Tu aplicación está desplegada en Render.com

