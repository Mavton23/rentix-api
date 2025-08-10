require('dotenv').config();
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const { ContactInfo, ContactMessage } = require('../models');
const { initializeContactData } = require('../helpers/contactInitialData');

// Configuração do transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_ACCOUNT,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = {
//     sendMessage: async (req, res, next) => {
//     try {
//       const { name, email, subject, message } = req.body;
      
//       const newMessage = await ContactMessage.create({
//         name,
//         email,
//         subject,
//         message,
//         ipAddress: req.ip
//       });

//       // Aqui você pode adicionar lógica para enviar e-mail de notificação

//       res.status(201).json({
//         success: true,
//         message: 'Mensagem enviada com sucesso!'
//       });
//     } catch (error) {
//       next(error);
//     }
//   },
    sendMail: async (req, res) => {
        const errors = validationResult(req);

        // Verifica se há erros de validação
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
                }))
            });
        }

        const { name, email, subject, message } = req.body;

        const mailOptions = {
            from: `"Rentix Contato" <${process.env.EMAIL_ACCOUNT}>`,
            to: 'nordinomaviedeveloper@gmail.com',
            replyTo: email,
            subject: `[Contato] ${subject}`,
            text: `Você recebeu uma nova mensagem de contato:\n\nNome: ${name}\nEmail: ${email}\n\nMensagem:\n${message}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4f46e5;">Nova mensagem de contato</h2>
                <p><strong>Nome:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Assunto:</strong> ${subject}</p>
                <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
                <p style="white-space: pre-line;">${message}</p>
                </div>
                <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                Esta mensagem foi enviada através do formulário de contato do seu site.
                </p>
            </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            res.status(500).json({ 
            success: false, 
            message: 'Erro ao enviar mensagem. Tente novamente mais tarde.' 
            });
        }
    },

    getContactInfo: async (req, res, next) => {
      try {
        // Verifica e insere dados iniciais se necessário
        await initializeContactData(ContactInfo);
        
        const contactInfo = await ContactInfo.findAll({
          order: [['order', 'ASC']],
          attributes: ['infoId', 'type', 'title', 'value', 'additionalValue', 'icon']
        });
        
        res.json(contactInfo);
      } catch (error) {
        next(error);
      }
  },

  updateContactInfo: async (req, res, next) => {
    try {
      const { updates } = req.body;
      
      await Promise.all(
        updates.map(async (update) => {
          await ContactInfo.update(
            { 
              value: update.value,
              additionalValue: update.additionalValue 
            },
            { where: { type: update.type } }
          );
        })
      );
      
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  getMessages: async (req, res, next) => {
    try {
      const messages = await ContactMessage.findAll({
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['ipAddress'] }
      });
      
      res.json(messages);
    } catch (error) {
      next(error);
    }
  }
}