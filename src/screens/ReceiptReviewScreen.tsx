import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Switch } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useExpensesQuery, useUpdateExpenseMutation } from "../state/queries";
import { useTheme } from "../state/ThemeContext";
import { useFinance } from "../utils/useFinance";
import { PressableScale } from "../components/PressableScale";
import { Radius, Spacing, FontSize } from "../utils/theme";
import type { ThemeColors } from "../utils/theme";

const createStyles = (c: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background },
  content: { padding: Spacing.lg },
  header: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.xl },
  headerTitle: { color: c.text, fontSize: FontSize.title, fontWeight: "800", marginLeft: Spacing.sm },
  card: { backgroundColor: c.cardBackground, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.cardBorder, padding: Spacing.lg, marginBottom: Spacing.lg },
  label: { color: c.textTertiary, fontWeight: "700", fontSize: FontSize.caption, marginBottom: 4, letterSpacing: 0.8 },
  valueText: { color: c.text, fontSize: FontSize.body, fontWeight: "600", marginBottom: Spacing.md },
  input: { backgroundColor: c.inputBackground, borderRadius: 10, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, marginBottom: Spacing.md, color: c.inputText, fontWeight: "500" },
  confidenceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: c.cardBackground, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.md },
  confidenceLabel: { color: c.textSecondary, fontWeight: "600" },
  confidenceVal: { color: c.primary, fontWeight: "800" },
  actionRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.xl },
  btnSave: { flex: 1, backgroundColor: c.primary, padding: Spacing.md, borderRadius: Radius.md, alignItems: "center" },
  btnSaveText: { color: c.primaryText, fontWeight: "700", fontSize: FontSize.body },
  btnCancel: { flex: 1, backgroundColor: c.cardBackground, borderWidth: 1, borderColor: c.border, padding: Spacing.md, borderRadius: Radius.md, alignItems: "center" },
  btnCancelText: { color: c.text, fontWeight: "700", fontSize: FontSize.body },
});

export const ReceiptReviewScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { formatMoney } = useFinance();
  const { data: expenses = [] } = useExpensesQuery();
  const { mutate: updateExpense } = useUpdateExpenseMutation();

  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const txId = route.params?.id;
  const tx = expenses.find(e => e.id === txId);

  const [name, setName] = useState(tx?.name || "");
  const [category, setCategory] = useState(tx?.category || "");

  if (!tx) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textSecondary }}>Transaction not found.</Text>
        <PressableScale onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </PressableScale>
      </View>
    );
  }

  const handleConfirm = () => {
    updateExpense({ 
      id: tx.id, 
      patch: { 
        name: name.trim(), 
        category: category.trim(), 
        status: 'CLEARED' 
      } 
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 50) }]}>
      <View style={styles.header}>
        <PressableScale onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate("DashboardHome");
          }
        }}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </PressableScale>
        <Text style={styles.headerTitle}>Review Receipt</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.confidenceRow}>
          <Text style={styles.confidenceLabel}>AI Parse Confidence</Text>
          <Text style={styles.confidenceVal}>{tx.confidence ? `${tx.confidence}%` : 'N/A'}</Text>
        </View>

        <Text style={styles.label}>AMOUNT</Text>
        <Text style={[styles.valueText, { fontSize: 28, fontWeight: "800", color: colors.primary }]}>{formatMoney(tx.amount)}</Text>

        <Text style={styles.label}>DATE</Text>
        <Text style={styles.valueText}>{new Date(tx.date).toLocaleDateString()}</Text>

        <Text style={styles.label}>MERCHANT NAME</Text>
        <TextInput 
          style={styles.input} 
          value={name} 
          onChangeText={setName} 
          placeholderTextColor={colors.inputPlaceholder} 
        />

        <Text style={styles.label}>CATEGORY</Text>
        <TextInput 
          style={styles.input} 
          value={category} 
          onChangeText={setCategory} 
          placeholderTextColor={colors.inputPlaceholder} 
        />
      </View>

      <View style={styles.actionRow}>
        <PressableScale style={styles.btnCancel} onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate("DashboardHome");
          }
        }}>
          <Text style={styles.btnCancelText}>Cancel</Text>
        </PressableScale>
        <PressableScale style={styles.btnSave} onPress={handleConfirm}>
          <Text style={styles.btnSaveText}>Confirm & Clear</Text>
        </PressableScale>
      </View>
    </ScrollView>
  );
};
