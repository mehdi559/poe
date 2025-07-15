import React, { memo, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const EditDebtModal = memo(({ financeManager, theme, t }) => {
  const { state, actions } = financeManager;

  // Toujours appeler le hook, mais ne rien faire si pas d'item
  useEffect(() => {
    if (state.editingItem && state.modals.editDebt) {
      actions.updateForm('editDebt', {
        name: state.editingItem.name,
        balance: state.editingItem.balance,
        minPayment: state.editingItem.minPayment,
        rate: state.editingItem.rate,
        autoDebit: state.editingItem.autoDebit || false
      });
    }
  }, [state.editingItem, state.modals.editDebt, actions]);

  // Early return pour le rendu
  if (!state.editingItem) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (actions.updateDebt(state.editingItem.id, state.editDebt)) {
      actions.toggleModal('editDebt', false);
      actions.setEditingItem(null);
      actions.resetForm('editDebt');
    }
  };

  const handleCancel = () => {
    actions.toggleModal('editDebt', false);
    actions.setEditingItem(null);
    actions.resetForm('editDebt');
  };

  return (
    <Modal
      isOpen={state.modals.editDebt}
      onClose={handleCancel}
      title={t('editDebtTitle', { name: state.editingItem.name })}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={`p-4 rounded-lg ${theme.bg} border ${theme.border}`}>
          <p className={`text-sm ${theme.textSecondary} mb-2`}>{t('editDebtInformation')}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className={`${theme.text}`}>{t('currentBalance')}</span>
              <span className="font-medium text-red-600">
                {state.editingItem.balance}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`${theme.text}`}>{t('minimumPayment')}</span>
              <span className={theme.text}>{state.editingItem.minPayment}</span>
            </div>
            <div className="flex justify-between">
              <span className={`${theme.text}`}>{t('interestRate')}</span>
              <span className={theme.text}>{state.editingItem.rate}%</span>
            </div>
          </div>
        </div>
        
        <Input
          label={t('debtName')}
          type="text"
          value={state.editDebt.name}
          onChange={(value) => actions.updateForm('editDebt', { name: value })}
          error={state.errors.name}
          required
          minLength={2}
          maxLength={50}
        />
        
        <Input
          label={t('currentBalance')}
          type="number"
          step="0.01"
          min="0"
          value={state.editDebt.balance}
          onChange={(value) => actions.updateForm('editDebt', { balance: value })}
          error={state.errors.balance}
          required
        />
        
        <Input
          label={t('minimumPayment')}
          type="number"
          step="0.01"
          min="0"
          value={state.editDebt.minPayment}
          onChange={(value) => actions.updateForm('editDebt', { minPayment: value })}
          error={state.errors.minPayment}
          required
        />
        
        <Input
          label={t('interestRate')}
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={state.editDebt.rate}
          onChange={(value) => actions.updateForm('editDebt', { rate: value })}
          error={state.errors.rate}
          required
        />
        
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="autoDebit"
            checked={state.editDebt.autoDebit || false}
            onChange={(e) => actions.updateForm('editDebt', { autoDebit: e.target.checked })}
            className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="autoDebit" className={`text-sm ${theme.text}`}>
            {t('autoDebit')}
          </label>
        </div>
        
        {state.editDebt.autoDebit && (
          <div className={`p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800`}>
            <p className={`text-sm ${theme.textSecondary}`}>
              {t('autoDebitDescription')}
            </p>
          </div>
        )}
        
        <div className="flex space-x-2 pt-4">
          <Button type="submit" variant="primary" className="flex-1" loading={state.loading}>
            {t('update')}
          </Button>
          <Button 
            type="button"
            variant="outline" 
            onClick={handleCancel}
            className="flex-1"
          >
            {t('cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
});

export default EditDebtModal; 