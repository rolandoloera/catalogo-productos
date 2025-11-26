const { Pool } = require('pg');
const dns = require('dns').promises;

// Configuración de la conexión a PostgreSQL
// Render proporciona DATABASE_URL automáticamente, si está disponible la usamos
// Si no, usamos las variables individuales (para desarrollo local)

// Función para resolver hostname a IPv4
async function resolveToIPv4(hostname) {
  try {
    const addresses = await dns.lookup(hostname, { family: 4, all: false });
    if (addresses && addresses.address) {
      console.log(`   ✅ DNS resuelto a IPv4: ${addresses.address}`);
      return addresses.address;
    }
  } catch (error) {
    console.warn(`   ⚠️  No se pudo resolver a IPv4 (${hostname}), intentando con hostname original: ${error.message}`);
  }
  return hostname; // Fallback al hostname original
}

// Función para parsear DATABASE_URL y extraer componentes (para forzar IPv4)
async function parseDatabaseUrl(url) {
  if (!url) return null;
  try {
    // Formato: postgresql://user:password@host:port/database?sslmode=require
    const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?/);
    if (match) {
      const hostname = match[3];
      // Resolver hostname a IPv4 explícitamente
      const ipv4Address = await resolveToIPv4(hostname);
      
      return {
        host: ipv4Address, // Usar dirección IPv4 en lugar del hostname
        port: parseInt(match[4]),
        database: match[5],
        user: match[1],
        password: match[2],
        ssl: {
          rejectUnauthorized: false // Necesario para Supabase
        },
        // Forzar IPv4 para evitar problemas con IPv6 en Render
        family: 4,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000, // 15 segundos para Supabase
      };
    }
  } catch (error) {
    console.error('Error parseando DATABASE_URL:', error.message);
  }
  return null;
}

// Configurar pool de conexiones (async porque necesitamos resolver DNS)
let pool;
let poolInitialized = false;

async function initializePool() {
  if (poolInitialized) {
    return pool;
  }
  
  let poolConfig;
  if (process.env.DATABASE_URL) {
    // Parsear URL y resolver a IPv4 (necesario para Render con Supabase)
    const parsed = await parseDatabaseUrl(process.env.DATABASE_URL);
    if (parsed) {
      poolConfig = parsed;
      console.log('📝 Configurando conexión con DATABASE_URL (parseada, IPv4 resuelto)');
      console.log('   Host (IPv4):', parsed.host);
      console.log('   Port:', parsed.port);
      console.log('   Database:', parsed.database);
      console.log('   SSL: habilitado (rejectUnauthorized: false)');
      console.log('   IPv4: forzado (family: 4)');
    } else {
      // Fallback a connectionString directo (sin forzar IPv4)
      poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false // Necesario para Supabase
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000, // 15 segundos para Supabase
      };
      console.log('📝 Configurando conexión con DATABASE_URL (connectionString directo)');
      console.log('   ⚠️  No se pudo parsear URL, usando connectionString (puede fallar con IPv6)');
    }
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
  
  pool = new Pool(poolConfig);
  poolInitialized = true;
  return pool;
}

// Inicializar pool inmediatamente (no bloqueante)
initializePool().catch(error => {
  console.error('❌ Error inicializando pool de conexiones:', error);
});

// Función para obtener el pool (espera a que se inicialice si es necesario)
async function getPool() {
  if (!poolInitialized) {
    await initializePool();
  }
  return pool;
}

// Función para verificar la conexión
async function testConnection() {
  try {
    const dbPool = await getPool();
    
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
    
    const result = await dbPool.query('SELECT NOW()');
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
    const dbPool = await getPool();
    
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
    
    await dbPool.query(createTableQuery);
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
      
      await dbPool.query(createImagenesTableQuery);
      console.log('✅ Tabla producto_imagenes creada/verificada');
      
      // Crear índices por separado (puede fallar si ya existen)
      try {
        await dbPool.query('CREATE INDEX IF NOT EXISTS idx_producto_imagenes_producto_id ON producto_imagenes(producto_id);');
        await dbPool.query('CREATE INDEX IF NOT EXISTS idx_producto_imagenes_orden ON producto_imagenes(producto_id, orden);');
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
      await dbPool.query(`
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
      
      await dbPool.query(createUsuariosTableQuery);
      console.log('✅ Tabla usuarios creada/verificada');
      
      // Crear índice para email
      try {
        await dbPool.query('CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);');
      } catch (indexError) {
        console.log('⚠️  Índice idx_usuarios_email ya existe o no se pudo crear (no crítico)');
      }
    } catch (error) {
      console.error('⚠️  Error creando tabla usuarios:', error.message);
      // No lanzar error, continuar con la inicialización
    }
    
    // Insertar productos de ejemplo solo si la tabla está vacía
    const countResult = await dbPool.query('SELECT COUNT(*) FROM productos');
    if (parseInt(countResult.rows[0].count) === 0) {
      const insertQuery = `
        INSERT INTO productos (nombre, descripcion, precio, stock) VALUES
        ('Producto Ejemplo 1', 'Descripción del producto ejemplo 1', 99.99, 10),
        ('Producto Ejemplo 2', 'Descripción del producto ejemplo 2', 149.99, 5);
      `;
      await dbPool.query(insertQuery);
      console.log('✅ Productos de ejemplo insertados');
    }
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    throw error;
  }
}

module.exports = {
  get pool() {
    // Getter síncrono para compatibilidad (puede fallar si no está inicializado)
    if (!poolInitialized) {
      throw new Error('Pool no inicializado. Usa getPool() o espera a que se inicialice.');
    }
    return pool;
  },
  getPool,
  testConnection,
  initializeDatabase
};
