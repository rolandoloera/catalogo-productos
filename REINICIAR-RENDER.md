# 🔄 Cómo Reiniciar Servicios en Render

Esta guía te muestra cómo reiniciar tus servicios en Render para verificar que los datos persisten correctamente en la base de datos.

---

## 🎯 Objetivo

Reiniciar la aplicación para verificar que:
- ✅ Los datos en PostgreSQL persisten después del reinicio
- ✅ La aplicación se conecta correctamente a la BD al reiniciar
- ✅ No se pierden los productos que hayas creado

---

## 📋 Pasos para Reiniciar un Servicio en Render

### Opción 1: Reiniciar desde el Dashboard (Recomendado)

#### Para el API Service:

1. **Ve al Dashboard de Render**: https://dashboard.render.com/
2. **Click en tu servicio API**: `catalogo-productos-api`
3. **Ve a la pestaña "Settings"** (Configuración)
4. **Scroll hasta la sección "Danger Zone"** (Zona de Peligro)
5. **Click en el botón "Restart"** (Reiniciar)
6. **Confirma el reinicio**

#### Para el Frontend Service:

1. **Click en tu servicio Frontend**: `catalogo-productos-frontend`
2. **Ve a "Settings"**
3. **Scroll hasta "Danger Zone"**
4. **Click en "Restart"**
5. **Confirma el reinicio**

### Opción 2: Reiniciar desde la pestaña "Events"

1. **Ve a tu servicio** (API o Frontend)
2. **Click en la pestaña "Events"** (Eventos)
3. **Click en el botón "Manual Deploy"** → **"Clear build cache & deploy"**
   - Esto reinicia el servicio y limpia la caché

### Opción 3: Hacer un cambio menor y hacer Deploy

1. **Haz un pequeño cambio** en tu código (ej: un comentario)
2. **Haz commit y push a GitHub**
3. **Render detectará el cambio** y desplegará automáticamente (si tienes Auto-Deploy activado)

---

## ✅ Verificar que los Datos Persisten

### Paso 1: Antes de Reiniciar

1. **Abre tu Frontend en Render**: `https://catalogo-productos-frontend.onrender.com`
2. **Agrega un producto nuevo** desde la interfaz
   - Ejemplo: "Producto de Prueba", Precio: 99.99
3. **Verifica que aparezca en la lista**
4. **Anota el ID o nombre del producto** para verificar después

### Paso 2: Reiniciar el API Service

1. Sigue los pasos de "Opción 1" arriba para reiniciar el API
2. Espera 1-2 minutos mientras Render reinicia el servicio
3. Verás en los logs: "Your service is live"

### Paso 3: Verificar Después del Reinicio

1. **Abre el Frontend nuevamente**
2. **Recarga la página** (F5)
3. **Verifica que el producto que agregaste sigue ahí** ✅
4. **Si el producto sigue ahí, ¡los datos persisten correctamente!**

---

## 🔍 Verificar los Logs

Para ver qué está pasando durante el reinicio:

1. **Ve a tu servicio API** en Render Dashboard
2. **Click en la pestaña "Logs"**
3. **Deberías ver:**
   ```
   ✅ Conexión a PostgreSQL exitosa
   ✅ Tabla productos creada/verificada
   🚀 API Service corriendo en http://localhost:3001
   ```

**⚠️ Si ves errores de conexión a la BD**, verifica:
- Que `DATABASE_URL` esté configurada correctamente
- Que la base de datos esté activa (no "dormida")

---

## 🧪 Prueba Completa de Persistencia

### Test 1: Reinicio Simple

1. Agrega un producto: "Test Persistencia 1"
2. Reinicia el API Service
3. Verifica que el producto sigue ahí ✅

### Test 2: Reinicio Completo

1. Agrega un producto: "Test Persistencia 2"
2. Reinicia **ambos servicios** (API y Frontend)
3. Espera a que ambos estén "live"
4. Verifica que el producto sigue ahí ✅

### Test 3: Reinicio de Base de Datos (Solo si es necesario)

**⚠️ CUIDADO**: Esto puede eliminar datos si no tienes backups.

1. Ve a tu base de datos PostgreSQL en Render
2. Settings → "Reset Database" (solo si realmente necesitas resetear)
3. Esto **eliminará todos los datos**

**💡 Mejor opción**: Si quieres probar desde cero, simplemente elimina los productos manualmente desde el Frontend o usando SQL.

---

## 🔧 Verificar Conexión a la BD desde los Logs

Después de reiniciar, revisa los logs del API:

**Logs esperados (éxito):**
```
✅ Conexión a PostgreSQL exitosa
✅ Tabla productos creada/verificada
🚀 API Service corriendo en http://localhost:3001
```

**Logs de error (si hay problema):**
```
❌ Error conectando a PostgreSQL: ...
```

Si ves errores, verifica:
1. Variables de entorno (`DATABASE_URL`)
2. Que la BD esté activa
3. Que las credenciales sean correctas

---

## 📊 Verificar Datos Directamente en PostgreSQL

### Opción A: Usar Render Shell

1. Ve a tu base de datos PostgreSQL en Render
2. Click en "Connect" → "Render Shell"
3. Ejecuta:
   ```sql
   psql $DATABASE_URL
   ```
4. Luego:
   ```sql
   SELECT * FROM productos;
   ```
5. Deberías ver todos los productos, incluyendo los que agregaste

### Opción B: Usar un Cliente PostgreSQL

1. Usa la **External Database URL** de tu BD
2. Conéctate con un cliente como:
   - pgAdmin
   - DBeaver
   - TablePlus
   - VS Code extension (PostgreSQL)

---

## 🎯 Resultado Esperado

Después de reiniciar:

✅ **Los productos que agregaste siguen en la base de datos**
✅ **La aplicación se conecta correctamente a PostgreSQL**
✅ **No se pierden datos al reiniciar**
✅ **Los logs muestran conexión exitosa**

---

## 🚨 Troubleshooting

### Problema: Los datos desaparecen después de reiniciar

**Posibles causas:**
1. La base de datos se "durmió" (plan gratuito después de 90 días)
2. `DATABASE_URL` no está configurada correctamente
3. La aplicación se está conectando a una BD diferente

**Solución:**
- Verifica los logs del API
- Verifica que `DATABASE_URL` esté correcta
- Verifica que la BD esté activa en Render Dashboard

### Problema: Error de conexión después de reiniciar

**Solución:**
1. Verifica que la BD esté "Available" (no "Sleeping")
2. Verifica `DATABASE_URL` en las variables de entorno
3. Revisa los logs para ver el error específico

### Problema: El servicio no inicia

**Solución:**
1. Revisa los logs para ver el error
2. Verifica que el código esté correcto
3. Verifica que las dependencias estén instaladas (`npm install`)

---

## 💡 Tips

1. **Monitorea los logs** durante el reinicio para ver qué está pasando
2. **Haz pruebas incrementales**: agrega un producto, reinicia, verifica
3. **Usa Render Shell** para verificar datos directamente en PostgreSQL
4. **Guarda las URLs** de tus servicios para acceso rápido

---

¡Con esto puedes verificar que tu aplicación persiste datos correctamente! 🎉

