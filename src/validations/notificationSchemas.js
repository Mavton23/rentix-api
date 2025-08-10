const { body } = require('express-validator');

const createNotificationValidator = [
    body('tenantId').isUUID().withMessage('ID do inquilino inválido.'),
    body('message').trim().notEmpty().withMessage('A mensagem é obrigatória!'),
];

module.exports = {
    createNotificationValidator
}