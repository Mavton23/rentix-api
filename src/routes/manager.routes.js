const express = require('express');
const router = express.Router();
const managersController = require('../controllers/manager.controller');
const authMiddleware = require('../middleware/authMiddleware');
const uploadAvatar = require('../middleware/upload-avatar');
const { 
  updateManagerValidator,
  changePasswordValidator,
} = require('../validations/managerSchemas');

// Rotas protegidas
router.use(authMiddleware);

// Rota para obter dados do gestor
router.get('/:id', managersController.getManagerById);

// Rota para atualizar dados do gestor
router.put('/:id', 
  uploadAvatar, 
  updateManagerValidator,
  managersController.updateManager
);


// Nova rota específica para upload de avatar (POST ou PUT)
router.put('/:id/avatar',
  uploadAvatar,
  managersController.updateManagerAvatar
);

// Rota para alterar senha
router.patch('/:id/password', 
    changePasswordValidator, managersController.changePassword);

module.exports = router;