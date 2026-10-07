import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import {
  getAllExpenses, addExpense as dbAddExpense, deleteExpense as dbDeleteExpense, updateExpense as dbUpdateExpense, undeleteExpense as dbUndeleteExpense,
  getInvestments, addInvestment as dbAddInvestment, deleteInvestment as dbDeleteInvestment, updateInvestment as dbUpdateInvestment,
  getGoals, addGoal as dbAddGoal, deleteGoal as dbDeleteGoal, updateGoal as dbUpdateGoal, addGoalContribution as dbAddGoalContribution, getGoalContributions as dbGetGoalContributions,
  getCategories, addCategory as dbAddCategory, deleteCategory as dbDeleteCategory, updateCategory as dbUpdateCategory,
  getIncomes, addIncome as dbAddIncome, deleteIncome as dbDeleteIncome, updateIncome as dbUpdateIncome,
  getAccounts, addAccount as dbAddAccount, deleteAccount as dbDeleteAccount, updateAccount as dbUpdateAccount,
  getRecurringPayments, addRecurringPayment as dbAddRecurringPayment, updateRecurringPayment as dbUpdateRecurringPayment, deleteRecurringPayment as dbDeleteRecurringPayment, markRecurringPaymentPaid as dbMarkPaid, skipRecurringPayment as dbSkipPayment,
  getDebts, addDebt as dbAddDebt, updateDebt as dbUpdateDebt, deleteDebt as dbDeleteDebt, addDebtPayment as dbAddDebtPayment, getDebtPayments as dbGetDebtPayments,
  getMerchantMappings,
  getPFContributions, addPFContribution as dbAddPF, deletePFContribution as dbDeletePF,
  getPaymentQueueItems, getPendingPaymentQueueItems, addPaymentQueueItem as dbAddQueueItem,
  updatePaymentQueueItem as dbUpdateQueueItem, approvePaymentQueueItem as dbApproveQueueItem,
  rejectPaymentQueueItem as dbRejectQueueItem, deletePaymentQueueItem as dbDeleteQueueItem,
} from '../services/database';
import { Expense, Goal, Investment, Category, Income, Account, RecurringPayment, Debt, PFContribution, PaymentQueueItem } from './types';


// --- EXPENSES ---
export const useExpensesQuery = () => {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: () => getAllExpenses(),
    initialData: [],
  });
};

export const useAddExpenseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id'>) => dbAddExpense(expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: any) => Alert.alert('Database Error', `Failed to add expense: ${error.message}`),
  });
};

export const useUpdateExpenseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Expense> }) => dbUpdateExpense(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: any) => Alert.alert('Database Error', `Failed to update expense: ${error.message}`),
  });
};

export const useDeleteExpenseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: any) => Alert.alert('Database Error', `Failed to delete expense: ${error.message}`),
  });
};

export const useUndeleteExpenseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbUndeleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

// --- INVESTMENTS ---
export const useInvestmentsQuery = () => {
  return useQuery({
    queryKey: ['investments'],
    queryFn: () => getInvestments(),
    initialData: [],
  });
};

export const useAddInvestmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inv: Omit<Investment, 'id'>) => dbAddInvestment(inv),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investments'] }),
    onError: (error: any) => Alert.alert('Database Error', `Failed to add investment: ${error.message}`),
  });
};

export const useUpdateInvestmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Investment> }) => dbUpdateInvestment(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investments'] }),
    onError: (error: any) => Alert.alert('Database Error', `Failed to update investment: ${error.message}`),
  });
};

export const useDeleteInvestmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeleteInvestment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investments'] }),
    onError: (error: any) => Alert.alert('Database Error', `Failed to delete investment: ${error.message}`),
  });
};

// --- GOALS ---
export const useGoalsQuery = () => {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => getGoals(),
    initialData: [],
  });
};

export const useAddGoalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goal: Omit<Goal, 'id' | 'createdAt'>) => dbAddGoal(goal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
    onError: (error: any) => Alert.alert('Database Error', `Failed to add goal: ${error.message}`),
  });
};

export const useUpdateGoalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Goal> }) => dbUpdateGoal(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
    onError: (error: any) => Alert.alert('Database Error', `Failed to update goal: ${error.message}`),
  });
};

export const useDeleteGoalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeleteGoal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
    onError: (error: any) => Alert.alert('Database Error', `Failed to delete goal: ${error.message}`),
  });
};

export const useAddGoalContributionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, amount, notes }: { goalId: string; amount: number; notes?: string }) => dbAddGoalContribution(goalId, amount, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });
};

export const useGoalContributionsQuery = (goalId: string) => {
  return useQuery({
    queryKey: ['goalContributions', goalId],
    queryFn: () => dbGetGoalContributions(goalId),
    initialData: [],
    enabled: !!goalId,
  });
};

// --- CATEGORIES ---
export const useCategoriesQuery = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
    initialData: [],
  });
};

export const useAddCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cat: Omit<Category, 'id'>) => dbAddCategory(cat),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (error: any) => Alert.alert('Database Error', `Failed to add category: ${error.message}`),
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Category> }) => dbUpdateCategory(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (error: any) => Alert.alert('Database Error', `Failed to update category: ${error.message}`),
  });
};

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (error: any) => Alert.alert('Database Error', `Failed to delete category: ${error.message}`),
  });
};

