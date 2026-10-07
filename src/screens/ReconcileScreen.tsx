import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Keyboard, TouchableWithoutFeedback, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAccountsQuery, useExpensesQuery, useUpdateAccountMutation, useAddExpenseMutation } from "../state/queries";
import { useTheme } from "../state/ThemeContext";
import { useFinance } from "../utils/useFinance";
import { calculateAccountBalance, formatInputMoney, parseInputMoney } from "../utils/finance";
import { PressableScale } from "../components/PressableScale";
import type { ThemeColors } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: "row", alignItems: "center", padding: Spacing.md },
    title: { color: c.text, fontSize: 24, fontWeight: "800", marginLeft: Spacing.md },
    content: { padding: Spacing.lg },
    card: { backgroundColor: c.cardBackground, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: c.cardBorder, marginBottom: Spacing.xl },
    label: { color: c.textSecondary, fontSize: FontSize.small, fontWeight: "700", marginBottom: Spacing.sm },
    balance: { color: c.text, fontSize: 32, fontWeight: "800", marginBottom: Spacing.lg },
    
    inputWrap: { backgroundColor: c.inputBackground, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, flexDirection: "row", alignItems: "center" },
    currency: { color: c.textSecondary, fontSize: 24, fontWeight: "800", marginRight: Spacing.sm },
    input: { color: c.inputText, fontSize: 24, fontWeight: "800", flex: 1 },
    
    diffBox: { marginTop: Spacing.xl, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: "center" },
    diffText: { fontSize: FontSize.bodyLarge, fontWeight: "700", color: c.primaryText, textAlign: "center", marginBottom: Spacing.sm },
    diffSub: { fontSize: FontSize.small, color: c.primaryText, textAlign: "center", opacity: 0.9 },
    
    btnGroup: { marginTop: Spacing.xl, gap: Spacing.md },
    btnPrimary: { backgroundColor: c.primary, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: "center" },
    btnPrimaryText: { color: c.primaryText, fontSize: FontSize.bodyLarge, fontWeight: "700" },
    btnSecondary: { backgroundColor: c.surfaceElevated, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: "center" },
    btnSecondaryText: { color: c.text, fontSize: FontSize.bodyLarge, fontWeight: "600" },
  });

export const ReconcileScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { formatMoney } = useFinance();
  
  const { data: accounts = [] } = useAccountsQuery();
  const { data: expenses = [] } = useExpensesQuery();
  const { mutate: updateAccount } = useUpdateAccountMutation();
  const { mutate: addExpense } = useAddExpenseMutation();

  const account = accounts.find(a => a.id === route.params?.accountId);
  const [actualBalance, setActualBalance] = useState("");
  
  if (!account) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>Account not found.</Text>
      </View>
    );
  }

  const expectedBalance = calculateAccountBalance(account, expenses);
  const numActual = Number(actualBalance);
  const difference = actualBalance ? numActual - expectedBalance : 0;
  const hasDrift = Math.abs(difference) > 0.01;

  const handleMarkReconciled = () => {
    updateAccount({ id: account.id, patch: { last_reconciled_date: new Date().toISOString(), actual_balance: numActual } });
    Alert.alert("Success", "Account reconciled successfully.");
    navigation.goBack();
  };

  const handleCreateAdjustment = () => {
    addExpense({
      name: "Balance Adjustment",
      amount: Math.abs(difference),
      type: difference > 0 ? "INCOME" : "EXPENSE",
      category: "Adjustment",
      date: new Date().toISOString(),
      account_id: account.id,
      note: "Auto-created during reconciliation",
    } as any);
    updateAccount({ id: account.id, patch: { last_reconciled_date: new Date().toISOString(), actual_balance: numActual } });
    Alert.alert("Adjustment Created", "Your ledger now matches the bank.");
    navigation.goBack();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
          <PressableScale onPress={() => navigation.goBack()} hitSlop={15}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </PressableScale>
          <Text style={styles.title}>Reconcile {account.name}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.label}>Expected Ledger Balance</Text>
            <Text style={styles.balance}>{formatMoney(expectedBalance)}</Text>

            <Text style={styles.label}>Actual Bank Balance</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.inputPlaceholder}
                value={formatInputMoney(actualBalance)}
                onChangeText={v => setActualBalance(parseInputMoney(v))}
              />
            </View>

            {actualBalance ? (
              <View style={[styles.diffBox, { backgroundColor: hasDrift ? colors.warning : colors.success }]}>
                {hasDrift ? (
                  <>
                    <Text style={styles.diffText}>
                      Difference: {difference > 0 ? "+" : ""}{formatMoney(difference)}
                    </Text>
                    <Text style={styles.diffSub}>
                      Your bank has {difference > 0 ? "more" : "less"} money than the app thinks.
                    </Text>
                  </>
                ) : (
                  <Text style={styles.diffText}>Matches exactly!</Text>
                )}
              </View>
            ) : null}
          </View>

          {actualBalance ? (
            <View style={styles.btnGroup}>
              {hasDrift ? (
                <>
                  <PressableScale style={styles.btnPrimary} onPress={handleCreateAdjustment}>
                    <Text style={styles.btnPrimaryText}>Create Adjustment Transaction</Text>
                  </PressableScale>
                  <PressableScale style={styles.btnSecondary} onPress={handleMarkReconciled}>
                    <Text style={styles.btnSecondaryText}>Mark Reconciled (Ignore diff)</Text>
                  </PressableScale>
                </>
              ) : (
                <PressableScale style={styles.btnPrimary} onPress={handleMarkReconciled}>
                  <Text style={styles.btnPrimaryText}>Confirm Reconciled</Text>
                </PressableScale>
              )}
            </View>
          ) : null}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};
