const { body, check } = require('express-validator');

const registerManagerValidator = [
  body('username')
    .trim()
    .notEmpty().withMessage('O nome de usuário é obrigatório!')
    .isLength({ min: 2 }).withMessage('O nome deve ter pelo menos 2 caracteres.'),

  body('email')
    .trim()
    .isEmail().withMessage('Forneça um e-mail válido!')
    .notEmpty().withMessage('O e-mail é obrigatório!'),

  body('phone')
    .trim()
    .notEmpty().withMessage('O número de telefone é obrigatório!'),

  body('password')
    .trim()
    .isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres!')
    .notEmpty().withMessage('A senha é obrigatória!'),

  body('confpass')
    .trim()
    .custom((value, { req }) => value === req.body.password)
    .withMessage('As senhas não coincidem!')
];

const registerAdminValidator = [
  body('username')
    .trim()
    .notEmpty().withMessage('O nome de usuário é obrigatório!')
    .isLength({ min: 2 }).withMessage('O nome deve ter pelo menos 2 caracteres.'),

  body('email')
    .trim()
    .isEmail().withMessage('E-mail inválido!')
    .notEmpty().withMessage('E-mail é obrigatório!'),

  body('password')
    .trim()
    .isLength({ min: 6 }).withMessage('A senha deve ter no mínimo 6 caracteres!')
    .notEmpty().withMessage('Senha é obrigatória!'),

  body('secretKey')
    .trim()
    .notEmpty().withMessage('A chave de administração é obrigatória!')
];

const loginUserValidator = [
  body('email').trim().isEmail().withMessage('Forneça um e-mail válido!'),
  body('password').trim().notEmpty().withMessage('A senha é obrigatória!'),
];

const resetPasswordValidator = [
  check('email')
    .isEmail().withMessage('Por favor, insira um e-mail válido')
    .notEmpty().withMessage('O e-mail é obrigatório')
];
const updatePasswordValidator = [
  check('token')
    .notEmpty().withMessage('Token de recuperação é obrigatório'),

  check('newPassword')
    .isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres')
    .notEmpty().withMessage('A nova senha é obrigatória')
];

module.exports = {
  registerManagerValidator,
  registerAdminValidator,
  loginUserValidator,
  resetPasswordValidator,
  updatePasswordValidator
};
