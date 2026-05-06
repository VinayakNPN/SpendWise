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
  category: ExpenseCategory;
  date: string;
  note?: string;
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
  category: GoalCategory;
  priority: GoalPriority;
  savedAmount: number;
  createdAt: string;
  notes?: string;
};

export type BudgetState = {
  monthlyLimit: number;
  monthlyIncome?: number;
  categoryLimits: Partial<Record<ExpenseCategory, number>>;
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
