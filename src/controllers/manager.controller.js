const { Manager } = require('../models');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { sequelize } = require('../configs/db');

module.exports = {
  getManagerById: async (req, res) => {
    try {
      const manager = await Manager.findByPk(req.params.id, {
        attributes: { exclude: ['password'] }
      });

      if (!manager) {
        return res.status(404).json({
          success: false,
          message: 'Gestor não encontrado'
        });
      }

      res.json({
        success: true,
        data: manager
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar gestor',
        error: error.message
      });
    }
  },

  updateManager: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ errors: errors.array() });
    }

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { currentPassword, ...updateData } = req.body;

      const manager = await Manager.findByPk(id);
      if (!manager) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({
          success: false,
          message: 'Gestor não encontrado'
        });
      }

      if (req.file) {
        updateData.avatarUrl = `/uploads/avatars/${req.file.filename}`;
        
        // Remove a imagem
        if (manager.avatarUrl) {
          const oldPath = path.join(__dirname, '../', manager.avatarUrl);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
      }

      // Atualiza os campos permitidos
      const allowedFields = ['name', 'email', 'phone', 'status', 'avatarUrl'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          manager[field] = updateData[field];
        }
      });

      await manager.save({ transaction });
      await transaction.commit();

      // Remove a senha da resposta
      const managerData = manager.toJSON();
      delete managerData.password;

      res.json({
        success: true,
        data: managerData
      });
    } catch (error) {
  
      if (req.file) {
        fs.unlinkSync(req.file.path);
        await transaction.rollback();
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar gestor',
        error: error.message
      });
    }
  },

  updateManagerAvatar: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const manager = await Manager.findByPk(id, { transaction });
      
      if (!manager) {
        // Remove o arquivo
        if (req.file) fs.unlinkSync(req.file.path);
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Gestor não encontrado'
        });
      }

      // Remove a imagem
      if (manager.avatarUrl) {
        const oldPath = path.join(__dirname, '../../', manager.avatarUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Atualiza com a nova URL
      manager.avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await manager.save({ transaction });
      await transaction.commit();

      res.json({
        success: true,
        data: {
          avatarUrl: manager.avatarUrl
        }
      });
    } catch (error) {
      // Remove o arquivo
      if (req.file) fs.unlinkSync(req.file.path);
      await transaction.rollback();
      
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar avatar',
        error: error.message
      });
    }
  },

  changePassword: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      const manager = await Manager.findByPk(id, { transaction });
      if (!manager) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Gestor não encontrado'
        });
      }

      // Verifica a senha atual
      const isMatch = await bcrypt.compare(currentPassword, manager.password);
      if (!isMatch) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }

      // Atualiza a senha
      const salt = await bcrypt.genSalt(10);
      manager.password = await bcrypt.hash(newPassword, salt);
      await manager.save({ transaction });
      await transaction.commit();

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      await transaction.rollback();
      
      res.status(500).json({
        success: false,
        message: 'Erro ao alterar senha',
        error: error.message
      });
    }
  }
};