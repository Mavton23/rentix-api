const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { registerPropertyValidator, updatePropertyValidator } = require('../validations/propertySchemas');
const propertyController = require('../controllers/property.controller');

router.use(authMiddleware);

router.get('/properties', propertyController.getProperties);

router.get('/properties/:id', propertyController.getPropertyById);

router.get('/tenant/:id', propertyController.getTenant);

router.post('/properties', 
    registerPropertyValidator,
    propertyController.createProperty);

router.put('/properties/:id', 
    updatePropertyValidator,
    propertyController.updateProperty);

router.delete('/properties/:id', propertyController.deleteProperty);

module.exports = router;