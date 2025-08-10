const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const SystemFeature = sequelize.define('SystemFeature', {
    featureId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      comment: 'Identificador único do recurso'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Título do recurso'
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nome do ícone (referência ao Lucide Icons)'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Descrição resumida do recurso'
    },
    details: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array de strings com detalhes do recurso'
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Modelo relacionado no sistema'
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Ordem de exibição'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Se o recurso está ativo'
    }
  }, {
    tableName: 'system_features',
    timestamps: true,
    comment: 'Recursos do sistema para exibição na página de features',
    indexes: [
      {
        unique: true,
        fields: ['title']
      }
    ]
  });

  return SystemFeature;
};