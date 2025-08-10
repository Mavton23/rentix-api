const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { registerPaymentValidator, updatePaymentValidator } = require('../validations/paymentSchemas');
const paymentController = require('../controllers/payment.controller');

router.use(authMiddleware);


router.get('/payments', 
    paymentController.getPayments);

router.get('/payment/:id', paymentController.getPaymentById);

router.post('/multipayments', 
    paymentController.createMultipayments);

router.post('/payments', 
    registerPaymentValidator,
    paymentController.createPayment);

router.put('/payments/:paymentId', 
    updatePaymentValidator,
    paymentController.updatePayment);

module.exports = router;