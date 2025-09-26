// Importa la biblioteca jsonwebtoken para verificar tokens JWT
const jwt = require('jsonwebtoken');

// Obtiene la clave secreta del token JWT de las variables de entorno
// Es crucial que esta clave sea segura y se mantenga en secreto
// En producción, usa variables de entorno (por ejemplo, process.env.JWT_SECRET)
// Para desarrollo, podrías usar un valor fijo, pero NUNCA en producción
const secretKey = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Asegúrate de que esta clave sea la misma que usas para firmar tokens

// Middleware para autenticar tokens JWT
function authenticateToken(req, res, next) {
  // Obtiene el token de la cabecera de autorización de la petición
  // Los tokens suelen enviarse en el formato "Bearer TOKEN_VALUE"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Divide "Bearer TOKEN_VALUE" y toma el TOKEN_VALUE

  // Si no hay token, devuelve un error 401 (No autorizado)
  if (token == null) {
    console.log('No token provided. Access denied.');
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
  }

  // Verifica el token usando la clave secreta
  jwt.verify(token, secretKey, (err, user) => {
    // Si el token no es válido (expirado, modificado, etc.), devuelve un error 403 (Prohibido)
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(403).json({ message: 'Token no válido o expirado.' });
    }

    // Si el token es válido, adjunta la información del usuario al objeto de petición (req.user)
    // Esto permite que las rutas subsiguientes accedan a los datos del usuario autenticado
    req.user = user;
    console.log('Token authenticated. User:', user);
    // Pasa el control al siguiente middleware o a la función de controlador de la ruta
    next();
  });
}

// Exporta el middleware para que pueda ser utilizado en otras partes de la aplicación
module.exports = authenticateToken;
