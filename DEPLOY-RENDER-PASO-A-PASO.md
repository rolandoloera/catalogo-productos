# 🚀 Guía Paso a Paso: Desplegar en Render.com

Esta guía te llevará paso a paso para desplegar tu aplicación completa en Render.

---

## 📋 Checklist Inicial

Antes de empezar, asegúrate de tener:

- [ ] Cuenta en [Render.com](https://dashboard.render.com/) (gratis)
- [ ] Código subido a GitHub (ver `GITHUB-SETUP.md` si no lo has hecho)
- [ ] Aplicación funcionando localmente

---

## 🗄️ PASO 1: Crear Base de Datos PostgreSQL

### 1.1 Ir al Dashboard de Render

1. Abre tu navegador y ve a: https://dashboard.render.com/
2. Inicia sesión (o crea una cuenta si no tienes)

### 1.2 Crear Nueva Base de Datos

1. En el Dashboard, click en el botón **"New +"** (arriba a la derecha)
2. Selecciona **"PostgreSQL"** de la lista

### 1.3 Configurar la Base de Datos

Completa el formulario con estos valores:

**Configuración Básica:**
- **Name**: `catalogo-productos-db`
- **Database**: `catalogo_productos` (o déjalo por defecto)
- **User**: Se genera automáticamente (no necesitas cambiarlo)
- **Region**: Elige la región más cercana a ti (ej: `Oregon (US West)`)
- **PostgreSQL Version**: `15` (recomendado)
- **Plan**: `Free` (para empezar)

**⚠️ IMPORTANTE**: En el plan gratuito, la base de datos se "duerme" después de 90 días de inactividad.

### 1.4 Crear la Base de Datos

1. Click en **"Create Database"**
2. Espera 1-2 minutos mientras Render crea la base de datos
3. Verás un mensaje de "Provisioning..." y luego "Available"

### 1.5 Obtener Credenciales de Conexión

Una vez que la base de datos esté lista:

1. Click en el nombre de tu base de datos (`catalogo-productos-db`)
2. Ve a la pestaña **"Connections"**
3. Encontrarás dos URLs importantes:

   **Internal Database URL** (para servicios dentro de Render):
   ```
   postgres://usuario:password@host:5432/database
   ```
   ⚠️ **USA ESTA** para conectar desde tus servicios en Render

   **External Database URL** (para conexiones externas):
   ```
   postgres://usuario:password@host:5432/database
   ```
   (Solo si necesitas conectar desde fuera de Render)

4. **Copia la Internal Database URL** - La necesitarás en el siguiente paso

**💡 Tip**: También puedes ver las credenciales individuales:
- **Host**: `dpg-xxxxx-a.oregon-postgres.render.com`
- **Port**: `5432`
- **Database**: `catalogo_productos_xxxx`
- **User**: `catalogo_productos_user`
- **Password**: (se muestra una vez, guárdala)

---

## 🔌 PASO 2: Desplegar el API Service

### 2.1 Crear Nuevo Web Service

1. En el Dashboard, click en **"New +"** → **"Web Service"**

### 2.2 Conectar Repositorio

1. Si es la primera vez:
   - Click en **"Connect account"** (GitHub/GitLab/Bitbucket)
   - Autoriza Render para acceder a tus repositorios
2. Selecciona tu repositorio: `catalogo-productos` (o el nombre que le diste)
3. Selecciona la rama: `main` (o `master`)

### 2.3 Configurar el Servicio

Completa el formulario:

**Basic Settings:**
- **Name**: `catalogo-productos-api`
- **Region**: **Misma región** que tu base de datos (importante para latencia)
- **Branch**: `main`
- **Root Directory**: `services/api` ⚠️ **IMPORTANTE**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**⚠️ CRÍTICO**: El **Root Directory** debe ser `services/api` porque tu código está en esa carpeta.

### 2.4 Configurar Variables de Entorno

Antes de hacer deploy, ve a la sección **"Environment Variables"** y agrega:

1. Click en **"Add Environment Variable"**
2. Agrega estas variables:

   **Variable 1:**
   - **Key**: `PORT`
   - **Value**: `3001`

   **Variable 2:**
   - **Key**: `API_VERSION`
   - **Value**: `v1`

   **Variable 3 (LA MÁS IMPORTANTE):**
   - **Key**: `DATABASE_URL`
   - **Value**: Pega la **Internal Database URL** que copiaste en el Paso 1.5
     ```
     postgres://usuario:password@host:5432/database
     ```

### 2.5 Seleccionar Plan

- **Plan**: `Free` (para empezar)

### 2.6 Crear el Servicio

1. Click en **"Create Web Service"**
2. Render comenzará a construir tu aplicación
3. Verás los logs en tiempo real
4. Espera 2-5 minutos mientras:
   - Clona el repositorio
   - Instala dependencias (`npm install`)
   - Inicia el servidor

### 2.7 Verificar que Funciona

Una vez que veas "Your service is live":

1. Click en la URL que Render te proporciona (ej: `https://catalogo-productos-api.onrender.com`)
2. Agrega `/health` al final: `https://catalogo-productos-api.onrender.com/health`
3. Deberías ver:
   ```json
   {
     "status": "ok",
     "service": "catalogo-productos-api",
     "version": "v1",
     "database": "connected",
     ...
   }
   ```

✅ **Si ves `"database": "connected"`, ¡todo está funcionando!**

**⚠️ Si el servicio falla:**
- Ve a la pestaña **"Logs"** para ver errores
- Verifica que `DATABASE_URL` esté correcta
- Verifica que `Root Directory` sea `services/api`

---

## 🎨 PASO 3: Desplegar el Frontend Service

### 3.1 Crear Nuevo Web Service

1. En el Dashboard, click en **"New +"** → **"Web Service"**

### 3.2 Conectar Repositorio

1. Selecciona el **mismo repositorio** que usaste para el API
2. Selecciona la rama: `main`

### 3.3 Configurar el Servicio

**Basic Settings:**
- **Name**: `catalogo-productos-frontend`
- **Region**: **Misma región** que los otros servicios
- **Branch**: `main`
- **Root Directory**: `services/frontend` ⚠️ **IMPORTANTE**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3.4 Configurar Variables de Entorno

Agrega estas variables:

**Variable 1:**
- **Key**: `PORT`
- **Value**: `3000`

**Variable 2:**
- **Key**: `API_URL`
- **Value**: La URL completa de tu API Service
  ```
  https://catalogo-productos-api.onrender.com
  ```
  ⚠️ **Reemplaza** `catalogo-productos-api.onrender.com` con la URL real de tu API

### 3.5 Seleccionar Plan

- **Plan**: `Free`

### 3.6 Crear el Servicio

1. Click en **"Create Web Service"**
2. Espera a que termine el build (2-5 minutos)

### 3.7 Verificar que Funciona

1. Click en la URL del Frontend (ej: `https://catalogo-productos-frontend.onrender.com`)
2. Deberías ver la interfaz del catálogo de productos
3. Los productos deberían cargarse (aunque la tabla esté vacía por ahora)

---

## 🗃️ PASO 4: Inicializar la Base de Datos

Ahora necesitas crear la tabla `productos` e insertar datos de ejemplo.

### Opción A: Usar Render Shell (Recomendado)

1. Ve a tu base de datos PostgreSQL en Render Dashboard
2. Click en la pestaña **"Connect"**
3. Click en **"Render Shell"** (se abrirá una terminal)
4. Ejecuta este comando:

```sql
psql $DATABASE_URL
```

5. Una vez conectado, ejecuta:

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
('Producto 3', 'Descripción del producto 3', 50.00, 20);
```

6. Verifica que se insertaron:

```sql
SELECT * FROM productos;
```

7. Deberías ver 3 productos. Presiona `Ctrl+D` para salir.

### Opción B: El API lo crea automáticamente

Tu código tiene la función `initializeDatabase()` que se ejecuta al iniciar el API. Si el API ya está corriendo, la tabla debería haberse creado automáticamente.

**Para verificar:**
1. Ve a tu API Service en Render
2. Click en **"Logs"**
3. Busca estos mensajes:
   ```
   ✅ Conexión a PostgreSQL exitosa
   ✅ Tabla productos creada/verificada
   ✅ Productos de ejemplo insertados
   ```

Si ves estos mensajes, ¡la base de datos ya está inicializada!

---

## ✅ PASO 5: Verificar que Todo Funciona

### 5.1 Probar el API

Abre en tu navegador o usa `curl`:

```bash
# Health check
curl https://catalogo-productos-api.onrender.com/health

# Obtener productos
curl https://catalogo-productos-api.onrender.com/api/v1/productos
```

Deberías recibir un JSON con los productos.

### 5.2 Probar el Frontend

1. Abre: `https://catalogo-productos-frontend.onrender.com`
2. Deberías ver:
   - La interfaz del catálogo
   - Los 3 productos de ejemplo
   - Formulario para agregar/editar productos

### 5.3 Probar CRUD Completo

1. **Crear**: Agrega un nuevo producto desde el formulario
2. **Leer**: Verifica que aparezca en la lista
3. **Actualizar**: Click en "Editar" y modifica un producto
4. **Eliminar**: Click en "Eliminar" y confirma

Si todo funciona, ¡tu aplicación está desplegada! 🎉

---

## 🔧 Troubleshooting

### Problema: API no se conecta a la base de datos

**Solución:**
1. Ve al API Service → **"Environment"**
2. Verifica que `DATABASE_URL` esté configurada
3. Asegúrate de usar la **Internal Database URL** (no la External)
4. Verifica los logs del API para ver el error específico

### Problema: Frontend no carga productos

**Solución:**
1. Ve al Frontend Service → **"Environment"**
2. Verifica que `API_URL` apunte a la URL correcta del API
3. Abre la consola del navegador (F12) y revisa errores
4. Verifica que el API esté funcionando con el health check

### Problema: Build falla

**Solución:**
1. Ve a **"Logs"** del servicio que falla
2. Verifica que `Root Directory` sea correcto:
   - API: `services/api`
   - Frontend: `services/frontend`
3. Verifica que `package.json` tenga el script `start`

### Problema: Servicio se "duerme" (Free Plan)

**Solución:**
- En el plan gratuito, los servicios se duermen después de 15 minutos de inactividad
- La primera petición puede tardar ~30 segundos en "despertar"
- Considera usar un servicio de "ping" como [UptimeRobot](https://uptimerobot.com/) para mantenerlo activo

---

## 📝 Resumen de URLs

Una vez desplegado, tendrás:

- **Base de Datos**: `catalogo-productos-db` (solo accesible desde Render)
- **API Service**: `https://catalogo-productos-api.onrender.com`
- **Frontend Service**: `https://catalogo-productos-frontend.onrender.com`

---

## 🎯 Próximos Pasos

- ✅ Aplicación desplegada y funcionando
- 🔄 Cada vez que hagas `git push`, Render desplegará automáticamente (si tienes Auto-Deploy activado)
- 📊 Monitorea tus servicios en el Dashboard
- 🔒 Considera actualizar a un plan de pago para evitar que los servicios se duerman

---

¡Felicitaciones! 🎉 Tu aplicación está en producción en Render.com

