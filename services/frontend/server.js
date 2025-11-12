const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
// Normalizar API_URL: remover barra final si existe
const API_URL = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');

// IMPORTANTE: La ruta '/' debe ir ANTES de express.static
// para que se ejecute primero y pueda inyectar el script
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'public', 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Inyectar API_URL en el HTML antes de </head>
  const scriptTag = `<script>window.API_URL='${API_URL}';window.API_VERSION='v1';</script>`;
  
  // Inyectar antes de </head>
  if (html.includes('</head>')) {
    html = html.replace('</head>', scriptTag + '</head>');
  } else {
    // Si no hay </head>, inyectar al inicio del body
    html = html.replace('<body>', '<body>' + scriptTag);
  }
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Servir archivos estáticos (después de la ruta '/')
app.use(express.static('public'));

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

