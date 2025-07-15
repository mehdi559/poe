// ExpensesScreen.js - Version enrichie
import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SearchAndFilter from '../components/ui/SearchAndFilter';
import Pagination from '../components/ui/Pagination';
import { dateUtils } from '../utils/dateUtils';

const ExpensesScreen = memo(({ financeManager, theme, t }) => {
  const { 
    state, 
    actions, 
    filteredAndSortedExpenses, 
    paginatedExpenses, 
    totalPages, 
    formatCurrency 
  } = financeManager;

  const handleSortClick = useCallback((sortBy) => {
    actions.setSort(sortBy);
  }, [actions]);

  // Analyses automatiques des dépenses
  const getExpenseAnalytics = useMemo(() => {
    const expenses = filteredAndSortedExpenses;
    if (expenses.length === 0) return null;

    // Dépense la plus importante
    const biggestExpense = expenses.reduce((max, exp) => 
      exp.amount > max.amount ? exp : max
    );

    // Analyse par jour de la semaine
    const dayAnalysis = expenses.reduce((acc, exp) => {
      const day = new Date(exp.date).getDay();
      // Utilisation du format natif pour le jour selon la langue
      const dayName = new Date(exp.date).toLocaleDateString(
        state.language === 'fr' ? 'fr-FR' : state.language === 'es' ? 'es-ES' : 'en-US',
        { weekday: 'long' }
      );
      acc[dayName] = (acc[dayName] || 0) + exp.amount;
      return acc;
    }, {});

    const spendingByDay = Object.entries(dayAnalysis)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    // Tendances par rapport au mois dernier (simulé)
    const lastMonthComparison = Math.random() > 0.5 ? 
      { trend: 'up', percentage: Math.round(Math.random() * 30) } :
      { trend: 'down', percentage: Math.round(Math.random() * 20) };

    // Suggestions d'économie
    const economySuggestions = [
      t('reduceCategory', { category: biggestExpense.category, amount: formatCurrency(biggestExpense.amount * 0.1) }),
      t('groupPurchases', { day: spendingByDay[0]?.[0] || t('weekend') }),
      t('planExpenses', { category: biggestExpense.category })
    ];

    return {
      biggestExpense,
      spendingByDay,
      lastMonthComparison,
      economySuggestions,
      averageDaily: expenses.reduce((sum, exp) => sum + exp.amount, 0) / Math.max(new Date().getDate(), 1)
    };
  }, [filteredAndSortedExpenses, formatCurrency, state.language]);

  // Détection des patterns de dépenses
  const getSpendingPatterns = useMemo(() => {
    const expenses = filteredAndSortedExpenses;
    const patterns = [];

    // Analyse weekend vs semaine
    const weekendExpenses = expenses.filter(exp => {
      const day = new Date(exp.date).getDay();
      return day === 0 || day === 6;
    });
    const weekdayExpenses = expenses.filter(exp => {
      const day = new Date(exp.date).getDay();
      return day > 0 && day < 6;
    });

    if (weekendExpenses.length > 0 && weekdayExpenses.length > 0) {
      const weekendAvg = weekendExpenses.reduce((sum, exp) => sum + exp.amount, 0) / weekendExpenses.length;
      const weekdayAvg = weekdayExpenses.reduce((sum, exp) => sum + exp.amount, 0) / weekdayExpenses.length;
      
      if (weekendAvg > weekdayAvg * 1.5) {
        patterns.push({
          type: 'weekend_spender',
          message: t('weekendSpender', { percent: Math.round((weekendAvg/weekdayAvg)*100) }),
          icon: Icons.Calendar,
          color: 'orange'
        });
      }
    }

    // Analyse des montants fréquents
    const amountFrequency = expenses.reduce((acc, exp) => {
      const rounded = Math.round(exp.amount / 5) * 5; // Arrondi au 5€ près
      acc[rounded] = (acc[rounded] || 0) + 1;
      return acc;
    }, {});

    const mostFrequentAmount = Object.entries(amountFrequency)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostFrequentAmount && mostFrequentAmount[1] > 2) {
      patterns.push({
        type: 'frequent_amount',
        message: t('frequentAmount', { amount: formatCurrency(mostFrequentAmount[0]), count: mostFrequentAmount[1] }),
        icon: Icons.Repeat,
        color: 'blue'
      });
    }

    return patterns;
  }, [filteredAndSortedExpenses, formatCurrency, t]);

  const analytics = getExpenseAnalytics;
  const patterns = getSpendingPatterns;

  // Déclaration des hooks pour la navigation semaine/jour/filtres
  // Calcul de la semaine actuelle du mois (0 = première semaine)
  const today = new Date();
  const currentWeek = Math.floor((today.getDate() - 1) / 7);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [selectedDay, setSelectedDay] = useState(null);
  const [searchTermList, setSearchTermList] = useState('');
  const [categoryFilterList, setCategoryFilterList] = useState('all');
  const [weekendOnly, setWeekendOnly] = useState(false);

  // Organisation par semaine et jour pour la liste paginée
  const weeks = useMemo(() => {
    const byWeek = [[], [], [], [], []];
    paginatedExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const weekNum = Math.floor((date.getDate() - 1) / 7);
      byWeek[weekNum].push(expense);
    });
    return byWeek;
  }, [paginatedExpenses]);

  const daysOfWeek = useMemo(() => {
    const weekExpenses = weeks[selectedWeek] || [];
    const days = {};
    weekExpenses.forEach(exp => {
      const d = new Date(exp.date);
      const dayKey = d.toISOString().split('T')[0];
      if (!days[dayKey]) days[dayKey] = [];
      days[dayKey].push(exp);
    });
    return Object.entries(days).sort(([a], [b]) => new Date(a) - new Date(b));
  }, [weeks, selectedWeek]);

  useEffect(() => {
    if (daysOfWeek.length > 0 && (selectedDay === null || !daysOfWeek.find(([d]) => d === selectedDay))) {
      setSelectedDay(daysOfWeek[0][0]);
    }
  }, [daysOfWeek, selectedDay]);

  const filteredDayExpenses = useMemo(() => {
    if (!selectedDay) return [];
    let expenses = daysOfWeek.find(([d]) => d === selectedDay)?.[1] || [];
    if (categoryFilterList !== 'all') {
      expenses = expenses.filter(e => e.category === categoryFilterList);
    }
    if (searchTermList) {
      expenses = expenses.filter(e =>
        e.description.toLowerCase().includes(searchTermList.toLowerCase()) ||
        String(e.amount).includes(searchTermList)
      );
    }
    if (weekendOnly) {
      expenses = expenses.filter(e => {
        const day = new Date(e.date).getDay();
        return day === 0 || day === 6;
      });
    }
    return expenses;
  }, [daysOfWeek, selectedDay, categoryFilterList, searchTermList, weekendOnly]);

  return (
    <div className="space-y-6 mt-[80px]">
      {/* Section principale - Gestion des Dépenses */}
      <div className={`${theme.card} rounded-xl border ${theme.border} p-6`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
          <h2 className={`text-2xl font-bold ${theme.text}`}>{t('expensesManagement')}</h2>
          {/* Suppression du bouton Export CSV */}
        </div>

        {/* SUPPRIMER SearchAndFilter ici */}
        {/* <SearchAndFilter
          searchTerm={state.searchTerm}
          onSearchChange={actions.setSearchTerm}
          categoryFilter={state.categoryFilter}
          onCategoryFilterChange={actions.setCategoryFilter}
          dateFilter={state.dateFilter}
          onDateFilterChange={actions.setDateFilter}
          categories={state.categories}
          t={t}
        /> */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-1">
            <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>{t('addExpense')}</h3>
            {/* Suggestions rapides */}
            <div className="mb-4">
              <p className={`text-sm ${theme.textSecondary} mb-2`}>{t('quickSuggestions')}</p>
              <div className="flex flex-wrap gap-2">
                {['Courses', 'Essence', 'Resto', 'Café'].map(suggestion => (
                  <Button
                    key={suggestion}
                    size="xs"
                    variant="outline"
                    onClick={() => actions.quickAddExpense(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (actions.addExpense(state.newExpense)) {
                  actions.resetForm('newExpense');
                }
              }}
              className="space-y-4"
            >
              <Input
                label="Date"
                type="date"
                value={state.newExpense.date}
                onChange={(value) => actions.updateForm('newExpense', { date: value })}
                error={state.errors.date}
                required
                max={new Date().toISOString().split('T')[0]}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('category')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={state.newExpense.category}
                  onChange={(e) => actions.updateForm('newExpense', { category: e.target.value })}
                  className={`w-full px-3 py-2 text-base border rounded-lg ${theme.input} ${state.errors.category ? 'border-red-500' : ''}`}
                  required
                >
                  <option value="">{t('selectCategory')}</option>
                  {state.categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                {state.errors.category && (
                  <p className="text-sm text-red-600" role="alert">
                    {state.errors.category}
                  </p>
                )}
              </div>
              <Input
                label={t('amount')}
                type="number"
                step="0.01"
                min="0"
                value={state.newExpense.amount}
                onChange={(value) => actions.updateForm('newExpense', { amount: value })}
                error={state.errors.amount}
                required
              />
              <Input
                label={t('description')}
                type="text"
                value={state.newExpense.description}
                onChange={(value) => actions.updateForm('newExpense', { description: value })}
                error={state.errors.description}
                required
                minLength={3}
                maxLength={100}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={state.loading}
                loading={state.loading}
              >
                {t('addExpenseBtn')}
              </Button>
            </form>
          </div>
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${theme.text}`}>{t('expenses')} ({filteredAndSortedExpenses.length})</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{t('sortBy')}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSortClick('date')}
                  className={`flex items-center space-x-1 ${state.sortBy === 'date' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <span>{t('date')}</span>
                  {state.sortBy === 'date' && (
                    state.sortOrder === 'asc' 
                      ? <Icons.ChevronUp className="h-3 w-3" />
                      : <Icons.ChevronDown className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSortClick('amount')}
                  className={`flex items-center space-x-1 ${state.sortBy === 'amount' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <span>{t('amount')}</span>
                  {state.sortBy === 'amount' && (
                    state.sortOrder === 'asc' 
                      ? <Icons.ChevronUp className="h-3 w-3" />
                      : <Icons.ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {/* Nouvelle organisation : filtres + navigation semaine/jour + opérations du jour */}
              {paginatedExpenses.length === 0 ? (
                <div className={`text-center ${theme.textSecondary} py-8 border rounded-lg ${theme.border}`}>
                  {filteredAndSortedExpenses.length === 0 
                    ? (state.searchTerm || state.categoryFilter !== 'all' || state.dateFilter !== 'all')
                      ? t('noExpensesMatch')
                      : t('noExpensesThisMonth')
                    : t('noExpensesThisPage')
                  }
                </div>
              ) : (
                <>
                  {/* Barre de filtres moderne */}
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <input
                      type="text"
                      placeholder={t('search')}
                      value={searchTermList}
                      onChange={e => setSearchTermList(e.target.value)}
                      className={`px-3 py-2 rounded border ${theme.input}`}
                    />
                    <select
                      value={categoryFilterList}
                      onChange={e => setCategoryFilterList(e.target.value)}
                      className={`px-3 py-2 rounded border ${theme.input}`}
                    >
                      <option value="all">{t('all')}</option>
                      {state.categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Onglets semaines */}
                  <div className="flex space-x-2 mb-2">
                    {weeks.map((w, i) => (
                      <button
                        key={i}
                        className={`px-4 py-2 rounded-t-lg border-b-2 font-semibold transition-colors ${
                          selectedWeek === i ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent text-gray-500 bg-transparent'
                        }`}
                        onClick={() => {
                          setSelectedWeek(i);
                          setSelectedDay(null);
                        }}
                      >
                        {t('week')} {i + 1}
                      </button>
                    ))}
                  </div>
                  {/* Onglets jours de la semaine sélectionnée */}
                  <div className="flex space-x-2 mb-2">
                    {daysOfWeek.map(([dayKey]) => {
                      const d = new Date(dayKey);
                      return (
                        <button
                          key={dayKey}
                          className={`px-3 py-2 rounded-lg border font-medium transition-colors ${
                            selectedDay === dayKey ? 'bg-blue-500 text-white' : theme.input
                          }`}
                          onClick={() => setSelectedDay(dayKey)}
                        >
                          {d.toLocaleDateString(state.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                        </button>
                      );
                    })}
                  </div>
                  {/* Liste des opérations du jour sélectionné */}
                  <div className="space-y-3">
                    {filteredDayExpenses.length === 0 ? (
                      <div className={`text-center ${theme.textSecondary} py-8 border rounded-lg ${theme.border}`}>
                        {t('noExpensesMatch')}
                      </div>
                    ) : (
                      filteredDayExpenses.map(expense => {
                        const category = state.categories.find(cat => cat.name === expense.category);
                        const isRecent = (new Date() - new Date(expense.date)) < 24 * 60 * 60 * 1000;
                        const isToday = new Date(expense.date).toDateString() === new Date().toDateString();
                        return (
                          <div key={expense.id} className={`${theme.card} border ${theme.border} rounded-lg p-4 flex justify-between items-center transition-all hover:shadow-md ${
                            isRecent ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
                          } ${isToday ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category?.color || '#gray' }} />
                              <div className="flex-1">
                                <p className={`font-medium ${theme.text}`}>{expense.description}</p>
                                <div className="flex items-center space-x-2 text-sm">
                                  <span className={theme.textSecondary}>{expense.category}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className={theme.textSecondary}>
                                    {new Date(expense.date).toLocaleDateString(state.language === 'fr' ? 'fr-FR' : 'en-US', { 
                                      weekday: 'short', 
                                      day: '2-digit', 
                                      month: '2-digit' 
                                    })}
                                  </span>
                                  {isRecent && (
                                    <>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-blue-600 text-xs font-medium">{t('recent')}</span>
                                    </>
                                  )}
                                  {isToday && (
                                    <>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-green-600 text-xs font-medium">{t('today')}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`font-bold text-lg ${theme.text}`}>
                                {state.showBalances ? formatCurrency(expense.amount) : '•••'}
                              </span>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    actions.setEditingItem(expense);
                                    actions.toggleModal('editExpense', true);
                                  }}
                                  className="p-2"
                                >
                                  <Icons.Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => actions.deleteExpense(expense.id)}
                                  className="p-2 text-red-500 hover:text-red-700"
                                >
                                  <Icons.Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
            <Pagination
              currentPage={state.currentPage}
              totalPages={totalPages}
              onPageChange={actions.setPage}
              t={t}
            />
          </div>
        </div>
      </div>

      {/* Analyses et insights */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Analyse automatique */}
          <div className={`${theme.card} rounded-xl border ${theme.border} p-4`}>
            <h3 className={`text-lg font-semibold ${theme.text} mb-3 flex items-center`}>
              <Icons.TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              {t('expensesAnalysis')}
            </h3>
            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${theme.bg} border ${theme.border}`}>
                <p className={`text-sm font-medium ${theme.text}`}>
                  {t('biggestExpense', {
                    category: analytics.biggestExpense.category || analytics.biggestExpense.description,
                    amount: formatCurrency(analytics.biggestExpense.amount)
                  })}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${theme.bg} border ${theme.border}`}>
                <p className={`text-sm font-medium ${theme.text}`}>{t('averageDaily')}</p>
                <p className={`text-xs ${theme.textSecondary}`}>
                  {formatCurrency(analytics.averageDaily)} {t('perActiveDay')}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${theme.bg} border ${theme.border}`}>
                <p className={`text-sm font-medium ${theme.text}`}>{t('trendVsLastMonth')}</p>
                <div className="flex items-center space-x-1">
                  {analytics.lastMonthComparison.trend === 'up' ? (
                    <Icons.TrendingUp className="h-3 w-3 text-red-500" />
                  ) : (
                    <Icons.TrendingDown className="h-3 w-3 text-green-500" />
                  )}
                  <p className={`text-xs ${analytics.lastMonthComparison.trend === 'up' ? 'text-red-500' : 'text-green-500'}`}> 
                    {analytics.lastMonthComparison.trend === 'up' ? '+' : '-'}{analytics.lastMonthComparison.percentage}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Jour de la semaine le plus dépensier */}
          <div className={`${theme.card} rounded-xl border ${theme.border} p-4`}>
            <h3 className={`text-lg font-semibold ${theme.text} mb-3 flex items-center`}>
              <Icons.Calendar className="h-5 w-5 mr-2 text-purple-600" />
              {t('topSpendingDays')}
            </h3>
            <div className="space-y-2">
              {analytics.spendingByDay.map(([day, amount], index) => (
                <div key={day} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`text-sm ${theme.text}`}>{day}</span>
                  </div>
                  <span className={`text-sm font-medium ${theme.text}`}>{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions d'économie */}
          <div className={`${theme.card} rounded-xl border ${theme.border} p-4`}>
            <h3 className={`text-lg font-semibold ${theme.text} mb-3 flex items-center`}>
              <Icons.Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
              {t('economySuggestions')}
            </h3>
            <div className="space-y-2">
              {analytics.economySuggestions.map((suggestion, index) => (
                <div key={index} className={`p-2 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200`}>
                  <p className={`text-xs ${theme.textSecondary}`}>{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Patterns détectés */}
      {patterns.length > 0 && (
        <div className={`${theme.card} rounded-xl border ${theme.border} p-4`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-3 flex items-center`}>
            <Icons.Eye className="h-5 w-5 mr-2 text-indigo-600" />
            {t('detectedPatterns')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {patterns.map((pattern, index) => {
              const Icon = pattern.icon;
              return (
                <div key={index} className={`p-3 rounded-lg border border-${pattern.color}-200 bg-${pattern.color}-50 dark:bg-${pattern.color}-900/20`}>
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-4 w-4 text-${pattern.color}-600`} />
                    <p className={`text-sm ${theme.text}`}>{pattern.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default ExpensesScreen;