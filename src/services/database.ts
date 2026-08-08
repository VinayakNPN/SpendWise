import * as SQLite from 'expo-sqlite';
const uuidv4 = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const DB_NAME = 'app.db';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export const db = SQLite.openDatabaseSync(DB_NAME);

export const initDatabase = async () => {
  try {
    // Expenses Table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        note TEXT,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending',
        is_deleted INTEGER DEFAULT 0,
        is_recurring INTEGER DEFAULT 0
      );
    `);

    // Incomes Table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS incomes (
        id TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        is_recurring INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        is_deleted INTEGER DEFAULT 0
      );
    `);

    // Categories Table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        monthly_limit REAL DEFAULT 0,
        is_fixed INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        is_deleted INTEGER DEFAULT 0
      );
    `);

    // Seed default categories if empty
    const catCount = db.getFirstSync<{ count: number }>(`SELECT COUNT(*) as count FROM categories`)?.count || 0;
    if (catCount === 0) {
      const defaults = [
        { id: uuidv4(), name: 'Food', icon: 'pizza', color: '#FF7F50', limit: 5000, fixed: 0 },
        { id: uuidv4(), name: 'Rent', icon: 'home', color: '#4682B4', limit: 15000, fixed: 1 },
        { id: uuidv4(), name: 'Transport', icon: 'train', color: '#32CD32', limit: 2000, fixed: 0 },
        { id: uuidv4(), name: 'Health', icon: 'heart', color: '#DC143C', limit: 1000, fixed: 0 },
        { id: uuidv4(), name: 'Shopping', icon: 'shopping-bag', color: '#9370DB', limit: 3000, fixed: 0 },
        { id: uuidv4(), name: 'Entertainment', icon: 'film', color: '#FFD700', limit: 2000, fixed: 0 },
      ];
      defaults.forEach(d => {
        db.runSync(
          `INSERT INTO categories (id, name, icon, color, monthly_limit, is_fixed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          d.id, d.name, d.icon, d.color, d.limit, d.fixed, new Date().toISOString()
        );
      });
    }

    // Budgets Table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        category TEXT,
        monthly_limit REAL,
        created_at TEXT,
        updated_at TEXT
      );
    `);

    // Goals Table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        target_amount REAL NOT NULL,
        timeline_months INTEGER NOT NULL,
        category TEXT,
        priority TEXT,
        saved_amount REAL DEFAULT 0,
        is_debt INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending',
        is_deleted INTEGER DEFAULT 0,
        notes TEXT
      );
    `);

    // Migrate existing tables safely (for users upgrading from older versions)
    try { db.execSync(`ALTER TABLE goals ADD COLUMN is_debt INTEGER DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE goals ADD COLUMN completed INTEGER DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE goals ADD COLUMN notes TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE goals ADD COLUMN sync_status TEXT DEFAULT 'pending';`); } catch (e) {}
    
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN is_recurring INTEGER DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN sync_status TEXT DEFAULT 'pending';`); } catch (e) {}

    try { db.execSync(`ALTER TABLE categories ADD COLUMN color TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE categories ADD COLUMN monthly_limit REAL DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE categories ADD COLUMN is_fixed INTEGER DEFAULT 0;`); } catch (e) {}
    
    try { db.execSync(`ALTER TABLE accounts ADD COLUMN target_months INTEGER;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE accounts ADD COLUMN notes TEXT;`); } catch (e) {}
    
    try { db.execSync(`ALTER TABLE incomes ADD COLUMN is_recurring INTEGER DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE incomes ADD COLUMN notes TEXT;`); } catch (e) {}

    // Accounts Table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL DEFAULT 0,
        target_months INTEGER,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        is_deleted INTEGER DEFAULT 0
      );
    `);

    // Investments Table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS investments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        monthly_amount REAL,
        start_date TEXT,
        tenure_months INTEGER,
        expected_return REAL,
        compounding TEXT,
        step_up_enabled INTEGER DEFAULT 0,
        step_up_rate REAL,
        step_up_frequency INTEGER,
        sip_day INTEGER,
        notes TEXT,
        created_at TEXT,
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending',
        is_deleted INTEGER DEFAULT 0
      );
    `);

    // Indexes
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_expense_date ON expenses(date);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_expense_category ON expenses(category);`);
    db.execSync(`CREATE INDEX IF NOT EXISTS idx_goal_category ON goals(category);`);

    autoLogRecurringExpenses();

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database init error:", error);
    throw error;
  }
};

