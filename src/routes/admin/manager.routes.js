// routes/admin/managers.route.js
const express = require('express');
const router = express.Router();
const managersController = require('../../controllers/admin/manager.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { 
  createManagerValidator,
  updateManagerValidator 
} = require('../../validations/managerSchemas');

// Rotas protegidas por autenticação
router.use(authMiddleware);

// Rotas de CRUD para managers
router.get('/', managersController.getAllManagers);
router.post('/', createManagerValidator, managersController.createManager);
router.get('/:id', managersController.getManagerById);
router.put('/:id', updateManagerValidator, managersController.updateManager);
router.patch('/:id/status', managersController.updateManagerStatus);
router.delete('/:id', managersController.deleteManager);

module.exports = router;