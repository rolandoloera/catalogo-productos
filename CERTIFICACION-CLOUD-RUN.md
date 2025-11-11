# Guía de Certificación: Despliegue a Google Cloud Run
## Aprendizaje Paso a Paso - Como para Examen de Certificación

Esta guía explica **cada paso** del despliegue a Cloud Run, explicando **por qué** y **cómo** funciona cada cosa, como si fuera para un examen de certificación de Google Cloud.

---

## 📚 Conceptos Fundamentales

### ¿Qué es Google Cloud Run?

**Cloud Run** es un servicio **serverless** que ejecuta contenedores Docker en la nube.

**Características clave:**
- ✅ Ejecuta contenedores Docker
- ✅ Escalado automático (0 a N instancias)
- ✅ Pago por uso (solo pagas cuando se usa)
- ✅ HTTPS automático
- ✅ Integración con otros servicios de GCP

### ¿Por qué usar Cloud Run?

1. **Serverless**: No gestionas servidores
2. **Escalado automático**: Se escala según la demanda
3. **Costo**: Solo pagas por lo que usas
4. **Rápido**: Despliegue en segundos
5. **Contenedores**: Usa Docker (estándar de la industria)

---

## 🎯 Paso 1: Preparar el Entorno Local

### 1.1 Verificar que tenemos Docker

**¿Por qué?** Cloud Run ejecuta contenedores Docker, así que necesitamos Docker localmente para construir las imágenes.

**Comando:**
```bash
docker --version
```

**¿Qué hace?** Verifica que Docker está instalado.

**Salida esperada:**
```
Docker version 24.0.0, build abc123
```

**Si no está instalado:**
- Descargar Docker Desktop desde: https://www.docker.com/products/docker-desktop

### 1.2 Verificar que tenemos Google Cloud SDK

**¿Por qué?** Necesitamos `gcloud` para desplegar a Cloud Run.

**Comando:**
```bash
gcloud --version
```

**¿Qué hace?** Verifica que Google Cloud SDK está instalado.

**Salida esperada:**
```
Google Cloud SDK 450.0.0
```

**Si no está instalado:**
```bash
# Windows (PowerShell)
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe

# O descargar desde: https://cloud.google.com/sdk/docs/install
```

### 1.3 Autenticarse en Google Cloud

**¿Por qué?** Necesitamos autenticarnos para poder desplegar servicios.

**Comando:**
```bash
gcloud auth login
```

**¿Qué hace?**
1. Abre tu navegador
2. Te pide que inicies sesión con tu cuenta de Google
3. Autoriza el acceso a Google Cloud
4. Guarda las credenciales localmente

**Pregunta del examen:** ¿Qué comando usas para autenticarte en Google Cloud?
**Respuesta:** `gcloud auth login`

### 1.4 Configurar el Proyecto

**¿Por qué?** Todos los recursos de Google Cloud pertenecen a un proyecto. Necesitamos especificar en qué proyecto vamos a trabajar.

**Comando:**
```bash
gcloud config set project TU_PROYECTO_ID
```

**¿Qué hace?**
- Establece el proyecto por defecto para todos los comandos `gcloud`
- Guarda esta configuración en `~/.config/gcloud/configurations/default`

**Ejemplo:**
```bash
gcloud config set project mi-proyecto-12345
```

**Verificar el proyecto actual:**
```bash
gcloud config get-value project
```

**Pregunta del examen:** ¿Cómo configuras el proyecto por defecto en gcloud?
**Respuesta:** `gcloud config set project PROYECTO_ID`

### 1.5 Habilitar APIs Necesarias

**¿Por qué?** Google Cloud requiere que habilites explícitamente las APIs que vas a usar.

**APIs necesarias:**
1. **Cloud Run API**: Para desplegar servicios
2. **Cloud Build API**: Para construir imágenes Docker

