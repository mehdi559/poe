// Centralized state management for the finance app

export const initialState = {
  // UI State
  loading: false,
  darkMode: false,
  language: 'fr',
  showBalances: true,
  activeTab: 'dashboard',
  selectedMonth: new Date().toISOString().slice(0, 7),
  selectedYear: new Date().getFullYear(),
  // User Data
  userName: 'Utilisateur',
  selectedCurrency: 'EUR',
  monthlyIncome: 3500,
  // Financial Data
  categories: [
    { id: 1, name: 'housing', budget: 800, color: '#3B82F6' },
    { id: 2, name: 'food', budget: 400, color: '#10B981' },
    { id: 3, name: 'transport', budget: 200, color: '#F59E0B' },
    { id: 4, name: 'leisure', budget: 150, color: '#8B5CF6' },
    { id: 5, name: 'health', budget: 100, color: '#EF4444' },
    { id: 6, name: 'debt', budget: 0, color: '#DC2626' }
  ],
  expenses: [
    { id: 1, date: '2025-01-15', category: 'food', amount: 45, description: 'Courses Carrefour' },
    { id: 2, date: '2025-01-14', category: 'transport', amount: 15, description: 'Métro' },
    { id: 3, date: '2025-01-13', category: 'leisure', amount: 25, description: 'Cinéma' }
  ],
  savingsGoals: [
    { 
      id: 1, 
      name: 'Vacances d\'été', 
      targetAmount: 2000, 
      currentAmount: 800, 
      color: '#3B82F6',
      transactions: [
        { id: 1, date: '2025-01-10', amount: 500, type: 'add', description: 'Virement initial' },
        { id: 2, date: '2025-01-15', amount: 300, type: 'add', description: 'Épargne mensuelle' }
      ]
    },
    { 
      id: 2, 
      name: 'Fonds d\'urgence', 
      targetAmount: 5000, 
      currentAmount: 2500, 
      color: '#10B981',
      transactions: [
        { id: 3, date: '2025-01-01', amount: 2000, type: 'add', description: 'Épargne initiale' },
        { id: 4, date: '2025-01-12', amount: 500, type: 'add', description: 'Bonus travail' }
      ]
    }
  ],
  recurringExpenses: [
    { id: 1, description: 'Netflix', category: 'leisure', amount: 15, dayOfMonth: 15, active: true },
    { id: 2, description: 'Spotify', category: 'leisure', amount: 10, dayOfMonth: 20, active: true }
  ],
  debts: [
    { id: 1, name: 'Prêt étudiant', balance: 15000, minPayment: 300, rate: 4.5, paymentHistory: [], autoDebit: false },
    { id: 2, name: 'Carte de crédit', balance: 3000, minPayment: 150, rate: 18.9, paymentHistory: [], autoDebit: false }
  ],
  // Revenue data
  revenues: [
    { 
      id: 1, 
      name: 'Salaire Principal', 
      amount: 2800, 
      type: 'fixed', 
      frequency: 'monthly', 
      description: 'Salaire mensuel',
      startDate: '2025-01-01',
      active: true,
      transactions: []
    },
    { 
      id: 2, 
      name: 'Freelance', 
      amount: 700, 
      type: 'variable', 
      frequency: 'irregular', 
      description: 'Travaux freelance',
      startDate: '2025-01-01',
      active: true,
      transactions: []
    }
  ],
  // UI State for modals and forms
  modals: {
    income: false,
    currency: false,
    editExpense: false,
    editDebt: false,
    payment: false,
    category: false,
    import: false,
    export: false,
    editSaving: false
  },
  editingItem: null,
  editingPayment: null,
  // Search and filters
  searchTerm: '',
  categoryFilter: 'all',
  dateFilter: 'all',
  sortBy: 'date',
  sortOrder: 'desc',
  // Pagination
  currentPage: 1,
  itemsPerPage: 10,
  // Notifications
  notifications: [],
  // Error handling
  errors: {},
  // Form states
  newExpense: {
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    description: ''
  },
  newCategory: { name: '', budget: '' },
  newGoal: { name: '', targetAmount: '', currentAmount: '' },
  newRecurring: { description: '', category: '', amount: '', dayOfMonth: '' },
  newDebt: { name: '', balance: '', minPayment: '', rate: '', autoDebit: false },
  editDebt: { name: '', balance: '', minPayment: '', rate: '', autoDebit: false },
  paymentAmount: '',
  savingTransaction: { amount: '', description: '', type: 'add', date: new Date().toISOString().split('T')[0] },
  newRevenue: { name: '', amount: '', type: 'fixed', frequency: 'monthly', description: '' }
};

