const express = require('express')
const router = express.Router()
const contactController = require('../controllers/contact.controller');
const { createEmailContactValidator } = require('../validations/contactSchemas');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', 
    createEmailContactValidator,
    contactController.sendMail);

// Rotas públicas
router.get('/info', contactController.getContactInfo);
// router.post('/message', contactController.sendMessage);

// Rotas protegidas (admin)
router.use(authMiddleware);
router.get('/messages', contactController.getMessages);
router.put('/info', contactController.updateContactInfo);

module.exports = router;