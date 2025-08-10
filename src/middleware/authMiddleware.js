const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
    req.headers['authorization']?.split(' ')[1];

    if (!token) {
        logger.warn('Tentativa de acesso sem token');
        return res.status(401).json({ 
            message: 'Token não fornecido' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido ou expirado' });
        logger.error('Falha na autenticação:', error.message);
    }
};

module.exports = authMiddleware;