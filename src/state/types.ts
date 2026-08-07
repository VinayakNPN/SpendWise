export type ExpenseCategory =
  | "Food"
  | "Rent"
  | "Transport"
  | "Health"
  | "Entertainment"
  | "Shopping"
  | "Sapna"
  | "Other";

export type Expense = {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory | string;
  date: string;
  note?: string;
  is_recurring?: boolean;
};

export type Investment = {
  id: string;
  name: string;
  type: "SIP" | "Mutual Fund" | "Stocks" | "FD" | "RD" | "Gold ETF" | "Liquid Fund" | "Index Fund" | "ETF";
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
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthly_limit: number;
  is_fixed: boolean;
};

export type AccountType = 'SAVINGS' | 'EMERGENCY_FUND';

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  target_months?: number; // Only used for EMERGENCY_FUND (e.g. 6 months)
  notes?: string;
  created_at: string;
};

export type Income = {
  id: string;
  source: string;
  amount: number;
  date: string;
  is_recurring: boolean;
  notes?: string;
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

export type UserPreferences = {
  dailyReminder: boolean;
  currency: "INR";
  compactMode: boolean;
};
