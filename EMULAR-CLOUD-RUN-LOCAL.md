# Guía Completa: Emular Cloud Run Localmente
## Aprendizaje Paso a Paso - Como para Examen de Certificación

Esta guía explica **cómo emular Cloud Run localmente** usando Docker, para probar tu aplicación **exactamente como funcionará en Cloud Run real** antes de desplegarla.

---

## 🎯 ¿Por qué Emular Cloud Run Localmente?

### Ventajas de Emular Antes de Desplegar:

1. **Ahorrar Costos**: No pagas por pruebas en Cloud Run
2. **Desarrollo Rápido**: Pruebas instantáneas sin esperar despliegue
3. **Debugging Fácil**: Logs y errores inmediatos
4. **Misma Configuración**: Usa las mismas variables de entorno que Cloud Run
5. **Aprender**: Entiendes cómo funciona Cloud Run antes de usarlo

### Diferencia entre Desarrollo Local y Emulación:

| Aspecto | Desarrollo (npm) | Emulación (Docker) | Cloud Run Real |
|---------|------------------|-------------------|----------------|
| **Ejecución** | Node.js directo | Docker | Docker |
| **Configuración** | .env o variables | Docker env | Cloud Run env |
| **Puerto** | Fijo (3000, 3001) | Variable PORT | Variable PORT |
| **Health Checks** | Manual | Docker healthcheck | Cloud Run automático |
| **Costo** | Gratis | Gratis | Pay per use |
| **Escalado** | Manual | Manual | Automático |
| **HTTPS** | ❌ | ❌ | ✅ Automático |

---

## 📚 Conceptos Fundamentales

### ¿Qué es Emular Cloud Run?

**Emular Cloud Run** significa ejecutar tu aplicación en un contenedor Docker **localmente**, usando las **mismas configuraciones** que Cloud Run usaría.

### ¿Qué Necesitamos?

1. **Docker**: Para ejecutar contenedores
2. **Dockerfile**: Para construir la imagen
3. **Variables de Entorno**: Igual que Cloud Run
4. **Health Checks**: Para verificar que funciona

---

## 🐳 Paso 1: Entender Docker y Contenedores

### 1.1 ¿Qué es Docker?

**Docker** es una plataforma que permite ejecutar aplicaciones en **contenedores**.

**Contenedor vs Máquina Virtual:**
- **Máquina Virtual**: Emula hardware completo (más pesado)
- **Contenedor**: Comparte el kernel del host (más ligero)

**Ventajas de Contenedores:**
- ✅ Más rápido de iniciar
- ✅ Usa menos recursos
- ✅ Mismo comportamiento en cualquier lugar

### 1.2 Conceptos Clave de Docker

**Imagen (Image):**
- Plantilla para crear contenedores
- Ejemplo: `node:18-alpine`, `catalogo-productos-api`

**Contenedor (Container):**
- Instancia ejecutándose de una imagen
- Ejemplo: Un contenedor ejecutando `catalogo-productos-api`

**Dockerfile:**
- Archivo con instrucciones para construir una imagen
- Ubicación: `services/api/Dockerfile`

**Pregunta del examen:** ¿Qué es una imagen Docker?
**Respuesta:** Una plantilla inmutable que contiene todo lo necesario para ejecutar una aplicación.

---

## 🔍 Paso 2: Analizar el Dockerfile

### 2.1 Ver el Dockerfile del API

**Ubicación:** `services/api/Dockerfile`

