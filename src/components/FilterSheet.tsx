import React, { useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableWithoutFeedback, TextInput, ScrollView, Platform } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../state/ThemeContext";
import { useAccountsQuery, useCategoriesQuery } from "../state/queries";
import { PressableScale } from "./PressableScale";
import type { ThemeColors } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";

const createStyles = (c: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: c.modalOverlay, justifyContent: "flex-end" },
  sheet: { backgroundColor: c.background, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, maxHeight: "90%" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.lg },
  title: { color: c.text, fontSize: FontSize.title, fontWeight: "800" },
  
  section: { marginBottom: Spacing.xl },
  sectionTitle: { color: c.textSecondary, fontSize: FontSize.small, fontWeight: "700", marginBottom: Spacing.sm, letterSpacing: 1 },
  
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.pill, backgroundColor: c.cardBackground, borderWidth: 1, borderColor: c.chipBorder },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { color: c.textSecondary, fontWeight: "600", fontSize: FontSize.body },
  chipTextActive: { color: c.primaryText },

  inputRow: { flexDirection: "row", gap: Spacing.md },
  inputWrap: { flex: 1, backgroundColor: c.inputBackground, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  inputLabel: { color: c.textTertiary, fontSize: FontSize.caption, fontWeight: "600", marginBottom: 4 },
  input: { color: c.inputText, fontSize: FontSize.body, fontWeight: "600" },
  
  actionRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
  actionBtn: { flex: 1, paddingVertical: Spacing.md + 2, borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  btnSecondary: { backgroundColor: c.surfaceElevated },
  btnSecondaryText: { color: c.text, fontWeight: "700", fontSize: FontSize.bodyLarge },
  btnPrimary: { backgroundColor: c.primary },
  btnPrimaryText: { color: c.primaryText, fontWeight: "700", fontSize: FontSize.bodyLarge },
});

export interface FilterOptions {
  dateRange: "All" | "Today" | "Yesterday" | "This Week" | "This Month";
  minAmount: string;
  maxAmount: string;
  accountId: string | null;
}

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApply: (f: FilterOptions) => void;
}

export const FilterSheet = ({ visible, onClose, filters, onApply }: FilterSheetProps) => {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  
  const { data: accounts = [] } = useAccountsQuery();

  const [dateRange, setDateRange] = useState(filters.dateRange);
  const [minAmount, setMinAmount] = useState(filters.minAmount);
  const [maxAmount, setMaxAmount] = useState(filters.maxAmount);
  const [accountId, setAccountId] = useState(filters.accountId);

  // Sync state when opened
  React.useEffect(() => {
    if (visible) {
      setDateRange(filters.dateRange);
      setMinAmount(filters.minAmount);
      setMaxAmount(filters.maxAmount);
      setAccountId(filters.accountId);
    }
  }, [visible, filters]);

  const handleApply = () => {
    onApply({ dateRange, minAmount, maxAmount, accountId });
    onClose();
  };

  const handleClear = () => {
    setDateRange("All");
    setMinAmount("");
    setMaxAmount("");
    setAccountId(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.xl) }]}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Filters</Text>
              <PressableScale onPress={onClose} hitSlop={15}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </PressableScale>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>DATE RANGE</Text>
                <View style={styles.chipRow}>
                  {["All", "Today", "Yesterday", "This Week", "This Month"].map(r => (
                    <PressableScale key={r} onPress={() => setDateRange(r as any)} style={[styles.chip, dateRange === r && styles.chipActive]}>
                      <Text style={[styles.chipText, dateRange === r && styles.chipTextActive]}>{r}</Text>
                    </PressableScale>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>AMOUNT RANGE</Text>
                <View style={styles.inputRow}>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>MIN (₹)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.inputPlaceholder}
                      value={minAmount}
                      onChangeText={setMinAmount}
                    />
                  </View>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputLabel}>MAX (₹)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="Any"
                      placeholderTextColor={colors.inputPlaceholder}
                      value={maxAmount}
                      onChangeText={setMaxAmount}
                    />
                  </View>
                </View>
              </View>

              {accounts.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>ACCOUNT</Text>
                  <View style={styles.chipRow}>
                    <PressableScale onPress={() => setAccountId(null)} style={[styles.chip, !accountId && styles.chipActive]}>
                      <Text style={[styles.chipText, !accountId && styles.chipTextActive]}>All</Text>
                    </PressableScale>
                    {accounts.map(a => (
                      <PressableScale key={a.id} onPress={() => setAccountId(a.id)} style={[styles.chip, accountId === a.id && styles.chipActive]}>
                        <Text style={[styles.chipText, accountId === a.id && styles.chipTextActive]}>{a.name}</Text>
                      </PressableScale>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.actionRow}>
                <PressableScale style={[styles.actionBtn, styles.btnSecondary]} onPress={handleClear}>
                  <Text style={styles.btnSecondaryText}>Clear All</Text>
                </PressableScale>
                <PressableScale style={[styles.actionBtn, styles.btnPrimary]} onPress={handleApply}>
                  <Text style={styles.btnPrimaryText}>Apply</Text>
                </PressableScale>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};
