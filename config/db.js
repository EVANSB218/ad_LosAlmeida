// config/db.js
const mysql = require('mysql2/promise'); // Importa el módulo mysql2 con soporte para promesas
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

// Crea un pool de conexiones para manejar múltiples conexiones de manera eficiente
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Número máximo de conexiones en el pool
    queueLimit: 0
});

// Intenta obtener una conexión del pool para verificar que la conexión es exitosa
// Usamos .then/.catch porque pool.getConnection() devuelve una promesa
pool.getConnection()
    .then(connection => {
        console.log('📡 Conectado a MySQL con ID:', connection.threadId);
        connection.release(); // Libera la conexión de vuelta al pool
    })
    .catch(err => {
        console.error('❌ Error al conectar a MySQL:', err.stack);
        // Opcional: podrías querer salir del proceso si la conexión a la DB es crítica
        // process.exit(1); 
    });

// Exporta el pool de conexiones
module.exports = pool;
