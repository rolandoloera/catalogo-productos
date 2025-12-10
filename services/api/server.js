// Cargar variables de entorno desde .env (solo en desarrollo local)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');
const { pool, getPool, testConnection, initializeDatabase } = require('./database');
const { login, verifyToken, authenticateToken, requireAdmin, requireOwner, requireOwnerOrSelf, crearUsuarioAdminPorDefecto } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;
const API_VERSION = process.env.API_VERSION || 'v1';

// Validar variables de entorno críticas en producción
if (process.env.NODE_ENV === 'production') {
  const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('❌ ERROR: Variables de entorno requeridas no configuradas:', missingVars.join(', '));
    process.exit(1);
  }
}

// Configurar Cloudinary si está disponible (para producción)
let cloudinary;
if (process.env.CLOUDINARY_CLOUD_NAME) {
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('✅ Cloudinary configurado para almacenamiento de imágenes');
  } catch (error) {
    console.log('⚠️ Cloudinary no disponible, usando almacenamiento local');
  }
}

// Configurar almacenamiento local para desarrollo
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'producto-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// ========== MIDDLEWARE DE SEGURIDAD ==========

// Helmet.js - Headers de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Permitir imágenes desde otros orígenes si es necesario
}));

// CORS - Configurar origen específico
// Permitir múltiples orígenes (desarrollo y producción)
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

// Agregar origen de producción si está en producción (fallback si FRONTEND_URL no está configurada)
if (process.env.NODE_ENV === 'production') {
  const prodOrigin = 'https://catalogo-productos-nextjs.onrender.com';
  if (!allowedOrigins.includes(prodOrigin)) {
    allowedOrigins.push(prodOrigin);
  }
}

// Agregar origen de producción si está en producción
if (process.env.NODE_ENV === 'production') {
  // Agregar el origen de producción si no está en la lista
  const prodOrigin = 'https://catalogo-productos-nextjs.onrender.com';
  if (!allowedOrigins.includes(prodOrigin)) {
    allowedOrigins.push(prodOrigin);
  }
}

console.log('🌐 CORS configurado para orígenes:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origen (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('⚠️  Request sin origen (permitido)');
      return callback(null, true);
    }
    
    console.log('🔍 Verificando origen CORS:', origin);
    
    // Verificar si el origen está en la lista permitida
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      console.log('✅ Origen permitido:', origin);
      callback(null, true);
    } else {
      // En desarrollo, permitir localhost
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        console.log('✅ Origen localhost permitido (desarrollo):', origin);
        callback(null, true);
      } else {
        console.log('❌ Origen NO permitido:', origin);
        console.log('   Orígenes permitidos:', allowedOrigins);
        callback(new Error('No permitido por CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Middleware para manejar errores y asegurar CORS en respuestas de error
app.use((err, req, res, next) => {
  // Aplicar CORS manualmente en caso de error
  const origin = req.headers.origin;
  if (origin) {
    const isAllowed = allowedOrigins.includes(origin) || 
                     allowedOrigins.includes('*') ||
                     (process.env.NODE_ENV !== 'production' && origin.includes('localhost'));
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }
  
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({ error: 'No permitido por CORS' });
  }
  
  next(err);
});

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: { error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para login (más estricto)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos de login por IP
  skipSuccessfulRequests: true, // No contar requests exitosos
  message: { error: 'Demasiados intentos de login, intenta de nuevo en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para WhatsApp (evitar abuso)
const whatsappLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 requests por minuto
  message: { error: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting general a todas las rutas API
app.use(`/api/${API_VERSION}/`, generalLimiter);

// Body parser
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ========== FUNCIONES HELPER DE SEGURIDAD ==========

/**
 * Parsear entero de forma segura
 */
function safeParseInt(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parsear float de forma segura
 */
function safeParseFloat(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validar resultados de express-validator
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Datos inválidos',
      details: errors.array()
    });
  }
  next();
}

/**
 * Middleware para servir archivos estáticos de forma segura
 * Solo permite acceso a archivos que pertenecen a productos válidos
 */
async function serveSecureFile(req, res, next) {
  const filename = req.path.replace('/', '');
  const filePath = path.join(uploadDir, filename);
  
  // Verificar que el archivo existe y está en el directorio permitido
  if (!fs.existsSync(filePath) || !filePath.startsWith(uploadDir)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }
  
  // Verificar que el archivo pertenece a un producto (opcional, pero recomendado)
  // Por ahora, solo verificamos que existe y está en el directorio correcto
  next();
}

// Servir archivos estáticos de uploads con protección
app.use('/uploads', serveSecureFile, express.static(uploadDir));

// ========== RUTAS DE AUTENTICACIÓN ==========

// POST /api/v1/auth/login - Login de administrador
app.post(`/api/${API_VERSION}/auth/login`, loginLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida')
], validateRequest, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    // No exponer detalles del error en producción
    console.error('Error en login:', error.message);
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// GET /api/v1/auth/verify - Verificar token
app.get(`/api/${API_VERSION}/auth/verify`, authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.userId,
      email: req.user.email,
      rol: req.user.rol
    }
  });
});

