const express = require('express')
const router = express.Router()
const { Tenant, Property, Payment, PaymentHistory } = require('../models')
const authMiddleware = require('../middleware/authMiddleware');
const { sequelize } = require('../configs/db')
const { Op } = require('sequelize');

// Helper para filtrar por período
const getDateRange = (period) => {
    const currentDate = new Date();
    let startDate, endDate;

    switch (period) {
        case 'lastMonth':
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
            break;
        case 'currentYear':
            startDate = new Date(currentDate.getFullYear(), 0, 1);
            endDate = new Date(currentDate.getFullYear(), 11, 31);
            break;
        case 'all':
            return { startDate: null, endDate: null };
        default: // currentMonth (padrão)
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            break;
    }

    return { startDate, endDate };
};

// Rota principal de histórico
router.get('/payment-history', authMiddleware, async (req, res) => {
    try {
        const { 
            period = 'currentMonth', 
            status, 
            tenantName, 
            propertyAddress,
            page = 1, 
            limit = 10 
        } = req.query;
        
        const managerId = req.user.managerId;

        // Validação dos parâmetros
        const validPeriods = ['currentMonth', 'lastMonth', 'currentYear', 'all'];
        if (!validPeriods.includes(period)) {
            return res.status(400).json({
                success: false,
                message: 'Período inválido. Use: currentMonth, lastMonth, currentYear ou all.'
            });
        }

        // Validação de paginação
        const parsedPage = Math.max(1, parseInt(page)) || 1;
        const parsedLimit = Math.min(Math.max(1, parseInt(limit)), 100) || 10;

        // Define o intervalo de datas
        const { startDate, endDate } = getDateRange(period);

        // Condições de busca para Payment
        const paymentWhere = {
            managerId,
            ...(status && { status }),
        };

        // Filtro por período (exceto quando for 'all')
        if (startDate && endDate) {
            paymentWhere.dueDate = { 
                [Op.between]: [startDate, endDate] 
            };
        }

        // Configuração dos includes
        const includeOptions = [
            {
                model: Property,
                attributes: ['propertyId', 'address', 'property_type', 'status'],
                required: true
            },
            {
                model: Tenant,
                as: 'tenant',
                attributes: ['tenantId', 'name', 'email', 'phone', 'status'],
                required: true
            }
        ];

        // Filtro por nome do inquilino (case-insensitive)
        if (tenantName) {
            includeOptions[1].where = {
                name: {
                    [Op.like]: `%${tenantName}%`
                }
            };
        }

        // Filtro por endereço da propriedade
        if (propertyAddress) {
            includeOptions[0].where = {
                address: {
                    [Op.like]: `%${propertyAddress}%`
                }
            };
        }

        // Consulta o histórico de pagamentos
        const { count, rows } = await PaymentHistory.findAndCountAll({
            include: [{
                model: Payment,
                where: paymentWhere,
                include: includeOptions
            }],
            order: [['changeDate', 'DESC']],
            limit: parsedLimit,
            offset: (parsedPage - 1) * parsedLimit,
            distinct: true,
            subQuery: false // Importante para queries complexas
        });

        // Formatação dos resultados
        const formattedResults = rows.map(history => ({
            historyId: history.historyId,
            changeDate: history.changeDate,
            changes: history.changes,
            payment: {
                ...history.Payment.toJSON(),
                property: history.Payment.Property,
                tenant: history.Payment.tenant
            }
        }));

        return res.status(200).json({
            success: true,
            data: formattedResults,
            pagination: {
                total: count,
                page: parsedPage,
                limit: parsedLimit,
                totalPages: Math.ceil(count / parsedLimit),
            },
        });

    } catch (error) {
        console.error('Erro ao buscar histórico de pagamentos:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Erro interno ao processar a solicitação.'
        });
    }
});


// Rota para detalhes específicos de um registro
router.get('/payment-history/:historyId', authMiddleware, async (req, res) => {
    try {
        const { historyId } = req.params;
        const managerId = req.user.managerId;

        const history = await PaymentHistory.findOne({
            where: { historyId },
            include: [
                {
                    model: Payment,
                    include: [
                        { 
                            model: Property,
                            where: { owner_id: managerId },
                            attributes: ['propertyId', 'address', 'description']
                        },
                        { 
                            model: Tenant,
                            as: 'tenant',
                            attributes: ['tenantId', 'name', 'email', 'phone']
                        },
                    ],
                },
            ],
        });

        if (!history) {
            return res.status(404).json({
                success: false,
                errors: [{
                    message: 'Registro de histórico não encontrado.'
                }]
            });
        }

        return res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Erro ao buscar detalhes do histórico:', error);
        return res.status(500).json({
            success: false,
            errors: [{
                message: 'Erro ao recuperar detalhes do histórico.'
            }]
        });
    }
});

module.exports = router;