const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const SystemIncident = sequelize.define('SystemIncident', {
    incidentId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      comment: 'ID único do incidente'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Título do incidente'
    },
    status: {
      type: DataTypes.ENUM('investigating', 'identified', 'monitoring', 'resolved'),
      defaultValue: 'investigating',
      allowNull: false,
      comment: 'Status do incidente'
    },
    impact: {
      type: DataTypes.ENUM('critical', 'major', 'minor', 'none'),
      defaultValue: 'minor',
      allowNull: false,
      comment: 'Impacto do incidente'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Data de início do incidente'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Data da última atualização'
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data de resolução'
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detalhes do incidente'
    }
  }, {
    tableName: 'system_incidents',
    timestamps: false,
    comment: 'Incidentes do sistema'
  });

  SystemIncident.associate = (models) => {
    SystemIncident.belongsToMany(models.SystemComponent, {
      through: 'IncidentComponents',
      foreignKey: 'incidentId',
      as: 'components'
    });
  };

  return SystemIncident;
};