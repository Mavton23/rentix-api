const express = require('express');
const router = express.Router();
const statusController = require('../controllers/status.controller');
const authMiddleware = require('../middleware/authMiddleware');

// Rotas públicas
router.get('/', statusController.getStatus);
router.get('/components', statusController.getAllComponents);
router.get('/incidents', statusController.getActiveIncidents);

// Rotas protegidas (admin)
router.use(authMiddleware);
// Rotas para Componentes
router.post('/components', statusController.createComponent);
router.put('/components/:id', statusController.updateComponent);
router.delete('/components/:id', statusController.deleteComponent);

// Rotas para Incidentes
router.post('/incidents', statusController.createIncident);
router.put('/incidents/:id', statusController.updateIncident);
router.delete('/incidents/:id', statusController.deleteIncident);

// Rotas para Status e Reordenação
router.patch('/status', statusController.updateSystemStatus);
router.patch('/reorder', statusController.reorderFeatures);

module.exports = router;