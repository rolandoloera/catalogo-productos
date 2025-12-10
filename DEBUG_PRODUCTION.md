# 🐛 Debug de Error 500 en Producción

## Error Actual:
```
GET https://catalogo-productos-api.onrender.com/api/v1/productos 
net::ERR_FAILED 500 (Internal Server Error)
```

## 🔍 Pasos para Diagnosticar:

### 1. Verificar Logs del API en Render

1. Ve a tu servicio API en Render: `catalogo-productos-api`
2. Haz clic en **"Logs"**
3. Busca errores relacionados con:
   - Conexión a PostgreSQL
   - `DATABASE_URL`
   - `Error obteniendo productos`

### 2. Verificar Variables de Entorno del API

En Render → Tu servicio API → Environment, verifica:

**OBLIGATORIAS:**
```env
DATABASE_URL=postgresql://... (debe estar configurada)
JWT_SECRET=tu-secreto (debe estar configurada)
```

**IMPORTANTE PARA CORS:**
```env
FRONTEND_URL=https://catalogo-productos-nextjs.onrender.com
```

### 3. Verificar que la Base de Datos esté Conectada

1. En Render, ve a tu base de datos PostgreSQL
2. Ve a la sección **"Connections"**
3. Verifica que el servicio API esté conectado
4. Copia el **Internal Database URL** y verifica que esté en `DATABASE_URL` del API

### 4. Probar el Endpoint Directamente

Abre en tu navegador o usa curl:

```bash
curl https://catalogo-productos-api.onrender.com/api/v1/productos
```

O abre en el navegador:
```
https://catalogo-productos-api.onrender.com/api/v1/productos
```

Deberías ver:
- Si funciona: JSON con productos
- Si falla: Mensaje de error que te dirá qué está mal

### 5. Verificar Health Check

```bash
curl https://catalogo-productos-api.onrender.com/health
```

Debería responder: `{ "status": "ok" }`

---

## 🔧 Soluciones Comunes:

### Problema 1: DATABASE_URL no configurada

**Síntoma**: Logs muestran "DATABASE_URL no configurada" o "No se pudo conectar a PostgreSQL"

**Solución**:
1. Ve a tu BD PostgreSQL en Render
2. Copia el **Internal Database URL** de la sección Connections
3. Pégalo en `DATABASE_URL` del servicio API
4. Haz Manual Deploy

### Problema 2: Base de datos no conectada al servicio

**Síntoma**: Error de conexión

**Solución**:
1. En Render, ve a tu base de datos
2. Sección **"Connections"**
3. Conecta el servicio API a la base de datos

### Problema 3: Tablas no existen

**Síntoma**: Error "relation productos does not exist"

**Solución**:
El código debería crear las tablas automáticamente al iniciar. Si no:
1. Verifica los logs del API al iniciar
2. Debe mostrar: "✅ Tabla productos creada/verificada"
3. Si no aparece, puede haber un error de permisos

### Problema 4: CORS aún bloqueando

**Síntoma**: Error de CORS después de error 500

**Solución**:
1. Verifica que `FRONTEND_URL` esté configurada en el API
2. Debe ser exactamente: `https://catalogo-productos-nextjs.onrender.com`
3. Haz Manual Deploy del API

---

## 📋 Checklist de Verificación:

- [ ] `DATABASE_URL` configurada en el API
- [ ] `JWT_SECRET` configurada en el API
- [ ] `FRONTEND_URL` configurada en el API
- [ ] Base de datos conectada al servicio API (sección Connections)
- [ ] API redesplegado después de cambios
- [ ] Logs del API no muestran errores críticos
- [ ] Health check responde correctamente

---

## 🆘 Si Nada Funciona:

1. **Revisa los logs completos** del API en Render
2. **Copia el error exacto** que aparece
3. **Verifica que todas las variables de entorno** estén configuradas
4. **Haz un Manual Deploy** del API
5. **Espera 2-3 minutos** después del deploy

---

**Última actualización**: Diciembre 2024