**Comando:**
```bash
# Habilitar Cloud Run API
gcloud services enable run.googleapis.com

# Habilitar Cloud Build API
gcloud services enable cloudbuild.googleapis.com
```

**¿Qué hace cada comando?**
- `run.googleapis.com`: Habilita la API de Cloud Run
- `cloudbuild.googleapis.com`: Habilita la API de Cloud Build (para construir imágenes)

**Verificar APIs habilitadas:**
```bash
gcloud services list --enabled
```

**Pregunta del examen:** ¿Qué API necesitas habilitar para usar Cloud Run?
**Respuesta:** `run.googleapis.com`

---

## 🐳 Paso 2: Construir las Imágenes Docker

### 2.1 Entender Dockerfile

**¿Qué es un Dockerfile?**
Un Dockerfile es un archivo de texto que contiene instrucciones para construir una imagen Docker.

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

**Explicación línea por línea:**

1. **`FROM node:18-alpine`**
   - **¿Qué hace?** Especifica la imagen base
   - **¿Por qué?** Necesitamos Node.js para ejecutar nuestra aplicación
   - **`alpine`**: Versión ligera de Linux (imagen más pequeña)

2. **`WORKDIR /app`**
   - **¿Qué hace?** Establece el directorio de trabajo
   - **¿Por qué?** Todas las instrucciones siguientes se ejecutan en `/app`

3. **`COPY package*.json ./`**
   - **¿Qué hace?** Copia `package.json` y `package-lock.json` al contenedor
   - **¿Por qué?** Necesitamos las dependencias antes de instalar

4. **`RUN npm install --production`**
   - **¿Qué hace?** Instala las dependencias de producción
   - **`--production`**: Solo instala dependencias de producción (no devDependencies)

5. **`COPY . .`**
   - **¿Qué hace?** Copia todo el código al contenedor
   - **¿Por qué?** Necesitamos el código para ejecutar la aplicación

6. **`EXPOSE 3001`**
   - **¿Qué hace?** Documenta que el contenedor escucha en el puerto 3001
   - **¿Por qué?** Información para otros desarrolladores

7. **`ENV PORT=3001`**
   - **¿Qué hace?** Establece la variable de entorno PORT
   - **¿Por qué?** Cloud Run usa la variable PORT para saber en qué puerto escuchar

