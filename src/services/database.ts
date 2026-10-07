import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
const uuidv4 = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const DB_NAME = 'app.db';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export const db = SQLite.openDatabaseSync(DB_NAME);

export const initDatabase = async () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS schema_versions (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);
    const appliedVersions = db.getAllSync<{version: number}>(`SELECT version FROM schema_versions`).map((r: any) => r.version);

    // Ensure all base columns exist (safe to run on every init)
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN is_recurring INTEGER DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN sync_status TEXT DEFAULT 'pending';`); } catch (e) {}
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN is_deleted INTEGER DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN updated_at TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN account_id TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN type TEXT DEFAULT 'EXPENSE';`); } catch (e) {}
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN from_account_id TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN to_account_id TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN status TEXT DEFAULT 'CONFIRMED';`); } catch (e) {}
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN source TEXT DEFAULT 'MANUAL';`); } catch (e) {}
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN fingerprint TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN merchant_name TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN reference_number TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN occasion TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE expenses ADD COLUMN confidence REAL;`); } catch (e) {}

    try { db.execSync(`ALTER TABLE incomes ADD COLUMN is_recurring INTEGER DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE incomes ADD COLUMN notes TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE incomes ADD COLUMN is_deleted INTEGER DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE incomes ADD COLUMN updated_at TEXT;`); } catch (e) {}

    try { db.execSync(`ALTER TABLE categories ADD COLUMN color TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE categories ADD COLUMN monthly_limit REAL DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE categories ADD COLUMN is_fixed INTEGER DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE categories ADD COLUMN is_deleted INTEGER DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE categories ADD COLUMN updated_at TEXT;`); } catch (e) {}

    try { db.execSync(`ALTER TABLE budgets ADD COLUMN updated_at TEXT;`); } catch (e) {}

    try { db.execSync(`ALTER TABLE goals ADD COLUMN is_debt INTEGER DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE goals ADD COLUMN completed INTEGER DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE goals ADD COLUMN notes TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE goals ADD COLUMN sync_status TEXT DEFAULT 'pending';`); } catch (e) {}
    try { db.execSync(`ALTER TABLE goals ADD COLUMN is_deleted INTEGER DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE goals ADD COLUMN updated_at TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE goals ADD COLUMN account_id TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE goals ADD COLUMN monthly_contribution REAL;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE goals ADD COLUMN expected_completion_date TEXT;`); } catch (e) {}

    try { db.execSync(`ALTER TABLE accounts ADD COLUMN target_months INTEGER;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE accounts ADD COLUMN notes TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE accounts ADD COLUMN is_deleted INTEGER DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE accounts ADD COLUMN updated_at TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE accounts ADD COLUMN opening_balance REAL DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE accounts ADD COLUMN actual_balance REAL;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE accounts ADD COLUMN last_reconciled_date TEXT;`); } catch (e) {}

    try { db.execSync(`ALTER TABLE investments ADD COLUMN is_deleted INTEGER DEFAULT 0;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE investments ADD COLUMN updated_at TEXT;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE investments ADD COLUMN current_value REAL;`); } catch (e) {}
    try { db.execSync(`ALTER TABLE investments ADD COLUMN invested_amount REAL;`); } catch (e) {}

    if (!appliedVersions.includes(1)) {
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
        is_recurring INTEGER DEFAULT 0,
        account_id TEXT
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
        { id: uuidv4(), name: 'Family', icon: 'heart-outline', color: '#E91E63', limit: 2000, fixed: 0 },
        { id: uuidv4(), name: 'Bills', icon: 'lightning-bolt', color: '#FF9800', limit: 3000, fixed: 1 },
        { id: uuidv4(), name: 'Housing', icon: 'home-outline', color: '#607D8B', limit: 0, fixed: 1 },
        { id: uuidv4(), name: 'Education', icon: 'school', color: '#3F51B5', limit: 1000, fixed: 0 },
        { id: uuidv4(), name: 'Travel', icon: 'airplane', color: '#00BCD4', limit: 2000, fixed: 0 },
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



    // Accounts Table
    db.execSync(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL DEFAULT 0,
        opening_balance REAL DEFAULT 0,
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
    db.runSync(`INSERT INTO schema_versions (version, applied_at) VALUES (?, ?)`, 1, new Date().toISOString());
    } // End of migration 1

    if (!appliedVersions.includes(2)) {

      db.runSync(`INSERT INTO schema_versions (version, applied_at) VALUES (?, ?)`, 2, new Date().toISOString());
    }

    if (!appliedVersions.includes(3)) {

      try { db.execSync(`UPDATE accounts SET opening_balance = balance;`); } catch (e) {}
      db.runSync(`INSERT INTO schema_versions (version, applied_at) VALUES (?, ?)`, 3, new Date().toISOString());
    }

    // Migration 4: New tables + expanded columns for product features
    if (!appliedVersions.includes(4)) {
      // --- Recurring Payments ---
      db.execSync(`
        CREATE TABLE IF NOT EXISTS recurring_payments (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          category TEXT,
          account_id TEXT,
          frequency TEXT NOT NULL DEFAULT 'MONTHLY',
          next_due TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'UPCOMING',
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          is_deleted INTEGER DEFAULT 0
        );
      `);

      // --- Debt Tracking ---
      db.execSync(`
        CREATE TABLE IF NOT EXISTS debt (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          principal REAL NOT NULL,
          outstanding REAL NOT NULL,
          interest_rate REAL DEFAULT 0,
          min_payment REAL DEFAULT 0,
          frequency TEXT NOT NULL DEFAULT 'MONTHLY',
          due_day INTEGER DEFAULT 1,
          next_payment_date TEXT,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT,
          is_deleted INTEGER DEFAULT 0
        );
      `);

      // --- Merchant Mappings (local intelligence) ---
      db.execSync(`
        CREATE TABLE IF NOT EXISTS merchant_mappings (
          id TEXT PRIMARY KEY,
          merchant_name TEXT NOT NULL,
          category TEXT,
          account_id TEXT,
          usage_count INTEGER DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT
        );
      `);
      db.execSync(`CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_name ON merchant_mappings(merchant_name);`);

      // --- PF Contributions ---
      db.execSync(`
        CREATE TABLE IF NOT EXISTS pf_contributions (
          id TEXT PRIMARY KEY,
          month TEXT NOT NULL,
          employee_amount REAL DEFAULT 0,
          employer_amount REAL DEFAULT 0,
          total REAL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT
        );
      `);
      db.execSync(`CREATE UNIQUE INDEX IF NOT EXISTS idx_pf_month ON pf_contributions(month);`);

      // --- Goal Contribution History ---
      db.execSync(`
        CREATE TABLE IF NOT EXISTS goal_contributions (
          id TEXT PRIMARY KEY,
          goal_id TEXT NOT NULL,
          amount REAL NOT NULL,
          date TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL
        );
      `);
      db.execSync(`CREATE INDEX IF NOT EXISTS idx_goal_contrib_goal ON goal_contributions(goal_id);`);

      // --- Debt Payment History ---
      db.execSync(`
        CREATE TABLE IF NOT EXISTS debt_payments (
          id TEXT PRIMARY KEY,
          debt_id TEXT NOT NULL,
          amount REAL NOT NULL,
          date TEXT NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL
        );
      `);
      db.execSync(`CREATE INDEX IF NOT EXISTS idx_debt_payment_debt ON debt_payments(debt_id);`);

      // --- Expand expenses with merchant/occasion/reference ---


      // --- Additional indexes for performance ---
      db.execSync(`CREATE INDEX IF NOT EXISTS idx_expense_account ON expenses(account_id);`);
      db.execSync(`CREATE INDEX IF NOT EXISTS idx_expense_status ON expenses(status);`);
      db.execSync(`CREATE INDEX IF NOT EXISTS idx_expense_fingerprint ON expenses(fingerprint);`);
      db.execSync(`CREATE INDEX IF NOT EXISTS idx_expense_merchant ON expenses(merchant_name);`);
      db.execSync(`CREATE INDEX IF NOT EXISTS idx_expense_type ON expenses(type);`);
      db.execSync(`CREATE INDEX IF NOT EXISTS idx_recurring_status ON recurring_payments(status);`);
      db.execSync(`CREATE INDEX IF NOT EXISTS idx_recurring_due ON recurring_payments(next_due);`);
      db.execSync(`CREATE INDEX IF NOT EXISTS idx_debt_due ON debt(next_payment_date);`);

      db.runSync(`INSERT INTO schema_versions (version, applied_at) VALUES (?, ?)`, 4, new Date().toISOString());
    } // End of migration 4

    if (!appliedVersions.includes(5)) {


      db.runSync(`INSERT INTO schema_versions (version, applied_at) VALUES (?, ?)`, 5, new Date().toISOString());
    }

    // Migration 6: Payment Queue for shared receipts
    if (!appliedVersions.includes(6)) {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS payment_queue (
          id TEXT PRIMARY KEY,
          image_uri TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'PENDING',
          name TEXT,
          amount REAL,
          category TEXT,
          account_id TEXT,
          note TEXT,
          date TEXT,
          confidence REAL,
          expense_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT
        );
      `);
      db.execSync(`CREATE INDEX IF NOT EXISTS idx_pq_status ON payment_queue(status);`);
      db.execSync(`CREATE INDEX IF NOT EXISTS idx_pq_created ON payment_queue(created_at);`);
      db.runSync(`INSERT INTO schema_versions (version, applied_at) VALUES (?, ?)`, 6, new Date().toISOString());
    }

    autoLogRecurringExpenses();
    advanceRecurringPayments();

    // Clean up test data if any
    try {
      db.execSync(`
        DELETE FROM categories WHERE name = 'TestCat';
        DELETE FROM accounts WHERE name = 'TestAcc';
        DELETE FROM expenses WHERE name = 'Test Expense';
        DELETE FROM incomes WHERE source = 'Test Income';
        DELETE FROM goals WHERE title = 'Test Goal';
        DELETE FROM investments WHERE name = 'Test Inv';
      `);
    } catch (e) {}

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database init error:", error);
    throw error;
  }
};

