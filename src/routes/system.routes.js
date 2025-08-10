const express = require('express');
const router = express.Router();
const systemFeaturesController = require('../controllers/system.controller');
const authMiddleware = require('../middleware/authMiddleware');

// Rotas públicas
router.get('/', systemFeaturesController.getAllFeatures);

// Rotas protegidas (admin)
router.use(authMiddleware);
router.post('/', systemFeaturesController.createFeature);
router.put('/:id', systemFeaturesController.updateFeature);
router.delete('/:id', systemFeaturesController.deleteFeature);
router.patch('/reorder', systemFeaturesController.reorderFeatures);

module.exports = router;