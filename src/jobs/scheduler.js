const cron = require('node-cron');
const UnifiedPaymentNotificationService = require('../services/UnifiedPaymentNotificationService');
const logger = require('../utils/logger');
const paymentHooks = require('../hooks/paymentHooks');
const models = require('../models'); 

class Scheduler {
    static init() {
        // Inicializa os hooks de pagamento
        const hooks = paymentHooks(models);

        // Executa diariamente às 9h
        cron.schedule('0 9 * * *', async () => {
            try {
                const result = await UnifiedPaymentNotificationService.sendAllPaymentNotifications();
                logger.info(`Notificações de pagamento: ${result.message}`);
            } catch (error) {
                logger.error('Erro no agendamento de notificações:', error);
            }
        });

        // Executa no primeiro dia de cada mês à meia-noite
        cron.schedule('0 0 1 * *', async () => {
            try {
                logger.info('Iniciando reset mensal de multas...');
                const count = await hooks.resetMonthlyFines();
                logger.info(`Reset de multas concluído para ${count} pagamentos.`);
            } catch (error) {
                logger.error('Erro no reset mensal de multas:', error);
            }
        });

        logger.info('Agendador configurado com:');
        logger.info('- Notificações de pagamento diárias às 9:00');
        logger.info('- Reset mensal de multas no primeiro dia do mês à 0:00');
    }
}

module.exports = Scheduler;