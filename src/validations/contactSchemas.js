const { body } = require('express-validator');

const createEmailContactValidator = [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('E-mail inválido'),
  body('subject').notEmpty().withMessage('Assunto é obrigatório'),
  body('message').notEmpty().withMessage('Mensagem é obrigatória')
];

module.exports = {
    createEmailContactValidator
}