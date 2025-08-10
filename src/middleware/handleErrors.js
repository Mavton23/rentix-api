const handleErrors = (error, req, res, next) => {
    console.error('Erro:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        errors: messages,
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        errors: ['Já existe um registro com este valor único'],
      });
    }
  
    // Padrão para outros erros
    return res.status(500).json({
      success: false,
      errors: ['Ocorreu um erro no servidor'],
    });
};

module.exports = handleErrors;

