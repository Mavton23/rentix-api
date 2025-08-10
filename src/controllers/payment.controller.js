const { Tenant, Property, Payment } = require('../models');
const { validationResult } = require('express-validator');
const models = require('../models');
const paymentHooks = require('../hooks/paymentHooks')(models);
const { sequelize } = require('../configs/db');
const { Op } = require('sequelize');

module.exports = {
    getPayments: async (req, res) => {
        try {
            const managerId = req.user.managerId;

            // Busca todas as propriedades do gestor autenticado
            const payments = await Payment.findAll({
                where: { managerId: managerId },
                include: [
                    {
                        model: Tenant,
                        as: 'tenant',
                        attributes: ['name']
                    },
                    {
                        model: Property,
                        as: 'property',
                        attributes: ['address']
                    }
                ],
                attributes: ['paymentId', 'amount', 'fineAmount', 'totalAmount', 'status', 'dueDate', 'referenceMonth', 'cancellationReason', 'description'],
                order: [['createdAt', 'DESC']],
            });

            return res.status(200).json(payments);
        } catch (error) {
            console.log('Erro ao buscar pagamentos: ', error instanceof Error ? error.message : error)
            return res.status(500).json({
                success: false,
                errors: [{
                message: 'Erro ao buscar pagamentos. Tente novamente.',
                }]
            });
        }
    },

    getPaymentById: async (req, res) => {
        const { id } = req.params;
        const managerId = req.user.managerId;

        try {
            // Busca o pagamento pelo ID
            const payment = await Payment.findOne({
                where: { paymentId: id },
                include: [
                    { 
                        model: Property, 
                        as: 'property',
                        where: { owner_id: managerId } 
                    },
                    { 
                        model: Tenant, 
                        as: 'tenant',
                        where: { managerId: managerId },
                    },
                ],
            });

            if (!payment) {
                return res.status(404).json({
                    success: false,
                    errors: [{
                    message: 'Pagamento não encontrado.',
                    }]
                });
            }

            // Retorna as informações do pagamento
            return res.status(200).json(payment);
        } catch (error) {
            console.error('Erro ao buscar pagamento:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar pagamento. Tente novamente.',
            });
        }
    },

    createMultipayments: async (req, res) => {
        const managerId = req.user.managerId;
        let successCount = 0;
        let errorCount = 0;
        
        try {
            console.log('Iniciando criação automática de pagamentos...');

            const tenants = await Tenant.findAll({
                where: { 
                    status: 'ativo',
                    managerId: managerId, 
                },
                include: [{
                    model: Property,
                    as: 'properties',
                }]
            });

            for (const tenant of tenants) {
                const transaction = await sequelize.transaction();
                
                try {
                    if (tenant.properties && tenant.properties.length > 0) {
                        const property = tenant.properties[0];
                        const referenceMonth = new Date().toISOString().slice(0, 7);

                        const existingPayment = await Payment.findOne({
                            where: {
                                tenantId: tenant.tenantId,
                                referenceMonth: referenceMonth,
                                managerId: managerId,
                            },
                            transaction
                        });

                        if (existingPayment) {
                            console.log(`Pagamento para ${tenant.name} (${referenceMonth}) já existe.`);
                            await transaction.commit();
                            continue;
                        }

                        const dueDate = new Date(`${referenceMonth}-10T00:00:00Z`);

                        await Payment.create({
                            amount: property.rent_amount,
                            referenceMonth,
                            dueDate,
                            propertyId: property.propertyId,
                            tenantId: tenant.tenantId,
                            managerId: managerId,
                            status: 'pendente',
                            totalAmount: property.rent_amount
                        }, { transaction });

                        await transaction.commit();
                        successCount++;
                    }
                } catch (error) {
                    await transaction.rollback();
                    console.error(`Erro ao criar pagamento para ${tenant.name}:`, error);
                    errorCount++;
                }
            }

            console.log(`Criação concluída: ${successCount} pagamentos criados, ${errorCount} falhas.`);
            
            return res.status(200).json({
                success: true,
                message: `Processamento concluído: ${successCount} pagamentos criados, ${errorCount} falhas.`,
            });

        } catch (error) {
            console.error('Erro geral ao criar pagamentos:', error);
            return res.status(500).json({
                success: false,
                errors: [{
                    message: 'Erro ao processar criação de pagamentos.',
                    error: error.message,
                }]
            });
        }
    },

    createPayment: async (req, res) => {
        const errors = validationResult(req);

        // Verifica erros de validação
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map((err) => err.msg),
            });
        }
        
        const { managerId } = req.user;
        const { amount, referenceMonth, paymentDate, description, propertyId, tenantId } = req.body;
        const transaction = await sequelize.transaction();

        try {
            // Verifica se a propriedade e o inquilino existem e pertencem ao gestor autenticado
            const property = await Property.findOne({
                where: { propertyId, owner_id: managerId },
                transaction
            });
            
            const tenant = await Tenant.findOne({
                where: { tenantId, managerId: managerId },
                transaction
            });

            const existingPayment = await Payment.findOne({
                where: {
                    tenantId: tenantId,
                    referenceMonth: referenceMonth,
                    managerId: managerId,
                    status: {
                        [Op.not]: 'cancelado'
                    }
                },
                transaction
            });

            if (existingPayment) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    errors: [{
                        message: `O inquilino já possui um pagamento ativo (${existingPayment.status}) com a referência ${referenceMonth}.`
                    }]
                });
            }

            if (!property || !tenant) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Propriedade ou inquilino não encontrado.',
                });
            }

            // Cria o pagamento manualmente
            const dueDate = new Date(`${referenceMonth}-10T00:00:00Z`); // Dia 10 do mês
            const isLate = new Date() > dueDate;

            const newPayment = await Payment.create({
                amount,
                referenceMonth,
                paymentDate,
                dueDate,
                totalAmount: amount,
                propertyId,
                tenantId,
                status: isLate ? 'atrasado' : 'pendente',
                isLate,
                description,
                managerId
            }, { transaction });

            // Executa o hook manualmente com a transação
            await paymentHooks.afterCreatePayment(newPayment, { transaction })

            const paymentWithAssociations = await Payment.findByPk(newPayment.paymentId, {
                include: [
                    {
                        model: Tenant,
                        as: 'tenant',
                        attributes: ['name']
                    },
                    {
                        model: Property,
                        as: 'property',
                        attributes: ['address']
                    }
                ],
                transaction
            });

            await transaction.commit();
            
            // Retorna sucesso
            return res.status(201).json({
                success: true,
                data: {
                    paymentId: paymentWithAssociations.paymentId,
                    amount: paymentWithAssociations.amount,
                    fineAmount: paymentWithAssociations.fineAmount,
                    totalAmount: paymentWithAssociations.totalAmount,
                    status: paymentWithAssociations.status,
                    dueDate: paymentWithAssociations.dueDate,
                    referenceMonth: paymentWithAssociations.referenceMonth,
                    cancellationReason: paymentWithAssociations.cancellationReason,
                    description: paymentWithAssociations.description,
                    tenant: {
                        name: paymentWithAssociations.tenant?.name
                    },
                    property: {
                        address: paymentWithAssociations.property?.address
                    }
                },
                message: 'Pagamento criado com sucesso.'
            });
            
        } catch (error) {
            await transaction.rollback();
            console.error('Erro ao criar pagamento manualmente:', error instanceof Error ? error.message : error);
            return res.status(500).json({
                success: false,
                errors: [{
                    message: 'Erro ao criar pagamento manualmente. Tente novamente.',
                    error: error.message
                }]
            });
        }
    },

    updatePayment: async (req, res) => {
        const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map((err) => ({
            field: err.path,
            message: err.msg
          })),
        });
      }

      const transaction = await sequelize.transaction();

      const managerId = req.user.managerId;
      const { paymentId } = req.params; 
      const { amount, dueDate, status, paymentDate, method, description } = req.body;
  
      try {
        // Busca o pagamento
        const payment = await Payment.findOne({
          where: { paymentId },
          include: [
            { 
                model: Tenant, 
                where: { managerId: managerId },
                as: 'tenant',
                required: true
            }
        ],
        transaction
        });
  
        if (!payment) {
          return res.status(404).json({
            success: false,
            errors: [{
              message: 'Pagamento não encontrado.',
            }]
          });
        }
  
        // Atualiza o pagamento
        if (amount) payment.amount = amount;
        if (dueDate) payment.dueDate = dueDate;
        if (status) payment.status = status;
        if (paymentDate) payment.paymentDate = paymentDate;
        if (method) payment.method = method;
        if (description) payment.description = description;
  
        await payment.save();
  
        // Retorna sucesso
        return res.status(200).json(payment);
      } catch (error) {
        console.error('Erro ao atualizar pagamento:', error);
        return res.status(500).json({
          success: false,
          errors: [{
            message: 'Erro ao atualizar pagamento. Tente novamente.',
          }]
        });
      }
    }
}