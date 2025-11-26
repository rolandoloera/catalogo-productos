# 🚀 Guía: Migrar Base de Datos de Supabase a Neon

## 📋 Paso 1: Crear cuenta en Neon

1. Ve a: https://neon.tech/
2. Click en **"Sign Up"** o **"Get Started"**
3. Regístrate con:
   - GitHub (recomendado)
   - Email
   - Google
4. Confirma tu email si es necesario

## 📋 Paso 2: Crear proyecto en Neon

1. Una vez dentro del dashboard, click en **"Create Project"**
2. Configura el proyecto:
   - **Project name**: `catalogo-productos` (o el nombre que prefieras)
   - **Region**: Elige la región más cercana (ej: `US East (Ohio)`)
   - **PostgreSQL version**: `15` o `16` (recomendado)
3. Click en **"Create Project"**
4. Espera 1-2 minutos mientras se crea el proyecto

## 📋 Paso 3: Obtener Connection String de Neon

1. En el dashboard de Neon, verás tu proyecto
2. Busca la sección **"Connection Details"** o **"Connection String"**
3. Verás algo como:
   ```
   postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **IMPORTANTE**: Copia esta URL completa
5. También verás:
   - **Host**: `ep-xxxxx.us-east-2.aws.neon.tech`
   - **Database**: `neondb` (o el nombre que hayas puesto)
   - **User**: `usuario`
   - **Password**: `password` (cópiala también)

## 📋 Paso 4: Hacer backup de Supabase

### Opción A: Desde tu máquina local (si tienes acceso)

```bash
# Instalar pg_dump si no lo tienes (Windows con Chocolatey)
# choco install postgresql

# O usar Docker
docker run --rm -e PGPASSWORD=loar8811 postgres:15 pg_dump "postgresql://postgres:loar8811@db.royezgjemrtwzdrdpdon.supabase.co:5432/postgres?sslmode=require" > backup_supabase.sql
```

### Opción B: Desde Supabase Dashboard

1. Ve a: https://supabase.com/dashboard
2. Abre tu proyecto
3. Ve a **SQL Editor**
4. Ejecuta este query para exportar datos:

```sql
-- Exportar estructura y datos
-- (Ya tienes el backup_20251121.sql que creamos antes)
```

**Usa el archivo `backup_20251121.sql` que ya tienes** ✅

## 📋 Paso 5: Restaurar backup en Neon

### Opción A: Desde Neon Dashboard (SQL Editor)

1. Ve a tu proyecto en Neon Dashboard
2. Click en **"SQL Editor"** o **"Query"**
3. Abre el archivo `backup_20251121.sql`
4. **IMPORTANTE**: Necesitas limpiar el SQL primero (ver abajo)
5. Copia y pega el SQL limpio
6. Click en **"Run"** o ejecuta el query

### Opción B: Desde terminal local (con psql)

```bash
# Con Docker
docker run --rm -i -e PGPASSWORD=TU_PASSWORD_NEON postgres:15 psql "postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require" < backup_20251121.sql
```

## 📋 Paso 6: Limpiar SQL para Neon

Neon puede tener restricciones similares a Supabase. Usa el mismo script limpio que usamos para Supabase:

1. Abre `backup_20251121.sql`
2. Busca y elimina/comenta:
   - Líneas que empiecen con `\` (comandos psql)
   - `OWNER TO` clauses
   - `SET default_table_access_method`
3. O usa el script limpio que ya creamos antes

## 📋 Paso 7: Actualizar DATABASE_URL en Render

1. Ve a: https://dashboard.render.com/
2. Abre tu servicio `catalogo-productos-api`
3. Ve a la pestaña **"Environment"**
4. Busca la variable `DATABASE_URL`
5. Edítala con la nueva URL de Neon:
   ```
   postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
6. **Reemplaza**:
   - `usuario` → Tu usuario de Neon
   - `password` → Tu password de Neon
   - `ep-xxxxx.us-east-2.aws.neon.tech` → Tu host de Neon
   - `neondb` → Tu database name de Neon
7. Click en **"Save Changes"**
8. Render reiniciará automáticamente

## 📋 Paso 8: Verificar conexión

1. Espera 2-3 minutos para que Render reinicie
2. Ve a los **Logs** en Render
3. Deberías ver:
   ```
   ✅ DNS resuelto a IPv4: [dirección]
   ✅ Conexión a PostgreSQL exitosa
   ```
4. Prueba el health check:
   ```
   https://catalogo-productos-api.onrender.com/health
   ```
5. Debe mostrar: `{"database":"connected",...}`

## 📋 Paso 9: Verificar datos

1. Prueba el endpoint de productos:
   ```
   https://catalogo-productos-api.onrender.com/api/v1/productos
   ```
2. Deberías ver tus productos
3. Prueba el login de admin:
   ```
   https://catalogo-productos-nextjs.onrender.com/admin/login
   ```

## ✅ Ventajas de Neon

- ✅ Soporte IPv4 nativo (no tendrás problemas de IPv6)
- ✅ Plan gratuito generoso (512 MB storage, 0.5 CPU)
- ✅ PostgreSQL 15/16
- ✅ Backups automáticos
- ✅ Dashboard fácil de usar
- ✅ Connection pooling incluido

## 🔧 Troubleshooting

### Error: "connection refused"
- Verifica que la DATABASE_URL esté correcta
- Verifica que el password no tenga caracteres especiales que necesiten encoding

### Error: "database does not exist"
- Verifica el nombre de la base de datos en Neon
- Por defecto es `neondb` pero puede ser diferente

### Error: "SSL required"
- Asegúrate de que la URL termine con `?sslmode=require`

## 📝 Notas importantes

- Neon tiene un plan gratuito que es suficiente para desarrollo
- Los backups automáticos están incluidos
- Puedes escalar fácilmente cuando lo necesites
- La conexión debería ser más rápida que Supabase desde Render

