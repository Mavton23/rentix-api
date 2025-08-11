const models = require('../models');
const logger = require('../utils/logger');

// Ordem correta de sincronização baseada nas dependências
const syncOrder = [
  'Manager',
  'Tenant',
  'Property',
  'Payment',
  'PaymentHistory',
  'NotificationLog',
  'Testimonial',
  'FineSettings',
  'BlogCategory',
  'BlogPost',
  'AboutContent',
  'SystemFeature',
  'SystemStatus',
  'SystemIncident',
  'SystemComponent',
  'ContactInfo',
  'ContactMessage',
  'IncidentComponents',
];

const syncDatabase = async (options = {}) => {
  const syncOptions = {
    force: options.force || false,
    alter: options.alter || false,
    logging: options.logging || console.log
  };

  try {
    logger.info('Iniciando sincronização de modelos...');
    
    // Verifica se todos os modelos estão carregados
    const missingModels = syncOrder.filter(model => !models[model]);
    if (missingModels.length > 0) {
      throw new Error(`Modelos não encontrados: ${missingModels.join(', ')}`);
    }

    // Sincroniza na ordem correta
    for (const modelName of syncOrder) {
      try {
        logger.info(`Sincronizando modelo: ${modelName}`);
        await models[modelName].sync(syncOptions);
        logger.info(`✅ ${modelName} sincronizado com sucesso`);
      } catch (error) {
        logger.error(`❌ Falha ao sincronizar ${modelName}:`, error);
        throw error;
      }
    }

    logger.info('🎉 Todos os modelos foram sincronizados na ordem correta!');
    return { success: true, message: 'Sincronização concluída' };
  } catch (error) {
    logger.error('❌ Erro crítico na sincronização:', {
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Falha na sincronização: ${error.message}`);
  }
};

module.exports = syncDatabase;