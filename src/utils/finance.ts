import { differenceInCalendarDays, startOfWeek, subDays, format } from "date-fns";
import { computeDynamicPFBalance } from './pfCalculator';
import type { BudgetState, Expense, Account, Goal, Investment, Income, UserPreferences } from "../state/types";

export const calculateAccountBalance = (account: Account, transactions: Expense[]) => {
  let balance = account.opening_balance ?? account.balance ?? 0;
  for (const t of transactions) {
    if (t.type === 'TRANSFER') {
      if (t.from_account_id === account.id) balance -= t.amount;
      if (t.to_account_id === account.id) balance += t.amount;
    } else if (t.type === 'INCOME' || t.type === 'REFUND') {
      if (t.account_id === account.id || t.to_account_id === account.id) balance += t.amount;
    } else {
      // Default EXPENSE / ADJ / INVESTMENT
      if (t.account_id === account.id || t.from_account_id === account.id) balance -= t.amount;
    }
  }
  return balance;
};

export const calculateGoalProgress = (goalId: string, accountId: string | undefined, transactions: Expense[]) => {
  const targetId = accountId || goalId; // Fallback to goalId as a pseudo-account if no real account is linked
  return transactions.reduce((acc, t) => {
    if ((t.type === 'TRANSFER' || t.type === 'INVESTMENT_CONTRIBUTION') && t.to_account_id === targetId) return acc + t.amount;
    if ((t.type === 'TRANSFER' || t.type === 'INVESTMENT_WITHDRAWAL') && t.from_account_id === targetId) return acc - t.amount;
    return acc;
  }, 0);
};

/**
 * Current net worth = actual cash + actual invested amounts − outstanding debt
 * Projected future value is NOT included (per spec: "Current net worth ≠ projected future wealth")
 */
export const calculateNetWorth = (accounts: Account[], goals: Goal[], investments: Investment[], incomes: Income[] = [], transactions: Expense[] = [], preferences?: UserPreferences) => {
  // Real account balances derived from transactions
  const accountsTotal = accounts.reduce((sum, acc) => sum + calculateAccountBalance(acc, transactions), 0);
  
  // Only actual invested amount, NOT projected future value
  const investmentsActual = investments.reduce((sum, inv) => {
    // If current_value is set (portfolio tracking), use it
    if (inv.current_value !== undefined && inv.current_value !== null) return sum + inv.current_value;
    // If invested_amount is set, use it
    if (inv.invested_amount !== undefined && inv.invested_amount !== null) return sum + inv.invested_amount;
    // Fallback: estimate from monthly_amount × months elapsed
    const startDate = new Date(inv.startDate);
    const now = new Date();
    const monthsElapsed = Math.max(0, (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()));
    return sum + (inv.monthly_amount * Math.min(monthsElapsed, inv.tenureMonths));
  }, 0);

  const pfBalance = preferences?.pfConfig ? computeDynamicPFBalance(preferences.pfConfig).currentBalance : 0;

  const assets = accountsTotal + investmentsActual + pfBalance;
  
  // Outstanding debt (goals marked as debt with remaining balance)
  const liabilities = goals
    .filter(g => g.isDebt && !g.completed)
    .reduce((sum, g) => {
      const saved = calculateGoalProgress(g.id, g.account_id, transactions);
      return sum + Math.max(0, g.targetAmount - saved);
    }, 0);
    
  return { netWorth: assets - liabilities, assets, liabilities, accountsTotal, investmentsActual, pfBalance };
};

export const formatMoney = (val: number | string | undefined | null, isPrivacyEnabled: boolean = false) => {
  if (isPrivacyEnabled) return "₹•••••";
  const num = Number(val);
  if (Number.isNaN(num) || num == null || val === "") return "₹0";
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
};

export const parseInputMoney = (val: string | number | undefined | null): string => {
  if (val === null || val === undefined) return "";
  return String(val).replace(/[^0-9]/g, "");
};

export const formatInputMoney = (val: string | number | undefined | null): string => {
  const parsed = parseInputMoney(val);
  if (!parsed) return "";
  return Number(parsed).toLocaleString('en-IN');
};

export const getCurrentBudgetCycle = (paycheckDate: number = 1) => {
  const pd = Math.max(1, Math.min(31, Math.round(paycheckDate)));
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  let startMonth = month;
  let startYear = year;

  if (date < pd) {
    startMonth = month - 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear = year - 1;
    }
  }

  const start = new Date(startYear, startMonth, pd, 0, 0, 0);
  
  // End date is one day before the NEXT paycheck date
  const end = new Date(startYear, startMonth + 1, pd, 0, 0, 0);
  end.setMilliseconds(-1); // 23:59:59.999 of the day before

  return { start, end };
};