8. **`CMD ["node", "server.js"]**
   - **¿Qué hace?** Comando que se ejecuta cuando el contenedor inicia
   - **¿Por qué?** Inicia nuestra aplicación Node.js

**Pregunta del examen:** ¿Qué instrucción Dockerfile establece el comando que se ejecuta al iniciar el contenedor?
**Respuesta:** `CMD`

### 2.2 Construir la Imagen Docker Localmente

**¿Por qué construir localmente primero?**
- Verificar que el Dockerfile funciona
- Probar la imagen antes de subirla
- Ahorrar tiempo y costos

**Comando:**
```bash
cd services/api
docker build -t catalogo-productos-api .
```

**Explicación del comando:**
- `docker build`: Construye una imagen Docker
- `-t catalogo-productos-api`: Le da un nombre (tag) a la imagen
- `.`: Usa el Dockerfile en el directorio actual

**¿Qué hace paso a paso?**
1. Lee el Dockerfile
2. Ejecuta cada instrucción en orden
3. Crea capas (layers) de la imagen
4. Guarda la imagen con el nombre especificado

**Verificar que la imagen se construyó:**
```bash
docker images
```

**Salida esperada:**
```
REPOSITORY                 TAG       IMAGE ID       CREATED         SIZE
catalogo-productos-api    latest    abc123def456   2 minutes ago   150MB
```

**Pregunta del examen:** ¿Qué comando construye una imagen Docker?
**Respuesta:** `docker build`

### 2.3 Probar la Imagen Localmente

**¿Por qué probar localmente?**
- Verificar que la aplicación funciona en Docker
- Detectar problemas antes de desplegar

**Comando:**
```bash
docker run -p 3001:3001 -e PORT=3001 catalogo-productos-api
```

**Explicación:**
- `docker run`: Ejecuta un contenedor
- `-p 3001:3001`: Mapea el puerto 3001 del contenedor al puerto 3001 del host
- `-e PORT=3001`: Establece la variable de entorno PORT

**Probar que funciona:**
```bash
# En otra terminal
curl http://localhost:3001/health
```

**Detener el contenedor:**
```bash
# Presionar Ctrl+C o
docker stop <CONTAINER_ID>
```

**Pregunta del examen:** ¿Qué flag de `docker run` mapea puertos del contenedor al host?
**Respuesta:** `-p` o `--publish`

---

## ☁️ Paso 3: Subir la Imagen a Google Container Registry

### 3.1 Entender Google Container Registry (GCR)

**¿Qué es GCR?**
Google Container Registry es un servicio para almacenar imágenes Docker.

**Formato de URL:**
```
gcr.io/PROYECTO_ID/NOMBRE_IMAGEN
```

**Ejemplo:**
```
gcr.io/mi-proyecto-12345/catalogo-productos-api
```

**¿Por qué usar GCR?**
- Cloud Run puede acceder a las imágenes
- Almacenamiento seguro y privado
- Integración con otros servicios de GCP

**Pregunta del examen:** ¿Cuál es el formato de URL para imágenes en Google Container Registry?
**Respuesta:** `gcr.io/PROYECTO_ID/NOMBRE_IMAGEN`

### 3.2 Etiquetar la Imagen para GCR

**¿Por qué etiquetar?**
Necesitamos etiquetar la imagen con la URL de GCR antes de subirla.

**Comando:**
```bash
# Obtener el ID del proyecto
PROYECTO_ID=$(gcloud config get-value project)

# Etiquetar la imagen
docker tag catalogo-productos-api gcr.io/$PROYECTO_ID/catalogo-productos-api
```

**Explicación:**
- `docker tag`: Crea una nueva etiqueta para una imagen existente
- `gcr.io/$PROYECTO_ID/catalogo-productos-api`: URL completa de GCR

**Verificar la etiqueta:**
```bash
docker images | grep catalogo-productos-api
```

**Pregunta del examen:** ¿Qué comando crea una nueva etiqueta para una imagen Docker?
**Respuesta:** `docker tag`

### 3.3 Configurar Docker para GCR

**¿Por qué?** Necesitamos autenticar Docker para poder subir imágenes a GCR.

**Comando:**
```bash
gcloud auth configure-docker
```

**¿Qué hace?**
- Configura Docker para usar las credenciales de gcloud
- Permite que `docker push` funcione con GCR

**Pregunta del examen:** ¿Qué comando configura Docker para usar Google Container Registry?
**Respuesta:** `gcloud auth configure-docker`

### 3.4 Subir la Imagen a GCR

**Comando:**
```bash
docker push gcr.io/$PROYECTO_ID/catalogo-productos-api
```

**¿Qué hace?**
1. Autentica con GCR usando las credenciales de gcloud
2. Sube las capas (layers) de la imagen
3. Almacena la imagen en GCR

**Proceso:**
```
Sending build context to Docker daemon...
Pushing image to gcr.io/mi-proyecto-12345/catalogo-productos-api...
The push refers to repository [gcr.io/mi-proyecto-12345/catalogo-productos-api]
abc123: Pushed
def456: Pushed
latest: digest: sha256:abc123... size: 1234
```

**Verificar que se subió:**
```bash
gcloud container images list
```

**Pregunta del examen:** ¿Qué comando sube una imagen Docker a Google Container Registry?
**Respuesta:** `docker push gcr.io/PROYECTO_ID/NOMBRE_IMAGEN`

---

## 🚀 Paso 4: Desplegar a Cloud Run

### 4.1 Desplegar el API Service

**Comando básico:**
```bash
gcloud run deploy catalogo-productos-api \
  --image gcr.io/$PROYECTO_ID/catalogo-productos-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Explicación línea por línea:**

