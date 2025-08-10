require('dotenv').config();
const { sendEmail, isValidEmail } = require('../utils/sendMail');

async function sendResetEmail(email, resetToken) {
  
  if (!isValidEmail(email)) {
    throw new Error(`E-mail inválido fornecido: ${email}`);
  }

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const expirationHours = 1;
  
  const emailContent = {
    subject: '🔑 Redefinição de Senha - Rentix',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Redefinição de Senha</h2>
        <p>Você solicitou a redefinição da sua senha no Rentix.</p>
        
        <div style="margin: 20px 0;">
          <a href="${resetLink}" 
             style="background-color: #4f46e5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; font-weight: bold;">
            Redefinir Senha
          </a>
        </div>

        <p style="font-size: 0.9em; color: #666;">
          <strong>Link válido por ${expirationHours} hora(s)</strong><br>
          Se você não solicitou isso, ignore este e-mail.
        </p>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 0.8em; color: #777;">
          <p>Problemas com o botão? Copie e cole este link no seu navegador:</p>
          <p>${resetLink}</p>
        </div>
      </div>
    `,
    text: `Para redefinir sua senha, acesse: ${resetLink}\n\nEste link expira em ${expirationHours} hora(s).`
  };

  return sendEmail({
    to: email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
    priority: 'high'
  });
}

module.exports = {
  sendResetEmail
};