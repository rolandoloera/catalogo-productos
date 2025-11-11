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
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ Tabla productos creada/verificada');
    
    // Insertar productos de ejemplo si la tabla está vacía
    const countResult = await pool.query('SELECT COUNT(*) FROM productos');
    if (parseInt(countResult.rows[0].count) === 0) {
      const insertQuery = `
        INSERT INTO productos (nombre, descripcion, precio, stock) VALUES
        ('Producto 1', 'Descripción del producto 1', 100.50, 10),
        ('Producto 2', 'Descripción del producto 2', 250.75, 5),
        ('Producto 3', 'Descripción del producto 3', 50.00, 20);
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

