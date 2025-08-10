require('dotenv').config();

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
              require: true,
              rejectUnauthorized: false
          }
        },
        logging: false,
        define: {
            timestamps: false,
        },
    }
);

sequelize.authenticate();

module.exports = {
    Sequelize: Sequelize,
    sequelize: sequelize
}