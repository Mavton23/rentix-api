const sendPaymentNotification = require('../utils/sendPaymentNotification');
const { Op } = require('sequelize');

module.exports = (models) => {
    const createPaymentHistory = require('../utils/createPaymentHistory')(models);
    
    const beforeCreatePayment = async (payment) => {
        try {
            payment.fineAmount = 0;
            payment.totalAmount = payment.amount;
            payment.fineCount = 0;
            
            // Verifica se já existe um pagamento para o mesmo inquilino no mesmo mês
            const existingPayment = await models.Payment.findOne({
                where: {
                    tenantId: payment.tenantId,
                    referenceMonth: payment.referenceMonth,
                    managerId: payment.managerId,
                     status: {
                        [Op.not]: 'cancelado'
                    }
                }
            });

            if (existingPayment) {
                throw new Error(`Já existe um pagamento para este inquilino no mês ${payment.referenceMonth}`);
            }
        } catch (error) {
            console.error('Erro no hook beforeCreatePayment:', error);
            throw error;
        }
    };

    const beforeSavePayment = async (payment) => {
        try {
            // Calcula o totalAmount sempre que amount ou fineAmount mudar
            if (payment.changed('amount') || payment.changed('fineAmount')) {
                payment.totalAmount = parseFloat((payment.amount + payment.fineAmount));
            }
            
            // Validações adicionais
            if (payment.fineAmount < 0) {
                payment.fineAmount = 0;
            }
            
            if (payment.totalAmount < payment.amount) {
                payment.totalAmount = payment.amount;
            }
        } catch (error) {
            console.error('Erro no hook beforeSavePayment:', error);
            throw error;
        }
    };

    const afterCreatePayment = async (payment, options) => {
        const { transaction } = options || {};

        try {
            const [tenant, manager] = await Promise.all([
                models.Tenant.findByPk(payment.tenantId, { transaction }),
                models.Manager.findByPk(payment.managerId, { transaction })
            ]);
    
            // Verifica e envia notificações apenas se houver email válido
            const notifications = [];

            if (tenant?.email) {
                notifications.push(
                    sendPaymentNotification('payment_created', payment, tenant, manager)
                        .catch(e => console.error('Erro ao notificar inquilino:', e))
                );
            }

            if (manager?.email) {
                notifications.push(
                    sendPaymentNotification('payment_created_manager', payment, tenant, manager)
                        .catch(e => console.error('Erro ao notificar gestor:', e))
                );
            }

            await Promise.all(notifications);
    
            await createPaymentHistory(
                payment.paymentId,
                'Pagamento registrado e notificações enviadas',
                null,
                payment.toJSON(),
                payment.managerId,
                { transaction }
            );

            await models.NotificationLog.create({
                tenantId: payment.tenantId,
                message: 'Pagamento registrado e notificações enviadas',
                sendAt: new Date(),
                managerId: payment.managerId
            }, { transaction });
        } catch (error) {
            console.error('Erro no hook afterCreatePayment:', error);
            throw error;
        }
    };

    const beforeUpdatePayment = async (payment) => {
        try {
            if (!payment.changed()) return;

            const now = new Date();
            const dueDate = new Date(payment.dueDate);
            const previousStatus = payment.previous('status');
            const currentStatus = payment.status;

            // Marca mudança de status
            if (payment.changed('status')) {
                payment.statusChangedAt = now;
            }

            // Lógica de multa e status
            if (currentStatus === 'pago' && previousStatus !== 'pago') {
                await handlePaidStatus(payment, now, dueDate);
            } else if (currentStatus === 'pendente' && now > dueDate) {
                await handleOverduePayment(payment);
            } else if (currentStatus === 'cancelado' && previousStatus !== 'cancelado') {
                await handleCancellation(payment, now);
            }
        } catch (error) {
            console.error('Erro no hook beforeUpdatePayment:', error);
            throw error;
        }
    };
    
    async function handlePaidStatus(payment, paymentDate, dueDate) {
        if (paymentDate > dueDate) {
            await applyLatePaymentFine(payment);
        }
        
        // Garante que a data de pagamento está definida
        if (!payment.paymentDate) {
            payment.paymentDate = paymentDate;
        }
    }

    async function handleOverduePayment(payment) {
        await applyLatePaymentFine(payment);
        payment.status = 'atrasado';
        payment.statusChangedAt = new Date();
    }

    async function handleCancellation(payment, cancellationDate) {
        // Marca como cancelado sem deletar
        payment.deletedAt = cancellationDate;
        payment.cancellationDate = cancellationDate;
        
        // Adiciona razão do cancelamento (poderia ser um campo adicional)
        payment.cancellationReason = payment.cancellationReason || "Cancelado pelo gestor";
        
        // Cria registro de auditoria
        await createPaymentHistory(
            payment.paymentId,
            'Pagamento cancelado',
            { status: payment.previous('status') },
            { 
                status: 'cancelado',
                cancellationDate,
                cancellationReason: payment.cancellationReason
            },
            payment.managerId
        );

        await models.NotificationLog.create({
            tenantId: payment.tenantId,
            message: 'Pagamento cancelado e notificações enviadas',
            sendAt: new Date(),
            managerId: payment.managerId
        });
        
        try {
            const [tenant, manager] = await Promise.all([
                models.Tenant.findByPk(payment.tenantId, {
                    attributes: ['tenantId', 'name', 'email', 'phone'],
                    where: { email: { [Op.not]: null } }
                }),
                models.Manager.findByPk(payment.managerId, {
                    attributes: ['managerId', 'name', 'email', 'phone'], 
                    where: { email: { [Op.not]: null } }
                })
            ]);
        
            // Notificações com verificação dupla (existência do objeto E email válido)
            const notifications = [];
            
            if (tenant?.email) {
                notifications.push(
                    sendPaymentNotification('payment_canceled', payment, tenant, manager)
                        .catch(e => console.error(`Falha ao notificar tenant ${tenant.id}:`, e))
                );
            }
        
            if (manager?.email) {
                notifications.push(
                    sendPaymentNotification('payment_canceled_manager', payment, tenant, manager)
                        .catch(e => console.error(`Falha ao notificar manager ${manager.id}:`, e))
                );
            }
        
            await Promise.all(notifications);
        
        } catch (error) {
            console.error('Erro no processo de notificação:', error);
        }

    }

    async function applyLatePaymentFine(payment) {
        const fineSettings = await models.FineSettings.findOne({
            where: { managerId: payment.managerId },
            transaction: payment.sequelize?.transaction
        });

        if (fineSettings?.finePercentage > 0) {
            const fineAmount = calculateFine(payment.amount, fineSettings.finePercentage);
            updatePaymentWithFine(payment, fineAmount);
            await recordFineApplication(payment, fineAmount);
        }
    }

    function calculateFine(amount, percentage) {
        return parseFloat((amount * percentage).toFixed(2));
    }

    function updatePaymentWithFine(payment, fineAmount) {
        payment.fineAmount = fineAmount;
        payment.totalAmount = parseFloat((payment.amount + fineAmount).toFixed(2));
        payment.fineCount = (payment.fineCount || 0) + 1;
        payment.lastFineApplied = new Date();
    }

    async function recordFineApplication(payment, fineAmount) {
        await createPaymentHistory(
            payment.paymentId,
            'Multa aplicada por atraso',
            { 
                status: payment.previous('status'),
                fineAmount: payment.previous('fineAmount') 
            },
            { 
                status: 'atrasado',
                fineAmount,
                fineCount: payment.fineCount
            },
            payment.managerId,
            payment.sequelize?.transaction
        );

        await models.NotificationLog.create({
            tenantId: payment.tenantId,
            message: 'Multa aplicada a um inquilino e notificações enviadas',
            sendAt: new Date(),
            managerId: payment.managerId
        });
    }

    async function resetMonthlyFines() {
        const transaction = await models.sequelize.transaction();
        
        try {
            const now = new Date();
            const currentMonth = now.toISOString().slice(0, 7);
            
            // Encontra todos os pagamentos pendentes/atrasados de meses anteriores
            const payments = await models.Payment.findAll({
                where: {
                    status: ['pendente', 'atrasado'],
                    referenceMonth: {
                        [Op.ne]: currentMonth
                    }
                },
                transaction
            });
            
            // Reseta as multas para cada pagamento
            for (const payment of payments) {
                await payment.update({
                    fineAmount: 0,
                    totalAmount: payment.amount,
                    isLate: false,
                    status: 'pendente'
                }, { transaction });
            }
            
            await transaction.commit();
            console.log(`Reset de multas concluído para ${payments.length} pagamentos.`);
            return payments.length;
        } catch (error) {
            await transaction.rollback();
            console.error('Erro no reset mensal de multas:', error);
            throw error;
        }
    }

    const afterUpdatePayment = async (payment) => {
        try {
            if (!payment.changed('status')) return;

            const tenant = await models.Tenant.findByPk(payment.tenantId);
            if (!tenant) return;

            const previousStatus = payment.previous('status');
            const currentStatus = payment.status;

            await createPaymentHistory(
                payment.paymentId,
                `Status atualizado para ${currentStatus}`,
                { status: previousStatus },
                buildStatusUpdateData(payment, currentStatus),
                payment.managerId
            );

            await models.NotificationLog.create({
                tenantId: payment.tenantId,
                message: 'Pagamento atualizado',
                sendAt: new Date(),
                managerId: payment.managerId
            });

        } catch (error) {
            console.error('Erro no hook afterUpdatePayment:', error);
        }
    }

    function buildStatusUpdateData(payment, currentStatus) {
        const data = { status: currentStatus };
        
        if (currentStatus === 'pago') {
            data.paymentDate = payment.paymentDate || new Date();
        } else if (currentStatus === 'atrasado') {
            data.fineAmount = payment.fineAmount;
            data.totalAmount = payment.totalAmount;
        }
        
        return data;
    }

    return {
        beforeCreatePayment,
        beforeSavePayment,
        afterCreatePayment,
        beforeUpdatePayment,
        afterUpdatePayment,
        resetMonthlyFines,
        _internal: {
            handlePaidStatus,
            handleOverduePayment,
            applyLatePaymentFine,
            calculateFine,
            updatePaymentWithFine
        }
    };
};