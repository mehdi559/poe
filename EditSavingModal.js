import React, { memo } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const EditSavingModal = memo(({ financeManager, theme, t }) => {
  const { state, actions, formatCurrency } = financeManager;

  console.log('EditSavingModal render:', {
    isOpen: state.modals.editSaving,
    editingItem: state.editingItem,
    savingTransaction: state.savingTransaction
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('EditSavingModal handleSubmit called with savingTransaction:', state.savingTransaction);
    if (actions.addSavingsTransaction(state.editingItem.id, state.savingTransaction)) {
      actions.toggleModal('editSaving', false);
      actions.setEditingItem(null);
      actions.resetForm('savingTransaction');
    }
  };

  if (!state.editingItem) {
    console.log('EditSavingModal: no editingItem, returning null');
    return null;
  }

  const progress = ((state.editingItem.currentAmount / state.editingItem.targetAmount) * 100).toFixed(1);

  return (
    <Modal
      isOpen={state.modals.editSaving}
      onClose={() => {
        actions.toggleModal('editSaving', false);
        actions.setEditingItem(null);
        actions.resetForm('savingTransaction');
      }}
      title={t('editSavingTitle', { name: state.editingItem.name })}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={`p-4 rounded-lg ${theme.bg} border ${theme.border}`}>
          <p className={`text-sm font-medium ${theme.text} mb-3`}>{t('goalInformation')}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className={theme.textSecondary}>{t('currentAmount')}</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatCurrency(state.editingItem.currentAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={theme.textSecondary}>{t('target')}</span>
              <span className={`font-medium ${theme.text}`}>
                {formatCurrency(state.editingItem.targetAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={theme.textSecondary}>{t('progression')}</span>
              <span className={`font-medium ${theme.text}`}>
                {progress}%
              </span>
            </div>
            {/* Barre de progression */}
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${Math.min(parseFloat(progress), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <label className={`block text-sm font-medium ${theme.text}`}>
            {t('operationType')} <span className="text-red-500">*</span>
          </label>
          <select
            value={state.savingTransaction.type}
            onChange={(e) => actions.updateForm('savingTransaction', { type: e.target.value })}
            className={`w-full px-3 py-2 text-base border rounded-lg ${theme.input}`}
            required
          >
            <option value="add">{t('addMoney')}</option>
            <option value="remove">{t('removeMoney')}</option>
          </select>
        </div>
        
        <Input
          label={t('date')}
          type="date"
          value={state.savingTransaction.date || new Date().toISOString().split('T')[0]}
          onChange={(value) => {
            console.log('DEBUG Date changed in modal:', value);
            actions.updateForm('savingTransaction', { date: value });
          }}
          required
        />
        
        <Input
          label={t('amount')}
          type="number"
          step="0.01"
          min="0"
          max={state.savingTransaction.type === 'remove' ? state.editingItem.currentAmount : state.editingItem.targetAmount - state.editingItem.currentAmount}
          value={state.savingTransaction.amount}
          onChange={(value) => actions.updateForm('savingTransaction', { amount: value })}
          error={state.errors.amount}
          required
        />
        
        <Input
          label={t('description')}
          type="text"
          value={state.savingTransaction.description}
          onChange={(value) => actions.updateForm('savingTransaction', { description: value })}
          error={state.errors.description}
          required
          minLength={3}
          maxLength={100}
          placeholder={t('transactionDescriptionPlaceholder')}
        />
        
        <div className="flex space-x-2 pt-4">
          <Button type="submit" variant={state.savingTransaction.type === 'add' ? 'success' : 'danger'} className="flex-1" loading={state.loading}>
            {state.savingTransaction.type === 'add' ? t('add') : t('remove')}
          </Button>
          <Button 
            type="button"
            variant="outline" 
            onClick={() => {
              actions.toggleModal('editSaving', false);
              actions.setEditingItem(null);
              actions.resetForm('savingTransaction');
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

export default EditSavingModal; 