export const inCurrentCycle = (dateStr: string, paycheckDate: number = 1) => {
  const { start, end } = getCurrentBudgetCycle(paycheckDate);
  const d = new Date(dateStr);
  return d >= start && d <= end;
};

export const monthlySpend = (expenses: Expense[], paycheckDate: number = 1) =>
  expenses
    .filter((e) => (e.type === 'EXPENSE' || !e.type) && inCurrentCycle(e.date, paycheckDate))
    .reduce((acc, item) => acc + item.amount, 0);

export const categorySpend = (expenses: Expense[], paycheckDate: number = 1) => {
  const map: Record<string, number> = {};
  for (const item of expenses.filter((e) => (e.type === 'EXPENSE' || !e.type) && inCurrentCycle(e.date, paycheckDate))) {
    map[item.category] = (map[item.category] ?? 0) + item.amount;
  }
  return map;
};

export const budgetSignals = (expenses: Expense[], budget: BudgetState) => {
  const pd = budget.paycheckDate || 1;
  const monthSpent = monthlySpend(expenses, pd);
  
  const effectiveLimit = budget.monthlyLimit || budget.monthlyIncome || 0;
  
  const ratio = effectiveLimit ? monthSpent / effectiveLimit : 0;
  
  const { start, end } = getCurrentBudgetCycle(pd);
  const now = new Date();
  
  const daysLeft = Math.max(0, differenceInCalendarDays(end, now));
  const dayOfCycle = Math.max(1, differenceInCalendarDays(now, start) + 1);
  const totalDays = differenceInCalendarDays(end, start) + 1;
  
  const perDay = monthSpent / dayOfCycle;
  const idealPerDay = effectiveLimit / totalDays;
  const budgetLeft = Math.max(0, effectiveLimit - monthSpent);
  const safeToSpendToday = Math.max(0, Math.min(budgetLeft, (daysLeft > 0 ? budgetLeft / daysLeft : budgetLeft)));
  const paceRatio = idealPerDay ? perDay / idealPerDay : 0;
  const projected = perDay * totalDays;
  const projectedOvershoot = Math.max(0, projected - effectiveLimit);
  return { monthSpent, ratio, daysLeft, perDay, idealPerDay, safeToSpendToday, budgetLeft, paceRatio, projected, projectedOvershoot };
};

export const categoryStatus = (spent: number, limit: number) => {
  if (!limit) return { ratio: 0, badge: "No limit", tone: "#C3CBC8", bar: "#B5BEBA" };
  const ratio = spent / limit;
  if (ratio >= 1) return { ratio, badge: "🔴 Over", tone: "#A23D3D", bar: "#E05555" };
  if (ratio >= 0.9) return { ratio, badge: "🟠 90%", tone: "#A05C22", bar: "#F59E0B" };
  if (ratio >= 0.7) return { ratio, badge: "🟡 70%", tone: "#7B6B24", bar: "#EAB308" };
  return { ratio, badge: "Healthy", tone: "#2E6A5A", bar: "#2D8A73" };
};

export const topThreeCategories = (expenses: Expense[], paycheckDate: number = 1) => {
  const split = categorySpend(expenses, paycheckDate);
  const total = Object.values(split).reduce((a, b) => a + b, 0);
  return Object.entries(split)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, value]) => ({ name, value, pct: total ? Math.round((value / total) * 100) : 0 }));
};

export const currentNoSpendStreak = (expenses: Expense[]) => {
  const byDay = new Set(expenses.filter(e => e.type === 'EXPENSE' || !e.type).map((e) => e.date.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 30; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    if (byDay.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const weeklyReport = (expenses: Expense[]) => {
  const now = new Date();
  const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
  const startOfLastWeek = subDays(startOfThisWeek, 7);
  
  const expensesOnly = expenses.filter(e => e.type === 'EXPENSE' || !e.type);
  
  const thisWeek = expensesOnly.filter(e => new Date(e.date) >= startOfThisWeek).reduce((sum, e) => sum + e.amount, 0);
  const lastWeek = expensesOnly.filter(e => {
    const d = new Date(e.date);
    return d >= startOfLastWeek && d < startOfThisWeek;
  }).reduce((sum, e) => sum + e.amount, 0);

  const diff = thisWeek - lastWeek;
  const diffPct = lastWeek === 0 ? 0 : Math.round((diff / lastWeek) * 100);

  return { thisWeek, lastWeek, diff, diffPct };
};

export const getLast30DaysSpend = (expenses: Expense[]) => {
  const result = [];
  const today = new Date();
  const expensesOnly = expenses.filter(e => e.type === 'EXPENSE' || !e.type);
  for (let i = 29; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const spentToday = expensesOnly.filter(e => e.date.startsWith(dateStr)).reduce((sum, e) => sum + e.amount, 0);
    result.push({
      date: d,
      noSpend: spentToday === 0
    });
  }
  return result;
};
