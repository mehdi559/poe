const { contextBridge, ipcRenderer } = require('electron');

// Exposer les APIs de base de données de manière sécurisée
contextBridge.exposeInMainWorld('electronAPI', {
  // Gestion des utilisateurs
  getUser: () => ipcRenderer.invoke('db-get-user'),
  updateUser: (userData) => ipcRenderer.invoke('db-update-user', userData),
  
  // Gestion des dépenses
  getExpenses: (month) => ipcRenderer.invoke('db-get-expenses', month),
  addExpense: (expense) => ipcRenderer.invoke('db-add-expense', expense),
  
  // Gestion des catégories
  getCategories: () => ipcRenderer.invoke('db-get-categories'),
  addCategory: (category) => ipcRenderer.invoke('db-add-category', category),
  
  // Informations sur l'environnement
  isElectron: true,
  platform: process.platform
}); 