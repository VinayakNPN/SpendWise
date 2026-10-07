import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Modal, Pressable, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAccountsQuery, useExpensesQuery, useAddAccountMutation, useUpdateAccountMutation, useDeleteAccountMutation } from "../state/queries";
import { useFinance } from "../utils/useFinance";
import { calculateAccountBalance } from "../utils/finance";
import { useTheme } from "../state/ThemeContext";
import { PressableScale } from "../components/PressableScale";
import type { ThemeColors } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";
import type { Account, Expense } from "../state/types";
import { Alert } from "react-native";

const getAccountIcon = (type: string) => {
  switch (type) {
    case 'SAVINGS': return 'piggy-bank';
    case 'BANK': return 'bank';
    case 'WALLET': return 'wallet';
    case 'UPI_LITE': return 'cellphone-nfc';
    case 'CASH': return 'cash-multiple';
    case 'INVESTMENT': return 'chart-line';
    case 'EMERGENCY_FUND': return 'shield-check';
    default: return 'bank-outline';
  }
};

const createStyles = (c: ThemeColors, isDark: boolean) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.md, backgroundColor: c.surfaceElevated, borderRadius: Radius.pill },
  title: { color: c.text, fontSize: 24, fontWeight: "800" },
  card: { backgroundColor: c.cardBackground, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: c.cardBorder },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.primaryMuted, alignItems: "center", justifyContent: "center" },
  accInfo: { flex: 1, marginLeft: Spacing.md },
  accName: { color: c.text, fontSize: FontSize.subtitle, fontWeight: "700" },
  accType: { color: c.textSecondary, fontSize: FontSize.small, marginTop: 2 },
  balance: { color: c.text, fontSize: 22, fontWeight: "800", marginTop: Spacing.md },
  reconcileBtn: { marginTop: Spacing.md, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: c.surfaceElevated, borderRadius: Radius.md, alignSelf: "flex-start" },
  reconcileText: { color: c.textSecondary, fontSize: FontSize.small, fontWeight: "600" },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: c.modalOverlay, justifyContent: "flex-end" },
  modalContent: { backgroundColor: c.modalBackground, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, padding: Spacing.xl, maxHeight: '80%' },
  modalTitle: { color: c.text, fontSize: 22, fontWeight: "800", marginBottom: Spacing.xl },
  modalStat: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.md },
  modalStatLabel: { color: c.textTertiary, fontSize: FontSize.body },
  modalStatValue: { color: c.text, fontSize: FontSize.body, fontWeight: "700" },
  divider: { height: 1, backgroundColor: c.divider, marginVertical: Spacing.md },
  sectionTitle: { color: c.textTertiary, fontSize: FontSize.small, fontWeight: "700", letterSpacing: 1, marginBottom: Spacing.md },
  txRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  txName: { color: c.text, fontSize: FontSize.body, fontWeight: "600" },
  txDate: { color: c.textTertiary, fontSize: FontSize.small, marginTop: 2 },
  txAmountPos: { color: c.healthy, fontSize: FontSize.body, fontWeight: "700" },
  txAmountNeg: { color: c.text, fontSize: FontSize.body, fontWeight: "700" },
  closeBtn: { marginTop: Spacing.md, padding: Spacing.lg, backgroundColor: c.primary, borderRadius: Radius.lg, alignItems: "center" },
  closeBtnText: { color: c.primaryText, fontSize: FontSize.body, fontWeight: "700" },
  
  actionBtnRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.lg, marginBottom: Spacing.xs },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: "center", backgroundColor: c.surfaceElevated },
  actionBtnText: { color: c.text, fontWeight: "700" },
  deleteBtn: { backgroundColor: c.destructiveMuted },
  deleteBtnText: { color: c.destructive, fontWeight: "700" },

  fab: { position: "absolute", right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: c.fabBackground || c.primary, alignItems: "center", justifyContent: "center", elevation: 4 },
  
  // Add Account Modal
  input: { backgroundColor: c.inputBackground, color: c.inputText, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, marginBottom: Spacing.md, fontSize: FontSize.body, fontWeight: "600" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: Spacing.lg },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: c.cardBackground, borderWidth: 1, borderColor: c.chipBorder },
  typeChipActive: { backgroundColor: c.primary, borderColor: c.primary },
  typeChipText: { color: c.textSecondary, fontWeight: "600", fontSize: FontSize.small },
  typeChipTextActive: { color: c.primaryText },
});

