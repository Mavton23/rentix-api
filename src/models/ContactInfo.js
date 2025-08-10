const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const ContactInfo = sequelize.define('ContactInfo', {
    infoId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      comment: 'ID único da informação de contato'
    },
    type: {
      type: DataTypes.ENUM('email', 'phone', 'address', 'hours'),
      allowNull: false,
      comment: 'Tipo de informação de contato'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Título da informação (ex: "E-mail", "Telefone")'
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Valor principal da informação'
    },
    additionalValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Valor adicional (ex: segundo telefone)'
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nome do ícone (referência ao Lucide Icons)'
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Ordem de exibição'
    }
  }, {
    tableName: 'contact_infos',
    timestamps: true,
    comment: 'Informações de contato exibidas na página'
  });

  return ContactInfo;
};

