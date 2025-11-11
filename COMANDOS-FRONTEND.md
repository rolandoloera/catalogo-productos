# Comandos para Emular Frontend en Docker

## Pasos para Emular el Frontend

### 1. Navegar al directorio del frontend
```powershell
cd services/frontend
```

### 2. Construir la imagen Docker
```powershell
docker build -t catalogo-productos-frontend .
```

**Explicación:**
- `docker build`: Construye una imagen Docker
- `-t catalogo-productos-frontend`: Le da un nombre a la imagen
- `.`: Usa el Dockerfile en el directorio actual

### 3. Detener contenedores existentes (si existen)
```powershell
docker stop frontend-service
docker rm frontend-service
```

### 4. Ejecutar el contenedor
```powershell
docker run -d -p 3000:3000 -e PORT=3000 -e API_URL=http://localhost:3001 --name frontend-service catalogo-productos-frontend
```

**Explicación de cada flag:**
- `-d`: Ejecuta en segundo plano (detached)
- `-p 3000:3000`: Mapea puerto 3000 del contenedor al puerto 3000 del host
- `-e PORT=3000`: Establece variable de entorno PORT
- `-e API_URL=http://localhost:3001`: URL del API (importante!)
- `--name frontend-service`: Nombre del contenedor

### 5. Verificar que está ejecutándose
```powershell
docker ps
```

### 6. Probar el health check
```powershell
curl http://localhost:3000/health
```

### 7. Ver logs
```powershell
docker logs -f frontend-service
```

## Abrir en el navegador

```
http://localhost:3000
```

## Comandos útiles

```powershell
# Ver todos los contenedores
docker ps

# Ver logs del frontend
docker logs -f frontend-service

# Detener el frontend
docker stop frontend-service

# Eliminar el frontend
docker rm frontend-service

# Detener y eliminar ambos servicios
docker stop api-service frontend-service
docker rm api-service frontend-service
```

