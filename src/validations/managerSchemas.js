const { body } = require('express-validator');
const { Manager } = require('../models');

const commonValidations = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .custom(async (email, { req }) => {
      const manager = await Manager.findOne({ where: { email } });
      if (manager && manager.managerId !== req.params?.id) {
        throw new Error('Email já está em uso');
      }
    }),
  
  body('phone')
    .optional()
    .trim()
    .isMobilePhone().withMessage('Telefone inválido'),
  
  
  body('status')
    .optional()
    .isIn(['ativo', 'inativo', 'suspenso']).withMessage('Status inválido')
];

const createManagerValidator = [
  ...commonValidations,
  body('password')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
];

const updateManagerValidator = [
  ...commonValidations,
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
];

const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Senha atual é obrigatória'),
    
  body('newPassword')
    .notEmpty().withMessage('Nova senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    
  body('confirmPassword')
    .notEmpty().withMessage('Confirmação de senha é obrigatória')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('As senhas não coincidem')
];

module.exports = {
  createManagerValidator,
  updateManagerValidator,
  changePasswordValidator
};