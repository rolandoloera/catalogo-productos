const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Base de datos en memoria (simulada)
let productos = [
  { id: 1, nombre: 'Producto 1', descripcion: 'Descripción del producto 1', precio: 100.50, stock: 10 },
  { id: 2, nombre: 'Producto 2', descripcion: 'Descripción del producto 2', precio: 250.75, stock: 5 },
  { id: 3, nombre: 'Producto 3', descripcion: 'Descripción del producto 3', precio: 50.00, stock: 20 }
];

let nextId = 4;

// Rutas API

// GET /api/productos - Obtener todos los productos
app.get('/api/productos', (req, res) => {
  res.json(productos);
});

// GET /api/productos/:id - Obtener un producto por ID
app.get('/api/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const producto = productos.find(p => p.id === id);
  
  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  
  res.json(producto);
});

// POST /api/productos - Crear un nuevo producto
app.post('/api/productos', (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  
  if (!nombre || precio === undefined) {
    return res.status(400).json({ error: 'Nombre y precio son requeridos' });
  }
  
  const nuevoProducto = {
    id: nextId++,
    nombre: nombre.trim(),
    descripcion: descripcion ? descripcion.trim() : '',
    precio: parseFloat(precio),
    stock: stock !== undefined ? parseInt(stock) : 0
  };
  
  productos.push(nuevoProducto);
  res.status(201).json(nuevoProducto);
});

// PUT /api/productos/:id - Actualizar un producto
app.put('/api/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const productoIndex = productos.findIndex(p => p.id === id);
  
  if (productoIndex === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  
  const { nombre, descripcion, precio, stock } = req.body;
  
  if (nombre !== undefined) {
    productos[productoIndex].nombre = nombre.trim();
  }
  if (descripcion !== undefined) {
    productos[productoIndex].descripcion = descripcion.trim();
  }
  if (precio !== undefined) {
    productos[productoIndex].precio = parseFloat(precio);
  }
  if (stock !== undefined) {
    productos[productoIndex].stock = parseInt(stock);
  }
  
  res.json(productos[productoIndex]);
});

// DELETE /api/productos/:id - Eliminar un producto
app.delete('/api/productos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const productoIndex = productos.findIndex(p => p.id === id);
  
  if (productoIndex === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  
  productos.splice(productoIndex, 1);
  res.status(204).send();
});

// Ruta principal - servir el HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check para Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servicio funcionando correctamente' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Health check disponible en http://localhost:${PORT}/health`);
});

