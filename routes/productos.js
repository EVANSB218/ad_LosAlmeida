// routes/productos.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Importa la conexión a la base de datos
const { verifyToken } = require('./usuarios'); // Importa el middleware de verificación de token

// Middleware para verificar si el usuario es administrador
const isAdmin = (req, res, next) => {
    if (req.userRol !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    next();
};

// Ruta para obtener todos los productos
router.get('/', async (req, res) => {
    try {
        // Unir con la tabla CATEGORIAS para obtener el nombre de la categoría
        const query = `
            SELECT
                p.id_producto,
                p.nombre,
                p.descripcion,
                p.precio,
                p.stock,
                p.imagen_url, -- Añadida la columna de URL de imagen
                c.nombre_categoria AS categoria_nombre,
                p.fecha_creacion
            FROM
                PRODUCTOS p
            JOIN
                CATEGORIAS c ON p.id_categoria = c.id_categoria
            ORDER BY p.nombre ASC;
        `;
        const [products] = await db.query(query);
        res.status(200).json(products);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ message: 'Error al obtener productos.', error: error.message });
    }
});

// Ruta para obtener un producto por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT
                p.id_producto,
                p.nombre,
                p.descripcion,
                p.precio,
                p.stock,
                p.imagen_url, -- Añadida la columna de URL de imagen
                c.nombre_categoria AS categoria_nombre,
                p.fecha_creacion
            FROM
                PRODUCTOS p
            JOIN
                CATEGORIAS c ON p.id_categoria = c.id_categoria
            WHERE p.id_producto = ?;
        `;
        const [product] = await db.query(query, [id]);
        if (product.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.status(200).json(product[0]);
    } catch (error) {
        console.error('Error al obtener producto por ID:', error);
        res.status(500).json({ message: 'Error al obtener producto.', error: error.message });
    }
});

// Ruta para crear un nuevo producto (solo para administradores)
router.post('/', verifyToken, isAdmin, async (req, res) => {
    const { nombre, descripcion, precio, stock, id_categoria, imagen_url } = req.body; // Añadido imagen_url

    if (!nombre || !precio || !stock || !id_categoria) {
        return res.status(400).json({ message: 'Nombre, precio, stock y categoría son obligatorios.' });
    }

    try {
        const query = 'INSERT INTO PRODUCTOS (nombre, descripcion, precio, stock, id_categoria, imagen_url) VALUES (?, ?, ?, ?, ?, ?)'; // Añadido imagen_url
        const [result] = await db.query(query, [nombre, descripcion, precio, stock, id_categoria, imagen_url || null]); // imagen_url puede ser null
        res.status(201).json({ message: 'Producto registrado exitosamente.', id_producto: result.insertId });
    } catch (error) {
        console.error('Error al registrar producto:', error);
        res.status(500).json({ message: 'Error al registrar el producto.', error: error.message });
    }
});

// Ruta para actualizar un producto existente (solo para administradores)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, id_categoria, imagen_url } = req.body; // Añadido imagen_url

    if (!nombre || !precio || !stock || !id_categoria) {
        return res.status(400).json({ message: 'Nombre, precio, stock y categoría son obligatorios.' });
    }

    try {
        const query = 'UPDATE PRODUCTOS SET nombre = ?, descripcion = ?, precio = ?, stock = ?, id_categoria = ?, imagen_url = ? WHERE id_producto = ?'; // Añadido imagen_url
        const [result] = await db.query(query, [nombre, descripcion, precio, stock, id_categoria, imagen_url || null, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado para actualizar.' });
        }
        res.status(200).json({ message: 'Producto actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ message: 'Error al actualizar el producto.', error: error.message });
    }
});

// Ruta para eliminar un producto (solo para administradores)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const query = 'DELETE FROM PRODUCTOS WHERE id_producto = ?';
        const [result] = await db.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Producto eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ message: 'Error al eliminar el producto.', error: error.message });
    }
});

module.exports = router;
