# 🚀 Desplegar en Render con Neon

## ✅ Estado Actual

- ✅ Proyecto funcionando localmente con Docker
- ✅ Base de datos migrada a Neon
- ✅ API conectada a Neon
- ✅ Frontend Next.js funcionando

## 🤔 ¿Necesitas desplegar en Render?

### ✅ SÍ, desplega si quieres:
- Que sea accesible desde internet
- Compartir el catálogo con clientes
- Tener un entorno de producción
- Que funcione 24/7 sin tu computadora
- Acceso desde cualquier dispositivo

### ❌ NO es necesario si solo:
- Trabajas localmente
- Es para desarrollo/pruebas
- No necesitas acceso desde internet

## 📋 Pasos para Desplegar en Render

### PASO 1: Subir cambios a GitHub

```bash
# En catalogo-productos (API)
cd catalogo-productos
git add .
git commit -m "Configurar para Neon y Render"
git push origin main

# En catalogo-productos-nextjs (Frontend)
cd ../catalogo-productos-nextjs
git add .
git commit -m "Configurar para Neon y Render"
git push origin main
```

### PASO 2: Desplegar API en Render

1. Ve a: https://dashboard.render.com/
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio: `rolandoloera/catalogo-productos`
4. Configuración:
   - **Name**: `catalogo-productos-api`
   - **Root Directory**: `services/api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. **Variables de entorno** (Environment Variables):
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_jTA6HPb7IcYG@ep-green-field-a4w3zngj-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   PORT=3001
   API_VERSION=v1
   NODE_ENV=production
   JWT_SECRET=(genera uno seguro - ver abajo)
   ADMIN_EMAIL=admin@catalogo.com
   ADMIN_PASSWORD=(cambia por uno seguro)
   ADMIN_NOMBRE=Administrador
   ```

6. Click en **"Create Web Service"**
7. Espera 5-10 minutos para que se despliegue
8. Anota la URL del API (ej: `https://catalogo-productos-api.onrender.com`)

### PASO 3: Desplegar Frontend Next.js en Render

1. En Render Dashboard, click en **"New +"** → **"Web Service"**
2. Conecta tu repositorio: `rolandoloera/catalogo-productos-nextjs`
3. Configuración:
   - **Name**: `catalogo-productos-nextjs`
   - **Root Directory**: (vacío)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Variables de entorno**:
   ```
   NEXT_PUBLIC_API_URL=https://catalogo-productos-api.onrender.com
   PORT=3000
   API_VERSION=v1
   NODE_ENV=production
   NEXT_PUBLIC_WHATSAPP_NUMBER=521234567890
   ```

5. Click en **"Create Web Service"**
6. Espera 5-10 minutos para que se despliegue

### PASO 4: Verificar Despliegue

1. **API Health Check**:
   ```
   https://catalogo-productos-api.onrender.com/health
   ```
   Debe mostrar: `{"database":"connected",...}`

2. **Frontend**:
   ```
   https://catalogo-productos-nextjs.onrender.com
   ```
   Debe mostrar el catálogo de productos

3. **Admin Login**:
   ```
   https://catalogo-productos-nextjs.onrender.com/admin/login
   ```
   Usa las credenciales configuradas en `ADMIN_EMAIL` y `ADMIN_PASSWORD`

## 🔐 Generar JWT_SECRET

### Windows PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Linux/Mac:
```bash
openssl rand -base64 32
```

## ⚠️ Notas Importantes

1. **Render Free Tier**:
   - Los servicios se "duermen" después de 15 minutos de inactividad
   - El primer request puede tardar 30-60 segundos (cold start)
   - Para producción, considera el plan pago

2. **Neon Free Tier**:
   - 512 MB storage
   - 0.5 CPU
   - Suficiente para desarrollo y pequeños proyectos

3. **URLs**:
   - Render asigna URLs automáticamente
   - Puedes configurar un dominio personalizado después

4. **Actualizaciones**:
   - Cada push a GitHub despliega automáticamente
   - O puedes hacer "Manual Deploy" desde Render Dashboard

## 🔄 Actualizar después de cambios

1. Haz cambios en tu código local
2. `git add .`
3. `git commit -m "Descripción de cambios"`
4. `git push origin main`
5. Render detectará los cambios y desplegará automáticamente
6. Espera 5-10 minutos

## 📝 Checklist de Despliegue

- [ ] Cambios subidos a GitHub (API)
- [ ] Cambios subidos a GitHub (Frontend)
- [ ] API desplegado en Render
- [ ] Frontend desplegado en Render
- [ ] Variables de entorno configuradas
- [ ] Health check del API funcionando
- [ ] Frontend accesible
- [ ] Login de admin funcionando

## 🆘 Troubleshooting

### API no conecta a Neon
- Verifica que `DATABASE_URL` esté correcta en Render
- Verifica que termine con `?sslmode=require`
- Revisa los logs en Render

### Frontend no carga productos
- Verifica que `NEXT_PUBLIC_API_URL` apunte al API correcto
- Verifica que el API esté funcionando (health check)
- Revisa la consola del navegador (F12)

### Error 500 en API
- Revisa los logs en Render
- Verifica que todas las variables de entorno estén configuradas
- Verifica que la base de datos Neon tenga los datos

