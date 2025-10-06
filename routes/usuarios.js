// routes/usuarios.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Importa la conexión a la base de datos
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware para verificar el token JWT (protege rutas)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userRol = decoded.rol;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Token inválido.' });
    }
};

// Ruta para registrar un nuevo usuario
router.post('/register', async (req, res) => { // Agregado async
    const { nombre_usuario, email, contrasena, rol } = req.body;

    if (!nombre_usuario || !email || !contrasena) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(contrasena, 10); // Usado await
        // Insertar en las columnas correctas de la tabla USUARIOS
        const query = 'INSERT INTO USUARIOS (nombre_usuario, email, contrasena, rol) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(query, [nombre_usuario, email, hashedPassword, rol || 'cliente']); // Usado await y desestructuración

        res.status(201).json({ message: 'Usuario registrado exitosamente.', userId: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El correo ya está registrado.' });
        }
        console.error('Error al registrar el usuario en la DB:', err);
        res.status(500).json({ message: 'Error al registrar el usuario.', error: err.message });
    }
});

// Ruta para iniciar sesión (login)
router.post('/login', async (req, res) => { // Agregado async
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
        return res.status(400).json({ message: 'Correo y contraseña son obligatorios.' });
    }

    try {
        const query = 'SELECT id_usuario, nombre_usuario, email, contrasena, rol FROM USUARIOS WHERE email = ?';
        const [results] = await db.query(query, [email]); // Usado await y desestructuración

        if (results.length === 0) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        const user = results[0];

        const isMatch = await bcrypt.compare(contrasena, user.contrasena); // Usado await
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas.' });
        }

        const token = jwt.sign(
            { userId: user.id_usuario, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token,
            user: {
                id_usuario: user.id_usuario,
                nombre_usuario: user.nombre_usuario,
                email: user.email,
                rol: user.rol
            }
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error en el servidor.', error: error.message });
    }
});

module.exports = router;
module.exports.verifyToken = verifyToken; // Exporta el middleware para usarlo en otras rutas
