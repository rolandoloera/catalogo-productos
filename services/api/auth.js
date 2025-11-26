const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-super-seguro-cambiar-en-produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Crear usuario administrador por defecto (solo si no existe)
 */
async function crearUsuarioAdminPorDefecto() {
  try {
    const dbPool = await getPool();
    // Verificar si ya existe un admin
    const result = await dbPool.query('SELECT COUNT(*) FROM usuarios WHERE rol = $1', ['admin']);
    if (parseInt(result.rows[0].count) > 0) {
      return; // Ya existe un admin
    }

    // Crear usuario admin por defecto
    const email = process.env.ADMIN_EMAIL || 'admin@catalogo.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const nombre = process.env.ADMIN_NOMBRE || 'Administrador';

    const passwordHash = await bcrypt.hash(password, 10);

    await dbPool.query(
      'INSERT INTO usuarios (email, password_hash, nombre, rol, activo) VALUES ($1, $2, $3, $4, $5)',
      [email, passwordHash, nombre, 'admin', true]
    );

    console.log('✅ Usuario administrador creado:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('   ⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
  } catch (error) {
    console.error('⚠️  Error creando usuario admin:', error.message);
  }
}

/**
 * Login de usuario
 */
async function login(email, password) {
  try {
    const dbPool = await getPool();
    // Buscar usuario
    const result = await dbPool.query(
      'SELECT id, email, password_hash, nombre, rol, activo FROM usuarios WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      throw new Error('Credenciales inválidas');
    }

    const usuario = result.rows[0];

    // Verificar si está activo
    if (!usuario.activo) {
      throw new Error('Cuenta desactivada');
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      throw new Error('Credenciales inválidas');
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: usuario.id,
        email: usuario.email,
        rol: usuario.rol
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Verificar token JWT
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
}

/**
 * Middleware de autenticación para Express
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Middleware para verificar rol de administrador
 */
function requireAdmin(req, res, next) {
  if (req.user && req.user.rol === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }
}

module.exports = {
  crearUsuarioAdminPorDefecto,
  login,
  verifyToken,
  authenticateToken,
  requireAdmin
};

