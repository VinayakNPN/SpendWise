import React, { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppStore } from "../state/AppStore";
import { useExpensesQuery, useGoalsQuery, useAddGoalMutation, useUpdateGoalMutation, useDeleteGoalMutation } from "../state/queries";
import { monthlySpend, formatInputMoney, parseInputMoney } from "../utils/finance";
import { useFinance } from "../utils/useFinance";
import { PressableScale } from "../components/PressableScale";
import { useTheme } from "../state/ThemeContext";
import type { ThemeColors } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: Spacing.lg, paddingBottom: 50 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xl },
    title: { color: c.text, fontSize: 24, fontWeight: "800", marginTop: 10 },
    sub: { color: c.textSecondary, marginTop: 4, fontSize: FontSize.small + 1 },
    addBtn: { backgroundColor: c.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.lg + 2 },
    addText: { color: c.primaryText, fontWeight: "700", fontSize: FontSize.small + 1 },
    section: { color: c.textTertiary, fontSize: FontSize.small, letterSpacing: 1.3, fontWeight: "700", marginBottom: Spacing.md },
    emptyText: { color: c.textSecondary, fontStyle: "italic", marginBottom: Spacing.xl },
    card: { backgroundColor: c.cardBackground, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.cardBorder, padding: Spacing.lg, marginBottom: Spacing.md },
    cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
    cardTitle: { color: c.text, fontSize: FontSize.subtitle, fontWeight: "800" },
    cardBody: { color: c.textSecondary, lineHeight: 20, fontSize: FontSize.body },
    progressRow: { flexDirection: "row", alignItems: "center", marginTop: Spacing.md, marginBottom: Spacing.lg },
    progressBar: { flex: 1, height: 6, backgroundColor: c.progressTrack, borderRadius: 3, overflow: "hidden" },
    progressFill: { height: "100%", backgroundColor: c.primary },
    progressPct: { marginLeft: 10, fontSize: FontSize.small, fontWeight: "700", color: c.textSecondary },
    cardActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: c.divider, paddingTop: Spacing.md },
    actionRow: { flexDirection: "row", alignItems: "center" },
    actionLabel: { color: c.textTertiary, fontSize: FontSize.small, fontWeight: "600", marginRight: Spacing.sm },
    saveInput: { backgroundColor: c.inputBackground, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, width: 80, fontWeight: "700", color: c.primary },
    completeBtn: { padding: 6 },
    completeBtnText: { color: c.primary, fontWeight: "700", fontSize: FontSize.small + 1 },
    sipBtn: { backgroundColor: c.primaryMuted, alignSelf: "flex-start", paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.md, marginTop: 10 },
    sipBtnText: { color: c.primary, fontWeight: "700", fontSize: FontSize.small + 1 },
    modalOverlay: { flex: 1, backgroundColor: c.modalOverlay, justifyContent: "center", padding: Spacing.xl },
    modalCard: { backgroundColor: c.modalBackground, borderRadius: Radius.xl, padding: Spacing.xl },
    modalTitle: { fontSize: FontSize.title, fontWeight: "800", marginBottom: Spacing.lg, color: c.text },
    label: { color: c.textTertiary, fontWeight: "700", fontSize: FontSize.caption, marginBottom: 4, letterSpacing: 0.8 },
    input: { backgroundColor: c.inputBackground, borderRadius: 10, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, marginBottom: Spacing.md + 2, color: c.inputText, fontWeight: "500" },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    switchLabel: { color: c.text, fontWeight: "600", fontSize: FontSize.small + 1 },
    help: { fontSize: FontSize.caption, color: c.textTertiary, marginBottom: Spacing.lg },
    modalBtns: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
    modalBtnCancel: { padding: Spacing.md, marginRight: 10 },
    modalBtnSave: { padding: Spacing.md, paddingHorizontal: Spacing.xl, backgroundColor: c.primary, borderRadius: Radius.md },
  });

