const initialContactData = [
  {
    type: 'email',
    title: 'E-mail Principal',
    value: 'contato@empresa.com',
    additionalValue: 'suporte@empresa.com',
    icon: 'mail',
    order: 1
  },
  {
    type: 'phone',
    title: 'Telefone Comercial',
    value: '(11) 9999-9999',
    additionalValue: '(11) 8888-8888',
    icon: 'phone',
    order: 2
  },
  {
    type: 'address',
    title: 'Endereço',
    value: 'Av. Paulista, 1000',
    additionalValue: 'São Paulo/SP - CEP 01310-100',
    icon: 'map-pin',
    order: 3
  },
  {
    type: 'hours',
    title: 'Horário de Funcionamento',
    value: 'Segunda a Sexta: 9h às 18h',
    additionalValue: 'Sábado: 9h às 13h',
    icon: 'clock',
    order: 4
  }
];

module.exports = {
  /**
   * Verifica e insere dados iniciais de contato se a tabela estiver vazia
   * @param {Model} ContactInfo - Model do Sequelize
   * @returns {Promise<void>}
   */
  initializeContactData: async (ContactInfo) => {
    try {
      const count = await ContactInfo.count();
      if (count === 0) {
        await ContactInfo.bulkCreate(initialContactData);
        console.log('✅ Dados iniciais de contato criados com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar dados de contato:', error);
      throw error;
    }
  },

  /**
   * Obtém os dados iniciais (para uso em testes ou outras finalidades)
   * @returns {Array} Dados iniciais
   */
  getInitialData: () => initialContactData
};