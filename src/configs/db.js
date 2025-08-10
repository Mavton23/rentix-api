require('dotenv').config();

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false,
        define: {
            timestamps: false,
        },
    }
);

sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o MYSQL foi bem-sucedida!');
  })
  .catch((err) => {
    console.error('Erro ao conectar ao banco de dados:', err);
  });

module.exports = {
    Sequelize: Sequelize,
    sequelize: sequelize
}