1. **`gcloud run deploy`**
   - **¿Qué hace?** Despliega un servicio a Cloud Run
   - **¿Por qué?** Es el comando principal para desplegar

2. **`catalogo-productos-api`**
   - **¿Qué hace?** Nombre del servicio en Cloud Run
   - **¿Por qué?** Identificador único del servicio

3. **`--image gcr.io/$PROYECTO_ID/catalogo-productos-api`**
   - **¿Qué hace?** Especifica la imagen Docker a usar
   - **¿Por qué?** Cloud Run necesita saber qué imagen ejecutar

4. **`--platform managed`**
   - **¿Qué hace?** Usa Cloud Run (managed) en lugar de Cloud Run for Anthos
   - **¿Por qué?** Cloud Run managed es serverless y más fácil

5. **`--region us-central1`**
   - **¿Qué hace?** Especifica la región donde se despliega
   - **¿Por qué?** Los servicios deben estar en una región específica
   - **Opciones comunes:** `us-central1`, `us-east1`, `europe-west1`

6. **`--allow-unauthenticated`**
   - **¿Qué hace?** Permite acceso público sin autenticación
   - **¿Por qué?** Para APIs públicas (como nuestro catálogo)
   - **Alternativa:** `--no-allow-unauthenticated` (requiere autenticación)

**Salida esperada:**
```
Deploying container to Cloud Run service [catalogo-productos-api] in project [mi-proyecto-12345] region [us-central1]
✓ Deploying new service...
✓ Creating Revision...
✓ Routing traffic...
Service [catalogo-productos-api] revision [catalogo-productos-api-00001-abc] has been deployed and is serving 100 percent of traffic.
Service URL: https://catalogo-productos-api-xxxxx-uc.a.run.app
```

**Pregunta del examen:** ¿Qué flag de `gcloud run deploy` permite acceso público sin autenticación?
**Respuesta:** `--allow-unauthenticated`

### 4.2 Configuraciones Avanzadas

**Especificar el puerto:**
```bash
--port 3001
```
**¿Por qué?** Cloud Run necesita saber en qué puerto escucha la aplicación.

**Variables de entorno:**
```bash
--set-env-vars API_VERSION=v1,NODE_ENV=production
```
**¿Por qué?** Pasar configuración a la aplicación.

**Límites de recursos:**
```bash
--memory 512Mi \
--cpu 1 \
--timeout 300 \
--concurrency 80
```
**Explicación:**
- `--memory 512Mi`: Límite de memoria (512 megabytes)
- `--cpu 1`: 1 CPU core
- `--timeout 300`: Timeout de 300 segundos (5 minutos)
- `--concurrency 80`: 80 requests simultáneas por instancia

**Escalado:**
```bash
--min-instances 1 \
--max-instances 10
```
**Explicación:**
- `--min-instances 1`: Mínimo 1 instancia siempre activa
- `--max-instances 10`: Máximo 10 instancias

**Pregunta del examen:** ¿Qué flag de `gcloud run deploy` establece el número mínimo de instancias?
**Respuesta:** `--min-instances`

### 4.3 Obtener la URL del Servicio

**Después del despliegue, obtienes una URL:**
```
https://catalogo-productos-api-xxxxx-uc.a.run.app
```

**Obtener la URL después:**
```bash
gcloud run services describe catalogo-productos-api \
  --region us-central1 \
  --format 'value(status.url)'
```

**Probar el servicio:**
```bash
curl https://catalogo-productos-api-xxxxx-uc.a.run.app/health
```

**Pregunta del examen:** ¿Qué comando obtiene la URL de un servicio de Cloud Run?
**Respuesta:** `gcloud run services describe SERVICIO --format 'value(status.url)'`