export const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_DARK_MODE: 'SET_DARK_MODE',
  SET_LANGUAGE: 'SET_LANGUAGE',
  SET_SHOW_BALANCES: 'SET_SHOW_BALANCES',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_SELECTED_MONTH: 'SET_SELECTED_MONTH',
  SET_SELECTED_YEAR: 'SET_SELECTED_YEAR',
  SET_USER_NAME: 'SET_USER_NAME',
  SET_CURRENCY: 'SET_CURRENCY',
  SET_MONTHLY_INCOME: 'SET_MONTHLY_INCOME',
  ADD_EXPENSE: 'ADD_EXPENSE',
  UPDATE_EXPENSE: 'UPDATE_EXPENSE',
  DELETE_EXPENSE: 'DELETE_EXPENSE',
  ADD_CATEGORY: 'ADD_CATEGORY',
  DELETE_CATEGORY: 'DELETE_CATEGORY',
  ADD_SAVINGS_GOAL: 'ADD_SAVINGS_GOAL',
  UPDATE_SAVINGS_GOAL: 'UPDATE_SAVINGS_GOAL',
  DELETE_SAVINGS_GOAL: 'DELETE_SAVINGS_GOAL',
  ADD_SAVINGS_TRANSACTION: 'ADD_SAVINGS_TRANSACTION',
  ADD_RECURRING: 'ADD_RECURRING',
  DELETE_RECURRING: 'DELETE_RECURRING',
  TOGGLE_RECURRING: 'TOGGLE_RECURRING',
  UPDATE_RECURRING: 'UPDATE_RECURRING',
  ADD_RECURRING_WITH_EXPENSE: 'ADD_RECURRING_WITH_EXPENSE',
  PROCESS_RECURRING_EXPENSES: 'PROCESS_RECURRING_EXPENSES',
  ADD_DEBT: 'ADD_DEBT',
  UPDATE_DEBT: 'UPDATE_DEBT',
  DELETE_DEBT: 'DELETE_DEBT',
  RECORD_PAYMENT: 'RECORD_PAYMENT',
  TOGGLE_AUTO_DEBIT: 'TOGGLE_AUTO_DEBIT',
  TOGGLE_MODAL: 'TOGGLE_MODAL',
  SET_EDITING_ITEM: 'SET_EDITING_ITEM',
  SET_SEARCH_TERM: 'SET_SEARCH_TERM',
  SET_CATEGORY_FILTER: 'SET_CATEGORY_FILTER',
  SET_DATE_FILTER: 'SET_DATE_FILTER',
  SET_SORT: 'SET_SORT',
  SET_PAGE: 'SET_PAGE',
  UPDATE_FORM: 'UPDATE_FORM',
  RESET_FORM: 'RESET_FORM',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  IMPORT_DATA: 'IMPORT_DATA',
  RESET_DATA: 'RESET_DATA',
  LOAD_FROM_STORAGE: 'LOAD_FROM_STORAGE',
  OPTIMIZE_BUDGETS: 'OPTIMIZE_BUDGETS',
  UPDATE_CATEGORY_BUDGET: 'UPDATE_CATEGORY_BUDGET',
  SET_PAYMENT_AMOUNT: 'SET_PAYMENT_AMOUNT',
  SET_EDITING_PAYMENT: 'SET_EDITING_PAYMENT',
  // Revenue actions
  ADD_REVENUE: 'ADD_REVENUE',
  UPDATE_REVENUE: 'UPDATE_REVENUE',
  DELETE_REVENUE: 'DELETE_REVENUE',
  TOGGLE_REVENUE_ACTIVE: 'TOGGLE_REVENUE_ACTIVE',
  ADD_REVENUE_TRANSACTION: 'ADD_REVENUE_TRANSACTION',
  UPDATE_MONTHLY_INCOME: 'UPDATE_MONTHLY_INCOME',
  // Ajout : Action pour automatiser les revenus fixes
  PROCESS_RECURRING_REVENUES: 'PROCESS_RECURRING_REVENUES',
  SET_INITIAL_BALANCE: 'SET_INITIAL_BALANCE'
};

