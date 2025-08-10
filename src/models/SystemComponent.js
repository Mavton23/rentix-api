const { DataTypes } = require('sequelize');
const { v4: uuidv4, validate } = require('uuid');

module.exports = (sequelize) => {
  const SystemComponent = sequelize.define('SystemComponent', {
    componentId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      comment: 'ID único do componente'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nome do componente'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'operational',
      allowNull: false,
      validate: {
        isIn: [['operational', 'degraded', 'outage']]
      },
      comment: 'Status atual do componente'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descrição do componente'
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Ordem de exibição'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Se o componente está ativo'
    }
  }, {
    tableName: 'system_components',
    timestamps: true,
    comment: 'Componentes do sistema para monitoramento'
  });

  return SystemComponent;
};