### 4.4 Desplegar el Frontend Service

**Paso 1: Obtener la URL del API**
```bash
API_URL=$(gcloud run services describe catalogo-productos-api \
  --region us-central1 \
  --format 'value(status.url)')
```

**Paso 2: Construir y subir la imagen del Frontend**
```bash
cd ../frontend

# Construir
docker build -t catalogo-productos-frontend .

# Etiquetar
PROYECTO_ID=$(gcloud config get-value project)
docker tag catalogo-productos-frontend gcr.io/$PROYECTO_ID/catalogo-productos-frontend

# Subir
docker push gcr.io/$PROYECTO_ID/catalogo-productos-frontend
```

**Paso 3: Desplegar el Frontend**
```bash
gcloud run deploy catalogo-productos-frontend \
  --image gcr.io/$PROYECTO_ID/catalogo-productos-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars API_URL=$API_URL
```

**Importante:** Usar la URL del API desplegado, no `http://localhost:3001`

**Pregunta del examen:** ¿Por qué necesitas usar la URL del API desplegado en lugar de localhost para el frontend?
**Respuesta:** Porque el frontend se ejecuta en Cloud Run, no localmente, y necesita comunicarse con el API a través de internet.

---

## 📊 Paso 5: Verificar y Monitorear

### 5.1 Listar Servicios Desplegados

**Comando:**
```bash
gcloud run services list
```

**Salida:**
```
SERVICE                      REGION        URL
catalogo-productos-api      us-central1   https://...run.app
catalogo-productos-frontend  us-central1   https://...run.app
```

**Pregunta del examen:** ¿Qué comando lista todos los servicios de Cloud Run?
**Respuesta:** `gcloud run services list`

### 5.2 Ver Logs

**Comando:**
```bash
gcloud run services logs read catalogo-productos-api \
  --region us-central1 \
  --limit 50
```

**¿Qué hace?** Muestra los últimos 50 logs del servicio.

**Ver logs en tiempo real:**
```bash
gcloud run services logs tail catalogo-productos-api \
  --region us-central1
```

**Pregunta del examen:** ¿Qué comando muestra logs en tiempo real de un servicio de Cloud Run?
**Respuesta:** `gcloud run services logs tail SERVICIO`

### 5.3 Ver Detalles del Servicio

**Comando:**
```bash
gcloud run services describe catalogo-productos-api \
  --region us-central1
```

**Información que muestra:**
- URL del servicio
- Estado (activo/inactivo)
- Configuración (memoria, CPU, timeout)
- Última revisión desplegada
- Tráfico enrutado

**Pregunta del examen:** ¿Qué comando muestra los detalles completos de un servicio de Cloud Run?
**Respuesta:** `gcloud run services describe SERVICIO`

---

## 🔄 Paso 6: Actualizar un Servicio

### 6.1 Actualizar el Código

**Hacer cambios en el código:**
```javascript
// services/api/server.js
// Cambiar algo en el código
```

### 6.2 Reconstruir y Subir la Imagen

```bash
# Construir nueva imagen
docker build -t catalogo-productos-api .

# Etiquetar
PROYECTO_ID=$(gcloud config get-value project)
docker tag catalogo-productos-api gcr.io/$PROYECTO_ID/catalogo-productos-api

# Subir nueva versión
docker push gcr.io/$PROYECTO_ID/catalogo-productos-api
```

### 6.3 Redesplegar

**Opción 1: Redesplegar con la misma configuración**
```bash
gcloud run deploy catalogo-productos-api \
  --image gcr.io/$PROYECTO_ID/catalogo-productos-api \
  --region us-central1
```

**Opción 2: Desplegar desde código fuente (más fácil)**
```bash
gcloud run deploy catalogo-productos-api \
  --source . \
  --region us-central1
```

**¿Qué hace `--source`?**
- Construye la imagen automáticamente usando Cloud Build
- No necesitas construir y subir manualmente
- Más rápido y fácil

