const { v4: uuid4 } = require('uuid')
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Tenant = sequelize.define('Tenant', {
    tenantId: {
        type: DataTypes.UUID,
        defaultValue: () => uuid4(),
        primaryKey: true,
        comment: 'Identificador único do inquilino'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Nome completo do inquilino'
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'E-mail do inquilino (deve ser único)'
    },
    binum: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Número de identificação do inquilino (ex: BI, CPF, etc.)'
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Idade do inquilino'
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Número de telefone do inquilino'
    },
    status: {
        type: DataTypes.ENUM('ativo', 'inativo', 'expulso'),
        defaultValue: 'inativo',
        allowNull: false,
        comment: 'Status do inquilino (ex: Ativo, Inativo, Pendente)'
    },
    marital_status: {
        type: DataTypes.ENUM('solteiro(a)', 'casado(a)', 'divorciado(a)', 'viúvo(a)'),
        defaultValue: 'solteiro(a)',
        allowNull: false,
        comment: 'Estado civil do inquilino (ex: Solteiro, Casado)'
    },
    job: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Profissão ou ocupação do inquilino'
    },
    emergencyNum: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Número de telefone de emergência'
    },
    join_in: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        comment: 'Data de entrada do inquilino'
    },
    leave_in: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Data de saída do inquilino'
    },
    observation: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Observações adicionais sobre o inquilino'
    },
    managerId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'ID do gestor pertencente'
    }
}, {
    timestamps: true,
    hooks: {},
    tableName: 'tenants',
    comment: 'Tabela de inquilinos'
});

Tenant.associate = (models) => {
    Tenant.belongsTo(models.Manager, { 
      foreignKey: 'managerId'
    });
    Tenant.hasMany(models.Payment, { 
      foreignKey: 'tenantId',
      as: 'payments',
      onDelete: 'CASCADE'
    });
    Tenant.hasMany(models.Property, { 
        foreignKey: 'tenantId',
        as: 'properties'
    });
    Tenant.hasMany(models.NotificationLog, { 
        foreignKey: 'tenantId',
        as: 'notificationLogs',
        onDelete: 'CASCADE'
    });
};

    return Tenant;

}