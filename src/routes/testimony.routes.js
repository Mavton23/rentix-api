const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const testimonyController = require('../controllers/testimony.controller');
const { createTestimonialValidator, approveTestimonialValidator } = require('../validations/testimonySchemas');

router.get('/testimonials', testimonyController.getTestimonials);

router.get('/pending', 
    authMiddleware, 
    testimonyController.getPendingTestimonials
);

router.post('/new', 
    createTestimonialValidator,
    testimonyController.createTestimony);

router.put('/:id/approve', 
    authMiddleware,
    approveTestimonialValidator,
    testimonyController.approveTestimony
);

module.exports = router;