const express = require('express');
const router = express.Router();
const finesController = require('../controllers/settings.controller');
const { updateSettingsValidator } = require('../validations/settingsSchemas');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/:managerId', finesController.getSettings);

router.put('/:managerId', 
    updateSettingsValidator,
    finesController.updateSettings);

module.exports = router;