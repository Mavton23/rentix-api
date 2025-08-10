const { v4: uuidv4 } = require('uuid')
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const NotificationLog = sequelize.define('NotificationLog', {
        logId: {
            type: DataTypes.UUID,
            defaultValue: () => uuidv4(),
            primaryKey: true,
        },
        tenantId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        sentAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        managerId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'Referência ao gestor responsável pela notificação'
        }
    })

    NotificationLog.associate = (models) => {
        NotificationLog.belongsTo(models.Manager, { 
            foreignKey: 'managerId',
            as: 'manager'
        });
        NotificationLog.belongsTo(models.Tenant, { 
            foreignKey: 'tenantId',
            as: 'tenant'
        });
    };

    return NotificationLog;
};
