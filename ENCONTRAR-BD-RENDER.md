# 🔍 Cómo Encontrar o Crear la Base de Datos en Render

Si no ves la base de datos PostgreSQL en tu Dashboard de Render, aquí te explico cómo encontrarla o crearla.

---

## 🔎 Paso 1: Buscar la Base de Datos en el Dashboard

### Opción A: Ver Todos los Servicios

1. En el Dashboard de Render, **arriba a la izquierda** hay un menú
2. Click en **"Services"** o **"All Services"**
3. Deberías ver una lista con:
   - `catalogo-productos-api` (Web Service)
   - `catalogo-productos-frontend` (Web Service)
   - `catalogo-productos-db` (PostgreSQL Database) ← **Aquí debería estar**

### Opción B: Filtrar por Tipo

1. En el Dashboard, busca un **filtro o dropdown** que diga "All" o "Filter"
2. Selecciona **"Databases"** o **"PostgreSQL"**
3. Deberías ver solo las bases de datos

### Opción C: Buscar en la Barra de Búsqueda

1. En la parte superior del Dashboard hay una **barra de búsqueda**
2. Escribe: `catalogo-productos` o `postgres`
3. Debería aparecer la base de datos si existe

---

## 🆕 Paso 2: Crear la Base de Datos (Si No Existe)

Si no encuentras la base de datos, significa que **no se creó** o se creó en otro lugar. Vamos a crearla:

### 2.1 Crear Nueva Base de Datos PostgreSQL

1. En el Dashboard de Render, click en **"New +"** (arriba a la derecha)
2. Selecciona **"PostgreSQL"** de la lista

### 2.2 Configurar la Base de Datos

Completa el formulario:

**Configuración:**
- **Name**: `catalogo-productos-db`
- **Database**: `catalogo_productos` (o déjalo por defecto)
- **User**: Se genera automáticamente
- **Region**: **MISMA REGIÓN** que tus servicios web (importante)
- **PostgreSQL Version**: `15`
- **Plan**: `Free`

### 2.3 Crear la Base de Datos

1. Click en **"Create Database"**
2. Espera 1-2 minutos mientras Render crea la BD
3. Verás "Provisioning..." y luego "Available"

---

## 🔗 Paso 3: Conectar el API a la Base de Datos

Una vez que tengas la base de datos:

### 3.1 Obtener la Internal Database URL

1. Click en tu base de datos (`catalogo-productos-db`)
2. Ve a la pestaña **"Connections"**
3. Copia la **"Internal Database URL"**
   - Formato: `postgres://usuario:password@host:5432/database`

### 3.2 Configurar DATABASE_URL en el API

1. Ve a tu servicio API: `catalogo-productos-api`
2. Ve a la pestaña **"Environment"**
3. Busca la variable `DATABASE_URL`
4. Si no existe, click en **"Add Environment Variable"**:
   - **Key**: `DATABASE_URL`
   - **Value**: Pega la **Internal Database URL** que copiaste
5. Click en **"Save Changes"**
6. Render reiniciará automáticamente el servicio

---

## ✅ Paso 4: Verificar que Está Conectada

### 4.1 Revisar los Logs del API

1. Ve a tu servicio API
2. Click en la pestaña **"Logs"**
3. Deberías ver:
   ```
   ✅ Conexión a PostgreSQL exitosa
   ✅ Tabla productos creada/verificada
   ```

### 4.2 Probar el Health Check

1. Abre: `https://catalogo-productos-api.onrender.com/health`
2. Deberías ver:
   ```json
   {
     "status": "ok",
     "database": "connected"
   }
   ```

Si ves `"database": "connected"`, ¡todo está bien! ✅

---

## 🎯 Verificación Rápida

### Checklist:

- [ ] Base de datos aparece en el Dashboard
- [ ] Base de datos está en la **misma región** que los servicios web
- [ ] `DATABASE_URL` está configurada en el API Service
- [ ] Health check muestra `"database": "connected"`
- [ ] Los productos se cargan correctamente en el Frontend

---

## 🚨 Problemas Comunes

### Problema: "No veo la base de datos en el Dashboard"

**Posibles causas:**
1. Se creó en otra organización/team
2. Se eliminó accidentalmente
3. Hay un filtro activo que la oculta

**Solución:**
- Busca en "All Services"
- Verifica que no haya filtros activos
- Si no aparece, créala de nuevo (Paso 2)

### Problema: "La base de datos está en otra región"

**Solución:**
- Esto puede causar latencia
- Lo ideal es que todos los servicios estén en la misma región
- Puedes crear una nueva BD en la región correcta y migrar los datos (o empezar de nuevo)

### Problema: "DATABASE_URL no funciona"

**Solución:**
1. Asegúrate de usar la **Internal Database URL** (no la External)
2. Verifica que la BD esté "Available" (no "Sleeping")
3. Verifica que el formato de la URL sea correcto

---

## 💡 Tips

1. **Nombres consistentes**: Usa el mismo prefijo para todos los servicios (`catalogo-productos-*`)
2. **Misma región**: Todos los servicios en la misma región para mejor rendimiento
3. **Guardar URLs**: Guarda las URLs de conexión en un lugar seguro
4. **Verificar logs**: Siempre revisa los logs después de configurar la BD

---

## 📊 Estructura Esperada en el Dashboard

Después de crear todo, deberías ver:

```
Render Dashboard
├── catalogo-productos-api (Web Service)
├── catalogo-productos-frontend (Web Service)
└── catalogo-productos-db (PostgreSQL Database)
```

Todos deberían estar en la **misma región** y con el mismo prefijo de nombre.

---

¡Con esto deberías poder encontrar o crear tu base de datos! 🎉