// ========== RUTAS DE USUARIOS ==========

// GET /api/v1/usuarios - Listar todos los usuarios (solo owner)
app.get(`/api/${API_VERSION}/usuarios`, authenticateToken, requireOwner, async (req, res) => {
  try {
    const dbPool = await getPool();
    const result = await dbPool.query(
      'SELECT id, email, nombre, rol, telefono, activo, fecha_creacion, fecha_actualizacion FROM usuarios ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// POST /api/v1/usuarios - Crear nuevo usuario administrador (solo owner)
app.post(`/api/${API_VERSION}/usuarios`, authenticateToken, requireOwner, [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número'),
  body('nombre').trim().isLength({ min: 2, max: 100 }).escape().withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('telefono').optional().matches(/^\d{10,15}$/).withMessage('Teléfono inválido (10-15 dígitos)')
], validateRequest, async (req, res) => {
  try {
    const { email, password, nombre, telefono } = req.body;

    const dbPool = await getPool();

    // Verificar que el email no exista
    const emailCheck = await dbPool.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario (siempre como admin, no owner)
    const result = await dbPool.query(
      'INSERT INTO usuarios (email, password_hash, nombre, rol, telefono, activo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, nombre, rol, telefono, activo, fecha_creacion, fecha_actualizacion',
      [email.toLowerCase().trim(), passwordHash, nombre.trim(), 'admin', telefono || null, true]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /api/v1/usuarios/:id - Actualizar usuario
app.put(`/api/${API_VERSION}/usuarios/:id`, authenticateToken, requireOwnerOrSelf, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, activo } = req.body;

    const dbPool = await getPool();

    // Verificar que el usuario existe
    const userCheck = await dbPool.query('SELECT id, rol FROM usuarios WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const existingUser = userCheck.rows[0];
    const currentUserRol = req.user.rol;
    const currentUserId = req.user.userId;

    // Si es owner intentando actualizar otro owner, no permitir
    if (currentUserRol === 'owner' && existingUser.rol === 'owner' && existingUser.id !== currentUserId) {
      return res.status(403).json({ error: 'No puedes modificar otro usuario owner' });
    }

    // Construir query dinámicamente
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${paramIndex++}`);
      values.push(nombre.trim());
    }
    if (telefono !== undefined) {
      updates.push(`telefono = $${paramIndex++}`);
      values.push(telefono ? telefono.trim() : null);
    }
    if (activo !== undefined && currentUserRol === 'owner') {
      // Solo owner puede cambiar el estado activo
      updates.push(`activo = $${paramIndex++}`);
      values.push(activo);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updates.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, nombre, rol, telefono, activo, fecha_creacion, fecha_actualizacion`;
    const result = await dbPool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// DELETE /api/v1/usuarios/:id - Eliminar usuario (solo owner)
app.delete(`/api/${API_VERSION}/usuarios/:id`, authenticateToken, requireOwner, [
  param('id').isInt({ min: 1 }).withMessage('ID de usuario inválido')
], validateRequest, async (req, res) => {
  try {
    const id = safeParseInt(req.params.id);
    if (id <= 0) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }
    const currentUserId = req.user.userId;

    // No permitir eliminar al usuario actual
    if (id === currentUserId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    const dbPool = await getPool();

    // Verificar que el usuario existe y no es owner
    const userCheck = await dbPool.query('SELECT id, rol FROM usuarios WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (userCheck.rows[0].rol === 'owner') {
      return res.status(403).json({ error: 'No se puede eliminar un usuario owner' });
    }

    await dbPool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Rutas API

/**
 * Normalizar URL de imagen: reemplazar localhost con URL de producción
 */
function normalizarUrlImagen(url) {
  if (!url) return url;
  
  // Si la URL contiene localhost, reemplazarla con la URL de producción
  if (url.includes('localhost:3001') || url.includes('http://localhost')) {
    const apiBaseUrl = process.env.API_BASE_URL || 
                      (process.env.NODE_ENV === 'production' 
                        ? 'https://catalogo-productos-api.onrender.com'
                        : `http://localhost:${PORT}`);
    // Reemplazar la parte del host
    return url.replace(/https?:\/\/[^\/]+/, apiBaseUrl);
  }
  
  return url;
}

// Función helper para convertir tipos de PostgreSQL a JavaScript
// includeTelefono: si es false, NO incluye usuario_telefono (para endpoints públicos por seguridad)
async function convertirProducto(producto, includeTelefono = true) {
  try {
    // PostgreSQL devuelve DECIMAL como string, necesitamos convertirlo explícitamente
    const precio = safeParseFloat(producto.precio, 0);
    
    // Obtener todas las imágenes del producto (con manejo de errores)
    let imagenes = [];
    try {
      const dbPool = await getPool();
      const imagenesResult = await dbPool.query(
        'SELECT imagen_url, orden FROM producto_imagenes WHERE producto_id = $1 ORDER BY orden, id',
        [producto.id]
      );
      // Normalizar URLs de imágenes (reemplazar localhost con URL de producción)
      imagenes = imagenesResult.rows.map(row => normalizarUrlImagen(row.imagen_url));
    } catch (imgError) {
      // Si la tabla no existe o hay error, usar array vacío
      console.warn(`⚠️  Error obteniendo imágenes para producto ${producto.id}:`, imgError.message);
      imagenes = [];
    }

    // Obtener teléfono y nombre del usuario propietario (solo si se requiere)
    let usuarioTelefono = null;
    let usuarioNombre = null;
    if (producto.usuario_id && includeTelefono) {
      try {
        const dbPool = await getPool();
        const usuarioResult = await dbPool.query(
          'SELECT telefono, nombre FROM usuarios WHERE id = $1',
          [producto.usuario_id]
        );
        if (usuarioResult.rows.length > 0) {
          usuarioTelefono = usuarioResult.rows[0].telefono;
          usuarioNombre = usuarioResult.rows[0].nombre;
        }
      } catch (userError) {
        console.warn(`⚠️  Error obteniendo datos del usuario para producto ${producto.id}:`, userError.message);
      }
    } else if (producto.usuario_id && !includeTelefono) {
      // Solo obtener nombre, no teléfono (para endpoints públicos)
      try {
        const dbPool = await getPool();
        const usuarioResult = await dbPool.query(
          'SELECT nombre FROM usuarios WHERE id = $1',
          [producto.usuario_id]
        );
        if (usuarioResult.rows.length > 0) {
          usuarioNombre = usuarioResult.rows[0].nombre;
        }
      } catch (userError) {
        console.warn(`⚠️  Error obteniendo nombre del usuario para producto ${producto.id}:`, userError.message);
      }
    }
    
    const productoConvertido = {
      id: safeParseInt(producto.id, 0),
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: precio,
      stock: safeParseInt(producto.stock, 0),
      imagen_url: normalizarUrlImagen(producto.imagen_url) || null, // Normalizar URL principal
      imagenes: imagenes, // Array de imágenes (ya normalizadas)
      usuario_id: producto.usuario_id ? safeParseInt(producto.usuario_id, 0) : undefined,
      usuario_nombre: usuarioNombre,
      fecha_creacion: producto.fecha_creacion,
      fecha_actualizacion: producto.fecha_actualizacion
    };

    // Solo incluir usuario_telefono si includeTelefono es true (endpoints autenticados)
    if (includeTelefono) {
      productoConvertido.usuario_telefono = usuarioTelefono;
    }

    return productoConvertido;
  } catch (error) {
    console.error('Error en convertirProducto:', error);
    // Retornar producto básico sin imágenes si hay error
    return {
      id: safeParseInt(producto.id, 0),
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: safeParseFloat(producto.precio, 0),
      stock: safeParseInt(producto.stock, 0),
      imagen_url: normalizarUrlImagen(producto.imagen_url) || null,
      imagenes: [],
      usuario_id: producto.usuario_id ? safeParseInt(producto.usuario_id, 0) : undefined,
      usuario_telefono: includeTelefono ? null : undefined,
      usuario_nombre: null,
      fecha_creacion: producto.fecha_creacion,
      fecha_actualizacion: producto.fecha_actualizacion
    };
  }
}

// GET /api/v1/productos - Obtener todos los productos (PÚBLICO - sin autenticación)
// Este endpoint muestra TODOS los productos para la vista pública del catálogo
// Solo muestra productos de usuarios activos
// NO incluye usuario_telefono por seguridad
app.get(`/api/${API_VERSION}/productos`, async (req, res) => {
  // Aplicar CORS manualmente ANTES de cualquier operación para asegurar headers en errores
  const origin = req.headers.origin;
  if (origin) {
    const isAllowed = allowedOrigins.includes(origin) || 
                     allowedOrigins.includes('*') ||
                     (process.env.NODE_ENV !== 'production' && origin.includes('localhost'));
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
  }
  
  try {
    const dbPool = await getPool();
    if (!dbPool) {
      throw new Error('No se pudo obtener conexión a la base de datos');
    }
    
    // Paginación básica (límite máximo para prevenir DoS)
    const limit = Math.min(safeParseInt(req.query.limit, 100), 500); // Máximo 500 productos
    const offset = Math.max(safeParseInt(req.query.offset, 0), 0);
    
    // Filtrar productos de usuarios activos
    const result = await dbPool.query(
      `SELECT p.* FROM productos p 
       LEFT JOIN usuarios u ON p.usuario_id = u.id 
       WHERE (p.usuario_id IS NULL OR u.activo = true OR u.activo IS NULL)
       ORDER BY p.id
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    // Convertir tipos de PostgreSQL (DECIMAL viene como string) y agregar imágenes
    // NO incluir usuario_telefono en endpoint público por seguridad
    const productos = await Promise.all(result.rows.map(p => convertirProducto(p, false)));
    res.json(productos);
  } catch (error) {
    console.error('Error obteniendo productos:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack:', error.stack);
    }
    // Asegurar que CORS se aplique incluso en errores
    if (origin) {
      const isAllowed = allowedOrigins.includes(origin) || 
                       allowedOrigins.includes('*') ||
                       (process.env.NODE_ENV !== 'production' && origin.includes('localhost'));
      if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    }
    res.status(500).json({ 
      error: 'Error al obtener productos',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// GET /api/v1/productos/admin - Obtener productos del usuario actual (requiere autenticación)
// Este endpoint filtra por usuario_id para el panel de administración
app.get(`/api/${API_VERSION}/productos/admin`, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const dbPool = await getPool();
    const currentUserId = req.user.userId;
    const currentUserRol = req.user.rol;

    let query;
    let params = [];

    // Si es admin, solo ver sus productos. Si es owner, ver todos
    if (currentUserRol === 'admin') {
      query = 'SELECT * FROM productos WHERE usuario_id = $1 ORDER BY id';
      params = [currentUserId];
    } else {
      // Owner ve todos los productos (con paginación)
      const limit = Math.min(safeParseInt(req.query.limit, 100), 500);
      const offset = Math.max(safeParseInt(req.query.offset, 0), 0);
      query = 'SELECT * FROM productos ORDER BY id LIMIT $1 OFFSET $2';
      params = [limit, offset];
    }

    const result = await dbPool.query(query, params);
    // Convertir tipos de PostgreSQL (DECIMAL viene como string) y agregar imágenes
    // Incluir teléfono solo en endpoints autenticados (admin)
    const productos = await Promise.all(result.rows.map(p => convertirProducto(p, true)));
    res.json(productos);
  } catch (error) {
    console.error('Error obteniendo productos del admin:', error);
    res.status(500).json({ 
      error: 'Error al obtener productos',
      message: error.message
    });
  }
});

// GET /api/v1/productos/:id - Obtener un producto por ID (PÚBLICO)
// NO incluye usuario_telefono por seguridad
app.get(`/api/${API_VERSION}/productos/:id`, async (req, res) => {
  try {
    const dbPool = await getPool();
    const id = safeParseInt(req.params.id);
    if (id <= 0) {
      return res.status(400).json({ error: 'ID de producto inválido' });
    }
    const result = await dbPool.query('SELECT * FROM productos WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Convertir tipos de PostgreSQL - NO incluir teléfono en endpoint público
    res.json(await convertirProducto(result.rows[0], false));
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// POST /api/v1/whatsapp/generate-link - Generar enlace de WhatsApp sin exponer número (SEGURO)
app.post(`/api/${API_VERSION}/whatsapp/generate-link`, whatsappLimiter, [
  body('producto_id').isInt({ min: 1 }).withMessage('ID de producto inválido'),
  body('mensaje').optional().isLength({ max: 500 }).trim().escape()
], validateRequest, async (req, res) => {
  try {
    const { producto_id, mensaje } = req.body;
    const productoId = safeParseInt(producto_id);
    
    if (productoId <= 0) {
      return res.status(400).json({ error: 'ID de producto inválido' });
    }
    
    const dbPool = await getPool();
    
    // Obtener producto y teléfono del usuario propietario
    const productoResult = await dbPool.query(
      `SELECT p.*, u.telefono, u.activo 
       FROM productos p 
       LEFT JOIN usuarios u ON p.usuario_id = u.id 
       WHERE p.id = $1`,
      [productoId]
    );
    
    if (productoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    const producto = productoResult.rows[0];
    
    // Verificar que el usuario esté activo
    if (producto.usuario_id && producto.activo === false) {
      return res.status(403).json({ error: 'El vendedor no está disponible' });
    }
    
    const telefono = producto.telefono;
    
    if (!telefono) {
      return res.status(400).json({ error: 'El vendedor no tiene teléfono configurado' });
    }
    
    // Generar mensaje por defecto si no se proporciona
    let mensajeFinal = mensaje || '';
    if (!mensajeFinal) {
      const precio = safeParseFloat(producto.precio, 0);
      mensajeFinal = `Hola, me interesa el producto: ${producto.nombre} - $${precio.toFixed(2)}`;
    }
    
    // Generar enlace de WhatsApp sin exponer el número en la respuesta del cliente
    const encodedMessage = encodeURIComponent(mensajeFinal);
    const whatsappUrl = `https://wa.me/${telefono}?text=${encodedMessage}`;
    
    // Retornar solo el enlace, no el número
    res.json({ url: whatsappUrl });
  } catch (error) {
    console.error('Error generando enlace de WhatsApp:', error);
    res.status(500).json({ error: 'Error generando enlace de WhatsApp' });
  }
});

// POST /api/v1/upload - Subir una imagen (requiere autenticación)
app.post(`/api/${API_VERSION}/upload`, authenticateToken, requireAdmin, upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    // Validar que el archivo es realmente una imagen usando sharp
    try {
      const metadata = await sharp(req.file.path).metadata();
      if (!metadata.width || !metadata.height || !metadata.format) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'El archivo no es una imagen válida' });
      }
      
      // Validar dimensiones razonables (opcional)
      if (metadata.width > 10000 || metadata.height > 10000) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'La imagen es demasiado grande (máximo 10000x10000px)' });
      }
    } catch (sharpError) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'El archivo no es una imagen válida' });
    }

    let imagenUrl;

    // Si Cloudinary está configurado, subir ahí (producción)
    if (cloudinary) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'catalogo-productos',
        resource_type: 'image'
      });
      imagenUrl = result.secure_url;
      
      // Eliminar archivo local después de subir a Cloudinary
      fs.unlinkSync(req.file.path);
    } else {
      // Desarrollo/Producción: usar URL configurada o detectar automáticamente
      const baseUrl = process.env.API_BASE_URL || 
                     (process.env.NODE_ENV === 'production'
                       ? 'https://catalogo-productos-api.onrender.com'
                       : `http://localhost:${PORT}`);
      imagenUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    res.json({ imagen_url: imagenUrl });
  } catch (error) {
    console.error('Error subiendo imagen:', error.message);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path); // Limpiar archivo en caso de error
    }
    res.status(500).json({ error: 'Error al subir imagen' });
  }
});

