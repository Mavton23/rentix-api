const { body, param } = require('express-validator');

const createTestimonialValidator = [
  body('formData.name')
    .trim()
    .notEmpty().withMessage('O nome é obrigatório!')
    .isLength({ min: 2 }).withMessage('O nome deve ter pelo menos 2 caracteres.'),

  body('formData.email')
    .trim()
    .notEmpty().withMessage('O e-mail é obrigatório!')
    .isEmail().withMessage('Forneça um e-mail válido!'),

  body('formData.rating')
    .notEmpty().withMessage('A classificação é obrigatória!')
    .isInt({ min: 1, max: 5 }).withMessage('A classificação deve ser um número entre 1 e 5.'),

  body('formData.message')
    .trim()
    .notEmpty().withMessage('A mensagem é obrigatória!')
    .isLength({ min: 10 }).withMessage('A mensagem deve ter pelo menos 10 caracteres.')
];

const approveTestimonialValidator = [
  param('id')
    .notEmpty().withMessage('O ID é obrigatório!')
    .isInt().withMessage('O ID deve ser um número inteiro!')
];

module.exports = {
  createTestimonialValidator,
  approveTestimonialValidator
};
