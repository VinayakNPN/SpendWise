import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useExpensesQuery } from "../state/queries";
import { useFinance } from "../utils/useFinance";
import { useTheme } from "../state/ThemeContext";
import { PressableScale } from "./PressableScale";
import { Radius, Spacing, FontSize } from "../utils/theme";
import type { ThemeColors } from "../utils/theme";

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: c.warning + "1A", // light warning background
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: c.warning,
    padding: Spacing.md + 2,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    color: c.warning,
    fontWeight: "800",
    fontSize: FontSize.body,
  },
  count: {
    color: c.warning,
    fontWeight: "600",
    fontSize: FontSize.small,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: c.warning + "33",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  name: {
    color: c.text,
    fontWeight: "600",
    fontSize: FontSize.body,
  },
  amount: {
    color: c.text,
    fontWeight: "800",
    fontSize: FontSize.body,
  },
  reviewBtn: {
    backgroundColor: c.warning,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  reviewText: {
    color: "#000",
    fontWeight: "700",
    fontSize: FontSize.small,
  }
});

export const NeedsReviewInbox = () => {
  const { data: expenses = [] } = useExpensesQuery();
  const { colors } = useTheme();
  const { formatMoney } = useFinance();
  const navigation = useNavigation<any>();
  
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const pendingTransactions = expenses.filter(e => e.status === 'PENDING');

  if (pendingTransactions.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Feather name="alert-circle" size={18} color={colors.warning} />
          <Text style={styles.title}>Needs Review</Text>
        </View>
        <Text style={styles.count}>{pendingTransactions.length} transaction{pendingTransactions.length > 1 ? 's' : ''}</Text>
      </View>
      
      {pendingTransactions.slice(0, 3).map(tx => (
        <View key={tx.id} style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.name}>{tx.name || 'Unknown Merchant'}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
            <Text style={styles.amount}>{formatMoney(tx.amount)}</Text>
            <PressableScale 
              style={styles.reviewBtn} 
              onPress={() => navigation.navigate("ReceiptReview", { id: tx.id })}
            >
              <Text style={styles.reviewText}>Review</Text>
            </PressableScale>
          </View>
        </View>
      ))}
      
      {pendingTransactions.length > 3 && (
        <PressableScale onPress={() => navigation.navigate("Activity")} style={{ marginTop: Spacing.sm, alignSelf: "center" }}>
          <Text style={{ color: colors.warning, fontWeight: "700" }}>View all pending</Text>
        </PressableScale>
      )}
    </View>
  );
};
