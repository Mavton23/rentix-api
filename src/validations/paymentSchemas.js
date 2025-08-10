const { body } = require('express-validator');

const registerPaymentValidator =  [
    body('amount').isFloat({ min: 0 }).withMessage('O valor do pagamento deve ser positivo.'),
    body('referenceMonth')
    .trim()
    .notEmpty()
    .withMessage('O mês de referência é obrigatório!')
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('O mês de referência deve estar no formato "YYYY-MM".'),
    body('propertyId').isUUID().withMessage('O ID da propriedade é inválido.'),
    body('tenantId').isUUID().withMessage('O ID do inquilino é inválido.'),
];

const updatePaymentValidator = [
    body('amount').optional().isFloat({ min: 0 }).withMessage('O valor do pagamento deve ser positivo.'),
    body('dueDate').optional().isISO8601().withMessage('Forneça uma data de vencimento válida.'),
    body('status').optional().isIn(['pendente', 'pago', 'cancelado']).withMessage('Status inválido.'),
    body('paymentMethod').optional().isIn(['dinheiro', 'cartão', 'transferência']).withMessage('Método de pagamento inválido.'),
];

module.exports = {
    registerPaymentValidator,
    updatePaymentValidator
}