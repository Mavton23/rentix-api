const express = require('express');
const router = express.Router();
const { Tenant, Property, Payment, NotificationLog } = require('../models')
const authMiddleware = require('../middleware/authMiddleware');
const { Op, where } = require('sequelize');
const { sequelize } = require('../configs/db')

// Função para calcular o intervalo de datas com base no período
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
        'status',
        [sequelize.fn('COUNT', sequelize.col('paymentId')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount']
      ],
      where: { managerId },
      group: ['status'],
      include: [
        {
          model: Property,
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
        [sequelize.fn('DATE_FORMAT', 'month', sequelize.col('paymentDate')), 'month'],
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
        referenceMonth: payment.dueDate.toLocaleString('default', { month: 'long' }), // Nome do mês
        totalAmount: parseFloat(payment.totalAmount),
        status: payment.status,
    }));

    return {
        totalRevenue,
        totalFines,
        pendingPayments,
        overduePayments,
        payments: formattedPayments,
    };
};

// Rota do dashboard
router.get('/manager', authMiddleware, async (req, res) => {
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
  
      // Executa todas as consultas em paralelo para melhor performance
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
  
      // Formatação dos dados para o frontend
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
});

module.exports = router;