const { SystemStatus, SystemComponent, SystemIncident } = require('../models');
const { NotFoundError } = require('../utils/errors');
const { Op } = require('sequelize');

module.exports = {
  getStatus: async (req, res, next) => {
  try {
    const [status, components, incidents] = await Promise.all([
      SystemStatus.findOne(),
      SystemComponent.findAll({
        where: { isActive: true },
        order: [['order', 'ASC']]
      }),
      SystemIncident.findAll({
        where: { status: { [Op.not]: 'resolved' } },
        include: {
          model: SystemComponent,
          as: 'components',
          attributes: ['name']
        },
        order: [['startedAt', 'DESC']],
        limit: 10
      })
    ]);

    // Valores padrão para quando não houver dados
    const defaultStatus = {
      overallStatus: 'operational',
      lastUpdated: new Date(),
      message: null
    };

    res.json({
      systemStatus: status?.overallStatus || defaultStatus.overallStatus,
      lastUpdated: status?.lastUpdated || defaultStatus.lastUpdated,
      message: status?.message || defaultStatus.message,
      components: components?.map(c => ({
        name: c.name,
        status: c.status,
        description: c.description
      })) || [], // Retorna array vazio se não houver componentes
      incidents: incidents?.map(i => ({
        id: i.incidentId,
        title: i.title,
        status: i.status,
        impact: i.impact,
        startedAt: i.startedAt,
        updatedAt: i.updatedAt,
        components: i.components?.map(c => c.name) || [] // Seguro contra components undefined
      })) || [] // Retorna array vazio se não houver incidentes
    });
  } catch (error) {
    console.error("ERRO: ", error instanceof Error ? error.message : error);
    next(error);
  }
},

  updateSystemStatus: async (req, res, next) => {
    try {
      const { status, message } = req.body;
      const [updated] = await SystemStatus.update({
        overallStatus: status,
        message,
        lastUpdated: new Date()
      }, {
        where: { statusId: { [Op.not]: null } }
      });

      res.json({ success: !!updated });
    } catch (error) {
      next(error);
    }
  },

  // createComponent: async (req, res, next) => {
  //   try {
  //     const component = await SystemComponent.create(req.body);
  //     res.status(201).json(component);
  //   } catch (error) {
  //     next(error);
  //   }
  // },

  // Métodos para Componentes
  createComponent: async (req, res, next) => {
    try {
      const { name, status, description, order, isActive } = req.body;
      
      const component = await SystemComponent.create({
        name,
        status: status || 'operational',
        description,
        order: order || 0,
        isActive: isActive !== false
      });

      res.status(201).json({
        componentId: component.componentId,
        name: component.name,
        status: component.status,
        description: component.description,
        order: component.order,
        isActive: component.isActive
      });
    } catch (error) {
      console.error("ERRO ao criar componente:", error);
      next(error);
    }
  },

  updateComponent: async (req, res, next) => {
    try {
      const { componentId } = req.params;
      const { name, status, description, order, isActive } = req.body;

      const component = await SystemComponent.findByPk(componentId);
      if (!component) {
        throw new NotFoundError('Componente não encontrado');
      }

      await component.update({
        name: name || component.name,
        status: status || component.status,
        description: description || component.description,
        order: order !== undefined ? order : component.order,
        isActive: isActive !== undefined ? isActive : component.isActive
      });

      res.json({
        componentId: component.componentId,
        name: component.name,
        status: component.status,
        description: component.description,
        order: component.order,
        isActive: component.isActive
      });
    } catch (error) {
      console.error("ERRO ao atualizar componente:", error);
      next(error);
    }
  },

  deleteComponent: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const component = await SystemComponent.findByPk(id);
      if (!component) {
        throw new NotFoundError('Componente não encontrado');
      }

      // Verificar se o componente está associado a algum incidente ativo
      const incidentsWithComponent = await SystemIncident.count({
        include: [{
          model: SystemComponent,
          as: 'components',
          where: { componentId: id }
        }],
        where: { status: { [Op.not]: 'resolved' } }
      });

      if (incidentsWithComponent > 0) {
        return res.status(400).json({ 
          error: 'Não é possível excluir o componente pois está associado a incidentes ativos' 
        });
      }

      await component.destroy();
      res.status(204).end();
    } catch (error) {
      console.error("ERRO ao excluir componente:", error);
      next(error);
    }
  },

  // Métodos para Incidentes
  createIncident: async (req, res, next) => {
    try {
      const { 
        title, 
        status, 
        impact, 
        details, 
        componentIds 
      } = req.body;

      const incident = await SystemIncident.create({
        title,
        status: status || 'investigating',
        impact: impact || 'minor',
        details,
        startedAt: new Date(),
        updatedAt: new Date()
      });

      if (componentIds && componentIds.length > 0) {
        const components = await SystemComponent.findAll({
          where: { componentId: componentIds }
        });
        await incident.setComponents(components);
      }

      const incidentWithComponents = await SystemIncident.findByPk(incident.incidentId, {
        include: {
          model: SystemComponent,
          as: 'components',
          attributes: ['componentId', 'name']
        }
      });

      res.status(201).json({
        incidentId: incidentWithComponents.incidentId,
        title: incidentWithComponents.title,
        status: incidentWithComponents.status,
        impact: incidentWithComponents.impact,
        startedAt: incidentWithComponents.startedAt,
        components: incidentWithComponents.components.map(c => ({
          componentId: c.componentId,
          name: c.name
        }))
      });
    } catch (error) {
      console.error("ERRO ao criar incidente:", error);
      next(error);
    }
  },

  updateIncident: async (req, res, next) => {
    try {
      const { incidentId } = req.params;
      const { 
        title, 
        status, 
        impact, 
        details, 
        componentIds,
        resolved 
      } = req.body;

      const incident = await SystemIncident.findByPk(incidentId);
      if (!incident) {
        throw new NotFoundError('Incidente não encontrado');
      }

      const updateData = {
        title: title || incident.title,
        status: status || incident.status,
        impact: impact || incident.impact,
        details: details || incident.details,
        updatedAt: new Date()
      };

      if (resolved && status === 'resolved') {
        updateData.resolvedAt = new Date();
      }

      await incident.update(updateData);

      if (componentIds) {
        const components = await SystemComponent.findAll({
          where: { componentId: componentIds }
        });
        await incident.setComponents(components);
      }

      const updatedIncident = await SystemIncident.findByPk(incidentId, {
        include: {
          model: SystemComponent,
          as: 'components',
          attributes: ['componentId', 'name']
        }
      });

      res.json({
        incidentId: updatedIncident.incidentId,
        title: updatedIncident.title,
        status: updatedIncident.status,
        impact: updatedIncident.impact,
        startedAt: updatedIncident.startedAt,
        updatedAt: updatedIncident.updatedAt,
        resolvedAt: updatedIncident.resolvedAt,
        components: updatedIncident.components.map(c => ({
          componentId: c.componentId,
          name: c.name
        }))
      });
    } catch (error) {
      console.error("ERRO ao atualizar incidente:", error);
      next(error);
    }
  },

  deleteIncident: async (req, res, next) => {
    try {
      const { incidentId } = req.params;
      
      const incident = await SystemIncident.findByPk(incidentId);
      if (!incident) {
        throw new NotFoundError('Incidente não encontrado');
      }

      await incident.destroy();
      res.status(204).end();
    } catch (error) {
      console.error("ERRO ao excluir incidente:", error);
      next(error);
    }
  },

  // Método para reordenar componentes
  reorderFeatures: async (req, res, next) => {
    try {
      const { features } = req.body;
      
      if (!features || !Array.isArray(features)) {
        return res.status(400).json({ error: 'Lista de features com ordem é obrigatória' });
      }

      const transaction = await SystemComponent.sequelize.transaction();
      
      try {
        await Promise.all(features.map(async (feature) => {
          await SystemComponent.update(
            { order: feature.order },
            { 
              where: { componentId: feature.featureId },
              transaction 
            }
          );
        }));

        await transaction.commit();
        
        const updatedComponents = await SystemComponent.findAll({
          order: [['order', 'ASC']]
        });

        res.json(updatedComponents.map(c => ({
          componentId: c.componentId,
          name: c.name,
          order: c.order
        })));
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error("ERRO ao reordenar features:", error);
      next(error);
    }
  },

  // Métodos adicionais para o frontend
  getAllComponents: async (req, res, next) => {
    try {
      const components = await SystemComponent.findAll({
        order: [['order', 'ASC']]
      });
      
      res.json(components.map(c => ({
        componentId: c.componentId,
        name: c.name,
        status: c.status,
        description: c.description,
        order: c.order,
        isActive: c.isActive
      })));
    } catch (error) {
      console.error("ERRO ao buscar componentes:", error);
      next(error);
    }
  },

  getActiveIncidents: async (req, res, next) => {
    try {
      const incidents = await SystemIncident.findAll({
        where: { status: { [Op.not]: 'resolved' } },
        include: {
          model: SystemComponent,
          as: 'components',
          attributes: ['componentId', 'name']
        },
        order: [['startedAt', 'DESC']]
      });
      
      res.json(incidents.map(i => ({
        incidentId: i.incidentId,
        title: i.title,
        status: i.status,
        impact: i.impact,
        startedAt: i.startedAt,
        updatedAt: i.updatedAt,
        components: i.components.map(c => ({
          componentId: c.componentId,
          name: c.name
        }))
      })));
    } catch (error) {
      console.error("ERRO ao buscar incidentes:", error);
      next(error);
    }
  },

  updateSystemStatus: async (req, res, next) => {
    try {
      const { status, message } = req.body;
      
      let systemStatus = await SystemStatus.findOne();
      if (!systemStatus) {
        systemStatus = await SystemStatus.create({
          overallStatus: status || 'operational',
          message
        });
      } else {
        await systemStatus.update({
          overallStatus: status || systemStatus.overallStatus,
          message: message !== undefined ? message : systemStatus.message,
          lastUpdated: new Date()
        });
      }

      res.json({
        systemStatus: systemStatus.overallStatus,
        lastUpdated: systemStatus.lastUpdated,
        message: systemStatus.message
      });
    } catch (error) {
      console.error("ERRO ao atualizar status do sistema:", error);
      next(error);
    }
  }
};