export const GoalPlannerScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { budget } = useAppStore();
  const { data: expenses = [] } = useExpensesQuery();
  const { data: goals = [] } = useGoalsQuery();
  const { mutate: addGoal } = useAddGoalMutation();
  const { mutate: updateGoal } = useUpdateGoalMutation();
  const { mutate: deleteGoal } = useDeleteGoalMutation();
  const { colors } = useTheme();
  const { formatMoney } = useFinance();

  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [months, setMonths] = useState("");
  const [isDebt, setIsDebt] = useState(false);

  const spent = monthlySpend(expenses);
  const disposable = Math.max(0, (budget.monthlyIncome || 0) - spent);

  const handleSave = () => {
    if (!title.trim() || !targetAmount || !months) return;
    addGoal({
      title: title.trim(),
      targetAmount: Number(targetAmount),
      timelineMonths: Number(months),
      savedAmount: 0,
      isDebt,
      completed: false,
      category: isDebt ? "Debt" : "General",
      priority: "Medium",
    });
    setTitle("");
    setTargetAmount("");
    setMonths("");
    setIsDebt(false);
    setShowForm(false);
  };

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 50) }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Goal Planner</Text>
          <Text style={styles.sub}>Track your financial targets and debts.</Text>
        </View>
        <PressableScale style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Text style={styles.addText}>+ Add Goal</Text>
        </PressableScale>
      </View>

      <Text style={styles.section}>ACTIVE GOALS</Text>
      {activeGoals.length === 0 ? (
        <Text style={styles.emptyText}>No active goals. Add one to start tracking!</Text>
      ) : (
        activeGoals.map((goal) => {
          const needPerMonth = goal.targetAmount / Math.max(1, goal.timelineMonths);
          const progress = Math.min(100, ((goal.savedAmount || 0) / goal.targetAmount) * 100);
          return (
            <View key={goal.id} style={styles.card}>
              <View style={styles.cardHead}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <PressableScale onPress={() => updateGoal({ id: goal.id, patch: { completed: true } })} style={{ marginRight: 10, padding: 4 }}>
                    <MaterialCommunityIcons name="checkbox-blank-outline" size={24} color={colors.primary} />
                  </PressableScale>
                  <Text style={styles.cardTitle}>{goal.title} {goal.isDebt && "📉"}</Text>
                </View>
                <PressableScale onPress={() => deleteGoal(goal.id)} style={{ padding: 4 }}>
                  <Feather name="trash-2" size={18} color={colors.textTertiary} />
                </PressableScale>
              </View>

              <Text style={styles.cardBody}>
                Target: {formatMoney(goal.targetAmount)} in {goal.timelineMonths} months
              </Text>
              <Text style={styles.cardBody}>
                Requires approx {formatMoney(needPerMonth)}/month
              </Text>

              <View style={styles.progressRow}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressPct}>{Math.round(progress)}%</Text>
              </View>

              <View style={styles.cardActions}>
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>Saved (₹)</Text>
                  <TextInput
                    style={styles.saveInput}
                    keyboardType="numeric"
                    value={goal.savedAmount ? formatInputMoney(String(goal.savedAmount)) : ""}
                    onChangeText={(val) => updateGoal({ id: goal.id, patch: { savedAmount: Number(parseInputMoney(val) || 0) } })}
                  />
                </View>
              </View>

              {!goal.isDebt && (
                <PressableScale
                  style={styles.sipBtn}
                  onPress={() => navigation.navigate("Invest", { prefillGoal: goal })}
                >
                  <Text style={styles.sipBtnText}>Convert to SIP</Text>
                </PressableScale>
              )}
            </View>
          );
        })
      )}

      {completedGoals.length > 0 && (
        <>
          <Text style={[styles.section, { marginTop: 24 }]}>COMPLETED GOALS 🎉</Text>
          {completedGoals.map((goal) => (
            <View key={goal.id} style={[styles.card, { opacity: 0.6 }]}>
              <View style={styles.cardHead}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <PressableScale onPress={() => updateGoal({ id: goal.id, patch: { completed: false } })} style={{ marginRight: 10, padding: 4 }}>
                    <MaterialCommunityIcons name="checkbox-marked" size={24} color={colors.primary} />
                  </PressableScale>
                  <Text style={[styles.cardTitle, { textDecorationLine: "line-through", color: colors.textTertiary }]}>{goal.title}</Text>
                </View>
                <PressableScale onPress={() => deleteGoal(goal.id)} style={{ padding: 4 }}>
                  <Feather name="trash-2" size={18} color={colors.textTertiary} />
                </PressableScale>
              </View>
              <Text style={styles.cardBody}>Successfully reached {formatMoney(goal.targetAmount)}!</Text>
            </View>
          ))}
        </>
      )}

      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Goal</Text>

            <Text style={styles.label}>Goal Title</Text>
            <TextInput style={styles.input} placeholder="e.g. Buy a Laptop" placeholderTextColor={colors.inputPlaceholder} value={title} onChangeText={setTitle} />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Target Amount (₹)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={formatInputMoney(targetAmount)} onChangeText={(v) => setTargetAmount(parseInputMoney(v))} placeholder="e.g. 50000" placeholderTextColor={colors.inputPlaceholder} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Timeline (Months)</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="e.g. 12" placeholderTextColor={colors.inputPlaceholder} value={months} onChangeText={setMonths} />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Is this a Debt/Loan repayment?</Text>
              <Switch value={isDebt} onValueChange={setIsDebt} trackColor={{ true: colors.primary, false: colors.switchTrackOff }} thumbColor={colors.switchThumb} />
            </View>
            <Text style={styles.help}>Debts are subtracted from your Net Worth.</Text>

            <View style={styles.modalBtns}>
              <PressableScale style={styles.modalBtnCancel} onPress={() => setShowForm(false)}>
                <Text style={{ color: colors.destructive, fontWeight: "700" }}>Cancel</Text>
              </PressableScale>
              <PressableScale style={styles.modalBtnSave} onPress={handleSave}>
                <Text style={{ color: colors.primaryText, fontWeight: "700" }}>Save Goal</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