export const AccountsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { formatMoney } = useFinance();

  const { data: accounts = [] } = useAccountsQuery();
  const { data: expenses = [] } = useExpensesQuery();
  const { mutate: addAccount } = useAddAccountMutation();
  const { mutate: updateAccount } = useUpdateAccountMutation();
  const { mutate: deleteAccount } = useDeleteAccountMutation();

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState("BANK");
  const [newAccBalance, setNewAccBalance] = useState("");

  const handleAddAccount = () => {
    if (!newAccName) return;
    if (editingAccount) {
      updateAccount({
        id: editingAccount.id,
        patch: {
          name: newAccName,
          type: newAccType as any,
          balance: Number(newAccBalance || 0),
          opening_balance: Number(newAccBalance || 0),
        }
      });
    } else {
      addAccount({
        name: newAccName,
        type: newAccType,
        balance: Number(newAccBalance || 0),
        opening_balance: Number(newAccBalance || 0),
      } as any);
    }
    setShowAddAccount(false);
    setEditingAccount(null);
    setNewAccName("");
    setNewAccBalance("");
    setNewAccType("BANK");
  };

  const openEdit = (acc: Account) => {
    setSelectedAccount(null);
    setEditingAccount(acc);
    setNewAccName(acc.name);
    setNewAccType(acc.type);
    setNewAccBalance(String(acc.opening_balance ?? acc.balance ?? 0));
    setShowAddAccount(true);
  };

  const handleDelete = (acc: Account) => {
    const txs = expenses.filter(e => e.account_id === acc.id || e.from_account_id === acc.id || e.to_account_id === acc.id);
    if (txs.length > 0) {
      Alert.alert("Warning", "This account has linked transactions. Please delete them first or keep the account to preserve history.");
      return;
    }
    Alert.alert("Confirm Delete", "Are you sure you want to delete this account? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        deleteAccount(acc.id);
        setSelectedAccount(null);
      }}
    ]);
  };

  const getAccountTransactions = (accId: string) => {
    return expenses.filter(e => e.account_id === accId || e.from_account_id === accId || e.to_account_id === accId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const calcMoneyIn = (accId: string) => {
    const txs = getAccountTransactions(accId);
    return txs.reduce((sum, t) => {
      if ((t.type === 'INCOME' || t.type === 'REFUND') && (t.account_id === accId || t.to_account_id === accId)) return sum + t.amount;
      if (t.type === 'TRANSFER' && t.to_account_id === accId) return sum + t.amount;
      return sum;
    }, 0);
  };

  const calcMoneyOut = (accId: string) => {
    const txs = getAccountTransactions(accId);
    return txs.reduce((sum, t) => {
      if ((t.type === 'EXPENSE' || !t.type) && (t.account_id === accId || t.from_account_id === accId)) return sum + t.amount;
      if (t.type === 'TRANSFER' && t.from_account_id === accId) return sum + t.amount;
      return sum;
    }, 0);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.header}>
          <PressableScale onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("SettingsHome");
            }
          }} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </PressableScale>
          <Text style={styles.title}>My Accounts</Text>
        </View>

        {accounts.map(acc => {
          const bal = calculateAccountBalance(acc, expenses);
          return (
            <PressableScale key={acc.id} style={styles.card} onPress={() => setSelectedAccount(acc)}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name={getAccountIcon(acc.type) as any} size={22} color={colors.primaryDark} />
                </View>
                <View style={styles.accInfo}>
                  <Text style={styles.accName}>{acc.name}</Text>
                  <Text style={styles.accType}>{acc.type.replace('_', ' ')}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
                <View>
                  <Text style={styles.balance}>{formatMoney(bal)}</Text>
                  {acc.last_reconciled_date && (
                    <Text style={{ color: colors.textTertiary, fontSize: FontSize.caption, marginTop: 4 }}>
                      Reconciled: {new Date(acc.last_reconciled_date).toLocaleDateString()}
                    </Text>
                  )}
                  {acc.actual_balance !== undefined && Math.abs(acc.actual_balance - bal) > 0.01 && (
                    <Text style={{ color: colors.warning, fontSize: FontSize.caption, marginTop: 2, fontWeight: "700" }}>
                      Drift: {formatMoney(Math.abs(acc.actual_balance - bal))}
                    </Text>
                  )}
                </View>
                <PressableScale style={styles.reconcileBtn} onPress={() => navigation.navigate("Reconcile", { accountId: acc.id })}>
                  <Text style={styles.reconcileText}>Reconcile</Text>
                </PressableScale>
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>

      <PressableScale style={styles.fab} onPress={() => setShowAddAccount(true)}>
        <MaterialCommunityIcons name="plus" size={28} color={colors.primaryText} />
      </PressableScale>

      {/* Account Detail Modal */}
      <Modal visible={!!selectedAccount} transparent animationType="slide" onRequestClose={() => setSelectedAccount(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAccount && (
              <>
                <Text style={styles.modalTitle}>{selectedAccount.name}</Text>
                
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatLabel}>Derived Balance</Text>
                  <Text style={styles.modalStatValue}>{formatMoney(calculateAccountBalance(selectedAccount, expenses))}</Text>
                </View>
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatLabel}>Opening Balance</Text>
                  <Text style={styles.modalStatValue}>{formatMoney(selectedAccount.opening_balance ?? selectedAccount.balance)}</Text>
                </View>
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatLabel}>Total Money In</Text>
                  <Text style={[styles.modalStatValue, { color: colors.healthy }]}>+{formatMoney(calcMoneyIn(selectedAccount.id))}</Text>
                </View>
                <View style={styles.modalStat}>
                  <Text style={styles.modalStatLabel}>Total Money Out</Text>
                  <Text style={styles.modalStatValue}>-{formatMoney(calcMoneyOut(selectedAccount.id))}</Text>
                </View>

                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
                <ScrollView style={{ maxHeight: 250 }}>
                  {getAccountTransactions(selectedAccount.id).slice(0, 10).map(t => {
                    const isIncome = (t.type === 'INCOME' || t.type === 'REFUND' || (t.type === 'TRANSFER' && t.to_account_id === selectedAccount.id));
                    return (
                      <View key={t.id} style={styles.txRow}>
                        <View>
                          <Text style={styles.txName}>{t.name}</Text>
                          <Text style={styles.txDate}>{new Date(t.date).toLocaleDateString()}</Text>
                        </View>
                        <Text style={isIncome ? styles.txAmountPos : styles.txAmountNeg}>
                          {isIncome ? '+' : '-'}{formatMoney(t.amount)}
                        </Text>
                      </View>
                    );
                  })}
                  {getAccountTransactions(selectedAccount.id).length === 0 && (
                    <Text style={{ color: colors.textTertiary, textAlign: "center", marginTop: 20 }}>No transactions yet</Text>
                  )}
                </ScrollView>

                <View style={styles.actionBtnRow}>
                  <PressableScale style={styles.actionBtn} onPress={() => openEdit(selectedAccount)}>
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </PressableScale>
                  <PressableScale style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(selectedAccount)}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </PressableScale>
                </View>
                <PressableScale style={styles.closeBtn} onPress={() => setSelectedAccount(null)}>
                  <Text style={styles.closeBtnText}>Done</Text>
                </PressableScale>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Account Modal */}
      <Modal visible={showAddAccount} transparent animationType="slide" onRequestClose={() => {
        setShowAddAccount(false);
        setEditingAccount(null);
      }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingAccount ? "Edit Account" : "Add Account"}</Text>
            
            <TextInput
              placeholder="Account Name (e.g. HDFC Checking)"
              placeholderTextColor={colors.inputPlaceholder}
              value={newAccName}
              onChangeText={setNewAccName}
              style={styles.input}
            />

            <TextInput
              placeholder="Current Balance"
              placeholderTextColor={colors.inputPlaceholder}
              value={newAccBalance}
              onChangeText={setNewAccBalance}
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.sectionTitle}>ACCOUNT TYPE</Text>
            <View style={styles.chipRow}>
              {['BANK', 'SAVINGS', 'WALLET', 'UPI_LITE', 'CASH', 'INVESTMENT'].map(t => (
                <PressableScale key={t} onPress={() => setNewAccType(t)} style={[styles.typeChip, newAccType === t && styles.typeChipActive]}>
                  <Text style={[styles.typeChipText, newAccType === t && styles.typeChipTextActive]}>{t.replace('_', ' ')}</Text>
                </PressableScale>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: Spacing.md, marginTop: Spacing.md }}>
              <PressableScale style={[styles.closeBtn, { flex: 1, backgroundColor: colors.surfaceElevated }]} onPress={() => {
                setShowAddAccount(false);
                setEditingAccount(null);
              }}>
                <Text style={[styles.closeBtnText, { color: colors.text }]}>Cancel</Text>
              </PressableScale>
              <PressableScale style={[styles.closeBtn, { flex: 1 }]} onPress={handleAddAccount}>
                <Text style={styles.closeBtnText}>{editingAccount ? "Save" : "Save Account"}</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
