const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const IncidentComponents = sequelize.define('IncidentComponents', {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true
    },
    incidentId: {
      type: DataTypes.UUID,
      references: {
        model: 'system_incidents',
        key: 'incidentId'
      }
    },
    componentId: {
      type: DataTypes.UUID,
      references: {
        model: 'system_components',
        key: 'componentId'
      }
    }
  }, {
    tableName: 'incident_components',
    timestamps: false
  });

  return IncidentComponents;
};