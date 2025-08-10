const express = require('express');
const router = express.Router();
const settingsController = require('../../controllers/admin/settings.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/:managerId', settingsController.getSettings);
router.put('/:managerId', settingsController.updateSettings);

module.exports = router;