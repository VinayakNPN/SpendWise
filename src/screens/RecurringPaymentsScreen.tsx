import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Modal, TextInput, Alert, TouchableWithoutFeedback, Keyboard } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { format, isBefore, isToday, addMonths, addWeeks, addYears } from "date-fns";
import { 
  useRecurringPaymentsQuery, 
  useAddRecurringPaymentMutation, 
  useUpdateRecurringPaymentMutation, 
  useDeleteRecurringPaymentMutation,
  useMarkRecurringPaidMutation,
  useSkipRecurringMutation,
  useCategoriesQuery,
  useAccountsQuery
} from "../state/queries";
import { useTheme } from "../state/ThemeContext";
import { useFinance } from "../utils/useFinance";
import { PressableScale } from "../components/PressableScale";
import type { ThemeColors } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";
import type { RecurringPayment } from "../state/types";

const createStyles = (c: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.md, backgroundColor: c.surfaceElevated, borderRadius: Radius.pill },
  title: { color: c.text, fontSize: 24, fontWeight: "800" },
  
  sectionTitle: { color: c.textSecondary, fontSize: FontSize.small, fontWeight: "700", letterSpacing: 1, marginBottom: Spacing.md, marginTop: Spacing.lg },
  
  card: { backgroundColor: c.cardBackground, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: c.cardBorder },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.md },
  name: { color: c.text, fontSize: FontSize.subtitle, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 },
  meta: { color: c.textTertiary, fontSize: FontSize.small },
  amount: { color: c.text, fontSize: 20, fontWeight: "800" },
  
  statusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  statusText: { fontSize: FontSize.caption, fontWeight: "700" },
  
  actionRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: c.borderLight },
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: Spacing.lg },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: c.cardBackground, borderWidth: 1, borderColor: c.chipBorder },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { color: c.textSecondary, fontWeight: "600", fontSize: FontSize.small },
  chipTextActive: { color: c.primaryText },
});

