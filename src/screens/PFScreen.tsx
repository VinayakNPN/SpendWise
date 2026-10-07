import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Modal, TextInput, TouchableWithoutFeedback, Keyboard } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import { useTheme } from "../state/ThemeContext";
import { useAppStore } from "../state/AppStore";
import { useFinance } from "../utils/useFinance";
import { computeDynamicPFBalance } from "../utils/pfCalculator";
import { PressableScale } from "../components/PressableScale";
import { parseInputMoney, formatInputMoney } from "../utils/finance";
import type { ThemeColors } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";

const createStyles = (c: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.md, backgroundColor: c.surfaceElevated, borderRadius: Radius.pill },
  title: { color: c.text, fontSize: 24, fontWeight: "800" },
  
  summaryCard: { backgroundColor: c.cardBackground, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.xl, borderWidth: 1, borderColor: c.cardBorder },
  summaryLabel: { color: c.textTertiary, fontSize: FontSize.small, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  summaryAmount: { color: c.primary, fontSize: 36, fontWeight: "800", marginBottom: Spacing.lg },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: c.divider },
  summaryCol: { flex: 1 },
  summarySubVal: { color: c.text, fontSize: FontSize.body, fontWeight: "700", marginTop: 2 },
  
  listHeader: { color: c.textTertiary, fontSize: FontSize.small, fontWeight: "700", letterSpacing: 1.2, marginBottom: Spacing.md },
  
  card: { backgroundColor: c.surfaceElevated, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  month: { color: c.text, fontSize: FontSize.body, fontWeight: "700" },
  splitText: { color: c.textSecondary, fontSize: FontSize.small, marginTop: 4 },
  total: { color: c.text, fontSize: FontSize.bodyLarge, fontWeight: "800" },
  
  fab: { position: "absolute", right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: c.fabBackground || c.primary, alignItems: "center", justifyContent: "center", elevation: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: c.modalOverlay, justifyContent: "flex-end" },
  modalContent: { backgroundColor: c.modalBackground, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl },
  modalTitle: { color: c.text, fontSize: 20, fontWeight: "800", marginBottom: Spacing.xl },
  inputWrap: { backgroundColor: c.inputBackground, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, marginBottom: Spacing.md },
  inputLabel: { color: c.textTertiary, fontSize: FontSize.caption, fontWeight: "700", marginBottom: 4, letterSpacing: 0.8 },
  input: { color: c.inputText, fontSize: FontSize.body, fontWeight: "600" },
  
  btnRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg },
  btn: { flex: 1, paddingVertical: 14, borderRadius: Radius.md, alignItems: "center" },
  btnPrimary: { backgroundColor: c.primary },
  btnSecondary: { backgroundColor: c.surfaceElevated },
  btnText: { fontWeight: "700", fontSize: FontSize.body },
});

export const PFScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { formatMoney } = useFinance();
  
  const { preferences, setPreferences } = useAppStore();
  const pfConfig = preferences.pfConfig;
  
  const { currentBalance, initialBalance, totalContributions, history } = computeDynamicPFBalance(pfConfig);

  const [showModal, setShowModal] = useState(false);
  const [initBal, setInitBal] = useState(pfConfig?.initialBalance ? String(pfConfig.initialBalance) : "");
  const [monContrib, setMonContrib] = useState(pfConfig?.monthlyContribution ? String(pfConfig.monthlyContribution) : "");
  const [contribDay, setContribDay] = useState(pfConfig?.contributionDay ? String(pfConfig.contributionDay) : "7");

  const handleSave = () => {
    if (!initBal || !monContrib || !contribDay) return;
    
    setPreferences({
      ...preferences,
      pfConfig: {
        initialBalance: Number(parseInputMoney(initBal)),
        monthlyContribution: Number(parseInputMoney(monContrib)),
        contributionDay: Number(contribDay),
        setupDate: pfConfig?.setupDate || new Date().toISOString()
      }
    });
    
    setShowModal(false);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.header}>
          <PressableScale onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </PressableScale>
          <Text style={styles.title}>Provident Fund (PF)</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>CURRENT BALANCE</Text>
          <Text style={styles.summaryAmount}>{formatMoney(currentBalance)}</Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>INITIAL BALANCE</Text>
              <Text style={styles.summarySubVal}>{formatMoney(initialBalance)}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>CONTRIBUTIONS</Text>
              <Text style={styles.summarySubVal}>{formatMoney(totalContributions)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.listHeader}>CONTRIBUTION HISTORY</Text>
        {history.length === 0 ? (
          <Text style={{ color: colors.textTertiary, fontStyle: "italic", textAlign: "center", marginTop: 20 }}>No PF configuration setup.</Text>
        ) : (
          history.map((h, i) => (
            <View key={i} style={styles.card}>
              <View>
                <Text style={styles.month}>{format(new Date(h.date), "MMMM yyyy")}</Text>
                <Text style={styles.splitText}>{h.type === 'INITIAL' ? 'Initial Setup' : 'Monthly Auto-contribution'}</Text>
              </View>
              <Text style={styles.total}>+{formatMoney(h.amount)}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <PressableScale style={[styles.fab, { bottom: Math.max(insets.bottom, 20) }]} onPress={() => setShowModal(true)}>
        <Feather name="settings" size={24} color={colors.primaryText} />
      </PressableScale>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, Spacing.xl) }]}>
                <Text style={styles.modalTitle}>Configure PF</Text>
                
                <Text style={styles.inputLabel}>CURRENT PF BALANCE (₹)</Text>
                <View style={styles.inputWrap}>
                  <TextInput style={styles.input} keyboardType="numeric" value={formatInputMoney(initBal)} onChangeText={v => setInitBal(parseInputMoney(v))} placeholder="e.g. 50,000" placeholderTextColor={colors.inputPlaceholder} />
                </View>
                
                <Text style={styles.inputLabel}>MONTHLY CONTRIBUTION (₹)</Text>
                <View style={styles.inputWrap}>
                  <TextInput style={styles.input} keyboardType="numeric" value={formatInputMoney(monContrib)} onChangeText={v => setMonContrib(parseInputMoney(v))} placeholder="e.g. 3,000" placeholderTextColor={colors.inputPlaceholder} />
                </View>

                <Text style={styles.inputLabel}>CONTRIBUTION DATE (1-31)</Text>
                <View style={styles.inputWrap}>
                  <TextInput style={styles.input} keyboardType="numeric" value={contribDay} onChangeText={setContribDay} placeholder="e.g. 7" placeholderTextColor={colors.inputPlaceholder} />
                </View>

                <View style={styles.btnRow}>
                  <PressableScale style={[styles.btn, styles.btnSecondary]} onPress={() => setShowModal(false)}>
                    <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
                  </PressableScale>
                  <PressableScale style={[styles.btn, styles.btnPrimary]} onPress={handleSave}>
                    <Text style={[styles.btnText, { color: colors.primaryText }]}>Save Config</Text>
                  </PressableScale>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};
