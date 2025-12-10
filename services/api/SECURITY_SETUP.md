# 🔒 Guía de Configuración de Seguridad - Paso a Paso

## ✅ Paso 1: Vulnerabilidades Corregidas
- ✅ `jws` actualizado automáticamente
- ✅ `cloudinary` actualizado a v2.0.0 (sin vulnerabilidades)
- ✅ Todas las dependencias seguras

## 📝 Paso 2: Configurar Variables de Entorno

### 2.1. Crear archivo `.env`

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

### 2.2. Generar JWT_SECRET seguro

**En Windows (PowerShell):**
```powershell
# Opción 1: Usando OpenSSL (si está instalado)
openssl rand -base64 32

# Opción 2: Usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**En Linux/Mac:**
```bash
openssl rand -base64 32
```

### 2.3. Editar `.env` con tus valores

```env
# OBLIGATORIO EN PRODUCCIÓN
JWT_SECRET=<PEGA_AQUI_EL_SECRETO_GENERADO>
DATABASE_URL=postgresql://usuario:password@localhost:5432/catalogo_productos

# OPCIONALES
PORT=3001
FRONTEND_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001
NODE_ENV=development
```

## 🚀 Paso 3: Configuración para Producción

### 3.1. Variables de Entorno en Producción

Si usas **Render**, **Heroku**, **Vercel**, o similar:

1. Ve a la configuración de tu servicio
2. Agrega estas variables de entorno:

```
JWT_SECRET=<tu-secreto-generado>
DATABASE_URL=<tu-url-de-postgresql>
FRONTEND_URL=https://tu-dominio-frontend.com
NODE_ENV=production
```

### 3.2. Verificar que JWT_SECRET esté configurado

El servidor validará automáticamente en producción. Si falta `JWT_SECRET`, el servidor **no iniciará**.

## 🔍 Paso 4: Verificar Configuración

### 4.1. Probar que el servidor inicia correctamente

```bash
npm start
```

Deberías ver:
```
✅ Cloudinary configurado... (si está configurado)
✅ Base de datos conectada
🚀 Servidor corriendo en puerto 3001
```

### 4.2. Probar endpoint de salud

```bash
curl http://localhost:3001/health
```

Debería responder: `{ "status": "ok" }`

## 📋 Paso 5: Checklist de Seguridad

Antes de desplegar a producción, verifica:

- [ ] `JWT_SECRET` configurado y es único (no el valor por defecto)
- [ ] `DATABASE_URL` configurado correctamente
- [ ] `FRONTEND_URL` apunta a tu dominio real
- [ ] `NODE_ENV=production` configurado
- [ ] No hay vulnerabilidades (`npm audit` muestra 0)
- [ ] Rate limiting activo (verificado en código)
- [ ] CORS configurado con origen específico
- [ ] Helmet.js activo (headers de seguridad)

## 🛡️ Características de Seguridad Implementadas

### ✅ Rate Limiting
- **General**: 100 requests/15 min por IP
- **Login**: 5 intentos/15 min por IP (previene brute force)
- **WhatsApp**: 10 requests/min por IP

### ✅ Validación de Inputs
- Todos los endpoints validan datos de entrada
- Sanitización de HTML/XSS
- Validación de tipos y rangos

### ✅ Validación de Archivos
- Verificación real de imágenes con Sharp
- Límites de tamaño y dimensiones
- Solo tipos permitidos

### ✅ Headers de Seguridad
- Helmet.js configurado
- CORS con origen específico
- No exposición de stack traces en producción

### ✅ Protección de Datos
- Contraseñas nunca en logs
- Números de teléfono protegidos
- Paginación para prevenir DoS

## 🔧 Solución de Problemas

### Error: "JWT_SECRET no está configurado"
**Solución**: Genera un secreto y agrégalo a `.env` o variables de entorno.

### Error: "Variables de entorno requeridas no configuradas"
**Solución**: Verifica que `JWT_SECRET` y `DATABASE_URL` estén configuradas.

### Error: CORS bloqueado
**Solución**: Verifica que `FRONTEND_URL` en el backend coincida con la URL del frontend.

### Error: "Demasiadas solicitudes"
**Solución**: El rate limiting está funcionando. Espera 15 minutos o ajusta los límites en `server.js`.

## 📚 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

**Última actualización**: Diciembre 2024

