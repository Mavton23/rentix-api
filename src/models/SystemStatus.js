const { DataTypes } = require('sequelize');
const { v4: uuidv4, validate } = require('uuid');

module.exports = (sequelize) => {
  const SystemStatus = sequelize.define('SystemStatus', {
    statusId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      comment: 'ID único do status do sistema'
    },
    overallStatus: {
      type: DataTypes.STRING,
      defaultValue: 'operational',
      allowNull: false,
      validate: {
        isIn: [['operational', 'degraded', 'outage']]
      },
      comment: 'Status geral do sistema'
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Data da última atualização'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mensagem personalizada para o status atual'
    }
  }, {
    tableName: 'system_status',
    timestamps: false,
    comment: 'Status geral do sistema'
  });

  return SystemStatus;
};



