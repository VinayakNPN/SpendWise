import React, { useMemo, useState, useRef, useEffect } from "react";
import { Keyboard, Platform, StyleSheet, Text, TextInput, View, ScrollView } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useRoute } from "@react-navigation/native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { useAppStore } from "../state/AppStore";
import { useExpensesQuery, useAddExpenseMutation, useUpdateExpenseMutation, useDeleteExpenseMutation, useCategoriesQuery, useAccountsQuery } from "../state/queries";
import { schedulePushNotification } from "../services/notifications";
import { budgetSignals, formatInputMoney, parseInputMoney } from "../utils/finance";
import { useFinance } from "../utils/useFinance";
import { PressableScale } from "../components/PressableScale";
import { KeyboardSafeScreen } from "../components/KeyboardSafeScreen";
import { useTheme } from "../state/ThemeContext";
import type { ThemeColors } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";

const createStyles = (c: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    section: { color: c.textTertiary, fontSize: FontSize.small + 1, letterSpacing: 1.3, fontWeight: "700", marginTop: 10 },
    title: { color: c.text, fontSize: 20.5, fontWeight: "800", marginBottom: Spacing.md },
    searchWrap: {
      backgroundColor: c.searchBackground,
      borderRadius: Radius.md + 2,
      paddingHorizontal: Spacing.md,
      height: 46,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.lg,
    },
    searchInput: { marginLeft: Spacing.sm, color: c.inputText, fontSize: 13, flex: 1 },
    filterRow: { marginBottom: Spacing.lg, marginTop: 4 },
    filterChip: {
      borderWidth: 1,
      borderColor: c.chipBorder,
      borderRadius: 26,
      paddingHorizontal: Spacing.lg,
      paddingVertical: 10,
      marginRight: Spacing.sm,
      backgroundColor: c.chipBackground,
    },
    filterChipActive: { backgroundColor: c.chipActiveBackground, borderColor: c.chipActiveBorder },
    filterText: { color: c.chipText, fontWeight: "700", fontSize: FontSize.small + 1 },
    filterTextActive: { color: c.chipActiveText },
    card: {
      backgroundColor: c.cardBackground,
      borderRadius: Radius.lg + 2,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    cardHead: { color: c.textSecondary, fontWeight: "800", marginBottom: Spacing.md, fontSize: FontSize.bodyLarge },
    nlRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
    nlInput: { flex: 1 },
    parseBtn: {
      backgroundColor: c.surfacePressed,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md + 2,
      paddingVertical: Spacing.md,
      marginBottom: 10,
    },
    parseText: { color: c.primary, fontWeight: "800" },
    input: {
      backgroundColor: c.inputBackground,
      color: c.inputText,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md + 2,
      paddingVertical: Spacing.md,
      marginBottom: Spacing.md,
      fontSize: FontSize.bodyLarge,
      fontWeight: "600",
    },
    amountInputWrap: {
      backgroundColor: c.inputBackground,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md + 2,
      paddingVertical: Spacing.md,
      marginBottom: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
    },
    amountCurrency: { color: c.textSecondary, fontSize: FontSize.bodyLarge, fontWeight: "800", marginRight: Spacing.sm },
    amountInput: {
      color: c.inputText,
      fontSize: FontSize.bodyLarge,
      fontWeight: "800",
      flex: 1,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.cardBackground,
      borderWidth: 1,
      borderColor: c.chipBorder,
      borderRadius: Radius.pill,
      paddingHorizontal: Spacing.md + 2,
      paddingVertical: 10,
      marginRight: Spacing.sm,
      minHeight: 44,
    },
    chipText: { color: c.chipText, fontWeight: "700", fontSize: FontSize.small + 1 },
    saveBtn: {
      backgroundColor: c.primary,
      borderRadius: Radius.md + 2,
      alignItems: "center",
      paddingVertical: Spacing.md + 2,
      marginTop: Spacing.sm,
      minHeight: 48,
      justifyContent: "center",
    },
    saveText: { color: c.primaryText, fontWeight: "700", fontSize: FontSize.bodyLarge },
    listCard: { paddingTop: Spacing.md + 2 },
    topMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.md, paddingHorizontal: 4 },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: Spacing.md + 2,
      borderBottomColor: c.borderLight,
      borderBottomWidth: 1,
    },
    rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    name: { color: c.text, fontWeight: "700", fontSize: FontSize.bodyLarge },
    meta: { color: c.textTertiary, fontSize: FontSize.small + 1, marginTop: 2 },
    total: { color: c.text, fontWeight: "800", fontSize: FontSize.bodyLarge },
    amountActions: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
    amount: { color: c.primary, fontWeight: "800", fontSize: FontSize.bodyLarge },
    deleteBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.destructiveMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyWrap: { alignItems: "center", paddingVertical: 40 },
    empty: { color: c.textSecondary, textAlign: "center", marginTop: Spacing.sm, fontSize: FontSize.body },
    labelSmall: { fontSize: FontSize.caption, fontWeight: "800", color: c.textTertiary, letterSpacing: 0.5 },
    cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
    cancelText: { color: c.destructive, fontWeight: "700", fontSize: FontSize.body },
    editBtn: { backgroundColor: c.primaryDark },
  });

