const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const FineSettings = sequelize.define('FineSettings', {
    settingsId: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
      comment: 'Identificador único das configurações'
    },
    finePercentage: {
      type: DataTypes.DECIMAL(5,4),
      defaultValue: 0.03,
      validate: {
        min: 0,
        max: 1
      },
      comment: 'Percentual da multa por atraso (0.03 = 3%)'
    },
    maxFinesBeforeWarning: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      validate: {
        min: 1
      },
      comment: 'Número máximo de multas antes de advertência'
    },
    welcomeMessage: {
      type: DataTypes.TEXT,
      defaultValue: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 5px solid #3498db;">
            <h1 style="color: #2c3e50; margin-bottom: 5px;">Bem-vindo(a), {nome_do_inquilino}!</h1>
            <p style="color: #7f8c8d; margin-top: 0;">Estamos felizes em tê-lo como parte da nossa comunidade.</p>
          </div>

          <div style="margin: 25px 0;">
            <p>Prezado(a) {nome_do_inquilino},</p>
            
            <p>É um prazer recebê-lo em nosso sistema de gestão de propriedades. Para garantir uma convivência harmoniosa, gostaríamos de esclarecer nossas políticas:</p>
            
            <div style="background-color: #f1f8fe; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #d1e3f6;">
              <h3 style="color: #2980b9; margin-top: 0;">📅 Política de Pagamentos</h3>
              
              <div style="margin-bottom: 15px;">
                <h4 style="color: #e74c3c; margin-bottom: 5px;">1. Multas por Atraso</h4>
                <p>Caso o pagamento seja realizado após a data de vencimento, será aplicada uma multa de <strong>{porcentagem_da_multa}%</strong> sobre o valor do aluguel.</p>
              </div>
              
              <div style="margin-bottom: 15px;">
                <h4 style="color: #f39c12; margin-bottom: 5px;">2. Advertências</h4>
                <p>Após <strong>{max_fines_before_warning} ocorrências</strong> de atraso, você receberá uma advertência formal por e-mail e SMS.</p>
              </div>
              
              <div>
                <h4 style="color: #c0392b; margin-bottom: 5px;">3. Retirada da Propriedade</h4>
                <p>Em caso de repetidas inadimplências, poderá ser necessária a retomada da propriedade, conforme previsto em contrato.</p>
              </div>
            </div>
            
            <p>Para sua comodidade, oferecemos:</p>
            <ul style="padding-left: 20px;">
              <li>📱 Lembretes automáticos por WhatsApp e e-mail</li>
              <li>💳 Diversas opções de pagamento</li>
              <li>🔄 Renegociação em casos específicos</li>
            </ul>
            
            <p style="margin-top: 20px;">Mantenha seus pagamentos em dia para evitar inconvenientes. Estamos à disposição para esclarecer qualquer dúvida!</p>
            
            <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              <p>Atenciosamente,</p>
              <p style="font-weight: bold; color: #2c3e50;">Equipe de Gestão de Propriedades</p>
              <p style="margin-top: 5px; font-size: 0.9em; color: #7f8c8d;">
                <span style="margin-left: 10px;">Sistema de Gestão Imobiliária</span>
              </p>
            </div>
          </div>
        </div>
      `,
      comment: 'Modelo HTML da mensagem de boas-vindas para novos inquilinos'
    },
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Ativar notificações por e-mail'
    },
    smsNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Ativar notificações por SMS'
    },
    whatsappNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Ativar notificações por WhatsApp'
    },
    paymentReminderDays: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      validate: {
        min: 1,
        max: 30
      },
      comment: 'Dias antes do vencimento para enviar lembrete'
    },
  }, {
    tableName: 'fine_settings',
    timestamps: true, 
    comment: 'Configurações de multa e mensagens por gestor'
  });

  FineSettings.associate = (models) => {
    FineSettings.belongsTo(models.Manager, {
      foreignKey: {
        name: 'managerId',
        allowNull: false
      },
      as: 'manager',
      onDelete: 'CASCADE'
    });
  };

  return FineSettings;
};