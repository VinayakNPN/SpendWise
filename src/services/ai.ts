import { monthlySpend, categorySpend } from "../utils/finance";
import { Expense } from "../state/types";

export const buildAnalystReply = (prompt: string, expenses: Expense[]) => {
  const total = monthlySpend(expenses);
  const categories = categorySpend(expenses);
  const top = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
  const generic = top
    ? `Top spend area is ${top[0]} at Rs ${Math.round(top[1])}. Reduce it by 20-30% for fastest savings.`
    : "Add at least a week of expenses for deeper analysis.";
  return `Current month spend is Rs ${Math.round(total)}. ${generic} Asked: ${prompt}`;
};

export const mockOverspendingPrediction = (spent: number, monthlyBudget: number) => {
  if (!monthlyBudget) return "Set monthly budget first.";
  const ratio = spent / monthlyBudget;
  if (ratio > 1) return "At this pace you are already over the limit. Suggest savings now.";
  if (ratio > 0.8) return "You may exceed budget in 6 days. Reduce food delivery and impulse spend.";
  return "You are currently on a manageable track.";
};
