require('dotenv').config();
const bcrypt = require('bcrypt');
const { sendEmail } = require('../utils/sendMail'); // Note a desestruturação aqui
const sendSMS = require('../utils/sendSMS');

module.exports = (models) => {
  const beforeCreateManager = async (manager) => {
      try {
          if (manager.password) {
              const hash = await bcrypt.hash(manager.password, 12);
              manager.password = hash;
          }
      } catch (error) {
          console.log('Erro ao criptografar a senha:', error instanceof Error ? error.message : error);
          throw new Error('Erro ao criptografar a senha');
      }
  };

  const afterCreateManager = async (manager) => {  
    try {
        // Envia comunicações de boas-vindas
        await sendWelcomeCommunications(manager);
    } catch (error) {
        console.error('Erro no afterCreateManager:', error);
    }
  }
    
  async function sendWelcomeCommunications(manager) {
    const appUrl = process.env.APP_URL || 'https://rentix.com';
    const appName = process.env.APP_NAME || 'Rentix';
    
    const welcomeSubject = `Bem-vindo à Plataforma ${appName}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${welcomeSubject}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; padding: 0; border: 1px solid #e1e1e1; border-radius: 8px; overflow: hidden; }
          .header { background-color: #4f46e5; color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px; background-color: #ffffff; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
          .footer { margin-top: 30px; padding: 20px; font-size: 12px; color: #6b7280; text-align: center; background-color: #f9fafb; }
          .info-item { margin-bottom: 15px; }
          .info-label { font-weight: 600; color: #4f46e5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bem-vindo, ${manager.name}!</h1>
          </div>
          <div class="content">
            <p>Sua conta de gestor foi criada com sucesso na plataforma ${appName}.</p>
            
            <div class="info-item">
              <span class="info-label">Email:</span> ${manager.email}
            </div>
            
            <div class="info-item">
              <span class="info-label">Acesso:</span> <a href="${appUrl}">${appUrl}</a>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}" class="button">Acessar Plataforma</a>
            </div>
            
            <p>Em caso de dúvidas, entre em contato com nosso suporte: <a href="mailto:${process.env.SUPPORT_EMAIL || 'suporte@rentix.com'}">${process.env.SUPPORT_EMAIL || 'suporte@rentix.com'}</a></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${appName}. Todos os direitos reservados.</p>
            <p>Esta é uma mensagem automática, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  
    // Texto alternativo para clientes de e-mail que não suportam HTML
    const textContent = `
      Bem-vindo à ${appName}, ${manager.name}!
      
      Sua conta de gestor foi criada com sucesso.
      
      Acesse: ${appUrl}
      Email: ${manager.email}
      
      Em caso de dúvidas, contate nosso suporte: ${process.env.SUPPORT_EMAIL || 'suporte@rentix.com'}
      
      © ${new Date().getFullYear()} ${appName}. Todos os direitos reservados.
    `;
  
    // Envia e-mail estilizado - CORREÇÃO AQUI
    if (manager.email) {
      await sendEmail({
        to: manager.email,
        subject: welcomeSubject,
        html: htmlContent,
        text: textContent
      });
    }

    // Envia SMS
    if (manager.phone) {
        await sendSMS(
          manager.phone,
          `Olá ${manager.name.split(' ')[0]}, sua conta foi criada. Acesse: ${process.env.APP_URL}`
        );
    }
  }

  return {
    beforeCreateManager,
    afterCreateManager
  }
}