// POST /api/v1/upload-multiple - Subir múltiples imágenes (requiere autenticación)
app.post(`/api/${API_VERSION}/upload-multiple`, authenticateToken, requireAdmin, upload.array('imagenes', 8), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron archivos' });
    }

    if (req.files.length > 8) {
      // Eliminar archivos subidos
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
      return res.status(400).json({ error: 'Máximo 8 imágenes por producto' });
    }

    const imagenUrls = [];
    const filesToCleanup = [];

    for (const file of req.files) {
      try {
        // Validar que el archivo es realmente una imagen usando sharp
        const metadata = await sharp(file.path).metadata();
        if (!metadata.width || !metadata.height || !metadata.format) {
          filesToCleanup.push(file.path);
          continue; // Saltar este archivo
        }
        
        // Validar dimensiones razonables
        if (metadata.width > 10000 || metadata.height > 10000) {
          filesToCleanup.push(file.path);
          continue; // Saltar este archivo
        }

        let imagenUrl;

        if (cloudinary) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'catalogo-productos',
            resource_type: 'image'
          });
          imagenUrl = result.secure_url;
          fs.unlinkSync(file.path);
        } else {
          // Desarrollo/Producción: usar URL configurada o detectar automáticamente
          const baseUrl = process.env.API_BASE_URL || 
                         (process.env.NODE_ENV === 'production'
                           ? 'https://catalogo-productos-api.onrender.com'
                           : `http://localhost:${PORT}`);
          imagenUrl = `${baseUrl}/uploads/${file.filename}`;
        }

        imagenUrls.push(imagenUrl);
      } catch (fileError) {
        // Si hay error con un archivo, limpiarlo y continuar con los demás
        filesToCleanup.push(file.path);
        console.warn(`Error procesando archivo ${file.filename}:`, fileError.message);
      }
    }

    // Limpiar archivos inválidos
    filesToCleanup.forEach(filePath => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    if (imagenUrls.length === 0) {
      return res.status(400).json({ error: 'Ninguna imagen válida fue procesada' });
    }

    res.json({ imagenes: imagenUrls });
  } catch (error) {
    console.error('Error subiendo imágenes:', error.message);
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ error: 'Error al subir imágenes' });
  }
});

