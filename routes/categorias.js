// routes/categorias.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Importa la conexión a la base de datos

// Ruta para obtener todas las categorías
router.get('/', async (req, res) => {
    try {
        const [categories] = await db.query('SELECT id_categoria, nombre_categoria FROM CATEGORIAS ORDER BY nombre_categoria ASC');
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ message: 'Error al obtener categorías.', error: error.message });
    }
});

module.exports = router;
