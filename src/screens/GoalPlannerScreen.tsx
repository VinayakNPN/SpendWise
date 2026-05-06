import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAppStore } from "../state/AppStore";
import { monthlySpend } from "../utils/finance";

const options = [
  { type: "Mutual Funds", risk: "Moderate", note: "Diversified and beginner friendly over 3y+ horizon." },
  { type: "Liquid Funds", risk: "Low", note: "Emergency corpus parking with higher liquidity than FD." },
  { type: "Index Funds", risk: "Moderate", note: "Low cost broad-market approach for long-term goals." },
  { type: "Gold ETF", risk: "Moderate", note: "Inflation hedge; keep allocation limited for balance." },
  { type: "FD", risk: "Low", note: "Stable returns for fixed timeline goals with low risk." },
  { type: "RD", risk: "Low", note: "Monthly disciplined deposits with predictable maturity value." }
];

export const GoalPlannerScreen = () => {
  const navigation = useNavigation<any>();
  const { expenses, budget } = useAppStore();
  const [goalName, setGoalName] = useState("Buy a laptop");
  const [targetAmount, setTargetAmount] = useState("45000");
  const [months, setMonths] = useState("3");
  const spent = monthlySpend(expenses);

  const plan = useMemo(() => {
    const target = Number(targetAmount || "0");
    const duration = Number(months || "1");
    const needPerMonth = target / Math.max(1, duration);
    const disposable = Math.max(0, budget.monthlyLimit - spent);
    return {
      needPerMonth,
      gap: Math.max(0, needPerMonth - disposable),
      disposable
    };
  }, [targetAmount, months, budget.monthlyLimit, spent]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Goal Planner</Text>
      <Text style={styles.sub}>Separate from AI chat: this builds execution plans across savings + investment products.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Goal</Text>
        <TextInput style={styles.input} value={goalName} onChangeText={setGoalName} />
        <Text style={styles.label}>Target amount (₹)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={targetAmount} onChangeText={setTargetAmount} />
        <Text style={styles.label}>Timeline (months)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={months} onChangeText={setMonths} />
      </View>

      <View style={styles.card}>
        <Text style={styles.result}>Need ₹{Math.round(plan.needPerMonth)} / month for {goalName}</Text>
        <Text style={styles.body}>Current monthly disposable from budget: ₹{Math.round(plan.disposable)}</Text>
        <Text style={styles.body}>
          {plan.gap > 0
            ? `Shortfall ₹${Math.round(plan.gap)}. Split this between spend cuts + safe investment products below.`
            : "You are on track with current budget discipline."}
        </Text>
      </View>

      <Text style={styles.section}>Investment strategy suggestions</Text>
      {options.map((item) => (
        <Pressable 
          key={item.type} 
          style={styles.optionCard}
          onPress={() => navigation.navigate("Invest", { initialType: item.type })}
        >
          <View style={styles.row}>
            <Text style={styles.optionTitle}>{item.type}</Text>
            <Text style={styles.badge}>{item.risk}</Text>
          </View>
          <Text style={styles.body}>{item.note}</Text>
        </Pressable>
      ))}

      <Pressable style={styles.cta} onPress={() => navigation.navigate("Invest")}>
        <Text style={styles.ctaText}>Use this plan in Invest tab</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F6F5" },
  content: { padding: 16, paddingBottom: 28 },
  title: { color: "#1E2826", fontSize: 22, fontWeight: "800", marginTop: 10 },
  sub: { color: "#6F7C77", marginTop: 6, marginBottom: 12, lineHeight: 20 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8E5", padding: 12, marginBottom: 12 },
  label: { color: "#7C8984", fontWeight: "700", fontSize: 12, marginBottom: 4, letterSpacing: 0.8 },
  input: { backgroundColor: "#F1F4F2", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, color: "#1F2928" },
  result: { color: "#1D2825", fontSize: 18, fontWeight: "800", marginBottom: 6 },
  body: { color: "#4F5F5A", lineHeight: 20 },
  section: { color: "#2E3735", fontWeight: "800", marginBottom: 8 },
  optionCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8E5", borderRadius: 14, padding: 10, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  optionTitle: { color: "#25302D", fontWeight: "700" },
  badge: { color: "#184B43", fontWeight: "700" },
  cta: { backgroundColor: "#184B43", borderRadius: 12, alignItems: "center", paddingVertical: 12, marginTop: 6 },
  ctaText: { color: "#FFFFFF", fontWeight: "700" }
});
