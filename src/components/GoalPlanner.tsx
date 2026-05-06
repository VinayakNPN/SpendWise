import React, { useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppStore } from "../state/AppStore";
import { getInvestableSurplus, calculateInvestmentProjections } from "../utils/investmentCalc";
import { useSafeAreaInsets } from "react-native-safe-area-context";



export const GoalPlanner = () => {
  const insets = useSafeAreaInsets();
  const { goals, addGoal, deleteGoal, updateGoal, budget, expenses, investments } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [timelineMonths, setTimelineMonths] = useState("");
  const [category, setCategory] = useState<"Needs" | "Wants" | "Urgent">("Needs");

  const surplus = getInvestableSurplus(budget, expenses);
  
  const projectedInvestments = investments.map(calculateInvestmentProjections);
  const totalCommittedMonthly = projectedInvestments.reduce((acc, inv) => acc + inv.monthly_amount, 0);
  const availableSurplus = Math.max(0, surplus - totalCommittedMonthly);

  const handleSave = () => {
    if (!title || !targetAmount || !timelineMonths) {
      Alert.alert("Missing Fields", "Please fill in all goal details.");
      return;
    }
    const target = Number(targetAmount);
    const months = Number(timelineMonths);
    if (target <= 0 || months <= 0) {
      Alert.alert("Invalid Input", "Amount and timeline must be greater than 0.");
      return;
    }

    addGoal({
      title,
      targetAmount: target,
      timelineMonths: months,
      category,
      priority: category === "Urgent" ? "High" : category === "Needs" ? "Medium" : "Low",
      savedAmount: 0
    });
    
    setTitle(""); setTargetAmount(""); setTimelineMonths(""); setCategory("Needs");
    setShowForm(false);
  };

  const formatMoney = (val: number) => `₹${Math.round(val).toLocaleString('en-IN')}`;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your Goals</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addText}>{showForm ? "Cancel" : "+ Add Goal"}</Text>
        </Pressable>
      </View>

      <Text style={styles.surplusText}>Available Allocation: {formatMoney(availableSurplus)}/month</Text>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.label}>GOAL TITLE</Text>
          <TextInput style={styles.input} placeholder="e.g. Repay ₹3L debt" value={title} onChangeText={setTitle} />
          
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>TARGET (₹)</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="300000" value={targetAmount} onChangeText={setTargetAmount} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.label}>MONTHS</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="24" value={timelineMonths} onChangeText={setTimelineMonths} />
            </View>
          </View>

          <Text style={styles.label}>CATEGORY</Text>
          <View style={styles.chipRow}>
            {["Urgent", "Needs", "Wants"].map((cat) => (
              <Pressable key={cat} style={[styles.chip, category === cat && styles.chipActive]} onPress={() => setCategory(cat as any)}>
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>Save Goal</Text>
          </Pressable>
        </View>
      )}

      {goals.length > 0 ? (
        <View style={styles.list}>
          {goals.map(goal => {
            const monthlyRequired = goal.targetAmount / goal.timelineMonths;
            const isFeasible = monthlyRequired <= availableSurplus;
            
            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHead}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Pressable onPress={() => deleteGoal(goal.id)}>
                    <Feather name="trash-2" size={18} color="#D32F2F" />
                  </Pressable>
                </View>
                <View style={styles.goalBody}>
                  <View>
                    <Text style={styles.metaLabel}>Target</Text>
                    <Text style={styles.metaValue}>{formatMoney(goal.targetAmount)}</Text>
                  </View>
                  <View>
                    <Text style={styles.metaLabel}>Timeline</Text>
                    <Text style={styles.metaValue}>{goal.timelineMonths} mo</Text>
                  </View>
                  <View>
                    <Text style={styles.metaLabel}>Required/mo</Text>
                    <Text style={[styles.metaValue, { color: isFeasible ? '#2D8A73' : '#D32F2F' }]}>{formatMoney(monthlyRequired)}</Text>
                  </View>
                </View>
                <View style={[styles.statusBanner, { backgroundColor: isFeasible ? '#E9F5F1' : '#FDECEC' }]}>
                  <Text style={[styles.statusText, { color: isFeasible ? '#184B43' : '#A23D3D' }]}>
                    {isFeasible ? '✅ Achievable' : '⚠️ Needs adjustment'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyText}>No goals defined yet. Set your financial priorities!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 24, paddingHorizontal: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '800', color: '#1F2827' },
  addBtn: { backgroundColor: '#184B43', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  surplusText: { fontSize: 13, color: '#5F7069', fontWeight: '600', marginBottom: 16 },
  formCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E8ECEB', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#8D9893', marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: '#F4F6F5', padding: 12, borderRadius: 10, fontSize: 15, fontWeight: '600', color: '#1C2523', marginBottom: 14 },
  row: { flexDirection: 'row' },
  chipRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#F4F6F5' },
  chipActive: { backgroundColor: '#184B43' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#6F7977' },
  chipTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: '#184B43', padding: 14, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyText: { color: '#8C9692', fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  list: { gap: 12 },
  goalCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E8ECEB', overflow: 'hidden' },
  goalHead: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, paddingBottom: 4 },
  goalTitle: { fontSize: 16, fontWeight: '700', color: '#1C2523' },
  goalBody: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 14, marginTop: 8 },
  metaLabel: { fontSize: 12, color: '#8D9893', fontWeight: '600', marginBottom: 2 },
  metaValue: { fontSize: 15, fontWeight: '700', color: '#3D4D47' },
  statusBanner: { paddingVertical: 8, alignItems: 'center' },
  statusText: { fontSize: 12, fontWeight: '700' }
});
