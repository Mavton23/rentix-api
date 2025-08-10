const { Tenant, Property } = require('../models')
const { sequelize } = require('../configs/db')
const { Op } = require('sequelize');
const { validationResult } = require('express-validator')
const { validate: isUuidValid } = require('uuid');

module.exports = {
    getProperties: async (req, res) => {
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
    },

    getPropertyById: async (req, res) => {
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
    },

    getTenant: async (req, res) => {
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
            });

            // Retorna as informações da propriedade
            return res.status(200).json(property);
        } catch (error) {
            console.error('Erro ao buscar propriedade:', error);

            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar propriedade. Tente novamente.',
                error: errorMessage
            });
        }
    },

    createProperty: async (req, res) => {
        const errors = validationResult(req);
                
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => err.msg),
            });
        }

        const managerId = req.user.managerId;
        let { address, property_type, bedrooms, bathrooms, rent_amount, description, tenantId } = req.body;

        tenantId = (tenantId === 'none' || tenantId === '') ? null : tenantId;

        const transaction = await sequelize.transaction();

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

            await transaction.commit();

            return res.status(201).json(newProperty);

        } catch (error) {
            if (transaction) await transaction.rollback();
            
            console.error('Erro ao criar propriedade:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro ao criar propriedade. Tente novamente.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    updateProperty: async (req, res) => {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().map(err => err.msg),
            });
        }

        const { managerId } = req.user;
        const { id } = req.params;
        let { tenantId, ...updateData } = req.body;

        tenantId = (tenantId === 'none' || tenantId === '') ? null : tenantId;

        const transaction = await sequelize.transaction();

        try {
            // Busca a propriedade
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

            // Verifica se o endereço já existe
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

            // Atualiza os campos básicos
            await property.update(updateData, { transaction });

            // Lógica do hook
            if (tenantId !== undefined) {
                const previousTenantId = property.tenantId;

                if (tenantId !== previousTenantId) {
                    if (previousTenantId) {
                        const previousTenant = await Tenant.findOne({
                            where: { tenantId: previousTenantId, managerId },
                            transaction
                        });

                        if (previousTenant) {
                            const otherProperty = await Property.findOne({
                                where: { 
                                    tenantId: previousTenantId,
                                    owner_id: managerId,
                                    propertyId: { [Op.ne]: id }
                                },
                                transaction
                            });

                            if (!otherProperty) {
                                previousTenant.status = 'inativo';
                                await previousTenant.save({ transaction });
                            }
                        }
                    }

                    // Atualiza com o novo inquilino
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
                                propertyId: { [Op.ne]: id }
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
                property: await Property.findByPk(id)
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
    },

    deleteProperty: async (req, res) => {
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
    }
}