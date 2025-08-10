const express = require('express')
const router = express.Router()
const { Tenant, Property } = require('../models')
const db = require('../configs/db')
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator')
const { validate: isUuidValid } = require('uuid');

router.get('/properties', async (req, res) => {
    try {
        const managerId = req.user.managerId;

        // Busca todas as propriedades do gestor autenticado
        const properties = await Property.findAll({
            where: { owner_id: managerId },
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json(properties);
    } catch (error) {
        console.log('Erro ao buscar propriedades: ', error instanceof Error ? error.message : error)
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar propriedades. Tente novamente.',
        });
    }
})

router.get('/properties/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const managerId = req.user.managerId;

    try {
        // Busca a propriedade pelo ID
        const property = await Property.findOne({
            where: { 
                propertyId: id, 
                owner_id: managerId },
                include: [
                    {
                        model: Tenant,
                        as: 'tenant',
                        attributes: ['tenantId', 'name']
                    }
                ]
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Propriedade não encontrada.',
            });
        }

        // Retorna as informações da propriedade
        return res.status(200).json(property);
    } catch (error) {
        console.error('Erro ao buscar propriedade:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar propriedade. Tente novamente.',
        });
    }
});

router.get('/tenant/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const managerId = req.user.managerId;

    try {
        // Valida se o tenantId é um UUID válido
        if (!isUuidValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID do inquilino inválido.',
            });
        }

        // Busca a propriedade pelo tenantId e owner_id
        const property = await Property.findOne({
            where: { 
                tenantId: id, 
                owner_id: managerId 
            },
            // include: [
            //     {
            //         model: Tenant, // Inclui informações do inquilino
            //         attributes: ['name', 'email', 'phone'] // Campos específicos do inquilino
            //     },
            //     {
            //         model: Manager, // Inclui informações do proprietário
            //         attributes: ['name', 'email'] // Campos específicos do proprietário
            //     }
            // ]
        });

        // Se a propriedade não for encontrada
        // if (!property) {
        //     return res.status(404).json({
        //         success: false,
        //         message: 'Propriedade do inquilino não encontrada.',
        //     });
        // }

        // Retorna as informações da propriedade
        return res.status(200).json(property);
    } catch (error) {
        console.error('Erro ao buscar propriedade:', error);

        // Mensagem de erro detalhada
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar propriedade. Tente novamente.',
            error: errorMessage // Retorna o erro para depuração
        });
    }
});

// router.post(
//     '/properties',
//     authMiddleware,
//     [
//         body('address').trim().notEmpty().withMessage('O endereço é obrigatório!'),
//         body('property_type').trim().notEmpty().withMessage('O tipo de propriedade é obrigatório!'),
//         body('status').trim().notEmpty().withMessage('O status da propriedade é obrigatório!'),
//         body('bedrooms')
//             .if(body('property_type').not().isIn(['Comercial'])) 
//             .isInt({ min: 1 }).withMessage('O número de quartos deve ser pelo menos 1.'),
//         body('bathrooms')
//             .if(body('property_type').not().isIn(['Comercial']))
//             .isInt({ min: 1 }).withMessage('O número de banheiros deve ser pelo menos 1.'),
//         body('rent_amount').isFloat({ min: 0 }).withMessage('O valor do aluguel deve ser positivo.'),
//         body('description').trim().notEmpty().withMessage('A descrição é obrigatória!'),
//     ],
//     async (req, res) => {
//         const errors = validationResult(req);

//         // Verifica erros de validação
//         if (!errors.isEmpty()) {
//             return res.status(400).json({
//                 success: false,
//                 errors: errors.array().map(err => err.msg),
//             });
//         }

//         const managerId = req.user.managerId;
//         const { address, property_type, status, bedrooms, bathrooms, rent_amount, description, tenantId } = req.body;

//         try {
//             // Verifica se o endereço já está registrado
//             const checkProperty = await models.Property.findOne({ 
//                 where: { 
//                     address,
//                     owner_id: managerId
//                 } 
//             });

//             if (checkProperty) {
//                 return res.status(400).json({
//                     success: false,
//                     message: 'Endereço já registrado.',
//                 });
//             }

//             // Verifica se o tenantId já está associado a outra propriedade
//             if (tenantId) {
//                 const checkTenant = await models.Property.findOne({ 
//                     where: { 
//                         tenantId,
//                         owner_id: managerId
//                     } 
//                 });

//                 if (checkTenant) {
//                     return res.status(400).json({
//                         success: false,
//                         message: 'Inquilino já associado a outra propriedade.',
//                     });
//                 }
//             }

//             // Cria a nova propriedade
//             const cleanData = {
//                 address,
//                 property_type,
//                 status,
//                 rent_amount,
//                 description,
//                 owner_id: managerId,
//                 tenantId: tenantId || null,
//             };
            
