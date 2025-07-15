import React, { memo, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { validators } from '../../utils/validators';

const IncomeModal = memo(({ financeManager, theme, t }) => {
  const { state, actions, getCurrentCurrency } = financeManager;
  const [tempIncome, setTempIncome] = useState(state.monthlyIncome.toString());

  const handleSave = () => {
    const amount = parseFloat(tempIncome);
    if (validators.positiveNumber(tempIncome)) {
      actions.setMonthlyIncome(amount);
      actions.toggleModal('income', false);
      actions.showNotification('Revenus mensuels mis à jour');
    } else {
      actions.showNotification('Montant invalide', 'error');
    }
  };

  return (
    <Modal
      isOpen={state.modals.income}
      onClose={() => actions.toggleModal('income', false)}
      title="Modifier les revenus mensuels"
    >
      <div className="space-y-4">
        <Input
          label={`Revenus mensuels (${getCurrentCurrency().code})`}
          type="number"
          step="0.01"
          min="0"
          value={tempIncome}
          onChange={setTempIncome}
          required
          aria-describedby="income-help"
        />
        <p id="income-help" className="text-xs text-gray-500">
          Entrez vos revenus nets mensuels
        </p>
        
        <div className="flex space-x-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            Sauvegarder
          </Button>
          <Button 
            variant="outline" 
            onClick={() => actions.toggleModal('income', false)}
            className="flex-1"
          >
            Annuler
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default IncomeModal; 