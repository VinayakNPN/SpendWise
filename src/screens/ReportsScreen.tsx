import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../state/ThemeContext';
import { useAppStore } from '../state/AppStore';
import { useExpensesQuery, useIncomesQuery } from '../state/queries';
import { monthlySpend, categorySpend, formatMoney } from '../utils/finance';
import type { ThemeColors } from '../utils/theme';
import { Spacing, FontSize, Radius } from '../utils/theme';

const createStyles = (c: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background },
  content: { padding: Spacing.lg, paddingBottom: 50 },
  title: { color: c.text, fontSize: FontSize.display, fontWeight: "800", marginBottom: Spacing.xl },
  
  card: {
    backgroundColor: c.cardBackground,
    borderWidth: 1,
    borderColor: c.cardBorder,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: { color: c.text, fontSize: FontSize.title, fontWeight: "700", marginBottom: Spacing.md },
  
  barRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  barLabel: { color: c.text, fontWeight: "600", fontSize: FontSize.body },
  barValue: { color: c.textSecondary, fontSize: FontSize.small, fontWeight: "600" },
  barTrack: { height: 12, backgroundColor: c.border, borderRadius: 6, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 6 },
  
  statRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.sm },
  statLabel: { color: c.textSecondary, fontSize: FontSize.body, fontWeight: "500" },
  statValue: { color: c.text, fontSize: FontSize.bodyLarge, fontWeight: "700" },
  
  divider: { height: 1, backgroundColor: c.border, marginVertical: Spacing.sm },
});

export const ReportsScreen = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const { data: expenses = [] } = useExpensesQuery();
  const { data: incomes = [] } = useIncomesQuery();
  const { budget } = useAppStore();

  const currentMonthSpend = monthlySpend(expenses);
  const catSplit = categorySpend(expenses);
  
  const totalExtraIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const totalIncome = (budget.monthlyIncome || 0) + totalExtraIncome;
  
  // Previous Month Spend Approximation (Just an example, in reality we'd filter by date)
  const previousMonthSpend = monthlySpend(expenses, 1); // Need to implement date shifting in finance utils
  const momChange = currentMonthSpend - previousMonthSpend;
  const momChangePct = previousMonthSpend ? (momChange / previousMonthSpend) * 100 : 0;

  const sortedCats = Object.entries(catSplit).sort((a, b) => b[1] - a[1]);

  return (
    <ScrollView 
      style={styles.root} 
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 14) }]}
    >
      <Text style={styles.title}>Reports</Text>

      {/* Income vs Expense */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cash Flow</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Income</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>+{formatMoney(totalIncome)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Expenses</Text>
          <Text style={[styles.statValue, { color: colors.destructive }]}>-{formatMoney(currentMonthSpend)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Net Savings</Text>
          <Text style={styles.statValue}>{formatMoney(totalIncome - currentMonthSpend)}</Text>
        </View>
      </View>

      {/* Spending by Category */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top Spending Categories</Text>
        {sortedCats.slice(0, 8).map(([cat, amount], idx) => {
          const pct = currentMonthSpend > 0 ? (amount / currentMonthSpend) * 100 : 0;
          const barColors = [colors.primary, colors.healthy, colors.warning, colors.destructive, colors.text];
          
          return (
            <View key={cat} style={{ marginBottom: Spacing.md }}>
              <View style={styles.barRow}>
                <Text style={styles.barLabel}>{cat}</Text>
                <Text style={styles.barValue}>{formatMoney(amount)} ({pct.toFixed(0)}%)</Text>
              </View>
              <View style={styles.barTrack}>
                <View 
                  style={[
                    styles.barFill, 
                    { 
                      width: `${Math.min(100, Math.max(2, pct))}%`, 
                      backgroundColor: barColors[idx % barColors.length] 
                    }
                  ]} 
                />
              </View>
            </View>
          );
        })}
        {sortedCats.length === 0 && <Text style={{ color: colors.textSecondary }}>No data to show.</Text>}
      </View>

      {/* Month over Month */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Month over Month</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>This Month</Text>
          <Text style={styles.statValue}>{formatMoney(currentMonthSpend)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Last Month</Text>
          <Text style={styles.statValue}>{formatMoney(previousMonthSpend)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Change</Text>
          <Text style={[styles.statValue, { color: momChange > 0 ? colors.destructive : colors.success }]}>
            {momChange > 0 ? '+' : ''}{momChangePct.toFixed(1)}%
          </Text>
        </View>
      </View>

    </ScrollView>
  );
};
