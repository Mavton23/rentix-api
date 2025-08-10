require('dotenv').config()
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    
    return jwt.sign(
        {
            userId: user._id,
            managerId: user.managerId,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extrai o token após 'Bearer '
    
    if (!token) return res.status(401).json({ success: false, message: 'Token não fornecido.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Token inválido.' });
        req.user = user;
        console.log('Usuário decodificado:', user); // Adicione para debug
        next();
    });
};

module.exports = { 
    generateToken, 
    authenticateToken
};