const { Manager, BlogPost, BlogCategory } = require('../models');
const { sequelize } = require('../configs/db');

module.exports = {
    getPosts: async (req, res) => {
        try {
            const { category, limit = 6, page = 1 } = req.query;
            const offset = (page - 1) * limit;
        
            // Filtro padrão para mostrar apenas posts publicados
            const where = { status: 'published' };
            
            // Adiciona filtro de categoria se existir
            if (category) where['$category.slug$'] = category;
        
            const posts = await BlogPost.findAll({
                where,
                include: [
                { 
                    model: Manager, 
                    as: 'author',
                    attributes: ['name', 'email'],
                },
                {
                    model: BlogCategory,
                    as: 'category',
                    attributes: ['name', 'slug'],
                }
                ],
                order: [['publishedAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset),
            });
        
            res.json(posts);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
},

    getCategories: async (req, res) => {
        try {
            const categories = await BlogCategory.findAll({
                include: [{
                model: BlogPost,
                as: 'posts',
                attributes: [],
                where: { status: 'published' },
                required: false,
                }],
                attributes: [
                'categoryId', 'name', 'slug',
                [sequelize.fn('COUNT', sequelize.col('posts.postId')), 'postCount']
                ],
                group: ['BlogCategory.categoryId'],
            });
        
            res.json(categories);
        } catch (error) {
            console.log("Erro no getCategories: ", error instanceof Error ? error.message : error);
            res.status(500).json({ error: error.message });
        }
    },

    getFeaturedPosts: async (req, res) => {
        try {
            const posts = await BlogPost.findAll({
                where: { 
                status: 'published',
                isFeatured: true,
                },
                limit: 3,
                include: [
                { 
                    model: Manager, 
                    as: 'author',
                    attributes: ['name'],
                }
                ],
                order: [['publishedAt', 'DESC']],
            });
        
            res.json(posts);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getPostBySlug: async (req, res) => {
        try {
            const { slug } = req.params;
            
            if (!slug) {
                return res.status(400).json({ error: 'Slug do post é obrigatório' });
            }

            const post = await BlogPost.findOne({
                where: { 
                    slug,
                    status: 'published'
                },
                include: [
                    { 
                        model: Manager, 
                        as: 'author',
                        attributes: ['name', 'email'],
                    },
                    {
                        model: BlogCategory,
                        as: 'category',
                        attributes: ['name', 'slug'],
                    }
                ]
            });

            if (!post) {
                return res.status(404).json({ error: 'Post não encontrado' });
            }

            // Incrementa o contador de visualizações
            // await post.increment('viewCount', { by: 1 });

            res.json(post);
        } catch (error) {
            console.error('Erro ao buscar post por slug:', error);
            res.status(500).json({ error: 'Erro ao buscar post' });
        }
    }
};