export const ExpensesScreen = () => {
  const route = useRoute<any>();
  const { budget } = useAppStore();
  const { data: expenses = [] } = useExpensesQuery();
  const { data: categories = [] } = useCategoriesQuery();
  const { data: accounts = [] } = useAccountsQuery();
  const { colors, isDark } = useTheme();
  const { formatMoney } = useFinance();

  const styles = React.useMemo(() => createStyles(colors, isDark), [colors, isDark]);

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
  const [accountId, setAccountId] = useState<string>("");
  const [naturalInput, setNaturalInput] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("All");

  const amountRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const scaleAnim = useSharedValue(1);

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].name);
    }
  }, [categories]);

  useEffect(() => {
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

  useEffect(() => {
    if (route.params?.initialCategory) {
      setFilter(route.params.initialCategory);
    }
  }, [route.params?.initialCategory]);

  const filtered = useMemo(
    () =>
      expenses
        .filter((e) => (filter === "All" ? true : e.category === filter))
        .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()) || e.category.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [expenses, query, filter]
  );

  const parseNaturalInput = () => {
    const text = naturalInput.trim();
    if (!text) return;
    const amountMatch = text.match(/(\d+(\.\d+)?)/);
    if (!amountMatch) return;
    const parsedAmount = Number(amountMatch[1]);
    const parsedName = text.replace(amountMatch[0], "").trim() || "Expense";

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
    amountRef.current?.focus();
    triggerAmountAnimation();
  };

  const triggerAmountAnimation = () => {
    scaleAnim.value = withSequence(
      withSpring(1.05, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
  };

  const handleAmountChange = (val: string) => {
    setAmount(parseInputMoney(val));
    if (val.length > 0) triggerAmountAnimation();
  };

  const animatedAmountStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const handleAdd = () => {
    if (!name || !amount || !category) return;
    if (editingId) {
      updateExpense(editingId, { name, amount: Number(amount), category, account_id: accountId || undefined });
      setEditingId(null);
    } else {
      addExpense({ name, amount: Number(amount), category, date: new Date().toISOString(), note: "", account_id: accountId || undefined });
    }
    setName("");
    setAmount("");
    setNaturalInput("");
    setAccountId("");
    Keyboard.dismiss();
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setAmount(String(item.amount));
    setCategory(item.category);
    setAccountId(item.account_id || "");
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setAmount("");
    setNaturalInput("");
    setAccountId("");
    Keyboard.dismiss();
  };

  const getCategoryColor = (catName: string) => categories.find(c => c.name === catName)?.color || colors.primary;
  const getCategoryIcon = (catName: string) => categories.find(c => c.name === catName)?.icon || "shape-outline";

  return (
    <KeyboardSafeScreen keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <Text style={styles.section}>HISTORY</Text>
      <Text style={styles.title}>Expenses</Text>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHead}>{editingId ? "Edit expense" : "Quick add"}</Text>
          {editingId && (
            <PressableScale onPress={cancelEdit} hitSlop={15}>
              <Text style={styles.cancelText}>Cancel</Text>
            </PressableScale>
          )}
        </View>
        <View style={styles.nlRow}>
          <TextInput
            placeholder="Try: Swiggy 340"
            placeholderTextColor={colors.inputPlaceholder}
            value={naturalInput}
            onChangeText={setNaturalInput}
            style={[styles.input, styles.nlInput]}
            returnKeyType="done"
            onSubmitEditing={parseNaturalInput}
          />
          <PressableScale style={styles.parseBtn} onPress={parseNaturalInput} hitSlop={10}>
            <Text style={styles.parseText}>Auto-fill</Text>
          </PressableScale>
        </View>

        <TextInput
          ref={nameRef}
          placeholder="Name"
          placeholderTextColor={colors.inputPlaceholder}
          value={name}
          onChangeText={setName}
          style={styles.input}
          returnKeyType="next"
          onSubmitEditing={() => amountRef.current?.focus()}
          blurOnSubmit={false}
        />
        
        <Animated.View style={[styles.amountInputWrap, animatedAmountStyle]}>
          <Text style={styles.amountCurrency}>₹</Text>
          <TextInput
            ref={amountRef}
            placeholder="0"
            placeholderTextColor={colors.inputPlaceholder}
            keyboardType="numeric"
            value={formatInputMoney(amount)}
            onChangeText={handleAmountChange}
            style={styles.amountInput}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
        </Animated.View>

        <Text style={styles.labelSmall}>SELECT CATEGORY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginTop: 4 }} keyboardShouldPersistTaps="handled">
          {categories.map((c) => {
            const isActive = category === c.name;
            return (
              <PressableScale
                key={c.id}
                onPress={() => setCategory(c.name)}
                style={[styles.chip, isActive && { backgroundColor: c.color, borderColor: c.color }]}
              >
                <MaterialCommunityIcons name={c.icon as any} size={14} color={isActive ? "#FFF" : c.color} style={{ marginRight: 6 }} />
                <Text style={[styles.chipText, isActive && { color: "#FFF" }]}>{c.name}</Text>
              </PressableScale>
            );
          })}
        </ScrollView>

        {accounts.length > 0 && (
          <>
            <Text style={styles.labelSmall}>SELECT ACCOUNT (OPTIONAL)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginTop: 4 }} keyboardShouldPersistTaps="handled">
              <PressableScale
                onPress={() => setAccountId("")}
                style={[styles.chip, !accountId && { backgroundColor: colors.borderLight }]}
              >
                <Text style={styles.chipText}>None</Text>
              </PressableScale>
              {accounts.map((a) => {
                const isActive = accountId === a.id;
                return (
                  <PressableScale
                    key={a.id}
                    onPress={() => setAccountId(a.id)}
                    style={[styles.chip, isActive && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  >
                    <MaterialCommunityIcons name="bank-outline" size={14} color={isActive ? "#FFF" : colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.chipText, isActive && { color: "#FFF" }]}>{a.name}</Text>
                  </PressableScale>
                );
              })}
            </ScrollView>
          </>
        )}

        <PressableScale style={[styles.saveBtn, editingId && styles.editBtn]} onPress={handleAdd}>
          <Text style={styles.saveText}>{editingId ? "Update Expense" : "Save Expense"}</Text>
        </PressableScale>
      </View>

      <View style={styles.searchWrap}>
        <Feather name="search" size={18} color={colors.textTertiary} />
        <TextInput
          placeholder="Search expenses..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
      </View>

      <Text style={styles.labelSmall}>FILTER BY CATEGORY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} keyboardShouldPersistTaps="handled">
        <PressableScale onPress={() => setFilter("All")} style={[styles.filterChip, filter === "All" && styles.filterChipActive]}>
          <Text style={[styles.filterText, filter === "All" && styles.filterTextActive]}>All</Text>
        </PressableScale>
        {categories.map((c) => (
          <PressableScale key={c.id} onPress={() => setFilter(c.name)} style={[styles.filterChip, filter === c.name && { backgroundColor: c.color, borderColor: c.color }]}>
            <Text style={[styles.filterText, filter === c.name && styles.filterTextActive]}>{c.name}</Text>
          </PressableScale>
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
            <PressableScale key={item.id} style={styles.row} onPress={() => startEdit(item)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.rowIcon, { backgroundColor: catColor + (isDark ? "30" : "20") }]}>
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
                <PressableScale onPress={() => deleteExpense(item.id)} style={styles.deleteBtn} hitSlop={15}>
                  <Feather name="trash-2" size={14} color={colors.destructive} />
                </PressableScale>
              </View>
            </PressableScale>
          );
        })}
        {filtered.length === 0 && (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="receipt-text-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.empty}>No expenses match your filters.</Text>
          </View>
        )}
      </View>
    </KeyboardSafeScreen>
  );
};
