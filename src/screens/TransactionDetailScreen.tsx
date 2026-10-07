import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useExpensesQuery, useDeleteExpenseMutation } from "../state/queries";
import { useTheme } from "../state/ThemeContext";
import { useFinance } from "../utils/useFinance";
import { PressableScale } from "../components/PressableScale";
import { AddTransactionSheet } from "../components/AddTransactionSheet";
import type { ThemeColors } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: Spacing.md, paddingTop: 60, paddingBottom: 20 },
    content: { padding: Spacing.lg },
    amountCard: { alignItems: "center", marginBottom: Spacing.xl },
    amount: { fontSize: 42, fontWeight: "800", color: c.text },
    name: { fontSize: FontSize.bodyLarge, color: c.textSecondary, marginTop: Spacing.sm },
    date: { fontSize: FontSize.small, color: c.textTertiary, marginTop: 4 },
    
    section: { backgroundColor: c.cardBackground, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: c.cardBorder },
    row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: c.borderLight },
    rowLast: { borderBottomWidth: 0 },
    label: { color: c.textSecondary, fontWeight: "600", fontSize: FontSize.body },
    value: { color: c.text, fontWeight: "700", fontSize: FontSize.body },
    
    actionRow: { flexDirection: "row", justifyContent: "center", gap: Spacing.lg, marginTop: Spacing.xl },
    actionBtn: { alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 32, backgroundColor: c.cardBackground, borderWidth: 1, borderColor: c.cardBorder },
    actionText: { fontSize: FontSize.caption, color: c.textSecondary, marginTop: 8, fontWeight: "600" },
  });

export const TransactionDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { formatMoney } = useFinance();
  const { data: expenses = [] } = useExpensesQuery();
  const { mutate: deleteExpense } = useDeleteExpenseMutation();
  
  const [showEdit, setShowEdit] = useState(false);

  const txId = route.params?.id;
  const tx = expenses.find((e: any) => e.id === txId);

  if (!tx) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: colors.textSecondary }}>Transaction not found.</Text>
        <PressableScale onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </PressableScale>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        deleteExpense(tx.id);
        navigation.goBack();
      }},
    ]);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <PressableScale onPress={() => navigation.goBack()} hitSlop={15}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </PressableScale>
        <PressableScale onPress={() => setShowEdit(true)} hitSlop={15}>
          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: FontSize.bodyLarge }}>Edit</Text>
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.amountCard}>
          <Text style={[styles.amount, { color: tx.type === "INCOME" ? colors.success : (tx.type === "TRANSFER" ? colors.text : colors.primary) }]}>
            {(tx.type === "INCOME" ? "+" : (tx.type === "TRANSFER" ? "" : "")) + formatMoney(tx.amount)}
          </Text>
          <Text style={styles.name}>{tx.name}</Text>
          <Text style={styles.date}>{format(new Date(tx.date), "EEEE, MMMM do yyyy 'at' h:mm a")}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>{tx.type || "EXPENSE"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Category</Text>
            <Text style={styles.value}>{tx.category}</Text>
          </View>
          {tx.account_id && (
            <View style={styles.row}>
              <Text style={styles.label}>Account</Text>
              <Text style={styles.value}>{tx.account_id}</Text>
            </View>
          )}
          {tx.to_account_id && (
            <View style={styles.row}>
              <Text style={styles.label}>To Account</Text>
              <Text style={styles.value}>{tx.to_account_id}</Text>
            </View>
          )}
          <View style={styles.rowLast}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{tx.status || "CLEARED"}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <View style={{ alignItems: "center" }}>
            <PressableScale style={styles.actionBtn} onPress={() => setShowEdit(true)}>
              <Feather name="edit-2" size={24} color={colors.primary} />
            </PressableScale>
            <Text style={styles.actionText}>Edit</Text>
          </View>
          
          <View style={{ alignItems: "center" }}>
            <PressableScale style={styles.actionBtn} onPress={handleDelete}>
              <Feather name="trash-2" size={24} color={colors.destructive} />
            </PressableScale>
            <Text style={styles.actionText}>Delete</Text>
          </View>
        </View>
      </ScrollView>

      <AddTransactionSheet
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        initialData={tx}
      />
    </View>
  );
};