// --- INCOMES ---
export const useIncomesQuery = () => {
  return useQuery({
    queryKey: ['incomes'],
    queryFn: () => getIncomes(),
    initialData: [],
  });
};

export const useAddIncomeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inc: Omit<Income, 'id'>) => dbAddIncome(inc),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incomes'] }),
    onError: (error: any) => Alert.alert('Database Error', `Failed to add income: ${error.message}`),
  });
};

export const useUpdateIncomeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Income> }) => dbUpdateIncome(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incomes'] }),
    onError: (error: any) => Alert.alert('Database Error', `Failed to update income: ${error.message}`),
  });
};

export const useDeleteIncomeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeleteIncome(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incomes'] }),
    onError: (error: any) => Alert.alert('Database Error', `Failed to delete income: ${error.message}`),
  });
};

// --- ACCOUNTS ---
export const useAccountsQuery = () => {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => getAccounts(),
    initialData: [],
  });
};

export const useAddAccountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (acc: Omit<Account, 'id' | 'created_at'>) => dbAddAccount(acc),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    onError: (error: any) => Alert.alert('Database Error', `Failed to add account: ${error.message}`),
  });
};

export const useUpdateAccountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Account> }) => dbUpdateAccount(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    onError: (error: any) => Alert.alert('Database Error', `Failed to update account: ${error.message}`),
  });
};

export const useDeleteAccountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeleteAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    onError: (error: any) => Alert.alert('Database Error', `Failed to delete account: ${error.message}`),
  });
};

// --- RECURRING PAYMENTS ---
export const useRecurringPaymentsQuery = () => {
  return useQuery({
    queryKey: ['recurringPayments'],
    queryFn: () => getRecurringPayments(),
    initialData: [],
  });
};

export const useAddRecurringPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rp: Omit<RecurringPayment, 'id' | 'created_at'>) => dbAddRecurringPayment(rp),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurringPayments'] }),
  });
};

export const useUpdateRecurringPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<RecurringPayment> }) => dbUpdateRecurringPayment(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurringPayments'] }),
  });
};

export const useDeleteRecurringPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeleteRecurringPayment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurringPayments'] }),
  });
};

export const useMarkRecurringPaidMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount?: number }) => dbMarkPaid(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringPayments'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useSkipRecurringMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbSkipPayment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurringPayments'] }),
  });
};

// --- DEBT ---
export const useDebtsQuery = () => {
  return useQuery({
    queryKey: ['debts'],
    queryFn: () => getDebts(),
    initialData: [],
  });
};

export const useAddDebtMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (debt: Omit<Debt, 'id' | 'created_at'>) => dbAddDebt(debt),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debts'] }),
  });
};

export const useUpdateDebtMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Debt> }) => dbUpdateDebt(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debts'] }),
  });
};

export const useDeleteDebtMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeleteDebt(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debts'] }),
  });
};

export const useAddDebtPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ debtId, amount, notes }: { debtId: string; amount: number; notes?: string }) => dbAddDebtPayment(debtId, amount, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debts'] }),
  });
};

export const useDebtPaymentsQuery = (debtId: string) => {
  return useQuery({
    queryKey: ['debtPayments', debtId],
    queryFn: () => dbGetDebtPayments(debtId),
    initialData: [],
    enabled: !!debtId,
  });
};

// --- MERCHANT MAPPINGS ---
export const useMerchantMappingsQuery = () => {
  return useQuery({
    queryKey: ['merchantMappings'],
    queryFn: () => getMerchantMappings(),
    initialData: [],
  });
};

// --- PF CONTRIBUTIONS ---
export const usePFContributionsQuery = () => {
  return useQuery({
    queryKey: ['pfContributions'],
    queryFn: () => getPFContributions(),
    initialData: [],
  });
};

export const useAddPFContributionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<PFContribution, 'id' | 'created_at'>) => dbAddPF(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pfContributions'] }),
  });
};

export const useDeletePFContributionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeletePF(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pfContributions'] }),
  });
};

// --- PAYMENT QUEUE ---

export const usePaymentQueueQuery = () => {
  return useQuery({
    queryKey: ['paymentQueue'],
    queryFn: () => getPaymentQueueItems(),
    initialData: [],
  });
};

export const usePendingPaymentQueueQuery = () => {
  return useQuery({
    queryKey: ['paymentQueue', 'pending'],
    queryFn: () => getPendingPaymentQueueItems(),
    initialData: [],
  });
};

export const useAddPaymentQueueItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageUri: string) => dbAddQueueItem(imageUri),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paymentQueue'] }),
    onError: (error: any) => Alert.alert('Error', `Failed to queue receipt: ${error.message}`),
  });
};

export const useUpdatePaymentQueueItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<PaymentQueueItem> }) =>
      dbUpdateQueueItem(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paymentQueue'] }),
    onError: (error: any) => Alert.alert('Error', `Failed to update receipt: ${error.message}`),
  });
};

export const useApprovePaymentQueueItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ queueId, expenseData }: { queueId: string; expenseData: Omit<Expense, 'id'> }) =>
      dbApproveQueueItem(queueId, expenseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentQueue'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (error: any) => Alert.alert('Error', `Failed to approve payment: ${error.message}`),
  });
};

export const useRejectPaymentQueueItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbRejectQueueItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paymentQueue'] }),
  });
};

export const useDeletePaymentQueueItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeleteQueueItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paymentQueue'] }),
  });
};
