import React, { useMemo, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "../state/AppStore";
import { useExpensesQuery, useAddExpenseMutation, useUpdateExpenseMutation, useDeleteExpenseMutation, useCategoriesQuery } from "../state/queries";
import { schedulePushNotification } from "../services/notifications";
import { budgetSignals, formatMoney, formatInputMoney, parseInputMoney } from "../utils/finance";

export const ExpensesScreen = () => {
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { budget } = useAppStore();
  const { data: expenses = [] } = useExpensesQuery();
  const { data: categories = [] } = useCategoriesQuery();
  
  const { mutate: addExpenseMut } = useAddExpenseMutation();
  const { mutate: deleteExpenseMut } = useDeleteExpenseMutation();
  const { mutate: updateExpenseMut } = useUpdateExpenseMutation();

  const addExpense = (e: any) => addExpenseMut(e);
  const deleteExpense = (id: string) => deleteExpenseMut(id);
  const updateExpense = (id: string, patch: any) => updateExpenseMut({ id, patch });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("");
  const [naturalInput, setNaturalInput] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const nameInputRef = React.useRef<TextInput>(null);

  // Set default category when categories load
  React.useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].name);
    }
  }, [categories]);

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
    
    // Simple exact match logic based on dynamic categories
    let mappedCategory = categories[0]?.name || "Other";
    for (const cat of categories) {
      if (text.toLowerCase().includes(cat.name.toLowerCase())) {
        mappedCategory = cat.name;
        break;
      }
    }
    
    setName(parsedName);
    setAmount(String(parsedAmount));
    setCategory(mappedCategory);
  };

  const handleAdd = () => {
    if (!name || !amount || !category) return;
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

  const getCategoryColor = (catName: string) => categories.find(c => c.name === catName)?.color || "#184B43";
  const getCategoryIcon = (catName: string) => categories.find(c => c.name === catName)?.icon || "shape-outline";

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 18), paddingBottom: Math.max(insets.bottom, 40) }]}>
        <Text style={styles.section}>HISTORY</Text>
        <Text style={styles.title}>Expenses</Text>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHead}>{editingId ? "Edit expense" : "Quick add"}</Text>
            {editingId && (
              <Pressable onPress={cancelEdit} hitSlop={15}>
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
            <Pressable style={styles.parseBtn} onPress={parseNaturalInput} hitSlop={10}>
              <Text style={styles.parseText}>Auto-fill</Text>
            </Pressable>
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
            value={formatInputMoney(amount)}
            onChangeText={v => setAmount(parseInputMoney(v))}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          
          <Text style={styles.labelSmall}>SELECT CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginTop: 4 }}>
            {categories.map((c) => {
              const isActive = category === c.name;
              return (
                <Pressable 
                  key={c.id} 
                  onPress={() => setCategory(c.name)} 
                  style={[styles.chip, isActive && { backgroundColor: c.color, borderColor: c.color }]}
                  hitSlop={10}
                >
                  <MaterialCommunityIcons name={c.icon as any} size={14} color={isActive ? "#FFF" : c.color} style={{ marginRight: 6 }} />
                  <Text style={[styles.chipText, isActive && { color: "#FFF" }]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            style={[styles.saveBtn, editingId && styles.editBtn]}
            onPress={handleAdd}
          >
            <Text style={styles.saveText}>{editingId ? "Update Expense" : "Save Expense"}</Text>
          </Pressable>
        </View>

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

        <Text style={styles.labelSmall}>FILTER BY CATEGORY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Pressable onPress={() => setFilter("All")} style={[styles.filterChip, filter === "All" && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === "All" && styles.filterTextActive]}>All</Text>
          </Pressable>
          {categories.map((c) => (
            <Pressable key={c.id} onPress={() => setFilter(c.name)} style={[styles.filterChip, filter === c.name && { backgroundColor: c.color, borderColor: c.color }]}>
              <Text style={[styles.filterText, filter === c.name && styles.filterTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={[styles.card, styles.listCard]}>
          <View style={styles.topMeta}>
            <Text style={styles.meta}>{filtered.length} transactions</Text>
            <Text style={styles.total}>{formatMoney(filtered.reduce((acc, item) => acc + item.amount, 0))}</Text>
          </View>
          {filtered.map((item) => {
            const catColor = getCategoryColor(item.category);
            const catIcon = getCategoryIcon(item.category);
            return (
              <Pressable key={item.id} style={styles.row} onPress={() => startEdit(item)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={[styles.rowIcon, { backgroundColor: catColor + "20" }]}>
                    <MaterialCommunityIcons name={catIcon as any} size={18} color={catColor} />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.meta}>
                      {item.category} • {format(new Date(item.date), "dd MMM")}
                    </Text>
                  </View>
                </View>
                <View style={styles.amountActions}>
                  <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
                  <Pressable onPress={() => deleteExpense(item.id)} style={styles.deleteBtn} hitSlop={15}>
                    <Feather name="trash-2" size={14} color="#B04848" />
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
          {filtered.length === 0 && <Text style={styles.empty}>No expenses match your filters.</Text>}
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
    marginBottom: 16
  },
  searchInput: { marginLeft: 8, color: "#2A3230", fontSize: 18 / 1.4, flex: 1 },
  filterRow: { marginBottom: 16, marginTop: 4 },
  filterChip: {
    borderWidth: 1,
    borderColor: "#DCE3DF",
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: "#F8FAF9"
  },
  filterChipActive: { backgroundColor: "#184B43", borderColor: "#184B43" },
  filterText: { color: "#34403D", fontWeight: "700", fontSize: 13 },
  filterTextActive: { color: "#FFFFFF" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E6EBE8", padding: 16, marginBottom: 20 },
  cardHead: { color: "#6B7772", fontWeight: "800", marginBottom: 12, fontSize: 15 },
  nlRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nlInput: { flex: 1 },
  parseBtn: { backgroundColor: "#E4ECE8", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  parseText: { color: "#224A42", fontWeight: "800" },
  input: {
    backgroundColor: "#F2F4F3",
    color: "#1F2928",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
    fontWeight: "600"
  },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#FFF", borderWidth: 1, borderColor: "#DCE3DF", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8 },
  chipText: { color: "#34403D", fontWeight: "700", fontSize: 13 },
  saveBtn: { backgroundColor: "#184B43", borderRadius: 14, alignItems: "center", paddingVertical: 14, marginTop: 8 },
  saveText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  listCard: { paddingTop: 14 },
  topMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, paddingHorizontal: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomColor: "#EEF1EF", borderBottomWidth: 1 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  name: { color: "#1E2725", fontWeight: "700", fontSize: 15 },
  meta: { color: "#7C8984", fontSize: 13, marginTop: 2 },
  total: { color: "#102238", fontWeight: "800", fontSize: 15 },
  amountActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  amount: { color: "#184B43", fontWeight: "800", fontSize: 15 },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8E8E8",
    alignItems: "center",
    justifyContent: "center"
  },
  empty: { color: "#5E6E68", textAlign: "center", paddingVertical: 30, lineHeight: 22 },
  filterDates: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 4 },
  inputSmall: { backgroundColor: "#F2F4F3", color: "#1F2928", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, marginTop: 4 },
  labelSmall: { fontSize: 11, fontWeight: "800", color: "#8A9792", letterSpacing: 0.5 },
  clearDates: { marginLeft: 6, marginTop: 14 },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cancelText: { color: "#B04848", fontWeight: "700", fontSize: 14 },
  editBtn: { backgroundColor: "#1D5A50" }
});
