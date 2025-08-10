const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

module.exports = (sequelize) => {
  const Manager = sequelize.define('Manager', {
    managerId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      comment: 'Identificador único do gestor'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nome completo do gestor'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'email_unique',
      comment: 'E-mail profissional do gestor'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: 'phone_unique',
      comment: 'Telefone para contato'
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Hash da senha do gestor'
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.STRING,
      allowNull: true
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL do avatar do gestor'
    },
    status: {
      type: DataTypes.ENUM('ativo', 'inativo', 'suspenso'),
      defaultValue: 'ativo',
      allowNull: false,
      comment: 'Status do gestor no sistema'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data do último login'
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'supervisor'),
      defaultValue: 'manager',
      allowNull: false,
      comment: 'Nível de acesso do usuário'
    },
    permissions: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Permissões específicas (opcional para controle granular)'
    }
  }, {
    tableName: 'managers',
    timestamps: true,
    comment: 'Tabela de gestores do sistema',
    indexes: [
      {
        unique: true,
        name: 'email_unique',
        fields: ['email']
      },
      {
        unique: true,
        name: 'phone_unique',
        fields: ['phone'],
        where: {
          phone: {
            [Op.ne]: null
          }
        }
      }
    ]
  });

  Manager.associate = (models) => {
    Manager.hasMany(models.Property, { 
      foreignKey: 'owner_id',
      onDelete: 'CASCADE'
    });
    Manager.hasMany(models.Payment, { 
      foreignKey: 'managerId',
      as: 'payments',
      onDelete: 'CASCADE'
    });
    Manager.hasMany(models.Tenant, { 
        foreignKey: 'managerId',
        onDelete: 'CASCADE'
    });
    Manager.hasMany(models.NotificationLog, { 
        foreignKey: 'managerId',
        as: 'notifications',
        onDelete: 'CASCADE'
    });
    Manager.hasMany(models.PaymentHistory, { 
        foreignKey: 'changedBy',
        onDelete: 'CASCADE'
    });

    Manager.hasOne(models.FineSettings, {
        foreignKey: 'managerId',
        as: 'fineSettings'
    });
};

  return Manager;
};