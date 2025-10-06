// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();
require('dotenv').config();

// Importa las rutas de la API
const productosRoutes = require('./routes/productos');
const usuariosRoutes = require('./routes/usuarios');
const pedidosRoutes = require('./routes/pedidos');
const categoriasRoutes = require('./routes/categorias');

// Configura los middlewares
app.use(cors());
app.use(bodyParser.json());

// =====================================================================================
// RUTAS DE LA API (DEBEN IR ANTES DE SERVIR ARCHIVOS ESTÁTICOS)
// =====================================================================================
app.use('/api/productos', productosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/categorias', categoriasRoutes);

// =====================================================================================
// SIRVE ARCHIVOS ESTÁTICOS (CSS, JS, HTML, imágenes, etc.)
// =====================================================================================
app.use(express.static(path.join(__dirname, 'public')));

// =====================================================================================
// RUTA PARA SERVIR index.html POR DEFECTO (CUANDO EL USUARIO VISITA LA RAÍZ '/')
// =====================================================================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =====================================================================================
// INICIA EL SERVIDOR
// =====================================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));

