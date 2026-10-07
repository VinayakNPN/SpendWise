import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Modal, TextInput, Alert, TouchableWithoutFeedback, Keyboard } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import { 
  useDebtsQuery, 
  useAddDebtMutation, 
  useUpdateDebtMutation, 
  useDeleteDebtMutation,
  useAddDebtPaymentMutation,
  useDebtPaymentsQuery
} from "../state/queries";
import { useTheme } from "../state/ThemeContext";
import { useFinance } from "../utils/useFinance";
import { PressableScale } from "../components/PressableScale";
import type { ThemeColors } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";
import type { Debt } from "../state/types";

const createStyles = (c: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.md, backgroundColor: c.surfaceElevated, borderRadius: Radius.pill },
  title: { color: c.text, fontSize: 24, fontWeight: "800" },
  
  card: { backgroundColor: c.cardBackground, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: c.cardBorder },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.md },
  name: { color: c.text, fontSize: FontSize.subtitle, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  meta: { color: c.textTertiary, fontSize: FontSize.small },
  amount: { color: c.text, fontSize: 20, fontWeight: "800" },
  
  progressBarBg: { height: 8, backgroundColor: c.borderLight, borderRadius: 4, overflow: "hidden", marginBottom: Spacing.sm },
  progressBarFill: { height: "100%", backgroundColor: c.primary, borderRadius: 4 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.md },
  progressLabel: { color: c.textSecondary, fontSize: FontSize.caption, fontWeight: "600" },

  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md, marginTop: Spacing.sm, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: c.borderLight },
  infoCol: { flex: 1, minWidth: "45%" },
  infoLabel: { color: c.textTertiary, fontSize: FontSize.caption, fontWeight: "700", marginBottom: 2 },
  infoValue: { color: c.text, fontSize: FontSize.body, fontWeight: "600" },
  
  actionRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  btn: { flex: 1, paddingVertical: 8, borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  btnPrimary: { backgroundColor: c.primary },
  btnSecondary: { backgroundColor: c.surfaceElevated },
  btnText: { fontWeight: "700", fontSize: FontSize.small },
  
  fab: { position: "absolute", right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: c.fabBackground || c.primary, alignItems: "center", justifyContent: "center", elevation: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: c.modalOverlay, justifyContent: "flex-end" },
  modalContent: { backgroundColor: c.modalBackground, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, maxHeight: "90%" },
  modalTitle: { color: c.text, fontSize: 20, fontWeight: "800", marginBottom: Spacing.xl },
  inputWrap: { backgroundColor: c.inputBackground, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, marginBottom: Spacing.md },
  input: { color: c.inputText, fontSize: FontSize.body, fontWeight: "600" },
});

