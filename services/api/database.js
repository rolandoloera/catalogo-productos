const { Pool } = require('pg');

// Configuración de la conexión a PostgreSQL
// Render proporciona DATABASE_URL automáticamente, si está disponible la usamos
// Si no, usamos las variables individuales (para desarrollo local)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false // Necesario para Render PostgreSQL
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'catalogo_productos',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

// Función para verificar la conexión
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message);
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

