const { body } = require('express-validator');

const createTenantValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('O nome do inquilino é obrigatório!'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Forneça um endereço de e-mail válido!'),

  body('binum')
    .trim()
    .isLength({ min: 12, max: 20 })
    .withMessage('O documento deve ter entre 12 e 20 caracteres')
    .notEmpty()
    .withMessage('O número de identificação é obrigatório!'),

  body('age')
    .isInt({ min: 18, max: 120 })
    .withMessage('A idade deve estar entre 18 e 120 anos.'),

  body('phone')
    .matches(/^\+?[\d\s-]{8,15}$/i)
    .withMessage('Formato de telefone inválido'),

  body('job')
    .trim()
    .notEmpty()
    .withMessage('A profissão é obrigatória!'),

  body('emergencyNum')
    .trim()
    .notEmpty()
    .withMessage('O número de emergência é obrigatório!'),

  body('marital_status')
    .trim()
    .notEmpty()
    .withMessage('O estado civil é obrigatório!'),
];

const updateTenantValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('O nome do inquilino é obrigatório!'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Forneça um endereço de e-mail válido!'),

  body('binum')
    .optional()
    .trim()
    .isLength({ min: 12, max: 20 })
    .withMessage('O documento deve ter entre 12 e 20 caracteres'),

  body('age')
    .optional()
    .isInt({ min: 18, max: 120 })
    .withMessage('A idade deve estar entre 18 e 120 anos.'),

  body('phone')
    .optional()
    .matches(/^\+?[\d\s-]{8,15}$/i)
    .withMessage('Formato de telefone inválido'),

  body('job')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('A profissão é obrigatória!'),

  body('emergencyNum')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('O número de emergência é obrigatório!'),
];

module.exports = {
  createTenantValidator,
  updateTenantValidator,
};
