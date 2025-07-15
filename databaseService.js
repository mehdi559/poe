// Service pour gérer la base de données SQLite via Electron
class DatabaseService {
  constructor() {
    this.isElectron = window.electronAPI && window.electronAPI.isElectron;
  }

  // Vérifier si on est dans Electron
  isElectronApp() {
    return this.isElectron;
  }

  // Gestion des utilisateurs
  async getUser() {
    if (this.isElectron) {
      return await window.electronAPI.getUser();
    } else {
      // Fallback pour le navigateur (localStorage)
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : {
        name: 'Utilisateur',
        currency: 'EUR',
        monthly_income: 0,
        initial_balance: 0,
        dark_mode: false,
        language: 'fr'
      };
    }
  }

  async updateUser(userData) {
    if (this.isElectron) {
      return await window.electronAPI.updateUser(userData);
    } else {
      // Fallback pour le navigateur
      localStorage.setItem('userData', JSON.stringify(userData));
      return { changes: 1 };
    }
  }

  // Gestion des dépenses
  async getExpenses(month) {
    if (this.isElectron) {
      return await window.electronAPI.getExpenses(month);
    } else {
      // Fallback pour le navigateur
      const expenses = localStorage.getItem('expenses');
      const allExpenses = expenses ? JSON.parse(expenses) : [];
      return allExpenses.filter(expense => expense.date.startsWith(month));
    }
  }

  async addExpense(expense) {
    if (this.isElectron) {
      return await window.electronAPI.addExpense(expense);
    } else {
      // Fallback pour le navigateur
      const expenses = localStorage.getItem('expenses');
      const allExpenses = expenses ? JSON.parse(expenses) : [];
      const newExpense = {
        id: Date.now(),
        ...expense,
        created_at: new Date().toISOString()
      };
      allExpenses.push(newExpense);
      localStorage.setItem('expenses', JSON.stringify(allExpenses));
      return { id: newExpense.id };
    }
  }

  // Gestion des catégories
  async getCategories() {
    if (this.isElectron) {
      return await window.electronAPI.getCategories();
    } else {
      // Fallback pour le navigateur
      const categories = localStorage.getItem('categories');
      return categories ? JSON.parse(categories) : [];
    }
  }

  async addCategory(category) {
    if (this.isElectron) {
      return await window.electronAPI.addCategory(category);
    } else {
      // Fallback pour le navigateur
      const categories = localStorage.getItem('categories');
      const allCategories = categories ? JSON.parse(categories) : [];
      const newCategory = {
        id: Date.now(),
        ...category
      };
      allCategories.push(newCategory);
      localStorage.setItem('categories', JSON.stringify(allCategories));
      return { id: newCategory.id };
    }
  }

  // Migration des données depuis localStorage vers SQLite
  async migrateFromLocalStorage() {
    if (!this.isElectron) return;

    try {
      // Migrer les dépenses
      const expenses = localStorage.getItem('expenses');
      if (expenses) {
        const parsedExpenses = JSON.parse(expenses);
        for (const expense of parsedExpenses) {
          await this.addExpense(expense);
        }
        localStorage.removeItem('expenses');
      }

      // Migrer les catégories
      const categories = localStorage.getItem('categories');
      if (categories) {
        const parsedCategories = JSON.parse(categories);
        for (const category of parsedCategories) {
          await this.addCategory(category);
        }
        localStorage.removeItem('categories');
      }

      // Migrer les données utilisateur
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        await this.updateUser(parsedUserData);
        localStorage.removeItem('userData');
      }

      console.log('Migration des données terminée');
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
    }
  }
}

export default new DatabaseService(); 