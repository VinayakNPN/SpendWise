import { differenceInCalendarDays, endOfMonth, isSameMonth, startOfWeek, subWeeks, subDays, format } from "date-fns";
import type { BudgetState, Expense, Account, Goal, Investment, Income } from "../state/types";

export const calculateNetWorth = (accounts: Account[], goals: Goal[], projectedInvestments: any[], incomes: Income[] = []) => {
  const accountsTotal = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const investmentsTotal = projectedInvestments.reduce((sum, inv) => sum + (inv.currentFv || 0), 0);
  const extraIncomesTotal = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
  const assets = accountsTotal + investmentsTotal + extraIncomesTotal;
  
  const liabilities = goals
    .filter(g => g.isDebt && !g.completed)
    .reduce((sum, g) => sum + Math.max(0, g.targetAmount - (g.savedAmount || 0)), 0);
    
  return { netWorth: assets - liabilities, assets, liabilities, accountsTotal, investmentsTotal, extraIncomesTotal };
};

export const formatMoney = (val: number | string | undefined | null) => {
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
  expenses.filter((e) => inCurrentCycle(e.date, paycheckDate)).reduce((acc, item) => acc + item.amount, 0);

export const categorySpend = (expenses: Expense[], paycheckDate: number = 1) => {
  const map: Record<string, number> = {};
  for (const item of expenses.filter((e) => inCurrentCycle(e.date, paycheckDate))) {
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
  const byDay = new Set(expenses.map((e) => e.date.slice(0, 10)));
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
  
  const thisWeek = expenses.filter(e => new Date(e.date) >= startOfThisWeek).reduce((sum, e) => sum + e.amount, 0);
  const lastWeek = expenses.filter(e => {
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
  for (let i = 29; i >= 0; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const spentToday = expenses.filter(e => e.date.startsWith(dateStr)).reduce((sum, e) => sum + e.amount, 0);
    result.push({
      date: d,
      noSpend: spentToday === 0
    });
  }
  return result;
};
