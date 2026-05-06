import React, { useMemo, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { useRoute } from "@react-navigation/native";
import { useAppStore } from "../state/AppStore";
import { ExpenseCategory } from "../state/types";
import { schedulePushNotification } from "../services/notifications";
import { budgetSignals } from "../utils/finance";

const categories: ("All" | ExpenseCategory)[] = ["All", "Food", "Rent", "Transport", "Health", "Entertainment", "Shopping", "Sapna", "Other"];


export const ExpensesScreen = () => {
  const route = useRoute<any>();
  const { expenses, addExpense, deleteExpense, updateExpense, budget } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Food");
  const [naturalInput, setNaturalInput] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | ExpenseCategory>("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const nameInputRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    if (expenses.length > 0) {
      const stats = budgetSignals(expenses, budget);
      const prevRatio = (expenses.length > 1) ? budgetSignals(expenses.slice(1), budget).ratio : 0;
      
      if (stats.ratio >= 1 && prevRatio < 1) {
        schedulePushNotification("Budget Exceeded!", "You have spent 100% of your monthly budget. Stop spending!");
      } else if (stats.ratio >= 0.9 && prevRatio < 0.9) {
        schedulePushNotification("Budget Alert (90%)", "You have reached 90% of your monthly limit. Be careful!");
      } else if (stats.ratio >= 0.7 && prevRatio < 0.7) {
        schedulePushNotification("Budget Warning (70%)", "You have reached 70% of your monthly limit.");
      }
    }
  }, [expenses.length, budget]);

  React.useEffect(() => {
    // Auto-focus name field on mount if we're not in edit mode (we'll add edit mode shortly)
    setTimeout(() => nameInputRef.current?.focus(), 100);
  }, []);

  React.useEffect(() => {
    if (route.params?.initialCategory) {
      setFilter(route.params.initialCategory);
    }
  }, [route.params?.initialCategory]);

  const filtered = useMemo(
    () =>
      expenses
        .filter((e) => (filter === "All" ? true : e.category === filter))
        .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()) || e.category.toLowerCase().includes(query.toLowerCase()))
        .filter((e) => {
          if (!startDate && !endDate) return true;
          const d = e.date.slice(0, 10);
          if (startDate && d < startDate) return false;
          if (endDate && d > endDate) return false;
          return true;
        })
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [expenses, query, filter, startDate, endDate]
  );

  const parseNaturalInput = () => {
    const text = naturalInput.trim();
    if (!text) return;
    const amountMatch = text.match(/(\d+(\.\d+)?)/);
    if (!amountMatch) return;
    const parsedAmount = Number(amountMatch[1]);
    const parsedName = text.replace(amountMatch[0], "").trim() || "Expense";
    const lower = text.toLowerCase();
    const mappedCategory: ExpenseCategory =
      lower.includes("swiggy") || lower.includes("zomato") || lower.includes("food")
        ? "Food"
        : lower.includes("uber") || lower.includes("ola") || lower.includes("metro")
          ? "Transport"
          : lower.includes("rent")
            ? "Rent"
            : lower.includes("med") || lower.includes("pharma") || lower.includes("doctor")
              ? "Health"
              : lower.includes("movie") || lower.includes("netflix")
                ? "Entertainment"
                : lower.includes("shop") || lower.includes("amazon")
                  ? "Shopping"
                  : lower.includes("sapna")
                    ? "Sapna"
                    : category;
    setName(parsedName);
    setAmount(String(parsedAmount));
    setCategory(mappedCategory);
  };

  const handleAdd = () => {
    if (!name || !amount) return;
    if (editingId) {
      updateExpense(editingId, { name, amount: Number(amount), category });
      setEditingId(null);
    } else {
      addExpense({ name, amount: Number(amount), category, date: new Date().toISOString(), note: "" });
    }
    setName("");
    setAmount("");
    Keyboard.dismiss();
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setAmount(String(item.amount));
    setCategory(item.category);
    setTimeout(() => nameInputRef.current?.focus(), 100);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setAmount("");
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Text style={styles.section}>HISTORY</Text>
        <Text style={styles.title}>Expenses</Text>

        <View style={styles.searchWrap}>
          <Feather name="search" size={18} color="#87928E" />
          <TextInput
            placeholder="Search expenses..."
            placeholderTextColor="#87928E"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {categories.map((c) => (
            <Pressable key={c} onPress={() => setFilter(c)} style={[styles.filterChip, filter === c && styles.filterChipActive]}>
              <Text style={[styles.filterText, filter === c && styles.filterTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHead}>{editingId ? "Edit expense" : "Quick add"}</Text>
            {editingId && (
              <Pressable onPress={cancelEdit}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.nlRow}>
            <TextInput
              placeholder="Try: Swiggy 340"
              placeholderTextColor="#80908A"
              value={naturalInput}
              onChangeText={setNaturalInput}
              style={[styles.input, styles.nlInput]}
            />
            <Pressable style={styles.parseBtn} onPress={parseNaturalInput}>
              <Text style={styles.parseText}>Auto-fill</Text>
            </Pressable>
          </View>
          
          <View style={styles.filterDates}>
            <View style={{ flex: 1 }}>
              <Text style={styles.labelSmall}>START DATE (YYYY-MM-DD)</Text>
              <TextInput style={styles.inputSmall} placeholder="2026-01-01" value={startDate} onChangeText={setStartDate} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.labelSmall}>END DATE (YYYY-MM-DD)</Text>
              <TextInput style={styles.inputSmall} placeholder="2026-12-31" value={endDate} onChangeText={setEndDate} />
            </View>
            {(startDate || endDate) && (
              <Pressable style={styles.clearDates} onPress={() => { setStartDate(""); setEndDate(""); }}>
                <Feather name="x-circle" size={20} color="#64748B" />
              </Pressable>
            )}
          </View>

          <TextInput 
            ref={nameInputRef}
            placeholder="Name" 
            placeholderTextColor="#64748B" 
            value={name} 
            onChangeText={setName} 
            style={styles.input} 
            returnKeyType="next"
          />
          <TextInput
            placeholder="Amount"
            placeholderTextColor="#64748B"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.filter((item) => item !== "All").map((c) => (
              <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
                <Text style={styles.chipText}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            style={[styles.saveBtn, editingId && styles.editBtn]}
            onPress={handleAdd}
          >
            <Text style={styles.saveText}>{editingId ? "Update Expense" : "Save Expense"}</Text>
          </Pressable>
        </View>

        <View style={[styles.card, styles.listCard]}>
          <View style={styles.topMeta}>
            <Text style={styles.meta}>{filtered.length} transactions</Text>
            <Text style={styles.total}>₹{filtered.reduce((acc, item) => acc + item.amount, 0)}</Text>
          </View>
          {filtered.map((item) => (
            <Pressable key={item.id} style={styles.row} onPress={() => startEdit(item)}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.category} • {format(new Date(item.date), "dd MMM")}
                </Text>
              </View>
              <View style={styles.amountActions}>
                <Text style={styles.amount}>₹{item.amount}</Text>
                <Pressable onPress={() => deleteExpense(item.id)} style={styles.deleteBtn} hitSlop={10}>
                  <Feather name="trash-2" size={14} color="#B04848" />
                </Pressable>
              </View>
            </Pressable>
          ))}
          {filtered.length === 0 && <Text style={styles.empty}>No expenses yet{"\n"}Tap + on Home to add your first one</Text>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F6F5" },
  content: { padding: 18, paddingBottom: 40 },
  section: { color: "#8B9792", fontSize: 13, letterSpacing: 1.3, fontWeight: "700", marginTop: 10 },
  title: { color: "#102238", fontSize: 41 / 2, fontWeight: "800", marginBottom: 12 },
  searchWrap: {
    backgroundColor: "#EEF1EF",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12
  },
  searchInput: { marginLeft: 8, color: "#2A3230", fontSize: 18 / 1.4, flex: 1 },
  filterRow: { marginBottom: 12 },
  filterChip: {
    borderWidth: 1,
    borderColor: "#DCE3DF",
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    backgroundColor: "#F8FAF9"
  },
  filterChipActive: { backgroundColor: "#184B43", borderColor: "#184B43" },
  filterText: { color: "#293230", fontWeight: "600" },
  filterTextActive: { color: "#FFFFFF" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E6EBE8", padding: 12, marginBottom: 12 },
  cardHead: { color: "#6B7772", fontWeight: "700", marginBottom: 8 },
  nlRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nlInput: { flex: 1 },
  parseBtn: { backgroundColor: "#E4ECE8", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 10 },
  parseText: { color: "#224A42", fontWeight: "700" },
  input: {
    backgroundColor: "#F2F4F3",
    color: "#1F2928",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10
  },
  chip: { backgroundColor: "#EFF3F1", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  chipActive: { backgroundColor: "#E3EEEA" },
  chipText: { color: "#34403D", fontWeight: "600" },
  saveBtn: { backgroundColor: "#184B43", borderRadius: 12, alignItems: "center", paddingVertical: 12, marginTop: 4 },
  saveText: { color: "#FFFFFF", fontWeight: "700" },
  listCard: { paddingTop: 10 },
  topMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomColor: "#EEF1EF", borderBottomWidth: 1 },
  name: { color: "#1E2725", fontWeight: "700" },
  meta: { color: "#7C8984", fontSize: 13 },
  total: { color: "#102238", fontWeight: "800", fontSize: 22 / 2 },
  amountActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  amount: { color: "#184B43", fontWeight: "700" },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F8E8E8",
    alignItems: "center",
    justifyContent: "center"
  },
  empty: { color: "#5E6E68", textAlign: "center", paddingVertical: 30, lineHeight: 22 },
  filterDates: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 4 },
  inputSmall: { backgroundColor: "#F2F4F3", color: "#1F2928", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, marginTop: 4 },
  labelSmall: { fontSize: 10, fontWeight: "700", color: "#64748B" },
  clearDates: { marginLeft: 6, marginTop: 14 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cancelText: { color: "#B04848", fontWeight: "700", fontSize: 13 },
  editBtn: { backgroundColor: "#1D5A50" }
});
