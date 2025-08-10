const { body } = require('express-validator');

const updateSettingsValidator = [
  body('finePercentage')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('O percentual da multa deve ser entre 0 e 1 (0% a 100%)'),
  
  body('maxFinesBeforeWarning')
    .optional()
    .isInt({ min: 1 })
    .withMessage('O número de multas deve ser pelo menos 1'),
    
  body('welcomeMessage')
    .optional()
    .isString()
    .withMessage('A mensagem de boas-vindas deve ser um texto'),
    
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Notificação por e-mail deve ser verdadeiro ou falso'),
    
  body('smsNotifications')
    .optional()
    .isBoolean()
    .withMessage('Notificação por SMS deve ser verdadeiro ou falso'),
    
  body('whatsappNotifications')
    .optional()
    .isBoolean()
    .withMessage('Notificação por WhatsApp deve ser verdadeiro ou falso'),
    
  body('paymentReminderDays')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Dias para lembrete deve ser entre 1 e 30')
];

module.exports = {
  updateSettingsValidator
};