import { Expense, Goal, Investment, Category, Income, Account } from '../state/types';

export const exportDatabaseToJSON = () => {
  try {
    const expenses = db.getAllSync(`SELECT * FROM expenses`);
    const incomes = db.getAllSync(`SELECT * FROM incomes`);
    const categories = db.getAllSync(`SELECT * FROM categories`);
    const goals = db.getAllSync(`SELECT * FROM goals`);
    const accounts = db.getAllSync(`SELECT * FROM accounts`);
    const investments = db.getAllSync(`SELECT * FROM investments`);
    
    return JSON.stringify({ expenses, incomes, categories, goals, accounts, investments }, null, 2);
  } catch (error) {
    console.error("Export failed", error);
    return null;
  }
};

export const autoLogRecurringExpenses = () => {
  try {
    const fixedCategories = db.getAllSync<any>(`SELECT * FROM categories WHERE is_fixed = 1 AND is_deleted = 0`);
    if (!fixedCategories.length) return;

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // "YYYY-MM"

    fixedCategories.forEach(cat => {
      if (!cat.monthly_limit) return;
      const existing = db.getFirstSync<any>(`SELECT id FROM expenses WHERE category = ? AND is_deleted = 0 AND date LIKE ?`, cat.name, `${currentMonth}%`);
      if (!existing) {
        db.runSync(
          `INSERT INTO expenses (id, name, amount, category, date, created_at, is_recurring) VALUES (?, ?, ?, ?, ?, ?, 1)`,
          uuidv4(), cat.name, cat.monthly_limit, cat.name, now.toISOString(), now.toISOString()
        );
      }
    });
  } catch (error) {
    console.error("Auto-log recurring expenses failed: ", error);
  }
};

// --- EXPENSE FUNCTIONS ---

export const addExpense = (data: Omit<Expense, 'id'>) => {
  if (data.amount <= 0) throw new Error("Amount must be > 0");
  if (!data.category) throw new Error("Category cannot be empty");

  const id = uuidv4();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO expenses (id, name, amount, category, note, date, created_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    id, data.name, data.amount, data.category, data.note || null, data.date, now
  );
  return id;
};

export const getAllExpenses = (): Expense[] => {
  const rows = db.getAllSync<any>(`SELECT * FROM expenses WHERE is_deleted = 0 ORDER BY date DESC`);
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    amount: r.amount,
    category: r.category,
    note: r.note,
    date: r.date
  }));
};

export const getExpensesByMonth = (month: string): Expense[] => {
  const rows = db.getAllSync<any>(
    `SELECT * FROM expenses WHERE is_deleted = 0 AND date LIKE ? ORDER BY date DESC`,
    `${month}%`
  );
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    amount: r.amount,
    category: r.category,
    note: r.note,
    date: r.date
  }));
};

export const updateExpense = (id: string, data: Partial<Expense>) => {
  const allowedKeys = ['name', 'amount', 'category', 'note', 'date'];
  const sets: string[] = [];
  const params: any[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key)) {
      sets.push(`${key} = ?`);
      params.push(value);
    }
  });
  
  if (sets.length === 0) return;
  
  sets.push(`updated_at = ?`, `sync_status = ?`);
  params.push(new Date().toISOString(), 'pending', id);

  db.runSync(`UPDATE expenses SET ${sets.join(', ')} WHERE id = ?`, ...params);
};

export const deleteExpense = (id: string) => {
  db.runSync(`UPDATE expenses SET is_deleted = 1, sync_status = 'pending', updated_at = ? WHERE id = ?`, new Date().toISOString(), id);
};

// --- GOAL FUNCTIONS ---

export const addGoal = (data: Omit<Goal, 'id' | 'createdAt'>) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO goals (id, title, target_amount, timeline_months, category, priority, saved_amount, is_debt, completed, notes, created_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    id, data.title, data.targetAmount, data.timelineMonths, data.category || null, data.priority || null, data.savedAmount || 0, data.isDebt ? 1 : 0, data.completed ? 1 : 0, data.notes || null, now
  );
  return id;
};

