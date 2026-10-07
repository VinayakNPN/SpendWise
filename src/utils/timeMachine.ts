import type { Account, Expense, Investment, Debt, Goal } from '../state/types';
import { calculateAccountBalance } from './finance';

/**
 * Financial Time Machine: Reconstruct what your finances looked like on any past date
 */
export const reconstructFinancialState = (
  targetDate: Date,
  accounts: Account[],
  allTransactions: Expense[],
  investments: Investment[],
  debts: Debt[],
  goals: Goal[],
) => {
  const target = targetDate.getTime();

  // Filter transactions up to and including the target date
  const transactionsAtDate = allTransactions.filter(t => new Date(t.date).getTime() <= target);

  // Account balances at that date
  const accountBalances = accounts.map(acc => ({
    id: acc.id,
    name: acc.name,
    type: acc.type,
    balance: calculateAccountBalance(acc, transactionsAtDate),
  }));

  const totalCash = accountBalances.reduce((sum, a) => sum + a.balance, 0);

  // Investments: estimate invested amount at that date
  // Simple: count months from start to target date × monthly amount
  const investmentState = investments.map(inv => {
    const startDate = new Date(inv.startDate);
    if (startDate.getTime() > target) {
      return { ...inv, estimatedValue: 0, monthsActive: 0 };
    }
    const monthsActive = Math.max(0, Math.floor((target - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));
    const estimatedInvested = inv.monthly_amount * monthsActive;
    return { id: inv.id, name: inv.name, type: inv.type, estimatedValue: estimatedInvested, monthsActive };
  });
  const totalInvested = investmentState.reduce((sum, i) => sum + i.estimatedValue, 0);

  // Debt: outstanding at that date (rough — just use current outstanding for now)
  const totalDebt = debts.reduce((sum, d) => sum + d.outstanding, 0);

  // Goals: check how much was saved by that date
  const goalState = goals.map(g => {
    const createdAt = new Date(g.createdAt).getTime();
    if (createdAt > target) return { ...g, savedAtDate: 0 };
    // Simple estimate: proportional based on timeline
    const totalMonths = g.timelineMonths || 12;
    const monthsElapsed = Math.max(0, Math.floor((target - createdAt) / (30.44 * 24 * 60 * 60 * 1000)));
    const proportionComplete = Math.min(1, monthsElapsed / totalMonths);
    return { id: g.id, title: g.title, savedAtDate: Math.round(g.savedAmount * proportionComplete), targetAmount: g.targetAmount };
  });

  // Spending that month
  const targetMonth = targetDate.toISOString().slice(0, 7);
  const monthSpending = transactionsAtDate
    .filter(t => t.date.startsWith(targetMonth) && (t.type === 'EXPENSE' || !t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    date: targetDate.toISOString(),
    accountBalances,
    totalCash,
    investmentState,
    totalInvested,
    totalDebt,
    netWorth: totalCash + totalInvested - totalDebt,
    goalState,
    monthSpending,
  };
};
