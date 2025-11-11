-- Script de inicialización de la base de datos
-- Ejecutar este script para crear la tabla de productos

CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, stock) VALUES
('Producto 1', 'Descripción del producto 1', 100.50, 10),
('Producto 2', 'Descripción del producto 2', 250.75, 5),
('Producto 3', 'Descripción del producto 3', 50.00, 20)
ON CONFLICT DO NOTHING;

-- Crear índice para búsquedas por nombre
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);

