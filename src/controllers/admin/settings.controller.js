// controllers/admin/settings.controller.js
const { FineSettings } = require('../../models');

module.exports = {
  getSettings: async (req, res) => {

    try {
      const settings = await FineSettings.findOne({
        where: { managerId: req.params.managerId }
      });

      if (!settings) {
        // Cria configurações padrão se não existirem
        const defaultSettings = await FineSettings.create({
          managerId: req.params.managerId
        });
        return res.json(defaultSettings);
      }

      res.json(settings);
    } catch (error) {
        console.log("Erro: ", error instanceof Error ? error.message : error);
      res.status(500).json({ message: error.message });
    }
  },

  updateSettings: async (req, res) => {
    try {
      const [updated] = await FineSettings.update(req.body, {
        where: { managerId: req.params.managerId }
      });

      if (!updated) {
        return res.status(404).json({ message: 'Configurações não encontradas' });
      }

      const updatedSettings = await FineSettings.findOne({
        where: { managerId: req.params.managerId }
      });

      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};