import type { Account, Expense } from '../state/types';
import { calculateAccountBalance } from './finance';

/**
 * Reconcile an account: compare ledger balance against actual bank balance
 */
export const reconcileAccount = (
  account: Account,
  transactions: Expense[],
  actualBalance: number,
) => {
  const ledgerBalance = calculateAccountBalance(account, transactions);
  const difference = actualBalance - ledgerBalance;

  type CauseType = 'MISSING_TRANSACTION' | 'DUPLICATE_TRANSACTION' | 'MISSING_TRANSFER' | 'INCORRECT_AMOUNT' | 'BALANCE_ADJUSTMENT';
  const possibleCauses: { type: CauseType; description: string }[] = [];

  if (difference < 0) {
    // Ledger shows more than actual → possible unrecorded expense or duplicate income
    possibleCauses.push({ type: 'MISSING_TRANSACTION', description: `Missing expense of approximately ₹${Math.abs(Math.round(difference))}` });
    possibleCauses.push({ type: 'DUPLICATE_TRANSACTION', description: 'An income or transfer-in may have been recorded twice' });
    possibleCauses.push({ type: 'MISSING_TRANSFER', description: 'An outgoing transfer may not have been recorded' });
  } else if (difference > 0) {
    // Actual shows more than ledger → possible unrecorded income
    possibleCauses.push({ type: 'MISSING_TRANSACTION', description: `Missing income of approximately ₹${Math.round(difference)}` });
    possibleCauses.push({ type: 'DUPLICATE_TRANSACTION', description: 'An expense may have been recorded twice' });
    possibleCauses.push({ type: 'INCORRECT_AMOUNT', description: 'A transaction amount may be incorrect' });
  }

  if (difference !== 0) {
    possibleCauses.push({ type: 'BALANCE_ADJUSTMENT', description: `Create a balance adjustment of ₹${Math.round(difference)}` });
  }

  return {
    ledgerBalance,
    actualBalance,
    difference,
    isReconciled: Math.abs(difference) < 1,
    possibleCauses,
  };
};

/**
 * Detect balance drift: when expected balance doesn't match stored actual balance
 */
export const detectBalanceDrift = (
  account: Account,
  transactions: Expense[],
) => {
  const expected = calculateAccountBalance(account, transactions);
  const actual = account.actual_balance;
  
  if (actual === undefined || actual === null) {
    return { hasDrift: false, expected, actual: null, drift: 0 };
  }

  const drift = Math.abs(expected - actual);
  return {
    hasDrift: drift > 1,
    expected,
    actual,
    drift,
  };
};

/**
 * Duplicate transaction detection
 */
export const findDuplicates = (
  newTx: Partial<Expense>,
  existingTxs: Expense[],
  thresholdMinutes: number = 60,
): { likelihood: number; match: Expense }[] => {
  const results: { likelihood: number; match: Expense }[] = [];

  for (const existing of existingTxs) {
    let score = 0;
    let maxScore = 0;

    // Amount match (strongest signal)
    maxScore += 40;
    if (newTx.amount && existing.amount === newTx.amount) score += 40;
    else if (newTx.amount && Math.abs(existing.amount - newTx.amount) / newTx.amount < 0.05) score += 20;

    // Merchant match
    maxScore += 25;
    if (newTx.merchant_name && existing.merchant_name) {
      const n1 = newTx.merchant_name.toLowerCase().trim();
      const n2 = existing.merchant_name.toLowerCase().trim();
      if (n1 === n2) score += 25;
      else if (n1.includes(n2) || n2.includes(n1)) score += 15;
    } else if (newTx.name && existing.name) {
      const n1 = newTx.name.toLowerCase().trim();
      const n2 = existing.name.toLowerCase().trim();
      if (n1 === n2) score += 20;
      else if (n1.includes(n2) || n2.includes(n1)) score += 10;
    }

    // Date/time proximity
    maxScore += 15;
    if (newTx.date && existing.date) {
      const diff = Math.abs(new Date(newTx.date).getTime() - new Date(existing.date).getTime());
      const diffMinutes = diff / (1000 * 60);
      if (diffMinutes < 5) score += 15;
      else if (diffMinutes < thresholdMinutes) score += 10;
      else if (diffMinutes < 24 * 60) score += 5;
    }

    // Account match
    maxScore += 10;
    if (newTx.account_id && existing.account_id === newTx.account_id) score += 10;

    // Reference number match (definitive)
    maxScore += 10;
    if (newTx.reference_number && existing.reference_number && newTx.reference_number === existing.reference_number) {
      score += 10;
    }

    const likelihood = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    if (likelihood >= 50) {
      results.push({ likelihood, match: existing });
    }
  }

  return results.sort((a, b) => b.likelihood - a.likelihood);
};
