const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let mainWindow;
let db;

// Initialiser la base de données
function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'mywallet.db');
  db = new sqlite3.Database(dbPath);
  
  // Créer les tables si elles n'existent pas
  db.serialize(() => {
    // Table des utilisateurs
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      currency TEXT DEFAULT 'EUR',
      monthly_income REAL DEFAULT 0,
      initial_balance REAL DEFAULT 0,
      dark_mode BOOLEAN DEFAULT 0,
      language TEXT DEFAULT 'fr'
    )`);

    // Table des catégories
    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      budget REAL DEFAULT 0,
      color TEXT DEFAULT '#3B82F6'
    )`);

    // Table des dépenses
    db.run(`CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      category TEXT,
      amount REAL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Table des revenus
    db.run(`CREATE TABLE IF NOT EXISTS revenues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      amount REAL,
      type TEXT,
      frequency TEXT,
      day_of_month INTEGER,
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Table des objectifs d'épargne
    db.run(`CREATE TABLE IF NOT EXISTS savings_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      target_amount REAL,
      current_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Table des transactions d'épargne
    db.run(`CREATE TABLE IF NOT EXISTS savings_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER,
      amount REAL,
      type TEXT,
      description TEXT,
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (goal_id) REFERENCES savings_goals (id)
    )`);

    // Table des dettes
    db.run(`CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      initial_balance REAL,
      balance REAL,
      rate REAL,
      min_payment REAL,
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Table des paiements de dettes
    db.run(`CREATE TABLE IF NOT EXISTS debt_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      debt_id INTEGER,
      amount REAL,
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (debt_id) REFERENCES debts (id)
    )`);

    // Insérer un utilisateur par défaut si aucun n'existe
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (row.count === 0) {
        db.run("INSERT INTO users (name, currency, monthly_income, initial_balance) VALUES (?, ?, ?, ?)", 
          ['Utilisateur', 'EUR', 0, 0]);
      }
    });
  });
}

// Créer la fenêtre principale
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Charger l'application React
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../build/index.html')}`;
  mainWindow.loadURL(startUrl);

  // Afficher la fenêtre quand elle est prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Gérer la fermeture de la fenêtre
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Ouvrir les outils de développement en mode développement
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// Gestionnaires IPC pour la communication avec React
ipcMain.handle('db-get-user', async () => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users LIMIT 1", (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
});

ipcMain.handle('db-update-user', async (event, userData) => {
  return new Promise((resolve, reject) => {
    db.run("UPDATE users SET name = ?, currency = ?, monthly_income = ?, initial_balance = ?, dark_mode = ?, language = ? WHERE id = 1",
      [userData.name, userData.currency, userData.monthly_income, userData.initial_balance, userData.dark_mode, userData.language],
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
  });
});

ipcMain.handle('db-get-expenses', async (event, month) => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM expenses WHERE date LIKE ? ORDER BY date DESC", [`${month}%`], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('db-add-expense', async (event, expense) => {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO expenses (date, category, amount, description) VALUES (?, ?, ?, ?)",
      [expense.date, expense.category, expense.amount, expense.description],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
  });
});

ipcMain.handle('db-get-categories', async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM categories ORDER BY name", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('db-add-category', async (event, category) => {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO categories (name, budget, color) VALUES (?, ?, ?)",
      [category.name, category.budget, category.color],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
  });
});

// Événements de l'application
app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (db) {
    db.close();
  }
}); 