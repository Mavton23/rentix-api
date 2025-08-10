const { Testimonial } = require('../models');
const { validationResult } = require('express-validator');

module.exports = {
    getTestimonials: async (req, res) => {
        try {
            const testimonials = await Testimonial.findAll({
            where: { approved: true },
            limit: 5
            });
            res.json(testimonials);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getPendingTestimonials: async (req, res) => {
        try {
            const testimonials = await Testimonial.findAll({
            where: { approved: false }
            });
            res.json(testimonials);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createTestimony: async (req, res) => {
        const errors = validationResult(req);

        // Verifica se há erros de validação
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
                }))
            });
        }

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
    },

    approveTestimony: async (req, res) => {
        const errors = validationResult(req);

        // Verifica se há erros de validação
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
                }))
            });
        }

        try {
            const [updated] = await Testimonial.update(
                { approved: true },
                { where: { id: req.params.id } }
                );
                if (updated) {
                    res.json({ success: true });
                } else {
                    return res.status(404).json({
                    success: false,
                    errors: [{ message: 'Depoimento não encontrado' }],
                });
                
            }
        } catch (error) {
            return res.status(500).json({
              success: false,
              errors: [{ message: 'Erro ao aprovar o depoimento.' }],
            });
        }
    }
}