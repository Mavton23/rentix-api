const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/manager', 
    authMiddleware,
    dashboardController.managerStats,
    );

module.exports = router;