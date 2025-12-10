# 🚀 Guía de Configuración en Render

## 📋 Variables de Entorno por Servicio

### 🔴 **SERVICIO API (Backend)** - `catalogo-productos-api`

**Ubicación en Render**: Dashboard → Tu servicio API → Environment

#### Variables OBLIGATORIAS:
```env
# Base de datos (Render la crea automáticamente, pero debes conectarla)
DATABASE_URL=postgresql://usuario:password@host:5432/database?sslmode=require

# JWT Secret (OBLIGATORIO en producción)
JWT_SECRET=tu-secreto-generado-con-openssl-rand-base64-32

# Puerto (Render lo asigna automáticamente, pero puedes especificarlo)
PORT=10000
```

#### Variables OPCIONALES:
```env
# Versión de la API
API_VERSION=v1

# URL del frontend (para CORS)
FRONTEND_URL=https://tu-frontend.onrender.com

# URL base de la API (para URLs de imágenes)
API_BASE_URL=https://catalogo-productos-api.onrender.com

# Cloudinary (opcional - para almacenamiento de imágenes en producción)
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

# Usuario admin por defecto (solo si no existe ningún admin)
ADMIN_EMAIL=admin@catalogo.com
ADMIN_PASSWORD=admin123
ADMIN_NOMBRE=Administrador

# JWT expiración
JWT_EXPIRES_IN=24h

# Node environment
NODE_ENV=production
```

---

### 🟢 **SERVICIO FRONTEND (Next.js)** - `catalogo-productos-frontend`

**Ubicación en Render**: Dashboard → Tu servicio Frontend → Environment

#### Variables OBLIGATORIAS:
```env
# URL de la API (DEBE empezar con NEXT_PUBLIC_ para que Next.js la exponga al cliente)
NEXT_PUBLIC_API_URL=https://catalogo-productos-api.onrender.com

# Puerto (Render lo asigna automáticamente)
PORT=10000
```

#### Variables OPCIONALES:
```env
# Versión de la API (si es diferente a v1)
API_VERSION=v1

# Node environment
NODE_ENV=production
```

---

## ⚠️ PROBLEMA COMÚN: Error "al cargar productos"

### Causas posibles:

1. **❌ `NEXT_PUBLIC_API_URL` no configurada en el Frontend**
   - **Síntoma**: Error al cargar productos
   - **Solución**: Agregar `NEXT_PUBLIC_API_URL` en el servicio Frontend con la URL de tu API

2. **❌ `DATABASE_URL` no configurada en el API**
   - **Síntoma**: API responde con error 500
   - **Solución**: Conectar la base de datos PostgreSQL al servicio API en Render

3. **❌ `JWT_SECRET` no configurado en el API**
   - **Síntoma**: API no inicia o errores de autenticación
   - **Solución**: Generar y agregar `JWT_SECRET`

4. **❌ CORS bloqueado**
   - **Síntoma**: Error de CORS en el navegador
   - **Solución**: Configurar `FRONTEND_URL` en el API con la URL exacta del frontend

5. **❌ URL de API incorrecta**
   - **Síntoma**: Error de conexión o timeout
   - **Solución**: Verificar que `NEXT_PUBLIC_API_URL` apunte a la URL correcta (sin `/api/v1` al final)

---

## 🔧 Pasos para Configurar en Render

### Paso 1: Configurar el API (Backend)

1. Ve a tu servicio API en Render
2. Ve a **Environment**
3. Agrega estas variables:

```env
DATABASE_URL=<Desde la sección Connections de tu BD PostgreSQL>
JWT_SECRET=<Genera uno con: openssl rand -base64 32>
FRONTEND_URL=https://tu-frontend.onrender.com
NODE_ENV=production
```

4. **Conectar la Base de Datos**:
   - Ve a tu base de datos PostgreSQL en Render
   - En la sección **Connections**, copia el **Internal Database URL**
   - Pégalo en `DATABASE_URL` del servicio API

### Paso 2: Configurar el Frontend

1. Ve a tu servicio Frontend en Render
2. Ve a **Environment**
3. Agrega esta variable:

```env
NEXT_PUBLIC_API_URL=https://tu-api.onrender.com
```

**⚠️ IMPORTANTE**: 
- La URL debe ser la URL pública de tu API (ej: `https://catalogo-productos-api.onrender.com`)
- NO incluyas `/api/v1` al final
- DEBE empezar con `NEXT_PUBLIC_` para que Next.js la exponga al cliente

### Paso 3: Verificar que Funciona

1. **Verifica los logs del API**:
   - Debe mostrar: `✅ Conexión a PostgreSQL exitosa`
   - Debe mostrar: `🚀 Servidor corriendo en puerto...`

2. **Verifica los logs del Frontend**:
   - No debe haber errores de conexión

3. **Prueba en el navegador**:
   - Abre la consola del navegador (F12)
   - Ve a la pestaña Network
   - Recarga la página
   - Busca la petición a `/api/v1/productos`
   - Debe responder con status 200 y datos JSON

---

## 🐛 Debugging

### Si el API no conecta a la BD:

1. Verifica que `DATABASE_URL` esté configurada
2. Verifica que la BD esté conectada al servicio API (sección Connections)
3. Revisa los logs del API para ver el error específico

### Si el Frontend no carga productos:

1. Verifica que `NEXT_PUBLIC_API_URL` esté configurada
2. Verifica que la URL sea correcta (sin `/api/v1`)
3. Abre la consola del navegador y revisa los errores
4. Verifica que el API esté funcionando (prueba la URL directamente)

### Verificar que el API funciona:

```bash
# Prueba el endpoint de productos
curl https://tu-api.onrender.com/api/v1/productos

# Debe responder con JSON de productos
```

### Verificar que el Frontend puede conectarse:

1. Abre tu frontend en el navegador
2. Abre DevTools (F12)
3. Ve a Console
4. Debe mostrar la URL de la API que está usando
5. Ve a Network
6. Busca la petición a `/api/v1/productos`
7. Verifica el status y la respuesta

---

## 📝 Checklist de Configuración

### API (Backend):
- [ ] `DATABASE_URL` configurada (desde Connections de la BD)
- [ ] `JWT_SECRET` configurado (generado con openssl)
- [ ] `FRONTEND_URL` configurada (URL del frontend)
- [ ] `NODE_ENV=production`
- [ ] Base de datos conectada al servicio API

### Frontend:
- [ ] `NEXT_PUBLIC_API_URL` configurada (URL del API, sin `/api/v1`)
- [ ] `NODE_ENV=production`

### Verificación:
- [ ] API inicia sin errores
- [ ] API conecta a la BD (ver logs)
- [ ] Frontend inicia sin errores
- [ ] Frontend puede hacer requests al API (ver Network en navegador)
- [ ] Productos se cargan correctamente

---

## 🔗 URLs de Ejemplo

Si tu API se llama `catalogo-productos-api`:
- URL del API: `https://catalogo-productos-api.onrender.com`
- `NEXT_PUBLIC_API_URL`: `https://catalogo-productos-api.onrender.com`

Si tu Frontend se llama `catalogo-productos-frontend`:
- URL del Frontend: `https://catalogo-productos-frontend.onrender.com`
- `FRONTEND_URL` (en API): `https://catalogo-productos-frontend.onrender.com`

---

**Última actualización**: Diciembre 2024