**Pregunta del examen:** ¿Qué flag de `gcloud run deploy` construye la imagen automáticamente desde código fuente?
**Respuesta:** `--source`

---

## 🎓 Conceptos Clave para el Examen

### 1. Cloud Run es Serverless
- No gestionas servidores
- Escalado automático
- Pago por uso

### 2. Cloud Run Ejecuta Contenedores Docker
- Necesitas un Dockerfile
- La imagen debe estar en GCR o Artifact Registry
- Cloud Run usa la variable de entorno `PORT`

### 3. Regiones
- Cada servicio se despliega en una región específica
- Regiones comunes: `us-central1`, `us-east1`, `europe-west1`

### 4. Autenticación
- `--allow-unauthenticated`: Acceso público
- `--no-allow-unauthenticated`: Requiere autenticación

### 5. Variables de Entorno
- `--set-env-vars KEY=value`
- Se pasan al contenedor en tiempo de ejecución

### 6. Health Checks
- Cloud Run verifica automáticamente `/health`
- Si falla, no envía tráfico al servicio

### 7. Revisiones (Revisions)
- Cada despliegue crea una nueva revisión
- Puedes tener múltiples revisiones activas
- Puedes enrutar tráfico entre revisiones

---

## 📝 Preguntas de Práctica para el Examen

### Pregunta 1
¿Qué comando despliega un servicio a Cloud Run?
- A) `gcloud run create`
- B) `gcloud run deploy` ✅
- C) `gcloud services deploy`
- D) `gcloud container deploy`

### Pregunta 2
¿Qué flag permite acceso público sin autenticación?
- A) `--public`
- B) `--allow-unauthenticated` ✅
- C) `--no-auth`
- D) `--public-access`

### Pregunta 3
¿Qué variable de entorno usa Cloud Run para saber en qué puerto escuchar?
- A) `HOST`
- B) `PORT` ✅
- C) `LISTEN_PORT`
- D) `SERVER_PORT`

### Pregunta 4
¿Qué comando configura Docker para usar Google Container Registry?
- A) `gcloud docker configure`
- B) `gcloud auth configure-docker` ✅
- C) `docker login gcr.io`
- D) `gcloud docker login`

### Pregunta 5
¿Qué flag de `gcloud run deploy` construye la imagen automáticamente?
- A) `--build`
- B) `--source` ✅
- C) `--auto-build`
- D) `--dockerfile`

---

## 🎯 Resumen del Flujo Completo

```
1. Preparar entorno
   ├── gcloud auth login
   ├── gcloud config set project PROYECTO_ID
   └── gcloud services enable run.googleapis.com

2. Construir imagen Docker
   ├── docker build -t NOMBRE_IMAGEN .
   └── docker run -p PUERTO:PUERTO NOMBRE_IMAGEN (probar)

3. Subir a GCR
   ├── docker tag NOMBRE_IMAGEN gcr.io/PROYECTO_ID/NOMBRE_IMAGEN
   ├── gcloud auth configure-docker
   └── docker push gcr.io/PROYECTO_ID/NOMBRE_IMAGEN

4. Desplegar a Cloud Run
   └── gcloud run deploy SERVICIO \
         --image gcr.io/PROYECTO_ID/NOMBRE_IMAGEN \
         --platform managed \
         --region REGION \
         --allow-unauthenticated

5. Verificar
   ├── gcloud run services list
   ├── gcloud run services describe SERVICIO
   └── curl URL_SERVICIO/health
```

---

## 📚 Recursos Adicionales

- **Documentación oficial:** https://cloud.google.com/run/docs
- **Guía de despliegue:** https://cloud.google.com/run/docs/deploying
- **Precios:** https://cloud.google.com/run/pricing
- **Límites:** https://cloud.google.com/run/quotas

---

¡Buena suerte en tu examen de certificación! 🎓

