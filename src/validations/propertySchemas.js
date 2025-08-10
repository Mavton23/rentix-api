const { body } = require('express-validator');

const registerPropertyValidator = [
    body('address').trim().notEmpty().withMessage('O endereço é obrigatório!'),
    body('property_type').trim().notEmpty().withMessage('O tipo de propriedade é obrigatório!'),
    body('bedrooms')
        .if(body('property_type').not().isIn(['Comercial']))
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage('O número de quartos deve ser pelo menos 1.'),
    body('bathrooms')
        .if(body('property_type').not().isIn(['Comercial']))
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage('O número de banheiros deve ser pelo menos 1.'),
    body('rent_amount').isFloat({ min: 0 }).withMessage('O valor do aluguel deve ser positivo.'),
    body('description').trim().notEmpty().withMessage('A descrição é obrigatória!'),
];

const updatePropertyValidator = [
    body('address').optional().trim().notEmpty().withMessage('O endereço é obrigatório!'),
    body('property_type').optional().trim().notEmpty().withMessage('O tipo de propriedade é obrigatório!'),
    body('status').optional().trim().notEmpty().withMessage('O status da propriedade é obrigatório!'),
    body('bedrooms')
        .if(body('property_type').not().isIn(['Comercial']))
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage('O número de quartos deve ser pelo menos 1.'),
    body('bathrooms')
        .if(body('property_type').not().isIn(['Comercial']))
        .optional({ checkFalsy: true })
        .isInt({ min: 1 }).withMessage('O número de banheiros deve ser pelo menos 1.'),
    body('rent_amount').optional().isFloat({ min: 0 }).withMessage('O valor do aluguel deve ser positivo.'),
    body('description').optional().trim().notEmpty().withMessage('A descrição é obrigatória!'),
];

module.exports = {
    registerPropertyValidator,
    updatePropertyValidator
}