**Contenido:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
ENV PORT=3001
ENV API_VERSION=v1
CMD ["node", "server.js"]
```

### 2.2 Explicación Línea por Línea

**1. `FROM node:18-alpine`**
- **¿Qué hace?** Especifica la imagen base
- **¿Por qué?** Necesitamos Node.js para ejecutar nuestra aplicación
- **`alpine`**: Versión ligera de Linux (imagen más pequeña, ~50MB vs ~900MB)
- **`18`**: Versión de Node.js

**2. `WORKDIR /app`**
- **¿Qué hace?** Establece el directorio de trabajo
- **¿Por qué?** Todas las instrucciones siguientes se ejecutan en `/app`
- **Equivalente a:** `cd /app` en Linux

**3. `COPY package*.json ./`**
- **¿Qué hace?** Copia `package.json` y `package-lock.json` al contenedor
- **¿Por qué?** Necesitamos las dependencias antes de instalar
- **`package*.json`**: Coincide con `package.json` y `package-lock.json`

**4. `RUN npm install --production`**
- **¿Qué hace?** Instala las dependencias de producción
- **¿Por qué?** Necesitamos las librerías para ejecutar la aplicación
- **`--production`**: Solo instala dependencias de producción (no devDependencies)
- **Ahorra espacio:** No instala herramientas de desarrollo

**5. `COPY . .`**
- **¿Qué hace?** Copia todo el código al contenedor
- **¿Por qué?** Necesitamos el código para ejecutar la aplicación
- **`. .`**: Copia desde el directorio actual (host) al directorio actual (contenedor)

**6. `EXPOSE 3001`**
- **¿Qué hace?** Documenta que el contenedor escucha en el puerto 3001
- **¿Por qué?** Información para otros desarrolladores
- **Importante:** NO abre el puerto, solo documenta

**7. `ENV PORT=3001`**
- **¿Qué hace?** Establece la variable de entorno PORT
- **¿Por qué?** Cloud Run usa la variable PORT para saber en qué puerto escuchar
- **Igual que Cloud Run:** Cloud Run también establece PORT

**8. `ENV API_VERSION=v1`**
- **¿Qué hace?** Establece la variable de entorno API_VERSION
- **¿Por qué?** Configuración específica de nuestra aplicación

**9. `CMD ["node", "server.js"]`
- **¿Qué hace?** Comando que se ejecuta cuando el contenedor inicia
- **¿Por qué?** Inicia nuestra aplicación Node.js
- **Formato array:** `["comando", "argumento1", "argumento2"]`

**Pregunta del examen:** ¿Qué instrucción Dockerfile establece el comando que se ejecuta al iniciar el contenedor?
**Respuesta:** `CMD`

---

## 🔨 Paso 3: Construir la Imagen Docker

### 3.1 ¿Qué es Construir una Imagen?

**Construir una imagen** significa ejecutar las instrucciones del Dockerfile para crear una imagen Docker.

**Proceso:**
1. Lee el Dockerfile
2. Ejecuta cada instrucción en orden
3. Crea capas (layers) de la imagen
4. Guarda la imagen con un nombre

### 3.2 Comando para Construir

**Ubicación:** `services/api/`

**Comando:**
```bash
docker build -t catalogo-productos-api .
```

**Explicación:**
- `docker build`: Construye una imagen Docker
- `-t catalogo-productos-api`: Le da un nombre (tag) a la imagen
- `.`: Usa el Dockerfile en el directorio actual

**¿Qué hace paso a paso?**
1. Lee `Dockerfile` en el directorio actual
2. Descarga la imagen base `node:18-alpine` (si no existe)
3. Establece el directorio de trabajo `/app`
4. Copia `package*.json`
5. Ejecuta `npm install --production`
6. Copia el resto del código
7. Establece variables de entorno
8. Guarda la imagen con el nombre `catalogo-productos-api`

**Salida esperada:**
```
Sending build context to Docker daemon...
Step 1/9 : FROM node:18-alpine
 ---> abc123def456
Step 2/9 : WORKDIR /app
 ---> Running in xyz789
 ---> def456ghi789
