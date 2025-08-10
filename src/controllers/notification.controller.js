require('dotenv').config();

const { Tenant, NotificationLog } = require('../models');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendMail');
const sendSMS = require('../utils/sendSMS');


module.exports = {
    notifyTenant: async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: [{
                    errors: errors.array().map(err => err.msg),
                }]
            });
        }

        const managerId = req.user.managerId;
        const { tenantId, message } = req.body;

        try {
            // Busca o inquilino
            const tenant = await Tenant.findOne({
                where: { tenantId, managerId: managerId },
            });

            if (!tenant) {
                return res.status(404).json({
                    success: false,
                    errors: [{
                        message: 'Inquilino não encontrado.',
                    }]
                });
            }

            // Envia a notificação
            const subject = 'Notificação do Gestor';
            await sendEmail({
                to: tenant.email,
                subject: subject,
                text: message
            });

            if (tenant.phone) {
                await sendSMS(tenant.phone, message);
            }

            // Registra a notificação no NotificationLog
            await NotificationLog.create({
                managerId,
                tenantId: tenant.tenantId,
                message, // Mensagem enviada
                sentAt: new Date(), // Data e hora da notificação
            });

            // Retorna sucesso
            return res.status(200).json({
                success: true,
                message: 'Notificação enviada com sucesso!',
            });
        } catch (error) {
            console.error('Erro ao enviar notificação:', error instanceof Error ? error.message : error);
            return res.status(500).json({
                success: false,
                errors: [{
                    message: 'Erro ao enviar notificação. Tente novamente.',
                }]
            });
        }
    }, 

    getNotifications: async (req, res) => {
        const managerId = req.user.managerId;

        try {
            // Busca todas as notificações enviadas para inquilinos do gestor autenticado
            const notifications = await NotificationLog.findAll({
                where: { managerId },
                include: [
                    {
                        model: Tenant,
                        as: 'tenant',
                        attributes: ['tenantId', 'name', 'email', 'phone', 'status']
                    }
                ],
                order: [['sentAt', 'DESC']]
            });

            // Retorna as notificações
            return res.status(200).json(notifications);
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
            return res.status(500).json({
                success: false,
                errors: [{
                    message: 'Erro ao buscar notificações. Tente novamente.',
                }]
            });
        }
    },

    getTenantNotifications: async (req, res) => {
        const { tenantId } = req.params;
        const managerId = req.user.managerId;

        try {
            // Verifica se o inquilino pertence ao gestor autenticado
            const tenant = await Tenant.findOne({
                where: { 
                    tenantId, 
                    managerId: managerId 
                },
            });

            if (!tenant) {
                return res.status(404).json({
                    success: false,
                    errors: [{
                        message: 'Inquilino não encontrado.',
                    }]
                });
            }

            // Busca as notificações enviadas para o inquilino específico
            const notifications = await NotificationLog.findAll({
                where: { tenantId },
                include: [
                    {
                        model: Tenant,
                        where: { 
                            managerId: managerId 
                        },
                        as: 'tenant',
                        attributes: ['name', 'email', 'phone'],
                    },
                ],
                order: [['sentAt', 'DESC']],
            });

            // Retorna as notificações
            return res.status(200).json({ data: notifications });
        } catch (error) {
            console.error('Erro ao buscar notificações do inquilino:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar notificações do inquilino. Tente novamente.',
            });
        }
    }
}