const db = require('../configs/db');

module.exports = (models) => {
  const afterCreateProperty = async (property) => {
    const transaction = await db.sequelize.transaction();
    try {
      if (property.tenantId) {
        property.status = 'alugado';
        await property.save({ transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Erro no hook afterCreate de Property:', error.message);
      throw error;
    }
  };

  const afterUpdateProperty = async (property) => {
    if (!property.changed('tenantId')) return;
    
    const transaction = await db.sequelize.transaction(); 

    try {
        const previousTenantId = property.previous('tenantId');

        // Se existia um inquilino antes
        if (previousTenantId) {
            const previousTenant = await models.Tenant.findOne({
                where: { tenantId: previousTenantId },
                transaction
            });

            if (previousTenant) {
                const associatedProperty = await models.Property.findOne({
                    where: { tenantId: previousTenantId },
                    transaction
                });

                if (!associatedProperty) {
                    previousTenant.status = 'inativo';
                    await previousTenant.save({ transaction });
                }
            }
        }

        // Se há um novo inquilino
        if (property.tenantId) {
            property.status = 'Alugado';

            const newTenant = await models.Tenant.findOne({
                where: { tenantId: property.tenantId },
                transaction
            });

            if (newTenant) {
                newTenant.status = 'ativo';
                await newTenant.save({ transaction });
            }

        } else {
            property.status = 'Disponível';
        }

        await property.save({ transaction });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback(); 
        console.error('Erro no hook afterUpdate de Property:', error instanceof Error ? error.message : error);
        throw error;
    }
};

  const beforeDestroy = async (property) => {
    const transaction = await db.sequelize.transaction();
    
    try {
        if (property.tenantId) {
            const tenant = await models.Tenant.findOne({
                where: { tenantId: property.tenantId },
                transaction
            });

            if (tenant) {
                // Verifica se existe outra propriedade associada ao mesmo inquilino
                const otherProperties = await models.Property.count({
                    where: { 
                        tenantId: property.tenantId,
                        propertyId: { [db.Sequelize.Op.ne]: property.propertyId }
                    },
                    transaction
                });

                if (otherProperties === 0) {
                    tenant.status = 'inativo';
                    await tenant.save({ transaction });
                }
            }
        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error('Erro no hook beforeDestroy de Property:', error.message);
        throw error;
    }
  };

  return {
    afterCreateProperty,
    afterUpdateProperty,
    beforeDestroy
  };
};
