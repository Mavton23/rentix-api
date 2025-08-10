const syncDatabase = require('../database/sync');

syncDatabase({ force: true, alter: false })
  .then(() => process.exit(0))
  .catch(() => process.exit(1));