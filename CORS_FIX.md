# 🔧 Solución al Error de CORS en Producción

## ❌ Error Actual:
```
Access to fetch at 'https://catalogo-productos-api.onrender.com/api/v1/productos' 
from origin 'https://catalogo-productos-nextjs.onrender.com' 
has been blocked by CORS policy: 
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:3000' 
that is not equal to the supplied origin.
```

## ✅ Solución:

### Paso 1: Configurar FRONTEND_URL en el API

1. Ve a tu servicio **API** en Render: `catalogo-productos-api`
2. Ve a **Environment**
3. Agrega o actualiza la variable:

```env
FRONTEND_URL=https://catalogo-productos-nextjs.onrender.com
```

**O si quieres permitir múltiples orígenes (desarrollo + producción):**

```env
FRONTEND_URL=http://localhost:3000,https://catalogo-productos-nextjs.onrender.com
```

### Paso 2: Hacer Manual Deploy del API

1. En Render, ve a tu servicio API
2. Haz clic en **"Manual Deploy"** → **"Deploy latest commit"**
3. Espera a que termine el deploy

### Paso 3: Verificar

1. Abre tu frontend en producción
2. Debe cargar los productos sin error de CORS

---

## 🔍 Verificar que Funcionó

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Network**
3. Busca la petición a `/api/v1/productos`
4. Debe responder con status **200** (no error de CORS)

---

## 📝 Notas

- El código ahora soporta múltiples orígenes separados por coma
- En desarrollo, localhost se permite automáticamente
- En producción, solo se permiten los orígenes especificados en `FRONTEND_URL`

---

## ⚠️ Si Aún No Funciona

1. Verifica que `FRONTEND_URL` esté configurada correctamente (sin espacios)
2. Verifica que el API se haya redesplegado después de agregar la variable
3. Revisa los logs del API en Render para ver si hay errores
4. Limpia la caché del navegador y prueba de nuevo

