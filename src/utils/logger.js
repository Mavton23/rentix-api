const winston = require('winston');
const { format } = winston;
const path = require('path');

// Defina o formato personalizado para os logs
const logFormat = format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Crie o logger
const logger = winston.createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        logFormat
    ),
    transports: [
        // Console logging
        new winston.transports.Console({
            format: format.combine(
                format.colorize(),
                logFormat
            )
        }),
        // File logging (erros)
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error'
        }),
        // File logging (todos os logs)
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log')
        })
    ]
});

// Adicione para lidar com exceções não capturadas
logger.exceptions.handle(
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/exceptions.log')
    })
);

module.exports = logger;