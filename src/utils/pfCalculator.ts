import type { PFContribution, UserPreferences } from '../state/types';
import { differenceInMonths } from 'date-fns';

export const computeDynamicPFBalance = (pfConfig: UserPreferences['pfConfig']) => {
  if (!pfConfig) return { currentBalance: 0, initialBalance: 0, totalContributions: 0, history: [] };

  const { initialBalance, monthlyContribution, contributionDay, setupDate } = pfConfig;
  const start = new Date(setupDate);
  const now = new Date();
  
  let monthsPassed = differenceInMonths(now, start);
  
  // If the current date's day is >= contributionDay, and we haven't already counted this month in differenceInMonths
  // Let's do a more precise calculation:
  // For each month since setupDate, check if we passed the contributionDay.
  let currentBalance = initialBalance;
  let totalContributions = 0;
  const history: { date: string; amount: number; type: 'INITIAL' | 'MONTHLY'; balance: number }[] = [];

  history.push({
    date: start.toISOString(),
    amount: initialBalance,
    type: 'INITIAL',
    balance: currentBalance
  });

  // Iterate over months
  let cursor = new Date(start.getFullYear(), start.getMonth() + 1, contributionDay);
  while (cursor <= now) {
    currentBalance += monthlyContribution;
    totalContributions += monthlyContribution;
    history.push({
      date: cursor.toISOString(),
      amount: monthlyContribution,
      type: 'MONTHLY',
      balance: currentBalance
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return {
    currentBalance,
    initialBalance,
    totalContributions,
    history: history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), // Newest first
  };
};

const PF_ANNUAL_INTEREST_RATE = 8.25; // Current EPF rate

/**
 * Calculate total PF balance with compound interest
 */
export const calculatePFBalance = (contributions: PFContribution[], annualRate: number = PF_ANNUAL_INTEREST_RATE) => {
  if (contributions.length === 0) return { total: 0, totalContributed: 0, interest: 0, history: [] };

  // Sort by month ascending
  const sorted = [...contributions].sort((a, b) => a.month.localeCompare(b.month));
  const monthlyRate = annualRate / 100 / 12;

  let runningBalance = 0;
  let totalContributed = 0;
  const history: { month: string; contribution: number; interest: number; balance: number }[] = [];

  for (const contrib of sorted) {
    // Add interest on previous balance
    const monthInterest = runningBalance * monthlyRate;
    runningBalance += monthInterest;

    // Add this month's contribution
    runningBalance += contrib.total;
    totalContributed += contrib.total;

    history.push({
      month: contrib.month,
      contribution: contrib.total,
      interest: Math.round(monthInterest),
      balance: Math.round(runningBalance),
    });
  }

  // If there are months between last contribution and now, add interest for those
  if (sorted.length > 0) {
    const lastMonth = sorted[sorted.length - 1].month;
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    
    let cursor = nextMonth(lastMonth);
    while (cursor <= currentMonth && cursor !== lastMonth) {
      const monthInterest = runningBalance * monthlyRate;
      runningBalance += monthInterest;
      history.push({
        month: cursor,
        contribution: 0,
        interest: Math.round(monthInterest),
        balance: Math.round(runningBalance),
      });
      cursor = nextMonth(cursor);
    }
  }

  const interest = Math.round(runningBalance - totalContributed);

  return {
    total: Math.round(runningBalance),
    totalContributed: Math.round(totalContributed),
    interest,
    history,
  };
};

/**
 * Project future PF balance
 */
export const projectPFBalance = (
  currentBalance: number,
  monthlyContribution: number,
  yearsAhead: number,
  annualRate: number = PF_ANNUAL_INTEREST_RATE,
) => {
  const monthlyRate = annualRate / 100 / 12;
  const months = yearsAhead * 12;
  let balance = currentBalance;

  for (let i = 0; i < months; i++) {
    balance += balance * monthlyRate;
    balance += monthlyContribution;
  }

  return {
    projectedBalance: Math.round(balance),
    totalContributed: Math.round(currentBalance + monthlyContribution * months),
    totalInterest: Math.round(balance - currentBalance - monthlyContribution * months),
  };
};

function nextMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  if (mon === 12) return `${year + 1}-01`;
  return `${year}-${String(mon + 1).padStart(2, '0')}`;
}
