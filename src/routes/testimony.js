const express = require('express')
const router = express.Router()
const { Testimonial } = require('../models')
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator')

router.get('/testimonials', async (req, res) => {
    try {
        const testimonials = await Testimonial.findAll({
          where: { approved: true },
          limit: 5
        });
        res.json(testimonials);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
})

router.get('/pending', authMiddleware, async (req, res) => {
    try {
        const testimonials = await Testimonial.findAll({
          where: { approved: false }
        });
        res.json(testimonials);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
})

router.post('/new', async (req, res) => {
    const { name, email, rating, message } = req.body.formData;
    
    try {
        const testimonial = await Testimonial.create({
            name,
            email,
            rating,
            message
        });
        res.status(201).json(testimonial);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
})

router.put('/:id/approve', authMiddleware, async (req, res) => {
    try {
        const [updated] = await Testimonial.update(
          { approved: true },
          { where: { id: req.params.id } }
        );
        if (updated) {
          res.json({ success: true });
        } else {
          res.status(404).json({ error: 'Depoimento não encontrado' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
})

module.exports = router;