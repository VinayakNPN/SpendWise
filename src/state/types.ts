export type ExpenseCategory =
  | "Food"
  | "Rent"
  | "Transport"
  | "Health"
  | "Entertainment"
  | "Shopping"
  | "Family"
  | "Bills"
  | "Housing"
  | "Education"
  | "Travel"
  | "Other";

export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'REFUND' | 'ADJUSTMENT' | 'INVESTMENT_CONTRIBUTION' | 'INVESTMENT_WITHDRAWAL';

export type TransactionStatus = 'CLEARED' | 'CONFIRMED' | 'PENDING' | 'REVIEW' | 'DUPLICATE' | 'DELETED';

export type Expense = {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory | string;
  date: string;
  note?: string;
  is_recurring?: boolean;
  account_id?: string;
  type?: TransactionType;
  from_account_id?: string;
  to_account_id?: string;
  status?: TransactionStatus | string;
  source?: string;
  fingerprint?: string;
  merchant_name?: string;
  reference_number?: string;
  occasion?: string;
  confidence?: number;
};

export type Investment = {
  id: string;
  name: string;
  type: "SIP" | "Mutual Fund" | "Stocks" | "FD" | "RD" | "Gold ETF" | "Liquid Fund" | "Index Fund" | "ETF" | "PF";
  monthly_amount: number;
  startDate: string;
  tenureMonths: number;
  expected_annual_return: number;
  compounding_frequency: "monthly" | "quarterly" | "yearly";
  step_up_enabled: boolean;
  step_up_rate: number;
  step_up_frequency: number;
  sip_day: number;
  notes?: string;
  goal_linked?: string;
  // Portfolio tracking (actual holdings)
  current_value?: number;
  invested_amount?: number;
};

export type GoalCategory = "Needs" | "Wants" | "Urgent";
export type GoalPriority = "Low" | "Medium" | "High";

export type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  timelineMonths: number;
  category: string;
  priority: string;
  savedAmount: number;
  createdAt: string;
  notes?: string;
  isDebt: boolean;
  completed: boolean;
  // New: linked account and contribution tracking
  account_id?: string;
  monthly_contribution?: number;
  expected_completion_date?: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthly_limit: number;
  is_fixed: boolean;
};

export type AccountType = 'SAVINGS' | 'EMERGENCY_FUND' | 'BANK' | 'WALLET' | 'UPI_LITE' | 'CASH' | 'INVESTMENT';

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  opening_balance?: number;
  target_months?: number;
  notes?: string;
  created_at: string;
  // Reconciliation fields
  actual_balance?: number;
  last_reconciled_date?: string;
};

export type Income = {
  id: string;
  source: string;
  amount: number;
  date: string;
  is_recurring: boolean;
  notes?: string;
};

export type RecurringPaymentFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type RecurringPaymentStatus = 'UPCOMING' | 'DUE' | 'PAID' | 'SKIPPED' | 'OVERDUE';

export type RecurringPayment = {
  id: string;
  name: string;
  amount: number;
  category: string;
  account_id?: string;
  frequency: RecurringPaymentFrequency;
  next_due: string;
  status: RecurringPaymentStatus;
  notes?: string;
  created_at: string;
};

export type Debt = {
  id: string;
  name: string;
  principal: number;
  outstanding: number;
  interest_rate: number;
  min_payment: number;
  frequency: RecurringPaymentFrequency;
  due_day: number;
  next_payment_date: string;
  notes?: string;
  created_at: string;
};

export type MerchantMapping = {
  id: string;
  merchant_name: string;
  category: string;
  account_id?: string;
  usage_count: number;
};

export type PFContribution = {
  id: string;
  month: string; // "YYYY-MM"
  employee_amount: number;
  employer_amount: number;
  total: number;
  created_at: string;
};

export type BudgetState = {
  monthlyIncome?: number;
  paycheckDate?: number; // 1-31
  monthlyLimit: number; // Will be deprecated in favor of sum(categories) + extra incomes, but kept for legacy compat during transition
  categoryLimits: Partial<Record<string, number>>; // Keyed by category ID now
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
};

export type ThemeMode = "light" | "dark" | "system";

export type PaymentQueueStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PaymentQueueItem = {
  id: string;
  image_uri: string;           // Local file URI of the shared image
  created_at: string;
  status: PaymentQueueStatus;
  // Parsed / user-filled fields
  name?: string;
  amount?: number;
  category?: string;
  account_id?: string;
  note?: string;
  date?: string;
  confidence?: number;         // AI parse confidence (0–100)
  // After approval, links to the created expense
  expense_id?: string;
};

export type UserPreferences = {
  dailyReminder: boolean;
  currency: "INR";
  compactMode: boolean;
  themeMode: ThemeMode;
  isPrivacyEnabled: boolean;
  biometricLock: boolean;
  dailyLimit?: number;
  pfConfig?: {
    initialBalance: number;
    monthlyContribution: number;
    contributionDay: number;
    setupDate: string;
  };
};
