import React, { useReducer, useRef, useCallback, useMemo, useState } from 'react';
import { useEffect } from 'react';
import { financeReducer, ACTIONS, initialState } from '../../../store/financeReducer';
import { validators } from '../../../utils/validators';
import { sanitizers } from '../../../utils/sanitizers';
import { dateUtils } from '../../../utils/dateUtils';
import { storage } from '../../../utils/storage';
import { dataUtils } from '../../../utils/dataUtils';

const useFinanceManager = () => {
  const [state, dispatch] = useReducer(financeReducer, initialState);
  const notificationTimeouts = useRef(new Map());
  const [t, setT] = useState((key) => key); // Fonction par défaut qui retourne la clé

  // Fonction pour définir la traduction
  const setTranslation = useCallback((translationFunction) => {
    setT(() => translationFunction);
  }, []);

  // Currencies data
  const currencies = useMemo(() => [
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'USD', symbol: '$', name: 'Dollar US' },
    { code: 'GBP', symbol: '£', name: 'Livre Sterling' },
    { code: 'CHF', symbol: 'CHF', name: 'Franc Suisse' },
    { code: 'CAD', symbol: 'C$', name: 'Dollar Canadien' },
    { code: 'JPY', symbol: '¥', name: 'Yen Japonais' }
  ], []);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = storage.get('financeData');
    if (savedData) {
      dispatch({ type: ACTIONS.LOAD_FROM_STORAGE, payload: savedData });
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    const dataToSave = {
      userName: state.userName,
      selectedCurrency: state.selectedCurrency,
      monthlyIncome: state.monthlyIncome,
      categories: state.categories,
      expenses: state.expenses,
      savingsGoals: state.savingsGoals,
      recurringExpenses: state.recurringExpenses,
      debts: state.debts,
      revenues: state.revenues,
      darkMode: state.darkMode,
      language: state.language,
      showBalances: state.showBalances,
      initialBalance: state.initialBalance
    };
    storage.set('financeData', dataToSave);
  }, [state]);

  // Notification management
  const showNotification = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random(); // ID unique
    const notification = { id, message, type };
    dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: notification });

    setTimeout(() => {
      dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id });
    }, duration);
  }, []);

  // Error management
  const setError = useCallback((field, message) => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: { field, message } });
  }, []);

  const clearError = useCallback((field) => {
    dispatch({ type: ACTIONS.CLEAR_ERROR, payload: field });
  }, []);

  // Validation
  const validateForm = useCallback((formData, rules) => {
    const errors = {};
    let isValid = true;

    Object.entries(rules).forEach(([field, fieldRules]) => {
      const value = formData[field];
      
      for (const rule of fieldRules) {
        if (!rule.validator(value)) {
          errors[field] = rule.message;
          isValid = false;
          break;
        }
      }
    });

    return { isValid, errors };
  }, []);

  // Computed values with memoization
  const computedValues = useMemo(() => {
    const currentMonthExpenses = state.expenses.filter(e => 
      e.date.startsWith(state.selectedMonth)
    );
    
    const totalSpent = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalBudget = state.categories.reduce((sum, cat) => sum + cat.budget, 0);
    
    // Calcul des économies filtrées par mois
    const calculateSavingsForMonth = (monthStr) => {
      return state.savingsGoals.map(goal => {
        // Debug: Afficher toutes les dates des transactions
        console.log('DEBUG Dates des transactions pour', goal.name, ':');
        (goal.transactions || []).forEach(tx => {
          console.log('  Transaction date:', tx.date, 'parsed:', new Date(tx.date));
        });
        
        // Filtrer les transactions par mois
        const monthTransactions = (goal.transactions || []).filter(transaction => {
          const txMonth = transaction.date.slice(0, 7);
          const matches = txMonth === monthStr;
          console.log('DEBUG txMonth:', txMonth, 'monthStr:', monthStr, 'match:', matches, 'pour transaction:', transaction.date);
          return matches;
        });
        
        console.log('DEBUG calculateSavingsForMonth:', {
          goal: goal.name,
          monthStr,
          allTransactions: goal.transactions,
          monthTransactions
        });
        
        // Calculer le montant ajouté ce mois
        const monthAmount = monthTransactions.reduce((sum, transaction) => {
          return transaction.type === 'add' ? sum + transaction.amount : sum - transaction.amount;
        }, 0);
        
        // Calculer le montant cumulé jusqu'à ce mois (inclus)
        const cumulativeTransactions = (goal.transactions || []).filter(transaction => 
          transaction.date <= monthStr + '-31' // Jusqu'à la fin du mois
        );
        
        const cumulativeAmount = cumulativeTransactions.reduce((sum, transaction) => {
          return transaction.type === 'add' ? sum + transaction.amount : sum - transaction.amount;
        }, 0);
        
        return {
          ...goal,
          monthAmount: Math.max(0, monthAmount), // Montant ajouté ce mois
          cumulativeAmount: Math.max(0, cumulativeAmount), // Montant cumulé jusqu'à ce mois
          monthProgress: (monthAmount / goal.targetAmount) * 100, // Progression ce mois
          cumulativeProgress: (cumulativeAmount / goal.targetAmount) * 100 // Progression cumulative
        };
      });
    };
    
    const savingsForSelectedMonth = calculateSavingsForMonth(state.selectedMonth);
    const totalSavings = savingsForSelectedMonth.reduce((sum, goal) => sum + goal.cumulativeAmount, 0);
    const totalSavingsThisMonth = savingsForSelectedMonth.reduce((sum, goal) => sum + goal.monthAmount, 0);
    
    // Calcul des dettes filtrées par mois
    const calculateDebtsForMonth = (monthStr) => {
      return state.debts.map(debt => {
        // Filtrer les paiements par mois
        const monthPayments = (debt.paymentHistory || []).filter(payment => 
          payment.date.startsWith(monthStr)
        );
        
        // Calculer le montant payé ce mois
        const monthAmount = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Calculer le montant cumulé payé jusqu'à ce mois (inclus)
        const cumulativePayments = (debt.paymentHistory || []).filter(payment => 
          payment.date <= monthStr + '-31' // Jusqu'à la fin du mois
        );
        
        const cumulativeAmount = cumulativePayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Calculer le solde restant (solde initial - paiements cumulés)
        const initialBalance = debt.initialBalance || debt.balance + cumulativeAmount;
        const remainingBalance = Math.max(0, initialBalance - cumulativeAmount);
        
        return {
          ...debt,
          monthAmount: monthAmount, // Montant payé ce mois
          cumulativeAmount: cumulativeAmount, // Montant cumulé payé jusqu'à ce mois
          remainingBalance: remainingBalance, // Solde restant
          initialBalance: initialBalance, // Solde initial
          monthProgress: (monthAmount / debt.minPayment) * 100, // Progression vs paiement minimum
          cumulativeProgress: (cumulativeAmount / initialBalance) * 100 // Progression cumulative
        };
      });
    };
    
    const debtsForSelectedMonth = calculateDebtsForMonth(state.selectedMonth);
    const totalDebt = debtsForSelectedMonth.reduce((sum, debt) => sum + debt.remainingBalance, 0);
    const totalDebtPaidThisMonth = debtsForSelectedMonth.reduce((sum, debt) => sum + debt.monthAmount, 0);
    const totalDebtPaidCumulative = debtsForSelectedMonth.reduce((sum, debt) => sum + debt.cumulativeAmount, 0);
    
    const totalRecurring = state.recurringExpenses
      .filter(exp => exp.active)
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calcul du revenu total uniquement à partir des sources renseignées par l'utilisateur
    const totalRevenue = (state.revenues || []).reduce((sum, rev) => sum + rev.amount, 0);

    const savingsRate = totalRevenue > 0 
      ? ((totalRevenue - totalSpent) / totalRevenue) * 100 
      : 0;

    // Données pour graphiques
    const pieChartData = state.categories.map(cat => {
      const catExpenses = currentMonthExpenses.filter(e => e.category === cat.name);
      const total = catExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        name: cat.name,
        value: total,
        color: cat.color
      };
    }).filter(item => item.value > 0);

    // Historique mensuel pour graphiques
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().slice(0, 7);
      const monthExpenses = state.expenses
        .filter(e => e.date.startsWith(monthStr))
        .reduce((sum, e) => sum + e.amount, 0);
      
      // Calculer les économies pour ce mois
      const monthSavings = calculateSavingsForMonth(monthStr);
      const totalMonthSavings = monthSavings.reduce((sum, goal) => sum + goal.cumulativeAmount, 0);
      
      // Utiliser totalRevenue pour le mois courant, sinon 0
      monthlyData.push({
        month: date.toLocaleDateString(state.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' }),
        income: totalRevenue,
        expenses: monthExpenses,
        savings: totalRevenue - monthExpenses,
        cumulativeSavings: totalMonthSavings
      });
    }

    return {
      currentMonthExpenses,
      totalSpent,
      totalBudget,
      totalSavings,
      totalSavingsThisMonth,
      savingsForSelectedMonth,
      totalDebt,
      totalDebtPaidThisMonth,
      totalDebtPaidCumulative,
      debtsForSelectedMonth,
      totalRecurring,
      savingsRate,
      pieChartData,
      monthlyData
    };
  }, [state.expenses, state.selectedMonth, state.categories, state.savingsGoals, 
      state.recurringExpenses, state.debts, state.revenues, state.monthlyIncome, state.language]);

  // Filtered and sorted data
  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = computedValues.currentMonthExpenses;

    // Apply search filter
    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase();
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(term) ||
        expense.category.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (state.categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === state.categoryFilter);
    }

    // Apply date filter
    const now = new Date();
    switch (state.dateFilter) {
      case 'today':
        const today = now.toISOString().split('T')[0];
        filtered = filtered.filter(expense => expense.date === today);
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(expense => new Date(expense.date) >= weekAgo);
        break;
      case 'month':
        filtered = filtered.filter(expense => expense.date.startsWith(state.selectedMonth));
        break;
      default:
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[state.sortBy];
      let bValue = b[state.sortBy];

      if (state.sortBy === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (state.sortBy === 'amount') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (state.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [computedValues.currentMonthExpenses, state.searchTerm, state.categoryFilter, 
      state.dateFilter, state.sortBy, state.sortOrder, state.selectedMonth]);

  // Paginated data
  const paginatedExpenses = useMemo(() => {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    return filteredAndSortedExpenses.slice(startIndex, endIndex);
  }, [filteredAndSortedExpenses, state.currentPage, state.itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedExpenses.length / state.itemsPerPage);

  // Helper functions
  const getCurrentCurrency = useCallback(() => {
    return currencies.find(c => c.code === state.selectedCurrency) || currencies[0];
  }, [currencies, state.selectedCurrency]);

  const formatCurrency = useCallback((amount) => {
    const currency = getCurrentCurrency();
    return dateUtils.formatCurrency(amount, currency.code, state.language === 'fr' ? 'fr-FR' : 'en-US');
  }, [getCurrentCurrency, state.language]);

  // Fonctions de navigation temporelle
  const getMonthNavigation = useCallback(() => {
    const currentDate = new Date(state.selectedMonth + '-01');
    const previousMonth = new Date(currentDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    return {
      current: state.selectedMonth,
      previous: previousMonth.toISOString().slice(0, 7),
      next: nextMonth.toISOString().slice(0, 7),
      isCurrentMonth: state.selectedMonth === new Date().toISOString().slice(0, 7),
      isPastMonth: currentDate < new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      isFutureMonth: currentDate > new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    };
  }, [state.selectedMonth]);

  const getMonthDisplayName = useCallback((monthStr) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString(state.language === 'fr' ? 'fr-FR' : 'en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }, [state.language]);

  // Action creators
  const actions = {
    // UI actions
    setLoading: (loading) => dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),
    setDarkMode: (darkMode) => dispatch({ type: ACTIONS.SET_DARK_MODE, payload: darkMode }),
    setLanguage: (language) => dispatch({ type: ACTIONS.SET_LANGUAGE, payload: language }),
    setShowBalances: (show) => dispatch({ type: ACTIONS.SET_SHOW_BALANCES, payload: show }),
    setActiveTab: (tab) => dispatch({ type: ACTIONS.SET_ACTIVE_TAB, payload: tab }),
    setSelectedMonth: (month) => dispatch({ type: ACTIONS.SET_SELECTED_MONTH, payload: month }),
    setSelectedYear: (year) => dispatch({ type: ACTIONS.SET_SELECTED_YEAR, payload: year }),

    // User actions
    setUserName: (name) => dispatch({ type: ACTIONS.SET_USER_NAME, payload: sanitizers.text(name) }),
    setCurrency: (currency) => dispatch({ type: ACTIONS.SET_CURRENCY, payload: currency }),
    setMonthlyIncome: (income) => dispatch({ type: ACTIONS.SET_MONTHLY_INCOME, payload: sanitizers.currency(income) }),

    // Modal actions
    toggleModal: (modal, isOpen) => dispatch({ type: ACTIONS.TOGGLE_MODAL, payload: { modal, isOpen } }),
    setEditingItem: (item) => dispatch({ type: ACTIONS.SET_EDITING_ITEM, payload: item }),
    setEditingPayment: (payload) => {
      dispatch({ type: ACTIONS.SET_EDITING_PAYMENT, payload });
    },

    // Search and filter actions
    setSearchTerm: (term) => dispatch({ type: ACTIONS.SET_SEARCH_TERM, payload: term }),
    setCategoryFilter: (category) => dispatch({ type: ACTIONS.SET_CATEGORY_FILTER, payload: category }),
    setDateFilter: (filter) => dispatch({ type: ACTIONS.SET_DATE_FILTER, payload: filter }),
    setSort: (sortBy, sortOrder) => dispatch({ type: ACTIONS.SET_SORT, payload: { sortBy, sortOrder } }),
    setPage: (page) => dispatch({ type: ACTIONS.SET_PAGE, payload: page }),

    // Form actions
    updateForm: (form, data) => dispatch({ type: ACTIONS.UPDATE_FORM, payload: { form, data } }),
    resetForm: (form) => dispatch({ type: ACTIONS.RESET_FORM, payload: form }),

    // CRUD actions avec validation
    addExpense: (expenseData) => {
      const rules = {
        amount: [
          { validator: validators.required, message: 'Le montant est requis' },
          { validator: validators.positiveNumber, message: 'Le montant doit être positif' }
        ],
        description: [
          { validator: validators.required, message: 'La description est requise' },
          { validator: validators.minLength(3), message: 'La description doit faire au moins 3 caractères' }
        ],
        category: [
          { validator: validators.required, message: 'La catégorie est requise' }
        ],
        date: [
          { validator: validators.required, message: 'La date est requise' },
          { validator: validators.futureDate, message: 'Les dates futures ne sont pas autorisées' }
        ]
      };

      const { isValid, errors } = validateForm(expenseData, rules);
      
      if (!isValid) {
        Object.entries(errors).forEach(([field, message]) => setError(field, message));
        return false;
      }

      const sanitizedData = {
        date: expenseData.date,
        category: sanitizers.text(expenseData.category),
        amount: sanitizers.currency(expenseData.amount),
        description: sanitizers.text(expenseData.description)
      };

      dispatch({ type: ACTIONS.ADD_EXPENSE, payload: sanitizedData });
      showNotification('Dépense ajoutée avec succès');
      return true;
    },

    updateExpense: (expense) => {
      const rules = {
        amount: [
          { validator: validators.required, message: 'Le montant est requis' },
          { validator: validators.positiveNumber, message: 'Le montant doit être positif' }
        ],
        description: [
          { validator: validators.required, message: 'La description est requise' },
          { validator: validators.minLength(3), message: 'La description doit faire au moins 3 caractères' }
        ]
      };

      const { isValid, errors } = validateForm(expense, rules);
      
      if (!isValid) {
        Object.entries(errors).forEach(([field, message]) => setError(field, message));
        return false;
      }

      const sanitizedData = {
        ...expense,
        amount: sanitizers.currency(expense.amount),
        description: sanitizers.text(expense.description)
      };

      dispatch({ type: ACTIONS.UPDATE_EXPENSE, payload: sanitizedData });
      showNotification('Dépense modifiée avec succès');
      return true;
    },

    deleteExpense: (id) => {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
        dispatch({ type: ACTIONS.DELETE_EXPENSE, payload: id });
        showNotification('Dépense supprimée');
      }
    },

    addCategory: (categoryData) => {
      const rules = {
        name: [
          { validator: validators.required, message: 'Le nom est requis' },
          { validator: validators.minLength(2), message: 'Le nom doit faire au moins 2 caractères' }
        ],
        budget: [
          { validator: validators.required, message: 'Le budget est requis' },
          { validator: validators.positiveNumber, message: 'Le budget doit être positif' }
        ]
      };

      const { isValid, errors } = validateForm(categoryData, rules);
      
      if (!isValid) {
        Object.entries(errors).forEach(([field, message]) => setError(field, message));
        return false;
      }

      // Check if category name already exists
      const nameExists = state.categories.some(cat => 
        cat.name.toLowerCase() === categoryData.name.toLowerCase()
      );
      
      if (nameExists) {
        setError('name', 'Une catégorie avec ce nom existe déjà');
        return false;
      }

      const sanitizedData = {
        name: sanitizers.text(categoryData.name),
        budget: sanitizers.currency(categoryData.budget)
      };

      dispatch({ type: ACTIONS.ADD_CATEGORY, payload: sanitizedData });
      showNotification('Catégorie ajoutée');
      return true;
    },

    deleteCategory: (id) => {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
        dispatch({ type: ACTIONS.DELETE_CATEGORY, payload: id });
        showNotification('Catégorie supprimée');
      }
    },

    addSavingsGoal: (goalData) => {
      const rules = {
        name: [
          { validator: validators.required, message: 'Le nom est requis' },
          { validator: validators.minLength(2), message: 'Le nom doit faire au moins 2 caractères' }
        ],
        targetAmount: [
          { validator: validators.required, message: 'Le montant cible est requis' },
          { validator: validators.positiveNumber, message: 'Le montant cible doit être positif' }
        ]
      };

      const { isValid, errors } = validateForm(goalData, rules);
      
      if (!isValid) {
        Object.entries(errors).forEach(([field, message]) => setError(field, message));
        return false;
      }

      const currentAmount = sanitizers.currency(goalData.currentAmount || 0);
      const targetAmount = sanitizers.currency(goalData.targetAmount);

      if (currentAmount > targetAmount) {
        setError('currentAmount', 'Le montant actuel ne peut pas dépasser le montant cible');
        return false;
      }

      const sanitizedData = {
        name: sanitizers.text(goalData.name),
        targetAmount,
        currentAmount
      };

      dispatch({ type: ACTIONS.ADD_SAVINGS_GOAL, payload: sanitizedData });
      showNotification('Objectif d\'épargne créé');
      return true;
    },

    addSavingsTransaction: (goalId, transactionData) => {
      console.log('addSavingsTransaction called with:', { goalId, transactionData });

      const rules = {
        amount: [
          { validator: validators.required, message: 'Le montant est requis' },
          { validator: validators.positiveNumber, message: 'Le montant doit être positif' }
        ],
        description: [
          { validator: validators.required, message: 'La description est requise' },
          { validator: validators.minLength(3), message: 'La description doit faire au moins 3 caractères' }
        ]
      };

      const { isValid, errors } = validateForm(transactionData, rules);
      console.log('Validation result:', { isValid, errors, transactionData });
      if (!isValid) {
        Object.entries(errors).forEach(([field, message]) => setError(field, message));
        return false;
      }

      const sanitizedData = {
        goalId,
        amount: sanitizers.currency(transactionData.amount),
        description: sanitizers.text(transactionData.description),
        type: transactionData.type || 'add',
        date: transactionData.date || new Date().toISOString().split('T')[0]
      };
      
      console.log('Sanitized data:', sanitizedData);

      dispatch({ type: ACTIONS.ADD_SAVINGS_TRANSACTION, payload: sanitizedData });
      showNotification(`Transaction ${sanitizedData.type === 'add' ? 'ajoutée' : 'retirée'} avec succès`);
      return true;
    },

    updateSavingsGoal: (id, amount) => {
      if (!validators.number(amount)) {
        showNotification('Montant invalide', 'error');
        return false;
      }

      dispatch({ type: ACTIONS.UPDATE_SAVINGS_GOAL, payload: { id, amount: sanitizers.currency(amount) } });
      showNotification('Objectif mis à jour');
      return true;
    },

    deleteSavingsGoal: (id) => {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
        dispatch({ type: ACTIONS.DELETE_SAVINGS_GOAL, payload: id });
        showNotification('Objectif supprimé');
      }
    },

    addRecurringExpense: (recurringData) => {
      const rules = {
        description: [
          { validator: validators.required, message: 'La description est requise' },
          { validator: validators.minLength(2), message: 'La description doit faire au moins 2 caractères' }
        ],
        category: [
          { validator: validators.required, message: 'La catégorie est requise' }
        ],
        amount: [
          { validator: validators.required, message: 'Le montant est requis' },
          { validator: validators.positiveNumber, message: 'Le montant doit être positif' }
        ],
        dayOfMonth: [
          { validator: validators.required, message: 'Le jour du mois est requis' },
          { validator: validators.range(1, 31), message: 'Le jour doit être entre 1 et 31' }
        ]
      };

      const { isValid, errors } = validateForm(recurringData, rules);
      
      if (!isValid) {
        Object.entries(errors).forEach(([field, message]) => setError(field, message));
        return false;
      }

      const sanitizedRecurring = {
        description: sanitizers.text(recurringData.description),
        category: recurringData.category,
        amount: sanitizers.currency(recurringData.amount),
        dayOfMonth: parseInt(recurringData.dayOfMonth)
      };

      // Calculer la prochaine date d'occurrence
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      let targetDate;
      let message;
      
      if (sanitizedRecurring.dayOfMonth >= currentDay) {
        // La date n'est pas encore passée ce mois-ci
        targetDate = new Date(currentYear, currentMonth, sanitizedRecurring.dayOfMonth);
        message = `Dépense récurrente créée et ajoutée pour le ${sanitizedRecurring.dayOfMonth} de ce mois`;
      } else {
        // La date est déjà passée, programmer pour le mois prochain
        targetDate = new Date(currentYear, currentMonth + 1, sanitizedRecurring.dayOfMonth);
        const nextMonth = targetDate.toLocaleDateString('fr-FR', { month: 'long' });
        message = `Dépense récurrente créée et programmée pour le ${sanitizedRecurring.dayOfMonth} ${nextMonth}`;
      }

      // Créer la dépense associée
      const expenseData = {
        date: targetDate.toISOString().split('T')[0],
        category: sanitizedRecurring.category,
        amount: sanitizedRecurring.amount,
        description: `${sanitizedRecurring.description} (récurrente)`
      };

      // Ajouter la récurrence ET la dépense
      dispatch({ 
        type: ACTIONS.ADD_RECURRING_WITH_EXPENSE, 
        payload: { 
          recurringData: sanitizedRecurring, 
          expenseData 
        } 
      });
      
      showNotification(message);
      return true;
    },

    processRecurringExpenses: () => {
      dispatch({ type: ACTIONS.PROCESS_RECURRING_EXPENSES });
    },

    deleteRecurringExpense: (id) => {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense récurrente ?')) {
        dispatch({ type: ACTIONS.DELETE_RECURRING, payload: id });
        showNotification('Dépense récurrente supprimée');
      }
    },

    toggleRecurringExpense: (id) => {
      dispatch({ type: ACTIONS.TOGGLE_RECURRING, payload: id });
      showNotification('Statut mis à jour');
    },

    updateRecurringExpense: (updatedExpense) => {
      const rules = {
        description: [
          { validator: validators.required, message: t('descriptionRequired') },
          { validator: validators.minLength(2), message: t('descriptionMinLength') }
        ],
        category: [
          { validator: validators.required, message: t('categoryRequired') }
        ],
        amount: [
          { validator: validators.required, message: t('amountRequired') },
          { validator: validators.positiveNumber, message: t('amountPositive') }
        ],
        dayOfMonth: [
          { validator: validators.required, message: t('dayOfMonthRequired') },
          { validator: validators.range(1, 31), message: t('dayOfMonthRange') }
        ]
      };

      const sanitizedData = {
        id: updatedExpense.id,
        description: sanitizers.text(updatedExpense.description),
        category: sanitizers.text(updatedExpense.category),
        amount: sanitizers.currency(updatedExpense.amount),
        dayOfMonth: sanitizers.number(updatedExpense.dayOfMonth),
        active: updatedExpense.active,
        lastProcessed: updatedExpense.lastProcessed
      };

      if (!validateForm(sanitizedData, rules)) {
        return false;
      }

      dispatch({ type: ACTIONS.UPDATE_RECURRING, payload: sanitizedData });
      showNotification(t('recurringExpenseUpdated'));
      return true;
    },

    addDebt: (debtData) => {
      const rules = {
        name: [
          { validator: validators.required, message: t('debtNameRequired') },
          { validator: validators.minLength(2), message: t('debtNameRequired') }
        ],
        balance: [
          { validator: validators.required, message: t('balanceRequired') },
          { validator: validators.positiveNumber, message: t('balanceMustBePositive') }
        ],
        minPayment: [
          { validator: validators.required, message: t('minPaymentRequired') },
          { validator: validators.positiveNumber, message: t('minPaymentMustBePositive') }
        ],
        rate: [
          { validator: validators.required, message: t('rateRequired') },
          { validator: validators.range(0, 100), message: t('rateMustBeValid') }
        ]
      };

      const { isValid, errors } = validateForm(debtData, rules);
      
      if (!isValid) {
        Object.entries(errors).forEach(([field, message]) => setError(field, message));
        return false;
      }

      const sanitizedData = {
        name: sanitizers.text(debtData.name),
        balance: sanitizers.currency(debtData.balance),
        minPayment: sanitizers.currency(debtData.minPayment),
        rate: sanitizers.number(debtData.rate)
      };

      dispatch({ type: ACTIONS.ADD_DEBT, payload: sanitizedData });
      showNotification(t('debtAdded'));
      return true;
    },

    updateDebt: (debtId, debtData) => {
      const rules = {
        name: [
          { validator: validators.required, message: t('debtNameRequired') },
          { validator: validators.minLength(2), message: t('debtNameRequired') }
        ],
        balance: [
          { validator: validators.required, message: t('balanceRequired') },
          { validator: validators.positiveNumber, message: t('balanceMustBePositive') }
        ],
        minPayment: [
          { validator: validators.required, message: t('minPaymentRequired') },
          { validator: validators.positiveNumber, message: t('minPaymentMustBePositive') }
        ],
        rate: [
          { validator: validators.required, message: t('rateRequired') },
          { validator: validators.range(0, 100), message: t('rateMustBeValid') }
        ]
      };

      const { isValid, errors } = validateForm(debtData, rules);
      
      if (!isValid) {
        Object.entries(errors).forEach(([field, message]) => setError(field, message));
        return false;
      }

      const sanitizedData = {
        id: debtId,
        name: sanitizers.text(debtData.name),
        balance: sanitizers.currency(debtData.balance),
        minPayment: sanitizers.currency(debtData.minPayment),
        rate: sanitizers.number(debtData.rate)
      };

      dispatch({ type: ACTIONS.UPDATE_DEBT, payload: sanitizedData });
      showNotification(t('debtUpdated'));
      return true;
    },

    deleteDebt: (id) => {
      if (window.confirm(t('confirmDeleteDebt'))) {
        dispatch({ type: ACTIONS.DELETE_DEBT, payload: id });
        showNotification(t('debtDeleted'));
      }
    },

    recordPayment: (debtId, amount) => {
      if (!validators.positiveNumber(amount)) {
        showNotification(t('invalidAmount'), 'error');
        return false;
      }

      const debt = state.debts.find(d => d.id === debtId);
      const paymentAmount = sanitizers.currency(amount);

      if (paymentAmount > debt.balance) {
        showNotification(t('paymentCannotExceedBalance'), 'error');
        return false;
      }

      dispatch({ type: ACTIONS.RECORD_PAYMENT, payload: { debtId, amount: paymentAmount } });
      showNotification(t('paymentRecorded'));
      return true;
    },

    toggleAutoDebit: (debtId) => {
      const debt = state.debts.find(d => d.id === debtId);
      if (!debt) {
        showNotification(t('debtNotFound'), 'error');
        return false;
      }

      dispatch({ type: ACTIONS.TOGGLE_AUTO_DEBIT, payload: debtId });
      
      if (debt.autoDebit) {
        showNotification(t('autoDebitDisabled'));
      } else {
        showNotification(t('autoDebitEnabled'));
      }
      
      return true;
    },

    setPaymentAmount: (value) => {
      dispatch({ type: ACTIONS.SET_PAYMENT_AMOUNT, payload: value });
    },

    // Revenue management actions
    addRevenue: (revenueData) => {
      const rules = {
        name: [
          { validator: validators.required, message: t('sourceNameRequired') },
          { validator: validators.minLength(2), message: t('sourceNameMinLength') }
        ],
        amount: [
          { validator: validators.required, message: t('amountRequired') },
          { validator: validators.positiveNumber, message: t('amountPositive') }
        ],
        type: [
          { validator: validators.required, message: t('revenueTypeRequired') }
        ],
        frequency: [
          { validator: validators.required, message: t('frequencyRequired') }
        ]
      };

      const { isValid, errors } = validateForm(revenueData, rules);
      
      if (!isValid) {
        Object.entries(errors).forEach(([field, message]) => setError(field, message));
        return false;
      }

      const sanitizedData = {
        name: sanitizers.text(revenueData.name),
        amount: sanitizers.currency(revenueData.amount),
        type: revenueData.type, // 'fixed' or 'variable'
        frequency: revenueData.frequency, // 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually', 'irregular'
        description: sanitizers.text(revenueData.description || ''),
        startDate: revenueData.startDate || new Date().toISOString().split('T')[0],
        active: revenueData.active !== false
      };

      dispatch({ type: ACTIONS.ADD_REVENUE, payload: sanitizedData });
      showNotification(t('revenueAdded'));
      return true;
    },

    updateRevenue: (revenueId, revenueData) => {
      const rules = {
        name: [
          { validator: validators.required, message: t('sourceNameRequired') },
          { validator: validators.minLength(2), message: t('sourceNameMinLength') }
        ],
        amount: [
          { validator: validators.required, message: t('amountRequired') },
          { validator: validators.positiveNumber, message: t('amountPositive') }
        ],
        type: [
          { validator: validators.required, message: t('revenueTypeRequired') }
        ],
        frequency: [
          { validator: validators.required, message: t('frequencyRequired') }
        ]
      };

      const { isValid, errors } = validateForm(revenueData, rules);
      
      if (!isValid) {
        Object.entries(errors).forEach(([field, message]) => setError(field, message));
        return false;
      }

      const sanitizedData = {
        id: revenueId,
        name: sanitizers.text(revenueData.name),
        amount: sanitizers.currency(revenueData.amount),
        type: revenueData.type,
        frequency: revenueData.frequency,
        description: sanitizers.text(revenueData.description || ''),
        startDate: revenueData.startDate,
        active: revenueData.active
      };

      dispatch({ type: ACTIONS.UPDATE_REVENUE, payload: sanitizedData });
      showNotification(t('revenueUpdated'));
      return true;
    },

    deleteRevenue: (id) => {
      if (window.confirm(t('confirmDeleteRevenue'))) {
        dispatch({ type: ACTIONS.DELETE_REVENUE, payload: id });
        showNotification(t('revenueDeleted'));
      }
    },

    toggleRevenueActive: (id) => {
      dispatch({ type: ACTIONS.TOGGLE_REVENUE_ACTIVE, payload: id });
      showNotification(t('revenueStatusUpdated'));
    },

    addRevenueTransaction: (revenueId, transactionData) => {
      const rules = {
        amount: [
          { validator: validators.required, message: t('amountRequired') },
          { validator: validators.positiveNumber, message: t('amountPositive') }
        ],
        description: [
          { validator: validators.required, message: t('descriptionRequired') },
          { validator: validators.minLength(3), message: t('descriptionMinLength') }
        ]
      };

      const { isValid, errors } = validateForm(transactionData, rules);
      
      if (!isValid) {
        Object.entries(errors).forEach(([field, message]) => setError(field, message));
        return false;
      }

      const sanitizedData = {
        revenueId,
        amount: sanitizers.currency(transactionData.amount),
        description: sanitizers.text(transactionData.description),
        date: transactionData.date || new Date().toISOString().split('T')[0],
        type: transactionData.type || 'income' // 'income' or 'adjustment'
      };

      dispatch({ type: ACTIONS.ADD_REVENUE_TRANSACTION, payload: sanitizedData });
      showNotification(t('revenueTransactionAdded'));
      return true;
    },

    updateMonthlyIncome: (income) => {
      if (!validators.positiveNumber(income)) {
        showNotification(t('invalidAmount'), 'error');
        return false;
      }

      dispatch({ type: ACTIONS.UPDATE_MONTHLY_INCOME, payload: sanitizers.currency(income) });
      showNotification(t('monthlyIncomeUpdated'));
      return true;
    },

    // Data management
    exportData: () => {
      const exportData = {
        userName: state.userName,
        categories: state.categories,
        expenses: state.expenses,
        savingsGoals: state.savingsGoals,
        recurringExpenses: state.recurringExpenses,
        debts: state.debts,
        monthlyIncome: state.monthlyIncome,
        selectedCurrency: state.selectedCurrency,
        initialBalance: state.initialBalance
      };
      dataUtils.exportToJSON(exportData);
      showNotification('Données exportées avec succès');
    },

    exportExpensesToCSV: () => {
      dataUtils.exportToCSV(state.expenses, 'expenses');
      showNotification('Dépenses exportées en CSV');
    },

    importData: async (file) => {
      try {
        actions.setLoading(true);
        const importedData = await dataUtils.importFromJSON(file);
        
        // Validate imported data structure
        const requiredFields = ['categories', 'expenses'];
        const hasRequiredFields = requiredFields.every(field => importedData[field]);
        
        if (!hasRequiredFields) {
          throw new Error('Structure de données invalide');
        }

        dispatch({ type: ACTIONS.IMPORT_DATA, payload: importedData });
        showNotification('Données importées avec succès');
        return true;
      } catch (error) {
        showNotification(`Erreur d'importation: ${error.message}`, 'error');
        return false;
      } finally {
        actions.setLoading(false);
      }
    },

    resetAllData: () => {
      if (window.confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.')) {
        dispatch({ type: ACTIONS.RESET_DATA, payload: { language: state.language, darkMode: state.darkMode } });
        storage.clear();
        showNotification('Données réinitialisées');
      }
    },
    optimizeBudgets: (optimizedBudgets) => {
      dispatch({ type: ACTIONS.OPTIMIZE_BUDGETS, payload: optimizedBudgets });
      showNotification('Budgets optimisés avec succès');
    },
    updateCategoryBudget: (id, budget) => {
      dispatch({ type: ACTIONS.UPDATE_CATEGORY_BUDGET, payload: { id, budget: sanitizers.currency(budget) } });
      showNotification('Budget de la catégorie mis à jour');
    },
    setInitialBalance: (balance) => {
      // Ne pas afficher la notification ici, juste mettre à jour le state
      dispatch({ type: ACTIONS.SET_INITIAL_BALANCE, payload: sanitizers.currency(balance) });
    },
    confirmInitialBalance: () => {
      showNotification('Solde initial mis à jour');
    }
  };

  // Automatisation des revenus fixes mensuels
  useEffect(() => {
    dispatch({ type: ACTIONS.PROCESS_RECURRING_REVENUES });
  }, [state.selectedMonth]);

  return {
    state,
    actions,
    computedValues,
    filteredAndSortedExpenses,
    paginatedExpenses,
    totalPages,
    getCurrentCurrency,
    formatCurrency,
    showNotification,
    setError,
    clearError,
    currencies,
    setTranslation, // Expose the new function
    getMonthNavigation, // Expose the new function
    getMonthDisplayName // Expose the new function
  };
};

export default useFinanceManager; 