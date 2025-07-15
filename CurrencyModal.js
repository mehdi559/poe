import React, { memo } from 'react';
import Modal from '../ui/Modal';

const CurrencyModal = memo(({ financeManager, theme, t }) => {
  const { state, actions, currencies } = financeManager;

  const handleCurrencySelect = (currencyCode) => {
    actions.setCurrency(currencyCode);
    actions.toggleModal('currency', false);
    actions.showNotification(`Devise changée en ${currencyCode}`);
  };

  return (
    <Modal
      isOpen={state.modals.currency}
      onClose={() => actions.toggleModal('currency', false)}
      title="Sélectionner une devise"
    >
      <div className="space-y-3">
        {currencies.map(currency => (
          <button
            key={currency.code}
            onClick={() => handleCurrencySelect(currency.code)}
            className={`w-full p-4 rounded-lg border transition-all text-left ${
              state.selectedCurrency === currency.code
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }`}
            aria-label={`Sélectionner ${currency.name}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${theme.text}`}>{currency.name}</p>
                <p className={`text-sm ${theme.textSecondary}`}>{currency.code}</p>
              </div>
              <span className={`text-2xl ${theme.text}`}>{currency.symbol}</span>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
});

export default CurrencyModal; 