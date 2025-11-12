# 🔍 Diagnóstico de Base de Datos en Render

## Problema
Los productos no se están guardando en la base de datos de Render, solo aparecen los 3 productos default.

## Pasos para Diagnosticar

### 1. Verificar Variables de Entorno en Render

**En el API Service:**
1. Ve a tu API Service en Render Dashboard
2. Click en "Environment" (Variables de Entorno)
3. Verifica que exista `DATABASE_URL` con el valor correcto
4. Si no existe, ve a tu PostgreSQL Database → "Connections" → copia el "Internal Database URL"
5. Agrega la variable `DATABASE_URL` en el API Service

### 2. Verificar Logs del API al Crear Producto

1. Ve a tu API Service → pestaña "Logs"
2. Intenta crear un producto desde el Frontend
3. Busca estos mensajes en los logs:

```
📥 POST /productos - Datos recibidos: { nombre: '...', precio: ..., imagenes: ... }
💾 Insertando producto en BD...
✅ Producto creado con ID: X
📸 Insertando X imágenes...
```

**Si NO ves estos mensajes:**
- El API no está recibiendo los datos del Frontend
- Verifica que `API_URL` esté configurada correctamente en el Frontend Service

**Si ves errores:**
- Copia el error completo y compártelo

### 3. Verificar Conexión a la BD Correcta

En los logs del API al iniciar, deberías ver:

```
🔌 Verificando conexión a PostgreSQL...
   DATABASE_URL: Configurada
   Conexión: DATABASE_URL (dpg-xxxxx-a.oregon-postgres.render.com)
✅ Conexión a PostgreSQL exitosa
```

**Si ves "No configurada":**
- La variable `DATABASE_URL` no está configurada en Render
- Sigue el paso 1

### 4. Verificar desde el Frontend (Consola del Navegador)

1. Abre tu Frontend en Render
2. Abre la consola del navegador (F12)
3. Intenta crear un producto
4. Busca estos mensajes:

```
🔧 Configuración API: { API_URL: '...', API_BASE: '...' }
📤 Enviando producto al API: { url: '...', method: 'POST', ... }
📥 Respuesta del API: { status: 201, ok: true }
✅ Producto guardado exitosamente: { id: X, ... }
```

**Si ves error 500:**
- El API está recibiendo los datos pero falla al guardar
- Revisa los logs del API para ver el error específico

**Si ves error de CORS o conexión:**
- El Frontend no puede comunicarse con el API
- Verifica que `API_URL` en el Frontend Service apunte a la URL correcta del API

### 5. Verificar Directamente en la BD

Conecta a la BD de Render usando SQL Tools o `psql`:

```sql
-- Ver todos los productos
SELECT * FROM productos ORDER BY id;

-- Ver productos con imágenes
SELECT p.id, p.nombre, COUNT(pi.id) as num_imagenes
FROM productos p
LEFT JOIN producto_imagenes pi ON p.id = pi.producto_id
GROUP BY p.id, p.nombre
ORDER BY p.id;

-- Ver últimas inserciones
SELECT * FROM productos ORDER BY fecha_creacion DESC LIMIT 10;
```

### 6. Probar Endpoint Directamente

Usa `curl` o Postman para probar el API directamente:

```bash
curl -X POST https://tu-api.onrender.com/api/v1/productos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Producto Test",
    "descripcion": "Descripción test",
    "precio": 99.99,
    "stock": 10,
    "imagenes": []
  }'
```

**Si esto funciona:**
- El problema está en el Frontend o en la comunicación Frontend-API

**Si esto falla:**
- El problema está en el API o en la conexión a la BD

## Soluciones Comunes

### Problema: DATABASE_URL no configurada
**Solución:** Configura `DATABASE_URL` en el API Service desde la sección "Connections" de tu PostgreSQL Database.

### Problema: API_URL incorrecta en Frontend
**Solución:** Verifica que `API_URL` en el Frontend Service sea la URL correcta del API (ej: `https://catalogo-productos-api.onrender.com`)

### Problema: Error de conexión a BD
**Solución:** Verifica que el PostgreSQL Database esté "Available" (no "Paused") en Render Dashboard.

### Problema: Error al insertar (constraint violation, etc.)
**Solución:** Revisa los logs del API para ver el error específico. Puede ser un problema de schema o permisos.

