const express = require('express')
const router = express.Router()
const { Tenant, Property, Payment } = require('../models')
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator')

router.get('/payments', authMiddleware, async (req, res) => {
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
                }
            ],
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
})

router.get('/payment/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const managerId = req.user.managerId;

    try {
        // Busca o pagamento pelo ID
        const payment = await Payment.findOne({
            where: { paymentId: id },
            include: [
                { 
                    model: Property, 
                    where: { owner_id: managerId } 
                },
                { 
                    model: Tenant, 
                    where: { managerId: managerId },
                    as: 'tenant',
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
});

router.post('/multipayments', authMiddleware, async (req, res) => {
  try {
    const managerId = req.user.managerId;

    console.log('Iniciando criação automática de pagamentos...');

    // Busca todos os inquilinos ativos associados ao gestor
    const tenants = await Tenant.findAll({
      where: { 
        status: 'ativo',
        managerId: managerId, 
      },
      include: [
        {
          model: Property,
          as: 'properties',
        },
      ],
    });

    // Para cada inquilino, cria um pagamento
    for (const tenant of tenants) {
      // Verifica se o inquilino tem propriedades associadas
      if (tenant.properties && tenant.properties.length > 0) {
        // Pega a primeira propriedade associada ao inquilino
        const property = tenant.properties[0];

        // Define o mês de referência
        const referenceMonth = new Date().toISOString().slice(0, 7); // Mês atual no formato YYYY-MM

        // Verifica se já existe um pagamento para o mesmo inquilino e mês de referência
        const existingPayment = await Payment.findOne({
          where: {
            tenantId: tenant.tenantId,
            referenceMonth: referenceMonth,
            managerId: managerId,
          },
        });

        // Se já existir um pagamento, pula para o próximo inquilino
        if (existingPayment) {
          console.log(`Pagamento para o inquilino ${tenant.name} (${referenceMonth}) já existe.`);
          continue;
        }

        // Cria o pagamento
        const dueDate = new Date(`${referenceMonth}-10T00:00:00Z`); // Dia 10 do mês

        await Payment.create({
          amount: property.rent_amount, // Valor do aluguel da propriedade
          referenceMonth,
          dueDate,
          propertyId: property.propertyId, // ID da propriedade
          tenantId: tenant.tenantId, // ID do inquilino
          managerId: managerId, // ID do gestor
          status: 'pendente', // Status inicial do pagamento
        });

        // console.log(`Pagamento criado para o inquilino ${tenant.name} (${referenceMonth}).`);
      } //  else {
      //   console.log(`Inquilino ${tenant.name} não tem propriedade associada.`);
      // }
    }

    console.log('Criação automática de pagamentos concluída.');
    return res.status(200).json({
      success: true,
      message: 'Pagamentos criados com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao criar pagamentos automaticamente:', error);
    return res.status(500).json({
      success: false,
      errors: [{
        message: 'Erro ao criar pagamentos automaticamente.',
        error: error.message,
      }]
    });
  }
});

router.post(
    '/payments',
    authMiddleware,
    [
      body('amount').isFloat({ min: 0 }).withMessage('O valor do pagamento deve ser positivo.'),
      body('referenceMonth')
        .trim()
        .notEmpty()
        .withMessage('O mês de referência é obrigatório!')
        .matches(/^\d{4}-\d{2}$/)
        .withMessage('O mês de referência deve estar no formato "YYYY-MM".'),
      body('propertyId').isUUID().withMessage('O ID da propriedade é inválido.'),
      body('tenantId').isUUID().withMessage('O ID do inquilino é inválido.'),
    ],
    async (req, res) => {
      const errors = validationResult(req);
  
      // Verifica erros de validação
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map((err) => err.msg),
        });
      }
      
      const managerId = req.user.managerId;
      const { amount, referenceMonth, paymentDate, description, propertyId, tenantId } = req.body;
  
      try {
        // Verifica se a propriedade e o inquilino existem e pertencem ao gestor autenticado
        const property = await Property.findOne({
          where: { propertyId, owner_id: managerId },
        });
        const tenant = await Tenant.findOne({
          where: { tenantId, managerId: managerId },
        });

        const existingPayment = await Payment.findOne({
          where: {
            tenantId: tenantId,
            referenceMonth: referenceMonth,
            managerId: managerId,
          },
        });

        if (existingPayment) {
          return res.status(404).json({
            success: false,
            errors: [{
              message: `O inquilino já possui um pagamento registrado com a referência ${(referenceMonth)}.`
            }]
          })
        }
  
        if (!property || !tenant) {
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
          propertyId,
          tenantId,
          status: isLate ? 'atrasado' : 'pendente',
          isLate,
          description,
          managerId
        });
  
        // Retorna sucesso
        return res.status(201).json(newPayment);
      } catch (error) {
        console.error('Erro ao criar pagamento manualmente:', error);
        return res.status(500).json({
          success: false,
          errors: [{
            message: 'Erro ao criar pagamento manualmente. Tente novamente.',
          }]
        });
      }
    }
);

router.put(
    '/payments/:paymentId',
    authMiddleware,
    [
      body('amount').optional().isFloat({ min: 0 }).withMessage('O valor do pagamento deve ser positivo.'),
      body('dueDate').optional().isISO8601().withMessage('Forneça uma data de vencimento válida.'),
      body('status').optional().isIn(['pendente', 'pago', 'cancelado']).withMessage('Status inválido.'),
      body('paymentMethod').optional().isIn(['dinheiro', 'cartão', 'transferência']).withMessage('Método de pagamento inválido.'),
    ],
    async (req, res) => {
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
                as: 'tenant'
            }
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
);

module.exports = router;