const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const historyController = require('../controllers/history.controller');

router.use(authMiddleware);

router.get('/payment-history', historyController.getAllPaymentHistory);

router.get('/payment-history/:historyId', historyController.getPaymentDetails);

module.exports = router;