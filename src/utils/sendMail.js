require('dotenv').config();
const nodemailer = require('nodemailer');

// Configuração reutilizável do transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_ACCOUNT,
      pass: process.env.EMAIL_PASS
    },
    pool: true, // Usar conexão persistente
    maxConnections: 5,
    maxMessages: 100
  });
};

const transporter = createTransporter();

// Validador de e-mail robusto
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

async function sendEmail({ to, subject, html, text, priority = 'normal' }) {
  // Validação estrita
  if (!isValidEmail(to)) {
    throw new Error(`Formato de e-mail inválido: ${to}`);
  }

  if (!subject || !html) {
    throw new Error('Assunto e conteúdo HTML são obrigatórios');
  }

  const mailOptions = {
    from: `"${process.env.APP_NAME || 'Rentix'}" <${process.env.EMAIL_ACCOUNT}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
    priority: ['high', 'normal', 'low'].includes(priority) ? priority : 'normal',
    headers: {
      'X-Priority': priority === 'high' ? '1' : priority === 'low' ? '5' : '3',
      'X-Mailer': 'Rentix Mail Service'
    }
  };

  try {
    const info = transporter.sendMail(mailOptions);
    console.log(`[Email Service] E-mail enviado para ${to} | Assunto: "${subject}" | MessageID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted
    };
  } catch (error) {
    console.error(`[Email Service] Falha no envio para ${to}`, {
      error: error.message,
      subject
    });
    
    // Reconexão automática para erros de conexão
    if (error.code === 'ECONNECTION') {
      console.log('[Email Service] Tentando reconexão...');
      transporter.close();
      const newTransporter = createTransporter();
      return sendEmail({ to, subject, html, text, priority });
    }

    throw {
      ...error,
      metadata: {
        recipient: to,
        subject,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Verificação de conexão ao iniciar
transporter.verify((error) => {
  if (error) {
    console.error('[Email Service] Falha na conexão com servidor SMTP:', error);
  } else {
    console.log('[Email Service] Pronto para enviar e-mails');
  }
});

module.exports = {
  sendEmail,
  isValidEmail // Exportando para uso em outros serviços
};