// POST /api/v1/productos - Crear un nuevo producto (requiere autenticación)
app.post(`/api/${API_VERSION}/productos`, authenticateToken, requireAdmin, [
  body('nombre').trim().isLength({ min: 1, max: 200 }).escape().withMessage('El nombre es requerido y debe tener máximo 200 caracteres'),
  body('descripcion').optional().trim().isLength({ max: 2000 }).escape(),
  body('precio').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('stock').optional().isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo'),
  body('imagen_url').optional().isURL().withMessage('URL de imagen inválida'),
  body('imagenes').optional().isArray({ max: 8 }).withMessage('Máximo 8 imágenes')
], validateRequest, async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, imagen_url, imagenes } = req.body;
    const currentUserId = req.user.userId; // ID del usuario actual
    
    console.log('📥 POST /productos - Datos recibidos:', { nombre, precio, imagenes: imagenes?.length || 0 });
    
    // Insertar producto con usuario_id
    console.log('💾 Insertando producto en BD...');
    const dbPool = await getPool();
    const result = await dbPool.query(
      'INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, usuario_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        nombre.trim(), 
        descripcion ? descripcion.trim() : '', 
        safeParseFloat(precio, 0), 
        stock !== undefined ? safeParseInt(stock, 0) : 0,
        imagen_url ? imagen_url.trim() : null,
        currentUserId // Asignar usuario_id automáticamente
      ]
    );
    
    const productoId = result.rows[0].id;
    console.log(`✅ Producto creado con ID: ${productoId}`);
    
    // Insertar imágenes si se proporcionaron
    if (imagenes && Array.isArray(imagenes) && imagenes.length > 0) {
      console.log(`📸 Insertando ${imagenes.length} imágenes...`);
      for (let i = 0; i < imagenes.length && i < 8; i++) {
        try {
          await dbPool.query(
            'INSERT INTO producto_imagenes (producto_id, imagen_url, orden) VALUES ($1, $2, $3)',
            [productoId, imagenes[i], i]
          );
          console.log(`✅ Imagen ${i + 1} insertada: ${imagenes[i].substring(0, 50)}...`);
        } catch (imgError) {
          console.error(`❌ Error insertando imagen ${i + 1}:`, imgError.message);
        }
      }
    }
    
    // Convertir tipos de PostgreSQL
    const productoConvertido = await convertirProducto(result.rows[0]);
    console.log('✅ Producto creado exitosamente con ID:', productoConvertido.id);
    console.log('   Imágenes guardadas:', productoConvertido.imagenes?.length || 0);
    res.status(201).json(productoConvertido);
  } catch (error) {
    console.error('❌ Error creando producto:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('   Código:', error.code);
      console.error('   Stack trace:', error.stack);
    }
    res.status(500).json({ 
      error: 'Error al crear producto',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// PUT /api/v1/productos/:id - Actualizar un producto (requiere autenticación)
app.put(`/api/${API_VERSION}/productos/:id`, authenticateToken, requireAdmin, [
  param('id').isInt({ min: 1 }).withMessage('ID de producto inválido')
], validateRequest, async (req, res) => {
  try {
    const id = safeParseInt(req.params.id);
    if (id <= 0) {
      return res.status(400).json({ error: 'ID de producto inválido' });
    }
    const { nombre, descripcion, precio, stock, imagen_url, imagenes } = req.body;
    const currentUserId = req.user.userId;
    const currentUserRol = req.user.rol;
    
    const dbPool = await getPool();

    // Verificar que el producto existe y permisos
    const productoCheck = await dbPool.query('SELECT usuario_id FROM productos WHERE id = $1', [id]);
    if (productoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Si es admin, solo puede editar sus propios productos
    if (currentUserRol === 'admin' && productoCheck.rows[0].usuario_id !== currentUserId) {
      return res.status(403).json({ error: 'No tienes permisos para editar este producto' });
    }
    
    // Construir la consulta dinámicamente según los campos proporcionados
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (nombre !== undefined) {
      updates.push(`nombre = $${paramIndex++}`);
      values.push(nombre.trim());
    }
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramIndex++}`);
      values.push(descripcion.trim());
    }
    if (precio !== undefined) {
      updates.push(`precio = $${paramIndex++}`);
      values.push(safeParseFloat(precio, 0));
    }
    if (stock !== undefined) {
      updates.push(`stock = $${paramIndex++}`);
      values.push(safeParseInt(stock, 0));
    }
    if (imagen_url !== undefined) {
      updates.push(`imagen_url = $${paramIndex++}`);
      values.push(imagen_url ? imagen_url.trim() : null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }
    
    updates.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `UPDATE productos SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await dbPool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Actualizar imágenes si se proporcionaron
    if (imagenes !== undefined && Array.isArray(imagenes)) {
      // Eliminar imágenes existentes
      await dbPool.query('DELETE FROM producto_imagenes WHERE producto_id = $1', [id]);
      
      // Insertar nuevas imágenes
      if (imagenes.length > 0) {
        for (let i = 0; i < imagenes.length && i < 8; i++) {
          await dbPool.query(
            'INSERT INTO producto_imagenes (producto_id, imagen_url, orden) VALUES ($1, $2, $3)',
            [id, imagenes[i], i]
          );
        }
      }
    }
    
    // Convertir tipos de PostgreSQL
    res.json(await convertirProducto(result.rows[0]));
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE /api/v1/productos/:id - Eliminar un producto (requiere autenticación)
app.delete(`/api/${API_VERSION}/productos/:id`, authenticateToken, requireAdmin, [
  param('id').isInt({ min: 1 }).withMessage('ID de producto inválido')
], validateRequest, async (req, res) => {
  try {
    const dbPool = await getPool();
    const id = safeParseInt(req.params.id);
    if (id <= 0) {
      return res.status(400).json({ error: 'ID de producto inválido' });
    }
    const currentUserId = req.user.userId;
    const currentUserRol = req.user.rol;

    // Verificar que el producto existe y permisos
    const productoCheck = await dbPool.query('SELECT usuario_id FROM productos WHERE id = $1', [id]);
    if (productoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Si es admin, solo puede eliminar sus propios productos
    if (currentUserRol === 'admin' && productoCheck.rows[0].usuario_id !== currentUserId) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este producto' });
    }

    await dbPool.query('DELETE FROM productos WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// Health check para Cloud Run
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    const { getPool } = require('./database');
    const dbPool = await getPool();
    await dbPool.query('SELECT 1');
    res.status(200).json({ 
      status: 'ok', 
      service: 'catalogo-productos-api',
      version: API_VERSION,
      database: 'connected',
      message: 'API funcionando correctamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Health check - Error de conexión:', error.message);
    console.error('   Código:', error.code);
    console.error('   Detalles:', error.detail || 'N/A');
    
    res.status(503).json({ 
      status: 'error', 
      service: 'catalogo-productos-api',
      version: API_VERSION,
      database: 'disconnected',
      message: 'Error conectando a la base de datos',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Ver logs del servidor',
      code: error.code || 'UNKNOWN',
      timestamp: new Date().toISOString()
    });
  }
});

// Ruta de información del servicio
app.get('/info', (req, res) => {
  res.json({
    service: 'catalogo-productos-api',
    version: API_VERSION,
    endpoints: {
      productos: `/api/${API_VERSION}/productos`,
      health: '/health'
    }
  });
});

// Iniciar servidor
async function startServer() {
  try {
    // Verificar conexión a la base de datos
    console.log('🔌 Verificando conexión a PostgreSQL...');
    console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'No configurada');
    console.log('   DB_HOST:', process.env.DB_HOST || 'No configurado');
    
    const connected = await testConnection();
    if (!connected) {
      console.error('⚠️  No se pudo conectar a PostgreSQL. Verifica las variables de entorno.');
      console.error('   Variables requeridas: DATABASE_URL o DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
      // No hacer exit, dejar que el servidor inicie y el health check falle
    } else {
      console.log('✅ Conexión a PostgreSQL exitosa');
      // Inicializar base de datos (crear tabla si no existe)
      try {
        await initializeDatabase();
        // Crear usuario admin por defecto si no existe
        await crearUsuarioAdminPorDefecto();
      } catch (dbError) {
        console.error('⚠️  Error inicializando base de datos:', dbError.message);
        console.error('   Stack:', dbError.stack);
        console.error('   El servidor iniciará pero algunas funciones pueden no estar disponibles');
        // No hacer exit, dejar que el servidor inicie
      }
    }
    
    // Iniciar servidor HTTP (siempre iniciar, incluso si hay problemas con la BD)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 API Service corriendo en http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Endpoint productos: http://localhost:${PORT}/api/${API_VERSION}/productos`);
      console.log(`🗄️  Base de datos: PostgreSQL`);
    });
  } catch (error) {
    console.error('❌ Error crítico al iniciar el servidor:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', error.stack);
    }
    // Solo hacer exit si es un error crítico del servidor HTTP
    setTimeout(() => process.exit(1), 5000); // Dar tiempo para que los logs se envíen
  }
}

// Manejar cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando conexiones...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando conexiones...');
  await pool.end();
  process.exit(0);
});

startServer();