//             // Verifica se bedrooms e bathrooms são strings vazias ou undefined
//             cleanData.bedrooms = (bedrooms === '' || bedrooms === undefined) ? null : parseInt(bedrooms, 10);
//             cleanData.bathrooms = (bathrooms === '' || bathrooms === undefined) ? null : parseInt(bathrooms, 10);
            
//             const newProperty = await models.Property.create(cleanData);

//             // Atualiza o status do inquilino
//             if (tenantId) {
//                 const updateTenantStatus = await models.Tenant.findOne({
//                     where: { 
//                         tenantId,
//                         managerId
//                     }
//                 })

//                 if (updateTenantStatus) {
//                     // Atualiza o status para ativo
//                     await updateTenantStatus.update({ status: 'ativo' });
//                     console.log(`Status do inquilino ${updateTenantStatus.name} atualizado para "ativo".`);
//                 } else {
//                     console.error('Inquilino não encontrado.');
//                 }
//             }
            

//             // Retorna sucesso
//             return res.status(201).json(newProperty);
//         } catch (error) {
//             console.error('Erro ao criar propriedade:', error);
//             return res.status(500).json({
//                 success: false,
//                 message: 'Erro ao criar propriedade. Tente novamente.',
//             });
//         }
//     }
// );

router.post(
    '/properties',
    authMiddleware,
    [
        body('address').trim().notEmpty().withMessage('O endereço é obrigatório!'),
        body('property_type').trim().notEmpty().withMessage('O tipo de propriedade é obrigatório!'),
        body('bedrooms')
            .if(body('property_type').not().isIn(['Comercial']))
            .optional({ checkFalsy: true })
            .isInt({ min: 1 }).withMessage('O número de quartos deve ser pelo menos 1.'),
        body('bathrooms')
            .if(body('property_type').not().isIn(['Comercial']))
            .optional({ checkFalsy: true })
            .isInt({ min: 1 }).withMessage('O número de banheiros deve ser pelo menos 1.'),
        body('rent_amount').isFloat({ min: 0 }).withMessage('O valor do aluguel deve ser positivo.'),
        body('description').trim().notEmpty().withMessage('A descrição é obrigatória!'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => err.msg),
            });
        }

        const managerId = req.user.managerId;
        let { address, property_type, bedrooms, bathrooms, rent_amount, description, tenantId } = req.body;

        // Tratamento especial para o tenantId
        tenantId = (tenantId === 'none' || tenantId === '') ? null : tenantId;

        // Inicia uma transação para garantir atomicidade
        const transaction = await db.sequelize.transaction();

        try {
            // Verifica se o endereço já está registrado
            const checkProperty = await Property.findOne({ 
                where: { 
                    address,
                    owner_id: managerId
                },
                transaction
            });

            if (checkProperty) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Endereço já registrado.',
                });
            }

            // Verifica se o tenantId existe e está disponível
            if (tenantId) {
                // Verifica se o inquilino existe
                const tenant = await Tenant.findOne({
                    where: { 
                        tenantId,
                        managerId
                    },
                    transaction
                });

                if (!tenant) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: 'Inquilino não encontrado.',
                    });
                }

                // Verifica se o inquilino já está associado a outra propriedade
                const propertyWithTenant = await Property.findOne({ 
                    where: { 
                        tenantId,
                        owner_id: managerId
                    },
                    transaction
                });

                if (propertyWithTenant) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: 'Inquilino já associado a outra propriedade.',
                    });
                }
            }

            // Normaliza o tipo de propriedade
            property_type = property_type.charAt(0).toUpperCase() + property_type.slice(1).toLowerCase();

            // Cria a nova propriedade
            const cleanData = {
                address,
                property_type,
                status: 'disponivel',
                rent_amount,
                description,
                owner_id: managerId,
                tenantId: tenantId || null,
                bedrooms: (property_type === 'Comercial' || bedrooms === '' || bedrooms === undefined) ? 
                    null : parseInt(bedrooms, 10),
                bathrooms: (property_type === 'Comercial' || bathrooms === '' || bathrooms === undefined) ? 
                    null : parseInt(bathrooms, 10)
            };
            
            const newProperty = await Property.create(cleanData, { transaction });

            // Atualiza o status do inquilino se necessário
            if (tenantId) {
                await Tenant.update(
                    { status: 'ativo' },
                    { 
                        where: { 
                            tenantId,
                            managerId
                        },
                        transaction
                    }
                );

                await Property.update(
                    { status: 'alugado' },
                    {
                        where: {
                            tenantId,
                            owner_id: managerId
                        },
                        transaction
                    }
                )
            }

            // Commit da transação se tudo ocorrer bem
            await transaction.commit();

            return res.status(201).json(newProperty);

        } catch (error) {
            // Rollback em caso de erro
            if (transaction) await transaction.rollback();
            
            console.error('Erro ao criar propriedade:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao criar propriedade. Tente novamente.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

router.put(
    '/properties/:id',
    authMiddleware,
    [
        body('address').optional().trim().notEmpty().withMessage('O endereço é obrigatório!'),
        body('property_type').optional().trim().notEmpty().withMessage('O tipo de propriedade é obrigatório!'),
        body('status').optional().trim().notEmpty().withMessage('O status da propriedade é obrigatório!'),
        body('bedrooms').optional().isInt({ min: 1 }).withMessage('O número de quartos deve ser pelo menos 1.'),
        body('bathrooms').optional().isInt({ min: 1 }).withMessage('O número de banheiros deve ser pelo menos 1.'),
        body('rent_amount').optional().isFloat({ min: 0 }).withMessage('O valor do aluguel deve ser positivo.'),
        body('description').optional().trim().notEmpty().withMessage('A descrição é obrigatória!'),
        // body('tenantId').optional().isString().withMessage('O ID do inquilino deve ser uma string.'),
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => err.msg),
            });
        }

        const managerId = req.user.managerId;
        const { id } = req.params;
        let { tenantId, ...updateData } = req.body;

        // Tratamento especial para o tenantId
        tenantId = (tenantId === 'none' || tenantId === '') ? null : tenantId;

        const transaction = await db.sequelize.transaction();

        try {
            // 1. Busca a propriedade (com lock para evitar concorrência)
            const property = await Property.findOne({
                where: { 
                    propertyId: id, 
                    owner_id: managerId 
                },
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!property) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Propriedade não encontrada.',
                });
            }

            // 2. Verifica se o endereço já existe (se foi modificado)
            if (updateData.address && updateData.address !== property.address) {
                const existingProperty = await Property.findOne({
                    where: { address: updateData.address, owner_id: managerId },
                    transaction
                });

                if (existingProperty) {
                    await transaction.rollback();
                    return res.status(400).json({
                        success: false,
                        message: 'Endereço já registrado para outra propriedade.',
                    });
                }
            }

            // 3. Atualiza os campos básicos (exceto tenantId)
            await property.update(updateData, { transaction });

            // 4. Lógica do hook (atualização do tenantId e status)
            if (tenantId !== undefined) {
                const previousTenantId = property.tenantId;

                // Se o tenantId foi alterado
                if (tenantId !== previousTenantId) {
                    // Remove inquilino anterior (se existir)
                    if (previousTenantId) {
                        const previousTenant = await Tenant.findOne({
                            where: { tenantId: previousTenantId, managerId },
                            transaction
                        });

                        if (previousTenant) {
                            // Verifica se o inquilino não está em outra propriedade
                            const otherProperty = await Property.findOne({
                                where: { 
                                    tenantId: previousTenantId,
                                    owner_id: managerId,
                                    propertyId: { [db.Sequelize.Op.ne]: id } // Ignora a propriedade atual
                                },
                                transaction
                            });

                            if (!otherProperty) {
                                previousTenant.status = 'inativo';
                                await previousTenant.save({ transaction });
                            }
                        }
                    }

                    // Atualiza com o novo inquilino (se fornecido)
                    if (tenantId && tenantId !== 'none') {
                        const newTenant = await Tenant.findOne({
                            where: { tenantId, managerId },
                            transaction
                        });

                        if (!newTenant) {
                            await transaction.rollback();
                            return res.status(400).json({
                                success: false,
                                message: 'Inquilino não encontrado.',
                            });
                        }

                        // Verifica se o novo inquilino já está em outra propriedade
                        const tenantInUse = await Property.findOne({
                            where: { 
                                tenantId,
                                owner_id: managerId,
                                propertyId: { [db.Sequelize.Op.ne]: id }
                            },
                            transaction
                        });

                        if (tenantInUse) {
                            await transaction.rollback();
                            return res.status(400).json({
                                success: false,
                                message: 'Inquilino já vinculado a outra propriedade.',
                            });
                        }

                        newTenant.status = 'ativo';
                        await newTenant.save({ transaction });
                        property.status = 'Alugado';
                    } else {
                        property.status = 'Disponível';
                    }

                    property.tenantId = tenantId || null;
                    await property.save({ transaction });
                }
            }

            await transaction.commit();

            return res.status(200).json({
                success: true,
                message: 'Propriedade atualizada com sucesso!',
                property: await Property.findByPk(id) // Retorna os dados atualizados
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Erro ao atualizar propriedade:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao atualizar propriedade. Tente novamente.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

router.delete('/properties/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const managerId = req.user.managerId;

    try {
        // Busca a propriedade pelo ID
        const property = await Property.findOne({
            where: { 
                propertyId: id, 
                owner_id: managerId 
            },
        });

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Propriedade não encontrada.',
            });
        }

        // Remove a propriedade
        await property.destroy();

        // Retorna sucesso
        console.log("Propriedade removida com sucesso!")
        return res.status(200).json({
            success: true,
            message: 'Propriedade removida com sucesso!',
        });
    } catch (error) {
        console.error('Erro ao remover propriedade:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao remover propriedade. Tente novamente.',
        });
    }
});

module.exports = router;