import React, { useState, useCallback, memo, useRef } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as Icons from 'lucide-react';
import { 
  EnhancedQuickStats, 
  TodaySection,
  RecentActivity, 
  BudgetOverview, 
  WeekComparison,
  RealTimeInsights,
  MonthlyGoals,
  MiniReports,
  InteractiveWidgets,
  SavingsProgressWidget
} from '../components/dashboard/DashboardWidgets';
import Input from '../components/ui/Input';
import RevenueScreen from './RevenueScreen';
import ExpensesScreen from './ExpensesScreen';
import SavingsScreen from './SavingsScreen';

// Dashboard Screen
const DashboardScreen = memo(({ financeManager, theme, t }) => {
  const { state, actions, computedValues, formatCurrency } = financeManager;
  const [dashboardTab, setDashboardTab] = useState('overview');
  const [showWithInitial, setShowWithInitial] = useState(true);
  const endOfMonthRef = useRef(null);

  const WidgetCard = memo(({ title, icon: Icon, children, color = 'blue', className = '' }) => (
    <div className={`${theme.card} rounded-xl border ${theme.border} overflow-hidden ${className}`}>
      <div className={`p-4 bg-gradient-to-r from-${color}-500/10 to-${color}-600/10 border-b ${theme.border}`}>
        <div className="flex items-center space-x-3">
          <Icon className={`h-5 w-5 text-${color}-600`} />
          <h3 className={`font-semibold ${theme.text}`}>{title}</h3>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  ));

  // Génération d'insights IA basée sur les vraies données
  const generateFinancialInsights = useCallback(() => [
    t('youHaveSpent', {
      spent: formatCurrency(computedValues.totalSpent),
      currency: '', // ou la devise si tu veux l’afficher séparément
      lessOrMore: t(computedValues.totalSpent < computedValues.totalBudget ? 'less' : 'more'),
      budget: formatCurrency(computedValues.totalBudget)
    }),
    `${t('yourCurrentSavingsRate')} ${computedValues.savingsRate.toFixed(1)}%`,
    t('yourTopSpendingCategory', {
      category: computedValues.pieChartData.length > 0 ? t(computedValues.pieChartData.reduce((a, b) => a.value > b.value ? a : b).name) : t('none')
    })
  ], [computedValues, formatCurrency, t, state.language]);

  const generatePersonalizedRecommendations = useCallback(() => [
    computedValues.totalSpent > computedValues.totalBudget ? t('reduceNonEssentialExpenses') : t('excellentBudgetControl'),
    computedValues.savingsRate < 20 ? t('tryToSave20Percent') : t('goodSavingsRate')
  ], [computedValues, t, state.language]);

  // Calcul du solde réel avec solde initial
  const totalRevenue = (state.revenues || []).reduce((sum, rev) => sum + rev.amount, 0);
  const totalExpenses = computedValues.totalSpent;
  const initialBalance = state.initialBalance || 0;
  const realBalance = initialBalance + totalRevenue - totalExpenses;

  // Calcul dynamique du pourcentage de confiance pour la prédiction de fin de mois
  const predictEndOfMonth = useCallback(() => {
    // Récupérer les 6 derniers mois de données
    const now = new Date();
    const months = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toISOString().slice(0, 7);
      months.unshift(monthStr);
    }
    // Revenus et dépenses par mois
    const monthlyRevenues = months.map(month =>
      (state.revenues || []).reduce((sum, rev) => sum + (rev.history ? (rev.history[month] || 0) : 0), 0)
    );
    const monthlyExpenses = months.map(month =>
      (state.expenses || []).filter(e => e.date.startsWith(month)).reduce((sum, e) => sum + e.amount, 0)
    );
    // Si pas d'historique, fallback sur totalRevenue/totalSpent
    const totalRevenue = (state.revenues || []).reduce((sum, rev) => sum + rev.amount, 0);
    const totalExpenses = computedValues.totalSpent;
    // Calcul des variations
    const last3Rev = monthlyRevenues.slice(-3);
    const last3Exp = monthlyExpenses.slice(-3);
    const avgRev = last3Rev.reduce((a, b) => a + b, 0) / (last3Rev.length || 1);
    const avgExp = last3Exp.reduce((a, b) => a + b, 0) / (last3Exp.length || 1);
    const revVar = avgRev > 0 ? Math.max(...last3Rev) / Math.min(...last3Rev) - 1 : 0;
    const expVar = avgExp > 0 ? Math.max(...last3Exp) / Math.min(...last3Exp) - 1 : 0;
    // Dépense exceptionnelle ce mois ?
    const bigExpense = (state.expenses || []).some(e => e.date.startsWith(state.selectedMonth) && e.amount > 0.3 * totalRevenue);
    // Calcul confiance
    let confidence = 60;
    if (revVar < 0.1) confidence += 10;
    if (expVar < 0.15) confidence += 10;
    if (months.length > 4) confidence += 10;
    if (bigExpense) confidence -= 10;
    confidence = Math.max(40, Math.min(95, confidence));
    // Prédiction
    return {
      projectedEndBalance: totalRevenue - totalExpenses - (totalExpenses * 0.3),
      confidence
    };
  }, [state, computedValues.totalSpent, state.selectedMonth]);

  const calculateFinancialHealthScore = useCallback(() => {
    const savingsRate = computedValues.savingsRate / 100;
    const budgetRespect = computedValues.totalSpent <= computedValues.totalBudget ? 1 : 0;
    const score = Math.round((savingsRate * 50 + budgetRespect * 50));
    return {
      score: Math.min(100, Math.max(0, score)),
      message: score > 70 ? t('excellentHealth') : score > 40 ? t('goodManagement') : t('needsImprovement')
    };
  }, [computedValues, t]);

  const insights = generateFinancialInsights();
  const recommendations = generatePersonalizedRecommendations();
  const predictions = predictEndOfMonth();
  const healthScore = calculateFinancialHealthScore();

  // Fonction pour gérer le clic sur un widget
  const handleWidgetClick = (widget) => {
    switch (widget) {
      case 'income':
        setDashboardTab('revenue');
        break;
      case 'expenses':
        setDashboardTab('expenses');
        break;
      case 'accountBalance':
        setDashboardTab('overview');
        setTimeout(() => {
          if (endOfMonthRef.current) {
            endOfMonthRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
        break;
      case 'savings':
        setDashboardTab('savings');
        break;
      case 'savingsRate':
        setDashboardTab('savings');
        break;
      case 'remainingBudget':
        setDashboardTab('budget');
        break;
      default:
        setDashboardTab('overview');
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-500`}>
      <div className={`${theme.card} border-b ${theme.border} sticky top-0 z-10 backdrop-blur-lg bg-opacity-90 mt-[80px]`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('aiFinancialDashboard')}
            </h1>
            {/* Suppression du sélecteur de mois et d'année */}
          </div>
          
          <div className="flex items-center space-x-1 mt-4 overflow-x-auto">
            {[
              { id: 'overview', label: t('overview'), icon: Icons.LayoutDashboard },
              { id: 'today', label: t('today'), icon: Icons.Calendar },
              { id: 'budget', label: t('budget'), icon: Icons.PieChart },
              { id: 'activity', label: t('activity'), icon: Icons.Activity },
              { id: 'insights', label: t('aiInsights'), icon: Icons.Brain },
              { id: 'goals', label: t('goals'), icon: Icons.Target },
              { id: 'reports', label: t('reports'), icon: Icons.BarChart },
              { id: 'tools', label: t('tools'), icon: Icons.Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDashboardTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  dashboardTab === tab.id 
                    ? `bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400` 
                    : `${theme.text} hover:bg-gray-100 dark:hover:bg-gray-800`
                }`}
                aria-label={`${t('goTo')} ${tab.label}`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {dashboardTab === 'revenue' && (
          <RevenueScreen financeManager={financeManager} theme={theme} t={t} />
        )}

        {dashboardTab === 'expenses' && (
          <ExpensesScreen financeManager={financeManager} theme={theme} t={t} />
        )}

        {dashboardTab === 'savings' && (
          <SavingsScreen financeManager={financeManager} theme={theme} t={t} />
        )}

        {dashboardTab === 'overview' && (
          <>
            <div className="mb-6">
              <EnhancedQuickStats 
                state={state}
                computedValues={computedValues}
                formatCurrency={formatCurrency}
                theme={theme}
                t={t}
                onWidgetClick={handleWidgetClick}
              />
            </div>
            {/* Suppression de la carte solde du compte ici */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WidgetCard title={t('financialHealthScore')} icon={Icons.Heart} color="green">
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-200 dark:text-gray-700" />
                        <circle
                          cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="none"
                          strokeDasharray={`${healthScore.score * 1.76} 176`}
                          className={`${healthScore.score > 70 ? 'text-green-500' : healthScore.score > 40 ? 'text-yellow-500' : 'text-red-500'}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-lg font-bold ${theme.text}`}>{healthScore.score}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs ${theme.textSecondary} p-2 rounded-lg ${theme.bg} border ${theme.border}`}>
                    {healthScore.message}
                  </div>
                </div>
              </WidgetCard>

              <div ref={endOfMonthRef}>
                <WidgetCard title={t('endOfMonthPredictions')} icon={Icons.TrendingUp} color="purple">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        id="showWithInitial"
                        checked={showWithInitial}
                        onChange={e => setShowWithInitial(e.target.checked)}
                        className="form-checkbox h-4 w-4 text-purple-600"
                      />
                      <label htmlFor="showWithInitial" className="text-sm text-purple-700 dark:text-purple-300 cursor-pointer">
                        {t('includingInitialBalance')}
                      </label>
                    </div>
                    <div className={`text-2xl font-bold ${theme.text}`}> 
                      {state.showBalances
                        ? showWithInitial
                          ? formatCurrency((state.initialBalance || 0) + predictions.projectedEndBalance)
                          : formatCurrency(predictions.projectedEndBalance)
                        : '•••'}
                    </div>
                    <p className={`text-sm ${theme.textSecondary}`}>{t('projectedBalance')}</p>
                    <div className={`text-xs text-blue-700 dark:text-blue-300`}>
                      {showWithInitial
                        ? `${t('includingInitialBalance')}: ${state.showBalances ? formatCurrency(state.initialBalance || 0) : '•••'}`
                        : t('withoutInitialBalance') || 'Solde du mois sans solde initial'}
                    </div>
                    <div className={`p-3 rounded-lg ${theme.bg} border ${theme.border}`}>
                      <p className={`text-xs ${theme.textSecondary}`}>{t('confidence')}: {predictions.confidence}%</p>
                    </div>
                  </div>
                </WidgetCard>
              </div>

              <WidgetCard title={t('expenseChart')} icon={Icons.PieChart} color="blue">
                <div className="h-40">
                  {computedValues.pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={computedValues.pieChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, percent}) => `${t(name)} ${(percent * 100).toFixed(0)}%`}
                        >
                          {computedValues.pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className={`text-sm ${theme.textSecondary}`}>{t('noExpensesThisMonth')}</p>
                    </div>
                  )}
                </div>
              </WidgetCard>

              <WidgetCard title={t('weeklyComparison')} icon={Icons.BarChart3} color="indigo">
                <WeekComparison 
                  computedValues={computedValues}
                  formatCurrency={formatCurrency}
                  theme={theme}
                  t={t}
                />
              </WidgetCard>
            </div>
          </>
        )}

        {dashboardTab === 'budget' && (
          <div className="space-y-6">
            <WidgetCard title={t('detailedBudgetOverview')} icon={Icons.Target} color="green">
              <BudgetOverview 
                state={state}
                computedValues={computedValues}
                formatCurrency={formatCurrency}
                theme={theme}
                t={t}
              />
            </WidgetCard>
          </div>
        )}

        {dashboardTab === 'activity' && (
          <div className="space-y-6">
            <WidgetCard title={t('recentActivity')} icon={Icons.Clock} color="blue">
              <RecentActivity 
                computedValues={computedValues}
                formatCurrency={formatCurrency}
                theme={theme}
                t={t}
              />
            </WidgetCard>
          </div>
        )}

        {dashboardTab === 'insights' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WidgetCard title={t('realTimeInsights')} icon={Icons.Zap} color="red">
              <RealTimeInsights 
                state={state}
                computedValues={computedValues}
                formatCurrency={formatCurrency}
                theme={theme}
                t={t}
              />
            </WidgetCard>

            <WidgetCard title={t('financialAnalysisAI')} icon={Icons.Lightbulb} color="blue">
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className={`p-3 rounded-lg ${theme.bg} border ${theme.border}`}>
                    <p className={`text-sm ${theme.text}`}>{insight}</p>
                  </div>
                ))}
              </div>
            </WidgetCard>

            <WidgetCard title={t('personalizedRecommendations')} icon={Icons.Sparkles} color="purple" className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className={`p-3 rounded-lg ${theme.bg} border ${theme.border}`}>
                    <p className={`text-sm ${theme.text}`}>{rec}</p>
                  </div>
                ))}
              </div>
            </WidgetCard>
          </div>
        )}

        {dashboardTab === 'goals' && (
          <div className="space-y-6">
            <WidgetCard title={t('monthlyGoals')} icon={Icons.Trophy} color="yellow">
              <MonthlyGoals 
                state={state}
                computedValues={computedValues}
                formatCurrency={formatCurrency}
                theme={theme}
                t={t}
              />
            </WidgetCard>
            
            <WidgetCard title={t('savingsProgress')} icon={Icons.PiggyBank} color="green">
              <SavingsProgressWidget 
                state={state}
                computedValues={computedValues}
                formatCurrency={formatCurrency}
                theme={theme}
                t={t}
              />
            </WidgetCard>
          </div>
        )}

        {dashboardTab === 'reports' && (
          <div className="space-y-6">
            <MiniReports 
              computedValues={computedValues}
              formatCurrency={formatCurrency}
              theme={theme}
              t={t}
            />
            
            <div className={`${theme.card} rounded-xl border ${theme.border} p-6`}>
              <h3 className={`text-xl font-bold ${theme.text} mb-6`}>{t('monthlyEvolution')}</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={computedValues.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name={t('revenues')} />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name={t('expenses')} />
                    <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} name={t('savings')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {dashboardTab === 'tools' && (
          <div className="space-y-6">
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>{t('interactiveTools')}</h2>
            <InteractiveWidgets 
              state={state}
              actions={actions}
              formatCurrency={formatCurrency}
              theme={theme}
              t={t}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default DashboardScreen;