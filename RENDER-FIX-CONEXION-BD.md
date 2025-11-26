# 🔧 FIX: Error de Conexión a Base de Datos en Render

## ❌ Problema
El health check muestra: `{"database":"disconnected","message":"Error conectando a la base de datos"}`

## ✅ Solución Paso a Paso

### PASO 1: Verificar Variables de Entorno en Render

1. Ve a: https://dashboard.render.com/
2. Abre tu servicio **`catalogo-productos-api`**
3. Ve a la pestaña **"Environment"**
4. Verifica que tengas esta variable:

```
DATABASE_URL=postgresql://postgres:loar8811@db.royezgjemrtwzdrdpdon.supabase.co:5432/postgres?sslmode=require
```

**⚠️ IMPORTANTE:**
- La URL debe terminar con `?sslmode=require`
- No debe tener espacios al inicio o final
- La contraseña debe ser correcta: `loar8811`

### PASO 2: Si NO existe la variable DATABASE_URL

1. En Render, ve a **Environment** → **Add Environment Variable**
2. Nombre: `DATABASE_URL`
3. Valor: `postgresql://postgres:loar8811@db.royezgjemrtwzdrdpdon.supabase.co:5432/postgres?sslmode=require`
4. Click en **Save Changes**
5. Render reiniciará automáticamente el servicio

### PASO 3: Verificar Logs Después del Reinicio

1. Ve a la pestaña **"Logs"** en Render
2. Busca estos mensajes:

**✅ Si funciona:**
```
✅ Conexión a PostgreSQL exitosa
   Conexión: DATABASE_URL (db.royezgjemrtwzdrdpdon.supabase.co:5432)
```

**❌ Si falla:**
```
❌ Error conectando a PostgreSQL: [mensaje de error]
   Código: [código de error]
   Host en DATABASE_URL: db.royezgjemrtwzdrdpdon.supabase.co:5432
```

### PASO 4: Errores Comunes y Soluciones

#### Error: "connection refused" o "ECONNREFUSED"
- **Causa**: El host o puerto es incorrecto
- **Solución**: Verifica que la URL de Supabase sea correcta

#### Error: "password authentication failed"
- **Causa**: La contraseña es incorrecta
- **Solución**: Verifica la contraseña en Supabase Dashboard → Settings → Database

#### Error: "SSL required" o "no SSL"
- **Causa**: Falta `?sslmode=require` en la URL
- **Solución**: Agrega `?sslmode=require` al final de DATABASE_URL

#### Error: "timeout" o "connection timeout"
- **Causa**: Supabase puede estar bloqueando la IP de Render
- **Solución**: Verifica en Supabase Dashboard → Settings → Database → Connection Pooling

### PASO 5: Verificar en Supabase

1. Ve a: https://supabase.com/dashboard
2. Abre tu proyecto
3. Ve a **Settings** → **Database**
4. Verifica:
   - **Connection string**: Debe coincidir con la que usas en Render
   - **Connection pooling**: Puede estar deshabilitado (está bien)
   - **IP Allowlist**: Debe permitir todas las IPs (0.0.0.0/0) o la IP de Render

### PASO 6: Probar la Conexión Manualmente

Desde tu terminal local (con Docker):

```bash
docker run --rm -it postgres:15 psql "postgresql://postgres:loar8811@db.royezgjemrtwzdrdpdon.supabase.co:5432/postgres?sslmode=require" -c "SELECT NOW();"
```

Si funciona localmente pero no en Render, el problema es de configuración en Render.

## 🔍 Verificar el Fix

Después de aplicar los cambios:

1. Espera 2-3 minutos para que Render reinicie
2. Ve a: https://catalogo-productos-api.onrender.com/health
3. Debe mostrar:
```json
{
  "status": "ok",
  "service": "catalogo-productos-api",
  "database": "connected",
  "message": "API funcionando correctamente"
}
```

## 📝 Notas Importantes

- Render reinicia automáticamente cuando cambias variables de entorno
- Los logs pueden tardar 1-2 minutos en actualizarse
- Si el problema persiste, verifica los logs completos en Render

