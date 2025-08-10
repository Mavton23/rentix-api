const { ForbiddenError } = require('../utils/errors');

/**
 * Middleware para autorização baseada em roles
 * @param {Array<string>} allowedRoles - Lista de roles permitidas
 * @returns {Function} Middleware function
 */
const authorize = (allowedRoles = []) => {
  // Se não foi especificado nenhuma role, permite qualquer usuário autenticado
  if (!Array.isArray(allowedRoles)) {
    throw new Error('Parâmetro allowedRoles deve ser um array');
  }

  return (req, res, next) => {
    try {
      // O middleware authenticate deve ter adicionado o usuário ao request
      if (!req.user) {
        throw new ForbiddenError('Usuário não autenticado');
      }

      // Verifica se o usuário tem pelo menos uma das roles permitidas
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError('Acesso não autorizado');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = authorize;