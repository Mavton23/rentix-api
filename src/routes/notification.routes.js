const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notification.controller');
const { createNotificationValidator } = require('../validations/notificationSchemas');

router.use(authMiddleware);

router.post('/notifications', 
    createNotificationValidator,
    notificationController.notifyTenant);

router.get('/notifications', notificationController.getNotifications);

router.get('/notifications/tenant/:tenantId', notificationController.getTenantNotifications);

module.exports = router;