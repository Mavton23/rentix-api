const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const SystemStatus = sequelize.define('SystemStatus', {
    statusId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      comment: 'ID único do status do sistema'
    },
    overallStatus: {
      type: DataTypes.ENUM('operational', 'degraded', 'outage'),
      defaultValue: 'operational',
      allowNull: false,
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



