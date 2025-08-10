const { Manager, Tenant, Property } = require('../models/container/Model');

async function clearDatabase() {
    await Manager.destroy({ truncate: true, cascade: true, restartIdentity: true });
    await Tenant.destroy({ truncate: true, cascade: true, restartIdentity: true });
    await Property.destroy({ truncate: true, cascade: true, restartIdentity: true });
    // await Manager.destroy({ truncate: true, cascade: true, restartIdentity: true });
    console.log('Todas as tabelas foram esvaziadas.');
}

clearDatabase();
