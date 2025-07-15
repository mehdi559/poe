import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import * as Icons from 'lucide-react';
import Button from './ui/Button';

const Chatbot = memo(({ financeManager, theme, t }) => {
  const { state, actions, computedValues, formatCurrency } = financeManager;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: t('chatbotWelcome') }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const normalize = useCallback((str) => {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  }, []);

  const getBotResponse = useCallback((msg) => {
    const m = normalize(msg);
    
    // Ajout de dépense intelligent
    if ((m.includes('ajoute') || m.includes('ajouter')) && m.includes('depense')) {
      const montantMatch = m.match(/([0-9]+(?:[.,][0-9]+)?)/);
      let categorieMatch = m.match(/en ([a-z ]+)/) || m.match(/pour ([a-z ]+)/) || m.match(/dans ([a-z ]+)/);
      
      if (montantMatch && categorieMatch) {
        const montant = parseFloat(montantMatch[1].replace(',', '.'));
        const categorie = categorieMatch[1].trim();
        
        const categoryExists = state.categories.find(cat => 
          normalize(cat.name).includes(normalize(categorie)) || normalize(categorie).includes(normalize(cat.name))
        );
        
        if (categoryExists) {
          const expense = {
            date: new Date().toISOString().split('T')[0],
            category: categoryExists.name,
            amount: montant,
            description: `Dépense ajoutée via assistant IA - ${categorie}`
          };
          
          if (actions.addExpense(expense)) {
            const percentage = ((computedValues.currentMonthExpenses.filter(e => e.category === categoryExists.name).reduce((sum, e) => sum + e.amount, 0) + montant) / categoryExists.budget * 100).toFixed(1);
            return t('expenseAddedSuccess', { amount: formatCurrency(montant), category: categoryExists.name, percentage });
          } else {
            return t('expenseAddError');
          }
        } else {
          return t('categoryNotFound', { category: categorie, categories: state.categories.map(c => c.name).join(', ') });
        }
      } else if (montantMatch) {
        return t('amountSeenButNoCategory', { amount: montantMatch[1] });
      }
    }

    // Création de catégorie
    if (m.includes('cree') && m.includes('categorie')) {
      const nameMatch = m.match(/categorie ([a-z ]+) avec/) || m.match(/categorie ([a-z ]+)/);
      const budgetMatch = m.match(/budget de ([0-9]+(?:[.,][0-9]+)?)/);
      
      if (nameMatch && budgetMatch) {
        const name = nameMatch[1].trim();
        const budget = parseFloat(budgetMatch[1].replace(',', '.'));
        
        const categoryData = { name, budget };
        if (actions.addCategory(categoryData)) {
          return t('categoryCreatedSuccess', { name, budget: formatCurrency(budget) });
        } else {
          return t('categoryExistsError');
        }
      }
    }

    // Analyse financière avancée
    if (m.includes('analyse') || m.includes('bilan') || m.includes('situation')) {
      const savingsRate = computedValues.savingsRate;
      const budgetRatio = (computedValues.totalSpent / computedValues.totalBudget) * 100;
      
      let analysis = `${t('financialAnalysisTitle')}\n\n`;
      analysis += `💰 **${t('income')} :** ${formatCurrency(state.monthlyIncome)}\n`;
      analysis += `💸 **${t('expenses')} :** ${formatCurrency(computedValues.totalSpent)} (${t('budgetPercentage', { percentage: budgetRatio.toFixed(1) })})\n`;
      analysis += `💎 **${t('savings')} :** ${formatCurrency(state.monthlyIncome - computedValues.totalSpent)} (${t('savingsPercentage', { percentage: savingsRate.toFixed(1) })})\n\n`;
      
      if (savingsRate >= 20) {
        analysis += t('excellentSavingsRate', { percentage: savingsRate.toFixed(1) });
      } else if (savingsRate >= 10) {
        analysis += t('goodSavingsRate', { percentage: savingsRate.toFixed(1) });
      } else {
        analysis += t('lowSavingsRate', { percentage: savingsRate.toFixed(1) });
      }
      
      return analysis;
    }

    // Conseils personnalisés
    if (m.includes('conseil') || m.includes('recommandation') || m.includes('aide')) {
      const biggestCategory = computedValues.pieChartData.reduce((a, b) => a.value > b.value ? a : b, { value: 0 });
      
      let advice = `${t('personalizedAdviceTitle')}\n\n`;
      
      if (computedValues.totalSpent > computedValues.totalBudget) {
        advice += t('budgetExceeded', { amount: formatCurrency(computedValues.totalSpent - computedValues.totalBudget) });
      }
      
      if (biggestCategory.name) {
        advice += t('biggestExpense', { category: biggestCategory.name, amount: formatCurrency(biggestCategory.value) });
      }
      
      if (computedValues.savingsRate < 10) {
        advice += t('try503020Rule');
      } else {
        advice += t('continueGoodWork');
      }
      
      return advice;
    }

    // Questions sur les finances
    if (m.includes('budget restant')) {
      const remaining = computedValues.totalBudget - computedValues.totalSpent;
      return t('remainingBudget', { remaining: formatCurrency(remaining), total: formatCurrency(computedValues.totalBudget) });
    }

    if (m.includes('total depenses')) {
      return t('totalExpenses', { amount: formatCurrency(computedValues.totalSpent), percentage: ((computedValues.totalSpent / state.monthlyIncome) * 100).toFixed(1) });
    }

    if (m.includes('epargne')) {
      const currentSavings = state.monthlyIncome - computedValues.totalSpent;
      return `${t('currentSavings', { amount: formatCurrency(currentSavings), percentage: computedValues.savingsRate.toFixed(1) })}\n${t('totalSavingsGoals', { amount: formatCurrency(computedValues.totalSavings) })}`;
    }

    if (m.includes('objectif') && (m.includes('epargne') || m.includes('progression'))) {
      if (state.savingsGoals.length === 0) {
        return t('noSavingsGoals');
      }
      
      let goals = `${t('savingsGoalsTitle')}\n\n`;
      state.savingsGoals.forEach(goal => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        goals += t('goalProgress', { 
          name: goal.name, 
          progress: progress.toFixed(1), 
          current: formatCurrency(goal.currentAmount), 
          target: formatCurrency(goal.targetAmount) 
        }) + '\n';
      });
      
      return goals;
    }

    if (m.includes('dettes')) {
      if (state.debts.length === 0) {
        return t('congratulationsNoDebts');
      }
      
      const totalDebt = computedValues.totalDebt;
      const monthlyPayments = state.debts.reduce((sum, debt) => sum + debt.minPayment, 0);
      
      return `${t('debtSummary')}\n${t('totalDebt', { amount: formatCurrency(totalDebt) })}\n${t('monthlyPayments', { amount: formatCurrency(monthlyPayments) })}\n${t('budgetImpact', { percentage: ((monthlyPayments / state.monthlyIncome) * 100).toFixed(1) })}`;
    }

    // Prédictions
    if (m.includes('prevision') || m.includes('prediction') || m.includes('fin de mois')) {
      const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
      const dailyAverage = computedValues.totalSpent / new Date().getDate();
      const projectedTotal = computedValues.totalSpent + (dailyAverage * daysLeft);
      const projectedSavings = state.monthlyIncome - projectedTotal;
      
      return `${t('endOfMonthPrediction')}\n${t('projectedExpenses', { amount: formatCurrency(projectedTotal) })}\n${t('projectedSavings', { amount: formatCurrency(projectedSavings) })}\n${t('confidence')}\n\n${projectedSavings > 0 ? t('shouldEndGreen') : t('riskExceedingBudget')}`;
    }

    // Réponses par défaut
    if (m.includes('bonjour') || m.includes('salut')) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? t('greetingMorning') : hour < 18 ? t('greetingAfternoon') : t('greetingEvening');
      return t('greetingMessage', { greeting });
    }

    if (m.includes('merci')) {
      return t('thankYou');
    }

    return `${t('dontUnderstand')}\n\n${t('analyzeFinances')}\n${t('giveAdvice')}\n${t('addExpenses')}\n${t('trackGoals')}\n${t('makePredictions')}\n\n${t('typeYourQuestion')}`;
  }, [state, actions, computedValues, formatCurrency, normalize, t]);

  const simulateTyping = useCallback(async (response) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    setIsTyping(false);
    
    const botResponse = { id: Date.now() + 1, from: 'bot', text: response };
    setMessages(prev => [...prev, botResponse]);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now(), from: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    
    const response = getBotResponse(input);
    setInput('');
    
    await simulateTyping(response);
  }, [input, getBotResponse, simulateTyping]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 hover:scale-110"
        aria-label={t('openAIAssistant')}
      >
        <Icons.MessageCircle className="h-7 w-7" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 max-w-[95vw] bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl shadow-2xl z-50 flex flex-col border border-gray-200 dark:border-gray-700 max-h-[80vh]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Icons.Brain className="h-4 w-4" />
          </div>
          <span className="font-semibold">{t('aiAssistant')}</span>
        </div>
        <button 
          onClick={() => setIsOpen(false)} 
          className="text-white/80 hover:text-white transition-colors"
          aria-label={t('closeAssistant')}
        >
          <Icons.X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 max-h-80">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
              msg.from === 'user' 
                ? 'bg-blue-600 text-white ml-auto' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
            }`}>
              {msg.text.split('\n').map((line, index) => (
                <div key={index}>
                  {line.startsWith('**') && line.endsWith('**') ? (
                    <strong>{line.slice(2, -2)}</strong>
                  ) : line.startsWith('•') ? (
                    <div className="ml-2">{line}</div>
                  ) : (
                    line
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form 
        className="flex items-center border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl"
        onSubmit={e => { e.preventDefault(); handleSend(); }}
      >
        <input
          className="flex-1 bg-transparent px-3 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none text-base"
          placeholder={t('askYourQuestion')}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isTyping}
          autoFocus
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!input.trim() || isTyping}
          className="mx-2 bg-blue-600 hover:bg-blue-700"
          aria-label={t('sendMessage')}
        >
          <Icons.Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
});

export default Chatbot; 