/**
 * Finance Tool Layer — Deterministic functions the AI can call.
 * The AI explains the numbers; it does NOT calculate them.
 */
import { getAllExpenses, getAccounts, getGoals, getInvestments, getIncomes, getRecurringPayments, getDebts, getPFContributions } from '../services/database';
import { calculateAccountBalance, monthlySpend, categorySpend, budgetSignals, calculateNetWorth, getCurrentBudgetCycle } from '../utils/finance';
import { calculateSafeToSpend, spendAutopsy } from '../utils/safeToSpend';
import { calculatePFBalance } from '../utils/pfCalculator';
import { calculateInvestmentProjections } from '../utils/investmentCalc';
import type { BudgetState } from '../state/types';

export type FinanceToolResult = {
  tool: string;
  data: any;
  summary: string;
};

export const financeTools = {
  getAccountBalance: (accountId: string): FinanceToolResult => {
    const accounts = getAccounts();
    const expenses = getAllExpenses();
    const account = accounts.find(a => a.id === accountId);
    if (!account) return { tool: 'getAccountBalance', data: null, summary: 'Account not found' };
    const balance = calculateAccountBalance(account, expenses);
    return { tool: 'getAccountBalance', data: { name: account.name, balance, type: account.type }, summary: `${account.name}: ₹${Math.round(balance).toLocaleString('en-IN')}` };
  },

  getAllAccountBalances: (): FinanceToolResult => {
    const accounts = getAccounts();
    const expenses = getAllExpenses();
    const balances = accounts.map(a => ({ name: a.name, type: a.type, balance: calculateAccountBalance(a, expenses) }));
    const total = balances.reduce((s, b) => s + b.balance, 0);
    return { tool: 'getAllAccountBalances', data: { accounts: balances, total }, summary: `Total across ${balances.length} accounts: ₹${Math.round(total).toLocaleString('en-IN')}` };
  },

  getMonthlySpending: (budget: BudgetState): FinanceToolResult => {
    const expenses = getAllExpenses();
    const spent = monthlySpend(expenses, budget.paycheckDate);
    const stats = budgetSignals(expenses, budget);
    return { tool: 'getMonthlySpending', data: stats, summary: `Monthly spending: ₹${Math.round(spent).toLocaleString('en-IN')} of ₹${(budget.monthlyLimit || 0).toLocaleString('en-IN')} (${Math.round(stats.ratio * 100)}%)` };
  },

  getCategorySpending: (budget: BudgetState): FinanceToolResult => {
    const expenses = getAllExpenses();
    const cats = categorySpend(expenses, budget.paycheckDate);
    return { tool: 'getCategorySpending', data: cats, summary: `Category breakdown: ${Object.entries(cats).map(([k, v]) => `${k}: ₹${Math.round(v).toLocaleString('en-IN')}`).join(', ')}` };
  },

  getUpcomingPayments: (): FinanceToolResult => {
    const payments = getRecurringPayments();
    const upcoming = payments.filter(p => p.status !== 'PAID' && p.status !== 'SKIPPED');
    const total = upcoming.reduce((s, p) => s + p.amount, 0);
    return { tool: 'getUpcomingPayments', data: upcoming, summary: `${upcoming.length} upcoming payments totalling ₹${Math.round(total).toLocaleString('en-IN')}` };
  },

  calculateSafeToSpend: (budget: BudgetState): FinanceToolResult => {
    const accounts = getAccounts();
    const expenses = getAllExpenses();
    const recurringPayments = getRecurringPayments();
    const debts = getDebts();
    const goals = getGoals();
    const result = calculateSafeToSpend(accounts, expenses, recurringPayments, debts, goals, budget);
    return { tool: 'calculateSafeToSpend', data: result, summary: `Safe to spend: ₹${Math.round(result.safeToSpend).toLocaleString('en-IN')} until ${new Date(result.untilDate).toLocaleDateString('en-IN')}` };
  },

  getNetWorth: (): FinanceToolResult => {
    const accounts = getAccounts();
    const goals = getGoals();
    const investments = getInvestments();
    const incomes = getIncomes();
    const expenses = getAllExpenses();
    const debts = getDebts();
    const result = calculateNetWorth(accounts, goals, investments, incomes, expenses, undefined, debts);
    return { tool: 'getNetWorth', data: result, summary: `Net worth: ₹${Math.round(result.netWorth).toLocaleString('en-IN')} (Assets: ₹${Math.round(result.assets).toLocaleString('en-IN')}, Liabilities: ₹${Math.round(result.liabilities).toLocaleString('en-IN')})` };
  },

  comparePeriods: (currentMonth: string, previousMonth: string): FinanceToolResult => {
    const expenses = getAllExpenses();
    const current = expenses.filter(e => e.date.startsWith(currentMonth));
    const previous = expenses.filter(e => e.date.startsWith(previousMonth));
    const result = spendAutopsy(current, previous);
    return { tool: 'comparePeriods', data: result, summary: `Spending ${result.percentChange >= 0 ? 'up' : 'down'} ${Math.abs(result.percentChange)}%: ₹${Math.round(result.currentTotal).toLocaleString('en-IN')} vs ₹${Math.round(result.previousTotal).toLocaleString('en-IN')}` };
  },

  getDebtSummary: (): FinanceToolResult => {
    const debts = getDebts();
    const totalOutstanding = debts.reduce((s, d) => s + d.outstanding, 0);
    return { tool: 'getDebtSummary', data: debts, summary: `${debts.length} debts with ₹${Math.round(totalOutstanding).toLocaleString('en-IN')} outstanding` };
  },

  getPFSummary: (): FinanceToolResult => {
    const contributions = getPFContributions();
    const result = calculatePFBalance(contributions);
    return { tool: 'getPFSummary', data: result, summary: `PF Balance: ₹${Math.round(result.total).toLocaleString('en-IN')} (Contributed: ₹${Math.round(result.totalContributed).toLocaleString('en-IN')}, Interest: ₹${Math.round(result.interest).toLocaleString('en-IN')})` };
  },

  getGoalProgress: (): FinanceToolResult => {
    const goals = getGoals().filter(g => !g.completed);
    const summary = goals.map(g => `${g.title}: ₹${Math.round(g.savedAmount).toLocaleString('en-IN')}/${Math.round(g.targetAmount).toLocaleString('en-IN')}`).join(', ');
    return { tool: 'getGoalProgress', data: goals, summary: `${goals.length} active goals: ${summary || 'None'}` };
  },
};

/**
 * Build a comprehensive financial context string for the AI.
 * Uses deterministic tools so the AI explains numbers rather than calculating them.
 */
export const buildFinancialContext = (budget: BudgetState): string => {
  const parts: string[] = [];

  try { parts.push(financeTools.getAllAccountBalances().summary); } catch (e) {}
  try { parts.push(financeTools.getMonthlySpending(budget).summary); } catch (e) {}
  try { parts.push(financeTools.calculateSafeToSpend(budget).summary); } catch (e) {}
  try { parts.push(financeTools.getNetWorth().summary); } catch (e) {}
  try { parts.push(financeTools.getUpcomingPayments().summary); } catch (e) {}
  try { parts.push(financeTools.getDebtSummary().summary); } catch (e) {}
  try { parts.push(financeTools.getGoalProgress().summary); } catch (e) {}
  try { parts.push(financeTools.getPFSummary().summary); } catch (e) {}
  try {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevDate.toISOString().slice(0, 7);
    parts.push(financeTools.comparePeriods(currentMonth, prevMonth).summary);
  } catch (e) {}

  return parts.join('\n');
};
