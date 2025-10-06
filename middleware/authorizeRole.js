// Los_ALMEYDAS_Backend/middleware/authorizeRole.js

/**
 * Middleware para autorizar el acceso basado en el rol del usuario.
 * @param {string} requiredRole - El rol requerido para acceder a la ruta (ej. 'admin', 'cliente').
 * @returns {Function} Un middleware de Express.
 */
const authorizeRole = (requiredRole) => {
    return (req, res, next) => {
        // req.user debe haber sido establecido por el middleware authenticateToken
        if (!req.user || !req.user.rol) {
            // Si no hay información de usuario o rol, significa que authenticateToken falló
            // o no se ejecutó, o el token no contenía el rol.
            // Esto debería ser manejado mayormente por authenticateToken, pero es una buena salvaguarda.
            console.warn('Intento de autorización sin usuario o rol en el token.');
            return res.status(401).json({ message: 'Acceso denegado. No autenticado o token inválido.' });
        }

        const userRole = req.user.rol;

        // Compara el rol del usuario con el rol requerido
        if (userRole === requiredRole) {
            // Si el rol coincide, permite que la solicitud continúe
            next();
        } else {
            // Si el rol no coincide, deniega el acceso
            console.log(`Acceso denegado para el usuario ${req.user.id_usuario} con rol '${userRole}'. Rol requerido: '${requiredRole}'.`);
            return res.status(403).json({ message: 'Acceso denegado. No tienes el rol necesario para esta acción.' });
        }
    };
};

module.exports = authorizeRole;

