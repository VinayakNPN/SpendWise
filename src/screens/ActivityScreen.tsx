import React, { useMemo, useState, useRef, useEffect } from "react";
import { Keyboard, Platform, StyleSheet, Text, TextInput, View, ScrollView, FlatList } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useRoute, useNavigation } from "@react-navigation/native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { useAppStore } from "../state/AppStore";
import { useExpensesQuery, useAddExpenseMutation, useUpdateExpenseMutation, useDeleteExpenseMutation, useCategoriesQuery, useAccountsQuery } from "../state/queries";
import { schedulePushNotification } from "../services/notifications";
import { budgetSignals, formatInputMoney, parseInputMoney } from "../utils/finance";
import { useFinance } from "../utils/useFinance";
import { PressableScale } from "../components/PressableScale";
import { KeyboardSafeScreen } from "../components/KeyboardSafeScreen";
import { useTheme } from "../state/ThemeContext";
import { AddTransactionSheet } from "../components/AddTransactionSheet";
import { FilterSheet, FilterOptions } from "../components/FilterSheet";
import type { ThemeColors } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const createStyles = (c: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    section: { color: c.textTertiary, fontSize: FontSize.small + 1, letterSpacing: 1.3, fontWeight: "700", marginTop: 10 },
    title: { color: c.text, fontSize: 20.5, fontWeight: "800", marginBottom: Spacing.md },
    searchRow: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg, gap: Spacing.sm },
    searchWrap: {
      backgroundColor: c.searchBackground,
      borderRadius: Radius.md + 2,
      paddingHorizontal: Spacing.md,
      height: 46,
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    searchInput: { marginLeft: Spacing.sm, color: c.inputText, fontSize: 13, flex: 1 },
    filterBtn: { width: 46, height: 46, borderRadius: Radius.md + 2, backgroundColor: c.surfaceElevated, alignItems: "center", justifyContent: "center" },
    filterBtnActive: { backgroundColor: c.primary },
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
    fab: { position: "absolute", right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: c.fabBackground || c.primary, alignItems: "center", justifyContent: "center", elevation: 4 },
  });

export const ActivityScreen = () => {
  const route = useRoute<any>();
  const { budget } = useAppStore();
  const { data: expenses = [] } = useExpensesQuery();
  const { data: categories = [] } = useCategoriesQuery();
  const { data: accounts = [] } = useAccountsQuery();
  const { colors, isDark } = useTheme();
  const { formatMoney } = useFinance();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const styles = React.useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [typeTab, setTypeTab] = useState<string>("All");
  const [showSheet, setShowSheet] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  
  const [advFilters, setAdvFilters] = useState<FilterOptions>({
    dateRange: "All",
    minAmount: "",
    maxAmount: "",
    accountId: null,
  });


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
        .filter((e) => {
          if (typeTab === "All") return true;
          if (typeTab === "Expenses") return e.type === "EXPENSE" || !e.type;
          if (typeTab === "Income") return e.type === "INCOME";
          if (typeTab === "Self Transfers") return e.type === "TRANSFER";
          return true;
        })
        .filter((e) => {
          if (advFilters.accountId && e.account_id !== advFilters.accountId && e.to_account_id !== advFilters.accountId && e.from_account_id !== advFilters.accountId) return false;
          if (advFilters.minAmount && e.amount < Number(advFilters.minAmount)) return false;
          if (advFilters.maxAmount && e.amount > Number(advFilters.maxAmount)) return false;
          
          if (advFilters.dateRange !== "All") {
            const today = new Date();
            const txDate = new Date(e.date);
            if (advFilters.dateRange === "Today") {
              if (txDate.toDateString() !== today.toDateString()) return false;
            } else if (advFilters.dateRange === "Yesterday") {
              const yesterday = new Date(today);
              yesterday.setDate(today.getDate() - 1);
              if (txDate.toDateString() !== yesterday.toDateString()) return false;
            } else if (advFilters.dateRange === "This Week") {
              const oneWeekAgo = new Date(today);
              oneWeekAgo.setDate(today.getDate() - 7);
              if (txDate < oneWeekAgo) return false;
            } else if (advFilters.dateRange === "This Month") {
              if (txDate.getMonth() !== today.getMonth() || txDate.getFullYear() !== today.getFullYear()) return false;
            }
          }
          return true;
        })
        .filter((e) => e.name.toLowerCase().includes(query.toLowerCase()) || e.category.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [expenses, query, filter, typeTab, advFilters]
  );
  
  const hasActiveFilters = advFilters.dateRange !== "All" || advFilters.minAmount !== "" || advFilters.maxAmount !== "" || advFilters.accountId !== null;

  const getCategoryColor = (catName: string) => categories.find(c => c.name === catName)?.color || colors.primary;
  const getCategoryIcon = (catName: string) => categories.find(c => c.name === catName)?.icon || "shape-outline";

  const renderHeader = () => (
    <>
      <Text style={styles.section}>ACTIVITY</Text>
      <Text style={styles.title}>Transactions</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }} keyboardShouldPersistTaps="handled">
        {["All", "Expenses", "Income", "Self Transfers"].map(t => (
          <PressableScale key={t} onPress={() => setTypeTab(t)} style={[styles.filterChip, typeTab === t && styles.filterChipActive]}>
            <Text style={[styles.filterText, typeTab === t && styles.filterTextActive]}>{t}</Text>
          </PressableScale>
        ))}
      </ScrollView>

      <View style={styles.searchRow}>
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
        <PressableScale style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]} onPress={() => setShowFilterSheet(true)}>
          <Feather name="sliders" size={20} color={hasActiveFilters ? colors.primaryText : colors.textTertiary} />
        </PressableScale>
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

      <View style={styles.topMeta}>
        <Text style={styles.meta}>{filtered.length} transactions</Text>
        <Text style={styles.total}>{formatMoney(filtered.reduce((acc, item) => acc + item.amount, 0))}</Text>
      </View>
    </>
  );

  const renderItem = ({ item }: { item: any }) => {
    const catColor = getCategoryColor(item.category);
    const catIcon = getCategoryIcon(item.category);
    return (
      <PressableScale style={styles.row} onPress={() => navigation.navigate("TransactionDetail", { id: item.id })}>
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
          <Text style={[styles.amount, { color: item.type === "INCOME" ? colors.success : item.type === "TRANSFER" ? colors.text : colors.primary }]}>
            {(item.type === "INCOME" ? "+" : (item.type === "TRANSFER" ? "" : "")) + formatMoney(item.amount)}
          </Text>
        </View>
      </PressableScale>
    );
  };

  return (
    <KeyboardSafeScreen keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} scrollEnabled={false}>
      <View style={[styles.card, styles.listCard, { flex: 1 }]}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="receipt-text-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.empty}>No expenses match your filters.</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 100) }}
          initialNumToRender={15}
          maxToRenderPerBatch={20}
          windowSize={10}
        />
      </View>

      <PressableScale style={[styles.fab, { bottom: Math.max(insets.bottom, 20) }]} onPress={() => setShowSheet(true)}>
        <Feather name="plus" size={28} color={colors.primaryText} />
      </PressableScale>

      <AddTransactionSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
      />
      <FilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        filters={advFilters}
        onApply={setAdvFilters}
      />
    </KeyboardSafeScreen>
  );
};