import { Expense, Goal, Investment, Category, Income, Account, RecurringPayment, Debt, MerchantMapping, PFContribution, PaymentQueueItem } from '../state/types';

export const exportDatabaseToJSON = () => {
  try {
    const expenses = db.getAllSync(`SELECT * FROM expenses`);
    const incomes = db.getAllSync(`SELECT * FROM incomes`);
    const categories = db.getAllSync(`SELECT * FROM categories`);
    const goals = db.getAllSync(`SELECT * FROM goals`);
    const accounts = db.getAllSync(`SELECT * FROM accounts`);
    const investments = db.getAllSync(`SELECT * FROM investments`);
    const recurringPayments = db.getAllSync(`SELECT * FROM recurring_payments`);
    const debt = db.getAllSync(`SELECT * FROM debt`);
    const merchantMappings = db.getAllSync(`SELECT * FROM merchant_mappings`);
    const pfContributions = db.getAllSync(`SELECT * FROM pf_contributions`);
    const goalContributions = db.getAllSync(`SELECT * FROM goal_contributions`);
    const debtPayments = db.getAllSync(`SELECT * FROM debt_payments`);
    
    return JSON.stringify({
      schema_version: 4,
      app_version: '2.0.0',
      exported_at: new Date().toISOString(),
      expenses, incomes, categories, goals, accounts, investments,
      recurringPayments, debt, merchantMappings, pfContributions,
      goalContributions, debtPayments,
    }, null, 2);
  } catch (error) {
    console.error("Export failed", error);
    return null;
  }
};

