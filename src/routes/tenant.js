require('dotenv').config();
const db = require('../configs/db') 

const express = require('express');
const router = express.Router();
const { Tenant, Property, FineSettings, NotificationLog } = require('../models')
const authMiddleware = require('../middleware/authMiddleware');
const handleErrors = require('../middleware/handleErrors')
const { body, validationResult } = require('express-validator');
const sendNotification = require('../utils/sendNotification')
const sendEmail = require('../utils/sendMail')
const sendSMS = require('../utils/sendSMS');

// Rota para listar inquilinos
router.get('/tenants', authMiddleware, async (req, res) => {
    try {
        // Filtra apenas os inquilinos do gestor
        const managerId = req.user.managerId;

        // Busca todos os inquilinos do gestor autenticado
        const tenants = await Tenant.findAll({
            where: { managerId: managerId },
            order: [['createdAt', 'DESC']], // Ordena pelos mais recentes
        });
        return res.status(200).json(tenants);
    } catch (error) {
        console.error('Erro ao buscar inquilinos:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar inquilinos. Tente novamente.',
        });
    }
});

router.post(
    '/tenants',
    authMiddleware,
    [
        body('name').trim().notEmpty().withMessage('O nome do inquilino é obrigatório!'),
        body('email').trim().isEmail().withMessage('Forneça um endereço de e-mail válido!'),
        body('binum').trim().notEmpty().withMessage('O número de identificação é obrigatório!'),
        body('age').isInt({ min: 18 }).withMessage('O inquilino deve ter pelo menos 18 anos.'),
        body('phone').matches(/^\+\d{1,4}\d{6,14}$/).withMessage('Formato de telefone inválido'),
        body('job').trim().notEmpty().withMessage('A profissão é obrigatória!'),
        body('emergencyNum').trim().notEmpty().withMessage('O número de emergência é obrigatório!'),
        body('marital_status').trim().notEmpty().withMessage('O estado é obrigatório!'),
    ],
    async (req, res, next) => {
        const errors = validationResult(req);
        

        if (!errors.isEmpty()) {
            return res.status(400).json({
              success: false,
              errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
              })),
            });
        }

        // Inicia uma transação
        const transaction = await db.sequelize.transaction();

        try {

            const managerId = req.user.managerId;
            const { name, email, phone, binum } = req.body;

            // Verificação de e-mail duplicado
            const existingTenant = await Tenant.findOne({ 
                where: { 
                    email,
                    managerId
                },
                transaction
            });

            if (existingTenant) {
                await transaction.rollback();
                return res.status(400).json({
                  success: false,
                  errors: [{
                    field: 'email',
                    message: 'Este e-mail já está cadastrado para outro inquilino'
                  }],
                });
            }

            // Verificação de B.I duplicado
            const existingBinum = await Tenant.findOne({
                where: {
                    binum,
                    managerId
                },
                transaction
            })

            if (existingBinum) {
                await transaction.rollback();
                return res.status(400).json({
                  success: false,
                  errors: [{
                    field: 'binum',
                    message: 'Este bilhete de identidade. já está cadastrado para outro inquilino'
                  }],
                });
            }

            // Verificação de telefone duplicado
            const existingPhone = await Tenant.findOne({
                where: { phone, managerId },
                transaction
            });
            
            if (existingPhone) {
                await transaction.rollback();
                return res.status(400).json({
                success: false,
                errors: [{
                    field: 'phone',
                    message: 'Este telefone já está cadastrado para outro inquilino'
                }],
              });
            }

            const newTenant = await Tenant.create({
                ...req.body,
                managerId,
                status: 'inativo'
            }, { transaction });

            try {
                const fineSettings = await FineSettings.findOne({
                    where: { managerId },
                    transaction,
                });

                // Prepara a mensagem de boas-vindas
                let welcomeMessage = fineSettings?.welcomeMessage || `
                <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 5px solid #3498db;">
                        <h1 style="color: #2c3e50; margin-bottom: 5px;">Bem-vindo(a), {nome_do_inquilino}!</h1>
                        <p style="color: #7f8c8d; margin-top: 0;">Estamos felizes em tê-lo como parte da nossa comunidade.</p>
                    </div>

                    <div style="margin: 25px 0;">
                        <p>Prezado(a) {nome_do_inquilino},</p>
                        
                        <p>É um prazer recebê-lo em nosso sistema de gestão de propriedades. Para garantir uma convivência harmoniosa, gostaríamos de esclarecer nossas políticas:</p>
                        
                        <div style="background-color: #f1f8fe; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #d1e3f6;">
                            <h3 style="color: #2980b9; margin-top: 0;">📅 Política de Pagamentos</h3>
                            
                            <div style="margin-bottom: 15px;">
                                <h4 style="color: #e74c3c; margin-bottom: 5px;">1. Multas por Atraso</h4>
                                <p>Caso o pagamento seja realizado após a data de vencimento, será aplicada uma multa de <strong>{porcentagem_da_multa}%</strong> sobre o valor do aluguel.</p>
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                                <h4 style="color: #f39c12; margin-bottom: 5px;">2. Advertências</h4>
                                <p>Após <strong>{max_fines_before_warning} ocorrências</strong> de atraso, você receberá uma advertência formal por e-mail e SMS.</p>
                            </div>
                            
                            <div>
                                <h4 style="color: #c0392b; margin-bottom: 5px;">3. Retirada da Propriedade</h4>
                                <p>Em caso de repetidas inadimplências, poderá ser necessária a retomada da propriedade, conforme previsto em contrato.</p>
                            </div>
                        </div>
                        
                        <p>Para sua comodidade, oferecemos:</p>
                        <ul style="padding-left: 20px;">
                            <li>📱 Lembretes automáticos por WhatsApp e e-mail</li>
                            <li>💳 Diversas opções de pagamento</li>
                            <li>🔄 Renegociação em casos específicos</li>
                        </ul>
                        
                        <p style="margin-top: 20px;">Mantenha seus pagamentos em dia para evitar inconvenientes. Estamos à disposição para esclarecer qualquer dúvida!</p>
                        
                        <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                            <p>Atenciosamente,</p>
                            <p style="font-weight: bold; color: #2c3e50;">Equipe de Gestão de Propriedades</p>
                            <p style="margin-top: 5px; font-size: 0.9em; color: #7f8c8d;">
                                <img src="https://exemplo.com/logo.png" alt="Logo" style="height: 30px; vertical-align: middle;">
                                <span style="margin-left: 10px;">Sistema de Gestão Imobiliária</span>
                            </p>
                        </div>
                    </div>
                </div>
                `;

                // Conteúdo alternativo em texto simples
                const appUrl = process.env.APP_URL || 'https://seusistema.com';
                const appName = process.env.APP_NAME || 'RentSystem';
                const supportEmail = process.env.SUPPORT_EMAIL || 'rentsystemsuporte@gmail.com'
                
                const textContent = `
                Bem-vindo à ${appName}, ${name}!
                
                Sua conta foi criada com sucesso.
                
                Nome de usuário: ${name}
                E-mail: ${email}
                
                Acesse: ${appUrl}
                
                Em caso de dúvidas, contate nosso suporte: ${supportEmail}
                
                © ${new Date().getFullYear()} ${appName}. Todos os direitos reservados.
            `;


                // Substitui placeholders na mensagem
                welcomeMessage = welcomeMessage
                    .replace(/{nome_do_inquilino}/g, name)
                    .replace(/{porcentagem_da_multa}/g, (fineSettings?.finePercentage || 0.03) * 100)
                    .replace(/{max_fines_before_warning}/g, fineSettings?.maxFinesBeforeWarning || 3);


                // Envia e-mail de boas-vindas
                if (email) {
                    await sendEmail(
                    email,
                    `Bem-vindo à Plataforma ${appName}`,
                    welcomeMessage,
                    {
                        isHtml: true,
                        alternatives: [
                        {
                            contentType: 'text/plain',
                            content: textContent
                        }]
                    });
                }

                if (phone) {
                    await sendSMS(phone, `Bem-vindo(a), ${name} a plataforma ${appName}! Acesse seu e-mail para mais detalhes.`);
                }

                await NotificationLog.create({
                    tenantId: newTenant.tenantId,
                    message: textContent,
                    sentAt: new Date(),
                    managerId,
                }, { transaction });

            } catch (notificationError) {
                console.error('Erro na notificação:', notificationError);
            }
            
            await transaction.commit();
      
            return res.status(201).json(newTenant);

        } catch (error) {
            await transaction.rollback();
            next(error); // Passa o erro para o middleware de tratamento
        }
    },
    handleErrors
);

