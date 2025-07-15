// BudgetScreen.js - Version enrichie
import React, { memo, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import Button from '../components/ui/Button';

const BudgetScreen = memo(({ financeManager, theme, t }) => {
  const { state, actions, computedValues, formatCurrency } = financeManager;
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editedBudget, setEditedBudget] = useState('');

  // Suggestions de budgets basées sur des règles standards
  const getBudgetSuggestions = useMemo(() => {
    const income = state.monthlyIncome;
    return {
      [t('housing')]: { suggested: income * 0.30, rule: t('housingRule') },
      [t('food')]: { suggested: income * 0.15, rule: t('foodRule') },
      [t('transport')]: { suggested: income * 0.15, rule: t('transportRule') },
      [t('leisure')]: { suggested: income * 0.10, rule: t('leisureRule') },
      [t('health')]: { suggested: income * 0.05, rule: t('healthRule') },
      [t('savings')]: { suggested: income * 0.20, rule: t('savingsRule') }
    };
  }, [state.monthlyIncome, t]);

  // Comparaisons avec moyennes nationales (simulées)
  const getNationalAverages = (categoryName) => {
    const averages = {
      [t('housing')]: 850,
      [t('food')]: 450,
      [t('transport')]: 300,
      [t('leisure')]: 200,
      [t('health')]: 120
    };
    return averages[categoryName] || 100;
  };

  // Historique des modifications de budget (simulé)
  const getBudgetHistory = useMemo(() => [
    { date: '2025-01-01', category: t('food'), oldAmount: 350, newAmount: 400, reason: t('foodInflation') },
    { date: '2024-12-15', category: t('leisure'), oldAmount: 200, newAmount: 150, reason: t('budgetOptimization') },
    { date: '2024-12-01', category: t('transport'), oldAmount: 180, newAmount: 200, reason: t('fuelIncrease') }
  ], [t]);

  // Alertes de seuil personnalisables
  const getThresholdAlerts = () => {
    const alerts = [];
    state.categories.forEach(category => {
      const spent = computedValues.currentMonthExpenses
        .filter(e => e.category === category.name)
        .reduce((sum, e) => sum + e.amount, 0);
      const percentage = (spent / category.budget) * 100;
      
      if (percentage > 90) {
        alerts.push({
          category: category.name,
          level: 'danger',
          message: `${t('budgetAlmostExhausted')} (${percentage.toFixed(1)}%)`
        });
      } else if (percentage > 75) {
        alerts.push({
          category: category.name,
          level: 'warning', 
          message: `${t('budgetWarning')} (${percentage.toFixed(1)}%)`
        });
      }
    });
    return alerts;
  };

  const thresholdAlerts = getThresholdAlerts();

  return (
    <div className="space-y-6">
      {/* Alertes de seuil */}
      {thresholdAlerts.length > 0 && (
        <div className={`${theme.card} rounded-xl border ${theme.border} p-4`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-3 flex items-center`}>
            <Icons.AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
            {t('budgetAlerts')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {thresholdAlerts.map((alert, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                alert.level === 'danger' ? 'border-red-200 bg-red-50 dark:bg-red-900/20' : 
                'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{alert.category}</span>
                  <Icons.AlertCircle className={`h-4 w-4 ${
                    alert.level === 'danger' ? 'text-red-500' : 'text-yellow-500'
                  }`} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section principale */}
      <div className={`${theme.card} rounded-xl border ${theme.border} p-6 mt-[80px]`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${theme.text}`}>{t('budgetManagement')}</h2>
          <div className="flex space-x-2">
            <Button
              onClick={() => actions.toggleModal('category', true)}
              className="flex items-center space-x-2"
            >
              <Icons.Plus className="h-4 w-4" />
              <span>{t('newCategory')}</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center space-x-2 bg-white hover:bg-white dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
              onClick={() => {
                const optimizedBudgets = {};
                state.categories.forEach(cat => {
                  optimizedBudgets[cat.name] = getBudgetSuggestions[cat.name]?.suggested || cat.budget;
                });
                actions.optimizeBudgets(optimizedBudgets);
              }}
            >
              <Icons.Zap className="h-4 w-4 dark:text-white" />
              <span>{t('optimize')}</span>
            </Button>
          </div>
        </div>

        {/* Graphique en barres des budgets vs dépenses */}
        <div className={`mb-6 p-4 rounded-lg ${theme.bg} border ${theme.border}`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>{t('budgetOverview')}</h3>
          <div className="space-y-3">
            {state.categories.map(category => {
              const spent = computedValues.currentMonthExpenses
                .filter(e => e.category === category.name)
                .reduce((sum, e) => sum + e.amount, 0);
              const percentage = (spent / category.budget) * 100;
              const remaining = category.budget - spent;
              const isEditing = editingCategoryId === category.id;
              
              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${theme.text}`}>{category.name}</span>
                    <div className="text-right flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            min="0"
                            className="w-24 px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white"
                            value={editedBudget}
                            onChange={e => setEditedBudget(e.target.value)}
                          />
                          <button
                            className="text-green-600 hover:text-green-800"
                            title={t('validate')}
                            onClick={() => {
                              actions.updateCategoryBudget(category.id, editedBudget);
                              setEditingCategoryId(null);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            title={t('cancel')}
                            onClick={() => setEditingCategoryId(null)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <span className={`text-sm font-medium ${percentage > 100 ? 'text-red-600' : theme.text}`}>{state.showBalances ? formatCurrency(category.budget) : '•••'}</span>
                          <button
                            className="ml-1 text-gray-400 hover:text-blue-600"
                            title={t('editBudget')}
                            onClick={() => {
                              setEditingCategoryId(category.id);
                              setEditedBudget(category.budget);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3h3z" /></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          percentage > 100 ? 'bg-red-500' : 
                          percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    {percentage > 100 && (
                      <div className="absolute top-0 right-0 w-2 h-3 bg-red-600 rounded-r-full"></div>
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="text-base font-bold text-gray-500 dark:text-white">{percentage.toFixed(1)}% {t('used')}</span>
                    {getBudgetSuggestions[category.name] && (
                      <span className="text-base font-bold text-gray-500 dark:text-white">{t('suggested')}: {formatCurrency(getBudgetSuggestions[category.name].suggested)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grille des cartes de catégories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {state.categories.map(category => {
            const spent = computedValues.currentMonthExpenses
              .filter(e => e.category === category.name)
              .reduce((sum, e) => sum + e.amount, 0);
            const percentage = (spent / category.budget) * 100;
            const suggestion = getBudgetSuggestions[category.name];
            const nationalAvg = getNationalAverages(category.name);

            return (
              <div key={category.id} className={`${theme.card} border ${theme.border} rounded-lg p-4 hover:shadow-lg transition-shadow`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <h3 className={`font-semibold ${theme.text}`}>{category.name}</h3>
                  </div>
                  <button
                    onClick={() => actions.deleteCategory(category.id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                  >
                    <Icons.Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={theme.textSecondary}>{t('spent')}</span>
                      <span className={`font-medium ${percentage > 100 ? 'text-red-500' : theme.text}`}>
                        {state.showBalances 
                          ? `${formatCurrency(spent)} / ${formatCurrency(category.budget)}`
                          : '••• / •••'
                        }
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percentage > 100 ? 'bg-red-500' : 
                          percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs ${theme.textSecondary}`}>
                      {percentage.toFixed(1)}% {t('used')}
                    </p>
                  </div>

                  {/* Comparaisons et suggestions */}
                  <div className={`p-2 rounded-lg ${theme.bg} border ${theme.border} space-y-1`}>
                    {suggestion && (
                      <div className="flex justify-between text-xs">
                        <span className={theme.textSecondary}>{t('suggested')}:</span>
                        <span className={`font-medium ${
                          category.budget > suggestion.suggested ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(suggestion.suggested)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className={theme.textSecondary}>{t('nationalAverage')}:</span>
                      <span className={`font-medium ${
                        category.budget > nationalAvg ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                        {formatCurrency(nationalAvg)}
                      </span>
                    </div>
                  </div>

                  {suggestion && category.budget !== suggestion.suggested && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        // Appliquer la suggestion (nécessiterait une nouvelle action)
                        console.log(`Appliquer suggestion pour ${category.name}: ${suggestion.suggested}`);
                      }}
                    >
                      {t('applySuggestion')} ({formatCurrency(suggestion.suggested)})
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Historique des modifications */}
        <div className={`p-4 rounded-lg ${theme.bg} border ${theme.border}`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-3 flex items-center`}>
            <Icons.History className="h-5 w-5 mr-2" />
            {t('modificationHistory')}
          </h3>
          <div className="space-y-2">
            {getBudgetHistory.map((change, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-500">
                    {new Date(change.date).toLocaleDateString(state.language === 'fr' ? 'fr-FR' : state.language === 'es' ? 'es-ES' : 'en-US')}
                  </div>
                  <div className={`text-sm font-medium ${theme.text}`}>
                    {change.category}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-red-600">{formatCurrency(change.oldAmount)}</span>
                  <Icons.ArrowRight className="h-3 w-3 text-gray-400" />
                  <span className="text-sm text-green-600">{formatCurrency(change.newAmount)}</span>
                  <div className="text-xs text-gray-500 max-w-32 truncate" title={change.reason}>
                    {change.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default BudgetScreen;