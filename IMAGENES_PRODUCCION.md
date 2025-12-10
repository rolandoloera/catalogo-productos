# 🖼️ Configuración de Imágenes en Producción

## Problema Identificado

Las imágenes subidas localmente (sin Cloudinary) se guardaban con URLs de `localhost:3001`, lo que causaba errores en producción.

## ✅ Solución Implementada

### 1. Normalización Automática de URLs

El sistema ahora **normaliza automáticamente** todas las URLs de imágenes:
- Reemplaza `http://localhost:3001` → `https://catalogo-productos-api.onrender.com`
- Funciona tanto para imágenes nuevas como existentes
- Se aplica al devolver productos desde la API

### 2. URLs de Nuevas Imágenes

Cuando se suben nuevas imágenes **sin Cloudinary**:
- **En producción**: Usa automáticamente `https://catalogo-productos-api.onrender.com`
- **En desarrollo**: Usa `http://localhost:3001`

### 3. Recomendación: Usar Cloudinary en Producción

Para mejor rendimiento y disponibilidad, se recomienda usar **Cloudinary** en producción:

1. Crea una cuenta en [Cloudinary](https://cloudinary.com)
2. Obtén tus credenciales (Cloud Name, API Key, API Secret)
3. Agrega estas variables en Render → Tu servicio API → Environment:

```env
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

**Ventajas de Cloudinary:**
- ✅ Imágenes optimizadas automáticamente
- ✅ CDN global (carga más rápida)
- ✅ Transformaciones de imagen (redimensionar, recortar, etc.)
- ✅ No depende del servidor de Render

## 🔧 Configuración Actual

### Sin Cloudinary (Almacenamiento Local)

Las imágenes se guardan en el servidor y se sirven desde:
```
https://catalogo-productos-api.onrender.com/uploads/nombre-archivo.png
```

**Limitaciones:**
- ⚠️ Los archivos se pierden si el servidor se reinicia (en plan free de Render)
- ⚠️ Más lento que un CDN
- ⚠️ Consume espacio del servidor

### Con Cloudinary (Recomendado)

Las imágenes se suben a Cloudinary y se sirven desde su CDN:
```
https://res.cloudinary.com/tu-cloud/image/upload/...
```

**Ventajas:**
- ✅ Persistencia garantizada
- ✅ CDN global (más rápido)
- ✅ Optimización automática
- ✅ No consume espacio del servidor

## 📝 Variables de Entorno

### Para Almacenamiento Local (sin Cloudinary):

```env
# Opcional: especificar URL base del API
API_BASE_URL=https://catalogo-productos-api.onrender.com
```

### Para Cloudinary (Recomendado):

```env
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

## 🔍 Verificar que Funciona

1. Sube una nueva imagen desde el panel de admin
2. Verifica que la URL generada sea:
   - Con Cloudinary: `https://res.cloudinary.com/...`
   - Sin Cloudinary: `https://catalogo-productos-api.onrender.com/uploads/...`
3. Abre la URL directamente en el navegador
4. Debe mostrar la imagen correctamente

## ⚠️ Nota Importante

Si ya tienes imágenes guardadas con URLs de `localhost:3001` en la base de datos, el sistema las normalizará automáticamente al devolverlas. No necesitas actualizar la BD manualmente.

---

**Última actualización**: Diciembre 2024

