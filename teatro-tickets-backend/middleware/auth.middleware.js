import { verifyToken } from '../config/auth.js';
import { ROLES, isValidRole } from '../constants/roles.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware de autenticación
 * Valida el token JWT y establece req.user con los datos del usuario
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  // Compatibilidad para descargas: permitir token por query (?token=...)
  const tokenFromQuery = req.query && typeof req.query.token === 'string' ? req.query.token : null;

  // Validar formato del header Authorization
  let token = null;
  if (authHeader) {
    if (!authHeader.startsWith('Bearer ')) {
      logger.warn(`Formato de Authorization inválido desde ${req.ip}: ${authHeader.substring(0, 20)}`);
      return res.status(401).json({ 
        error: 'Formato de token inválido. Use: Authorization: Bearer <token>' 
      });
    }
    token = authHeader.substring(7);
  } else if (tokenFromQuery) {
    token = tokenFromQuery;
  }

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  // Verificar token y distinguir tipos de error
  try {
    const decoded = verifyToken(token);
    
    if (!decoded) {
      logger.warn(`Token inválido desde ${req.ip} para ruta ${req.originalUrl}`);
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    // Validar que el rol sea válido
    if (decoded.role && !isValidRole(decoded.role)) {
      logger.error(`Rol inválido en token: ${decoded.role} (usuario: ${decoded.cedula})`);
      return res.status(401).json({ error: 'Token con rol inválido' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    // Distinguir errores de JWT
    if (error.name === 'TokenExpiredError') {
      logger.debug(`Token expirado desde ${req.ip}`);
      return res.status(401).json({ error: 'Token expirado. Por favor, inicie sesión nuevamente.' });
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn(`Token JWT inválido desde ${req.ip}: ${error.message}`);
      return res.status(401).json({ error: 'Token inválido' });
    }
    // Error inesperado
    logger.error(`Error inesperado al verificar token:`, error);
    return res.status(401).json({ error: 'Error al validar token' });
  }
}

/**
 * Autenticación opcional
 * Si hay token válido, setea req.user; si no, continúa sin error
 * Útil para endpoints que funcionan diferente según autenticación
 */
export function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No hay token o formato incorrecto → continuar sin autenticar
    return next();
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    if (decoded && isValidRole(decoded.role)) {
      req.user = decoded;
    }
  } catch (error) {
    // En modo opcional, ignoramos errores de token
    logger.debug(`Token opcional inválido/expirado desde ${req.ip}: ${error.message}`);
  }
  
  next();
}

/**
 * Middleware para requerir roles específicos
 * Valida que el usuario autenticado tenga uno de los roles permitidos
 * 
 * @param {...string} roles - Roles permitidos (puede ser un array o múltiples argumentos)
 * @returns {Function} Middleware de Express
 * 
 * Ejemplos de uso:
 * - requireRole(ROLES.SUPER)
 * - requireRole(ROLES.SUPER, ROLES.ADMIN)
 * - requireRole([ROLES.SUPER, ROLES.ADMIN])
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    // Verificar autenticación
    if (!req.user) {
      logger.warn(`Intento de acceso sin autenticación: ${req.method} ${req.originalUrl} desde ${req.ip}`);
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    // Aplanar el array en caso de que se pase como ['SUPER', 'ADMIN']
    const flatRoles = roles.flat();
    
    // Validar que los roles requeridos sean válidos
    const invalidRoles = flatRoles.filter(role => !isValidRole(role));
    if (invalidRoles.length > 0) {
      logger.error(`Roles inválidos en requireRole: ${invalidRoles.join(', ')}`);
      return res.status(500).json({ error: 'Error de configuración de permisos' });
    }
    
    // Verificar que el usuario tenga uno de los roles requeridos
    if (!flatRoles.includes(req.user.role)) {
      logger.warn(
        `Acceso denegado: usuario ${req.user.cedula} (${req.user.role}) ` +
        `intentó acceder a ${req.method} ${req.originalUrl} ` +
        `(requiere: ${flatRoles.join(' o ')})`
      );
      return res.status(403).json({ 
        error: 'No autorizado',
        requiredRoles: flatRoles,
        yourRole: req.user.role
      });
    }
    
    // Usuario autorizado
    logger.debug(`Acceso autorizado: ${req.user.cedula} (${req.user.role}) → ${req.method} ${req.originalUrl}`);
    next();
  };
}

/**
 * Helper para exportar ROLES desde este archivo
 * Permite usar: import { ROLES } from './middleware/auth.middleware.js'
 */
export { ROLES };