...
Successfully built abc123def456
Successfully tagged catalogo-productos-api:latest
```

**Pregunta del examen:** ¿Qué comando construye una imagen Docker?
**Respuesta:** `docker build -t NOMBRE_IMAGEN .`

### 3.3 Verificar que la Imagen se Construyó

**Comando:**
```bash
docker images
```

**Salida esperada:**
```
REPOSITORY                 TAG       IMAGE ID       CREATED         SIZE
catalogo-productos-api    latest    abc123def456  2 minutes ago   150MB
node                      18-alpine def456ghi789  1 week ago      50MB
```

**Explicación:**
- `REPOSITORY`: Nombre de la imagen
- `TAG`: Etiqueta (por defecto `latest`)
- `IMAGE ID`: Identificador único
- `CREATED`: Cuándo se creó
- `SIZE`: Tamaño de la imagen

**Pregunta del examen:** ¿Qué comando lista todas las imágenes Docker?
**Respuesta:** `docker images`

---

## 🚀 Paso 4: Ejecutar el Contenedor (Emular Cloud Run)

### 4.1 Comando Básico

**Comando:**
```bash
docker run -p 3001:3001 -e PORT=3001 catalogo-productos-api
```

**Explicación línea por línea:**

**`docker run`**
- **¿Qué hace?** Ejecuta un contenedor
- **¿Por qué?** Inicia la aplicación en un contenedor

**`-p 3001:3001`**
- **¿Qué hace?** Mapea el puerto 3001 del contenedor al puerto 3001 del host
- **¿Por qué?** Para acceder a la aplicación desde `localhost:3001`
- **Formato:** `-p HOST:CONTAINER`
- **Igual que Cloud Run:** Cloud Run también mapea puertos

**`-e PORT=3001`**
- **¿Qué hace?** Establece la variable de entorno PORT
- **¿Por qué?** Nuestra aplicación lee `process.env.PORT`
- **Igual que Cloud Run:** Cloud Run también establece PORT

**`catalogo-productos-api`**
- **¿Qué hace?** Nombre de la imagen a ejecutar
- **¿Por qué?** Docker busca esta imagen y crea un contenedor

**Pregunta del examen:** ¿Qué flag de `docker run` mapea puertos del contenedor al host?
**Respuesta:** `-p` o `--publish`

### 4.2 Ejecutar en Segundo Plano (Detached)

**Comando:**
```bash
docker run -d -p 3001:3001 -e PORT=3001 --name api-service catalogo-productos-api
```

**Nuevos flags:**

**`-d`**
- **¿Qué hace?** Ejecuta en segundo plano (detached)
- **¿Por qué?** Para que no bloquee la terminal
- **Igual que Cloud Run:** Cloud Run siempre ejecuta en segundo plano

**`--name api-service`**
- **¿Qué hace?** Le da un nombre al contenedor
- **¿Por qué?** Para referenciarlo fácilmente después
- **Útil para:** Detener, iniciar, ver logs

**Pregunta del examen:** ¿Qué flag de `docker run` ejecuta el contenedor en segundo plano?
**Respuesta:** `-d` o `--detach`

### 4.3 Verificar que el Contenedor Está Ejecutándose

**Comando:**
```bash
docker ps
```

**Salida esperada:**
```
CONTAINER ID   IMAGE                      STATUS         PORTS                    NAMES
abc123def456   catalogo-productos-api    Up 2 minutes   0.0.0.0:3001->3001/tcp   api-service
```

**Explicación:**
- `CONTAINER ID`: Identificador único del contenedor
- `IMAGE`: Imagen que está ejecutando
- `STATUS`: Estado (Up = ejecutándose)
- `PORTS`: Puertos mapeados
- `NAMES`: Nombre del contenedor

**Pregunta del examen:** ¿Qué comando lista contenedores en ejecución?
**Respuesta:** `docker ps`

### 4.4 Probar el Servicio

**Comando:**
```bash
curl http://localhost:3001/health
```

**Salida esperada:**
```json
{
  "status": "ok",
  "service": "catalogo-productos-api",
  "version": "v1",
  "message": "API funcionando correctamente",
  "timestamp": "2025-11-11T18:52:30.600Z"
}
```

**¿Por qué funciona?**
- El contenedor está ejecutando la aplicación
- El puerto 3001 está mapeado
- La aplicación responde en `/health`

---

## 🔍 Paso 5: Ver Logs del Contenedor

### 5.1 Ver Logs en Tiempo Real

**Comando:**
```bash
docker logs -f api-service
```

**Explicación:**
- `docker logs`: Muestra los logs de un contenedor
- `-f`: Sigue los logs en tiempo real (follow)
- `api-service`: Nombre del contenedor

**Salida esperada:**
```
🚀 API Service corriendo en http://localhost:3001
📋 Health check: http://localhost:3001/health
📊 Endpoint productos: http://localhost:3001/api/v1/productos
```

**Igual que Cloud Run:** Cloud Run también tiene logs que puedes ver con `gcloud run services logs tail`

**Pregunta del examen:** ¿Qué flag de `docker logs` muestra logs en tiempo real?
**Respuesta:** `-f` o `--follow`

### 5.2 Ver Últimos Logs

**Comando:**
```bash
docker logs --tail 50 api-service
```

**Explicación:**
- `--tail 50`: Muestra las últimas 50 líneas
- **Útil para:** Ver errores recientes

---

## 🛑 Paso 6: Detener y Eliminar Contenedores

### 6.1 Detener un Contenedor

**Comando:**
```bash
docker stop api-service
```

**Explicación:**
- `docker stop`: Detiene un contenedor de forma suave (graceful shutdown)
- Envía señal SIGTERM, luego SIGKILL si no responde
- **Igual que Cloud Run:** Cloud Run también detiene contenedores cuando no hay tráfico

**Pregunta del examen:** ¿Qué comando detiene un contenedor Docker?
**Respuesta:** `docker stop NOMBRE_CONTENEDOR`

### 6.2 Eliminar un Contenedor

**Comando:**
```bash
docker rm api-service
```

**Explicación:**
- `docker rm`: Elimina un contenedor
- **Importante:** Solo elimina contenedores detenidos
- **Para forzar:** `docker rm -f api-service` (elimina aunque esté ejecutándose)

**Pregunta del examen:** ¿Qué comando elimina un contenedor Docker?
**Respuesta:** `docker rm NOMBRE_CONTENEDOR`

### 6.3 Detener y Eliminar en Uno

**Comando:**
```bash
docker rm -f api-service
```

**Explicación:**
- `-f`: Fuerza la eliminación (detiene y elimina)
- **Útil para:** Limpiar contenedores rápidamente

---

## 🔄 Paso 7: Emular Ambos Servicios (API y Frontend)

### 7.1 Ejecutar el API

**Terminal 1:**
```bash
cd services/api
docker build -t catalogo-productos-api .
docker run -d -p 3001:3001 -e PORT=3001 --name api-service catalogo-productos-api
```

**Verificar:**
```bash
curl http://localhost:3001/health
```

### 7.2 Ejecutar el Frontend

**Terminal 2:**
```bash
cd services/frontend
docker build -t catalogo-productos-frontend .
docker run -d -p 3000:3000 -e PORT=3000 -e API_URL=http://localhost:3001 --name frontend-service catalogo-productos-frontend
```

**Explicación:**
- `-e API_URL=http://localhost:3001`: Variable de entorno para la URL del API
- **Importante:** Usa `localhost` porque ambos contenedores están en el mismo host