export const getGoals = (): Goal[] => {
  const rows = db.getAllSync<any>(`SELECT * FROM goals WHERE is_deleted = 0 ORDER BY created_at DESC`);
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    targetAmount: r.target_amount,
    timelineMonths: r.timeline_months,
    category: r.category,
    priority: r.priority,
    savedAmount: r.saved_amount,
    isDebt: Boolean(r.is_debt),
    completed: Boolean(r.completed),
    createdAt: r.created_at,
    notes: r.notes
  }));
};

export const updateGoal = (id: string, data: Partial<Goal>) => {
  const map: Record<string, string> = {
    title: 'title',
    targetAmount: 'target_amount',
    timelineMonths: 'timeline_months',
    category: 'category',
    priority: 'priority',
    savedAmount: 'saved_amount',
    isDebt: 'is_debt',
    completed: 'completed',
    notes: 'notes'
  };
  
  const sets: string[] = [];
  const params: any[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (map[key]) {
      sets.push(`${map[key]} = ?`);
      if (key === 'isDebt' || key === 'completed') {
        params.push(value ? 1 : 0);
      } else {
        params.push(value);
      }
    }
  });
  
  if (sets.length === 0) return;
  
  sets.push(`updated_at = ?`, `sync_status = ?`);
  params.push(new Date().toISOString(), 'pending', id);

  db.runSync(`UPDATE goals SET ${sets.join(', ')} WHERE id = ?`, ...params);
};

export const deleteGoal = (id: string) => {
  db.runSync(`UPDATE goals SET is_deleted = 1, sync_status = 'pending', updated_at = ? WHERE id = ?`, new Date().toISOString(), id);
};

// --- INVESTMENT FUNCTIONS ---

export const addInvestment = (data: Omit<Investment, 'id'>) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO investments (id, name, type, monthly_amount, start_date, tenure_months, expected_return, compounding, step_up_enabled, step_up_rate, step_up_frequency, sip_day, notes, created_at, sync_status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    id, data.name, data.type, data.monthly_amount, data.startDate, data.tenureMonths, 
    data.expected_annual_return, data.compounding_frequency, data.step_up_enabled ? 1 : 0, 
    data.step_up_rate, data.step_up_frequency, data.sip_day, data.notes || null, now
  );
  return id;
};

export const getInvestments = (): Investment[] => {
  const rows = db.getAllSync<any>(`SELECT * FROM investments WHERE is_deleted = 0 ORDER BY created_at DESC`);
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type,
    monthly_amount: r.monthly_amount,
    startDate: r.start_date,
    tenureMonths: r.tenure_months,
    expected_annual_return: r.expected_return,
    compounding_frequency: r.compounding,
    step_up_enabled: Boolean(r.step_up_enabled),
    step_up_rate: r.step_up_rate,
    step_up_frequency: r.step_up_frequency,
    sip_day: r.sip_day,
    notes: r.notes
  }));
};

export const updateInvestment = (id: string, data: Partial<Investment>) => {
  const map: Record<string, string> = {
    name: 'name',
    type: 'type',
    monthly_amount: 'monthly_amount',
    startDate: 'start_date',
    tenureMonths: 'tenure_months',
    expected_annual_return: 'expected_return',
    compounding_frequency: 'compounding',
    step_up_enabled: 'step_up_enabled',
    step_up_rate: 'step_up_rate',
    step_up_frequency: 'step_up_frequency',
    sip_day: 'sip_day',
    notes: 'notes'
  };

  const sets: string[] = [];
  const params: any[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (map[key]) {
      sets.push(`${map[key]} = ?`);
      if (key === 'step_up_enabled') {
        params.push(value ? 1 : 0);
      } else {
        params.push(value);
      }
    }
  });
  
  if (sets.length === 0) return;
  
  sets.push(`updated_at = ?`, `sync_status = ?`);
  params.push(new Date().toISOString(), 'pending', id);

  db.runSync(`UPDATE investments SET ${sets.join(', ')} WHERE id = ?`, ...params);
};

export const deleteInvestment = (id: string) => {
  db.runSync(`UPDATE investments SET is_deleted = 1, sync_status = 'pending', updated_at = ? WHERE id = ?`, new Date().toISOString(), id);
};

// --- CATEGORY FUNCTIONS ---

