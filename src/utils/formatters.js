module.exports = {
    formatCurrency: (amount, currency) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency || 'MZN'
        }).format(amount);
    },
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
};