export const importDatabaseFromJSON = (json: string) => {
  try {
    const data = JSON.parse(json);
    const version = data.schema_version || 1;
    
    // Clear existing data
    db.execSync(`DELETE FROM expenses`);
    db.execSync(`DELETE FROM incomes`);
    db.execSync(`DELETE FROM categories`);
    db.execSync(`DELETE FROM goals`);
    db.execSync(`DELETE FROM accounts`);
    db.execSync(`DELETE FROM investments`);
    try { db.execSync(`DELETE FROM recurring_payments`); } catch (e) {}
    try { db.execSync(`DELETE FROM debt`); } catch (e) {}
    try { db.execSync(`DELETE FROM merchant_mappings`); } catch (e) {}
    try { db.execSync(`DELETE FROM pf_contributions`); } catch (e) {}
    try { db.execSync(`DELETE FROM goal_contributions`); } catch (e) {}
    try { db.execSync(`DELETE FROM debt_payments`); } catch (e) {}

    // Re-insert data
    if (data.expenses) {
      for (const e of data.expenses) {
        db.runSync(
          `INSERT OR REPLACE INTO expenses (id, name, amount, category, note, date, created_at, updated_at, sync_status, is_deleted, is_recurring, account_id, type, from_account_id, to_account_id, status, source, fingerprint, merchant_name, reference_number, occasion, confidence)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          e.id, e.name, e.amount, e.category, e.note, e.date, e.created_at, e.updated_at, e.sync_status, e.is_deleted || 0, e.is_recurring || 0, e.account_id, e.type || 'EXPENSE', e.from_account_id, e.to_account_id, e.status || 'CLEARED', e.source || 'MANUAL', e.fingerprint, e.merchant_name, e.reference_number, e.occasion, e.confidence
        );
      }
    }
    if (data.incomes) {
      for (const i of data.incomes) {
        db.runSync(`INSERT OR REPLACE INTO incomes (id, source, amount, date, is_recurring, notes, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          i.id, i.source, i.amount, i.date, i.is_recurring || 0, i.notes, i.created_at, i.updated_at, i.is_deleted || 0);
      }
    }
    if (data.categories) {
      for (const c of data.categories) {
        db.runSync(`INSERT OR REPLACE INTO categories (id, name, icon, color, monthly_limit, is_fixed, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          c.id, c.name, c.icon, c.color, c.monthly_limit || 0, c.is_fixed || 0, c.created_at, c.updated_at, c.is_deleted || 0);
      }
    }
    if (data.goals) {
      for (const g of data.goals) {
        db.runSync(`INSERT OR REPLACE INTO goals (id, title, target_amount, timeline_months, category, priority, saved_amount, is_debt, completed, notes, created_at, updated_at, sync_status, is_deleted, account_id, monthly_contribution, expected_completion_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          g.id, g.title, g.target_amount, g.timeline_months, g.category, g.priority, g.saved_amount || 0, g.is_debt || 0, g.completed || 0, g.notes, g.created_at, g.updated_at, g.sync_status, g.is_deleted || 0, g.account_id, g.monthly_contribution, g.expected_completion_date);
      }
    }
    if (data.accounts) {
      for (const a of data.accounts) {
        db.runSync(`INSERT OR REPLACE INTO accounts (id, name, type, balance, opening_balance, target_months, notes, created_at, updated_at, is_deleted, actual_balance, last_reconciled_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          a.id, a.name, a.type, a.balance || 0, a.opening_balance || 0, a.target_months, a.notes, a.created_at, a.updated_at, a.is_deleted || 0, a.actual_balance, a.last_reconciled_date);
      }
    }
    if (data.investments) {
      for (const inv of data.investments) {
        db.runSync(`INSERT OR REPLACE INTO investments (id, name, type, monthly_amount, start_date, tenure_months, expected_return, compounding, step_up_enabled, step_up_rate, step_up_frequency, sip_day, notes, created_at, updated_at, sync_status, is_deleted, current_value, invested_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          inv.id, inv.name, inv.type, inv.monthly_amount, inv.start_date, inv.tenure_months, inv.expected_return, inv.compounding, inv.step_up_enabled || 0, inv.step_up_rate, inv.step_up_frequency, inv.sip_day, inv.notes, inv.created_at, inv.updated_at, inv.sync_status, inv.is_deleted || 0, inv.current_value, inv.invested_amount);
      }
    }
    if (data.recurringPayments) {
      for (const rp of data.recurringPayments) {
        db.runSync(`INSERT OR REPLACE INTO recurring_payments (id, name, amount, category, account_id, frequency, next_due, status, notes, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          rp.id, rp.name, rp.amount, rp.category, rp.account_id, rp.frequency, rp.next_due, rp.status, rp.notes, rp.created_at, rp.updated_at, rp.is_deleted || 0);
      }
    }
    if (data.debt) {
      for (const d of data.debt) {
        db.runSync(`INSERT OR REPLACE INTO debt (id, name, principal, outstanding, interest_rate, min_payment, frequency, due_day, next_payment_date, notes, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          d.id, d.name, d.principal, d.outstanding, d.interest_rate || 0, d.min_payment || 0, d.frequency, d.due_day || 1, d.next_payment_date, d.notes, d.created_at, d.updated_at, d.is_deleted || 0);
      }
    }
    if (data.merchantMappings) {
      for (const m of data.merchantMappings) {
        db.runSync(`INSERT OR REPLACE INTO merchant_mappings (id, merchant_name, category, account_id, usage_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          m.id, m.merchant_name, m.category, m.account_id, m.usage_count || 1, m.created_at, m.updated_at);
      }
    }
    if (data.pfContributions) {
      for (const p of data.pfContributions) {
        db.runSync(`INSERT OR REPLACE INTO pf_contributions (id, month, employee_amount, employer_amount, total, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          p.id, p.month, p.employee_amount || 0, p.employer_amount || 0, p.total || 0, p.created_at, p.updated_at);
      }
    }
    if (data.goalContributions) {
      for (const gc of data.goalContributions) {
        db.runSync(`INSERT OR REPLACE INTO goal_contributions (id, goal_id, amount, date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
          gc.id, gc.goal_id, gc.amount, gc.date, gc.notes, gc.created_at);
      }
    }
    if (data.debtPayments) {
      for (const dp of data.debtPayments) {
        db.runSync(`INSERT OR REPLACE INTO debt_payments (id, debt_id, amount, date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
          dp.id, dp.debt_id, dp.amount, dp.date, dp.notes, dp.created_at);
      }
    }

    return true;
  } catch (error) {
    console.error("Import failed", error);
    return false;
  }
};

export const autoLogRecurringExpenses = () => {
  try {
    const fixedCategories = db.getAllSync<any>(`SELECT * FROM categories WHERE is_fixed = 1 AND is_deleted = 0`);
    if (!fixedCategories.length) return;

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // "YYYY-MM"

    fixedCategories.forEach((cat: any) => {
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

// Advance recurring payments that are past their due date
export const advanceRecurringPayments = () => {
  try {
    const now = new Date();
    const payments = db.getAllSync<any>(`SELECT * FROM recurring_payments WHERE is_deleted = 0 AND status IN ('UPCOMING', 'DUE')`);
    
    for (const p of payments) {
      const dueDate = new Date(p.next_due);
      if (dueDate <= now && p.status === 'UPCOMING') {
        db.runSync(`UPDATE recurring_payments SET status = 'DUE', updated_at = ? WHERE id = ?`, now.toISOString(), p.id);
      }
      // Mark as overdue if more than 3 days past due
      const threeDaysAfter = new Date(dueDate);
      threeDaysAfter.setDate(threeDaysAfter.getDate() + 3);
      if (now > threeDaysAfter && p.status === 'DUE') {
        db.runSync(`UPDATE recurring_payments SET status = 'OVERDUE', updated_at = ? WHERE id = ?`, now.toISOString(), p.id);
      }
    }
  } catch (error) {
    console.error("Advance recurring payments failed:", error);
  }
};

// --- EXPENSE FUNCTIONS ---

export const addExpense = (data: Omit<Expense, 'id'>) => {
  if (data.amount <= 0) throw new Error("Amount must be > 0");
  if (!data.category) throw new Error("Category cannot be empty");

  const id = uuidv4();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO expenses (id, name, amount, category, note, date, created_at, sync_status, account_id, type, from_account_id, to_account_id, status, source, fingerprint, merchant_name, reference_number, occasion, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, data.name, data.amount, data.category, data.note || null, data.date, now, data.account_id || null, data.type || 'EXPENSE', data.from_account_id || null, data.to_account_id || null, data.status || 'CLEARED', data.source || 'MANUAL', data.fingerprint || null, data.merchant_name || null, data.reference_number || null, data.occasion || null, data.confidence || null
  );

  // Learn merchant mapping
  if (data.merchant_name) {
    learnMerchantMapping(data.merchant_name, data.category, data.account_id);
  }

  return id;
};

export const getAllExpenses = (): Expense[] => {
  const rows = db.getAllSync<any>(`SELECT * FROM expenses WHERE is_deleted = 0 ORDER BY date DESC`);
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    amount: r.amount,
    category: r.category,
    note: r.note,
    date: r.date,
    account_id: r.account_id,
    type: r.type,
    from_account_id: r.from_account_id,
    to_account_id: r.to_account_id,
    status: r.status,
    source: r.source,
    fingerprint: r.fingerprint,
    merchant_name: r.merchant_name,
    reference_number: r.reference_number,
    occasion: r.occasion,
    confidence: r.confidence,
  }));
};

export const getExpensesByMonth = (month: string): Expense[] => {
  const rows = db.getAllSync<any>(
    `SELECT * FROM expenses WHERE is_deleted = 0 AND date LIKE ? ORDER BY date DESC`,
    `${month}%`
  );
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    amount: r.amount,
    category: r.category,
    note: r.note,
    date: r.date,
    account_id: r.account_id,
    type: r.type,
    from_account_id: r.from_account_id,
    to_account_id: r.to_account_id,
    status: r.status,
    source: r.source,
    fingerprint: r.fingerprint,
    merchant_name: r.merchant_name,
    reference_number: r.reference_number,
    occasion: r.occasion,
    confidence: r.confidence,
  }));
};

export const updateExpense = (id: string, data: Partial<Expense>) => {
  const allowedKeys = ['name', 'amount', 'category', 'note', 'date', 'account_id', 'type', 'from_account_id', 'to_account_id', 'status', 'source', 'fingerprint', 'merchant_name', 'reference_number', 'occasion', 'confidence'];
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

// Soft-undelete for undo functionality
export const undeleteExpense = (id: string) => {
  db.runSync(`UPDATE expenses SET is_deleted = 0, sync_status = 'pending', updated_at = ? WHERE id = ?`, new Date().toISOString(), id);
};

// --- GOAL FUNCTIONS ---

export const addGoal = (data: Omit<Goal, 'id' | 'createdAt'>) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO goals (id, title, target_amount, timeline_months, category, priority, saved_amount, is_debt, completed, notes, created_at, sync_status, account_id, monthly_contribution, expected_completion_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    id, data.title, data.targetAmount, data.timelineMonths, data.category || null, data.priority || null, data.savedAmount || 0, data.isDebt ? 1 : 0, data.completed ? 1 : 0, data.notes || null, now, data.account_id || null, data.monthly_contribution || null, data.expected_completion_date || null
  );
  return id;
};

export const getGoals = (): Goal[] => {
  const rows = db.getAllSync<any>(`SELECT * FROM goals WHERE is_deleted = 0 ORDER BY created_at DESC`);
  return rows.map((r: any) => ({
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
    notes: r.notes,
    account_id: r.account_id,
    monthly_contribution: r.monthly_contribution,
    expected_completion_date: r.expected_completion_date,
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
    notes: 'notes',
    account_id: 'account_id',
    monthly_contribution: 'monthly_contribution',
    expected_completion_date: 'expected_completion_date',
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

export const addGoalContribution = (goalId: string, amount: number, notes?: string) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.runSync(`INSERT INTO goal_contributions (id, goal_id, amount, date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    id, goalId, amount, now, notes || null, now);
  // Update saved_amount on the goal
  const goal = db.getFirstSync<any>(`SELECT saved_amount FROM goals WHERE id = ?`, goalId);
  if (goal) {
    db.runSync(`UPDATE goals SET saved_amount = ?, updated_at = ? WHERE id = ?`, (goal.saved_amount || 0) + amount, now, goalId);
  }
  return id;
};

export const getGoalContributions = (goalId: string) => {
  return db.getAllSync<any>(`SELECT * FROM goal_contributions WHERE goal_id = ? ORDER BY date DESC`, goalId);
};

// --- INVESTMENT FUNCTIONS ---

export const addInvestment = (data: Omit<Investment, 'id'>) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO investments (id, name, type, monthly_amount, start_date, tenure_months, expected_return, compounding, step_up_enabled, step_up_rate, step_up_frequency, sip_day, notes, created_at, sync_status, current_value, invested_amount) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    id, data.name, data.type, data.monthly_amount, data.startDate, data.tenureMonths, 
    data.expected_annual_return, data.compounding_frequency, data.step_up_enabled ? 1 : 0, 
    data.step_up_rate, data.step_up_frequency, data.sip_day, data.notes || null, now,
    data.current_value || null, data.invested_amount || null
  );
  return id;
};

export const getInvestments = (): Investment[] => {
  const rows = db.getAllSync<any>(`SELECT * FROM investments WHERE is_deleted = 0 ORDER BY created_at DESC`);
  return rows.map((r: any) => ({
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
    notes: r.notes,
    current_value: r.current_value,
    invested_amount: r.invested_amount,
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
    notes: 'notes',
    current_value: 'current_value',
    invested_amount: 'invested_amount',
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
  return rows.map((r: any) => ({
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
  return rows.map((r: any) => ({
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
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    balance: r.balance,
    opening_balance: r.opening_balance,
    target_months: r.target_months,
    notes: r.notes,
    created_at: r.created_at,
    actual_balance: r.actual_balance,
    last_reconciled_date: r.last_reconciled_date,
  }));
};

export const addAccount = (data: Omit<Account, 'id' | 'created_at'>) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO accounts (id, name, type, balance, opening_balance, target_months, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id, data.name, data.type, data.balance || 0, data.opening_balance ?? (data.balance || 0), data.target_months || null, data.notes || null, now
  );
  return id;
};

export const updateAccount = (id: string, data: Partial<Account>) => {
  const map: Record<string, string> = {
    name: 'name',
    type: 'type',
    balance: 'balance',
    opening_balance: 'opening_balance',
    target_months: 'target_months',
    notes: 'notes',
    actual_balance: 'actual_balance',
    last_reconciled_date: 'last_reconciled_date',
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

// --- RECURRING PAYMENT FUNCTIONS ---

export const getRecurringPayments = (): RecurringPayment[] => {
  const rows = db.getAllSync<any>(`SELECT * FROM recurring_payments WHERE is_deleted = 0 ORDER BY next_due ASC`);
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    amount: r.amount,
    category: r.category,
    account_id: r.account_id,
    frequency: r.frequency,
    next_due: r.next_due,
    status: r.status,
    notes: r.notes,
    created_at: r.created_at,
  }));
};

export const addRecurringPayment = (data: Omit<RecurringPayment, 'id' | 'created_at'>) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO recurring_payments (id, name, amount, category, account_id, frequency, next_due, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, data.name, data.amount, data.category || null, data.account_id || null, data.frequency, data.next_due, data.status || 'UPCOMING', data.notes || null, now
  );
  return id;
};

export const updateRecurringPayment = (id: string, data: Partial<RecurringPayment>) => {
  const map: Record<string, string> = {
    name: 'name', amount: 'amount', category: 'category', account_id: 'account_id',
    frequency: 'frequency', next_due: 'next_due', status: 'status', notes: 'notes',
  };
  const sets: string[] = [];
  const params: any[] = [];
  Object.entries(data).forEach(([key, value]) => {
    if (map[key]) { sets.push(`${map[key]} = ?`); params.push(value); }
  });
  if (sets.length === 0) return;
  sets.push(`updated_at = ?`);
  params.push(new Date().toISOString(), id);
  db.runSync(`UPDATE recurring_payments SET ${sets.join(', ')} WHERE id = ?`, ...params);
};

export const deleteRecurringPayment = (id: string) => {
  db.runSync(`UPDATE recurring_payments SET is_deleted = 1, updated_at = ? WHERE id = ?`, new Date().toISOString(), id);
};

// Mark a recurring payment as paid → creates an expense and advances the due date
export const markRecurringPaymentPaid = (paymentId: string, amount?: number) => {
  const payment = db.getFirstSync<any>(`SELECT * FROM recurring_payments WHERE id = ?`, paymentId);
  if (!payment) return;

  const paidAmount = amount || payment.amount;
  const now = new Date().toISOString();

  // Create the actual expense transaction
  addExpense({
    name: payment.name,
    amount: paidAmount,
    category: payment.category || 'Bills',
    date: now,
    account_id: payment.account_id,
    type: 'EXPENSE',
    source: 'RECURRING',
  });

  // Advance due date based on frequency
  const nextDue = new Date(payment.next_due);
  switch (payment.frequency) {
    case 'DAILY': nextDue.setDate(nextDue.getDate() + 1); break;
    case 'WEEKLY': nextDue.setDate(nextDue.getDate() + 7); break;
    case 'MONTHLY': nextDue.setMonth(nextDue.getMonth() + 1); break;
    case 'QUARTERLY': nextDue.setMonth(nextDue.getMonth() + 3); break;
    case 'YEARLY': nextDue.setFullYear(nextDue.getFullYear() + 1); break;
  }

  db.runSync(`UPDATE recurring_payments SET status = 'UPCOMING', next_due = ?, updated_at = ? WHERE id = ?`,
    nextDue.toISOString(), now, paymentId);
};

export const skipRecurringPayment = (paymentId: string) => {
  const payment = db.getFirstSync<any>(`SELECT * FROM recurring_payments WHERE id = ?`, paymentId);
  if (!payment) return;
  
  const nextDue = new Date(payment.next_due);
  switch (payment.frequency) {
    case 'DAILY': nextDue.setDate(nextDue.getDate() + 1); break;
    case 'WEEKLY': nextDue.setDate(nextDue.getDate() + 7); break;
    case 'MONTHLY': nextDue.setMonth(nextDue.getMonth() + 1); break;
    case 'QUARTERLY': nextDue.setMonth(nextDue.getMonth() + 3); break;
    case 'YEARLY': nextDue.setFullYear(nextDue.getFullYear() + 1); break;
  }

  db.runSync(`UPDATE recurring_payments SET status = 'UPCOMING', next_due = ?, updated_at = ? WHERE id = ?`,
    nextDue.toISOString(), new Date().toISOString(), paymentId);
};

// --- DEBT FUNCTIONS ---

export const getDebts = (): Debt[] => {
  const rows = db.getAllSync<any>(`SELECT * FROM debt WHERE is_deleted = 0 ORDER BY next_payment_date ASC`);
  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    principal: r.principal,
    outstanding: r.outstanding,
    interest_rate: r.interest_rate,
    min_payment: r.min_payment,
    frequency: r.frequency,
    due_day: r.due_day,
    next_payment_date: r.next_payment_date,
    notes: r.notes,
    created_at: r.created_at,
  }));
};

export const addDebt = (data: Omit<Debt, 'id' | 'created_at'>) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO debt (id, name, principal, outstanding, interest_rate, min_payment, frequency, due_day, next_payment_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, data.name, data.principal, data.outstanding, data.interest_rate || 0, data.min_payment || 0, data.frequency, data.due_day || 1, data.next_payment_date, data.notes || null, now
  );
  return id;
};

export const updateDebt = (id: string, data: Partial<Debt>) => {
  const map: Record<string, string> = {
    name: 'name', principal: 'principal', outstanding: 'outstanding',
    interest_rate: 'interest_rate', min_payment: 'min_payment', frequency: 'frequency',
    due_day: 'due_day', next_payment_date: 'next_payment_date', notes: 'notes',
  };
  const sets: string[] = [];
  const params: any[] = [];
  Object.entries(data).forEach(([key, value]) => {
    if (map[key]) { sets.push(`${map[key]} = ?`); params.push(value); }
  });
  if (sets.length === 0) return;
  sets.push(`updated_at = ?`);
  params.push(new Date().toISOString(), id);
  db.runSync(`UPDATE debt SET ${sets.join(', ')} WHERE id = ?`, ...params);
};

export const deleteDebt = (id: string) => {
  db.runSync(`UPDATE debt SET is_deleted = 1, updated_at = ? WHERE id = ?`, new Date().toISOString(), id);
};

export const addDebtPayment = (debtId: string, amount: number, notes?: string) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.runSync(`INSERT INTO debt_payments (id, debt_id, amount, date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    id, debtId, amount, now, notes || null, now);
  // Reduce outstanding
  const debt = db.getFirstSync<any>(`SELECT outstanding FROM debt WHERE id = ?`, debtId);
  if (debt) {
    db.runSync(`UPDATE debt SET outstanding = ?, updated_at = ? WHERE id = ?`, Math.max(0, (debt.outstanding || 0) - amount), now, debtId);
  }
  return id;
};

export const getDebtPayments = (debtId: string) => {
  return db.getAllSync<any>(`SELECT * FROM debt_payments WHERE debt_id = ? ORDER BY date DESC`, debtId);
};

// --- MERCHANT MAPPING FUNCTIONS ---

export const getMerchantMappings = (): MerchantMapping[] => {
  const rows = db.getAllSync<any>(`SELECT * FROM merchant_mappings ORDER BY usage_count DESC`);
  return rows.map((r: any) => ({
    id: r.id,
    merchant_name: r.merchant_name,
    category: r.category,
    account_id: r.account_id,
    usage_count: r.usage_count,
  }));
};

export const learnMerchantMapping = (merchantName: string, category: string, accountId?: string) => {
  const normalized = merchantName.trim().toLowerCase();
  if (!normalized) return;
  
  const existing = db.getFirstSync<any>(`SELECT * FROM merchant_mappings WHERE LOWER(merchant_name) = ?`, normalized);
  if (existing) {
    db.runSync(`UPDATE merchant_mappings SET category = ?, account_id = ?, usage_count = usage_count + 1, updated_at = ? WHERE id = ?`,
      category, accountId || existing.account_id, new Date().toISOString(), existing.id);
  } else {
    const id = uuidv4();
    db.runSync(`INSERT INTO merchant_mappings (id, merchant_name, category, account_id, usage_count, created_at) VALUES (?, ?, ?, ?, 1, ?)`,
      id, normalized, category, accountId || null, new Date().toISOString());
  }
};

export const suggestForMerchant = (merchantName: string): { category?: string; account_id?: string } | null => {
  const normalized = merchantName.trim().toLowerCase();
  if (!normalized) return null;
  
  const mapping = db.getFirstSync<any>(`SELECT * FROM merchant_mappings WHERE LOWER(merchant_name) = ?`, normalized);
  if (mapping) {
    return { category: mapping.category, account_id: mapping.account_id };
  }
  
  // Fuzzy match: check if any merchant contains this name
  const fuzzy = db.getFirstSync<any>(`SELECT * FROM merchant_mappings WHERE LOWER(merchant_name) LIKE ? ORDER BY usage_count DESC LIMIT 1`, `%${normalized}%`);
  if (fuzzy) {
    return { category: fuzzy.category, account_id: fuzzy.account_id };
  }
  
  return null;
};

// --- PF CONTRIBUTION FUNCTIONS ---

export const getPFContributions = (): PFContribution[] => {
  const rows = db.getAllSync<any>(`SELECT * FROM pf_contributions ORDER BY month DESC`);
  return rows.map((r: any) => ({
    id: r.id,
    month: r.month,
    employee_amount: r.employee_amount,
    employer_amount: r.employer_amount,
    total: r.total,
    created_at: r.created_at,
  }));
};

export const addPFContribution = (data: Omit<PFContribution, 'id' | 'created_at'>) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  const total = (data.employee_amount || 0) + (data.employer_amount || 0);
  
  // Upsert: if month exists, update; else insert
  const existing = db.getFirstSync<any>(`SELECT id FROM pf_contributions WHERE month = ?`, data.month);
  if (existing) {
    db.runSync(`UPDATE pf_contributions SET employee_amount = ?, employer_amount = ?, total = ?, updated_at = ? WHERE id = ?`,
      data.employee_amount, data.employer_amount, total, now, existing.id);
    return existing.id;
  }
  
  db.runSync(`INSERT INTO pf_contributions (id, month, employee_amount, employer_amount, total, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    id, data.month, data.employee_amount || 0, data.employer_amount || 0, total, now);
  return id;
};

export const deletePFContribution = (id: string) => {
  db.runSync(`DELETE FROM pf_contributions WHERE id = ?`, id);
};

// Auto-add PF contribution for current month if user has set it up
export const autoAddMonthlyPF = (monthlyEmployee: number, monthlyEmployer: number) => {
  if (monthlyEmployee <= 0 && monthlyEmployer <= 0) return;
  const month = new Date().toISOString().slice(0, 7);
  addPFContribution({ month, employee_amount: monthlyEmployee, employer_amount: monthlyEmployer, total: monthlyEmployee + monthlyEmployer });
};

// ─── PAYMENT QUEUE FUNCTIONS ──────────────────────────────────────────────────

export const addPaymentQueueItem = (imageUri: string): string => {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO payment_queue (id, image_uri, status, created_at) VALUES (?, ?, 'PENDING', ?)`,
    id, imageUri, now
  );
  return id;
};

export const getPaymentQueueItems = (): PaymentQueueItem[] => {
  const rows = db.getAllSync<any>(
    `SELECT * FROM payment_queue ORDER BY created_at DESC`
  );
  return rows.map((r: any) => ({
    id: r.id,
    image_uri: r.image_uri,
    status: r.status,
    name: r.name,
    amount: r.amount,
    category: r.category,
    account_id: r.account_id,
    note: r.note,
    date: r.date,
    confidence: r.confidence,
    expense_id: r.expense_id,
    created_at: r.created_at,
  }));
};

export const getPendingPaymentQueueItems = (): PaymentQueueItem[] => {
  const rows = db.getAllSync<any>(
    `SELECT * FROM payment_queue WHERE status = 'PENDING' ORDER BY created_at DESC`
  );
  return rows.map((r: any) => ({
    id: r.id,
    image_uri: r.image_uri,
    status: r.status,
    name: r.name,
    amount: r.amount,
    category: r.category,
    account_id: r.account_id,
    note: r.note,
    date: r.date,
    confidence: r.confidence,
    expense_id: r.expense_id,
    created_at: r.created_at,
  }));
};

export const updatePaymentQueueItem = (id: string, data: Partial<PaymentQueueItem>) => {
  const allowedKeys = ['name', 'amount', 'category', 'account_id', 'note', 'date', 'confidence', 'status', 'expense_id'];
  const sets: string[] = [];
  const params: any[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (allowedKeys.includes(key)) {
      sets.push(`${key} = ?`);
      params.push(value);
    }
  });

  if (sets.length === 0) return;
  sets.push(`updated_at = ?`);
  params.push(new Date().toISOString(), id);
  db.runSync(`UPDATE payment_queue SET ${sets.join(', ')} WHERE id = ?`, ...params);
};

/**
 * Approve a payment queue item — atomically creates an expense and marks the
 * queue item as APPROVED, linking the generated expense_id back to it.
 * Returns the new expense's ID.
 */
export const approvePaymentQueueItem = (
  queueId: string,
  expenseData: Omit<Expense, 'id'>
): string => {
  if (!expenseData.amount || expenseData.amount <= 0) throw new Error('Amount must be > 0');
  if (!expenseData.category) throw new Error('Category is required');

  const expenseId = addExpense(expenseData);
  db.runSync(
    `UPDATE payment_queue SET status = 'APPROVED', expense_id = ?, updated_at = ? WHERE id = ?`,
    expenseId, new Date().toISOString(), queueId
  );
  return expenseId;
};

export const rejectPaymentQueueItem = (id: string) => {
  db.runSync(
    `UPDATE payment_queue SET status = 'REJECTED', updated_at = ? WHERE id = ?`,
    new Date().toISOString(), id
  );
};

export const deletePaymentQueueItem = (id: string) => {
  try {
    const row = db.getFirstSync<any>(`SELECT image_uri FROM payment_queue WHERE id = ?`, id);
    db.runSync(`DELETE FROM payment_queue WHERE id = ?`, id);
    if (row?.image_uri) {
      FileSystem.getInfoAsync(row.image_uri).then((info) => {
        if (info.exists) {
          FileSystem.deleteAsync(row.image_uri, { idempotent: true }).catch(() => {});
        }
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('[Database] Failed to delete payment queue item:', err);
  }
};

/** Check if a queue item for the same image URI already exists (dedup). */
export const findQueueItemByImageUri = (imageUri: string): PaymentQueueItem | null => {
  const row = db.getFirstSync<any>(
    `SELECT * FROM payment_queue WHERE image_uri = ? LIMIT 1`,
    imageUri
  );
  if (!row) return null;
  return {
    id: row.id,
    image_uri: row.image_uri,
    status: row.status,
    name: row.name,
    amount: row.amount,
    category: row.category,
    account_id: row.account_id,
    note: row.note,
    date: row.date,
    confidence: row.confidence,
    expense_id: row.expense_id,
    created_at: row.created_at,
  };
};
