import { differenceInCalendarDays, endOfMonth, isSameMonth, startOfWeek, subWeeks } from "date-fns";
import type { BudgetState, Expense } from "../state/types";

export const inCurrentMonth = (date: string) => isSameMonth(new Date(date), new Date());

export const monthlySpend = (expenses: Expense[]) =>
  expenses.filter((e) => inCurrentMonth(e.date)).reduce((acc, item) => acc + item.amount, 0);

export const categorySpend = (expenses: Expense[]) => {
  const map: Record<string, number> = {};
  for (const item of expenses.filter((e) => inCurrentMonth(e.date))) {
    map[item.category] = (map[item.category] ?? 0) + item.amount;
  }
  return map;
};

export const budgetSignals = (expenses: Expense[], budget: BudgetState) => {
  const monthSpent = monthlySpend(expenses);
  const ratio = budget.monthlyLimit ? monthSpent / budget.monthlyLimit : 0;
  const daysLeft = Math.max(0, differenceInCalendarDays(endOfMonth(new Date()), new Date()));
  const dayOfMonth = Math.max(1, new Date().getDate());
  const totalDays = new Date(endOfMonth(new Date())).getDate();
  const perDay = monthSpent / dayOfMonth;
  const idealPerDay = budget.monthlyLimit / totalDays;
  const budgetLeft = Math.max(0, budget.monthlyLimit - monthSpent);
  const safeToSpendToday = Math.max(0, Math.min(budgetLeft, (daysLeft > 0 ? budgetLeft / daysLeft : budgetLeft)));
  const paceRatio = idealPerDay ? perDay / idealPerDay : 0;
  const projected = perDay * totalDays;
  const projectedOvershoot = Math.max(0, projected - budget.monthlyLimit);
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

export const topThreeCategories = (expenses: Expense[]) => {
  const split = categorySpend(expenses);
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
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const thisWeek = expenses.filter((e) => new Date(e.date) >= thisWeekStart).reduce((a, e) => a + e.amount, 0);
  const prevWeek = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d >= prevWeekStart && d < thisWeekStart;
    })
    .reduce((a, e) => a + e.amount, 0);
  const diffPct = prevWeek > 0 ? Math.round(((thisWeek - prevWeek) / prevWeek) * 100) : 0;
  return { thisWeek, prevWeek, diffPct };
};
