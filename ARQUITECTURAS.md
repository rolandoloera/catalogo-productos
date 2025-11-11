# Diferencias: Monolítica vs Microservicios

Este documento explica las diferencias prácticas entre la aplicación **monolítica** y la arquitectura de **microservicios** en este proyecto.

## 📊 Comparación Visual

### Aplicación Monolítica (Original)

```
┌─────────────────────────────────────┐
│     Un Solo Servidor (Puerto 8080)   │
│                                      │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Frontend   │  │     API     │ │
│  │   (HTML)     │  │   (REST)    │ │
│  └──────────────┘  └─────────────┘ │
│                                      │
│  Todo en un solo proceso            │
└─────────────────────────────────────┘
```

### Arquitectura de Microservicios (Actual)

```
┌──────────────────┐      ┌──────────────────┐
│  Frontend        │      │  API Service     │
│  (Puerto 3000)   │─────▶│  (Puerto 3001)   │
│                  │ HTTP │                  │
│  - Sirve HTML    │      │  - Endpoints REST│
│  - Consume API    │      │  - Lógica negocio│
└──────────────────┘      └──────────────────┘
     Servicio 1              Servicio 2
```

## 🔍 Diferencias Prácticas

### 1. **Estructura de Archivos**

#### Monolítica
```
catalogo-productos/
├── server.js          ← TODO en un archivo
├── public/
│   └── index.html
└── package.json
```

#### Microservicios
```
catalogo-productos/
├── services/
│   ├── api/          ← Servicio independiente
│   │   ├── server.js
│   │   └── package.json
│   └── frontend/      ← Servicio independiente
│       ├── server.js
│       └── package.json
└── docker-compose.yml ← Orquestación
```

### 2. **Despliegue**

#### Monolítica
- **1 servicio** en Cloud Run
- **1 Dockerfile**
- **1 URL** para todo
- Si falla, **todo falla**

```bash
# Un solo despliegue
gcloud run deploy catalogo-productos --source .
```

#### Microservicios
- **2 servicios** independientes en Cloud Run
- **2 Dockerfiles** (uno por servicio)
- **2 URLs** diferentes
- Si uno falla, el otro puede seguir funcionando

```bash
# Despliegue independiente
gcloud run deploy catalogo-productos-api --source ./services/api
gcloud run deploy catalogo-productos-frontend --source ./services/frontend
```

### 3. **Escalabilidad**

#### Monolítica
```
Escalar = Escalar TODO
┌─────────────────────┐
│  Servidor (8080)    │ ← Si necesitas más recursos
│  - Frontend         │   escalas TODO el servidor
│  - API              │
└─────────────────────┘
```

**Problema**: Si solo necesitas más capacidad para la API, también escalas el frontend (desperdicio de recursos).

#### Microservicios
```
Escalar = Escalar solo lo necesario
┌─────────────┐      ┌─────────────┐
│  Frontend   │      │  API        │
│  (1 instancia)     │  (3 instancias) ← Solo escalas lo que necesitas
└─────────────┘      └─────────────┘
```

**Ventaja**: Puedes escalar solo el API a 10 instancias y dejar el frontend en 1.

### 4. **Desarrollo y Actualizaciones**

#### Monolítica
```javascript
// Un solo archivo server.js
app.get('/api/productos', ...)      // API
app.get('/', ...)                    // Frontend
app.use(express.static('public'))    // Archivos estáticos
```

**Actualizar API**: Debes redesplegar TODO
**Actualizar Frontend**: Debes redesplegar TODO

#### Microservicios
```javascript
// services/api/server.js
app.get('/api/v1/productos', ...)   // Solo API

// services/frontend/server.js
app.use(express.static('public'))   // Solo Frontend
```

**Actualizar API**: Solo redesplegas el servicio API
**Actualizar Frontend**: Solo redesplegas el servicio Frontend

### 5. **Comunicación**

#### Monolítica
```
Frontend ──┐
           ├──▶ Mismo proceso (sin red)
API ───────┘
```

**Ventaja**: Comunicación instantánea (sin latencia de red)

#### Microservicios
```
Frontend ──HTTP──▶ API
  (3000)         (3001)
```

**Desventaja**: Latencia de red entre servicios
**Ventaja**: Servicios pueden estar en diferentes servidores/regiones

### 6. **Configuración**

#### Monolítica
```javascript
// Un solo servidor
const PORT = 8080;
app.use(express.static('public'));  // Frontend
app.get('/api/productos', ...);     // API
```

