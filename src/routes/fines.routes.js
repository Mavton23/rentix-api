const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/authMiddleware');
const { finesValidations } = require('../validations/finesSchemas');
const finesController = require('../controllers/fines.controller');

router.use(authMiddleware);

router.get('/fine-settings', 
    finesController.getFineSettings);
    
router.put('/fine-settings', 
    finesController.updateFineSettings, 
    finesValidations);

module.exports = router;