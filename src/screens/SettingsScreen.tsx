import React from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppStore } from "../state/AppStore";
import { ExpenseCategory } from "../state/types";

const categoryMeta: { key: ExpenseCategory; icon: string; bg: string; color: string }[] = [
  { key: "Food", icon: "food-outline", bg: "#F5E8D9", color: "#C78C4D" },
  { key: "Rent", icon: "home-outline", bg: "#EAF0EC", color: "#577A67" },
  { key: "Transport", icon: "car-outline", bg: "#E8EEF5", color: "#4F7AA4" },
  { key: "Health", icon: "heart-outline", bg: "#FCE8E8", color: "#D45A5A" },
  { key: "Entertainment", icon: "television-classic", bg: "#EFE7F8", color: "#875DB1" },
  { key: "Shopping", icon: "shopping-outline", bg: "#FCE9E2", color: "#D36D4B" },
  { key: "Sapna", icon: "star-outline", bg: "#E8EDFA", color: "#6176B7" },
  { key: "Other", icon: "shape-outline", bg: "#EBEEF1", color: "#61738A" }
];

export const SettingsScreen = () => {
  const { budget, setBudget, preferences, setPreferences } = useAppStore();
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.section}>PREFERENCES</Text>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.labelMain}>Monthly budget</Text>
      <View style={styles.bigInputWrap}>
        <Text style={styles.currency}>₹</Text>
        <TextInput
          style={styles.bigInput}
          keyboardType="numeric"
          value={String(budget.monthlyLimit)}
          onChangeText={(value) => setBudget({ ...budget, monthlyLimit: Number(value || "0") })}
        />
      </View>
      <Text style={styles.help}>Used across all categories to trigger 70/90/100% alerts.</Text>

      <Text style={styles.labelMain}>Category budgets</Text>
      {categoryMeta.map((item) => (
        <View key={item.key} style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
            <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} />
          </View>
          <Text style={styles.catText}>{item.key}</Text>
          <View style={styles.valueWrap}>
            <Text style={styles.valueCurrency}>₹</Text>
            <TextInput
              style={styles.valueInput}
              keyboardType="numeric"
              value={String(budget.categoryLimits[item.key] ?? 0)}
              onChangeText={(value) =>
                setBudget({
                  ...budget,
                  categoryLimits: { ...budget.categoryLimits, [item.key]: Number(value || "0") }
                })
              }
            />
          </View>
        </View>
      ))}

      <Text style={styles.labelMain}>Basic preferences</Text>
      <View style={styles.prefRow}>
        <Text style={styles.prefLabel}>Daily reminder</Text>
        <Switch
          value={preferences.dailyReminder}
          onValueChange={(value) => setPreferences({ ...preferences, dailyReminder: value })}
          trackColor={{ false: "#CED6D2", true: "#8BB2A9" }}
          thumbColor="#FFFFFF"
        />
      </View>
      <View style={styles.prefRow}>
        <Text style={styles.prefLabel}>Compact mode</Text>
        <Switch
          value={preferences.compactMode}
          onValueChange={(value) => setPreferences({ ...preferences, compactMode: value })}
          trackColor={{ false: "#CED6D2", true: "#8BB2A9" }}
          thumbColor="#FFFFFF"
        />
      </View>
      <Text style={styles.help}>All settings are stored only in this app on your phone.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F6F5" },
  content: { padding: 14, paddingBottom: 34 },
  section: { color: "#8B9792", fontSize: 13, letterSpacing: 1.3, fontWeight: "700", marginTop: 10 },
  title: { color: "#1F2928", fontSize: 41 / 2, fontWeight: "800", marginBottom: 12 },
  labelMain: { color: "#303937", fontSize: 37 / 2, fontWeight: "700", marginTop: 6, marginBottom: 8 },
  bigInputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8E5", borderRadius: 16, paddingHorizontal: 14 },
  currency: { color: "#6F7A76", fontSize: 22, marginRight: 8 },
  bigInput: { flex: 1, height: 58, color: "#2A3230", fontSize: 36 / 2, fontWeight: "800" },
  help: { color: "#7F8C87", marginTop: 6, marginBottom: 8, fontWeight: "500" },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8E5", padding: 10, marginBottom: 8 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  catText: { color: "#2F3836", fontSize: 16 * 0.95, marginLeft: 10, width: 98, fontWeight: "600" },
  valueWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F4F2", borderRadius: 12, flex: 1, paddingHorizontal: 10 },
  valueCurrency: { color: "#8A9792", marginRight: 6, fontWeight: "600" },
  valueInput: { height: 40, flex: 1, textAlign: "right", color: "#46524E", fontWeight: "700" },
  prefRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8E5", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8 },
  prefLabel: { color: "#2D3734", fontWeight: "600" }
});
