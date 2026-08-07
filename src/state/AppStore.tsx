import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BudgetState, ChatMessage, ChatSession, UserPreferences } from "./types";

type StoreType = {
  budget: BudgetState;
  aiHistory: ChatMessage[];
  chatSessions: ChatSession[];
  preferences: UserPreferences;
  setBudget: (budget: BudgetState) => void;
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
  const [budget, setBudget] = useState<BudgetState>(defaultBudget);
  const [aiHistory, setAiHistory] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setBudget(parsed.budget ?? defaultBudget);
      setAiHistory(parsed.aiHistory ?? []);
      setChatSessions(parsed.chatSessions ?? []);
      setPreferences(parsed.preferences ?? defaultPreferences);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(KEY, JSON.stringify({ budget, aiHistory, chatSessions, preferences }));
  }, [budget, aiHistory, chatSessions, preferences]);

  const value = useMemo<StoreType>(
    () => ({
      budget,
      aiHistory,
      chatSessions,
      preferences,
      setBudget,
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
    [budget, aiHistory, chatSessions, preferences]
  );

  return <AppStore.Provider value={value}>{children}</AppStore.Provider>;
};

export const useAppStore = () => {
  const store = useContext(AppStore);
  if (!store) throw new Error("useAppStore must be used in provider");
  return store;
};
