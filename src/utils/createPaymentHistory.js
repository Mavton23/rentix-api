module.exports = (models) => {
  async function createPaymentHistory(paymentId, action, oldValue, newValue, changedBy, options = {}) {
      try {
        await models.PaymentHistory.create({
          paymentId,
          action,
          oldValue: oldValue ? JSON.stringify(oldValue) : null,
          newValue: newValue ? JSON.stringify(newValue) : null,
          changedBy,
          changeDate: new Date(),
        }, options);
        console.log(`Histórico de pagamento criado para o pagamento: ${paymentId}`);
      } catch (error) {
        console.error('Erro ao criar histórico de pagamento:', error);
        throw error
      }
  };

  return createPaymentHistory;
}