export const RecurringPaymentsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { formatMoney } = useFinance();
  
  const { data: payments = [] } = useRecurringPaymentsQuery();
  const { data: categories = [] } = useCategoriesQuery();
  const { data: accounts = [] } = useAccountsQuery();
  
  const { mutate: addPayment } = useAddRecurringPaymentMutation();
  const { mutate: updatePayment } = useUpdateRecurringPaymentMutation();
  const { mutate: deletePayment } = useDeleteRecurringPaymentMutation();
  const { mutate: markPaid } = useMarkRecurringPaidMutation();
  const { mutate: skipPayment } = useSkipRecurringMutation();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [nextDue, setNextDue] = useState(new Date().toISOString());

  const openAdd = () => {
    setEditingId(null);
    setName("");
    setAmount("");
    setFrequency("MONTHLY");
    setCategoryId(categories[0]?.name || "");
    setAccountId(accounts[0]?.id || "");
    setNextDue(new Date().toISOString());
    setShowModal(true);
  };

  const openEdit = (p: RecurringPayment) => {
    setEditingId(p.id);
    setName(p.name);
    setAmount(String(p.amount));
    setFrequency(p.frequency);
    setCategoryId(p.category);
    setAccountId(p.account_id || "");
    setNextDue(p.next_due);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name || !amount) return;
    const payload = {
      name,
      amount: Number(amount),
      frequency,
      category: categoryId,
      account_id: accountId || undefined,
      next_due: nextDue,
      status: "PENDING"
    };

    if (editingId) {
      updatePayment({ id: editingId, patch: payload as any });
    } else {
      addPayment(payload as any);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deletePayment(id) }
    ]);
  };

  const pending = payments.filter(p => p.status !== "PAID" && p.status !== "SKIPPED").sort((a, b) => new Date(a.next_due).getTime() - new Date(b.next_due).getTime());
  const completed = payments.filter(p => p.status === "PAID" || p.status === "SKIPPED").sort((a, b) => new Date(b.next_due).getTime() - new Date(a.next_due).getTime());

  const renderPayment = (p: RecurringPayment) => {
    const isDue = isBefore(new Date(p.next_due), new Date()) || isToday(new Date(p.next_due));
    return (
      <View key={p.id} style={styles.card}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.name}>{p.name}</Text>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="refresh" size={14} color={colors.textTertiary} />
              <Text style={styles.meta}>{p.frequency}</Text>
              <Text style={styles.meta}>• {format(new Date(p.next_due), "MMM dd, yyyy")}</Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.amount}>{formatMoney(p.amount)}</Text>
            <View style={[styles.statusChip, { backgroundColor: p.status === "PAID" ? colors.success + "30" : p.status === "SKIPPED" ? colors.borderLight : (isDue ? colors.warning + "30" : colors.primaryMuted) }]}>
              <Text style={[styles.statusText, { color: p.status === "PAID" ? colors.success : p.status === "SKIPPED" ? colors.textSecondary : (isDue ? colors.warning : colors.primary) }]}>
                {p.status}
              </Text>
            </View>
          </View>
        </View>

        {p.status !== "PAID" && p.status !== "SKIPPED" && (
          <View style={styles.actionRow}>
            <PressableScale style={[styles.btn, styles.btnSecondary]} onPress={() => openEdit(p)}>
              <Text style={[styles.btnText, { color: colors.text }]}>Edit</Text>
            </PressableScale>
            <PressableScale style={[styles.btn, styles.btnSecondary]} onPress={() => skipPayment(p.id)}>
              <Text style={[styles.btnText, { color: colors.text }]}>Skip</Text>
            </PressableScale>
            <PressableScale style={[styles.btn, styles.btnPrimary]} onPress={() => markPaid({ id: p.id })}>
              <Text style={[styles.btnText, { color: colors.primaryText }]}>Mark Paid</Text>
            </PressableScale>
          </View>
        )}
        
        {(p.status === "PAID" || p.status === "SKIPPED") && (
          <View style={styles.actionRow}>
            <PressableScale style={[styles.btn, styles.btnSecondary]} onPress={() => openEdit(p)}>
              <Text style={[styles.btnText, { color: colors.text }]}>Edit Details</Text>
            </PressableScale>
            <PressableScale style={[styles.btn, styles.btnSecondary, { flex: 0.3 }]} onPress={() => handleDelete(p.id)}>
              <Feather name="trash" size={16} color={colors.destructive} />
            </PressableScale>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.header}>
          <PressableScale onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </PressableScale>
          <Text style={styles.title}>Recurring</Text>
        </View>

        <Text style={styles.sectionTitle}>UPCOMING & PENDING</Text>
        {pending.length === 0 ? (
          <Text style={{ color: colors.textTertiary, fontStyle: "italic" }}>No upcoming payments.</Text>
        ) : (
          pending.map(renderPayment)
        )}

        {completed.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>COMPLETED THIS CYCLE</Text>
            {completed.map(renderPayment)}
          </>
        )}
      </ScrollView>

      <PressableScale style={[styles.fab, { bottom: Math.max(insets.bottom, 20) }]} onPress={openAdd}>
        <Feather name="plus" size={28} color={colors.primaryText} />
      </PressableScale>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, Spacing.xl) }]}>
                <Text style={styles.modalTitle}>{editingId ? "Edit Payment" : "New Recurring Payment"}</Text>
                
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="Payment Name (e.g. Netflix)"
                      placeholderTextColor={colors.inputPlaceholder}
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      placeholder="Amount"
                      placeholderTextColor={colors.inputPlaceholder}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>

                  <Text style={[styles.sectionTitle, { marginTop: Spacing.sm }]}>FREQUENCY</Text>
                  <View style={styles.chipRow}>
                    {["WEEKLY", "MONTHLY", "YEARLY"].map(f => (
                      <PressableScale key={f} onPress={() => setFrequency(f)} style={[styles.chip, frequency === f && styles.chipActive]}>
                        <Text style={[styles.chipText, frequency === f && styles.chipTextActive]}>{f}</Text>
                      </PressableScale>
                    ))}
                  </View>

                  <Text style={[styles.sectionTitle, { marginTop: Spacing.sm }]}>CATEGORY</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                    <View style={styles.chipRow}>
                      {categories.map(c => (
                        <PressableScale key={c.id} onPress={() => setCategoryId(c.name)} style={[styles.chip, categoryId === c.name && styles.chipActive]}>
                          <Text style={[styles.chipText, categoryId === c.name && styles.chipTextActive]}>{c.name}</Text>
                        </PressableScale>
                      ))}
                    </View>
                  </ScrollView>

                  {accounts.length > 0 && (
                    <>
                      <Text style={[styles.sectionTitle, { marginTop: 0 }]}>PAY FROM ACCOUNT</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                        <View style={styles.chipRow}>
                          <PressableScale onPress={() => setAccountId("")} style={[styles.chip, !accountId && styles.chipActive]}>
                            <Text style={[styles.chipText, !accountId && styles.chipTextActive]}>None</Text>
                          </PressableScale>
                          {accounts.map(a => (
                            <PressableScale key={a.id} onPress={() => setAccountId(a.id)} style={[styles.chip, accountId === a.id && styles.chipActive]}>
                              <Text style={[styles.chipText, accountId === a.id && styles.chipTextActive]}>{a.name}</Text>
                            </PressableScale>
                          ))}
                        </View>
                      </ScrollView>
                    </>
                  )}

                  <View style={{ flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg }}>
                    <PressableScale style={[styles.btn, styles.btnSecondary, { paddingVertical: 14 }]} onPress={() => setShowModal(false)}>
                      <Text style={[styles.btnText, { color: colors.text, fontSize: FontSize.body }]}>Cancel</Text>
                    </PressableScale>
                    <PressableScale style={[styles.btn, styles.btnPrimary, { paddingVertical: 14 }]} onPress={handleSave}>
                      <Text style={[styles.btnText, { color: colors.primaryText, fontSize: FontSize.body }]}>Save Payment</Text>
                    </PressableScale>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};