// Rota para buscar um inquilino específico
router.get('/tenants/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        // Busca o inquilino pelo ID
        const tenant = await Tenant.findOne({
            where: { 
                tenantId: id, 
                managerId: req.user.managerId 
            }, 
        });

        if (!tenant) {
            return res.status(404).json({
                success: false,
                errors: [{
                    field: 'id',
                    message: 'ID de inquilino inválido, verifique e tente novamente'
                }],
            });
        }

        // Retorna as informações do inquilino
        return res.status(200).json(tenant);
    } catch (error) {
        console.error('Erro ao buscar inquilino:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar inquilino. Tente novamente.',
        });
    }
});

// Rota para atualizar um inquilino
router.put(
    '/tenants/:id',
    authMiddleware,
    [
        body('name').optional().trim().notEmpty().withMessage('O nome do inquilino é obrigatório!'),
        body('email').optional().trim().isEmail().withMessage('Forneça um endereço de e-mail válido!'),
        body('binum').optional().trim().notEmpty().withMessage('O número de identificação é obrigatório!'),
        body('age').optional().isInt({ min: 18 }).withMessage('O inquilino deve ter pelo menos 18 anos.'),
        body('phone').optional().trim().notEmpty().withMessage('O número de telefone é obrigatório!'),
        body('job').optional().trim().notEmpty().withMessage('A profissão é obrigatória!'),
        body('emergencyNum').optional().trim().notEmpty().withMessage('O número de emergência é obrigatório!'),
        // body('status').optional().isIn(['ativo', 'inativo', 'expulso']).withMessage('Status inválido. Valores permitidos: ativo, inativo, expulso.'),
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map((err) => err.msg),
            });
        }

        const managerId = req.user.managerId;
        const { id } = req.params;
        const { status, ...updateData } = req.body;

        try {
            // Busca o inquilino com a propriedade associada (se existir)
            const tenant = await Tenant.findOne({
                where: { 
                    tenantId: id, 
                    managerId: managerId
                },
                include: [{
                    model: Property,
                    as: 'properties',
                    attributes: ['propertyId', 'address', 'status']
                }]
            });

            if (!tenant) {
                return res.status(404).json({
                    success: false,
                    message: 'Inquilino não encontrado'
                });
            }

            // Verifica se tem propriedade associada
            const hasProperty = tenant.properties && tenant.properties.length > 0;
            const currentProperty = hasProperty ? tenant.properties[0] : null;

            // Lógica para cada tipo de status
            if (status) {
                switch (status) {
                    case 'inativo':
                        // Se tiver propriedade associada, desassocia
                        if (hasProperty) {
                            await Property.update(
                                { tenantId: null },
                                { where: { propertyId: currentProperty.propertyId } }
                            );
                        }
                        tenant.status = 'inativo';
                        break;

                    case 'ativo':
                        // Só pode ativar se tiver propriedade associada
                        if (!hasProperty) {
                            return res.status(400).json({
                                success: false,
                                message: 'Para ativar um inquilino, associe-o a uma propriedade primeiro'
                            });
                        }
                        tenant.status = 'ativo';
                        break;

                    case 'expulso':
                        // Envia notificação antes de remover
                        await sendNotification(
                            tenant.email,
                            tenant.phone,
                            'Conta encerrada',
                            `Prezado ${tenant.name},\n\nSua conta foi encerrada conforme nossos termos de serviço.\n\nEquipe de Gestão`
                        );

                        // Se tiver propriedade associada, desassocia primeiro
                        if (hasProperty) {
                            await Property.update(
                                { tenantId: null },
                                { where: { propertyId: currentProperty.propertyId } }
                            );
                        }

                        // Remove o inquilino
                        await tenant.destroy();

                        return res.status(200).json({
                            success: true,
                            message: 'Inquilino removido com sucesso'
                        });
                }
            }

            // Atualiza os outros campos
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    tenant[key] = updateData[key];
                }
            });

            await tenant.save();

            // Busca os dados atualizados com propriedade
            const updatedTenant = await Tenant.findOne({
                where: { tenantId: id },
                include: [{
                    model: Property,
                    as: 'properties',
                    attributes: ['propertyId', 'address']
                }]
            });

            return res.status(200).json({
                success: true,
                data: updatedTenant,
                message: status === 'expulso' ? undefined : 'Inquilino atualizado com sucesso'
            });

        } catch (error) {
            console.error('Erro ao atualizar inquilino:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao atualizar inquilino. Tente novamente.',
            });
        }
    }
);

// Rota para deletar um inquilino
router.delete('/tenants/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        // Busca o inquilino pelo ID
        const tenant = await Tenant.findOne({
            where: { tenantId: id, managerId: req.user.managerId }, // Apenas inquilinos do gestor autenticado
        });

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'Inquilino não encontrado.',
            });
        }

        // Remove o inquilino
        await tenant.destroy();

        // Retorna sucesso
        return res.status(200).json({
            success: true,
            message: 'Inquilino removido com sucesso!',
        });
    } catch (error) {
        console.error('Erro ao remover inquilino:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao remover inquilino. Tente novamente.',
        });
    }
});

module.exports = router;