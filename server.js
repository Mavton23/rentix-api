require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const syncDatabase = require('./src/database/sync');
const logger = require('./src/utils/logger');

const app = express();
const port = process.env.PORT || 5000;

// CORS Config
app.use(cors({
    origin: "https://rentix.vercel.app",
    credentials: true
}));
app.use(express.json());

// Body parser
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));


const startServer = async () => {
    try {
        // logger.info('Ambiente da API - Sincronizando banco de dados...');
        // await syncDatabase({
        //     force: process.env.DB_FORCE_SYNC === 'true',
        //     alter: process.env.DB_ALTER_SYNC === 'true'
        // });

        const apiRouter = require('./src/routes/index');
        app.use('/api', apiRouter);

        // Agendamento de serviço
        require('./src/jobs/scheduler').init()

        app.listen(port, () => {
            logger.info(`API SERVER ARE RUNNING ON ${port}`);
        });
    } catch (error) {
        logger.error('Falha ao iniciar o servidor:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
};

startServer();
