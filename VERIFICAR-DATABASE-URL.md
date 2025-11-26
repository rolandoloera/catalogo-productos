# 🔍 Verificar DATABASE_URL en Render

## ⚠️ IMPORTANTE: Verifica estos puntos

### 1. La variable DATABASE_URL debe estar configurada

En Render Dashboard → Tu servicio API → Environment:

```
DATABASE_URL=postgresql://postgres:loar8811@db.royezgjemrtwzdrdpdon.supabase.co:5432/postgres?sslmode=require
```

### 2. Verifica que NO tenga espacios

❌ **INCORRECTO:**
```
DATABASE_URL = postgresql://...
```

✅ **CORRECTO:**
```
DATABASE_URL=postgresql://...
```

### 3. Verifica que termine con `?sslmode=require`

❌ **INCORRECTO:**
```
DATABASE_URL=postgresql://postgres:loar8811@db.royezgjemrtwzdrdpdon.supabase.co:5432/postgres
```

✅ **CORRECTO:**
```
DATABASE_URL=postgresql://postgres:loar8811@db.royezgjemrtwzdrdpdon.supabase.co:5432/postgres?sslmode=require
```

### 4. Verifica la contraseña

La contraseña debe ser exactamente: `loar8811`

### 5. Verifica en Supabase

1. Ve a: https://supabase.com/dashboard
2. Abre tu proyecto
3. Ve a **Settings** → **Database**
4. Copia la **Connection string** y compara con la de Render

### 6. Verifica los logs en Render

Después de hacer cambios, ve a **Logs** y busca:

**✅ Si funciona:**
```
📝 Configurando conexión con DATABASE_URL
   Host: db.royezgjemrtwzdrdpdon.supabase.co:5432
   SSL: habilitado (rejectUnauthorized: false)
✅ Conexión a PostgreSQL exitosa
```

**❌ Si falla:**
```
❌ Error conectando a PostgreSQL: [mensaje]
   Código: [código]
   Host: db.royezgjemrtwzdrdpdon.supabase.co:5432
```

## 🔧 Cómo corregir en Render

1. Ve a: https://dashboard.render.com/
2. Abre tu servicio `catalogo-productos-api`
3. Ve a **Environment**
4. Busca `DATABASE_URL`
5. Si existe, edítala. Si no existe, créala.
6. Valor exacto (copia y pega):
   ```
   postgresql://postgres:loar8811@db.royezgjemrtwzdrdpdon.supabase.co:5432/postgres?sslmode=require
   ```
7. Click en **Save Changes**
8. Render reiniciará automáticamente
9. Espera 2-3 minutos
10. Verifica los logs

## 🧪 Probar la conexión manualmente

Desde tu terminal local:

```bash
docker run --rm -it postgres:15 psql "postgresql://postgres:loar8811@db.royezgjemrtwzdrdpdon.supabase.co:5432/postgres?sslmode=require" -c "SELECT NOW();"
```

Si funciona localmente pero no en Render, el problema es la configuración en Render.

