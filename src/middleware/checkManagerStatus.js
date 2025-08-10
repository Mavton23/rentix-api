const Manager = require('../models/Manager');

const checkManagerStatus = async (req, res, next) => {
    const manager = await Manager.findByPk(req.user.managerId);
    
    if (manager.status !== 'ativo') {
      return res.status(403).json({ 
        error: `Acesso negado. Gestor ${manager.status.toUpperCase()}`
      });
    }
    next();
};

module.exports = checkManagerStatus;