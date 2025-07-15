import React, { memo } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const EditExpenseModal = memo(({ financeManager, theme, t }) => {
  const { state, actions } = financeManager;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (actions.updateExpense(state.editingItem)) {
      actions.toggleModal('editExpense', false);
      actions.setEditingItem(null);
    }
  };

  if (!state.editingItem) return null;

  return (
    <Modal
      isOpen={state.modals.editExpense}
      onClose={() => {
        actions.toggleModal('editExpense', false);
        actions.setEditingItem(null);
      }}
      title="Modifier la dépense"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Date"
          type="date"
          value={state.editingItem.date}
          onChange={(value) => actions.setEditingItem({...state.editingItem, date: value})}
          required
          max={new Date().toISOString().split('T')[0]}
        />
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Catégorie <span className="text-red-500">*</span>
          </label>
          <select
            value={state.editingItem.category}
            onChange={(e) => actions.setEditingItem({...state.editingItem, category: e.target.value})}
            className={`w-full px-3 py-2 text-base border rounded-lg ${theme.input}`}
            required
          >
            {state.categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        <Input
          label="Montant"
          type="number"
          step="0.01"
          min="0"
          value={state.editingItem.amount}
          onChange={(value) => actions.setEditingItem({...state.editingItem, amount: value})}
          error={state.errors.amount}
          required
        />
        
        <Input
          label="Description"
          type="text"
          value={state.editingItem.description}
          onChange={(value) => actions.setEditingItem({...state.editingItem, description: value})}
          error={state.errors.description}
          required
          minLength={3}
          maxLength={100}
        />
        
        <div className="flex space-x-2 pt-4">
          <Button type="submit" className="flex-1" loading={state.loading}>
            Sauvegarder
          </Button>
          <Button 
            type="button"
            variant="outline" 
            onClick={() => {
              actions.toggleModal('editExpense', false);
              actions.setEditingItem(null);
            }}
            className="flex-1"
          >
            Annuler
          </Button>
        </div>
      </form>
    </Modal>
  );
});

export default EditExpenseModal; 