// Fonctions utilitaires de date extraites de App.js
export const dateUtils = {
  formatDate: (date, locale = 'fr-FR') => {
    return new Date(date).toLocaleDateString(locale);
  },
  formatCurrency: (amount, currency = 'EUR', locale = 'fr-FR') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  },
  getMonthName: (monthIndex, locale = 'fr-FR') => {
    const date = new Date();
    date.setMonth(monthIndex);
    return date.toLocaleDateString(locale, { month: 'long' });
  }
}; 