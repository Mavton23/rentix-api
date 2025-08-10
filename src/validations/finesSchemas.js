const { body } = require('express-validator');

const finesValidations = [
    body('finePercentage')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('A porcentagem da multa deve estar entre 0 e 100.'),
    body('maxFinesBeforeWarning')
        .optional()
        .isInt({ min: 1 })
        .withMessage('O número máximo de multas deve ser pelo menos 1.'),
    body('welcomeMessage')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('A mensagem de boas-vindas é obrigatória!'),
    ]

module.exports = { finesValidations }