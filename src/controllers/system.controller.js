const { SystemFeature } = require('../models');
const { NotFoundError } = require('../utils/errors');

module.exports = {
  getAllFeatures: async (req, res, next) => {
    try {
      const features = await SystemFeature.findAll({
        where: { isActive: true },
        order: [['order', 'ASC']],
        attributes: { exclude: ['createdAt', 'updatedAt'] }
      });
      
      res.json(features);
    } catch (error) {
      next(error);
    }
  },

  createFeature: async (req, res, next) => {
    try {
      const feature = await SystemFeature.create(req.body);
      res.status(201).json(feature);
    } catch (error) {
      next(error);
    }
  },

  updateFeature: async (req, res, next) => {
    try {
      const feature = await SystemFeature.findByPk(req.params.id);
      if (!feature) throw new NotFoundError('Recurso não encontrado');

      await feature.update(req.body);
      res.json(feature);
    } catch (error) {
      next(error);
    }
  },

  deleteFeature: async (req, res, next) => {
    try {
      const feature = await SystemFeature.findByPk(req.params.id);
      if (!feature) throw new NotFoundError('Recurso não encontrado');

      await feature.destroy();
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },

  reorderFeatures: async (req, res, next) => {
    try {
      const { orderUpdates } = req.body;
      
      await Promise.all(
        orderUpdates.map(async (update) => {
          await SystemFeature.update(
            { order: update.order },
            { where: { featureId: update.id } }
          );
        })
      );
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
};