**Verificar:**
```bash
curl http://localhost:3000/health
```

### 7.3 Probar la Aplicación Completa

**Abrir en el navegador:**
```
http://localhost:3000
```

**Deberías ver:**
- Interfaz del catálogo de productos
- Productos cargándose desde el API
- Funcionalidad CRUD completa

---

## 🐳 Paso 8: Usar Docker Compose (Más Fácil)

### 8.1 ¿Qué es Docker Compose?

**Docker Compose** es una herramienta para definir y ejecutar aplicaciones multi-contenedor.

**Ventajas:**
- ✅ Define todos los servicios en un archivo
- ✅ Orquesta el inicio de servicios
- ✅ Configura redes entre contenedores
- ✅ Health checks automáticos

### 8.2 Archivo docker-compose.yml

**Ubicación:** `docker-compose.yml`

**Contenido:**
```yaml
version: '3.8'

services:
  api:
    build:
      context: ./services/api
      dockerfile: Dockerfile
    container_name: catalogo-productos-api
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - API_VERSION=v1
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ./services/frontend
      dockerfile: Dockerfile
    container_name: catalogo-productos-frontend
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - API_URL=http://api:3001
    depends_on:
      api:
        condition: service_healthy
```

**Explicación:**

**`services:`**
- Define los servicios (contenedores) a ejecutar

