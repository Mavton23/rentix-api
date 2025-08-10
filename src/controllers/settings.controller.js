const { FineSettings } = require('../models');
const { validationResult } = require('express-validator');

module.exports = {
  getSettings: async (req, res) => {
    try {
      const settings = await FineSettings.findOne({
        where: { managerId: req.params.managerId }
      });

      if (!settings) {
        // Cria configurações padrão se não existirem
        const defaultSettings = await FineSettings.create({
          managerId: req.params.managerId,
          // Valores padrão definidos no modelo
        });
        return res.json(defaultSettings);
      }

      res.json(settings);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao buscar configurações',
        errors: [{ message: error.message }]
      });
    }
  },

  updateSettings: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    try {
      const [settings, created] = await FineSettings.findOrCreate({
        where: { managerId: req.params.managerId },
        defaults: req.body
      });

      if (!created) {
        // Atualiza apenas os campos que foram enviados
        const updatableFields = [
          'finePercentage',
          'maxFinesBeforeWarning',
          'welcomeMessage',
          'emailNotifications',
          'smsNotifications',
          'whatsappNotifications',
          'paymentReminderDays'
        ];
        
        updatableFields.forEach(field => {
          if (req.body[field] !== undefined) {
            settings[field] = req.body[field];
          }
        });

        await settings.save();
      }

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erro ao atualizar configurações',
        errors: [{ message: error.message }]
      });
    }
  }
};