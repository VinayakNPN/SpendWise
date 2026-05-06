import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import type { BudgetState, ChatMessage, ChatSession, Expense, Investment, UserPreferences, Goal } from "./types";

type StoreType = {
  expenses: Expense[];
  investments: Investment[];
  goals: Goal[];
  budget: BudgetState;
  aiHistory: ChatMessage[];
  chatSessions: ChatSession[];
  preferences: UserPreferences;
  addExpense: (expense: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  setBudget: (budget: BudgetState) => void;
  addInvestment: (inv: Omit<Investment, "id">) => void;
  deleteInvestment: (id: string) => void;
  addGoal: (goal: Omit<Goal, "id" | "createdAt">) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addChatMessage: (msg: Omit<ChatMessage, "id" | "createdAt">) => void;
  clearChatHistory: () => void;
  saveChatSession: (session: Omit<ChatSession, "id" | "createdAt">) => void;
  deleteChatSession: (id: string) => void;
  clearAllSessions: () => void;
  setPreferences: (prefs: UserPreferences) => void;
};

const defaultBudget: BudgetState = {
  monthlyLimit: 30000,
  categoryLimits: {
    Food: 6000,
    Rent: 0,
    Transport: 0,
    Health: 0,
    Entertainment: 0,
    Shopping: 0,
    Sapna: 0,
    Other: 0
  }
};
const defaultPreferences: UserPreferences = {
  dailyReminder: true,
  currency: "INR",
  compactMode: false
};
const KEY = "spend-wise-store-v1";

const AppStore = createContext<StoreType | null>(null);

export const AppStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budget, setBudget] = useState<BudgetState>(defaultBudget);
  const [aiHistory, setAiHistory] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setExpenses(parsed.expenses ?? []);
      setInvestments(parsed.investments ?? []);
      setGoals(parsed.goals ?? []);
      setBudget(parsed.budget ?? defaultBudget);
      setAiHistory(parsed.aiHistory ?? []);
      setChatSessions(parsed.chatSessions ?? []);
      setPreferences(parsed.preferences ?? defaultPreferences);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(KEY, JSON.stringify({ expenses, investments, goals, budget, aiHistory, chatSessions, preferences }));
  }, [expenses, investments, goals, budget, aiHistory, chatSessions, preferences]);

  const value = useMemo<StoreType>(
    () => ({
      expenses,
      investments,
      goals,
      budget,
      aiHistory,
      chatSessions,
      preferences,
      addExpense: (expense) =>
        setExpenses((prev) => [{ ...expense, id: `${Date.now()}-${Math.random()}` }, ...prev]),
      deleteExpense: (id) => setExpenses((prev) => prev.filter((e) => e.id !== id)),
      updateExpense: (id, patch) =>
        setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e))),
      setBudget,
      addInvestment: (inv) =>
        setInvestments((prev) => [{ ...inv, id: `${format(new Date(), "T")}-${Math.random()}` }, ...prev]),
      deleteInvestment: (id) => setInvestments((prev) => prev.filter((i) => i.id !== id)),
      addGoal: (goal) =>
        setGoals((prev) => [{ ...goal, id: `${Date.now()}-${Math.random()}`, createdAt: new Date().toISOString() }, ...prev]),
      updateGoal: (id, patch) =>
        setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g))),
      deleteGoal: (id) => setGoals((prev) => prev.filter((g) => g.id !== id)),
      addChatMessage: (msg) =>
        setAiHistory((prev) => [
          ...prev,
          { ...msg, id: `${Date.now()}-${Math.random()}`, createdAt: new Date().toISOString() }
        ]),
      clearChatHistory: () => setAiHistory([]),
      saveChatSession: (session) =>
        setChatSessions((prev) => [
          { ...session, id: `${Date.now()}-${Math.random()}`, createdAt: new Date().toISOString() },
          ...prev
        ]),
      deleteChatSession: (id) => setChatSessions((prev) => prev.filter((s) => s.id !== id)),
      clearAllSessions: () => setChatSessions([]),
      setPreferences
    }),
    [expenses, investments, goals, budget, aiHistory, chatSessions, preferences]
  );

  return <AppStore.Provider value={value}>{children}</AppStore.Provider>;
};

export const useAppStore = () => {
  const store = useContext(AppStore);
  if (!store) throw new Error("useAppStore must be used in provider");
  return store;
};
