// CalendarScreen.js - Version enrichie
import React, { memo, useCallback, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { dateUtils } from '../utils/dateUtils';

const CalendarScreen = memo(({ financeManager, theme, t }) => {
  const { state, actions, computedValues, formatCurrency } = financeManager;
  const [selectedDay, setSelectedDay] = useState(null);
  
  const daysInMonth = new Date(state.selectedYear, new Date(state.selectedMonth + '-01').getMonth() + 1, 0).getDate();
  // Ajuster pour commencer par lundi (1) au lieu de dimanche (0)
  const firstDay = (new Date(state.selectedMonth + '-01').getDay() + 6) % 7;
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDayExpenses = useCallback((day) => {
    const dateStr = `${state.selectedMonth}-${day.toString().padStart(2, '0')}`;
    return computedValues.currentMonthExpenses.filter(e => e.date === dateStr);
  }, [state.selectedMonth, computedValues.currentMonthExpenses]);

  // Prédictions récurrentes
  const getPredictedRecurring = useMemo(() => {
    const predictions = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    state.recurringExpenses.forEach(recurring => {
      if (recurring.active) {
        const predictedDate = new Date(currentYear, currentMonth, recurring.dayOfMonth);
        if (predictedDate > today && predictedDate.getMonth() === currentMonth) {
          predictions.push({
            date: predictedDate.getDate(),
            amount: recurring.amount,
            description: recurring.description,
            category: recurring.category,
            type: 'recurring'
          });
        }
      }
    });
    
    return predictions;
  }, [state.recurringExpenses]);

  // Zones de danger (jours où on dépense habituellement plus)
  const getDangerZones = useMemo(() => {
    const dangerDays = [];
    const expensesByDay = {};
    
    // Analyser l'historique pour identifier les patterns
    computedValues.currentMonthExpenses.forEach(expense => {
      const day = new Date(expense.date).getDate();
      expensesByDay[day] = (expensesByDay[day] || 0) + expense.amount;
    });
    
    const averageDaily = Object.values(expensesByDay).reduce((sum, amount) => sum + amount, 0) / Object.keys(expensesByDay).length;
    
    Object.entries(expensesByDay).forEach(([day, amount]) => {
      if (amount > averageDaily * 1.5) {
        dangerDays.push(parseInt(day));
      }
    });
    
    return dangerDays;
  }, [computedValues.currentMonthExpenses]);

  // Rappels intelligents
  const getSmartReminders = useMemo(() => {
    const reminders = [];
    const today = new Date().getDate();
    const currentMonth = new Date().getMonth();
    const selectedMonth = new Date(state.selectedMonth).getMonth();
    
    if (currentMonth === selectedMonth) {
      // Rappel fin de mois
      if (today > 25) {
        reminders.push({
          type: 'warning',
          message: t('endOfMonthWarning'),
          icon: Icons.AlertTriangle
        });
      }
      
      // Rappel weekend
      const dayOfWeek = new Date().getDay();
      if (dayOfWeek === 5) { // Vendredi
        reminders.push({
          type: 'info',
          message: t('weekendWarning'),
          icon: Icons.Calendar
        });
      }
      
      // Rappel dépenses récurrentes
      state.recurringExpenses.forEach(recurring => {
        if (recurring.active && Math.abs(recurring.dayOfMonth - today) <= 2) {
          reminders.push({
            type: 'info',
            message: t('recurringPlannedFor', { description: recurring.description, day: recurring.dayOfMonth }),
            icon: Icons.RefreshCw
          });
        }
      });
    }
    
    return reminders;
  }, [state.selectedMonth, state.recurringExpenses, t]);

  // Statistiques avancées du mois
  const getAdvancedStats = useMemo(() => {
    const expenses = computedValues.currentMonthExpenses;
    const daysWithExpenses = [...new Set(expenses.map(e => new Date(e.date).getDate()))];
    const totalDays = daysInMonth;
    const activeDays = daysWithExpenses.length;
    
    // Analyse par semaine
    const weeklyData = Array.from({ length: 5 }, (_, weekIndex) => {
      const weekStart = weekIndex * 7 + 1;
      const weekEnd = Math.min(weekStart + 6, totalDays);
      const weekExpenses = expenses.filter(e => {
        const day = new Date(e.date).getDate();
        return day >= weekStart && day <= weekEnd;
      });
      return {
        week: weekIndex + 1,
        total: weekExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: weekExpenses.length
      };
    });
    
    // Jour le plus/moins dépensier
    const dailyTotals = {};
    expenses.forEach(e => {
      const day = new Date(e.date).getDate();
      dailyTotals[day] = (dailyTotals[day] || 0) + e.amount;
    });
    
    const sortedDays = Object.entries(dailyTotals).sort(([,a], [,b]) => b - a);
    const mostExpensiveDay = sortedDays[0] ? { day: parseInt(sortedDays[0][0]), amount: sortedDays[0][1] } : null;
    const leastExpensiveDay = sortedDays[sortedDays.length - 1] ? { day: parseInt(sortedDays[sortedDays.length - 1][0]), amount: sortedDays[sortedDays.length - 1][1] } : null;
    
    return {
      activeDays,
      totalDays,
      activityRate: (activeDays / totalDays) * 100,
      weeklyData,
      mostExpensiveDay,
      leastExpensiveDay,
      averagePerActiveDay: activeDays > 0 ? computedValues.totalSpent / activeDays : 0
    };
  }, [computedValues.currentMonthExpenses, computedValues.totalSpent, daysInMonth]);

  const stats = getAdvancedStats;

  return (
    <div className="space-y-6 mt-[80px]">
      {/* Rappels intelligents */}
      {getSmartReminders.length > 0 && (
        <div className={`${theme.card} rounded-xl border ${theme.border} p-4`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-3 flex items-center`}>
            <Icons.Bell className="h-5 w-5 mr-2 text-blue-600" />
            {t('smartReminders')}
          </h3>
          <div className="space-y-2">
            {getSmartReminders.map((reminder, index) => {
              const Icon = reminder.icon;
              return (
                <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg ${
                  reminder.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200' :
                  'bg-blue-50 dark:bg-blue-900/20 border border-blue-200'
                }`}>
                  <Icon className={`h-4 w-4 ${
                    reminder.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                  <p className={`text-sm ${theme.text}`}>{reminder.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section principale du calendrier */}
      <div className={`${theme.card} rounded-xl border ${theme.border} p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${theme.text}`}>{t('intelligentFinancialCalendar')}</h2>
          <div className="flex items-center space-x-2">
            <select
              value={state.selectedMonth}
              onChange={(e) => actions.setSelectedMonth(e.target.value)}
              className={`px-3 py-2 border rounded-lg ${theme.input}`}
            >
              {Array.from({length: 12}, (_, i) => {
                const date = new Date(state.selectedYear, i);
                return (
                  <option key={i} value={`${state.selectedYear}-${String(i + 1).padStart(2, '0')}`}>
                    {date.toLocaleDateString('fr-FR', { month: 'long' })}
                  </option>
                );
              })}
            </select>
            <select
              value={state.selectedYear}
              onChange={(e) => actions.setSelectedYear(parseInt(e.target.value))}
              className={`px-3 py-2 border rounded-lg ${theme.input}`}
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {[t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')].map(day => (
            <div key={day} className={`p-2 text-center font-semibold ${theme.textSecondary}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} className="p-2 min-h-[100px]"></div>
          ))}
          {calendarDays.map(day => {
            const dayExpenses = getDayExpenses(day);
            const totalAmount = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
            const predictedRecurring = getPredictedRecurring.find(p => p.date === day);
            const isDangerZone = getDangerZones.includes(day);
            const today = new Date();
            const isToday = today.getDate() === day && 
                           today.getMonth() === new Date(state.selectedMonth).getMonth() && 
                           today.getFullYear() === state.selectedYear;
            const isFuture = new Date(state.selectedYear, new Date(state.selectedMonth).getMonth(), day) > today;

            return (
              <div
                key={day}
                className={`
                  p-2 min-h-[100px] border rounded cursor-pointer transition-all
                  ${theme.border} 
                  ${totalAmount > 0 
                    ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' 
                    : `${theme.card} hover:bg-gray-50 dark:hover:bg-gray-700`
                  }
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${isDangerZone ? 'ring-1 ring-orange-400' : ''}
                  ${isFuture && predictedRecurring ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                `}
                onClick={() => setSelectedDay(selectedDay === day ? null : day)}
              >
                <div className={`text-sm font-medium ${theme.text} mb-1 flex items-center justify-between ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                  <span>{day}</span>
                  {isToday && <Icons.Star className="h-3 w-3 text-blue-600" />}
                  {isDangerZone && <Icons.AlertTriangle className="h-3 w-3 text-orange-500" />}
                </div>

                {/* Dépenses réelles */}
                {totalAmount > 0 && (
                  <>
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                      {state.showBalances ? formatCurrency(totalAmount) : '•••'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {dayExpenses.length} {t('expenses')}
                    </div>
                  </>
                )}

                {/* Prédictions récurrentes */}
                {predictedRecurring && (
                  <div className="text-xs text-orange-600 font-medium">
                    <Icons.RefreshCw className="h-3 w-3 inline mr-1" />
                    {formatCurrency(predictedRecurring.amount)}
                  </div>
                )}

                {/* Indicateurs de catégories */}
                {dayExpenses.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {dayExpenses.slice(0, 3).map((expense, idx) => {
                      const category = state.categories.find(cat => cat.name === expense.category);
                      return (
                        <div
                          key={idx}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: category?.color || '#gray' }}
                          title={expense.category}
                        />
                      );
                    })}
                    {dayExpenses.length > 3 && (
                      <div className="text-xs text-gray-400">+{dayExpenses.length - 3}</div>
                    )}
                  </div>
                )}

                {/* Détails du jour sélectionné */}
                {selectedDay === day && (
                  <div className="absolute z-10 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg min-w-64">
                    <h4 className={`font-semibold ${theme.text} mb-2`}>
                      {day} {new Date(state.selectedMonth).toLocaleDateString('fr-FR', { month: 'long' })}
                    </h4>
                    {dayExpenses.length > 0 ? (
                      <div className="space-y-1">
                        {dayExpenses.map(expense => (
                          <div key={expense.id} className="flex justify-between text-xs">
                            <span className={theme.textSecondary}>{expense.description}</span>
                            <span className={theme.text}>{formatCurrency(expense.amount)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-1 mt-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{t('total')}</span>
                            <span>{formatCurrency(totalAmount)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-xs ${theme.textSecondary}`}>{t('noExpenses')}</p>
                    )}
                    {predictedRecurring && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-orange-600">
                          {t('planned')} {predictedRecurring.description} ({formatCurrency(predictedRecurring.amount)})
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Statistiques avancées */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${theme.card} border ${theme.border}`}>
            <h4 className={`font-semibold ${theme.text} mb-3 flex items-center`}>
              <Icons.BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
              {t('monthlyActivity')}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={theme.textSecondary}>{t('daysWithExpenses')}</span>
                <span className={theme.text}>{stats.activeDays} / {stats.totalDays}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme.textSecondary}>{t('activityRate')}</span>
                <span className={`font-medium ${stats.activityRate > 50 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.activityRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className={theme.textSecondary}>{t('averagePerActiveDay')}</span>
                <span className={theme.text}>
                  {formatCurrency(stats.averagePerActiveDay)}
                </span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${theme.card} border ${theme.border}`}>
            <h4 className={`font-semibold ${theme.text} mb-3 flex items-center`}>
              <Icons.TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              {t('monthlyExtremes')}
            </h4>
            <div className="space-y-2 text-sm">
              {stats.mostExpensiveDay && (
                <div>
                  <span className={theme.textSecondary}>{t('mostExpensiveDay')}</span>
                  <div className="text-red-600 font-medium">
                    {stats.mostExpensiveDay.day} → {formatCurrency(stats.mostExpensiveDay.amount)}
                  </div>
                </div>
              )}
              {stats.leastExpensiveDay && (
                <div>
                  <span className={theme.textSecondary}>{t('leastExpensiveDay')}</span>
                  <div className="text-green-600 font-medium">
                    {stats.leastExpensiveDay.day} → {formatCurrency(stats.leastExpensiveDay.amount)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={`p-4 rounded-lg ${theme.card} border ${theme.border}`}>
            <h4 className={`font-semibold ${theme.text} mb-3 flex items-center`}>
              <Icons.Calendar className="h-4 w-4 mr-2 text-purple-600" />
              {t('weeklyAnalysis')}
            </h4>
            <div className="space-y-2">
              {stats.weeklyData.map(week => (
                <div key={week.week} className="flex justify-between text-sm">
                  <span className={theme.textSecondary}>{t('week', { week: week.week })}</span>
                  <span className={theme.text}>{formatCurrency(week.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Légende */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${theme.card} border ${theme.border}`}>
            <h4 className={`font-semibold ${theme.text} mb-2`}>{t('categoryLegend')}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {state.categories.map(category => (
                <div key={category.id} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className={theme.text}>{category.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-4 rounded-lg ${theme.card} border ${theme.border}`}>
            <h4 className={`font-semibold ${theme.text} mb-2`}>{t('colorCodes')}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
                <span className={theme.text}>{t('daysWithExpensesLabel')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-50 border border-yellow-200 rounded"></div>
                <span className={theme.text}>{t('recurringExpensesPlanned')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icons.AlertTriangle className="h-3 w-3 text-orange-500" />
                <span className={theme.text}>{t('dangerZone')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icons.Star className="h-3 w-3 text-blue-600" />
                <span className={theme.text}>{t('today')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CalendarScreen;