const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:3001';

// Servir archivos estáticos
app.use(express.static('public'));

// Inyectar la URL de la API en el HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check para Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'catalogo-productos-frontend',
    message: 'Frontend funcionando correctamente',
    apiUrl: API_URL,
    timestamp: new Date().toISOString()
  });
});

// Ruta de información del servicio
app.get('/info', (req, res) => {
  res.json({
    service: 'catalogo-productos-frontend',
    apiUrl: API_URL,
    endpoints: {
      home: '/',
      health: '/health'
    }
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Frontend Service corriendo en http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API URL configurada: ${API_URL}`);
});

