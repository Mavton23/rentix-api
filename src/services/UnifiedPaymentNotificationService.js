const { Manager, Tenant, Property, Payment } = require('../models');
const sendPaymentNotification = require('../utils/sendPaymentNotification');
const models = require('../models');
const createPaymentHistory = require('../utils/createPaymentHistory')(models);
const { Op } = require('sequelize');
const { sequelize } = require('../configs/db');

class UnifiedPaymentNotificationService {
    /**
     * Envia todas as notificações de pagamento (pendentes, atrasados e críticos)
     */
    static async checkStatusChanges() {
        const transaction = await sequelize.transaction();

        try {
            const payments = await Payment.findAll({
                where: {
                    statusChangedAt: {
                        [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000)
                    },
                    lock: transaction.LOCK.UPDATE,
                    transaction
                },
                include: [
                    {
                        model: Manager,
                        as: 'manager'
                    },
                    {
                        model: Tenant,
                        as: 'tenant'
                    }
                ],
                order: [['createdAt', 'DESC']],
            });
        
            for (const payment of payments) {
                switch(payment.status) {
                    case 'pago':
                        await sendPaymentNotification('payment_paid', payment, payment.tenant, payment.manager);
                        break;
                    case 'atrasado':
                        await sendPaymentNotification('payment_overdue', payment, payment.tenant, payment.manager);
                        break;
                }
                await payment.update({ statusChangedAt: null }, { transaction });
            }
            
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            console.log("Erro no checkStatusChanges: ", error instanceof Error ? error.message : error);
            throw error
        }
    }

    static async sendAllPaymentNotifications() {
        try {
            const managers = await Manager.findAll({
                where: { status: 'ativo' }
            });

            let results = {
                pending: 0,
                overdue: 0,
                critical: 0
            };

            for (const manager of managers) {
                const { pendingPayments, overduePayments, criticalPayments } = 
                    await this.#getPaymentsForNotification(manager.managerId);

                for (const payment of pendingPayments) {
                    await sendPaymentNotification('reminder_pending', payment, payment.tenant, manager);
                    await this.#trackNotification(payment, manager, 'Lembrete de pagamento pendente enviado');
                    results.pending++;
                }

                for (const payment of overduePayments) {
                    const daysLate = this.#calculateDaysLate(payment.dueDate);
                    await sendPaymentNotification('reminder_overdue', payment, payment.tenant, manager, { daysLate });
                    await this.#trackNotification(payment, manager, 'Notificação de pagamento atrasado enviada');
                    results.overdue++;
                }

                for (const payment of criticalPayments) {
                    const daysLate = this.#calculateDaysLate(payment.dueDate);
                    await sendPaymentNotification('reminder_critical', payment, payment.tenant, manager, { daysLate });
                    await this.#trackNotification(payment, manager, 'Alerta de pagamento crítico enviado');
                    await this.#sendManagerCriticalAlert(payment, manager, daysLate);
                    results.critical++;
                }
            }

            return {
                success: true,
                data: {
                    totalManagers: managers.length,
                    notificationsSent: results
                },
                message: `Notificações enviadas: ${results.pending} pendentes, ${results.overdue} atrasadas, ${results.critical} críticas`
            };
        } catch (error) {
            console.error('Erro no serviço unificado de notificações:', error);
            throw error;
        }
    }

    /**
     * Obtém pagamentos que precisam de notificação
     */
    static async #getPaymentsForNotification(managerId) {
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);

        return {
            pendingPayments: await Payment.findAll({
                where: {
                    status: 'pendente',
                    managerId,
                    dueDate: { [Op.gt]: now },
                    notificationCount: 0
                },
                include: this.#getPaymentIncludes()
            }),

            overduePayments: await Payment.findAll({
                where: {
                    status: 'atrasado',
                    managerId,
                    dueDate: { [Op.between]: [sevenDaysAgo, now] }, // Atraso recente
                    notificationCount: { [Op.lt]: 3 } // Limite de 3 notificações
                },
                include: this.#getPaymentIncludes()
            }),

            criticalPayments: await Payment.findAll({
                where: {
                    status: 'atrasado',
                    managerId,
                    dueDate: { 
                        [Op.lt]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) 
                    },
                    [Op.or]: [
                        { notificationCount: { [Op.between]: [3, 5] } },
                        { 
                            notificationCount: { [Op.gte]: 6 },
                            lastNotificationSent: { 
                                [Op.lt]: new Date(new Date() - 3 * 24 * 60 * 60 * 1000) 
                            }
                        }
                    ]
                },
                include: this.#getPaymentIncludes()
            })
        };
    }

    /**
     * Configuração padrão para includes
     */
    static #getPaymentIncludes() {
        return [
            { 
                model: Tenant,
                as: 'tenant',
                attributes: ['name', 'email', 'phone'],
                required: true 
            },
            {
                model: Property,
                as: 'property',
                attributes: ['address'],
                required: true
            },
            {
                model: Manager,
                as: 'manager',
                attributes: ['name', 'email'],
                required: true
            }
        ];
    }

    /**
     * Notifica o gestor sobre situações críticas
     */
    static async #sendManagerCriticalAlert(payment, manager, daysLate) {
        if (!payment.tenant || !manager.email) {
            console.warn(`Cannot send critical alert for payment ${payment.paymentId} - missing data`);
            return;
        }
        
        const subject = `🚨 ALERTA: Pagamento Muito Atrasado - ${payment.tenant.name}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e74c3c;">Alerta de Pagamento Crítico</h2>
                
                <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e74c3c;">
                    <p>O inquilino <strong>${payment.tenant.name}</strong> está com um pagamento atrasado há <strong>${daysLate} dias</strong>.</p>
                    <p><strong>Referência:</strong> ${payment.referenceMonth}</p>
                    <p><strong>Valor:</strong> ${payment.amount}</p>
                    <p><strong>Multa acumulada:</strong> ${payment.fineAmount}</p>
                    <p><strong>Endereço:</strong> ${payment.property.address}</p>
                </div>

                <p>Ações recomendadas:</p>
                <ul>
                    <li>Contatar o inquilino urgentemente</li>
                    <li>Verificar possibilidade de cobrança jurídica</li>
                    <li>Avaliar medidas administrativas</li>
                </ul>
            </div>
        `;

        await sendPaymentNotification({
            to: manager.email,
            subject,
            html
        });
    }

    /**
     * Registra a notificação no histórico
     */
    static async #trackNotification(payment, manager, message) {
        await payment.update({ 
            notificationCount: payment.notificationCount + 1,
            lastNotificationSent: new Date()
        });

        createPaymentHistory(
            payment.paymentId,
            message,
            { notificationCount: payment.notificationCount },
            { notificationCount: payment.notificationCount + 1 },
            manager.managerId
        );
    }

    /**
     * Utilitários
     */
    static #calculateDaysLate(dueDate) {
        return Math.floor((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24));
    }
}

module.exports = UnifiedPaymentNotificationService;
