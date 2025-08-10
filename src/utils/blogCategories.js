const { BlogCategory } = require('../models');

module.exports = {
    ensureCategoriesExist: async (req, res, next) => {
        try {
        const count = await BlogCategory.count();
        if (count === 0) {
            await BlogCategory.create({
            name: 'Geral',
            slug: 'geral'
            });
        }
        next();
        } catch (error) {
            res.status(500).json({ error: 'Falha ao verificar categorias' });
        }
    }
}