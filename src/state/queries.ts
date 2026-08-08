import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import {
  getAllExpenses, addExpense as dbAddExpense, deleteExpense as dbDeleteExpense, updateExpense as dbUpdateExpense,
  getInvestments, addInvestment as dbAddInvestment, deleteInvestment as dbDeleteInvestment, updateInvestment as dbUpdateInvestment,
  getGoals, addGoal as dbAddGoal, deleteGoal as dbDeleteGoal, updateGoal as dbUpdateGoal,
  getCategories, addCategory as dbAddCategory, deleteCategory as dbDeleteCategory, updateCategory as dbUpdateCategory,
  getIncomes, addIncome as dbAddIncome, deleteIncome as dbDeleteIncome, updateIncome as dbUpdateIncome,
  getAccounts, addAccount as dbAddAccount, deleteAccount as dbDeleteAccount, updateAccount as dbUpdateAccount
} from '../services/database';
import { Expense, Goal, Investment, Category, Income, Account } from './types';

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    onError: (error) => Alert.alert('Database Error', `Failed to add expense: ${error.message}`),
  });
};

export const useUpdateExpenseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Expense> }) => dbUpdateExpense(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    onError: (error) => Alert.alert('Database Error', `Failed to update expense: ${error.message}`),
  });
};

export const useDeleteExpenseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeleteExpense(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
    onError: (error) => Alert.alert('Database Error', `Failed to delete expense: ${error.message}`),
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
    onError: (error) => Alert.alert('Database Error', `Failed to add investment: ${error.message}`),
  });
};

export const useUpdateInvestmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Investment> }) => dbUpdateInvestment(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investments'] }),
    onError: (error) => Alert.alert('Database Error', `Failed to update investment: ${error.message}`),
  });
};

export const useDeleteInvestmentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeleteInvestment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investments'] }),
    onError: (error) => Alert.alert('Database Error', `Failed to delete investment: ${error.message}`),
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
    onError: (error) => Alert.alert('Database Error', `Failed to add goal: ${error.message}`),
  });
};

export const useUpdateGoalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Goal> }) => dbUpdateGoal(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
    onError: (error) => Alert.alert('Database Error', `Failed to update goal: ${error.message}`),
  });
};

export const useDeleteGoalMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeleteGoal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
    onError: (error) => Alert.alert('Database Error', `Failed to delete goal: ${error.message}`),
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
    onError: (error) => Alert.alert('Database Error', `Failed to add category: ${error.message}`),
  });
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Category> }) => dbUpdateCategory(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (error) => Alert.alert('Database Error', `Failed to update category: ${error.message}`),
  });
};

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (error) => Alert.alert('Database Error', `Failed to delete category: ${error.message}`),
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
    onError: (error) => Alert.alert('Database Error', `Failed to add income: ${error.message}`),
  });
};

export const useUpdateIncomeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Income> }) => dbUpdateIncome(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incomes'] }),
    onError: (error) => Alert.alert('Database Error', `Failed to update income: ${error.message}`),
  });
};

export const useDeleteIncomeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeleteIncome(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incomes'] }),
    onError: (error) => Alert.alert('Database Error', `Failed to delete income: ${error.message}`),
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
    onError: (error) => Alert.alert('Database Error', `Failed to add account: ${error.message}`),
  });
};

export const useUpdateAccountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Account> }) => dbUpdateAccount(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    onError: (error) => Alert.alert('Database Error', `Failed to update account: ${error.message}`),
  });
};

export const useDeleteAccountMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => dbDeleteAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
    onError: (error) => Alert.alert('Database Error', `Failed to delete account: ${error.message}`),
  });
};
