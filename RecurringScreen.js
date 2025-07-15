// RecurringScreen.js - Version enrichi
import React, { memo, useMemo, useEffect } from 'react';
import * as Icons from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const RecurringScreen = memo(({ financeManager, theme, t }) => {
  const { state, actions, computedValues, formatCurrency } = financeManager;

  useEffect(() => {
    actions.processRecurringExpenses();
    // eslint-disable-next-line
  }, []);

  // Analyse de l'impact annuel des récurrentes
  const getAnnualImpactAnalysis = useMemo(() => {
    const activeRecurring = state.recurringExpenses.filter(exp => exp.active);
    const totalMonthly = activeRecurring.reduce((sum, exp) => sum + exp.amount, 0);
    const totalAnnual = totalMonthly * 12;
    
    // Analyse par catégorie
    const byCategory = activeRecurring.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});
    
    // Suggestions d'optimisation
    const optimizations = [];
    activeRecurring.forEach(exp => {
      if (exp.amount > 20) {
        optimizations.push({
          expense: exp,
          suggestion: t('cancelExpenseSuggestion', { description: exp.description, amount: formatCurrency(exp.amount * 12) }),
          impact: 'high'
        });
      } else if (exp.amount > 10) {
        optimizations.push({
          expense: exp,
          suggestion: t('reduceExpenseSuggestion', { description: exp.description, amount: formatCurrency(exp.amount * 6) }),
          impact: 'medium'
        });
      }
    });
    
    return {
      totalMonthly,
      totalAnnual,
      byCategory,
      optimizations: optimizations.slice(0, 3), // Top 3 suggestions
      percentageOfIncome: (totalMonthly / state.monthlyIncome) * 100
    };
  }, [state.recurringExpenses, state.monthlyIncome, formatCurrency, t]);

  // Notifications d'échéance intelligentes
  const getUpcomingNotifications = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const notifications = [];
    
    state.recurringExpenses.forEach(exp => {
      if (exp.active) {
        const daysUntil = exp.dayOfMonth - currentDay;
        
        if (daysUntil >= 0 && daysUntil <= 7) {
          notifications.push({
            expense: exp,
            daysUntil,
            urgency: daysUntil <= 2 ? 'high' : daysUntil <= 5 ? 'medium' : 'low'
          });
        }
      }
    });
    
    return notifications.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [state.recurringExpenses]);

  // Templates de dépenses récurrentes courantes
  const getRecurringTemplates = () => [
    { description: t('netflix'), category: t('leisure'), amount: 15.99, dayOfMonth: 15 },
    { description: t('spotify'), category: t('leisure'), amount: 9.99, dayOfMonth: 1 },
    { description: t('gym'), category: t('health'), amount: 29.99, dayOfMonth: 1 },
    { description: t('carInsurance'), category: t('transport'), amount: 45, dayOfMonth: 5 },
    { description: t('internetBox'), category: t('housing'), amount: 39.99, dayOfMonth: 15 },
    { description: t('phone'), category: t('housing'), amount: 25, dayOfMonth: 20 },
  ];

  // Analyse des tendances de prélèvement
  const getWithdrawalTrends = useMemo(() => {
    const trends = {
      startOfMonth: 0, // 1-10
      midMonth: 0,     // 11-20  
      endOfMonth: 0    // 21-31
    };
    
    state.recurringExpenses.forEach(exp => {
      if (exp.active) {
        if (exp.dayOfMonth <= 10) trends.startOfMonth += exp.amount;
        else if (exp.dayOfMonth <= 20) trends.midMonth += exp.amount;
        else trends.endOfMonth += exp.amount;
      }
    });
    
    return trends;
  }, [state.recurringExpenses]);

  const analysis = getAnnualImpactAnalysis;
  const notifications = getUpcomingNotifications;
  const templates = getRecurringTemplates();
  const trends = getWithdrawalTrends;

  return (
    <div className="space-y-6 mt-[80px]">
      {/* Section principale - Dépenses récurrentes */}
      <div className={`${theme.card} rounded-xl border ${theme.border} p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${theme.text}`}>{t('recurringExpenses')}</h2>
          <div className="text-right">
            <p className={`text-2xl font-bold ${theme.text}`}>
              {state.showBalances ? formatCurrency(computedValues.totalRecurring) : '•••'}
            </p>
            <p className={`text-sm ${theme.textSecondary}`}>{t('monthlyTotal')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>{t('newRecurringExpense')}</h3>
            {/* Templates rapides */}
            <div className="mb-4">
              <p className={`text-sm ${theme.textSecondary} mb-2`}>{t('commonTemplates')}</p>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => actions.updateForm('newRecurring', template)}
                    className={`p-2 text-xs rounded-lg border ${theme.border} ${theme.text} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left`}
                  >
                    <div className="font-medium">{template.description}</div>
                    <div className="text-gray-500">{formatCurrency(template.amount)}</div>
                  </button>
                ))}
              </div>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (state.editingItem) {
                  // Mode édition : mettre à jour la dépense existante
                  const updatedExpense = {
                    ...state.editingItem,
                    description: state.newRecurring.description,
                    category: state.newRecurring.category,
                    amount: parseFloat(state.newRecurring.amount),
                    dayOfMonth: parseInt(state.newRecurring.dayOfMonth)
                  };
                  if (actions.updateRecurringExpense(updatedExpense)) {
                    actions.setEditingItem(null);
                    actions.resetForm('newRecurring');
                  }
                } else {
                  // Mode création : ajouter une nouvelle dépense
                  if (actions.addRecurringExpense(state.newRecurring)) {
                    actions.resetForm('newRecurring');
                  }
                }
              }}
              className="space-y-4"
            >
              <Input
                label={t('description')}
                type="text"
                value={state.newRecurring.description}
                onChange={(value) => actions.updateForm('newRecurring', { description: value })}
                error={state.errors.description}
                required
                minLength={2}
                maxLength={50}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('category')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={state.newRecurring.category}
                  onChange={(e) => actions.updateForm('newRecurring', { category: e.target.value })}
                  className={`w-full px-3 py-2 text-base border rounded-lg ${theme.input} ${
                    state.errors.category ? 'border-red-500' : ''
                  }`}
                  required
                >
                  <option value="">{t('selectCategory')}</option>
                  {state.categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                {state.errors.category && (
                  <p className="text-sm text-red-600" role="alert">{state.errors.category}</p>
                )}
              </div>
              <Input
                label={t('amount')}
                type="number"
                step="0.01"
                min="0"
                value={state.newRecurring.amount}
                onChange={(value) => actions.updateForm('newRecurring', { amount: value })}
                error={state.errors.amount}
                required
              />
              <Input
                label={t('dayOfMonth')}
                type="number"
                min="1"
                max="31"
                value={state.newRecurring.dayOfMonth}
                onChange={(value) => actions.updateForm('newRecurring', { dayOfMonth: value })}
                error={state.errors.dayOfMonth}
                required
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={state.loading}
                loading={state.loading}
              >
                {state.editingItem ? t('update') : t('add')}
              </Button>
              {state.editingItem && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    actions.setEditingItem(null);
                    actions.resetForm('newRecurring');
                  }}
                >
                  {t('cancel')}
                </Button>
              )}
            </form>
          </div>
          <div className="lg:col-span-2">
            <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>{t('yourRecurringExpenses')}</h3>
            <div className="space-y-3">
              {state.recurringExpenses.map(expense => {
                const today = new Date();
                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();
                // Calculer la prochaine occurrence
                let nextOccurrence;
                if (expense.dayOfMonth >= today.getDate()) {
                  nextOccurrence = new Date(currentYear, currentMonth, expense.dayOfMonth);
                } else {
                  nextOccurrence = new Date(currentYear, currentMonth + 1, expense.dayOfMonth);
                }
                const daysUntilNext = Math.ceil((nextOccurrence - today) / (1000 * 60 * 60 * 24));
                return (
                  <div key={expense.id} className={`${theme.card} border ${theme.border} rounded-lg p-4 ${!expense.active ? 'opacity-60' : ''}`}> 
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <h4 className={`font-semibold ${theme.text}`}>{expense.description}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${daysUntilNext <= 7 ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>{t('next')} {daysUntilNext === 0 ? t('today') : `${daysUntilNext}${t('days')}`}</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className={theme.textSecondary}>{t('nextOccurrence')} {nextOccurrence.toLocaleDateString('fr-FR')}</p>
                      {expense.lastProcessed && (
                        <p className={theme.textSecondary}>{t('lastAdded')} {new Date(expense.lastProcessed).toLocaleDateString('fr-FR')}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`font-bold ${theme.text}`}>{state.showBalances ? formatCurrency(expense.amount) : '•••'}</span>
                      <Button
                        variant={expense.active ? "success" : "outline"}
                        size="sm"
                        onClick={() => actions.toggleRecurringExpense(expense.id)}
                      >
                        {expense.active ? (
                          <div className="flex items-center space-x-1">
                            <Icons.Check className="h-3 w-3" />
                            <span>{t('active')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Icons.Pause className="h-3 w-3" />
                            <span>{t('inactive')}</span>
                          </div>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          actions.setEditingItem(expense);
                          actions.updateForm('newRecurring', {
                            description: expense.description,
                            category: expense.category,
                            amount: expense.amount,
                            dayOfMonth: expense.dayOfMonth
                          });
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Icons.Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => actions.deleteRecurringExpense(expense.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Icons.Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {state.recurringExpenses.length === 0 && (
                <div className={`text-center ${theme.textSecondary} py-8 border rounded-lg ${theme.border}`}>
                  <Icons.RefreshCw className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>{t('noRecurringExpenses')}</p>
                  <p className="text-xs mt-2">{t('useTemplatesOrCreate')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Notifications d'échéance */}
      {notifications.length > 0 && (
        <div className={`${theme.card} rounded-xl border ${theme.border} p-4`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-3 flex items-center`}>
            <Icons.Clock className="h-5 w-5 mr-2 text-orange-500" />
            {t('upcomingDeadlines')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {notifications.map((notif, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                notif.urgency === 'high' ? 'border-red-200 bg-red-50 dark:bg-red-900/20' :
                notif.urgency === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20' :
                'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${theme.text}`}>{notif.expense.description}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    notif.urgency === 'high' ? 'bg-red-200 text-red-800' :
                    notif.urgency === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {notif.daysUntil === 0 ? t('today') : `${notif.daysUntil}${t('days')}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={theme.textSecondary}>{notif.expense.category}</span>
                  <span className={`font-medium ${theme.text}`}>{formatCurrency(notif.expense.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Analyse d'impact annuel */}
      <div className={`${theme.card} rounded-xl border ${theme.border} p-6`}>
        <h3 className={`text-xl font-bold ${theme.text} mb-4 flex items-center`}>
          <Icons.Calculator className="h-6 w-6 mr-2 text-green-600" />
          {t('annualFinancialImpact')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Résumé global */}
          <div className={`p-4 rounded-lg ${theme.bg} border ${theme.border}`}>
            <h4 className={`font-semibold ${theme.text} mb-3`}>{t('globalImpact')}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={theme.textSecondary}>{t('monthly')}</span>
                <span className={`font-bold text-red-600`}>{formatCurrency(analysis.totalMonthly)}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme.textSecondary}>{t('annual')}</span>
                <span className={`font-bold text-red-700`}>{formatCurrency(analysis.totalAnnual)}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme.textSecondary}>{t('percentageOfIncome')}</span>
                <span className={`font-bold ${analysis.percentageOfIncome > 30 ? 'text-red-600' : analysis.percentageOfIncome > 20 ? 'text-yellow-600' : 'text-green-600'}`}>{analysis.percentageOfIncome.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          {/* Répartition par catégorie */}
          <div className={`p-4 rounded-lg ${theme.bg} border ${theme.border}`}>
            <h4 className={`font-semibold ${theme.text} mb-3`}>{t('byCategory')}</h4>
            <div className="space-y-2">
              {Object.entries(analysis.byCategory).map(([category, amount]) => (
                <div key={category} className="flex justify-between">
                  <span className={theme.textSecondary}>{category}:</span>
                  <span className={theme.text}>{formatCurrency(amount)}{t('perMonth')}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Répartition par période */}
          <div className={`p-4 rounded-lg ${theme.bg} border ${theme.border}`}>
            <h4 className={`font-semibold ${theme.text} mb-3`}>{t('monthlyDistribution')}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={theme.textSecondary}>{t('startOfMonth')}</span>
                <span className={theme.text}>{formatCurrency(trends.startOfMonth)}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme.textSecondary}>{t('midMonth')}</span>
                <span className={theme.text}>{formatCurrency(trends.midMonth)}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme.textSecondary}>{t('endOfMonth')}</span>
                <span className={theme.text}>{formatCurrency(trends.endOfMonth)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Suggestions d'optimisation */}
      {analysis.optimizations.length > 0 && (
        <div className={`${theme.card} rounded-xl border ${theme.border} p-4`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-3 flex items-center`}>
            <Icons.Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
            {t('optimizationSuggestions')}
          </h3>
          <div className="space-y-3">
            {analysis.optimizations.map((opt, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                opt.impact === 'high' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' :
                'border-blue-200 bg-blue-50 dark:bg-blue-900/20'
              }`}>
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${theme.text}`}>{opt.suggestion}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    opt.impact === 'high' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'
                  }`}>
                    {t('impact')} {opt.impact === 'high' ? t('highImpact') : t('mediumImpact')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default RecurringScreen;