const { DataTypes } = require('sequelize');
const { v4: uuidv4, validate } = require('uuid');

module.exports = (sequelize) => {
  const Property = sequelize.define('Property', {
    propertyId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      comment: 'Identificador único da propriedade'
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Endereço completo da propriedade'
    },
    property_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['casa', 'apartamento', 'comercial', 'terreno']]
      },
      comment: 'Tipo da propriedade'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'disponivel',
      allowNull: false,
      validate: {
        isIn: [['disponivel', 'alugado', 'manutencao', 'indisponivel']]
      },
      comment: 'Status atual da propriedade'
    },
    bedrooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      validate: {
        min: {
          args: [0],
          msg: 'O número de quartos não pode ser negativo'
        },
        customValidator(value) {
          if (this.property_type === 'comercial' && value !== null) {
            throw new Error('Propriedades comerciais não devem ter quartos');
          }
        }
      },
      comment: 'Quantidade de quartos (não aplicável para comerciais)'
    },
    bathrooms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      validate: {
        min: {
          args: [0],
          msg: 'O número de banheiros não pode ser negativo'
        }
      },
      comment: 'Quantidade de banheiros'
    },
    rent_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'O valor do aluguel não pode ser negativo'
        }
      },
      comment: 'Valor do aluguel'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Descrição detalhada da propriedade'
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'ID do gestor proprietário'
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
      comment: 'ID do inquilino atual (se alugado)'
    },
  }, {
    tableName: 'properties',
    timestamps: true,
    hooks: {},
    comment: 'Tabela de propriedades do sistema'
  });

  Property.associate = (models) => {
    Property.belongsTo(models.Manager, { 
      foreignKey: 'owner_id',
      as: 'owner'
    });
    Property.belongsTo(models.Tenant, { 
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    Property.hasMany(models.Payment, { 
      foreignKey: 'propertyId',
      onDelete: 'CASCADE'
    });
  };


  return Property;
};