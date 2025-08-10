const { Manager } = require('../../models');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { sequelize } = require('../../configs/db');
const { Op } = require('sequelize');

module.exports = {
  /**
   * Lista todos os managers
   */
  getAllManagers: async (req, res) => {
    try {
      const managers = await Manager.findAll({
        where: {
          role: { [Op.ne]: 'admin' }
        },
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']]
      });
      res.json(managers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * Cria um novo manager
   */
  createManager: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const transaction = await sequelize.transaction();
    try {
      const { password, ...managerData } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const manager = await Manager.create({
        ...managerData,
        password: hashedPassword
      }, { transaction });
      
      // Não retornar a senha
      const managerWithoutPassword = manager.toJSON();
      delete managerWithoutPassword.password;
      
      await transaction.commit();
      res.status(201).json(managerWithoutPassword);
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Obtém um manager por ID
   */
  getManagerById: async (req, res) => {
    try {
      const { id } = req.params;
      const manager = await Manager.findByPk(id, {
        attributes: { exclude: ['password'] }
      });
      
      if (!manager) {
        return res.status(404).json({ message: 'Manager não encontrado' });
      }
      
      res.json(manager);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  /**
   * Atualiza um manager
   */
  updateManager: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { password, ...updateData } = req.body;
      
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      
      const [updated] = await Manager.update(updateData, {
        where: { managerId: id }
      });
      
      if (!updated) {
        return res.status(404).json({ message: 'Manager não encontrado' });
      }
      
      const updatedManager = await Manager.findByPk(id, {
        attributes: { exclude: ['password'] }
      });
      res.json(updatedManager);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Atualiza o status de um manager
   */
  updateManagerStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['ativo', 'inativo', 'suspenso'].includes(status)) {
        return res.status(400).json({ message: 'Status inválido' });
      }
      
      const [updated] = await Manager.update({ status }, {
        where: { managerId: id }
      });
      
      if (!updated) {
        return res.status(404).json({ message: 'Manager não encontrado' });
      }
      
      res.json({ message: 'Status atualizado com sucesso' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Remove um manager (soft delete)
   */
  deleteManager: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Manager.destroy({
        where: { managerId: id }
      });
      
      if (!deleted) {
        return res.status(404).json({ message: 'Manager não encontrado' });
      }
      
      res.json({ message: 'Manager removido com sucesso' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};