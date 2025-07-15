import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import * as Icons from 'lucide-react';
import './App.css';

// Import des utilitaires extraits
import { validators } from './utils/validators';
import { dateUtils } from './utils/dateUtils';
import translations from './i18n/translations';
import useFinanceManager from './features/dashboard/hooks/useFinanceManager';
import LoadingSpinner from './components/ui/LoadingSpinner';
import Input from './components/ui/Input';
import Button from './components/ui/Button';
import Modal from './components/ui/Modal';
import NotificationContainer from './components/ui/NotificationContainer';
import SearchAndFilter from './components/ui/SearchAndFilter';
import Pagination from './components/ui/Pagination';
import DashboardHeader from './components/layout/DashboardHeader';
import Navigation from './components/layout/Navigation';

// Import des écrans
import DashboardScreen from './screens/DashboardScreen';
import BudgetScreen from './screens/BudgetScreen';
import ReportsScreen from './screens/ReportsScreen';
import ExpensesScreen from './screens/ExpensesScreen';
import SavingsScreen from './screens/SavingsScreen';
import CalendarScreen from './screens/CalendarScreen';
import RecurringScreen from './screens/RecurringScreen';
import DebtsScreen from './screens/DebtsScreen';
import RevenueScreen from './screens/RevenueScreen';

// Import des modals
import IncomeModal from './components/modals/IncomeModal';
import CurrencyModal from './components/modals/CurrencyModal';
import CategoryModal from './components/modals/CategoryModal';
import EditExpenseModal from './components/modals/EditExpenseModal';
import EditSavingModal from './components/modals/EditSavingModal';
import PaymentModal from './components/modals/PaymentModal';
import EditDebtModal from './components/modals/EditDebtModal';
import ExportModal from './components/modals/ExportModal';

// Import du chatbot
import Chatbot from './components/Chatbot';

// ============================================================================
// SYSTÈME DE TRADUCTION COMPLET
// ============================================================================



// ============================================================================
// COMPOSANTS UTILITAIRES OPTIMISÉS
// ============================================================================














// ============================================================================
// COMPOSANT HEADER OPTIMISÉ
// ============================================================================



// ============================================================================
// COMPOSANT NAVIGATION OPTIMISÉ
// ============================================================================



// ============================================================================
// COMPOSANTS D'ÉCRAN OPTIMISÉS
// ============================================================================

// Dashboard Screen - Maintenant importé depuis DashboardScreen.js

// Budget Screen - Maintenant importé depuis BudgetScreen.js

// Expenses Screen - Maintenant importé depuis ExpensesScreen.js

// Savings Screen - Maintenant importé depuis SavingsScreen.js

// Calendar Screen - Maintenant importé depuis CalendarScreen.js

// Recurring Screen - Maintenant importé depuis RecurringScreen.js

// Debts Screen - Maintenant importé depuis DebtsScreen.js

// Reports Screen - Maintenant importé depuis ReportsScreen.js



// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const App = () => {
  const financeManager = useFinanceManager();
  const { state, actions } = financeManager;

  // Helper pour les traductions
  const t = useCallback((key, params = {}) => {
    // Logique améliorée pour la sélection de traduction
    let translation;
    if (translations[state.language] && translations[state.language][key]) {
      translation = translations[state.language][key];
    } else if (translations.fr && translations.fr[key]) {
      translation = translations.fr[key];
    } else {
      translation = key; // Fallback sur la clé elle-même
    }
    
    // Gestion des interpolations
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramValue);
      });
    }
    
    return translation;
  }, [state.language]);

  // Passer t à financeManager après sa création
  React.useEffect(() => {
    if (financeManager.setTranslation) {
      financeManager.setTranslation(t);
    }
  }, [t, financeManager]);

  // Gestion du mode sombre
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  // Styles thématiques
  const theme = useMemo(() => ({
    bg: state.darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100',
    card: state.darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-lg',
    text: state.darkMode ? 'text-white' : 'text-gray-900',
    textSecondary: state.darkMode ? 'text-gray-300' : 'text-gray-600',
    border: state.darkMode ? 'border-gray-700' : 'border-gray-200',
    input: state.darkMode ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500' : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500'
  }), [state.darkMode]);

  // Rendu conditionnel des écrans
  const renderScreen = useCallback(() => {
    const screenProps = { financeManager, theme, t };
    
    switch (state.activeTab) {
      case 'dashboard':
        return <DashboardScreen {...screenProps} />;
      case 'budget':
        return <BudgetScreen {...screenProps} />;
      case 'expenses':
        return <ExpensesScreen {...screenProps} />;
      case 'savings':
        return <SavingsScreen {...screenProps} />;
      case 'calendar':
        return <CalendarScreen {...screenProps} />;
      case 'recurring':
        return <RecurringScreen {...screenProps} />;
      case 'debts':
        return <DebtsScreen {...screenProps} />;
      case 'reports':
        return <ReportsScreen {...screenProps} />;
      case 'revenue':
        return <RevenueScreen {...screenProps} />;
      default:
        return <DashboardScreen {...screenProps} />;
    }
  }, [state.activeTab, financeManager, theme, t]);

  return (
    <div className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
      {/* Loading Overlay */}
      {state.loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
            <LoadingSpinner size="lg" />
            <span className={`text-lg ${theme.text}`}>{t('loading')}</span>
          </div>
        </div>
      )}

      {/* Notifications */}
      <NotificationContainer notifications={state.notifications} />

      {/* Navigation Sidebar */}
      <Navigation financeManager={financeManager} t={t} />

      {/* Header */}
      <DashboardHeader financeManager={financeManager} theme={theme} t={t} />

      {/* Main Content */}
      <main className="ml-16 lg:ml-64 pt-20 px-8 lg:px-12 py-8 transition-all duration-500">
        <div className="max-w-7xl mx-auto">
          {renderScreen()}
        </div>
      </main>

      {/* Modals */}
      <IncomeModal financeManager={financeManager} theme={theme} t={t} />
      <CurrencyModal financeManager={financeManager} theme={theme} t={t} />
      <CategoryModal financeManager={financeManager} theme={theme} t={t} />
      <EditExpenseModal financeManager={financeManager} theme={theme} t={t} />
      <EditSavingModal financeManager={financeManager} theme={theme} t={t} />
      <PaymentModal financeManager={financeManager} theme={theme} t={t} />
      <EditDebtModal financeManager={financeManager} theme={theme} t={t} />
      
      {/* Export Modal */}
      <ExportModal financeManager={financeManager} theme={theme} t={t} />

      {/* Chatbot IA */}
      <Chatbot financeManager={financeManager} theme={theme} t={t} />
    </div>
  );
};

export default App;
