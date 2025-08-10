const sendEmail = require('./sendMail');
const sendSMS = require('./sendSMS');

async function sendNotification(email, phone, subject, htmlContent) {
  try {
      if (email) {
          await sendEmail(email, subject, htmlContent, { isHtml: true }); // Força HTML
      }
      if (phone) {
          // Remove tags HTML para SMS
          const textContent = htmlContent.replace(/<[^>]*>/g, '');
          await sendSMS(phone, textContent);
      }
  } catch (error) {
      console.error('Erro ao enviar notificação:', error);
  }
}

module.exports = sendNotification;