// Cargar variables de entorno desde .env (solo en desarrollo local)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { pool, getPool, testConnection, initializeDatabase } = require('./database');
const { login, verifyToken, authenticateToken, requireAdmin, requireOwner, requireOwnerOrSelf, crearUsuarioAdminPorDefecto } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;
const API_VERSION = process.env.API_VERSION || 'v1';

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

// Middleware
app.use(cors()); // Permitir CORS para que el frontend pueda consumir la API
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(uploadDir));

// ========== RUTAS DE AUTENTICACIÓN ==========

// POST /api/v1/auth/login - Login de administrador
app.post(`/api/${API_VERSION}/auth/login`, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    
    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    console.error('Error en login:', error);
    res.status(401).json({ error: error.message || 'Credenciales inválidas' });
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
app.post(`/api/${API_VERSION}/usuarios`, authenticateToken, requireOwner, async (req, res) => {
  try {
    const { email, password, nombre, telefono } = req.body;

    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
    }

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
app.delete(`/api/${API_VERSION}/usuarios/:id`, authenticateToken, requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;

    // No permitir eliminar al usuario actual
    if (parseInt(id) === currentUserId) {
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

// Función helper para convertir tipos de PostgreSQL a JavaScript
async function convertirProducto(producto) {
  try {
    // PostgreSQL devuelve DECIMAL como string, necesitamos convertirlo explícitamente
    const precio = typeof producto.precio === 'string' 
      ? parseFloat(producto.precio) 
      : Number(producto.precio);
    
    // Obtener todas las imágenes del producto (con manejo de errores)
    let imagenes = [];
    try {
      const dbPool = await getPool();
      const imagenesResult = await dbPool.query(
        'SELECT imagen_url, orden FROM producto_imagenes WHERE producto_id = $1 ORDER BY orden, id',
        [producto.id]
      );
      imagenes = imagenesResult.rows.map(row => row.imagen_url);
    } catch (imgError) {
      // Si la tabla no existe o hay error, usar array vacío
      console.warn(`⚠️  Error obteniendo imágenes para producto ${producto.id}:`, imgError.message);
      imagenes = [];
    }

    // Obtener teléfono y nombre del usuario propietario
    let usuarioTelefono = null;
    let usuarioNombre = null;
    if (producto.usuario_id) {
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
    }
    
    return {
      id: parseInt(producto.id),
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: precio,
      stock: parseInt(producto.stock) || 0,
      imagen_url: producto.imagen_url || null, // Mantener para compatibilidad
      imagenes: imagenes, // Array de imágenes
      usuario_id: producto.usuario_id ? parseInt(producto.usuario_id) : undefined,
      usuario_telefono: usuarioTelefono,
      usuario_nombre: usuarioNombre,
      fecha_creacion: producto.fecha_creacion,
      fecha_actualizacion: producto.fecha_actualizacion
    };
  } catch (error) {
    console.error('Error en convertirProducto:', error);
    // Retornar producto básico sin imágenes si hay error
    return {
      id: parseInt(producto.id),
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: typeof producto.precio === 'string' ? parseFloat(producto.precio) : Number(producto.precio) || 0,
      stock: parseInt(producto.stock) || 0,
      imagen_url: producto.imagen_url || null,
      imagenes: [],
      usuario_id: producto.usuario_id ? parseInt(producto.usuario_id) : undefined,
      usuario_telefono: null,
      usuario_nombre: null,
      fecha_creacion: producto.fecha_creacion,
      fecha_actualizacion: producto.fecha_actualizacion
    };
  }
}

// GET /api/v1/productos - Obtener todos los productos (PÚBLICO - sin autenticación)
// Este endpoint muestra TODOS los productos para la vista pública del catálogo
// Solo muestra productos de usuarios activos
app.get(`/api/${API_VERSION}/productos`, async (req, res) => {
  try {
    const dbPool = await getPool();
    // Filtrar productos de usuarios activos
    const result = await dbPool.query(
      `SELECT p.* FROM productos p 
       LEFT JOIN usuarios u ON p.usuario_id = u.id 
       WHERE (p.usuario_id IS NULL OR u.activo = true OR u.activo IS NULL)
       ORDER BY p.id`
    );
    // Convertir tipos de PostgreSQL (DECIMAL viene como string) y agregar imágenes
    const productos = await Promise.all(result.rows.map(convertirProducto));
    res.json(productos);
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al obtener productos',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
      // Owner ve todos los productos
      query = 'SELECT * FROM productos ORDER BY id';
    }

    const result = await dbPool.query(query, params);
    // Convertir tipos de PostgreSQL (DECIMAL viene como string) y agregar imágenes
    const productos = await Promise.all(result.rows.map(convertirProducto));
    res.json(productos);
  } catch (error) {
    console.error('Error obteniendo productos del admin:', error);
    res.status(500).json({ 
      error: 'Error al obtener productos',
      message: error.message
    });
  }
});

// GET /api/v1/productos/:id - Obtener un producto por ID
app.get(`/api/${API_VERSION}/productos/:id`, async (req, res) => {
  try {
    const dbPool = await getPool();
    const id = parseInt(req.params.id);
    const result = await dbPool.query('SELECT * FROM productos WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Convertir tipos de PostgreSQL
    res.json(await convertirProducto(result.rows[0]));
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// POST /api/v1/upload - Subir una imagen (requiere autenticación)
app.post(`/api/${API_VERSION}/upload`, authenticateToken, requireAdmin, upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
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
      // Desarrollo: usar URL local
      const baseUrl = process.env.API_BASE_URL || `http://localhost:${PORT}`;
      imagenUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    res.json({ imagen_url: imagenUrl });
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    if (req.file) {
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
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(400).json({ error: 'Máximo 8 imágenes por producto' });
    }

    const imagenUrls = [];

    for (const file of req.files) {
      let imagenUrl;

      if (cloudinary) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'catalogo-productos',
          resource_type: 'image'
        });
        imagenUrl = result.secure_url;
        fs.unlinkSync(file.path);
      } else {
        const baseUrl = process.env.API_BASE_URL || `http://localhost:${PORT}`;
        imagenUrl = `${baseUrl}/uploads/${file.filename}`;
      }

      imagenUrls.push(imagenUrl);
    }

    res.json({ imagenes: imagenUrls });
  } catch (error) {
    console.error('Error subiendo imágenes:', error);
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
app.post(`/api/${API_VERSION}/productos`, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, imagen_url, imagenes } = req.body;
    const currentUserId = req.user.userId; // ID del usuario actual
    
    console.log('📥 POST /productos - Datos recibidos:', { nombre, precio, imagenes: imagenes?.length || 0 });
    
    if (!nombre || precio === undefined) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }
    
    // Insertar producto con usuario_id
    console.log('💾 Insertando producto en BD...');
    const dbPool = await getPool();
    const result = await dbPool.query(
      'INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, usuario_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        nombre.trim(), 
        descripcion ? descripcion.trim() : '', 
        parseFloat(precio), 
        stock !== undefined ? parseInt(stock) : 0,
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
    console.error('❌ Error creando producto:', error);
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    console.error('   Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Error al crear producto', 
      details: error.message,
      code: error.code
    });
  }
});

// PUT /api/v1/productos/:id - Actualizar un producto (requiere autenticación)
app.put(`/api/${API_VERSION}/productos/:id`, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
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
      values.push(parseFloat(precio));
    }
    if (stock !== undefined) {
      updates.push(`stock = $${paramIndex++}`);
      values.push(parseInt(stock));
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
app.delete(`/api/${API_VERSION}/productos/:id`, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const dbPool = await getPool();
    const id = parseInt(req.params.id);
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
    console.error('❌ Error crítico al iniciar el servidor:', error);
    console.error('Stack trace:', error.stack);
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