export const getCategories = (): Category[] => {
  const rows = db.getAllSync<any>(`SELECT * FROM categories WHERE is_deleted = 0 ORDER BY created_at ASC`);
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    monthly_limit: r.monthly_limit,
    is_fixed: Boolean(r.is_fixed)
  }));
};

export const addCategory = (data: Omit<Category, 'id'>) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO categories (id, name, icon, color, monthly_limit, is_fixed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, data.name, data.icon, data.color, data.monthly_limit, data.is_fixed ? 1 : 0, now
  );
  return id;
};

export const updateCategory = (id: string, data: Partial<Category>) => {
  const map: Record<string, string> = {
    name: 'name',
    icon: 'icon',
    color: 'color',
    monthly_limit: 'monthly_limit',
    is_fixed: 'is_fixed'
  };

  const sets: string[] = [];
  const params: any[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (map[key]) {
      sets.push(`${map[key]} = ?`);
      if (key === 'is_fixed') params.push(value ? 1 : 0);
      else params.push(value);
    }
  });
  
  if (sets.length === 0) return;
  
  sets.push(`updated_at = ?`);
  params.push(new Date().toISOString(), id);

  db.runSync(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`, ...params);
};

export const deleteCategory = (id: string) => {
  db.runSync(`UPDATE categories SET is_deleted = 1, updated_at = ? WHERE id = ?`, new Date().toISOString(), id);
};

// --- INCOME FUNCTIONS ---

export const getIncomes = (): Income[] => {
  const rows = db.getAllSync<any>(`SELECT * FROM incomes WHERE is_deleted = 0 ORDER BY date DESC`);
  return rows.map(r => ({
    id: r.id,
    source: r.source,
    amount: r.amount,
    date: r.date,
    is_recurring: Boolean(r.is_recurring),
    notes: r.notes
  }));
};

export const addIncome = (data: Omit<Income, 'id'>) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO incomes (id, source, amount, date, is_recurring, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, data.source, data.amount, data.date, data.is_recurring ? 1 : 0, data.notes || null, now
  );
  return id;
};

export const updateIncome = (id: string, data: Partial<Income>) => {
  const map: Record<string, string> = {
    source: 'source',
    amount: 'amount',
    date: 'date',
    is_recurring: 'is_recurring',
    notes: 'notes'
  };

  const sets: string[] = [];
  const params: any[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (map[key]) {
      sets.push(`${map[key]} = ?`);
      if (key === 'is_recurring') params.push(value ? 1 : 0);
      else params.push(value);
    }
  });
  
  if (sets.length === 0) return;
  
  sets.push(`updated_at = ?`);
  params.push(new Date().toISOString(), id);

  db.runSync(`UPDATE incomes SET ${sets.join(', ')} WHERE id = ?`, ...params);
};

export const deleteIncome = (id: string) => {
  db.runSync(`UPDATE incomes SET is_deleted = 1, updated_at = ? WHERE id = ?`, new Date().toISOString(), id);
};

// --- ACCOUNT FUNCTIONS ---

export const getAccounts = (): Account[] => {
  const rows = db.getAllSync<any>(`SELECT * FROM accounts WHERE is_deleted = 0 ORDER BY created_at ASC`);
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type,
    balance: r.balance,
    target_months: r.target_months,
    notes: r.notes,
    created_at: r.created_at
  }));
};

export const addAccount = (data: Omit<Account, 'id' | 'created_at'>) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO accounts (id, name, type, balance, target_months, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, data.name, data.type, data.balance || 0, data.target_months || null, data.notes || null, now
  );
  return id;
};

export const updateAccount = (id: string, data: Partial<Account>) => {
  const map: Record<string, string> = {
    name: 'name',
    type: 'type',
    balance: 'balance',
    target_months: 'target_months',
    notes: 'notes'
  };

  const sets: string[] = [];
  const params: any[] = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (map[key]) {
      sets.push(`${map[key]} = ?`);
      params.push(value);
    }
  });
  
  if (sets.length === 0) return;
  
  sets.push(`updated_at = ?`);
  params.push(new Date().toISOString(), id);

  db.runSync(`UPDATE accounts SET ${sets.join(', ')} WHERE id = ?`, ...params);
};

export const deleteAccount = (id: string) => {
  db.runSync(`UPDATE accounts SET is_deleted = 1, updated_at = ? WHERE id = ?`, new Date().toISOString(), id);
};
