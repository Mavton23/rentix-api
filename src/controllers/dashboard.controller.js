const { Tenant, Property, Payment, NotificationLog } = require('../models')
const { Op } = require('sequelize');
const { sequelize } = require('../configs/db')

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
        default: // currentMonth (padrão)
            startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            break;
    }

    return { startDate, endDate };
};

// Função para buscar métricas gerais (inquilinos e propriedades)
const getGeneralMetrics = async (managerId) => {
    const totalTenantsAtive = await Tenant.count({ where: { managerId, status: 'ativo' } });
    const totalTenants = await Tenant.count({ where: { managerId } });
    const totalProperties = await Property.count({ where: { owner_id: managerId } });
    return { totalTenants, totalTenantsAtive, totalProperties };
};

const getOccupancyRate = async (managerId) => {
    const totalProperties = await Property.count({ where: { owner_id: managerId } });
    const occupiedProperties = await Property.count({ 
      where: { 
        owner_id: managerId,
        status: 'alugado'
      } 
    });
    return {
      totalProperties,
      occupiedProperties,
      occupancyRate: totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0
    };
};

const getRecentNotifications = async (managerId) => {
    return await NotificationLog.findAll({
      where: { managerId },
      order: [['sentAt', 'DESC']],
      limit: 5,
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['name', 'email']
        }
      ]
    });
};

const getUpcomingPayments = async (managerId) => {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    return await Payment.findAll({
      where: {
        dueDate: { 
          [Op.between]: [new Date(), sevenDaysFromNow] 
        },
        status: 'pendente',
        managerId
      },
      include: [
        { 
          model: Property,
          as: 'property',
          attributes: ['address', 'property_type']
        },
        { 
          model: Tenant,
          as: 'tenant',
          attributes: ['name', 'phone']
        }
      ],
      order: [['dueDate', 'ASC']]
    });
};

const getPropertyTypeDistribution = async (managerId) => {
    return await Property.findAll({
      attributes: [
        'property_type',
        [sequelize.fn('COUNT', sequelize.col('propertyId')), 'count']
      ],
      where: { owner_id: managerId },
      group: ['property_type']
    });
};

const getPaymentStatusDetails = async (managerId) => {
    return await Payment.findAll({
      attributes: [
        ['paymentId', 'status'],
        [sequelize.fn('COUNT', sequelize.col('paymentId')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      where: { managerId },
      group: ['paymentId'],
      include: [
        {
          model: Property,
          as: 'property',
          attributes: [],
          where: { owner_id: managerId }
        }
      ]
    });
};

const getRevenueHistory = async (managerId, months = 6) => {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    
    return await Payment.findAll({
      attributes: [
        [sequelize.literal(`to_char("paymentDate", 'YYYY-MM')`), 'month'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      where: {
        managerId,
        status: 'pago',
        paymentDate: { [Op.gte]: date }
      },
      group: ['month'],
      order: [['month', 'ASC']],
      raw: true
    });
};

const getTenantsWithOverduePayments = async (managerId) => {
    return await Tenant.findAll({
      attributes: ['name', 'email', 'phone'],
      include: [{
        model: Payment,
        as: 'payments',
        where: {
          status: 'atrasado',
          managerId
        },
        attributes: ['dueDate', 'amount', 'fineAmount']
      }],
      where: { managerId }
    });
};

// Função para buscar e processar pagamentos no período
const getPaymentsMetrics = async (managerId, startDate, endDate) => {
    const payments = await Payment.findAll({
        where: {
            dueDate: { [Op.between]: [startDate, endDate] },
        },
        include: [
            {
                model: Property,
                as: 'property',
                where: { owner_id: managerId },
            },
            {
                model: Tenant,
                as: 'tenant',
                where: { managerId },
            },
        ],
    });

    const totalRevenue = payments
        .filter(p => p.status === 'pago')
        .reduce((sum, p) => sum + parseFloat(p.totalAmount), 0);

    const totalFines = payments
        .filter(p => p.status === 'pago' && p.fineAmount > 0)
        .reduce((sum, p) => sum + parseFloat(p.fineAmount), 0);

    const pendingPayments = payments.filter(p => p.status === 'pendente').length;
    const overduePayments = payments.filter(p => p.status === 'atrasado').length;

    // Formata os dados dos pagamentos para o gráfico
    const formattedPayments = payments.map(payment => ({
        paymentId: payment.paymentId,
        referenceMonth: payment.dueDate.toLocaleString('default', { month: 'long' }),
        monthly: parseFloat(payment.amount),
        fineAmount: parseFloat(payment.fineAmount),
        totalAmount: payment.totalAmount 
        ? parseFloat(payment.totalAmount)
        : amount + fineAmount,
        status: payment.status,
        tenant: payment.tenant.name,
        property: payment.property.address,
        dueDate: payment.dueDate
    }));

    return {
        totalRevenue,
        totalFines,
        pendingPayments,
        overduePayments,
        payments: formattedPayments,
    };
};

module.exports = {
    managerStats: async (req, res) => {
        try {
            const managerId = req.user.managerId;
            const { period = 'currentMonth' } = req.query;
        
            // Validação do período
            const validPeriods = ['currentMonth', 'lastMonth', 'currentYear'];
            if (!validPeriods.includes(period)) {
                return res.status(400).json({
                success: false,
                errors: [{
                    message: 'Período inválido. Use: currentMonth, lastMonth ou currentYear.',
                }]
                });
            }
        
            // Intervalo de datas
            const { startDate, endDate } = getDateRange(period);
        
            // Executa todas as consultas em paralelo
            const [
                generalMetrics,
                occupancyData,
                paymentsMetrics,
                recentNotifications,
                upcomingPayments,
                propertyTypes,
                paymentStatuses
            ] = await Promise.all([
                getGeneralMetrics(managerId),
                getOccupancyRate(managerId),
                getPaymentsMetrics(managerId, startDate, endDate),
                getRecentNotifications(managerId),
                getUpcomingPayments(managerId),
                getPropertyTypeDistribution(managerId),
                getPaymentStatusDetails(managerId),
                getRevenueHistory(managerId),
                getTenantsWithOverduePayments(managerId)
            ]);
        
            // Formatação dos dados
            const formattedData = {
                ...generalMetrics,
                ...occupancyData,
                ...paymentsMetrics,
                notifications: recentNotifications,
                upcomingPayments,
                propertyTypes,
                paymentStatuses,
                period: {
                start: startDate,
                end: endDate,
                type: period
                }
            };
        
            return res.status(200).json({
                success: true,
                data: formattedData
            });
        
            } catch (error) {
            console.error('Erro no dashboard:', error);
            return res.status(500).json({
                success: false,
                errors: [{ message: 'Erro ao carregar dados do dashboard' }]
            });
        }
    }
}