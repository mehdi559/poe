import React, { memo } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const CategoryModal = memo(({ financeManager, theme, t }) => {
  const { state, actions } = financeManager;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (actions.addCategory(state.newCategory)) {
      actions.resetForm('newCategory');
      actions.toggleModal('category', false);
    }
  };

  return (
    <Modal
      isOpen={state.modals.category}
      onClose={() => actions.toggleModal('category', false)}
      title="Nouvelle Catégorie"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom de la catégorie"
          type="text"
          value={state.newCategory.name}
          onChange={(value) => actions.updateForm('newCategory', { name: value })}
          error={state.errors.name}
          required
          minLength={2}
          maxLength={30}
        />
        
        <Input
          label="Budget mensuel"
          type="number"
          step="0.01"
          min="0"
          value={state.newCategory.budget}
          onChange={(value) => actions.updateForm('newCategory', { budget: value })}
          error={state.errors.budget}
          required
        />
        
        <div className="flex space-x-2 pt-4">
          <Button type="submit" className="flex-1" loading={state.loading}>
            Créer
          </Button>
          <Button 
            type="button"
            variant="outline" 
            onClick={() => actions.toggleModal('category', false)}
            className="flex-1"
          >
            Annuler
          </Button>
        </div>
      </form>
    </Modal>
  );
});

export default CategoryModal; 