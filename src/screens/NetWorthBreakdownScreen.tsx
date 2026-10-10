import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppStore } from "../state/AppStore";
import { useAccountsQuery, useGoalsQuery, useInvestmentsQuery, useExpensesQuery, useDebtsQuery } from "../state/queries";
import { useFinance } from "../utils/useFinance";
import { calculateNetWorth, calculateAccountBalance } from "../utils/finance";
import { computeDynamicPFBalance } from "../utils/pfCalculator";
import { useTheme } from "../state/ThemeContext";
import { PressableScale } from "../components/PressableScale";
import type { ThemeColors } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";

const createStyles = (c: ThemeColors, isDark: boolean) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.md, backgroundColor: c.surfaceElevated, borderRadius: Radius.pill },
  title: { color: c.text, fontSize: 24, fontWeight: "800" },
  
  nwCard: { backgroundColor: c.primary, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.xl, alignItems: "center" },
  nwLabel: { color: isDark ? c.primaryText : "#1C2B28", fontSize: FontSize.small, fontWeight: "700", letterSpacing: 1.5, marginBottom: 4 },
  nwValue: { color: isDark ? c.primaryText : "#000000", fontSize: 42, fontWeight: "800" },
  
  sectionTitle: { color: c.textTertiary, fontSize: FontSize.small, fontWeight: "700", letterSpacing: 1, marginBottom: Spacing.md, marginTop: Spacing.lg },
  
  card: { backgroundColor: c.cardBackground, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: c.cardBorder },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { color: c.text, fontSize: FontSize.body, fontWeight: "600" },
  value: { color: c.text, fontSize: FontSize.body, fontWeight: "700" },
  subText: { color: c.textSecondary, fontSize: FontSize.caption, marginTop: 2 },
  
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: c.divider },
  totalLabel: { color: c.text, fontSize: FontSize.subtitle, fontWeight: "800" },
  totalValueAssets: { color: c.success, fontSize: FontSize.subtitle, fontWeight: "800" },
  totalValueLiabilities: { color: c.destructive, fontSize: FontSize.subtitle, fontWeight: "800" },
});

export const NetWorthBreakdownScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { formatMoney } = useFinance();
  
  const { preferences } = useAppStore();
  const { data: accounts = [] } = useAccountsQuery();
  const { data: goals = [] } = useGoalsQuery();
  const { data: investments = [] } = useInvestmentsQuery();
  const { data: expenses = [] } = useExpensesQuery();
  const { data: debts = [] } = useDebtsQuery();

  const { netWorth, assets, liabilities, accountsTotal, investmentsActual, pfBalance, explicitDebtsTotal: calcExplicitDebts, goalLiabilities } = calculateNetWorth(accounts, goals, investments, [], expenses, preferences, debts);

  // Group accounts
  const bankAccounts = accounts.filter(a => a.type === 'BANK' || a.type === 'SAVINGS' || a.type === 'EMERGENCY_FUND');
  const cashAccounts = accounts.filter(a => a.type === 'CASH' || a.type === 'WALLET' || a.type === 'UPI_LITE');
  
  const bankTotal = bankAccounts.reduce((sum, a) => sum + calculateAccountBalance(a, expenses), 0);
  const cashTotal = cashAccounts.reduce((sum, a) => sum + calculateAccountBalance(a, expenses), 0);

  // Debts
  const explicitDebtsTotal = calcExplicitDebts || debts.reduce((sum, d) => sum + d.outstanding, 0);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.header}>
          <PressableScale onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </PressableScale>
          <Text style={styles.title}>Net Worth Breakdown</Text>
        </View>

        <View style={[styles.nwCard, !isDark && { backgroundColor: '#C8E6C9' }]}>
          <Text style={[styles.nwLabel, !isDark && { color: '#1C2B28' }]}>TOTAL NET WORTH</Text>
          <Text style={[styles.nwValue, !isDark && { color: '#000000' }]}>{formatMoney(netWorth)}</Text>
        </View>

        <Text style={styles.sectionTitle}>ASSETS (+)</Text>
        
        {/* Bank Accounts */}
        <PressableScale style={styles.card} onPress={() => navigation.navigate("Settings", { screen: "Accounts" })}>
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>Bank Accounts</Text>
              <Text style={styles.subText}>{bankAccounts.length} accounts</Text>
            </View>
            <Text style={styles.value}>{formatMoney(bankTotal)}</Text>
          </View>
        </PressableScale>

        {/* Cash & Wallets */}
        <PressableScale style={styles.card} onPress={() => navigation.navigate("Settings", { screen: "Accounts" })}>
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>Cash & Wallets</Text>
              <Text style={styles.subText}>{cashAccounts.length} accounts</Text>
            </View>
            <Text style={styles.value}>{formatMoney(cashTotal)}</Text>
          </View>
        </PressableScale>

        {/* Investments */}
        <PressableScale style={styles.card} onPress={() => navigation.navigate("Invest")}>
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>Investments</Text>
              <Text style={styles.subText}>{investments.length} portfolios</Text>
            </View>
            <Text style={styles.value}>{formatMoney(investmentsActual)}</Text>
          </View>
        </PressableScale>

        {/* Provident Fund */}
        <PressableScale style={styles.card} onPress={() => navigation.navigate("Settings", { screen: "PF" })}>
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>Provident Fund (PF)</Text>
              <Text style={styles.subText}>{preferences?.pfConfig ? "Configured" : "Not setup"}</Text>
            </View>
            <Text style={styles.value}>{formatMoney(pfBalance)}</Text>
          </View>
        </PressableScale>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Assets</Text>
          <Text style={styles.totalValueAssets}>{formatMoney(assets)}</Text>
        </View>

        <Text style={styles.sectionTitle}>LIABILITIES (-)</Text>
        
        <PressableScale style={styles.card} onPress={() => navigation.navigate("Settings", { screen: "Debt" })}>
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>Loans & Debts</Text>
              <Text style={styles.subText}>{debts.length} active debts</Text>
            </View>
            <Text style={styles.value}>{formatMoney(explicitDebtsTotal)}</Text>
          </View>
        </PressableScale>

        {/* Goal Debts (Implicit) */}
        <PressableScale style={styles.card} onPress={() => navigation.navigate("Advisor", { screen: "Goals" })}>
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>Other Liabilities (Goals)</Text>
              <Text style={styles.subText}>from goal planner</Text>
            </View>
            <Text style={styles.value}>{formatMoney(goalLiabilities)}</Text>
          </View>
        </PressableScale>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Liabilities</Text>
          <Text style={styles.totalValueLiabilities}>{formatMoney(liabilities)}</Text>
        </View>

      </ScrollView>
    </View>
  );
};
