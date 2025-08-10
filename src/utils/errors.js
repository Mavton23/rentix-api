class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode || 500;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
  }
  
  class NotFoundError extends AppError {
    constructor(message = 'Recurso não encontrado') {
        super(message, 404);
    }
  }
  
  class BadRequestError extends AppError {
    constructor(message = 'Requisição inválida') {
        super(message, 400);
    }
  }
  
  class ForbiddenError extends AppError {
    constructor(message = 'Acesso não autorizado') {
        super(message, 403);
    }
  }
  
  class UnauthorizedError extends AppError {
    constructor(message = 'Não autenticado') {
        super(message, 401);
    }
  }
  
  class ConflictError extends AppError {
    constructor(message = 'Conflito de recursos') {
        super(message, 409);
    }
  }
  
  module.exports = {
    AppError,
    NotFoundError,
    BadRequestError,
    ForbiddenError,
    UnauthorizedError,
    ConflictError
  };