// Los_ALMEYDAS_Backend/routes/pedidos.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Importa el pool de conexiones a la base de datos
// CORRECCIÓN CLAVE: El nombre del archivo y la importación del middleware deben coincidir.
// Se eliminó la 's' extra en 'authenticatetsToken'
const authenticateToken = require('../middleware/authenticateToken'); // SIN la 's' extra en 'authenticateToken'
const authorizeRole = require('../middleware/authorizeRole');

// 1. GET /api/pedidos - Obtener todos los pedidos (solo para admins) o pedidos del usuario (para clientes)
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id_usuario; // ID del usuario autenticado
    const userRole = req = req.user.rol; // Rol del usuario autenticado

    let query = `
        SELECT
            p.id_pedido,
            p.id_usuario,
            u.nombre_usuario,
            p.fecha_pedido,
            p.estado,
            SUM(dp.cantidad * dp.precio_unitario) AS total_pedido
        FROM
            PEDIDOS p
        JOIN
            USUARIOS u ON p.id_usuario = u.id_usuario
        JOIN
            DETALLE_PEDIDO dp ON p.id_pedido = dp.id_pedido
    `;
    let queryParams = [];

    if (userRole === 'cliente') {
        query += ` WHERE p.id_usuario = ?`;
        queryParams.push(userId);
    }

    // Agrupar por pedido y ordenar
    query += ` GROUP BY p.id_pedido, p.id_usuario, u.nombre_usuario, p.fecha_pedido, p.estado ORDER BY p.fecha_pedido DESC`;

    try {
        const [pedidos] = await pool.execute(query, queryParams);

        // Para cada pedido, obtener sus detalles de productos
        const pedidosConDetalles = await Promise.all(pedidos.map(async (pedido) => {
            const detallesQuery = `
                SELECT
                    dp.cantidad,
                    dp.precio_unitario,
                    prod.nombre,
                    prod.url_imagen  -- Asegurarse de seleccionar la URL de la imagen para el frontend
                FROM
                    DETALLE_PEDIDO dp
                JOIN
                    PRODUCTOS prod ON dp.id_producto = prod.id_producto
                WHERE
                    dp.id_pedido = ?
            `;
            const [productos] = await pool.execute(detallesQuery, [pedido.id_pedido]);
            return { ...pedido, productos };
        }));

        res.json(pedidosConDetalles);
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener pedidos.', error: error.message });
    }
});

// 2. PUT /api/pedidos/:id - Actualizar el estado de un pedido (solo para admins)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar el estado
    const estadosValidos = ['Pendiente', 'Confirmado', 'Enviado', 'Entregado', 'Cancelado'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ message: 'Estado de pedido no válido.' });
    }

    try {
        const updateQuery = `UPDATE PEDIDOS SET estado = ? WHERE id_pedido = ?`;
        const [result] = await pool.execute(updateQuery, [estado, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado.' });
        }
        res.json({ message: 'Estado del pedido actualizado con éxito.', id_pedido: id, nuevo_estado: estado });
    } catch (error) {
        console.error('Error al actualizar el estado del pedido:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el estado del pedido.', error: error.message });
    }
});

// 3. POST /api/pedidos - Crear un nuevo pedido (para clientes)
router.post('/', authenticateToken, authorizeRole('cliente'), async (req, res) => {
    const userId = req.user.id_usuario; // ID del usuario que realiza el pedido
    const { items } = req.body; // Array de { id_producto, cantidad }

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'El pedido debe contener al menos un producto.' });
    }

    let connection_pedido; // Usaremos una variable para la conexión dentro de la transacción

    try {
        connection_pedido = await pool.getConnection(); // Obtener una conexión de la pool
        await connection_pedido.beginTransaction(); // Iniciar la transacción

        // 1. Crear el nuevo pedido en la tabla PEDIDOS (sin columna 'total' en el INSERT)
        const insertPedidoQuery = `INSERT INTO PEDIDOS (id_usuario, fecha_pedido, estado) VALUES (?, NOW(), 'Pendiente')`;
        const [pedidoResult] = await connection_pedido.execute(insertPedidoQuery, [userId]);
        const id_pedido = pedidoResult.insertId;

        // 2. Insertar los productos en DETALLE_PEDIDO y actualizar el stock
        for (const item of items) {
            const { id_producto, cantidad } = item;

            // Obtener precio y stock actual del producto
            const [productRows] = await connection_pedido.execute('SELECT precio, stock FROM PRODUCTOS WHERE id_producto = ?', [id_producto]);

            if (productRows.length === 0) {
                await connection_pedido.rollback();
                return res.status(404).json({ message: `Producto con ID ${id_producto} no encontrado.` });
            }

            const { precio, stock } = productRows[0];

            if (stock < cantidad) {
                await connection_pedido.rollback();
                return res.status(400).json({ message: `Stock insuficiente para el producto con ID ${id_producto}. Stock disponible: ${stock}, solicitado: ${cantidad}.` });
            }

            // Insertar en DETALLE_PEDIDO (corregido a DETALLE_PEDIDO, no DETALLES_PEDIDO)
            const insertDetalleQuery = `INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`;
            await connection_pedido.execute(insertDetalleQuery, [id_pedido, id_producto, cantidad, precio]);

            // Actualizar stock del producto
            const updateStockQuery = `UPDATE PRODUCTOS SET stock = stock - ? WHERE id_producto = ?`;
            await connection_pedido.execute(updateStockQuery, [cantidad, id_producto]);
        }

        await connection_pedido.commit(); // Confirmar la transacción
        res.status(201).json({ message: 'Pedido creado con éxito.', id_pedido });

    } catch (error) {
        if (connection_pedido) {
            await connection_pedido.rollback(); // Deshacer la transacción en caso de error
        }
        console.error('Error al crear el pedido:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el pedido.', error: error.message });
    } finally {
        if (connection_pedido) {
            connection_pedido.release(); // Liberar la conexión
        }
    }
});

module.exports = router;
