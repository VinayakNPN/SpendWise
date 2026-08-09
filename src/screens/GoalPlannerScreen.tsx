import React, { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppStore } from "../state/AppStore";
import { useExpensesQuery, useGoalsQuery, useAddGoalMutation, useUpdateGoalMutation, useDeleteGoalMutation } from "../state/queries";
import { monthlySpend, formatMoney, formatInputMoney, parseInputMoney } from "../utils/finance";

export const GoalPlannerScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { budget } = useAppStore();
  const { data: expenses = [] } = useExpensesQuery();
  const { data: goals = [] } = useGoalsQuery();
  const { mutate: addGoal } = useAddGoalMutation();
  const { mutate: updateGoal } = useUpdateGoalMutation();
  const { mutate: deleteGoal } = useDeleteGoalMutation();

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
      priority: "Medium"
    });
    setTitle("");
    setTargetAmount("");
    setMonths("");
    setIsDebt(false);
    setShowForm(false);
  };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 50) }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Goal Planner</Text>
          <Text style={styles.sub}>Track your financial targets and debts.</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setShowForm(true)}>
          <Text style={styles.addText}>+ Add Goal</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>ACTIVE GOALS</Text>
      {activeGoals.length === 0 ? (
        <Text style={styles.emptyText}>No active goals. Add one to start tracking!</Text>
      ) : (
        activeGoals.map(goal => {
          const needPerMonth = goal.targetAmount / Math.max(1, goal.timelineMonths);
          const progress = Math.min(100, ((goal.savedAmount || 0) / goal.targetAmount) * 100);
          return (
            <View key={goal.id} style={styles.card}>
              <View style={styles.cardHead}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Pressable onPress={() => updateGoal({ id: goal.id, patch: { completed: true } })} style={{ marginRight: 10, padding: 4 }}>
                    <MaterialCommunityIcons name="checkbox-blank-outline" size={24} color="#184B43" />
                  </Pressable>
                  <Text style={styles.cardTitle}>{goal.title} {goal.isDebt && "📉"}</Text>
                </View>
                <Pressable onPress={() => deleteGoal(goal.id)} style={{ padding: 4 }}>
                  <Feather name="trash-2" size={18} color="#A0ABA6" />
                </Pressable>
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
                <Pressable 
                  style={styles.sipBtn}
                  onPress={() => navigation.navigate("Invest", { prefillGoal: goal })}
                >
                  <Text style={styles.sipBtnText}>Convert to SIP</Text>
                </Pressable>
              )}
            </View>
          )
        })
      )}

      {completedGoals.length > 0 && (
        <>
          <Text style={[styles.section, { marginTop: 24 }]}>COMPLETED GOALS 🎉</Text>
          {completedGoals.map(goal => (
            <View key={goal.id} style={[styles.card, { opacity: 0.6 }]}>
              <View style={styles.cardHead}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Pressable onPress={() => updateGoal({ id: goal.id, patch: { completed: false } })} style={{ marginRight: 10, padding: 4 }}>
                    <MaterialCommunityIcons name="checkbox-marked" size={24} color="#184B43" />
                  </Pressable>
                  <Text style={[styles.cardTitle, { textDecorationLine: 'line-through', color: '#8A9792' }]}>{goal.title}</Text>
                </View>
                <Pressable onPress={() => deleteGoal(goal.id)} style={{ padding: 4 }}>
                  <Feather name="trash-2" size={18} color="#A0ABA6" />
                </Pressable>
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
            <TextInput style={styles.input} placeholder="e.g. Buy a Laptop" placeholderTextColor="#7E8E88" value={title} onChangeText={setTitle} />
            
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Target Amount (₹)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={formatInputMoney(targetAmount)} onChangeText={v => setTargetAmount(parseInputMoney(v))} placeholder="e.g. 50000" placeholderTextColor="#7E8E88" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Timeline (Months)</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="e.g. 12" placeholderTextColor="#7E8E88" value={months} onChangeText={setMonths} />
              </View>
            </View>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Is this a Debt/Loan repayment?</Text>
              <Switch value={isDebt} onValueChange={setIsDebt} trackColor={{ true: '#184B43', false: '#DCE3DF' }} />
            </View>
            <Text style={styles.help}>Debts are subtracted from your Net Worth.</Text>

            <View style={styles.modalBtns}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setShowForm(false)}><Text style={{ color: "#D32F2F", fontWeight: "700" }}>Cancel</Text></Pressable>
              <Pressable style={styles.modalBtnSave} onPress={handleSave}><Text style={{ color: "#FFF", fontWeight: "700" }}>Save Goal</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F6F5" },
  content: { padding: 16, paddingBottom: 50 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { color: "#1E2826", fontSize: 24, fontWeight: "800", marginTop: 10 },
  sub: { color: "#6F7C77", marginTop: 4, fontSize: 13 },
  addBtn: { backgroundColor: "#184B43", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18 },
  addText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  
  section: { color: "#8A9792", fontSize: 12, letterSpacing: 1.3, fontWeight: "700", marginBottom: 12 },
  emptyText: { color: "#6F7C77", fontStyle: "italic", marginBottom: 20 },
  
  card: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8E5", padding: 16, marginBottom: 12 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { color: "#1D2825", fontSize: 16, fontWeight: "800" },
  cardBody: { color: "#4F5F5A", lineHeight: 20, fontSize: 14 },
  
  progressRow: { flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 16 },
  progressBar: { flex: 1, height: 6, backgroundColor: "#E9EEEB", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#2D8A73" },
  progressPct: { marginLeft: 10, fontSize: 12, fontWeight: "700", color: "#4F5F5A" },
  
  cardActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#E9EEEB", paddingTop: 12 },
  actionRow: { flexDirection: "row", alignItems: "center" },
  actionLabel: { color: "#7C8984", fontSize: 12, fontWeight: "600", marginRight: 8 },
  saveInput: { backgroundColor: "#F1F4F2", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, width: 80, fontWeight: "700", color: "#184B43" },
  
  completeBtn: { padding: 6 },
  completeBtnText: { color: "#2D8A73", fontWeight: "700", fontSize: 13 },
  
  sipBtn: { backgroundColor: "#E3EFE9", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 10 },
  sipBtnText: { color: "#184B43", fontWeight: "700", fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16 },
  label: { color: "#7C8984", fontWeight: "700", fontSize: 11, marginBottom: 4, letterSpacing: 0.8 },
  input: { backgroundColor: "#F1F4F2", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 14, color: "#1F2928", fontWeight: "500" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  switchLabel: { color: "#1F2928", fontWeight: "600", fontSize: 13 },
  help: { fontSize: 11, color: "#8A9792", marginBottom: 16 },
  modalBtns: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  modalBtnCancel: { padding: 12, marginRight: 10 },
  modalBtnSave: { padding: 12, paddingHorizontal: 20, backgroundColor: "#184B43", borderRadius: 12 }
});

