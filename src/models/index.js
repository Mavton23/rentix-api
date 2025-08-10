const fs = require('fs');
const path = require('path');
const db = require('../configs/db');
const Sequelize = db.Sequelize;
const basename = path.basename(__filename);
const models = {};

// Carrega todos os modelos
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(db.sequelize, Sequelize);
    models[model.name] = model;
  });

// Carrega os hooks
const managerHooks = require('../hooks/managerHooks')(models);
const tenantHooks = require('../hooks/tenantHooks')(models);
const propertyHooks = require('../hooks/propertyHooks')(models);
const paymentHooks = require('../hooks/paymentHooks')(models);

models.Manager.addHook('beforeCreate', managerHooks.beforeCreateManager)
models.Manager.addHook('afterCreate', managerHooks.afterCreateManager);

models.Tenant.addHook('beforeDestroy', tenantHooks.beforeDestroyTenant);

models.Property.addHook('afterCreate', propertyHooks.afterCreateProperty);
models.Property.addHook('beforeDestroy', propertyHooks.beforeDestroy);

models.Payment.addHook('beforeCreate', paymentHooks.beforeCreatePayment);
models.Payment.addHook('beforeSave', paymentHooks.beforeSavePayment);
models.Payment.addHook('beforeUpdate', paymentHooks.beforeUpdatePayment);
models.Payment.addHook('afterUpdate', paymentHooks.afterUpdatePayment);

// Configura as associações
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  ...models,
  sequelize: db.sequelize,
  Sequelize: db.Sequelize
};