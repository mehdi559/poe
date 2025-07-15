// SavingsScreen.js - Version enrichie
import React, { memo, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const SavingsScreen = memo(({ financeManager, theme, t }) => {
  const { state, actions, computedValues, formatCurrency } = financeManager;
  const [openGoalId, setOpenGoalId] = useState(null);

  // Calculateur d'impact des épargnes
  const getImpactCalculations = useMemo(() => {
    return state.savingsGoals.map(goal => {
      const remaining = goal.targetAmount - goal.currentAmount;
      const monthlyTarget = remaining / 12; // Sur 1 an
      const weeklyTarget = remaining / 52; // Sur 1 an
      const dailyTarget = remaining / 365; // Sur 1 an
      
      // Calcul du temps restant au rythme actuel
      const averageMonthlyProgress = goal.transactions?.length > 0 
        ? goal.transactions.reduce((sum, t) => t.type === 'add' ? sum + t.amount : sum - t.amount, 0) / Math.max(goal.transactions.length, 1)
        : 50; // Valeur par défaut

      const monthsToTarget = averageMonthlyProgress > 0 ? Math.ceil(remaining / averageMonthlyProgress) : Infinity;

      return {
        ...goal,
        remaining,
        monthlyTarget,
        weeklyTarget,
        dailyTarget,
        monthsToTarget,
        averageMonthlyProgress
      };
    });
  }, [state.savingsGoals]);

  // Défis d'épargne prédéfinis
  const savingsChallenges = useMemo(() => [
    {
      name: t('challenge365Days'),
      description: t('challenge365Description'),
      targetAmount: 66795, // Somme de 1 à 365
      duration: t('days365'),
      dailyAmount: t('variable1to365'),
      difficulty: t('difficult'),
      color: "red"
    },
    {
      name: t('challenge52Weeks'),
      description: t('challenge52Description'),
      targetAmount: 1378, // Somme de 1 à 52
      duration: t('weeks52'),
      dailyAmount: t('variableWeekly'),
      difficulty: t('medium'),
      color: "yellow"
    },
    {
      name: t('rule5PerDay'),
      description: t('rule5Description'),
      targetAmount: 1825, // 5€ * 365
      duration: t('year1'),
      dailyAmount: t('amount5'),
      difficulty: t('easy'),
      color: "green"
    },
    {
      name: t('coinSavings'),
      description: t('coinDescription'),
      targetAmount: 365, // Estimation
      duration: t('year1'),
      dailyAmount: t('variable'),
      difficulty: t('veryEasy'),
      color: "blue"
    }
  ], [t]);

  // Suggestions d'allocation d'épargne
  const getAllocationSuggestions = useMemo(() => {
    const totalSavings = computedValues.totalSavings;
    const monthlyIncome = state.monthlyIncome;
    
    return {
      emergency: {
        name: t('emergencyFund'),
        recommended: monthlyIncome * 6, // 6 mois de revenus
        current: state.savingsGoals.find(g => g.name.toLowerCase().includes('urgence'))?.currentAmount || 0,
        priority: 1
      },
      vacation: {
        name: t('vacation'),
        recommended: monthlyIncome * 0.1 * 12, // 10% annuel
        current: state.savingsGoals.find(g => g.name.toLowerCase().includes('vacances'))?.currentAmount || 0,
        priority: 3
      },
      retirement: {
        name: t('retirement'),
        recommended: monthlyIncome * 0.15 * 12, // 15% annuel
        current: state.savingsGoals.find(g => g.name.toLowerCase().includes('retraite'))?.currentAmount || 0,
        priority: 2
      }
    };
  }, [computedValues.totalSavings, state.monthlyIncome, state.savingsGoals, t]);

  // Progression visuelle avancée
  const getProgressVisualization = (goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const segments = 10;
    const filledSegments = Math.floor((progress / 100) * segments);
    
    return { progress, segments, filledSegments };
  };

  // Fonction pour traduire les descriptions des transactions
  const translateTransactionDescription = (description) => {
    const translationMap = {
      'Virement initial': t('initialTransfer'),
      'Épargne mensuelle': t('monthlySavings'),
      'Épargne initiale': t('initialSavings'),
      'Bonus travail': t('workBonus')
    };
    return translationMap[description] || description;
  };

  return (
    <div className="space-y-6 mt-[80px]">
      {/* Section principale - Objectifs d'épargne */}
      <div className={`${theme.card} rounded-xl border ${theme.border} p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${theme.text}`}>{t('savingsGoals')}</h2>
          <div className="text-right">
            <p className={`text-2xl font-bold ${theme.text}`}>
              {state.showBalances ? formatCurrency(computedValues.totalSavings) : '•••'}
            </p>
            <p className={`text-sm ${theme.textSecondary}`}>{t('totalSaved')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>{t('newGoal')}</h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (actions.addSavingsGoal(state.newGoal)) {
                  actions.resetForm('newGoal');
                }
              }}
              className="space-y-4"
            >
              <Input
                label={t('goalName')}
                type="text"
                value={state.newGoal.name}
                onChange={(value) => actions.updateForm('newGoal', { name: value })}
                error={state.errors.name}
                required
                minLength={2}
                maxLength={50}
              />
              <Input
                label={t('targetAmount')}
                type="number"
                step="0.01"
                min="0"
                value={state.newGoal.targetAmount}
                onChange={(value) => actions.updateForm('newGoal', { targetAmount: value })}
                error={state.errors.targetAmount}
                required
              />
              <Input
                label={t('currentAmount')}
                type="number"
                step="0.01"
                min="0"
                value={state.newGoal.currentAmount}
                onChange={(value) => actions.updateForm('newGoal', { currentAmount: value })}
                error={state.errors.currentAmount}
              />
              <Button
                type="submit"
                variant="success"
                className="w-full"
                disabled={state.loading}
                loading={state.loading}
              >
                {t('createGoal')}
              </Button>
            </form>
          </div>
          <div className="lg:col-span-2">
            <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>{t('goalsWithImpact')}</h3>
            <div className="space-y-4">
              {computedValues.savingsForSelectedMonth.map(goal => {
                const { progress, segments, filledSegments } = getProgressVisualization(goal);
                const open = openGoalId === goal.id;
                return (
                  <div key={goal.id} className={`${theme.card} border ${theme.border} rounded-lg p-4`}>
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className={`font-semibold ${theme.text}`}>{goal.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`font-medium ${theme.text}`}>{state.showBalances 
                            ? `${formatCurrency(goal.cumulativeAmount)} / ${formatCurrency(goal.targetAmount)}`
                            : '••• / •••'
                          }</span>
                          <span className={`text-xs ${theme.textSecondary}`}>{goal.cumulativeProgress.toFixed(1)}% {t('reached')}</span>
                        </div>
                        {/* Affichage de la progression du mois */}
                        {goal.monthAmount > 0 && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs text-green-600 font-medium`}>
                              +{formatCurrency(goal.monthAmount)} {t('thisMonth')}
                            </span>
                            <span className={`text-xs ${theme.textSecondary}`}>
                              ({goal.monthProgress.toFixed(1)}% {t('progressThisMonth')})
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            actions.setEditingItem(goal);
                            actions.toggleModal('editSaving', true);
                          }}
                          title={t('edit')}
                        >
                          <Icons.Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            if (window.confirm(t('confirmDeleteGoal') || 'Supprimer cet objectif ?')) {
                              actions.deleteSavingsGoal(goal.id);
                            }
                          }}
                          title={t('delete')}
                        >
                          <Icons.Trash2 className="h-4 w-4" />
                        </Button>
                        <button
                          className="ml-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                          onClick={() => setOpenGoalId(open ? null : goal.id)}
                          aria-label={open ? t('collapse') : t('expand')}
                        >
                          <Icons.ChevronDown className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                    {/* Contenu dépliable */}
                    {open && (
                      <>
                        {/* Progression visuelle avancée */}
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className={theme.textSecondary}>{t('progression')}</span>
                            <span className={`font-medium ${theme.text}`}>{state.showBalances 
                              ? `${formatCurrency(goal.cumulativeAmount)} / ${formatCurrency(goal.targetAmount)}`
                              : '••• / •••'
                            }</span>
                          </div>
                          {/* Barre de progression segmentée */}
                          <div className="flex space-x-1">
                            {Array.from({ length: segments }).map((_, index) => (
                              <div
                                key={index}
                                className={`flex-1 h-3 rounded ${
                                  index < filledSegments ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                              />
                            ))}
                          </div>
                          <p className={`text-xs ${theme.textSecondary}`}>
                            {goal.cumulativeProgress.toFixed(1)}% {t('reached')}
                            {goal.cumulativeProgress >= 100 && <span className="text-green-500 ml-2">{t('goalReached')}</span>}
                          </p>
                          
                          {/* Progression du mois en cours */}
                          {goal.monthAmount > 0 && (
                            <div className={`mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className={`text-sm font-medium ${theme.text}`}>{t('progressThisMonth')}</span>
                                <span className={`text-sm font-bold text-green-600`}>+{formatCurrency(goal.monthAmount)}</span>
                              </div>
                              <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(goal.monthProgress, 100)}%` }}
                                />
                              </div>
                              <p className={`text-xs ${theme.textSecondary} mt-1`}>
                                {goal.monthProgress.toFixed(1)}% {t('ofTargetThisMonth')}
                              </p>
                            </div>
                          )}
                        </div>
                        {/* Calculateur d'impact */}
                        <div className={`mt-4 p-3 rounded-lg ${theme.bg} border ${theme.border}`}>
                          <h5 className={`text-sm font-medium ${theme.text} mb-2`}>{t('impactCalculator')}</h5>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className={theme.textSecondary}>{t('remainingToSave')}</span>
                              <div className={`font-bold ${theme.text}`}>{formatCurrency(goal.targetAmount - goal.cumulativeAmount)}</div>
                            </div>
                            <div>
                              <span className={theme.textSecondary}>{t('atCurrentRate')}</span>
                              <div className={`font-bold ${goal.monthsToTarget > 24 ? 'text-red-600' : goal.monthsToTarget > 12 ? 'text-yellow-600' : 'text-green-600'}`}>{goal.monthsToTarget === Infinity ? t('undefined') : `${goal.monthsToTarget} ${t('months')}`}</div>
                            </div>
                            <div>
                              <span className={theme.textSecondary}>{t('perMonth')}</span>
                              <div className={`font-bold text-blue-600`}>{formatCurrency((goal.targetAmount - goal.cumulativeAmount) / 12)}</div>
                            </div>
                            <div>
                              <span className={theme.textSecondary}>{t('perDay')}</span>
                              <div className={`font-bold text-purple-600`}>{formatCurrency((goal.targetAmount - goal.cumulativeAmount) / 365)}</div>
                            </div>
                          </div>
                        </div>
                        {/* Historique des transactions du mois sélectionné avec carrousel */}
                        {goal.transactions && goal.transactions.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <h5 className={`text-sm font-medium ${theme.text} mb-2`}>{t('operationsThisMonth') || 'Opérations de ce mois'}</h5>
                            {(() => {
                              const monthTransactions = goal.transactions.filter(transaction => 
                                transaction.date.startsWith(state.selectedMonth)
                              );
                              
                              if (monthTransactions.length === 0) {
                                return (
                                  <p className={`text-xs ${theme.textSecondary} italic`}>
                                    {t('noOperationsThisMonth') || 'Aucune opération ce mois'}
                                  </p>
                                );
                              }

                              return (
                                <div className="relative">
                                  {/* Zone de défilement avec hauteur fixe pour 3 opérations */}
                                  <div 
                                    className={`h-[72px] overflow-y-auto pr-2 ${theme.darkMode ? 'scrollbar-visible-dark' : 'scrollbar-visible-light'}`}
                                    style={{
                                      scrollbarWidth: 'auto',
                                      scrollbarColor: theme.darkMode ? '#6B7280' : '#9CA3AF'
                                    }}
                                  >
                                    <div className="space-y-1">
                                      {monthTransactions.map((transaction, index) => (
                                        <div key={transaction.id || index} className="flex justify-between text-xs py-1">
                                          <span className={theme.textSecondary}>
                                            {new Date(transaction.date).toLocaleDateString('fr-FR')} - {translateTransactionDescription(transaction.description)}
                                          </span>
                                          <span className={`font-medium ${transaction.type === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                                            {transaction.type === 'add' ? '+' : '-'}{state.showBalances ? formatCurrency(transaction.amount) : '•••'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        {/* Bouton enregistrer un mouvement */}
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="success"
                            onClick={() => {
                              actions.setEditingItem(goal);
                              actions.toggleModal('editSaving', true);
                            }}
                          >
                            <Icons.PlusCircle className="h-4 w-4 mr-2" />
                            {t('recordSavingTransaction') || 'Enregistrer un mouvement'}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Défis d'épargne */}
      <div className={`${theme.card} rounded-xl border ${theme.border} p-6`}>
        <h3 className={`text-xl font-bold ${theme.text} mb-4 flex items-center`}>
          <Icons.Trophy className="h-6 w-6 mr-2 text-yellow-500" />
          {t('savingsChallenges')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {savingsChallenges.map((challenge, index) => (
            <div key={index} className={`p-4 rounded-lg border-2 border-${challenge.color}-200 bg-${challenge.color}-50 dark:bg-${challenge.color}-900/20 hover:shadow-lg transition-shadow cursor-pointer`}>
              <h4 className={`font-bold ${theme.text} mb-2`}>{challenge.name}</h4>
              <p className={`text-xs ${theme.textSecondary} mb-3`}>{challenge.description}</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className={theme.textSecondary}>{t('target')}:</span>
                  <span className={`font-medium text-${challenge.color}-600`}>{formatCurrency(challenge.targetAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.textSecondary}>{t('duration')}:</span>
                  <span className={theme.text}>{challenge.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.textSecondary}>{t('difficulty')}:</span>
                  <span className={`font-medium text-${challenge.color}-600`}>{challenge.difficulty}</span>
                </div>
              </div>
              <Button
                size="sm"
                className={`w-full mt-3 bg-${challenge.color}-500 hover:bg-${challenge.color}-600`}
                onClick={() => {
                  // Créer directement l'objectif d'épargne pour le défi
                  const newGoal = {
                    name: challenge.name,
                    targetAmount: challenge.targetAmount,
                    currentAmount: 0,
                    transactions: []
                  };
                  if (actions.addSavingsGoal(newGoal)) {
                    // Notification de succès
                    financeManager.showNotification(t('challengeCreated', { name: challenge.name }), 'success');
                  }
                }}
              >
                {t('start')}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions d'allocation */}
      <div className={`${theme.card} rounded-xl border ${theme.border} p-6`}>
        <h3 className={`text-xl font-bold ${theme.text} mb-4 flex items-center`}>
          <Icons.PieChart className="h-6 w-6 mr-2 text-indigo-500" />
          {t('recommendedAllocation')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(getAllocationSuggestions).map(([key, allocation]) => {
            const completionRate = (allocation.current / allocation.recommended) * 100;
            return (
              <div key={key} className={`p-4 rounded-lg ${theme.bg} border ${theme.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-semibold ${theme.text}`}>{allocation.name}</h4>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                    allocation.priority === 1 ? 'bg-red-100 text-red-800' :
                    allocation.priority === 2 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {t('priority')} {allocation.priority}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={theme.textSecondary}>{t('current')}</span>
                    <span className={theme.text}>{formatCurrency(allocation.current)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={theme.textSecondary}>{t('recommended')}</span>
                    <span className={theme.text}>{formatCurrency(allocation.recommended)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        completionRate >= 100 ? 'bg-green-500' :
                        completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(completionRate, 100)}%` }}
                    ></div>
                  </div>
                  <p className={`text-xs ${theme.textSecondary}`}>
                    {completionRate.toFixed(1)}% {t('completed')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {state.savingsGoals.length === 0 && (
        <div className={`text-center ${theme.textSecondary} py-8 border rounded-lg ${theme.border}`}>
          <Icons.PiggyBank className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>{t('noSavingsGoals')}</p>
          <p className="text-xs mt-2">{t('startWithChallenge')}</p>
        </div>
      )}
    </div>
  );
});

export default SavingsScreen;