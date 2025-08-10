const { v4:uuidv4 } = require('uuid')
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const PaymentHistory = sequelize.define('PaymentHistory', {
        historyId: {
            type: DataTypes.UUID,
            defaultValue: () => uuidv4(),
            primaryKey: true,
            comment: 'Identificador único do histórico'
        },
        paymentId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'Referência ao pagamento associado'
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Ação realizada no pagamento'
        },
        oldValue: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Valor anterior antes da alteração'
        },
        newValue: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Novo valor após a alteração'
        },
        changedBy: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'Gestor que fez a alteração'
        },
        changeDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false,
            comment: 'Data em que a alteração foi realizada'
        }
    }, {
        timestamps: false,
        tableName: 'payment_history',
        comment: 'Tabela de histórico de pagamentos'
    });

    PaymentHistory.associate = (models) => {
        PaymentHistory.belongsTo(models.Manager, { 
            foreignKey: 'changedBy',
            as: 'changedByManager'
        });
        PaymentHistory.belongsTo(models.Payment, { 
            foreignKey: 'paymentId',
            as: 'payment'
        });
    };

    return PaymentHistory;

}