**`api:` y `frontend:`**
- Nombres de los servicios
- Se pueden referenciar entre sí

**`build:`**
- Especifica cómo construir la imagen
- `context`: Directorio con el Dockerfile
- `dockerfile`: Nombre del Dockerfile

**`ports:`**
- Mapea puertos del contenedor al host
- Formato: `"HOST:CONTAINER"`

**`environment:`**
- Variables de entorno para el contenedor
- **Igual que Cloud Run:** Cloud Run también usa variables de entorno

**`healthcheck:`**
- Verifica que el servicio está saludable
- **Igual que Cloud Run:** Cloud Run también verifica health checks

**`depends_on:`**
- El frontend espera a que el API esté saludable
- **Útil para:** Asegurar que los servicios se inicien en orden

**Pregunta del examen:** ¿Qué herramienta se usa para orquestar múltiples contenedores Docker?
**Respuesta:** Docker Compose

### 8.3 Ejecutar con Docker Compose

**Comando:**
```bash
docker-compose up --build
```

**Explicación:**
- `docker-compose up`: Levanta todos los servicios definidos
- `--build`: Construye las imágenes antes de ejecutar
- **Útil para:** Desarrollo y pruebas

**Salida esperada:**
```
Building api...
Step 1/9 : FROM node:18-alpine
...
Creating catalogo-productos-api ...
Creating catalogo-productos-frontend ...
api-service    | 🚀 API Service corriendo en http://localhost:3001
frontend-service | 🌐 Frontend Service corriendo en http://localhost:3000
```

**Ejecutar en segundo plano:**
```bash
docker-compose up -d --build
```

**Explicación:**
- `-d`: Ejecuta en segundo plano (detached)
- **Útil para:** No bloquear la terminal

**Pregunta del examen:** ¿Qué comando de Docker Compose levanta todos los servicios?
**Respuesta:** `docker-compose up`

### 8.4 Detener Servicios con Docker Compose

**Comando:**
```bash
docker-compose down
```

**Explicación:**
- `docker-compose down`: Detiene y elimina todos los contenedores
- También elimina las redes creadas
- **Útil para:** Limpiar todo después de probar

**Pregunta del examen:** ¿Qué comando de Docker Compose detiene todos los servicios?
**Respuesta:** `docker-compose down`

---

## 📊 Comparación: Desarrollo vs Emulación vs Cloud Run

### Tabla Comparativa Completa

| Aspecto | Desarrollo (npm) | Emulación (Docker) | Cloud Run Real |
|---------|------------------|-------------------|----------------|
| **Ejecución** | Node.js directo | Docker local | Docker en la nube |
| **Configuración** | .env o variables | Docker env | Cloud Run env |
| **Puerto** | Fijo (3000, 3001) | Variable PORT | Variable PORT |
| **Health Checks** | Manual | Docker healthcheck | Cloud Run automático |
| **Red entre servicios** | localhost | Docker network | Internet/Cloud network |
| **Costo** | Gratis | Gratis | Pay per use |
| **Escalado** | Manual | Manual | Automático (0 a N) |
| **HTTPS** | ❌ | ❌ | ✅ Automático |
| **Logs** | Console | docker logs | Cloud Logging |
| **URL** | localhost | localhost | *.run.app |
| **Tiempo de inicio** | Instantáneo | ~2-5 segundos | ~5-10 segundos |
| **Debugging** | Fácil | Medio | Difícil (remoto) |

