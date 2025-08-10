const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createTenantValidator, updateTenantValidator } = require('../validations/tenantSchemas');
const tenantController = require('../controllers/tenant.controller');

router.use(authMiddleware);

router.get('/tenants', tenantController.getTenants);

router.post('/tenants', 
    createTenantValidator,
    tenantController.createTenant);

router.get('/tenants/:id', tenantController.getTenantById);

router.put('/tenants/:id', 
    updateTenantValidator,
    tenantController.updateTenant);

router.delete('/tenants/:id', tenantController.deleteTenant);

module.exports = router;