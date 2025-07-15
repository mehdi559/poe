import React, { useState, memo, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { differenceInCalendarDays, addMonths } from 'date-fns';

// Composant pour les QuickStats améliorées avec tendances
export const EnhancedQuickStats = memo(({ state, computedValues, formatCurrency, previousMonthData, theme, t, onWidgetClick }) => {
  // Calcul du revenu total à partir des sources renseignées
  const totalRevenue = (state.revenues || []).reduce((sum, rev) => sum + rev.amount, 0);

  // Calcul des tendances (simulation avec données aléatoires pour l'exemple)
  const getTrendData = (current, previous = null) => {
    if (!previous) {
      // Simulation de données précédentes (tu peux remplacer par de vraies données)
      previous = current * (0.8 + Math.random() * 0.4);
    }
    const change = ((current - previous) / previous) * 100;
    return {
      change: change.toFixed(1),
      isPositive: change > 0,
      isNeutral: Math.abs(change) < 1
    };
  };

  const incomeTrend = getTrendData(totalRevenue);
  const expensesTrend = getTrendData(computedValues.totalSpent);
  const savingsTrend = getTrendData(totalRevenue - computedValues.totalSpent);
  const savingsRateTrend = getTrendData(computedValues.savingsRate);

  const TrendIndicator = ({ trend }) => (
    <div className="flex items-center space-x-1">
      {trend.isNeutral ? (
        <Icons.Minus className="h-3 w-3 text-gray-400" />
      ) : trend.isPositive ? (
        <Icons.TrendingUp className="h-3 w-3 text-green-400" />
      ) : (
        <Icons.TrendingDown className="h-3 w-3 text-red-400" />
      )}
      <span className={`text-xs ${
        trend.isNeutral ? 'text-gray-400' : 
        trend.isPositive ? 'text-green-400' : 'text-red-400'
      }`}>
        {trend.isNeutral ? '0%' : `${trend.isPositive ? '+' : ''}${trend.change}%`}
      </span>
    </div>
  );

  const remainingBudget = computedValues.totalBudget - computedValues.totalSpent;
  const biggestExpense = computedValues.currentMonthExpenses.length > 0 
    ? Math.max(...computedValues.currentMonthExpenses.map(e => e.amount))
    : 0;
  const biggestExpenseCategory = computedValues.currentMonthExpenses.length > 0
    ? computedValues.currentMonthExpenses.reduce((max, e) => e.amount > max.amount ? e : max, { category: '', amount: 0 }).category
    : '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-green-600 rounded-xl p-4 flex flex-col justify-between min-h-[100px] cursor-pointer hover:scale-105 transition-transform" onClick={() => onWidgetClick && onWidgetClick('income')}>
        <div className="flex items-center justify-between w-full">
          <span className="text-white text-xs font-medium">{t('income')}</span>
          <Icons.TrendingUp className="h-5 w-5 text-white opacity-80" />
        </div>
        <div className="text-xl font-bold text-white mt-2">
          {state.showBalances ? formatCurrency(totalRevenue) : `•••`}
        </div>
        <TrendIndicator trend={incomeTrend} />
      </div>
      <div className="bg-red-600 rounded-xl p-4 flex flex-col justify-between min-h-[100px] cursor-pointer hover:scale-105 transition-transform" onClick={() => onWidgetClick && onWidgetClick('expenses')}>
        <div className="flex items-center justify-between w-full">
          <span className="text-white text-xs font-medium">{t('expenses')}</span>
          <Icons.TrendingDown className="h-5 w-5 text-white opacity-80" />
        </div>
        <div className="text-xl font-bold text-white mt-2">
          {state.showBalances ? formatCurrency(computedValues.totalSpent) : `•••`}
        </div>
        <TrendIndicator trend={expensesTrend} />
      </div>
      {/* Solde du compte */}
      <div className="bg-teal-600 rounded-xl p-4 flex flex-col justify-between min-h-[100px] cursor-pointer hover:scale-105 transition-transform" onClick={() => onWidgetClick && onWidgetClick('accountBalance')}>
        <div className="flex items-center justify-between w-full">
          <span className="text-white text-xs font-medium">{t('accountBalance')}</span>
          <Icons.Wallet className="h-5 w-5 text-white opacity-80" />
        </div>
        <div className="text-xl font-bold text-white mt-2">
          {state.showBalances ? formatCurrency((state.initialBalance || 0) + (state.revenues || []).reduce((sum, rev) => sum + rev.amount, 0) - computedValues.totalSpent) : '•••'}
        </div>
        <div className="text-xs text-white opacity-75">
          {t('includingInitialBalance') || 'Inclut le solde de départ'}
        </div>
      </div>
      {/* Épargne à la place du taux d'épargne */}
      <div className="bg-blue-600 rounded-xl p-4 flex flex-col justify-between min-h-[100px] cursor-pointer hover:scale-105 transition-transform" onClick={() => onWidgetClick && onWidgetClick('savings')}>
        <div className="flex items-center justify-between w-full">
          <span className="text-white text-xs font-medium">{t('savings')}</span>
          <Icons.PiggyBank className="h-5 w-5 text-white opacity-80" />
        </div>
        <div className="text-xl font-bold text-white mt-2">
          {state.showBalances ? formatCurrency(totalRevenue - computedValues.totalSpent) : `•••`}
        </div>
        <TrendIndicator trend={savingsTrend} />
      </div>
      {/* Taux d'épargne à la place du reste à dépenser */}
      <div className="bg-purple-600 rounded-xl p-4 flex flex-col justify-between min-h-[100px] cursor-pointer hover:scale-105 transition-transform" onClick={() => onWidgetClick && onWidgetClick('savingsRate')}>
        <div className="flex items-center justify-between w-full">
          <span className="text-white text-xs font-medium">{t('savingsRate')}</span>
          <Icons.Percent className="h-5 w-5 text-white opacity-80" />
        </div>
        <div className="text-xl font-bold text-white mt-2">
          {state.showBalances ? `${computedValues.savingsRate.toFixed(1)}%` : `•••`}
        </div>
        <TrendIndicator trend={savingsRateTrend} />
      </div>
      {/* Reste à dépenser en dernier */}
      <div className="bg-orange-500 rounded-xl p-4 flex flex-col justify-between min-h-[100px] cursor-pointer hover:scale-105 transition-transform" onClick={() => onWidgetClick && onWidgetClick('remainingBudget')}>
        <div className="flex items-center justify-between w-full">
          <span className="text-white text-xs font-medium">
            {t('remainingBudget', {
              remaining: state.showBalances ? formatCurrency(Math.max(0, remainingBudget)) : `•••`,
              total: formatCurrency(computedValues.totalBudget)
            })}
          </span>
          <Icons.Wallet className="h-5 w-5 text-white opacity-80" />
        </div>
        <div className="text-xl font-bold text-white mt-2">
          {state.showBalances ? formatCurrency(Math.max(0, remainingBudget)) : `•••`}
        </div>
        <div className="text-xs text-white opacity-75">
          {remainingBudget > 0 ? t('available') : t('exceeded')}
        </div>
      </div>
    </div>
  );
});

