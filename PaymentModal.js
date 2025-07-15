import React, { memo } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const PaymentModal = memo(({ financeManager, theme, t }) => {
  const { state, actions, formatCurrency } = financeManager;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (actions.recordPayment(state.editingItem.id, state.paymentAmount)) {
      actions.toggleModal('payment', false);
      actions.setEditingItem(null);
      actions.setPaymentAmount('');
    }
  };

  if (!state.editingItem) return null;

  return (
    <Modal
      isOpen={state.modals.payment}
      onClose={() => {
        actions.toggleModal('payment', false);
        actions.setEditingItem(null);
        actions.setPaymentAmount('');
      }}
      title={t('recordPaymentFor', { name: state.editingItem.name })}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={`p-4 rounded-lg ${theme.bg} border ${theme.border}`}>
          <p className={`text-sm ${theme.textSecondary} mb-2`}>{t('debtInformation')}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{t('currentBalance')}</span>
              <span className="font-medium text-red-600">
                {formatCurrency(state.editingItem.balance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('minimumPayment')}</span>
              <span className={theme.text}>{formatCurrency(state.editingItem.minPayment)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('interestRate')}</span>
              <span className={theme.text}>{state.editingItem.rate}%</span>
            </div>
          </div>
        </div>
        
        <Input
          label={t('paymentAmount')}
          type="number"
          step="0.01"
          min="0"
          max={state.editingItem.balance}
          value={state.paymentAmount || ''}
          onChange={actions.setPaymentAmount}
          required
          aria-describedby="payment-help"
        />
        <p id="payment-help" className="text-xs text-gray-500">
          {t('paymentAmountHelp', { amount: formatCurrency(state.editingItem.balance) })}
        </p>
        
        <div className="flex space-x-2 pt-4">
          <Button type="submit" variant="success" className="flex-1" loading={state.loading}>
            {t('record')}
          </Button>
          <Button 
            type="button"
            variant="outline" 
            onClick={() => {
              actions.toggleModal('payment', false);
              actions.setEditingItem(null);
              actions.setPaymentAmount('');
            }}
            className="flex-1"
          >
            {t('cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
});

export default PaymentModal; 