const { Manager, Property, Tenant, Payment, BlogPost, BlogCategory } = require('../models');
const { generateToken, authenticateToken } = require('../middleware/tokens')
const { validationResult } = require('express-validator');
const { sequelize } = require('../configs/db');

module.exports = {
    adminStats: async (req, res) => {
        try {
            // Contagem de gestores
            const managers = {
              total: await Manager.count(),
              active: await Manager.count({ where: { status: 'ativo' } }),
              inactive: await Manager.count({ where: { status: 'inativo' } })
            };
        
            // Contagem de propriedades
            const properties = {
              total: await Property.count(),
              available: await Property.count({ where: { status: 'disponivel' } }),
              rented: await Property.count({ where: { status: 'alugado' } })
            };
        
            // Contagem de inquilinos
            const tenants = {
              active: await Tenant.count({ where: { status: 'ativo' } }),
              inactive: await Tenant.count({ where: { status: 'inativo' } }),
              expelled: await Tenant.count({ where: { status: 'expulso' } }),
              total: await Tenant.count()
            };
        
            // Contagem de pagamentos
            const payments = {
              paid: await Payment.count({ where: { status: 'pago' } }),
              pending: await Payment.count({ where: { status: 'pendente' } }),
              late: await Payment.count({ where: { status: 'atrasado' } }),
              total: await Payment.count()
            };

            // Contagem de posts
            const blogStats = await BlogPost.findAll({
              attributes: [
                [sequelize.fn('COUNT', sequelize.col('postId')), 'total'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'published' THEN 1 ELSE 0 END")), 'published'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'draft' THEN 1 ELSE 0 END")), 'drafts'],
                [sequelize.fn('SUM', sequelize.literal("CASE WHEN isFeatured = true THEN 1 ELSE 0 END")), 'featured'],
              ],
              raw: true,
            });
        
            // Atividade recente (apenas para admin)
            const recentActivity = req.user?.role === 'admin' ? [
              {
                action: 'Novo gestor cadastrado',
                by: 'Sistema',
                at: new Date()
              },
              // Adicione mais atividades conforme necessário
            ] : [];
        
            res.json({
              managers,
              properties,
              tenants,
              payments,
              recentActivity,
              blogPosts: blogStats[0] || { total: 0, published: 0, drafts: 0, featured: 0 },
            });
        
          } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({ error: 'Erro ao carregar dados do dashboard' });
          }
    },

    createAdmin: async (req, res) => {
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

        const transaction = await sequelize.transaction();
        const { username, email, password, secretKey } = req.body;

        if (secretKey !== process.env.ADMIN_REGISTRATION_KEY) {
            return res.status(403).json({
                success: false,
                errors: [{ message: 'Chave de administração inválida!' }],
            });
        }

        try {
            const existing = await Manager.findOne({ where: { email }, transaction });
            if (existing) {
              return res.status(400).json({
                success: false,
                errors: [{ field: 'email', message: 'Este e-mail já está em uso' }],
              });
            }
      
            const newUser = await Manager.create({
              name: username,
              email,
              password,
              role: 'admin',
            }, { transaction });
            
            await transaction.commit();
            const token = generateToken(newUser);
      
            return res.status(201).json({
              success: true,
              message: 'Administrador registrado com sucesso!',
              user: {
                id: newUser.managerId,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
              },
              token,
            });
          } catch (err) {
            await transaction.rollback();
            console.error(err);
            return res.status(500).json({
              success: false,
              errors: [{ message: 'Erro ao registrar o administrador.' }],
            });
          }
    },

    adminPosts: async (req, res) => {
      try {
        const posts = await BlogPost.findAll({
          include: ['author', 'category'],
          order: [['publishedAt', 'DESC']],
        });
        res.json(posts);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },

    getPostById: async (req, res) => {
      try {
        const { postId } = req.params;
        
        if (!postId) {
          return res.status(400).json({ error: 'ID do post é obrigatório' });
        }

        const post = await BlogPost.findOne({
          where: { postId },
          include: [
            { 
              model: Manager, 
              as: 'author',
              attributes: ['managerId', 'name', 'email']
            },
            {
              model: BlogCategory,
              as: 'category',
              attributes: ['categoryId', 'name', 'slug']
            }
          ]
        });

        if (!post) {
          return res.status(404).json({ error: 'Post não encontrado' });
        }

        res.json(post);
      } catch (error) {
        console.error('Erro ao buscar post:', error);
        res.status(500).json({ 
          error: 'Erro ao buscar post',
          details: error.message 
        });
      }
    },

    createPost: async (req, res) => {
      try {
        const { title, excerpt, content, categoryId, status, isFeatured, allowComments, readTime, slug } = req.body;
        
        const post = await BlogPost.create({
          title,
          excerpt,
          content,
          categoryId,
          status,
          isFeatured: isFeatured === 'true',
          allowComments: allowComments === 'true',
          readTime: parseInt(readTime),
          slug,
          coverImage: req.file?.path || null,
          authorId: req.user.managerId,
          publishedAt: new Date(),
        });

        res.status(201).json(post);
      } catch (error) {
        console.log("ERRO: ", error instanceof Error ? error.message : error);
        res.status(400).json({ error: error.message });
      }
    },

    updatePost: async (req, res) => {
      try {
        const post = await BlogPost.findByPk(req.params.postId);
        if (!post) return res.status(404).json({ error: 'Post não encontrado' });

        const { title, excerpt, content, categoryId, status, isFeatured, allowComments, readTime, slug } = req.body;
        
        await post.update({
          title,
          excerpt,
          content,
          categoryId,
          status,
          isFeatured: isFeatured === 'true',
          allowComments: allowComments === 'true',
          readTime: parseInt(readTime),
          slug,
          coverImage: req.file?.path || post.coverImage, // Mantém a imagem existente se não for enviada nova
        });

        res.json(post);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    deletePost: async (req, res) => {
      try {
        const post = await BlogPost.findByPk(req.params.postId);
        if (!post) return res.status(404).json({ error: 'Post não encontrado' });

        await post.destroy();
        res.json({ message: 'Post excluído com sucesso' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
}