const { AboutContent } = require('../models');

module.exports = {
    getContent: async (req, res) => {
        try {
            const content = await AboutContent.findOne();
            res.json(content);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateContent: async (req, res) => {
        try {
            const updated = await AboutContent.update(req.body, {
            where: { id: 1 }
            });
            res.json(updated);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}