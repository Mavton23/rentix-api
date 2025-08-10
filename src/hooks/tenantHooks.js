require('dotenv').config();
const sendNotification = require('../utils/sendNotification');

module.exports = (models) => {
    const beforeDestroyTenant = async (tenant, options) => {
        try {
            if (options.force) {
                // Dados para a notificação
                const notificationData = {
                    email: tenant.email,
                    phone: tenant.phone,
                    subject: 'Status da sua conta',
                    message: `Prezado(a) ${tenant.name},\n\n` +
                            `Sua conta no sistema de gestão foi encerrada.\n\n` +
                            `Motivo: Exclusão definitiva da conta\n` +
                            `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n` +
                            `Caso acredite que isto seja um erro, por favor entre em contato com nosso suporte.\n\n` +
                            `Atenciosamente,\nEquipe de Gestão`
                };

                // Envia notificação por e-mail e SMS
                if (tenant.email || tenant.phone) {
                    await sendNotification(
                        notificationData.email,
                        notificationData.phone,
                        notificationData.subject,
                        notificationData.message
                    );
                }
            }

        } catch (error) {
            console.error('Erro no hook beforeDestroyTenant:', error);
            
            if (options.transaction) {
                await options.transaction.rollback();
            }
            
            throw new Error('Falha ao processar a exclusão do inquilino');
        }
    }

    return {
        beforeDestroyTenant
    }
}