import { format } from 'date-fns';
import { fr, enUS, es } from 'date-fns/locale';

class ReportGenerator {
  static getLocale(language) {
    switch (language) {
      case 'fr': return fr;
      case 'es': return es;
      default: return enUS;
    }
  }

  static async generateHTML(reportData) {
    const { type, data, translations: t } = reportData;
    
    switch (type) {
      case 'monthly':
        return this.generateMonthlyReport(data, t);
      case 'annual':
        return this.generateAnnualReport(data, t);
      case 'budget':
        return this.generateBudgetReport(data, t);
      case 'savings':
        return this.generateSavingsReport(data, t);
      case 'debts':
        return this.generateDebtReport(data, t);
      default:
        return this.generateMonthlyReport(data, t);
    }
  }

  static generateMonthlyReport(data, t) {
    const monthName = format(new Date(data.selectedMonth + '-01'), 'MMMM yyyy', {
      locale: this.getLocale(data.language)
    });

    return `
      <div class="max-w-4xl mx-auto p-8 bg-white">
        <style>
          .chart-container { height: 300px; background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0; }
          .metric-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; margin: 8px 0; }
          .category-bar { height: 8px; border-radius: 4px; margin: 4px 0; }
          .positive { color: #10b981; }
          .negative { color: #ef4444; }
          .warning { color: #f59e0b; }
        </style>
        
        <!-- En-tête -->
        <div class="text-center mb-8 border-b pb-6">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            ${t('monthlyReport')} - ${monthName}
          </h1>
          <div class="text-gray-600">
            ${t('generatedOn')} ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>

        <!-- Métriques principales -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="metric-card">
            <div class="text-lg opacity-90">${t('totalSpent')}</div>
            <div class="text-3xl font-bold">${this.formatCurrency(data.totalSpent)}</div>
            <div class="text-sm opacity-75 mt-2">
              ${((data.totalSpent / data.totalBudget) * 100).toFixed(1)}% ${t('ofBudget')}
            </div>
          </div>
          <div class="metric-card">
            <div class="text-lg opacity-90">${t('savingsRate')}</div>
            <div class="text-3xl font-bold">${data.savingsRate.toFixed(1)}%</div>
            <div class="text-sm opacity-75 mt-2">
              ${this.formatCurrency(data.totalSavingsThisMonth)} ${t('thisMonth')}
            </div>
          </div>
          <div class="metric-card">
            <div class="text-lg opacity-90">${t('remainingBudget')}</div>
            <div class="text-3xl font-bold">${this.formatCurrency(data.totalBudget - data.totalSpent)}</div>
            <div class="text-sm opacity-75 mt-2">
              ${t('available')}
            </div>
          </div>
        </div>

        <!-- Analyse par catégorie -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">${t('budgetAnalysis')}</h2>
          <div class="space-y-4">
            ${data.categories.map(category => {
              const spent = data.currentMonthExpenses
                .filter(e => e.category === category.name)
                .reduce((sum, e) => sum + e.amount, 0);
              const percentage = (spent / category.budget) * 100;
              const statusClass = percentage > 100 ? 'negative' : percentage > 80 ? 'warning' : 'positive';
              
              return `
                <div class="border rounded-lg p-4">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-medium capitalize">${t(category.name)}</span>
                    <span class="${statusClass} font-bold">${this.formatCurrency(spent)} / ${this.formatCurrency(category.budget)}</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="category-bar bg-gradient-to-r from-blue-500 to-purple-600" 
                         style="width: ${Math.min(percentage, 100)}%; background-color: ${category.color}"></div>
                  </div>
                  <div class="text-sm text-gray-600 mt-1">${percentage.toFixed(1)}% ${t('used')}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Graphique des dépenses -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">${t('expenseChart')}</h2>
          <div class="chart-container">
            <div class="text-center text-gray-500 mt-20">
              📊 ${t('chartWillBeHere')}
              <br><small>${t('interactiveInBrowser')}</small>
            </div>
          </div>
        </div>

        <!-- Top dépenses -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">${t('topExpenses')}</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full bg-white border border-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left">${t('date')}</th>
                  <th class="px-4 py-2 text-left">${t('description')}</th>
                  <th class="px-4 py-2 text-left">${t('category')}</th>
                  <th class="px-4 py-2 text-right">${t('amount')}</th>
                </tr>
              </thead>
              <tbody>
                ${data.currentMonthExpenses
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 10)
                  .map(expense => `
                    <tr class="border-t">
                      <td class="px-4 py-2">${format(new Date(expense.date), 'dd/MM/yyyy')}</td>
                      <td class="px-4 py-2">${expense.description}</td>
                      <td class="px-4 py-2 capitalize">${t(expense.category)}</td>
                      <td class="px-4 py-2 text-right font-medium">${this.formatCurrency(expense.amount)}</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Commentaires et recommandations -->
        <div class="bg-blue-50 p-6 rounded-lg">
          <h3 class="text-lg font-bold text-blue-800 mb-3">💡 ${t('recommendations')}</h3>
          <ul class="space-y-2 text-blue-700">
            ${this.generateRecommendations(data, t).map(rec => `<li>• ${rec}</li>`).join('')}
          </ul>
        </div>

        <!-- Footer -->
        <div class="text-center mt-8 pt-6 border-t text-gray-500 text-sm">
          ${t('generatedBy')} ${data.userName || t('user')} | ${t('futureFinance')}
        </div>
      </div>
    `;
  }

  static generateAnnualReport(data, t) {
    const currentYear = new Date().getFullYear();
    const yearExpenses = data.expenses.filter(e => e.date.startsWith(currentYear.toString()));
    const totalYearSpent = yearExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalYearIncome = data.monthlyIncome * 12;
    const yearSavingsRate = totalYearIncome > 0 ? ((totalYearIncome - totalYearSpent) / totalYearIncome) * 100 : 0;
    
    // Dépenses par mois
    const monthlyData = Array.from({length: 12}, (_, i) => {
      const month = String(i + 1).padStart(2, '0');
      const monthExpenses = yearExpenses.filter(e => e.date.startsWith(`${currentYear}-${month}`));
      const monthTotal = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      return { month, total: monthTotal, count: monthExpenses.length };
    });

    return `
      <div class="max-w-4xl mx-auto p-8 bg-white">
        <style>
          .metric-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; margin: 8px 0; }
          .month-bar { height: 20px; border-radius: 4px; margin: 4px 0; background: linear-gradient(90deg, #3b82f6, #8b5cf6); }
          .positive { color: #10b981; }
          .negative { color: #ef4444; }
        </style>
        <div class="text-center mb-8 border-b pb-6">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            ${t('annualReport')} - ${currentYear}
          </h1>
          <div class="text-gray-600">
            ${t('generatedOn')} ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="metric-card">
            <div class="text-lg opacity-90">${t('totalSpent')}</div>
            <div class="text-3xl font-bold">${this.formatCurrency(totalYearSpent)}</div>
            <div class="text-sm opacity-75 mt-2">
              ${((totalYearSpent / totalYearIncome) * 100).toFixed(1)}% ${t('ofBudget')}
            </div>
          </div>
          <div class="metric-card">
            <div class="text-lg opacity-90">${t('savingsRate')}</div>
            <div class="text-3xl font-bold">${yearSavingsRate.toFixed(1)}%</div>
            <div class="text-sm opacity-75 mt-2">
              ${this.formatCurrency(totalYearIncome - totalYearSpent)} ${t('thisYear')}
            </div>
          </div>
          <div class="metric-card">
            <div class="text-lg opacity-90">${t('remainingBudget')}</div>
            <div class="text-3xl font-bold">${this.formatCurrency(totalYearIncome - totalYearSpent)}</div>
            <div class="text-sm opacity-75 mt-2">
              ${t('available')}
            </div>
          </div>
        </div>
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">${t('monthlyEvolution')}</h2>
          <div class="space-y-2">
            ${monthlyData.map((m, i) => `
              <div>
                <div class="flex justify-between text-sm">
                  <span>${t('months')[i]}</span>
                  <span>${this.formatCurrency(m.total)}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="month-bar" style="width: ${Math.min((m.total / totalYearIncome) * 100, 100)}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="bg-blue-50 p-6 rounded-lg">
          <h3 class="text-lg font-bold text-blue-800 mb-3">💡 ${t('recommendations')}</h3>
          <ul class="space-y-2 text-blue-700">
            ${this.generateRecommendations({ ...data, totalSpent: totalYearSpent, totalBudget: totalYearIncome, savingsRate: yearSavingsRate }, t).map(rec => `<li>• ${rec}</li>`).join('')}
          </ul>
        </div>
        <div class="text-center mt-8 pt-6 border-t text-gray-500 text-sm">
          ${t('generatedBy')} ${data.userName || t('user')} | ${t('futureFinance')}
        </div>
      </div>
    `;
  }

  static generateBudgetReport(data, t) {
    return `
      <div class="max-w-4xl mx-auto p-8 bg-white">
        <style>
          .category-bar { height: 8px; border-radius: 4px; margin: 4px 0; }
          .positive { color: #10b981; }
          .negative { color: #ef4444; }
          .warning { color: #f59e0b; }
        </style>
        <div class="text-center mb-8 border-b pb-6">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            ${t('budgetAnalysis')}
          </h1>
          <div class="text-gray-600">
            ${t('generatedOn')} ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">${t('detailedBudgetOverview')}</h2>
          <div class="space-y-4">
            ${data.categories.map(category => {
              const spent = data.currentMonthExpenses
                .filter(e => e.category === category.name)
                .reduce((sum, e) => sum + e.amount, 0);
              const percentage = (spent / category.budget) * 100;
              const statusClass = percentage > 100 ? 'negative' : percentage > 80 ? 'warning' : 'positive';
              return `
                <div class="border rounded-lg p-4">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-medium capitalize">${t(category.name)}</span>
                    <span class="${statusClass} font-bold">${this.formatCurrency(spent)} / ${this.formatCurrency(category.budget)}</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="category-bar bg-gradient-to-r from-blue-500 to-purple-600" style="width: ${Math.min(percentage, 100)}%; background-color: ${category.color}"></div>
                  </div>
                  <div class="text-sm text-gray-600 mt-1">${percentage.toFixed(1)}% ${t('used')}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="bg-blue-50 p-6 rounded-lg">
          <h3 class="text-lg font-bold text-blue-800 mb-3">💡 ${t('recommendations')}</h3>
          <ul class="space-y-2 text-blue-700">
            ${this.generateRecommendations(data, t).map(rec => `<li>• ${rec}</li>`).join('')}
          </ul>
        </div>
        <div class="text-center mt-8 pt-6 border-t text-gray-500 text-sm">
          ${t('generatedBy')} ${data.userName || t('user')} | ${t('futureFinance')}
        </div>
      </div>
    `;
  }

  static generateSavingsReport(data, t) {
    const totalSavings = data.savings ? data.savings.reduce((sum, s) => sum + s.amount, 0) : 0;
    return `
      <div class="max-w-4xl mx-auto p-8 bg-white">
        <style>
          .goal-bar { height: 8px; border-radius: 4px; margin: 4px 0; }
          .positive { color: #10b981; }
          .warning { color: #f59e0b; }
        </style>
        <div class="text-center mb-8 border-b pb-6">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            ${t('savingsReport')}
          </h1>
          <div class="text-gray-600">
            ${t('generatedOn')} ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">${t('savingsGoals')}</h2>
          <div class="space-y-4">
            ${(data.savingsGoals || []).map(goal => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const statusClass = progress >= 100 ? 'positive' : 'warning';
              return `
                <div class="border rounded-lg p-4">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-medium">${goal.name}</span>
                    <span class="${statusClass} font-bold">${this.formatCurrency(goal.currentAmount)} / ${this.formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="goal-bar bg-gradient-to-r from-green-400 to-emerald-600" style="width: ${Math.min(progress, 100)}%"></div>
                  </div>
                  <div class="text-sm text-gray-600 mt-1">${progress.toFixed(1)}% ${t('reached')}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="bg-blue-50 p-6 rounded-lg">
          <h3 class="text-lg font-bold text-blue-800 mb-3">💡 ${t('recommendations')}</h3>
          <ul class="space-y-2 text-blue-700">
            ${this.generateRecommendations(data, t).map(rec => `<li>• ${rec}</li>`).join('')}
          </ul>
        </div>
        <div class="text-center mt-8 pt-6 border-t text-gray-500 text-sm">
          ${t('generatedBy')} ${data.userName || t('user')} | ${t('futureFinance')}
        </div>
      </div>
    `;
  }

  static generateDebtReport(data, t) {
    const totalDebt = data.debts ? data.debts.reduce((sum, d) => sum + d.balance, 0) : 0;
    return `
      <div class="max-w-4xl mx-auto p-8 bg-white">
        <style>
          .debt-bar { height: 8px; border-radius: 4px; margin: 4px 0; }
          .negative { color: #ef4444; }
          .positive { color: #10b981; }
        </style>
        <div class="text-center mb-8 border-b pb-6">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            ${t('debtAnalysis')}
          </h1>
          <div class="text-gray-600">
            ${t('generatedOn')} ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
        </div>
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">${t('debts')}</h2>
          <div class="space-y-4">
            ${(data.debts || []).map(debt => {
              const statusClass = debt.balance > 0 ? 'negative' : 'positive';
              return `
                <div class="border rounded-lg p-4">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-medium">${debt.name}</span>
                    <span class="${statusClass} font-bold">${this.formatCurrency(debt.balance)}</span>
                  </div>
                  <div class="text-sm text-gray-600 mt-1">${debt.description || ''}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="bg-blue-50 p-6 rounded-lg">
          <h3 class="text-lg font-bold text-blue-800 mb-3">💡 ${t('recommendations')}</h3>
          <ul class="space-y-2 text-blue-700">
            ${this.generateRecommendations(data, t).map(rec => `<li>• ${rec}</li>`).join('')}
          </ul>
        </div>
        <div class="text-center mt-8 pt-6 border-t text-gray-500 text-sm">
          ${t('generatedBy')} ${data.userName || t('user')} | ${t('futureFinance')}
        </div>
      </div>
    `;
  }

  static generateRecommendations(data, t) {
    const recommendations = [];
    
    if (data.savingsRate < 20) {
      recommendations.push(t('increaseSavingsRecommendation'));
    }
    
    if (data.totalSpent > data.totalBudget) {
      recommendations.push(t('reduceBudgetExcessRecommendation'));
    }
    
    if (data.debts && data.debts.length > 0) {
      recommendations.push(t('debtReductionRecommendation'));
    }
    
    return recommendations.length > 0 ? recommendations : [t('keepGoodWork')];
  }

  static generateBudgetRecommendations(categoryAnalysis, t) {
    const recommendations = [];
    
    const exceededCategories = categoryAnalysis.filter(c => c.status === 'exceeded');
    const warningCategories = categoryAnalysis.filter(c => c.status === 'warning');
    
    if (exceededCategories.length > 0) {
      recommendations.push(t('reduceExceededCategories'));
    }
    
    if (warningCategories.length > 0) {
      recommendations.push(t('monitorWarningCategories'));
    }
    
    const goodCategories = categoryAnalysis.filter(c => c.status === 'good');
    if (goodCategories.length > categoryAnalysis.length * 0.7) {
      recommendations.push(t('excellentBudgetControl'));
    }
    
    return recommendations.length > 0 ? recommendations : [t('keepGoodWork')];
  }

  static generateSavingsRecommendations(savingsGoals, totalMonthSavings, t) {
    const recommendations = [];
    
    if (savingsGoals.length === 0) {
      recommendations.push(t('createSavingsGoals'));
    } else if (totalMonthSavings === 0) {
      recommendations.push(t('startMonthlySavings'));
    } else if (totalMonthSavings < 100) {
      recommendations.push(t('increaseMonthlySavings'));
    } else {
      recommendations.push(t('excellentSavingsHabits'));
    }
    
    const lowProgressGoals = savingsGoals.filter(goal => {
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      return progress < 50;
    });
    
    if (lowProgressGoals.length > 0) {
      recommendations.push(t('focusOnLowProgressGoals'));
    }
    
    return recommendations;
  }

  static formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
}

export default ReportGenerator; 