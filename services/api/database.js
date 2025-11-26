const { Pool } = require('pg');

// Configuración de la conexión a PostgreSQL
// Render proporciona DATABASE_URL automáticamente, si está disponible la usamos
// Si no, usamos las variables individuales (para desarrollo local)

// Función para parsear DATABASE_URL y extraer componentes (para forzar IPv4)
function parseDatabaseUrl(url) {
  if (!url) return null;
  try {
    // Formato: postgresql://user:password@host:port/database?sslmode=require
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?/);
    if (match) {
      return {
        host: match[3],
        port: parseInt(match[4]),
        database: match[5],
        user: match[1],
        password: match[2],
        ssl: {
          rejectUnauthorized: false // Necesario para Supabase
        },
        // No forzar IPv4 en Render (puede causar problemas)
        // family: 4, // Solo para Docker local
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000, // 10 segundos para Supabase
      };
    }
  } catch (error) {
    console.error('Error parseando DATABASE_URL:', error.message);
  }
  return null;
}

// Configurar pool de conexiones
let poolConfig;
if (process.env.DATABASE_URL) {
  // Para Supabase, es mejor usar connectionString directo
  // ya que maneja automáticamente SSL y otros parámetros
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Necesario para Supabase
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000, // 15 segundos para Supabase (puede ser lento)
  };
  
  // Log de configuración (sin mostrar password)
  const urlParts = process.env.DATABASE_URL.split('@');
  const hostPart = urlParts[1] ? urlParts[1].split('/')[0] : 'N/A';
  console.log('📝 Configurando conexión con DATABASE_URL');
  console.log('   Host:', hostPart);
  console.log('   SSL: habilitado (rejectUnauthorized: false)');
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'catalogo_productos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
  console.log('📝 Usando configuración de variables individuales');
}

const pool = new Pool(poolConfig);

// Función para verificar la conexión
async function testConnection() {
  try {
    // Log de configuración (sin mostrar password completo)
    if (process.env.DATABASE_URL) {
      const urlParts = process.env.DATABASE_URL.split('@');
      const hostPart = urlParts[1] ? urlParts[1].split('/')[0] : 'N/A';
      console.log('🔌 Intentando conectar con DATABASE_URL');
      console.log('   Host:', hostPart);
      console.log('   URL completa configurada:', process.env.DATABASE_URL ? 'Sí' : 'No');
    } else {
      console.log('🔌 Intentando conectar con variables individuales');
      console.log('   Host:', process.env.DB_HOST || 'localhost');
      console.log('   Port:', process.env.DB_PORT || 5432);
      console.log('   Database:', process.env.DB_NAME || 'catalogo_productos');
      console.log('   User:', process.env.DB_USER || 'postgres');
    }
    
    const result = await pool.query('SELECT NOW()');
    const connectionInfo = process.env.DATABASE_URL 
      ? `DATABASE_URL (${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'N/A'})`
      : `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'catalogo_productos'}`;
    console.log('✅ Conexión a PostgreSQL exitosa');
    console.log('   Conexión:', connectionInfo);
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
    console.error('   Código:', error.code);
    console.error('   Detalles:', error.detail || 'N/A');
    if (error.stack) {
      console.error('   Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
    }
    console.error('   DATABASE_URL configurada:', process.env.DATABASE_URL ? 'Sí' : 'No');
    if (process.env.DATABASE_URL) {
      const urlParts = process.env.DATABASE_URL.split('@');
      const hostPart = urlParts[1] ? urlParts[1].split('/')[0] : 'N/A';
      console.error('   Host en DATABASE_URL:', hostPart);
    } else {
      console.error('   DB_HOST:', process.env.DB_HOST || 'No configurado');
      console.error('   DB_PORT:', process.env.DB_PORT || 'No configurado');
      console.error('   DB_NAME:', process.env.DB_NAME || 'No configurado');
      console.error('   DB_USER:', process.env.DB_USER || 'No configurado');
    }
    return false;
  }
}

// Función para inicializar la base de datos (crear tabla si no existe)
async function initializeDatabase() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10, 2) NOT NULL,
        stock INTEGER DEFAULT 0,
        imagen_url VARCHAR(500),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ Tabla productos creada/verificada');
    
    // Crear tabla para múltiples imágenes por producto
    try {
      const createImagenesTableQuery = `
        CREATE TABLE IF NOT EXISTS producto_imagenes (
          id SERIAL PRIMARY KEY,
          producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
          imagen_url VARCHAR(500) NOT NULL,
          orden INTEGER DEFAULT 0,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      await pool.query(createImagenesTableQuery);
      console.log('✅ Tabla producto_imagenes creada/verificada');
      
      // Crear índices por separado (puede fallar si ya existen)
      try {
        await pool.query('CREATE INDEX IF NOT EXISTS idx_producto_imagenes_producto_id ON producto_imagenes(producto_id);');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_producto_imagenes_orden ON producto_imagenes(producto_id, orden);');
      } catch (indexError) {
        // Los índices pueden fallar si ya existen, no es crítico
        console.log('⚠️  Algunos índices ya existen o no se pudieron crear (no crítico)');
      }
    } catch (error) {
      console.error('⚠️  Error creando tabla producto_imagenes:', error.message);
      // No lanzar error, continuar con la inicialización
    }
    
    // Agregar columna imagen_url si no existe (para compatibilidad con versiones anteriores)
    try {
      await pool.query(`
        ALTER TABLE productos 
        ADD COLUMN IF NOT EXISTS imagen_url VARCHAR(500);
      `);
    } catch (error) {
      // La columna ya existe o hay otro error, continuar
      console.log('Columna imagen_url ya existe o no se pudo agregar');
    }
    
    // Crear tabla de usuarios para autenticación
    try {
      const createUsuariosTableQuery = `
        CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          nombre VARCHAR(100),
          rol VARCHAR(20) DEFAULT 'admin',
          activo BOOLEAN DEFAULT true,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      await pool.query(createUsuariosTableQuery);
      console.log('✅ Tabla usuarios creada/verificada');
      
      // Crear índice para email
      try {
        await pool.query('CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);');
      } catch (indexError) {
        console.log('⚠️  Índice de usuarios ya existe');
      }
    } catch (error) {
      console.error('⚠️  Error creando tabla usuarios:', error.message);
    }
    
    // Insertar productos de ejemplo si la tabla está vacía
    const countResult = await pool.query('SELECT COUNT(*) FROM productos');
    if (parseInt(countResult.rows[0].count) === 0) {
      const insertQuery = `
        INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url) VALUES
        ('Producto 1', 'Descripción del producto 1', 100.50, 10, 'https://via.placeholder.com/300x300?text=Producto+1'),
        ('Producto 2', 'Descripción del producto 2', 250.75, 5, 'https://via.placeholder.com/300x300?text=Producto+2'),
        ('Producto 3', 'Descripción del producto 3', 50.00, 20, 'https://via.placeholder.com/300x300?text=Producto+3');
      `;
      await pool.query(insertQuery);
      console.log('✅ Productos de ejemplo insertados');
    }
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};