#### Microservicios
```javascript
// API Service
const PORT = 3001;
app.use(cors());  // Necesario para permitir peticiones del frontend
app.get('/api/v1/productos', ...);

// Frontend Service
const PORT = 3000;
const API_URL = process.env.API_URL;  // Debe configurarse
```

### 7. **Testing**

#### Monolítica
```bash
# Un solo comando para probar todo
npm start
# Abre http://localhost:8080
```

#### Microservicios
```bash
# Opción 1: Docker Compose (recomendado)
docker-compose up

# Opción 2: Servicios individuales
# Terminal 1
cd services/api && npm start

# Terminal 2
cd services/frontend && API_URL=http://localhost:3001 npm start
```

### 8. **Costo en Cloud Run**

#### Monolítica
```
1 servicio = 1 facturación
- Si recibe 1000 requests/min
- Pagas por 1 servicio
```

#### Microservicios
```
2 servicios = 2 facturaciones independientes
- API: 1000 requests/min → Facturación del API
- Frontend: 500 requests/min → Facturación del Frontend
- Puedes optimizar costos escalando solo lo necesario
```

## 📋 Tabla Comparativa

| Aspecto | Monolítica | Microservicios |
|---------|-----------|----------------|
| **Archivos** | 1 servidor | 2+ servicios |
| **Despliegue** | 1 servicio | 2+ servicios |
| **Escalabilidad** | Todo junto | Independiente |
| **Actualizaciones** | Redesplegar todo | Redesplegar solo el afectado |
| **Comunicación** | Mismo proceso | HTTP entre servicios |
| **Complejidad** | Baja | Media-Alta |
| **Latencia** | Mínima | Pequeña (red) |
| **Falla** | Todo cae | Aislada por servicio |
| **Testing** | Simple | Requiere orquestación |
| **Costo inicial** | Bajo | Medio (más servicios) |

## 🎯 ¿Cuándo usar cada una?

### Usa Monolítica cuando:
- ✅ Aplicación pequeña o mediana
- ✅ Equipo pequeño
- ✅ Necesitas simplicidad
- ✅ No necesitas escalar componentes por separado
- ✅ Desarrollo rápido es prioritario

### Usa Microservicios cuando:
- ✅ Aplicación grande o compleja
- ✅ Equipos grandes (cada equipo maneja un servicio)
- ✅ Necesitas escalar componentes independientemente
- ✅ Diferentes servicios tienen diferentes requisitos (CPU, memoria)
- ✅ Quieres desplegar actualizaciones sin afectar todo
- ✅ Planeas usar múltiples tecnologías

## 💡 Ejemplo Práctico: Actualizar el Frontend

### Monolítica
```bash
# 1. Hacer cambios en public/index.html
# 2. Redesplegar TODO (incluyendo API que no cambió)
gcloud run deploy catalogo-productos --source .
# ⏱️ Tiempo: ~3 minutos
# ⚠️ API queda inaccesible durante el despliegue
```

### Microservicios
```bash
# 1. Hacer cambios en services/frontend/public/index.html
# 2. Redesplegar SOLO el frontend
gcloud run deploy catalogo-productos-frontend --source ./services/frontend
# ⏱️ Tiempo: ~1.5 minutos
# ✅ API sigue funcionando durante el despliegue
```

## 🔧 Código: Diferencias Clave

### Monolítica - Un solo servidor
```javascript
// server.js
app.use(express.static('public'));  // Frontend
app.get('/api/productos', ...);     // API
app.listen(8080);
```

### Microservicios - Servicios separados
```javascript
// services/api/server.js
app.use(cors());  // Necesario para CORS
app.get('/api/v1/productos', ...);
app.listen(3001);

// services/frontend/server.js
app.use(express.static('public'));
// Frontend hace fetch a API_URL/api/v1/productos
app.listen(3000);
```

## 📊 Resumen

| | Monolítica | Microservicios |
|---|---|---|
| **Simplicidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Escalabilidad** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Flexibilidad** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Velocidad desarrollo** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Mantenibilidad** | ⭐⭐⭐ | ⭐⭐⭐⭐ |

## 🎓 Conclusión

**Monolítica** = Todo junto, simple, rápido de desarrollar
**Microservicios** = Separado, escalable, más flexible

Para esta aplicación de catálogo:
- **Monolítica**: Perfecta si es un proyecto pequeño, personal, o prototipo
- **Microservicios**: Mejor si planeas crecer, necesitas escalar, o tienes múltiples equipos

**Ambas funcionan perfectamente**, la elección depende de tus necesidades específicas.