// Section "Aujourd'hui"
export const TodaySection = memo(({ computedValues, formatCurrency, theme, state, t }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayExpenses = computedValues.currentMonthExpenses.filter(e => e.date === today);
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Simulation budget quotidien
  const dailyBudget = computedValues.totalBudget / 30;
  const remainingToday = Math.max(0, dailyBudget - todayTotal);
  
  // Simulation "hier à cette heure"
  const yesterdayAtThisTime = todayTotal * (0.8 + Math.random() * 0.4);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border ${theme.border} ${theme.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${theme.text}`}>{t('spentToday')}</span>
            <Icons.Calendar className={`h-4 w-4 ${theme.textSecondary}`} />
          </div>
          <div className={`text-2xl font-bold ${theme.text}`}>
            {formatCurrency(todayTotal)}
          </div>
          <div className={`text-xs ${theme.textSecondary} mt-1`}>
            {todayExpenses.length} transaction{todayExpenses.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${theme.border} ${theme.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${theme.text}`}>{t('remainingToday')}</span>
            <Icons.Target className={`h-4 w-4 ${theme.textSecondary}`} />
          </div>
          <div className={`text-2xl font-bold ${remainingToday > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(remainingToday)}
          </div>
          <div className={`text-xs ${theme.textSecondary} mt-1`}>
            {t('onBudget')} {formatCurrency(dailyBudget)} {t('expected')}
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${theme.border} ${theme.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${theme.text}`}>{t('vsYesterday')}</span>
            <Icons.Clock className={`h-4 w-4 ${theme.textSecondary}`} />
          </div>
          <div className={`text-2xl font-bold ${todayTotal > yesterdayAtThisTime ? 'text-red-600' : 'text-green-600'}`}>
            {todayTotal > yesterdayAtThisTime ? '+' : ''}{formatCurrency(todayTotal - yesterdayAtThisTime)}
          </div>
          <div className={`text-xs ${theme.textSecondary} mt-1`}>
            {t('atThisHour')}
          </div>
        </div>
      </div>

      {/* Prochaines échéances dynamiques */}
      {(() => {
        // Calculer le nombre de jours avant la prochaine échéance pour chaque dépense récurrente
        const today = new Date();
        const recurringWithNext = (state.recurringExpenses || []).map(rec => {
          // Trouver la prochaine date d'échéance (en supposant dayOfMonth existe)
          let nextDate = new Date(today.getFullYear(), today.getMonth(), rec.dayOfMonth || 1);
          if (nextDate < today) {
            nextDate = addMonths(nextDate, 1);
          }
          const days = differenceInCalendarDays(nextDate, today);
          return { ...rec, days, nextDate };
        });
        // Trier par échéance la plus proche
        const sorted = recurringWithNext.sort((a, b) => a.days - b.days);
        // Prendre les 3 plus proches
        const toShow = sorted.slice(0, 3);
        // Nombre de jours jusqu'à la prochaine échéance
        const minDays = toShow.length > 0 ? toShow[0].days : 0;
        return (
          <div className={`p-4 rounded-lg border ${theme.border} ${theme.bg}`}>
            <h4 className={`font-semibold ${theme.text} mb-3 flex items-center`}>
              <Icons.Bell className="h-4 w-4 mr-2" />
              {t('upcomingDue', { days: minDays })}
            </h4>
            <div className="space-y-2">
              {toShow.map(recurring => (
                <div key={recurring.id} className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text}`}>{recurring.description}</span>
                  <span className={`text-sm font-medium ${theme.textSecondary}`}>{formatCurrency(recurring.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
});

// Section Activité Récente
export const RecentActivity = memo(({ computedValues, formatCurrency, theme, t }) => {
  const recentExpenses = computedValues.currentMonthExpenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-semibold ${theme.text} flex items-center`}>
        <Icons.Activity className="h-5 w-5 mr-2" />
        {t('recentActivity')}
      </h3>
      
      {recentExpenses.length > 0 ? (
        <div className="space-y-3">
          {recentExpenses.map(expense => (
            <div key={expense.id} className={`flex items-center justify-between p-3 rounded-lg ${theme.bg} border ${theme.border}`}>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <p className={`font-medium ${theme.text}`}>{expense.description}</p>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    {new Date(expense.date).toLocaleDateString('fr-FR')} • {expense.category}
                  </p>
                </div>
              </div>
              <span className={`font-bold text-red-600`}>
                -{formatCurrency(expense.amount)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={`text-center py-8 ${theme.textSecondary}`}>
          <Icons.Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>{t('noRecentActivity')}</p>
        </div>
      )}
    </div>
  );
});

// Widget de progression des économies
export const SavingsProgressWidget = memo(({ state, computedValues, formatCurrency, theme, t }) => {
  const savingsGoals = computedValues.savingsForSelectedMonth;
  const totalSavings = computedValues.totalSavings;
  const totalSavingsThisMonth = computedValues.totalSavingsThisMonth;

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-semibold ${theme.text} flex items-center`}>
        <Icons.PiggyBank className="h-5 w-5 mr-2 text-green-600" />
        {t('savingsProgress')}
      </h3>
      
      <div className={`p-4 rounded-lg border ${theme.border} ${theme.bg}`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className={`text-sm ${theme.textSecondary}`}>{t('totalSaved')}</p>
            <p className={`text-2xl font-bold ${theme.text}`}>
              {state.showBalances ? formatCurrency(totalSavings) : '•••'}
            </p>
          </div>
          {totalSavingsThisMonth > 0 && (
            <div className="text-right">
              <p className={`text-sm text-green-600 font-medium`}>
                +{formatCurrency(totalSavingsThisMonth)} {t('thisMonth')}
              </p>
              <p className={`text-xs ${theme.textSecondary}`}>
                {t('progressThisMonth')}
              </p>
            </div>
          )}
        </div>
        
        {savingsGoals.length > 0 ? (
          <div className="space-y-3">
            {savingsGoals.slice(0, 3).map(goal => (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${theme.text}`}>{goal.name}</span>
                  <span className={`text-sm ${theme.textSecondary}`}>
                    {goal.cumulativeProgress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(goal.cumulativeProgress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className={theme.textSecondary}>
                    {state.showBalances ? formatCurrency(goal.cumulativeAmount) : '•••'} / {state.showBalances ? formatCurrency(goal.targetAmount) : '•••'}
                  </span>
                  {goal.monthAmount > 0 && (
                    <span className="text-green-600 font-medium">
                      +{formatCurrency(goal.monthAmount)} {t('thisMonth')}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {savingsGoals.length > 3 && (
              <p className={`text-xs ${theme.textSecondary} text-center`}>
                {t('andMoreGoals', { count: savingsGoals.length - 3 })}
              </p>
            )}
          </div>
        ) : (
          <div className={`text-center py-4 ${theme.textSecondary}`}>
            <Icons.Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('noSavingsGoals')}</p>
          </div>
        )}
      </div>
    </div>
  );
});

// Aperçu Budgétaire Détaillé
export const BudgetOverview = memo(({ state, computedValues, formatCurrency, theme, t }) => {
  const categoryProgress = state.categories.map(category => {
    const spent = computedValues.currentMonthExpenses
      .filter(e => e.category === category.name)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const percentage = category.budget > 0 ? (spent / category.budget) * 100 : 0;
    
    return {
      ...category,
      spent,
      percentage: Math.min(percentage, 100),
      remaining: Math.max(category.budget - spent, 0),
      status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
    };
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'over': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="space-y-4">
      {categoryProgress.map(category => (
        <div key={category.id} className={`p-4 rounded-lg border ${theme.border} ${theme.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: category.color }}
              ></div>
              <span className={`font-medium ${theme.text}`}>{category.name}</span>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${theme.text}`}>
                {formatCurrency(category.spent)} / {formatCurrency(category.budget)}
              </p>
              <p className={`text-xs ${theme.textSecondary}`}>
                {t('remaining')}: {formatCurrency(category.remaining)}
              </p>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(category.status)}`}
              style={{ width: `${Math.min(category.percentage, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <span className={`text-xs ${theme.textSecondary}`}>
              {category.percentage.toFixed(1)}% {t('used')}
            </span>
            {category.status === 'over' && (
              <span className="text-xs text-red-500 font-medium">
                {t('exceededBy')}: {formatCurrency(category.spent - category.budget)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

// Comparaison Semaine vs Semaine Précédente
export const WeekComparison = memo(({ computedValues, formatCurrency, theme, t }) => {
  // Simulation données semaine actuelle vs précédente
  const weekData = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return days.map(day => ({
      day,
      thisWeek: Math.floor(Math.random() * 100) + 20,
      lastWeek: Math.floor(Math.random() * 100) + 20
    }));
  }, []);

  const thisWeekTotal = weekData.reduce((sum, d) => sum + d.thisWeek, 0);
  const lastWeekTotal = weekData.reduce((sum, d) => sum + d.lastWeek, 0);
  const weekDiff = thisWeekTotal - lastWeekTotal;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className={`font-semibold ${theme.text}`}>{t('thisWeekVsLastWeek')}</h4>
        <div className={`flex items-center space-x-2 ${weekDiff > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {weekDiff > 0 ? <Icons.TrendingUp className="h-4 w-4" /> : <Icons.TrendingDown className="h-4 w-4" />}
          <span className="text-sm font-medium">
            {weekDiff > 0 ? '+' : ''}{formatCurrency(weekDiff)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekData.map((data, index) => (
          <div key={index} className="text-center">
            <div className={`text-xs ${theme.textSecondary} mb-2`}>{data.day}</div>
            
            <div className="space-y-1">
              <div 
                className="bg-blue-500 rounded"
                style={{ height: `${(data.thisWeek / 120) * 60}px`, minHeight: '4px' }}
                title={`${t('thisWeek')}: ${formatCurrency(data.thisWeek)}`}
              ></div>
              <div 
                className="bg-gray-400 rounded"
                style={{ height: `${(data.lastWeek / 120) * 60}px`, minHeight: '4px' }}
                title={`${t('lastWeek')}: ${formatCurrency(data.lastWeek)}`}
              ></div>
            </div>
            
            <div className={`text-xs mt-1 ${theme.textSecondary}`}>
              {formatCurrency(data.thisWeek)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className={theme.textSecondary}>{t('thisWeek')}</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-400 rounded"></div>
          <span className={theme.textSecondary}>{t('lastWeek')}</span>
        </div>
      </div>
    </div>
  );
});

// Alertes & Insights Temps Réel
export const RealTimeInsights = memo(({ state, computedValues, formatCurrency, theme, t }) => {
  const insights = useMemo(() => {
    const alerts = [];
    
    // Détection dépenses inhabituelles
    const avgExpense = computedValues.currentMonthExpenses.length > 0 
      ? computedValues.totalSpent / computedValues.currentMonthExpenses.length
      : 0;
    
    const bigExpenses = computedValues.currentMonthExpenses.filter(e => e.amount > avgExpense * 2);
    if (bigExpenses.length > 0) {
      alerts.push({
        type: 'warning',
        icon: Icons.AlertTriangle,
        message: `${bigExpenses.length} ${t('unusualExpensesDetected')}`,
        action: t('seeDetails')
      });
    }

    // Analyse fréquence
    const categoryFreq = {};
    computedValues.currentMonthExpenses.forEach(e => {
      categoryFreq[e.category] = (categoryFreq[e.category] || 0) + 1;
    });
    
    Object.entries(categoryFreq).forEach(([category, count]) => {
      if (count > 10) {
        alerts.push({
          type: 'info',
          icon: Icons.Repeat,
          message: `${count} ${t('purchasesInCategory')} ${category} ${t('thisMonth')} - ${t('habitDetected')}`,
          action: t('analyze')
        });
      }
    });

    // Budget warnings
    state.categories.forEach(cat => {
      const spent = computedValues.currentMonthExpenses
        .filter(e => e.category === cat.name)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const percentage = (spent / cat.budget) * 100;
      
      if (percentage > 90 && percentage <= 100) {
        alerts.push({
          type: 'warning',
          icon: Icons.AlertCircle,
          message: `${t('budget')} ${cat.name} ${t('almostReached')} (${percentage.toFixed(0)}%)`,
          action: t('seeBudget')
        });
      }
    });

    return alerts.slice(0, 4); // Limite à 4 alertes
  }, [state.categories, computedValues, formatCurrency, t]);

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20';
      case 'danger': return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      default: return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  return (
    <div className="space-y-3">
      {insights.length === 0 ? (
        <div className={`p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 text-center`}>
          <Icons.CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-green-700 dark:text-green-300">
            {t('allGood')}! {t('noAlertsDetected')}
          </p>
        </div>
      ) : (
        insights.map((insight, index) => (
          <div key={index} className={`p-3 rounded-lg border ${getAlertColor(insight.type)}`}>
            <div className="flex items-start space-x-3">
              <insight.icon className={`h-5 w-5 mt-0.5 ${
                insight.type === 'warning' ? 'text-yellow-600' :
                insight.type === 'danger' ? 'text-red-600' : 'text-blue-600'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium">{insight.message}</p>
                {insight.action && (
                  <button className="text-xs text-blue-600 hover:text-blue-800 mt-1">
                    {insight.action} →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
});

// Objectifs du Mois
export const MonthlyGoals = memo(({ state, computedValues, formatCurrency, theme, t }) => {
  // Calcul du revenu total à partir des sources renseignées
  const totalRevenue = (state.revenues || []).reduce((sum, rev) => sum + rev.amount, 0);
  // Simulation objectifs du mois
  const monthlyGoals = useMemo(() => [
    {
      id: 1,
      title: t('stayUnderTotalBudget'),
      target: computedValues.totalBudget,
      current: computedValues.totalSpent,
      type: 'spending',
      icon: Icons.Target
    },
    {
      id: 2,
      title: t('save20OfIncome'),
      target: totalRevenue * 0.2,
      current: totalRevenue - computedValues.totalSpent,
      type: 'saving',
      icon: Icons.PiggyBank
    },
    {
      id: 3,
      title: t('max3LeisureTrips'),
      target: 3,
      current: computedValues.currentMonthExpenses.filter(e => e.category === 'Loisirs').length,
      type: 'frequency',
      icon: Icons.Calendar
    }
  ], [state, computedValues, t]);

  return (
    <div className="space-y-4">
      {monthlyGoals.map(goal => {
        const progress = goal.type === 'spending' 
          ? Math.min((goal.current / goal.target) * 100, 100)
          : goal.type === 'saving'
          ? Math.min((goal.current / goal.target) * 100, 100)
          : Math.min((goal.current / goal.target) * 100, 100);
        
        const isOnTrack = goal.type === 'spending' 
          ? goal.current <= goal.target
          : goal.current >= goal.target * 0.8; // 80% de l'objectif = sur la bonne voie

        return (
          <div key={goal.id} className={`p-4 rounded-lg border ${theme.border} ${theme.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <goal.icon className={`h-4 w-4 ${isOnTrack ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`font-medium ${theme.text}`}>{goal.title}</span>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${
                isOnTrack 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {isOnTrack ? t('onTrack') : t('attention')}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={theme.textSecondary}>
                  {goal.type === 'frequency' ? `${goal.current}/${goal.target}` : formatCurrency(goal.current)}
                </span>
                <span className={theme.textSecondary}>
                  {goal.type === 'frequency' ? '' : `/ ${formatCurrency(goal.target)}`}
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isOnTrack ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>

              <div className={`text-xs ${theme.textSecondary}`}>
                {progress.toFixed(0)}% {goal.type === 'spending' ? t('used') : t('reached')}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

// Mini-Rapports Visuels
export const MiniReports = memo(({ computedValues, formatCurrency, theme, t }) => {
  // Calcul velocity (rythme de dépense)
  const today = new Date();
  const dayOfMonth = today.getDate();
  const expectedSpent = (computedValues.totalBudget / 30) * dayOfMonth;
  const velocity = computedValues.totalSpent / expectedSpent;

  // Générer les jours traduits à chaque render
  const days = [t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')];

  // Générer les valeurs stables une seule fois
  const [weekdayValues] = useState(() =>
    Array.from({ length: 7 }, () => ({
      amount: Math.floor(Math.random() * 80) + 20,
      intensity: Math.random()
    }))
  );

  // Combiner jours traduits et valeurs stables
  const weekdayData = days.map((day, i) => ({
    day,
    ...weekdayValues[i]
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Velocity Meter */}
      <div className={`p-4 rounded-lg border ${theme.border} ${theme.bg}`}>
        <h4 className={`font-semibold ${theme.text} mb-4 flex items-center`}>
          <Icons.Gauge className="h-4 w-4 mr-2" />
          {t('expenseVelocity')}
        </h4>
        
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" 
                className="text-gray-200 dark:text-gray-700" />
              <circle
                cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none"
                strokeDasharray={`${Math.min(velocity * 125, 251)} 251`}
                className={`${velocity > 1.2 ? 'text-red-500' : velocity > 0.8 ? 'text-yellow-500' : 'text-green-500'}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${theme.text}`}>{velocity.toFixed(1)}x</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className={`text-sm ${theme.textSecondary} mb-1`}>
            {velocity > 1.2 ? t('tooFast') : velocity > 0.8 ? t('normalVelocity') : t('underControl')}
          </p>
          <p className={`text-xs ${theme.textSecondary}`}>
            {t('totalSpent')} {formatCurrency(computedValues.totalSpent)} {t('onExpected')} {formatCurrency(expectedSpent)}
          </p>
        </div>
      </div>

      {/* Heatmap des jours */}
      <div className={`p-4 rounded-lg border ${theme.border} ${theme.bg}`}>
        <h4 className={`font-semibold ${theme.text} mb-4 flex items-center`}>
          <Icons.Calendar className="h-4 w-4 mr-2" />
          {t('weeklyHabits')}
        </h4>
        
        <div className="grid grid-cols-7 gap-1">
          {weekdayData.map((data, index) => (
            <div key={index} className="text-center">
              <div className={`text-xs ${theme.textSecondary} mb-1`}>{data.day}</div>
              <div 
                className={`h-8 rounded flex items-center justify-center text-xs font-medium ${
                  data.intensity > 0.7 ? 'bg-red-500 text-white' :
                  data.intensity > 0.4 ? 'bg-yellow-500 text-white' :
                  'bg-green-500 text-white'
                }`}
                title={`${data.day}: ${formatCurrency(data.amount)}`}
              >
                {data.amount}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-3 text-center">
          <p className={`text-xs ${theme.textSecondary}`}>
            {t('darkerMoreExpenses')}
          </p>
        </div>
      </div>
    </div>
  );
});

// Widgets Interactifs (gardés mais renommés pour éviter doublon)
export const InteractiveWidgets = memo(({ state, actions, formatCurrency, theme, t }) => {
  const [quickExpense, setQuickExpense] = useState({ amount: '', description: '', category: '' });
  const [savingsCalculator, setSavingsCalculator] = useState({ monthlyAmount: '', months: '' });

  const handleQuickExpense = () => {
    if (quickExpense.amount && quickExpense.description && quickExpense.category) {
      const success = actions.addExpense({
        ...quickExpense,
        amount: parseFloat(quickExpense.amount),
        date: new Date().toISOString().split('T')[0]
      });
      
      if (success) {
        setQuickExpense({ amount: '', description: '', category: '' });
      }
    }
  };

  const calculateSavings = () => {
    const monthly = parseFloat(savingsCalculator.monthlyAmount);
    const months = parseInt(savingsCalculator.months);
    return monthly && months ? monthly * months : 0;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Quick Add Expense */}
      <div className={`p-4 rounded-lg border ${theme.border} ${theme.bg}`}>
        <h3 className={`font-semibold ${theme.text} mb-3 flex items-center`}>
          <Icons.Plus className="h-4 w-4 mr-2" />
          {t('quickExpense')}
        </h3>
        
        <div className="space-y-3">
          <input
            type="number"
            placeholder={t('amount')}
            value={quickExpense.amount}
            onChange={(e) => setQuickExpense(prev => ({ ...prev, amount: e.target.value }))}
            className={`w-full p-2 text-base rounded border ${theme.border} ${theme.input}`}
          />
          
          <input
            type="text"
            placeholder={t('description')}
            value={quickExpense.description}
            onChange={(e) => setQuickExpense(prev => ({ ...prev, description: e.target.value }))}
            className={`w-full p-2 text-base rounded border ${theme.border} ${theme.input}`}
          />
          
          <select
            value={quickExpense.category}
            onChange={(e) => setQuickExpense(prev => ({ ...prev, category: e.target.value }))}
            className={`w-full p-2 text-base rounded border ${theme.border} ${theme.input}`}
          >
            <option value="">{t('selectCategory')}</option>
            {state.categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          
          <button
            onClick={handleQuickExpense}
            disabled={!quickExpense.amount || !quickExpense.description || !quickExpense.category}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('addExpense')}
          </button>
        </div>
      </div>

      {/* Savings Calculator */}
      <div className={`p-4 rounded-lg border ${theme.border} ${theme.bg}`}>
        <h3 className={`font-semibold ${theme.text} mb-3 flex items-center`}>
          <Icons.Calculator className="h-4 w-4 mr-2" />
          {t('savingsCalculator')}
        </h3>
        
        <div className="space-y-3">
          <input
            type="number"
            placeholder={t('monthlyAmount')}
            value={savingsCalculator.monthlyAmount}
            onChange={(e) => setSavingsCalculator(prev => ({ ...prev, monthlyAmount: e.target.value }))}
            className={`w-full p-2 text-base rounded border ${theme.border} ${theme.input}`}
          />
          
          <input
            type="number"
            placeholder={t('numberOfMonths')}
            value={savingsCalculator.months}
            onChange={(e) => setSavingsCalculator(prev => ({ ...prev, months: e.target.value }))}
            className={`w-full p-2 text-base rounded border ${theme.border} ${theme.input}`}
          />
          
          <div className={`p-3 rounded-lg ${theme.bg} border ${theme.border} text-center`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>{t('totalSaved')}</p>
            <p className={`text-2xl font-bold text-green-600`}>
              {formatCurrency(calculateSavings())}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});