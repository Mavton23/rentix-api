const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    paymentId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      comment: 'Identificador único do pagamento'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: {
          msg: 'O valor deve ser um número decimal válido'
        }
      },
      comment: 'Valor do pagamento'
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: {
          args: [new Date().toISOString()],
          msg: 'A data de vencimento deve ser futura'
        }
      },
      comment: 'Data de vencimento do pagamento'
    },
    paymentDate: {
      type: DataTypes.DATE, 
      allowNull: true,
      validate: {
        isDate: true
      },
      comment: 'Data em que o pagamento foi realizado'
    },
    isLate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indica se o pagamento está atrasado'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pendente',
      allowNull: false,
      validate: {
        isIn: [['pendente', 'pago', 'atrasado', 'cancelado']]
      },
      comment: 'Estado do pagamento'
    },
    statusChangedAt: {
      type: DataTypes.DATE, 
      allowNull: true,
      validate: {
        isDate: true
      },
      comment: 'Data de alteracao do pagamento'
    },
    fineAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Valor da multa por atraso'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Valor total (valor + multa)'
    },
    fineCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Contador de multas aplicadas'
    },
    lastFineApplied: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: true
      },
      comment: 'Data da ultima aplicacao da multa'
    },
    lastNotificationSent: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: true
      },
      comment: 'Data da última notificação enviada'
    },
    method: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: {
          args: [['pix', 'transferencia', 'dinheiro', 'cartao', null]],
          msg: 'Método de pagamento inválido'
        }
      },
      comment: 'Método de pagamento utilizado'
    },
    referenceMonth: {
      type: DataTypes.STRING, 
      allowNull: false,
      comment: 'Mês de referência (MM/YYYY)'
    },
    cancellationReason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descrição ou observações sobre o pagamento'
    },
    notificationCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Contador de notificações enviadas'
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Referência ao imóvel associado'
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Referência ao inquilino associado'
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Referência ao gestor responsável'
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    paranoid: true,
    comment: 'Registro de pagamentos do sistema'
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Manager, { 
      foreignKey: 'managerId',
      as: 'manager'
    });
    Payment.belongsTo(models.Property, { 
      foreignKey: 'propertyId',
      as: 'property'
    });
    Payment.belongsTo(models.Tenant, { 
        foreignKey: 'tenantId',
        as: 'tenant'
    });
    Payment.hasMany(models.PaymentHistory, {
      foreignKey: 'paymentId',
      as: 'history'
    });
};

  return Payment;
};