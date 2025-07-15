import React, { memo, useState, useMemo, useCallback } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as Icons from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

// Déclaration de WidgetCard avec la prop theme
const WidgetCard = memo(({ title, icon: Icon, children, color = 'blue', className = '', theme }) => (
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

const RevenueScreen = memo(({ financeManager, theme, t }) => {
  const { state, actions, computedValues, formatCurrency } = financeManager;
  const [activeTab, setActiveTab] = useState('overview');
  const [editingRevenueId, setEditingRevenueId] = useState(null);
  const [editRevenueForm, setEditRevenueForm] = useState(null);

  // Synchroniser le formulaire d'édition avec la source sélectionnée
  React.useEffect(() => {
    if (editingRevenueId) {
      const rev = state.revenues.find(r => r.id === editingRevenueId);
      if (rev) setEditRevenueForm({ ...rev });
    } else {
      setEditRevenueForm(null);
    }
  }, [editingRevenueId, state.revenues]);

  // Calculer le solde actuel basé sur les revenus, dépenses ET solde initial
  const getCurrentBalance = useMemo(() => {
    const totalRevenue = state.revenues?.reduce((sum, rev) => sum + rev.amount, 0) || state.monthlyIncome;
    const totalExpenses = computedValues.totalSpent;
    const totalRecurring = computedValues.totalRecurring || 0;
    const initialBalance = state.initialBalance || 0;
    return {
      current: initialBalance + totalRevenue - totalExpenses - totalRecurring,
      totalRevenue,
      projectedEndMonth: initialBalance + totalRevenue - (totalExpenses * 1.2) - totalRecurring,
      savingsThisMonth: totalRevenue - totalExpenses
    };
  }, [state.revenues, state.monthlyIncome, computedValues.totalSpent, computedValues.totalRecurring, state.initialBalance]);

  // Analyse de stabilité des revenus
  const getRevenueStability = useMemo(() => {
    const revenues = state.revenues || [];
    const fixedRevenues = revenues.filter(r => r.type === 'fixed');
    const variableRevenues = revenues.filter(r => r.type === 'variable');
    
    const fixedTotal = fixedRevenues.reduce((sum, r) => sum + r.amount, 0);
    const variableTotal = variableRevenues.reduce((sum, r) => sum + r.amount, 0);
    const total = fixedTotal + variableTotal;
    
    const stabilityScore = total > 0 ? Math.round((fixedTotal / total) * 100) : 0;
    
    return {
      stabilityScore,
      fixedPercentage: total > 0 ? (fixedTotal / total) * 100 : 0,
      variablePercentage: total > 0 ? (variableTotal / total) * 100 : 0,
      level: stabilityScore > 80 ? 'high' : stabilityScore > 50 ? 'medium' : 'low'
    };
  }, [state.revenues]);

  // Données pour le graphique d'évolution des revenus
  const getRevenueEvolution = useMemo(() => {
    // Simulation de données sur 12 mois (à remplacer par de vraies données)
    const months = [];
    const currentMonth = new Date().getMonth();
    
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthNames = {
        fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
        en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      };
      
      const monthName = monthNames[state.language][monthIndex];
      const baseRevenue = state.monthlyIncome;
      
      months.push({
        month: monthName,
        revenue: baseRevenue + (Math.random() - 0.5) * baseRevenue * 0.3,
        expenses: computedValues.totalSpent + (Math.random() - 0.5) * computedValues.totalSpent * 0.4,
        savings: 0
      });
    }
    
    // Calculer les épargnes
    months.forEach(month => {
      month.savings = Math.max(0, month.revenue - month.expenses);
    });
    
    return months;
  }, [state.monthlyIncome, computedValues.totalSpent, state.language]);

  // Allocation automatique d'épargne
  const getAutomaticAllocation = useMemo(() => {
    const totalRevenue = getCurrentBalance.totalRevenue;
    
    return {
      emergency: { percentage: 10, amount: totalRevenue * 0.1, name: t('emergencyFund') },
      retirement: { percentage: 15, amount: totalRevenue * 0.15, name: t('retirement') },
      vacation: { percentage: 5, amount: totalRevenue * 0.05, name: t('vacation') },
      investment: { percentage: 10, amount: totalRevenue * 0.1, name: t('investments') }
    };
  }, [getCurrentBalance.totalRevenue, t]);

  // Sources de revenus par défaut
  const getDefaultRevenueSources = () => {
    const sources = {
      fr: [
        { name: 'Salaire Principal', type: 'fixed', frequency: 'monthly' },
        { name: 'Freelance', type: 'variable', frequency: 'irregular' },
        { name: 'Investissements', type: 'variable', frequency: 'monthly' },
        { name: 'Allocations', type: 'fixed', frequency: 'monthly' }
      ],
      en: [
        { name: 'Main Salary', type: 'fixed', frequency: 'monthly' },
        { name: 'Freelance', type: 'variable', frequency: 'irregular' },
        { name: 'Investments', type: 'variable', frequency: 'monthly' },
        { name: 'Benefits', type: 'fixed', frequency: 'monthly' }
      ],
      es: [
        { name: 'Salario Principal', type: 'fixed', frequency: 'monthly' },
        { name: 'Freelance', type: 'variable', frequency: 'irregular' },
        { name: 'Inversiones', type: 'variable', frequency: 'monthly' },
        { name: 'Beneficios', type: 'fixed', frequency: 'monthly' }
      ]
    };
    
    return sources[state.language] || sources.fr;
  };

  // Calculateur d'impôts simplifié
  const getTaxEstimation = useCallback((revenue) => {
    // Simulation simple d'impôts (à adapter selon les pays)
    const taxBrackets = [
      { min: 0, max: 10000, rate: 0 },
      { min: 10000, max: 25000, rate: 0.11 },
      { min: 25000, max: 75000, rate: 0.30 },
      { min: 75000, max: Infinity, rate: 0.41 }
    ];
    
    let tax = 0;
    let remaining = revenue;
    
    for (const bracket of taxBrackets) {
      if (remaining <= 0) break;
      
      const taxableInBracket = Math.min(remaining, bracket.max - bracket.min);
      tax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
    }
    
    return {
      grossRevenue: revenue,
      tax: Math.round(tax),
      netRevenue: Math.round(revenue - tax),
      taxRate: (tax / revenue) * 100
    };
  }, []);

  const balance = getCurrentBalance;
  const stability = getRevenueStability;
  const evolution = getRevenueEvolution;
  const allocation = getAutomaticAllocation;
  const defaultSources = getDefaultRevenueSources();

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-500`}>
      <div className={`${theme.card} border-b ${theme.border} sticky top-0 z-10 backdrop-blur-lg bg-opacity-90`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {t('revenueManagement')}
            </h1>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => actions.toggleModal('revenue', true)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <Icons.Plus className="h-4 w-4" />
                <span>{t('addRevenue')}</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 mt-4 overflow-x-auto">
            {[
              { id: 'overview', label: t('overview'), icon: Icons.LayoutDashboard },
              { id: 'sources', label: t('revenueSources'), icon: Icons.DollarSign },
              { id: 'balance', label: t('accountBalance'), icon: Icons.Wallet },
              { id: 'savings', label: t('savingsAllocation'), icon: Icons.PiggyBank },
              { id: 'analysis', label: t('analysis'), icon: Icons.TrendingUp },
              { id: 'tools', label: t('tools'), icon: Icons.Calculator }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? `bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400` 
                    : `${theme.text} hover:bg-gray-100 dark:hover:bg-gray-800`
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <WidgetCard title={t('totalRevenue')} icon={Icons.TrendingUp} color="green" theme={theme}>
                <div className="bg-green-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t('totalRevenue')}</span>
                    <Icons.TrendingUp className="h-5 w-5 opacity-80" />
                  </div>
                  <div className="text-2xl font-bold">
                    {state.showBalances ? formatCurrency(balance.totalRevenue) : '•••'}
                  </div>
                  <div className="text-xs opacity-75">{t('thisMonth')}</div>
                </div>
              </WidgetCard>

              <WidgetCard title={t('currentBalance')} icon={Icons.Wallet} color="blue" theme={theme}>
                <div className="bg-blue-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t('currentBalance')}</span>
                    <Icons.Wallet className="h-5 w-5 opacity-80" />
                  </div>
                  <div className="text-2xl font-bold">
                    {state.showBalances ? formatCurrency(balance.current) : '•••'}
                  </div>
                  <div className="text-xs opacity-75">{t('available')}</div>
                </div>
              </WidgetCard>

              <WidgetCard title={t('monthlySavings')} icon={Icons.PiggyBank} color="purple" theme={theme}>
                <div className="bg-purple-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t('monthlySavings')}</span>
                    <Icons.PiggyBank className="h-5 w-5 opacity-80" />
                  </div>
                  <div className="text-2xl font-bold">
                    {state.showBalances ? formatCurrency(balance.savingsThisMonth) : '•••'}
                  </div>
                  <div className="text-xs opacity-75">
                    {((balance.savingsThisMonth / balance.totalRevenue) * 100).toFixed(1)}%
                  </div>
                </div>
              </WidgetCard>

              <WidgetCard title={t('stabilityScore')} icon={Icons.Shield} color="orange" theme={theme}>
                <div className="bg-orange-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{t('stabilityScore')}</span>
                    <Icons.Shield className="h-5 w-5 opacity-80" />
                  </div>
                  <div className="text-2xl font-bold">{stability.stabilityScore}%</div>
                  <div className="text-xs opacity-75">
                    {stability.level === 'high' ? t('high') : 
                     stability.level === 'medium' ? t('medium') : t('low')}
                  </div>
                </div>
              </WidgetCard>
            </div>

            {/* Graphiques principaux */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WidgetCard title={t('revenueEvolution')} icon={Icons.TrendingUp} color="green" theme={theme}>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name={t('revenue')} />
                      <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name={t('expenses')} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </WidgetCard>

              <WidgetCard title={t('revenueStability')} icon={Icons.Shield} color="blue" theme={theme}>
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-gray-700" />
                        <circle
                          cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none"
                          strokeDasharray={`${stability.stabilityScore * 2.51} 251`}
                          className={`${stability.level === 'high' ? 'text-green-500' : stability.level === 'medium' ? 'text-yellow-500' : 'text-red-500'}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-lg font-bold ${theme.text}`}>{stability.stabilityScore}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>{t('fixedRevenue')}:</span>
                      <span className={`font-medium text-green-600`}>{stability.fixedPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>{t('variableRevenue')}:</span>
                      <span className={`font-medium text-yellow-600`}>{stability.variablePercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </WidgetCard>
            </div>

            {/* Allocation automatique */}
            <WidgetCard title={t('automaticAllocation')} icon={Icons.Shuffle} color="purple" theme={theme}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(allocation).map(([key, item]) => (
                  <div key={key} className={`p-3 rounded-lg ${theme.bg} border ${theme.border} text-center`}>
                    <div className={`text-sm ${theme.textSecondary} mb-1`}>{item.name}</div>
                    <div className={`text-lg font-bold text-purple-600`}>
                      {formatCurrency(item.amount)}
                    </div>
                    <div className={`text-xs ${theme.textSecondary}`}>{item.percentage}%</div>
                  </div>
                ))}
              </div>
            </WidgetCard>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="space-y-6">
            {/* Champ solde de départ */}
            <WidgetCard title={t('initialBalance') || 'Solde de départ'} icon={Icons.Wallet} color="blue" theme={theme}>
              <div className="flex flex-col items-center space-y-2">
                <div className="text-3xl font-bold">
                  {state.showBalances ? formatCurrency(state.initialBalance || 0) : '•••'}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={state.initialBalance || ''}
                    onChange={v => actions.setInitialBalance(v)}
                    className="w-32"
                  />
                  <Button size="sm" onClick={actions.confirmInitialBalance}>
                    {t('save') || 'Valider'}
                  </Button>
                </div>
              </div>
            </WidgetCard>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <WidgetCard title={t('addRevenueSource')} icon={Icons.Plus} color="green" theme={theme}>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (actions.addRevenue && actions.addRevenue(state.newRevenue)) {
                        actions.resetForm('newRevenue');
                      }
                    }}
                    className="space-y-4"
                  >
                    <Input
                      label={t('sourceName')}
                      type="text"
                      value={state.newRevenue?.name || ''}
                      onChange={(value) => actions.updateForm('newRevenue', { name: value })}
                      required
                    />
                    
                    <Input
                      label={t('amount')}
                      type="number"
                      step="0.01"
                      min="0"
                      value={state.newRevenue?.amount || ''}
                      onChange={(value) => actions.updateForm('newRevenue', { amount: value })}
                      required
                    />
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('revenueType')}
                      </label>
                      <select
                        value={state.newRevenue?.type || 'fixed'}
                        onChange={(e) => actions.updateForm('newRevenue', { type: e.target.value })}
                        className={`w-full px-3 py-2 text-base border rounded-lg ${theme.input}`}
                      >
                        <option value="fixed">{t('fixed')}</option>
                        <option value="variable">{t('variable')}</option>
                      </select>
                    </div>

                    {/* Champ jour du mois, visible uniquement si type = 'fixed' */}
                    {state.newRevenue?.type === 'fixed' && (
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('incomeDayOfMonth') || 'Jour d\'entrée d\'argent'}
                        </label>
                        <select
                          value={state.newRevenue?.dayOfMonth || '1'}
                          onChange={e => actions.updateForm('newRevenue', { dayOfMonth: e.target.value })}
                          className={`w-full px-3 py-2 text-base border rounded-lg ${theme.input}`}
                        >
                          {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500">{t('chooseDayOfMonthForFixedIncome') || 'Le jour du mois où ce revenu est reçu (ex : 1 pour le 1er du mois)'}</p>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('frequency')}
                      </label>
                      <select
                        value={state.newRevenue?.frequency || 'monthly'}
                        onChange={(e) => actions.updateForm('newRevenue', { frequency: e.target.value })}
                        className={`w-full px-3 py-2 text-base border rounded-lg ${theme.input}`}
                      >
                        <option value="weekly">{t('weekly')}</option>
                        <option value="biweekly">{t('biweekly')}</option>
                        <option value="monthly">{t('monthly')}</option>
                        <option value="quarterly">{t('quarterly')}</option>
                        <option value="annually">{t('annually')}</option>
                        <option value="irregular">{t('irregular')}</option>
                      </select>
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {t('addSource')}
                    </Button>
                  </form>
                </WidgetCard>

                {/* Templates rapides */}
                <WidgetCard title={t('quickTemplates')} icon={Icons.Zap} color="blue" className="mt-4" theme={theme}>
                  <div className="space-y-2">
                    {defaultSources.map((source, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (actions.updateForm) {
                            actions.updateForm('newRevenue', {
                              name: source.name,
                              type: source.type,
                              frequency: source.frequency,
                              amount: ''
                            });
                          }
                        }}
                        className={`w-full p-2 text-left rounded-lg border ${theme.border} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                      >
                        <div className={`text-sm font-medium ${theme.text}`}>{source.name}</div>
                        <div className={`text-xs ${theme.textSecondary}`}>
                          {t(source.type)} • {t(source.frequency)}
                        </div>
                      </button>
                    ))}
                  </div>
                </WidgetCard>
              </div>

              <div className="lg:col-span-2">
                <WidgetCard title={t('currentRevenueSources')} icon={Icons.List} color="green" theme={theme}>
                  <div className="space-y-3">
                    {(state.revenues || []).length === 0 ? (
                      <div className="text-center py-8">
                        <Icons.DollarSign className={`h-12 w-12 mx-auto mb-3 ${theme.textSecondary} opacity-50`} />
                        <p className={theme.textSecondary}>{t('noRevenueSources')}</p>
                        <p className={`text-xs ${theme.textSecondary} mt-2`}>{t('addFirstRevenueSource')}</p>
                      </div>
                    ) : (
                      (state.revenues || []).map(revenue => (
                        <div key={revenue.id} className={`p-4 rounded-lg border ${theme.border} ${theme.bg}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className={`font-semibold ${theme.text}`}>{revenue.name}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  revenue.type === 'fixed' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                }`}>
                                  {t(revenue.type)}
                                </span>
                                <span className={`text-xs ${theme.textSecondary}`}>
                                  {t(revenue.frequency)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-bold text-green-600`}>
                                {state.showBalances ? formatCurrency(revenue.amount) : '•••'}
                              </div>
                              <div className="flex items-center space-x-1 mt-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingRevenueId(revenue.id)}
                                >
                                  <Icons.Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => actions.deleteRevenue && actions.deleteRevenue(revenue.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Icons.Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {revenue.description && (
                            <p className={`text-sm ${theme.textSecondary} mt-2`}>{revenue.description}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </WidgetCard>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'balance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <WidgetCard title={t('currentBalance')} icon={Icons.Wallet} color="blue" theme={theme}>
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${balance.current >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {state.showBalances ? formatCurrency(balance.current) : '•••'}
                  </div>
                  <p className={`text-sm ${theme.textSecondary}`}>{t('availableNow')}</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-sm mb-2">
                      <span className={theme.textSecondary}>{t('totalRevenue')}:</span>
                      <span className="text-green-600 font-medium">+{formatCurrency(balance.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className={theme.textSecondary}>{t('expenses')}:</span>
                      <span className="text-red-600 font-medium">-{formatCurrency(computedValues.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={theme.textSecondary}>{t('recurring')}:</span>
                      <span className="text-orange-600 font-medium">-{formatCurrency(computedValues.totalRecurring || 0)}</span>
                    </div>
                  </div>
                </div>
              </WidgetCard>

              <WidgetCard title={t('projectedEndMonth')} icon={Icons.TrendingUp} color="purple" theme={theme}>
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${balance.projectedEndMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {state.showBalances ? formatCurrency(balance.projectedEndMonth) : '•••'}
                  </div>
                  <p className={`text-sm ${theme.textSecondary}`}>{t('estimatedEndOfMonth')}</p>
                  
                  <div className="mt-4">
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      balance.projectedEndMonth >= balance.current 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {balance.projectedEndMonth >= balance.current ? t('improving') : t('declining')}
                    </div>
                  </div>
                </div>
              </WidgetCard>

              <WidgetCard title={t('cashFlow')} icon={Icons.ArrowUpDown} color="indigo" theme={theme}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme.textSecondary}`}>{t('monthlyInflow')}:</span>
                    <span className="text-green-600 font-medium">+{formatCurrency(balance.totalRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme.textSecondary}`}>{t('monthlyOutflow')}:</span>
                    <span className="text-red-600 font-medium">-{formatCurrency(computedValues.totalSpent + (computedValues.totalRecurring || 0))}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${theme.text}`}>{t('netCashFlow')}:</span>
                      <span className={`font-bold ${balance.savingsThisMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(balance.savingsThisMonth)}
                      </span>
                    </div>
                  </div>
                </div>
              </WidgetCard>
            </div>

            {/* Historique des soldes */}
            <WidgetCard title={t('balanceHistory')} icon={Icons.History} color="blue" theme={theme}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} name={t('balance')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </WidgetCard>
          </div>
        )}

        {activeTab === 'savings' && (
          <div className="space-y-6">
            <WidgetCard title={t('automaticSavingsAllocation')} icon={Icons.PiggyBank} color="green" theme={theme}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className={`font-semibold ${theme.text} mb-4`}>{t('recommendedAllocation')}</h4>
                  <div className="space-y-3">
                    {Object.entries(allocation).map(([key, item]) => (
                      <div key={key} className={`p-3 rounded-lg border ${theme.border} ${theme.bg}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`font-medium ${theme.text}`}>{item.name}</span>
                          <span className="text-green-600 font-bold">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${theme.textSecondary}`}>{item.percentage}% {t('ofRevenue')}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Logique pour appliquer l'allocation automatique
                              console.log(`Applying allocation for ${item.name}: ${item.amount}`);
                            }}
                          >
                            {t('apply')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className={`font-semibold ${theme.text} mb-4`}>{t('savingsRules')}</h4>
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20`}>
                      <h5 className={`font-medium ${theme.text} mb-2`}>{t('rule503020')}</h5>
                      <p className={`text-xs ${theme.textSecondary} mb-2`}>{t('rule503020Description')}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>50% {t('needs')}:</span>
                          <span className="font-medium">{formatCurrency(balance.totalRevenue * 0.5)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>30% {t('wants')}:</span>
                          <span className="font-medium">{formatCurrency(balance.totalRevenue * 0.3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>20% {t('savings')}:</span>
                          <span className="font-medium text-green-600">{formatCurrency(balance.totalRevenue * 0.2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20`}>
                      <h5 className={`font-medium ${theme.text} mb-2`}>{t('automatedSavings')}</h5>
                      <p className={`text-xs ${theme.textSecondary} mb-2`}>{t('automatedSavingsDescription')}</p>
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          // Logique pour configurer l'épargne automatique
                          console.log('Setting up automated savings');
                        }}
                      >
                        {t('setupAutomation')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </WidgetCard>

            {/* Progression des objectifs d'épargne liés */}
            <WidgetCard title={t('savingsGoalsProgress')} icon={Icons.Target} color="purple" theme={theme}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {state.savingsGoals?.slice(0, 3).map(goal => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  return (
                    <div key={goal.id} className={`p-4 rounded-lg border ${theme.border} ${theme.bg}`}>
                      <h5 className={`font-medium ${theme.text} mb-2`}>{goal.name}</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className={theme.textSecondary}>{t('progress')}:</span>
                          <span className={theme.text}>{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className={theme.textSecondary}>{formatCurrency(goal.currentAmount)}</span>
                          <span className={theme.textSecondary}>{formatCurrency(goal.targetAmount)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }) || (
                  <div className="col-span-3 text-center py-6">
                    <Icons.Target className={`h-12 w-12 mx-auto mb-3 ${theme.textSecondary} opacity-50`} />
                    <p className={theme.textSecondary}>{t('noSavingsGoals')}</p>
                  </div>
                )}
              </div>
            </WidgetCard>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WidgetCard title={t('revenueAnalysis')} icon={Icons.BarChart3} color="blue" theme={theme}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className={`text-2xl font-bold text-green-600`}>
                        {((balance.totalRevenue / 1000)).toFixed(1)}K
                      </div>
                      <div className={`text-xs ${theme.textSecondary}`}>{t('monthlyRevenue')}</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${stability.level === 'high' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {stability.stabilityScore}%
                      </div>
                      <div className={`text-xs ${theme.textSecondary}`}>{t('stability')}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>{t('growthTrend')}:</span>
                      <span className="text-green-600 font-medium">+2.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>{t('diversificationScore')}:</span>
                      <span className="text-blue-600 font-medium">75%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>{t('seasonalityRisk')}:</span>
                      <span className="text-yellow-600 font-medium">{t('low')}</span>
                    </div>
                  </div>
                </div>
              </WidgetCard>

              <WidgetCard title={t('financialHealthIndicators')} icon={Icons.Activity} color="green" theme={theme}>
                <div className="space-y-3">
                  {[
                    { label: t('incomeStability'), value: stability.stabilityScore, max: 100, color: 'green' },
                    { label: t('savingsRate'), value: (balance.savingsThisMonth / balance.totalRevenue) * 100, max: 100, color: 'blue' },
                    { label: t('expenseControl'), value: 75, max: 100, color: 'purple' },
                    { label: t('debtRatio'), value: 25, max: 100, color: 'orange', invert: true }
                  ].map((indicator, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className={theme.textSecondary}>{indicator.label}</span>
                        <span className={`font-medium text-${indicator.color}-600`}>
                          {indicator.value.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`bg-${indicator.color}-500 h-2 rounded-full transition-all`}
                          style={{ width: `${Math.min(indicator.value, indicator.max)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </WidgetCard>
            </div>

            <WidgetCard title={t('revenueProjections')} icon={Icons.TrendingUp} color="purple" theme={theme}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className={`font-semibold ${theme.text} mb-4`}>{t('next12Months')}</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={evolution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h4 className={`font-semibold ${theme.text} mb-4`}>{t('scenarioAnalysis')}</h4>
                  <div className="space-y-3">
                    {[
                      { 
                        name: t('conservativeScenario'), 
                        change: -10, 
                        projected: balance.totalRevenue * 0.9 * 12,
                        color: 'red' 
                      },
                      { 
                        name: t('currentTrend'), 
                        change: 0, 
                        projected: balance.totalRevenue * 12,
                        color: 'blue' 
                      },
                      { 
                        name: t('optimisticScenario'), 
                        change: 15, 
                        projected: balance.totalRevenue * 1.15 * 12,
                        color: 'green' 
                      }
                    ].map((scenario, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${theme.border} ${theme.bg}`}>
                        <div className="flex justify-between items-center">
                          <span className={`font-medium ${theme.text}`}>{scenario.name}</span>
                          <div className="text-right">
                            <div className={`font-bold text-${scenario.color}-600`}>
                              {formatCurrency(scenario.projected)}
                            </div>
                            <div className={`text-xs ${scenario.change === 0 ? theme.textSecondary : `text-${scenario.color}-600`}`}>
                              {scenario.change > 0 ? '+' : ''}{scenario.change}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </WidgetCard>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WidgetCard title={t('taxCalculator')} icon={Icons.Calculator} color="orange" theme={theme}>
                <div className="space-y-4">
                  <Input
                    label={t('annualGrossIncome')}
                    type="number"
                    value={state.taxCalculator?.grossIncome || balance.totalRevenue * 12}
                    onChange={(value) => actions.updateForm && actions.updateForm('taxCalculator', { grossIncome: value })}
                  />
                  
                  {(() => {
                    const taxData = getTaxEstimation(state.taxCalculator?.grossIncome || balance.totalRevenue * 12);
                    return (
                      <div className={`p-4 rounded-lg ${theme.bg} border ${theme.border}`}>
                        <h5 className={`font-semibold ${theme.text} mb-3`}>{t('taxEstimation')}</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className={theme.textSecondary}>{t('grossIncome')}:</span>
                            <span className={theme.text}>{formatCurrency(taxData.grossRevenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={theme.textSecondary}>{t('estimatedTax')}:</span>
                            <span className="text-red-600">{formatCurrency(taxData.tax)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={theme.textSecondary}>{t('netIncome')}:</span>
                            <span className="text-green-600 font-semibold">{formatCurrency(taxData.netRevenue)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className={theme.textSecondary}>{t('effectiveTaxRate')}:</span>
                            <span className={theme.text}>{taxData.taxRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </WidgetCard>

              <WidgetCard title={t('netGrossConverter')} icon={Icons.ArrowLeftRight} color="blue" theme={theme}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label={t('grossAmount')}
                      type="number"
                      value={state.converter?.gross || ''}
                      onChange={(value) => {
                        actions.updateForm && actions.updateForm('converter', { 
                          gross: value,
                          net: value * 0.7 // Estimation simple
                        });
                      }}
                    />
                    <Input
                      label={t('netAmount')}
                      type="number"
                      value={state.converter?.net || ''}
                      onChange={(value) => {
                        actions.updateForm && actions.updateForm('converter', { 
                          net: value,
                          gross: value / 0.7 // Estimation simple
                        });
                      }}
                    />
                  </div>
                  
                  <div className={`p-3 rounded-lg ${theme.bg} border ${theme.border} text-center`}>
                    <div className={`text-xs ${theme.textSecondary} mb-1`}>{t('conversionRate')}</div>
                    <div className={`text-lg font-bold ${theme.text}`}>~70%</div>
                    <div className={`text-xs ${theme.textSecondary}`}>{t('approximateAfterTaxes')}</div>
                  </div>
                </div>
              </WidgetCard>

              <WidgetCard title={t('savingsSimulator')} icon={Icons.TrendingUp} color="green" theme={theme}>
                <div className="space-y-4">
                  <Input
                    label={t('monthlySavings')}
                    type="number"
                    value={state.savingsSimulator?.monthly || ''}
                    onChange={(value) => actions.updateForm && actions.updateForm('savingsSimulator', { monthly: value })}
                  />
                  
                  <Input
                    label={t('interestRate')} 
                    type="number"
                    step="0.1"
                    value={state.savingsSimulator?.rate || 3}
                    onChange={(value) => actions.updateForm && actions.updateForm('savingsSimulator', { rate: value })}
                  />
                  
                  <Input
                    label={t('timeHorizonYears')}
                    type="number"
                    value={state.savingsSimulator?.years || 10}
                    onChange={(value) => actions.updateForm && actions.updateForm('savingsSimulator', { years: value })}
                  />
                  
                  {(() => {
                    const monthly = parseFloat(state.savingsSimulator?.monthly || 0);
                    const rate = parseFloat(state.savingsSimulator?.rate || 3) / 100 / 12;
                    const years = parseFloat(state.savingsSimulator?.years || 10);
                    const months = years * 12;
                    
                    const futureValue = monthly * (((1 + rate) ** months - 1) / rate);
                    const totalContributions = monthly * months;
                    const interest = futureValue - totalContributions;
                    
                    return (
                      <div className={`p-4 rounded-lg ${theme.bg} border ${theme.border}`}>
                        <h5 className={`font-semibold ${theme.text} mb-3`}>{t('projectedResults')}</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className={theme.textSecondary}>{t('totalContributions')}:</span>
                            <span className={theme.text}>{formatCurrency(totalContributions)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={theme.textSecondary}>{t('interestEarned')}:</span>
                            <span className="text-green-600">{formatCurrency(interest)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className={`font-semibold ${theme.text}`}>{t('finalAmount')}:</span>
                            <span className="text-green-600 font-bold">{formatCurrency(futureValue)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </WidgetCard>

              <WidgetCard title={t('financialRatios')} icon={Icons.BarChart} color="purple" theme={theme}>
                <div className="space-y-3">
                  {[
                    { 
                      name: t('savingsRatio'), 
                      value: (balance.savingsThisMonth / balance.totalRevenue) * 100,
                      target: 20,
                      unit: '%'
                    },
                    { 
                      name: t('expenseRatio'), 
                      value: (computedValues.totalSpent / balance.totalRevenue) * 100,
                      target: 80,
                      unit: '%',
                      invert: true
                    },
                    { 
                      name: t('emergencyFundRatio'), 
                      value: (computedValues.totalSavings / computedValues.totalSpent) * 100,
                      target: 300,
                      unit: '%'
                    }
                  ].map((ratio, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${theme.border} ${theme.bg}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-medium ${theme.text}`}>{ratio.name}</span>
                        <span className={`font-bold ${
                          ratio.invert 
                            ? (ratio.value <= ratio.target ? 'text-green-600' : 'text-red-600')
                            : (ratio.value >= ratio.target ? 'text-green-600' : 'text-yellow-600')
                        }`}>
                          {ratio.value.toFixed(1)}{ratio.unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className={theme.textSecondary}>{t('target')}: {ratio.target}{ratio.unit}</span>
                        <span className={`${
                          ratio.invert 
                            ? (ratio.value <= ratio.target ? 'text-green-600' : 'text-red-600')
                            : (ratio.value >= ratio.target ? 'text-green-600' : 'text-yellow-600')
                        }`}>
                          {ratio.invert 
                            ? (ratio.value <= ratio.target ? t('good') : t('high'))
                            : (ratio.value >= ratio.target ? t('achieved') : t('belowTarget'))
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </WidgetCard>
            </div>
          </div>
        )}
      </div>
      {/* Formulaire d'édition de revenu */}
      {editingRevenueId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className={`w-full max-w-md p-6 rounded-xl shadow-lg ${theme.card} border ${theme.border}`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>{t('edit')} {t('revenueSource') || t('sourceName')}</h3>
            <form
              onSubmit={e => {
                e.preventDefault();
                const rev = state.revenues.find(r => r.id === editingRevenueId);
                if (actions.updateRevenue && rev) {
                  actions.updateRevenue(editingRevenueId, editRevenueForm);
                  setEditingRevenueId(null);
                }
              }}
              className="space-y-4"
            >
              <Input
                label={t('sourceName')}
                type="text"
                value={editRevenueForm?.name || ''}
                onChange={value => setEditRevenueForm(f => ({ ...f, name: value }))}
                required
              />
              <Input
                label={t('amount')}
                type="number"
                step="0.01"
                min="0"
                value={editRevenueForm?.amount || ''}
                onChange={value => setEditRevenueForm(f => ({ ...f, amount: value }))}
                required
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('revenueType')}
                </label>
                <select
                  value={editRevenueForm?.type || 'fixed'}
                  onChange={e => setEditRevenueForm(f => ({ ...f, type: e.target.value }))}
                  className={`w-full px-3 py-2 text-base border rounded-lg ${theme.input}`}
                >
                  <option value="fixed">{t('fixed')}</option>
                  <option value="variable">{t('variable')}</option>
                </select>
              </div>
              {/* Champ jour du mois, visible uniquement si type = 'fixed' */}
              {editRevenueForm?.type === 'fixed' && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('incomeDayOfMonth') || 'Jour d\'entrée d\'argent'}
                  </label>
                  <select
                    value={editRevenueForm?.dayOfMonth || '1'}
                    onChange={e => setEditRevenueForm(f => ({ ...f, dayOfMonth: e.target.value }))}
                    className={`w-full px-3 py-2 text-base border rounded-lg ${theme.input}`}
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">{t('chooseDayOfMonthForFixedIncome') || 'Le jour du mois où ce revenu est reçu (ex : 1 pour le 1er du mois)'}</p>
                </div>
              )}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('frequency')}
                </label>
                <select
                  value={editRevenueForm?.frequency || 'monthly'}
                  onChange={e => setEditRevenueForm(f => ({ ...f, frequency: e.target.value }))}
                  className={`w-full px-3 py-2 text-base border rounded-lg ${theme.input}`}
                >
                  <option value="weekly">{t('weekly')}</option>
                  <option value="biweekly">{t('biweekly')}</option>
                  <option value="monthly">{t('monthly')}</option>
                  <option value="quarterly">{t('quarterly')}</option>
                  <option value="annually">{t('annually')}</option>
                  <option value="irregular">{t('irregular')}</option>
                </select>
              </div>
              <Input
                label={t('description')}
                type="text"
                value={editRevenueForm?.description || ''}
                onChange={value => setEditRevenueForm(f => ({ ...f, description: value }))}
              />
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">{t('save')}</Button>
                <Button variant="outline" onClick={() => setEditingRevenueId(null)} className="flex-1">{t('cancel')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

export default RevenueScreen;