export const financeReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_DARK_MODE:
      return { ...state, darkMode: action.payload };
    case ACTIONS.SET_LANGUAGE:
      return { ...state, language: action.payload };
    case ACTIONS.SET_SHOW_BALANCES:
      return { ...state, showBalances: action.payload };
    case ACTIONS.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };
    case ACTIONS.SET_SELECTED_MONTH:
      // Mettre à jour le mois sélectionné et la date du formulaire savingTransaction
      const selectedDate = action.payload + '-15'; // Utiliser le 15 du mois sélectionné
      return { 
        ...state, 
        selectedMonth: action.payload,
        savingTransaction: {
          ...state.savingTransaction,
          date: selectedDate
        }
      };
    case ACTIONS.SET_SELECTED_YEAR:
      return { ...state, selectedYear: action.payload };
    case ACTIONS.SET_USER_NAME:
      return { ...state, userName: action.payload };
    case ACTIONS.SET_CURRENCY:
      return { ...state, selectedCurrency: action.payload };
    case ACTIONS.SET_MONTHLY_INCOME:
      return { ...state, monthlyIncome: action.payload };
    case ACTIONS.ADD_EXPENSE:
      return {
        ...state,
        expenses: [...state.expenses, { ...action.payload, id: Date.now() }]
      };
    case ACTIONS.UPDATE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.map(expense =>
          expense.id === action.payload.id ? action.payload : expense
        )
      };
    case ACTIONS.DELETE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.filter(expense => expense.id !== action.payload)
      };
    case ACTIONS.ADD_CATEGORY:
      return {
        ...state,
        categories: [...state.categories, {
          ...action.payload,
          id: Date.now(),
          color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
        }]
      };
    case ACTIONS.DELETE_CATEGORY:
      return {
        ...state,
        categories: state.categories.filter(cat => cat.id !== action.payload),
        expenses: state.expenses.filter(exp => {
          const category = state.categories.find(cat => cat.id === action.payload);
          return exp.category !== category?.name;
        })
      };
    case ACTIONS.ADD_SAVINGS_GOAL:
      return {
        ...state,
        savingsGoals: [...state.savingsGoals, {
          ...action.payload,
          id: Date.now(),
          color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
          transactions: []
        }]
      };
    case ACTIONS.ADD_SAVINGS_TRANSACTION:
      const debugPayload = action.payload;
      console.log('DEBUG transaction ajoutée:', debugPayload);
      return {
        ...state,
        savingsGoals: state.savingsGoals.map(goal =>
          Number(goal.id) === Number(action.payload.goalId)
            ? {
                ...goal,
                currentAmount: action.payload.type === 'add' 
                  ? Math.min(goal.currentAmount + action.payload.amount, goal.targetAmount)
                  : Math.max(0, goal.currentAmount - action.payload.amount),
                transactions: [...(goal.transactions || []), {
                  id: Date.now(),
                  date: action.payload.date,
                  amount: action.payload.amount,
                  type: action.payload.type,
                  description: action.payload.description
                }]
              }
            : goal
        )
      };
    case ACTIONS.UPDATE_SAVINGS_GOAL:
      return {
        ...state,
        savingsGoals: state.savingsGoals.map(goal =>
          goal.id === action.payload.id
            ? { ...goal, currentAmount: Math.max(0, Math.min(goal.currentAmount + action.payload.amount, goal.targetAmount)) }
            : goal
        )
      };
    case ACTIONS.DELETE_SAVINGS_GOAL:
      return {
        ...state,
        savingsGoals: state.savingsGoals.filter(goal => goal.id !== action.payload)
      };
    case ACTIONS.ADD_RECURRING:
      return {
        ...state,
        recurringExpenses: [...state.recurringExpenses, { ...action.payload, id: Date.now(), active: true }]
      };
    case ACTIONS.UPDATE_RECURRING:
      return {
        ...state,
        recurringExpenses: state.recurringExpenses.map(exp =>
          exp.id === action.payload.id ? action.payload : exp
        )
      };
    case ACTIONS.ADD_RECURRING_WITH_EXPENSE:
      const { recurringData, expenseData } = action.payload;
      return {
        ...state,
        recurringExpenses: [...state.recurringExpenses, { 
          ...recurringData, 
          id: Date.now(), 
          active: true,
          lastProcessed: expenseData.date
        }],
        expenses: [...state.expenses, { 
          ...expenseData, 
          id: Date.now() + 1 
        }]
      };
    case ACTIONS.PROCESS_RECURRING_EXPENSES:
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const newExpenses = [];
      
      const updatedRecurring = state.recurringExpenses.map(recurring => {
        if (!recurring.active) return recurring;
        
        const targetDate = new Date(currentYear, currentMonth, recurring.dayOfMonth);
        const lastProcessed = recurring.lastProcessed ? new Date(recurring.lastProcessed) : null;
        
        // Vérifier si on doit traiter cette récurrence
        const shouldProcess = !lastProcessed || 
          (targetDate.getMonth() !== lastProcessed.getMonth() || 
           targetDate.getFullYear() !== lastProcessed.getFullYear());
        
        if (shouldProcess && targetDate <= today) {
          newExpenses.push({
            id: Date.now() + Math.random(),
            date: targetDate.toISOString().split('T')[0],
            category: recurring.category,
            amount: recurring.amount,
            description: `${recurring.description} (récurrente)`,
            linkedDebtId: recurring.linkedDebtId // Préserver le lien avec la dette
          });
          
          return {
            ...recurring,
            lastProcessed: targetDate.toISOString().split('T')[0]
          };
        }
        
        return recurring;
      });
      
      return {
        ...state,
        recurringExpenses: updatedRecurring,
        expenses: [...state.expenses, ...newExpenses]
      };
    case ACTIONS.DELETE_RECURRING:
      return {
        ...state,
        recurringExpenses: state.recurringExpenses.filter(exp => exp.id !== action.payload)
      };
    case ACTIONS.TOGGLE_RECURRING:
      return {
        ...state,
        recurringExpenses: state.recurringExpenses.map(exp =>
          exp.id === action.payload ? { ...exp, active: !exp.active } : exp
        )
      };
    case ACTIONS.ADD_DEBT:
      const newDebt = {
        ...action.payload, 
        id: Date.now(), 
        paymentHistory: [],
        initialBalance: action.payload.balance // Sauvegarder le solde initial
      };
      
      // Si l'auto-débit est activé, créer une dépense récurrente ET une dépense normale immédiate
      if (action.payload.autoDebit) {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const paymentDate = new Date(currentYear, currentMonth, 15);
        
        // Si le 15 du mois est déjà passé, utiliser la date d'aujourd'hui
        const expenseDate = paymentDate <= today ? today : paymentDate;
        
        const recurringExpense = {
          id: Date.now() + 1,
          description: `Paiement automatique - ${newDebt.name}`,
          category: 'debt',
          amount: newDebt.minPayment,
          dayOfMonth: 15, // Paiement le 15 de chaque mois
          active: true,
          linkedDebtId: newDebt.id,
          lastProcessed: expenseDate.toISOString().split('T')[0]
        };
        
        const immediateExpense = {
          id: Date.now() + 2,
          date: expenseDate.toISOString().split('T')[0],
          category: 'debt',
          amount: newDebt.minPayment,
          description: `Paiement automatique - ${newDebt.name} (récurrente)`,
          linkedDebtId: newDebt.id
        };
        
        return {
          ...state,
          debts: [...state.debts, newDebt],
          recurringExpenses: [...state.recurringExpenses, recurringExpense],
          expenses: [...state.expenses, immediateExpense]
        };
      }
      
      // Si pas d'auto-débit, créer seulement la dette
      return {
        ...state,
        debts: [...state.debts, newDebt]
      };
    case ACTIONS.UPDATE_DEBT:
      const updatedDebt = state.debts.find(debt => debt.id === action.payload.id);
      const wasAutoDebitActive = updatedDebt?.autoDebit;
      const isAutoDebitActive = action.payload.autoDebit;
      
      // Si l'auto-débit est activé, créer une dépense récurrente ET une dépense normale immédiate
      if (isAutoDebitActive && !wasAutoDebitActive) {
        const debt = state.debts.find(d => d.id === action.payload.id);
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const paymentDate = new Date(currentYear, currentMonth, 15);
        
        // Si le 15 du mois est déjà passé, utiliser la date d'aujourd'hui
        const expenseDate = paymentDate <= today ? today : paymentDate;
        
        const recurringExpense = {
          id: Date.now(),
          description: `Paiement automatique - ${debt.name}`,
          category: 'debt',
          amount: debt.minPayment,
          dayOfMonth: 15, // Paiement le 15 de chaque mois
          active: true,
          linkedDebtId: debt.id,
          lastProcessed: expenseDate.toISOString().split('T')[0]
        };
        
        const immediateExpense = {
          id: Date.now() + 1,
          date: expenseDate.toISOString().split('T')[0],
          category: 'debt',
          amount: debt.minPayment,
          description: `Paiement automatique - ${debt.name} (récurrente)`,
          linkedDebtId: debt.id
        };
        
        return {
          ...state,
          debts: state.debts.map(debt =>
            debt.id === action.payload.id ? { 
              ...debt, 
              ...action.payload,
              initialBalance: debt.initialBalance || debt.balance // Préserver le solde initial
            } : debt
          ),
          recurringExpenses: [...state.recurringExpenses, recurringExpense],
          expenses: [...state.expenses, immediateExpense]
        };
      }
      
      // Si l'auto-débit est désactivé, supprimer la dépense récurrente ET les dépenses normales liées
      if (!isAutoDebitActive && wasAutoDebitActive) {
        return {
          ...state,
          debts: state.debts.map(debt =>
            debt.id === action.payload.id ? { 
              ...debt, 
              ...action.payload,
              initialBalance: debt.initialBalance || debt.balance // Préserver le solde initial
            } : debt
          ),
          recurringExpenses: state.recurringExpenses.filter(exp => 
            !exp.linkedDebtId || exp.linkedDebtId !== action.payload.id
          ),
          expenses: state.expenses.filter(exp => 
            !exp.linkedDebtId || exp.linkedDebtId !== action.payload.id
          )
        };
      }
      
      // Mise à jour normale sans changement d'auto-débit
      return {
        ...state,
        debts: state.debts.map(debt =>
          debt.id === action.payload.id ? { 
            ...debt, 
            ...action.payload,
            initialBalance: debt.initialBalance || debt.balance // Préserver le solde initial
          } : debt
        )
      };
    case ACTIONS.DELETE_DEBT:
      const debtToDelete = state.debts.find(debt => debt.id === action.payload);
      
      return {
        ...state,
        debts: state.debts.filter(debt => debt.id !== action.payload),
        // Supprimer aussi la dépense récurrente et les dépenses normales liées si elles existent
        recurringExpenses: state.recurringExpenses.filter(exp => 
          !exp.linkedDebtId || exp.linkedDebtId !== action.payload
        ),
        expenses: state.expenses.filter(exp => 
          !exp.linkedDebtId || exp.linkedDebtId !== action.payload
        )
      };
    case ACTIONS.TOGGLE_AUTO_DEBIT:
      const debt = state.debts.find(d => d.id === action.payload);
      const newAutoDebitState = !debt.autoDebit;
      
      if (newAutoDebitState) {
        // Activer l'auto-débit - créer une dépense récurrente ET une dépense normale immédiate
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const paymentDate = new Date(currentYear, currentMonth, 15);
        
        // Si le 15 du mois est déjà passé, utiliser la date d'aujourd'hui
        const expenseDate = paymentDate <= today ? today : paymentDate;
        
        const recurringExpense = {
          id: Date.now(),
          description: `Paiement automatique - ${debt.name}`,
          category: 'debt',
          amount: debt.minPayment,
          dayOfMonth: 15, // Paiement le 15 de chaque mois
          active: true,
          linkedDebtId: debt.id,
          lastProcessed: expenseDate.toISOString().split('T')[0]
        };
        
        const immediateExpense = {
          id: Date.now() + 1,
          date: expenseDate.toISOString().split('T')[0],
          category: 'debt',
          amount: debt.minPayment,
          description: `Paiement automatique - ${debt.name} (récurrente)`,
          linkedDebtId: debt.id
        };
        
        return {
          ...state,
          debts: state.debts.map(d =>
            d.id === action.payload ? { ...d, autoDebit: true } : d
          ),
          recurringExpenses: [...state.recurringExpenses, recurringExpense],
          expenses: [...state.expenses, immediateExpense]
        };
      } else {
        // Désactiver l'auto-débit - supprimer la dépense récurrente ET les dépenses normales liées
        return {
          ...state,
          debts: state.debts.map(d =>
            d.id === action.payload ? { ...d, autoDebit: false } : d
          ),
          recurringExpenses: state.recurringExpenses.filter(exp => 
            !exp.linkedDebtId || exp.linkedDebtId !== action.payload
          ),
          expenses: state.expenses.filter(exp => 
            !exp.linkedDebtId || exp.linkedDebtId !== action.payload
          )
        };
      }
    case ACTIONS.RECORD_PAYMENT:
      return {
        ...state,
        debts: state.debts.map(debt =>
          debt.id === action.payload.debtId
            ? {
                ...debt,
                balance: Math.max(0, debt.balance - action.payload.amount),
                paymentHistory: [...(debt.paymentHistory || []), {
                  id: Date.now(),
                  date: new Date().toISOString().split('T')[0],
                  amount: action.payload.amount,
                  description: action.payload.description || 'Paiement'
                }]
              }
            : debt
        )
      };
    case ACTIONS.TOGGLE_MODAL:
      return {
        ...state,
        modals: { ...state.modals, [action.payload.modal]: action.payload.isOpen }
      };
    case ACTIONS.SET_EDITING_ITEM:
      return { ...state, editingItem: action.payload };
    case ACTIONS.SET_SEARCH_TERM:
      return { ...state, searchTerm: action.payload, currentPage: 1 };
    case ACTIONS.SET_CATEGORY_FILTER:
      return { ...state, categoryFilter: action.payload, currentPage: 1 };
    case ACTIONS.SET_DATE_FILTER:
      return { ...state, dateFilter: action.payload, currentPage: 1 };
    case ACTIONS.SET_SORT:
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: state.sortBy === action.payload.sortBy
          ? state.sortOrder === 'asc' ? 'desc' : 'asc'
          : action.payload.sortOrder || 'desc'
      };
    case ACTIONS.SET_PAGE:
      return { ...state, currentPage: action.payload };
    case ACTIONS.UPDATE_FORM:
      return {
        ...state,
        [action.payload.form]: { ...state[action.payload.form], ...action.payload.data }
      };
    case ACTIONS.RESET_FORM:
      // Pour savingTransaction, préserver la date du mois sélectionné
      if (action.payload === 'savingTransaction') {
        const selectedDate = state.selectedMonth + '-15';
        return {
          ...state,
          [action.payload]: {
            ...initialState[action.payload],
            date: selectedDate
          }
        };
      }
      return {
        ...state,
        [action.payload]: initialState[action.payload]
      };
    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, { ...action.payload, id: action.payload.id || Date.now() }]
      };
    case ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(notif => notif.id !== action.payload)
      };
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        errors: { ...state.errors, [action.payload.field]: action.payload.message }
      };
    case ACTIONS.CLEAR_ERROR:
      const newErrors = { ...state.errors };
      delete newErrors[action.payload];
      return { ...state, errors: newErrors };
    case ACTIONS.IMPORT_DATA:
      return { ...state, ...action.payload };
    case ACTIONS.LOAD_FROM_STORAGE:
      return { ...state, ...action.payload };
    case ACTIONS.RESET_DATA:
      return { ...initialState, ...action.payload };
    case ACTIONS.OPTIMIZE_BUDGETS:
      return {
        ...state,
        categories: state.categories.map(cat => ({
          ...cat,
          budget: action.payload[cat.name] !== undefined ? action.payload[cat.name] : cat.budget
        }))
      };
    case ACTIONS.UPDATE_CATEGORY_BUDGET:
      return {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.id ? { ...cat, budget: action.payload.budget } : cat
        )
      };
    case ACTIONS.SET_PAYMENT_AMOUNT:
      return { ...state, paymentAmount: action.payload };
    case ACTIONS.SET_EDITING_PAYMENT:
      return { ...state, editingPayment: action.payload };
    // Revenue cases
    case ACTIONS.ADD_REVENUE:
      return {
        ...state,
        revenues: [...state.revenues, { ...action.payload, id: Date.now() }]
      };
    case ACTIONS.UPDATE_REVENUE:
      return {
        ...state,
        revenues: state.revenues.map(revenue =>
          revenue.id === action.payload.id ? action.payload : revenue
        )
      };
    case ACTIONS.DELETE_REVENUE:
      return {
        ...state,
        revenues: state.revenues.filter(revenue => revenue.id !== action.payload)
      };
    case ACTIONS.TOGGLE_REVENUE_ACTIVE:
      return {
        ...state,
        revenues: state.revenues.map(revenue =>
          revenue.id === action.payload ? { ...revenue, active: !revenue.active } : revenue
        )
      };
    case ACTIONS.ADD_REVENUE_TRANSACTION:
      return {
        ...state,
        revenues: state.revenues.map(revenue =>
          revenue.id === action.payload.revenueId
            ? {
                ...revenue,
                transactions: [...(revenue.transactions || []), {
                  id: Date.now(),
                  date: action.payload.date,
                  amount: action.payload.amount,
                  description: action.payload.description,
                  type: action.payload.type
                }]
              }
            : revenue
        )
      };
    case ACTIONS.UPDATE_MONTHLY_INCOME:
      return { ...state, monthlyIncome: action.payload };
    // Ajout : Traitement automatique des revenus fixes mensuels
    case ACTIONS.PROCESS_RECURRING_REVENUES: {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const newRevenues = [];
      const updatedRevenues = state.revenues.map(revenue => {
        if (!revenue.active || revenue.type !== 'fixed' || revenue.frequency !== 'monthly') return revenue;
        // Déterminer le jour d'entrée d'argent
        let dayOfMonth = 1;
        if (revenue.dayOfMonth) {
          dayOfMonth = parseInt(revenue.dayOfMonth);
        } else if (revenue.startDate) {
          dayOfMonth = new Date(revenue.startDate).getDate();
        }
        const targetDate = new Date(currentYear, currentMonth, dayOfMonth);
        const lastProcessed = revenue.lastProcessed ? new Date(revenue.lastProcessed) : null;
        // Vérifier si on doit traiter ce revenu ce mois-ci
        const shouldProcess = !lastProcessed ||
          (targetDate.getMonth() !== lastProcessed.getMonth() ||
           targetDate.getFullYear() !== lastProcessed.getFullYear());
        if (shouldProcess && targetDate <= today) {
          newRevenues.push({
            id: Date.now() + Math.random(),
            date: targetDate.toISOString().split('T')[0],
            amount: revenue.amount,
            description: `${revenue.name} (fixe mensuel)`
          });
          return {
            ...revenue,
            lastProcessed: targetDate.toISOString().split('T')[0],
            transactions: [
              ...(revenue.transactions || []),
              {
                id: Date.now() + Math.random(),
                date: targetDate.toISOString().split('T')[0],
                amount: revenue.amount,
                description: `${revenue.name} (fixe mensuel)`
              }
            ]
          };
        }
        return revenue;
      });
      return {
        ...state,
        revenues: updatedRevenues,
        // Pas d'ajout direct à expenses, mais les transactions sont ajoutées au revenu
      };
    }
    case ACTIONS.SET_INITIAL_BALANCE:
      return { ...state, initialBalance: action.payload };
    default:
      return state;
  }
}; 