export const DebtScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { formatMoney } = useFinance();
  
  const { data: debts = [] } = useDebtsQuery();
  const { mutate: addDebt } = useAddDebtMutation();
  const { mutate: updateDebt } = useUpdateDebtMutation();
  const { mutate: deleteDebt } = useDeleteDebtMutation();
  const { mutate: addPayment } = useAddDebtPaymentMutation();

  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Debt Form State
  const [name, setName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [outstanding, setOutstanding] = useState("");
  const [interest, setInterest] = useState("");
  const [minPayment, setMinPayment] = useState("");

  // Payment Form State
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const openAdd = () => {
    setEditingId(null);
    setName("");
    setPrincipal("");
    setOutstanding("");
    setInterest("");
    setMinPayment("");
    setShowModal(true);
  };

  const openEdit = (d: Debt) => {
    setEditingId(d.id);
    setName(d.name);
    setPrincipal(String(d.principal));
    setOutstanding(String(d.outstanding));
    setInterest(String(d.interest_rate));
    setMinPayment(String(d.min_payment));
    setShowModal(true);
  };

  const openPayment = (d: Debt) => {
    setEditingId(d.id);
    setPayAmount(String(d.min_payment || ""));
    setPayNotes("");
    setShowPaymentModal(true);
  };

  const handleSave = () => {
    if (!name || !principal || !outstanding) return;
    const payload = {
      name,
      principal: Number(principal),
      outstanding: Number(outstanding),
      interest_rate: Number(interest || 0),
      min_payment: Number(minPayment || 0),
      frequency: "MONTHLY" as any,
    };

    if (editingId) updateDebt({ id: editingId, patch: payload });
    else addDebt(payload as any);
    
    setShowModal(false);
  };

  const handleMakePayment = () => {
    if (!editingId || !payAmount) return;
    addPayment({ debtId: editingId, amount: Number(payAmount), notes: payNotes });
    setShowPaymentModal(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteDebt(id) }
    ]);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.header}>
          <PressableScale onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </PressableScale>
          <Text style={styles.title}>Debt Tracker</Text>
        </View>

        {debts.length === 0 ? (
          <Text style={{ color: colors.textTertiary, fontStyle: "italic", textAlign: "center", marginTop: 40 }}>No debts tracked yet.</Text>
        ) : (
          debts.map(d => {
            const progress = d.principal > 0 ? ((d.principal - d.outstanding) / d.principal) * 100 : 0;
            const mo = d.min_payment > 0 ? Math.ceil(d.outstanding / d.min_payment) : 0;
            const years = mo > 0 ? (mo / 12).toFixed(1) : "N/A";
            
            return (
              <View key={d.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.name}>{d.name}</Text>
                    <View style={styles.metaRow}>
                      <MaterialCommunityIcons name="percent" size={14} color={colors.textTertiary} />
                      <Text style={styles.meta}>{d.interest_rate}% APR</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.amount}>{formatMoney(d.outstanding)}</Text>
                    <Text style={[styles.meta, { color: colors.destructive }]}>remaining</Text>
                  </View>
                </View>

                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, progress))}%` }]} />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabel}>Paid: {formatMoney(d.principal - d.outstanding)}</Text>
                  <Text style={styles.progressLabel}>Total: {formatMoney(d.principal)}</Text>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Min Payment</Text>
                    <Text style={styles.infoValue}>{formatMoney(d.min_payment)}</Text>
                  </View>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Est. Payoff</Text>
                    <Text style={styles.infoValue}>{years} years</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <PressableScale style={[styles.btn, styles.btnSecondary, { flex: 0.3 }]} onPress={() => openEdit(d)}>
                    <Feather name="edit-2" size={16} color={colors.text} />
                  </PressableScale>
                  <PressableScale style={[styles.btn, styles.btnSecondary, { flex: 0.3 }]} onPress={() => handleDelete(d.id)}>
                    <Feather name="trash" size={16} color={colors.destructive} />
                  </PressableScale>
                  <PressableScale style={[styles.btn, styles.btnPrimary]} onPress={() => openPayment(d)}>
                    <Text style={[styles.btnText, { color: colors.primaryText }]}>Make Payment</Text>
                  </PressableScale>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <PressableScale style={[styles.fab, { bottom: Math.max(insets.bottom, 20) }]} onPress={openAdd}>
        <Feather name="plus" size={28} color={colors.primaryText} />
      </PressableScale>

      {/* Debt CRUD Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, Spacing.xl) }]}>
                <Text style={styles.modalTitle}>{editingId ? "Edit Debt" : "Add Debt"}</Text>
                
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.inputWrap}>
                    <TextInput style={styles.input} placeholder="Name (e.g. Car Loan)" placeholderTextColor={colors.inputPlaceholder} value={name} onChangeText={setName} />
                  </View>
                  <View style={styles.inputWrap}>
                    <TextInput style={styles.input} placeholder="Original Principal" placeholderTextColor={colors.inputPlaceholder} keyboardType="numeric" value={principal} onChangeText={setPrincipal} />
                  </View>
                  <View style={styles.inputWrap}>
                    <TextInput style={styles.input} placeholder="Current Outstanding" placeholderTextColor={colors.inputPlaceholder} keyboardType="numeric" value={outstanding} onChangeText={setOutstanding} />
                  </View>
                  <View style={{ flexDirection: "row", gap: Spacing.md }}>
                    <View style={[styles.inputWrap, { flex: 1 }]}>
                      <TextInput style={styles.input} placeholder="Interest Rate (%)" placeholderTextColor={colors.inputPlaceholder} keyboardType="numeric" value={interest} onChangeText={setInterest} />
                    </View>
                    <View style={[styles.inputWrap, { flex: 1 }]}>
                      <TextInput style={styles.input} placeholder="Min Payment" placeholderTextColor={colors.inputPlaceholder} keyboardType="numeric" value={minPayment} onChangeText={setMinPayment} />
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg }}>
                    <PressableScale style={[styles.btn, styles.btnSecondary, { paddingVertical: 14 }]} onPress={() => setShowModal(false)}>
                      <Text style={[styles.btnText, { color: colors.text, fontSize: FontSize.body }]}>Cancel</Text>
                    </PressableScale>
                    <PressableScale style={[styles.btn, styles.btnPrimary, { paddingVertical: 14 }]} onPress={handleSave}>
                      <Text style={[styles.btnText, { color: colors.primaryText, fontSize: FontSize.body }]}>Save Debt</Text>
                    </PressableScale>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Make Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="slide" onRequestClose={() => setShowPaymentModal(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, Spacing.xl) }]}>
                <Text style={styles.modalTitle}>Make a Payment</Text>
                
                <View style={styles.inputWrap}>
                  <TextInput style={styles.input} placeholder="Amount" placeholderTextColor={colors.inputPlaceholder} keyboardType="numeric" value={payAmount} onChangeText={setPayAmount} />
                </View>
                <View style={styles.inputWrap}>
                  <TextInput style={styles.input} placeholder="Notes (Optional)" placeholderTextColor={colors.inputPlaceholder} value={payNotes} onChangeText={setPayNotes} />
                </View>

                <View style={{ flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg }}>
                  <PressableScale style={[styles.btn, styles.btnSecondary, { paddingVertical: 14 }]} onPress={() => setShowPaymentModal(false)}>
                    <Text style={[styles.btnText, { color: colors.text, fontSize: FontSize.body }]}>Cancel</Text>
                  </PressableScale>
                  <PressableScale style={[styles.btn, styles.btnPrimary, { paddingVertical: 14 }]} onPress={handleMakePayment}>
                    <Text style={[styles.btnText, { color: colors.primaryText, fontSize: FontSize.body }]}>Confirm</Text>
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