### ¿Cuándo Usar Cada Uno?

**Desarrollo (npm):**
- ✅ Desarrollo rápido
- ✅ Debugging fácil
- ✅ Cambios instantáneos

**Emulación (Docker):**
- ✅ Probar antes de desplegar
- ✅ Verificar Dockerfile
- ✅ Probar configuración de Cloud Run
- ✅ Aprender cómo funciona Cloud Run

**Cloud Run Real:**
- ✅ Producción
- ✅ Escalado automático
- ✅ HTTPS automático
- ✅ Disponibilidad global

---

## 🎓 Conceptos Clave para el Examen

### 1. Docker es la Base de Cloud Run
- Cloud Run ejecuta contenedores Docker
- Necesitas un Dockerfile
- La imagen debe estar en GCR o Artifact Registry

### 2. Variables de Entorno
- Cloud Run usa variables de entorno
- La variable `PORT` es obligatoria
- Se pasan con `--set-env-vars` o `-e` en Docker

### 3. Health Checks
- Cloud Run verifica `/health` automáticamente
- Docker también puede verificar health checks
- Si falla, no se envía tráfico

### 4. Puertos
- Cloud Run mapea puertos automáticamente
- Docker necesita `-p` para mapear puertos
- La aplicación debe escuchar en `process.env.PORT`

### 5. Redes
- En Docker local: `localhost` o nombre del servicio
- En Cloud Run: URLs HTTPS completas
- Los servicios se comunican por HTTP

---

## 📝 Preguntas de Práctica para el Examen

### Pregunta 1
¿Qué comando construye una imagen Docker?
- A) `docker create`
- B) `docker build` ✅
- C) `docker make`
- D) `docker compile`

### Pregunta 2
¿Qué flag de `docker run` mapea puertos?
- A) `--port`
- B) `-p` ✅
- C) `--map`
- D) `--expose`

### Pregunta 3
¿Qué variable de entorno usa Cloud Run para saber en qué puerto escuchar?
- A) `HOST`
- B) `PORT` ✅
- C) `LISTEN_PORT`
- D) `SERVER_PORT`

### Pregunta 4
¿Qué comando de Docker Compose levanta todos los servicios?
- A) `docker-compose start`
- B) `docker-compose up` ✅
- C) `docker-compose run`
- D) `docker-compose launch`

### Pregunta 5
¿Qué herramienta se usa para orquestar múltiples contenedores Docker?
- A) Docker Swarm
- B) Kubernetes
- C) Docker Compose ✅
- D) Docker Network

---

## 🎯 Resumen del Flujo de Emulación

```
1. Construir imagen Docker
   ├── cd services/api
   ├── docker build -t catalogo-productos-api .
   └── Verificar: docker images

2. Ejecutar contenedor
   ├── docker run -d -p 3001:3001 -e PORT=3001 --name api-service catalogo-productos-api
   └── Verificar: curl http://localhost:3001/health

3. Ver logs
   └── docker logs -f api-service

4. Detener y limpiar
   ├── docker stop api-service
   └── docker rm api-service

O usar Docker Compose:
   ├── docker-compose up --build
   └── docker-compose down
```

---

## 📚 Recursos Adicionales

- **Documentación Docker:** https://docs.docker.com
- **Docker Compose:** https://docs.docker.com/compose
- **Cloud Run Local:** https://cloud.google.com/run/docs/testing/local
- **Best Practices:** https://cloud.google.com/run/docs/tips

---

¡Ahora estás listo para emular Cloud Run localmente antes de desplegar! 🎓

