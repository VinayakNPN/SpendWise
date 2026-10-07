import type { Account, Expense, RecurringPayment, Debt, Goal, BudgetState } from '../state/types';
import { calculateAccountBalance, getCurrentBudgetCycle } from './finance';

/**
 * Safe-to-Spend Engine
 * Available cash - upcoming obligations - planned investments - debt payments - goal allocations - safety buffer
 */
export const calculateSafeToSpend = (
  accounts: Account[],
  transactions: Expense[],
  recurringPayments: RecurringPayment[],
  debts: Debt[],
  goals: Goal[],
  budget: BudgetState,
) => {
  const { end } = getCurrentBudgetCycle(budget.paycheckDate || 1);
  
  // Total available cash across all accounts
  const availableCash = accounts.reduce((sum, acc) => sum + calculateAccountBalance(acc, transactions), 0);

  // Upcoming obligations this cycle
  const upcomingObligations = recurringPayments
    .filter(p => p.status !== 'PAID' && p.status !== 'SKIPPED' && new Date(p.next_due) <= end)
    .reduce((sum, p) => sum + p.amount, 0);

  // Debt payments due this cycle
  const debtPayments = debts
    .filter(d => d.outstanding > 0 && d.next_payment_date && new Date(d.next_payment_date) <= end)
    .reduce((sum, d) => sum + d.min_payment, 0);

  // Goal allocations (monthly contributions for active goals)
  const goalAllocations = goals
    .filter(g => !g.completed && !g.isDebt)
    .reduce((sum, g) => sum + (g.monthly_contribution || 0), 0);

  // Safety buffer (5% of income or budget as a minimum)
  const safetyBuffer = Math.round((budget.monthlyIncome || budget.monthlyLimit || 0) * 0.05);

  const safeToSpend = Math.max(0, availableCash - upcomingObligations - debtPayments - goalAllocations - safetyBuffer);

  return {
    safeToSpend,
    untilDate: end.toISOString(),
    breakdown: {
      availableCash,
      upcomingObligations,
      debtPayments,
      goalAllocations,
      safetyBuffer,
    },
  };
};

/**
 * Spend Autopsy: explain why spending changed between periods
 */
export const spendAutopsy = (
  currentMonthExpenses: Expense[],
  previousMonthExpenses: Expense[],
) => {
  const currentTotal = currentMonthExpenses.filter(e => e.type === 'EXPENSE' || !e.type).reduce((s, e) => s + e.amount, 0);
  const previousTotal = previousMonthExpenses.filter(e => e.type === 'EXPENSE' || !e.type).reduce((s, e) => s + e.amount, 0);

  const percentChange = previousTotal > 0 ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100) : 0;

  // Category breakdown
  const currentByCat: Record<string, number> = {};
  const previousByCat: Record<string, number> = {};

  currentMonthExpenses.filter(e => e.type === 'EXPENSE' || !e.type).forEach(e => {
    currentByCat[e.category] = (currentByCat[e.category] || 0) + e.amount;
  });
  previousMonthExpenses.filter(e => e.type === 'EXPENSE' || !e.type).forEach(e => {
    previousByCat[e.category] = (previousByCat[e.category] || 0) + e.amount;
  });

  const allCategories = new Set([...Object.keys(currentByCat), ...Object.keys(previousByCat)]);
  const categoryBreakdown = Array.from(allCategories).map(cat => ({
    category: cat,
    current: currentByCat[cat] || 0,
    previous: previousByCat[cat] || 0,
    change: (currentByCat[cat] || 0) - (previousByCat[cat] || 0),
  })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  return { currentTotal, previousTotal, percentChange, categoryBreakdown };
};

/**
 * Balance Explanation: explain where money went for an account in a period
 */
export const explainBalance = (
  accountId: string,
  transactions: Expense[],
  periodDays: number = 7,
) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);

  const relevantTxs = transactions.filter(t => {
    const txDate = new Date(t.date);
    if (txDate < cutoff) return false;
    return t.account_id === accountId || t.from_account_id === accountId || t.to_account_id === accountId;
  });

  const breakdown: { name: string; amount: number; type: string }[] = [];
  
  for (const t of relevantTxs) {
    const isOutgoing = (t.type === 'EXPENSE' || !t.type) && (t.account_id === accountId || t.from_account_id === accountId);
    const isTransferOut = t.type === 'TRANSFER' && t.from_account_id === accountId;
    const isIncoming = (t.type === 'INCOME' || t.type === 'REFUND') && (t.account_id === accountId || t.to_account_id === accountId);
    const isTransferIn = t.type === 'TRANSFER' && t.to_account_id === accountId;

    if (isOutgoing || isTransferOut) {
      breakdown.push({ name: t.name, amount: -t.amount, type: t.type || 'EXPENSE' });
    } else if (isIncoming || isTransferIn) {
      breakdown.push({ name: t.name, amount: t.amount, type: t.type || 'INCOME' });
    }
  }

  breakdown.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  const totalOut = breakdown.filter(b => b.amount < 0).reduce((s, b) => s + b.amount, 0);
  const totalIn = breakdown.filter(b => b.amount > 0).reduce((s, b) => s + b.amount, 0);

  return { breakdown, totalOut, totalIn, netChange: totalIn + totalOut, periodDays };
};
