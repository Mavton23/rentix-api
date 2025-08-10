const express = require('express');
const router = express.Router();

// ROUTES
const authRoutes = require('./auth.routes');
const tenantRoutes = require('./tenant.routes');
const propertyRoutes = require('./property.routes');
const paymentRoutes = require('./payment.routes');
const historyRoutes = require('./history.routes');
const dashboardRoutes = require('./dashboard.routes');
const finesRoutes = require('./settings.routes');
const notificationRoutes = require('./notification.routes');
const testimonialRoutes = require('./testimony.routes');
const blogRoutes = require('./blog.routes');
const adminRoutes = require('./admin.routes');
const managerRoutes = require('./manager.routes');
const aboutRoutes = require('./about.routes');
const systemRoutes = require('./system.routes');
const statusRoutes = require('./status.routes');
const contactRoutes = require('./contact.routes');

// Rotas públicas
router.use('/auth', authRoutes);
router.use('/testimony', testimonialRoutes);
router.use('/admin', adminRoutes);
router.use('/blog', blogRoutes);
router.use('/managers', managerRoutes);
router.use('/contact', contactRoutes);
router.use('/about', aboutRoutes);
router.use('/status', statusRoutes);
router.use('/system', systemRoutes);

// Rotas protegidas
router.use('/dashboard', dashboardRoutes);
router.use('/tenant', tenantRoutes);
router.use('/property', propertyRoutes);
router.use('/payment', paymentRoutes);
router.use('/history', historyRoutes);
router.use('/settings', finesRoutes);
router.use('/notification', notificationRoutes);

module.exports = router;