# Probar la Aplicación con PostgreSQL

## 🚀 Pasos para Probar

### 1. Detener servicios anteriores (si existen)

```powershell
docker stop api-service frontend-service catalogo-productos-api catalogo-productos-frontend
docker rm api-service frontend-service catalogo-productos-api catalogo-productos-frontend
```

### 2. Iniciar todos los servicios con Docker Compose

```powershell
cd C:\Bitbucket\test_loera\catalogo-productos
docker-compose up --build
```

**O en segundo plano:**
```powershell
docker-compose up --build -d
```

Esto iniciará:
- ✅ PostgreSQL (puerto 5432)
- ✅ API Service (puerto 3001) - conectado a PostgreSQL
- ✅ Frontend Service (puerto 3000)

### 3. Verificar que los servicios están ejecutándose

```powershell
docker-compose ps
```

O:
```powershell
docker ps
```

Deberías ver 3 contenedores:
- `catalogo-productos-db` (PostgreSQL)
- `catalogo-productos-api` (API)
- `catalogo-productos-frontend` (Frontend)

### 4. Ver logs

```powershell
# Ver todos los logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f frontend
```

### 5. Probar el API

```powershell
# Health check (debe mostrar "database": "connected")
curl http://localhost:3001/health

# Obtener productos
curl http://localhost:3001/api/v1/productos
```

### 6. Verificar PostgreSQL

```powershell
# Conectarse a PostgreSQL
docker exec -it catalogo-productos-db psql -U postgres -d catalogo_productos

# Dentro de PostgreSQL:
SELECT * FROM productos;
\q  # Para salir
```

### 7. Abrir en el navegador

```
http://localhost:3000
```

## ✅ Verificaciones

### Health Check del API

Debería mostrar:
```json
{
  "status": "ok",
  "database": "connected",  // ← Esto confirma que PostgreSQL funciona
  "service": "catalogo-productos-api",
  ...
}
```

### Productos en la Base de Datos

Deberías ver 3 productos de ejemplo que se insertan automáticamente.

### Persistencia

1. Agrega un producto desde la interfaz web
2. Detén los servicios: `docker-compose down`
3. Reinicia: `docker-compose up`
4. El producto que agregaste debería seguir ahí (persistencia)

## 🐛 Solución de Problemas

### Si PostgreSQL no inicia

```powershell
# Ver logs de PostgreSQL
docker logs catalogo-productos-db

# Verificar que el puerto 5432 no esté en uso
netstat -an | findstr 5432
```

### Si el API no se conecta a PostgreSQL

```powershell
# Ver logs del API
docker logs catalogo-productos-api

# Verificar variables de entorno
docker exec catalogo-productos-api env | findstr DB_
```

### Si hay errores de conexión

1. Verifica que PostgreSQL esté saludable:
   ```powershell
   docker exec catalogo-productos-db pg_isready -U postgres
   ```

2. Verifica que el API espere a que PostgreSQL esté listo (debería hacerlo automáticamente con `depends_on`)

## 📊 Comandos Útiles

```powershell
# Ver estado de todos los servicios
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (borra datos de PostgreSQL)
docker-compose down -v

# Reiniciar un servicio específico
docker-compose restart api

# Reconstruir un servicio específico
docker-compose up --build api
```

## 🎯 Lo que Deberías Ver

1. **PostgreSQL iniciando:**
   - Logs mostrando "database system is ready to accept connections"

2. **API conectándose:**
   - "✅ Conexión a PostgreSQL exitosa"
   - "✅ Tabla productos creada/verificada"
   - "✅ Productos de ejemplo insertados"

3. **Frontend iniciando:**
   - "🌐 Frontend Service corriendo en http://localhost:3000"

4. **Health check:**
   - Status: "ok"
   - Database: "connected"

¡Todo debería funcionar perfectamente con PostgreSQL! 🎉

