const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const ContactMessage = sequelize.define('ContactMessage', {
    messageId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      comment: 'ID único da mensagem'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nome do remetente'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'E-mail do remetente'
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Assunto da mensagem'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Conteúdo da mensagem'
    },
    status: {
      type: DataTypes.ENUM('pending', 'read', 'replied', 'archived'),
      defaultValue: 'pending',
      comment: 'Status da mensagem'
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Endereço IP do remetente'
    }
  }, {
    tableName: 'contact_messages',
    timestamps: true,
    comment: 'Mensagens enviadas pelo formulário de contato'
  });

  return ContactMessage;
};