# 🔧 Configurar Neon Database

## ✅ Base de datos configurada

Tu base de datos Neon está configurada y lista para usar tanto localmente como en producción.

## 📋 Connection String

```
postgresql://neondb_owner:npg_jTA6HPb7IcYG@ep-green-field-a4w3zngj-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## 🐳 Configuración Local (Docker)

### Paso 1: Crear archivo `.env`

Crea un archivo `.env` en la raíz del proyecto `catalogo-productos`:

```bash
# Base de datos Neon
DATABASE_URL=postgresql://neondb_owner:npg_jTA6HPb7IcYG@ep-green-field-a4w3zngj-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# Configuración de la API
NODE_ENV=development
PORT=3001
API_VERSION=v1
JWT_SECRET=dev-secret-key-change-in-production
ADMIN_EMAIL=admin@catalogo.com
ADMIN_PASSWORD=admin123
ADMIN_NOMBRE=Administrador
```

### Paso 2: Iniciar servicios

```bash
cd catalogo-productos
docker-compose up --build -d
```

### Paso 3: Verificar

```bash
# Ver logs
docker-compose logs -f api

# Verificar health check
curl http://localhost:3001/health
```

## 🌐 Configuración en Render (Producción)

### Paso 1: Ir a Render Dashboard

1. Ve a: https://dashboard.render.com/
2. Abre tu servicio `catalogo-productos-api`
3. Ve a la pestaña **"Environment"**

### Paso 2: Actualizar DATABASE_URL

1. Busca la variable `DATABASE_URL`
2. Edítala o créala con este valor:
   ```
   postgresql://neondb_owner:npg_jTA6HPb7IcYG@ep-green-field-a4w3zngj-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Click en **"Save Changes"**
4. Render reiniciará automáticamente

### Paso 3: Verificar

1. Espera 2-3 minutos
2. Prueba el health check:
   ```
   https://catalogo-productos-api.onrender.com/health
   ```
3. Debe mostrar: `{"database":"connected",...}`

## ✅ Ventajas de Neon

- ✅ Soporte IPv4 nativo (no tendrás problemas de IPv6)
- ✅ Connection pooling incluido (mejor rendimiento)
- ✅ Plan gratuito generoso
- ✅ Backups automáticos
- ✅ Funciona perfectamente desde Docker y Render

## 🔍 Troubleshooting

### Error: "connection refused"
- Verifica que la DATABASE_URL esté correcta
- Verifica que no haya espacios al inicio o final

### Error: "SSL required"
- Asegúrate de que la URL termine con `?sslmode=require`

### Error: "password authentication failed"
- Verifica la contraseña en Neon Dashboard
- La contraseña es: `npg_jTA6HPb7IcYG`

## 📝 Notas importantes

- La URL usa un **pooler** (`-pooler` en el hostname), lo cual es mejor para conexiones concurrentes
- El `channel_binding=require` fue removido de la URL base porque puede causar problemas
- Si necesitas cambiar la contraseña, actualiza la URL en ambos lugares (local y Render)

