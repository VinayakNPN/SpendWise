import React, { useState, useRef, useEffect } from "react";
import { Modal, StyleSheet, View, Text, TextInput, ScrollView, Platform, Keyboard, TouchableWithoutFeedback } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { useTheme } from "../state/ThemeContext";
import { useCategoriesQuery, useAccountsQuery, useAddExpenseMutation, useUpdateExpenseMutation, useExpensesQuery } from "../state/queries";
import { PressableScale } from "./PressableScale";
import { formatInputMoney, parseInputMoney, formatMoney } from "../utils/finance";
import { suggestForMerchant } from "../services/merchantIntelligence";
import { AmountInput } from "./AmountInput";
import type { ThemeColors } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";

const createStyles = (c: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: c.modalOverlay, justifyContent: "flex-end" },
    sheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.xl,
      maxHeight: "90%",
    },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.lg },
    title: { color: c.text, fontSize: FontSize.title, fontWeight: "800" },
    tabs: { flexDirection: "row", backgroundColor: c.cardBackground, borderRadius: Radius.md, padding: 4, marginBottom: Spacing.lg },
    tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: Radius.md },
    tabActive: { backgroundColor: c.primary },
    tabText: { fontWeight: "700", color: c.textSecondary },
    tabTextActive: { color: c.primaryText },
    
    nlRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
    nlInput: { flex: 1 },
    parseBtn: {
      backgroundColor: c.surfacePressed,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      marginBottom: 10,
    },
    parseText: { color: c.primary, fontWeight: "800" },

    input: {
      backgroundColor: c.inputBackground,
      color: c.inputText,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md + 2,
      paddingVertical: Spacing.md,
      marginBottom: Spacing.md,
      fontSize: FontSize.bodyLarge,
      fontWeight: "600",
    },
    amountInputWrap: {
      backgroundColor: c.inputBackground,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md + 2,
      paddingVertical: Spacing.md,
      marginBottom: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
    },
    amountCurrency: { color: c.textSecondary, fontSize: FontSize.bodyLarge, fontWeight: "800", marginRight: Spacing.sm },
    amountInput: {
      color: c.inputText,
      fontSize: FontSize.bodyLarge,
      fontWeight: "800",
      flex: 1,
    },
    labelSmall: { fontSize: FontSize.caption, fontWeight: "800", color: c.textTertiary, letterSpacing: 0.5, marginTop: Spacing.sm },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.cardBackground,
      borderWidth: 1,
      borderColor: c.chipBorder,
      borderRadius: Radius.pill,
      paddingHorizontal: Spacing.md + 2,
      paddingVertical: 10,
      marginRight: Spacing.sm,
      minHeight: 44,
    },
    chipText: { color: c.chipText, fontWeight: "700", fontSize: FontSize.small + 1 },
    saveBtn: {
      backgroundColor: c.primary,
      borderRadius: Radius.md + 2,
      alignItems: "center",
      paddingVertical: Spacing.md + 2,
      marginTop: Spacing.lg,
      marginBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
      minHeight: 48,
      justifyContent: "center",
    },
    saveText: { color: c.primaryText, fontWeight: "700", fontSize: FontSize.bodyLarge },
  });

interface AddTransactionSheetProps {
  visible: boolean;
  onClose: () => void;
  initialData?: any; // If editing
}

export const AddTransactionSheet = ({ visible, onClose, initialData }: AddTransactionSheetProps) => {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const { data: categories = [] } = useCategoriesQuery();
  const { data: accounts = [] } = useAccountsQuery();
  const { mutate: addExpense } = useAddExpenseMutation();
  const { mutate: updateExpense } = useUpdateExpenseMutation();

  const [type, setType] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [naturalInput, setNaturalInput] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  
  const { data: expenses = [] } = useExpensesQuery();

  const amountRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const scaleAnim = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setType(initialData.type || "EXPENSE");
        setName(initialData.name);
        setAmount(String(initialData.amount));
        setCategory(initialData.category);
        setAccountId(initialData.from_account_id || initialData.account_id || "");
        setToAccountId(initialData.to_account_id || "");
      } else {
        setType("EXPENSE");
        setName("");
        setAmount("");
        setCategory(categories[0]?.name || "");
        setAccountId("");
        setToAccountId("");
        setNaturalInput("");
      }
    }
  }, [visible, initialData, categories]);

  const parseNaturalInput = () => {
    const text = naturalInput.trim();
    if (!text) return;
    const amountMatch = text.match(/(\d+(\.\d+)?)/);
    if (!amountMatch) return;
    const parsedAmount = Number(amountMatch[1]);
    const parsedName = text.replace(amountMatch[0], "").trim() || "Expense";

    let mappedCategory = categories[0]?.name || "Other";
    for (const cat of categories) {
      if (text.toLowerCase().includes(cat.name.toLowerCase())) {
        mappedCategory = cat.name;
        break;
      }
    }

    setName(parsedName);
    setAmount(String(parsedAmount));
    setCategory(mappedCategory);
    amountRef.current?.focus();
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (type === "EXPENSE" && val.length > 2) {
      const suggestion = suggestForMerchant(val);
      if (suggestion.confidence >= 0.6 && suggestion.category) {
        setCategory(suggestion.category);
        if (suggestion.accountId && !accountId) {
          setAccountId(suggestion.accountId);
        }
      }
    }
  };

  const handleSave = (forceSave = false) => {
    if (!amount) return;
    
    const parsedAmount = Number(amount);
    
    if (!initialData && !forceSave && type === "EXPENSE") {
      // Duplicate Detection
      const today = new Date().toISOString().split('T')[0];
      const recentDuplicates = expenses.filter(e => 
        e.amount === parsedAmount && 
        e.date.startsWith(today) && 
        e.type === "EXPENSE"
      );
      
      if (recentDuplicates.length > 0) {
        setDuplicateWarning(recentDuplicates[0]);
        return; // stop save, show warning UI
      }
    }
    
    let txName = name;
    if (!txName && type === "TRANSFER") {
      const fromName = accounts.find(a => a.id === accountId)?.name || "Unknown";
      const toName = accounts.find(a => a.id === toAccountId)?.name || "Unknown";
      txName = `Transfer: ${fromName} to ${toName}`;
    } else if (!txName) {
      txName = type === "INCOME" ? "Income" : "Expense";
    }

    const payload = {
      name: txName,
      amount: parsedAmount,
      type,
      category: type === "TRANSFER" ? "Transfer" : category,
      date: initialData?.date || new Date().toISOString(),
      account_id: type === "TRANSFER" ? undefined : (accountId || undefined),
      from_account_id: type === "TRANSFER" ? (accountId || undefined) : undefined,
      to_account_id: type === "TRANSFER" ? (toAccountId || undefined) : undefined,
      merchant_name: type === "EXPENSE" ? txName : undefined,
    };

    if (initialData?.id) {
      updateExpense({ id: initialData.id, patch: payload });
    } else {
      addExpense(payload as any);
    }
    
    Keyboard.dismiss();
    setDuplicateWarning(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{initialData ? "Edit Transaction" : "New Transaction"}</Text>
                <PressableScale onPress={onClose} hitSlop={15}>
                  <Feather name="x" size={24} color={colors.textSecondary} />
                </PressableScale>
              </View>

              {!initialData && !duplicateWarning && (
                <View style={styles.tabs}>
                  {["EXPENSE", "INCOME", "TRANSFER"].map(t => (
                    <PressableScale key={t} style={[styles.tab, type === t && styles.tabActive]} onPress={() => setType(t as any)}>
                      <Text style={[styles.tabText, type === t && styles.tabTextActive]}>
                        {t === "TRANSFER" ? "Self Transfer" : t.charAt(0) + t.slice(1).toLowerCase()}
                      </Text>
                    </PressableScale>
                  ))}
                </View>
              )}

              {duplicateWarning ? (
                <View style={{ backgroundColor: colors.warningMuted || "#FFD54F30", padding: Spacing.lg, borderRadius: Radius.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.warning || "#FFB300" }}>
                  <Text style={{ color: colors.warning || colors.text, fontWeight: "700", fontSize: FontSize.subtitle, marginBottom: Spacing.sm }}>
                    ⚠️ Potential Duplicate Detected
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: FontSize.body, marginBottom: Spacing.lg, lineHeight: 22 }}>
                    This looks exactly like an existing transaction you added today: {"\n"}
                    <Text style={{ fontWeight: "700", color: colors.text }}>{duplicateWarning.name} for {formatMoney(duplicateWarning.amount)}</Text>.
                  </Text>
                  
                  <View style={{ flexDirection: "row", gap: Spacing.md }}>
                    <PressableScale style={{ flex: 1, backgroundColor: colors.surfaceElevated, padding: Spacing.md, borderRadius: Radius.md, alignItems: "center" }} onPress={() => setDuplicateWarning(null)}>
                      <Text style={{ color: colors.text, fontWeight: "700" }}>Cancel</Text>
                    </PressableScale>
                    <PressableScale style={{ flex: 1, backgroundColor: colors.warning || "#FFB300", padding: Spacing.md, borderRadius: Radius.md, alignItems: "center" }} onPress={() => handleSave(true)}>
                      <Text style={{ color: colors.background, fontWeight: "800" }}>Keep Both</Text>
                    </PressableScale>
                  </View>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {type === "EXPENSE" && !initialData && (
                  <View style={styles.nlRow}>
                    <TextInput
                      placeholder="Try: Swiggy 340"
                      placeholderTextColor={colors.inputPlaceholder}
                      value={naturalInput}
                      onChangeText={setNaturalInput}
                      style={[styles.input, styles.nlInput]}
                      returnKeyType="done"
                      onSubmitEditing={parseNaturalInput}
                    />
                    <PressableScale style={styles.parseBtn} onPress={parseNaturalInput}>
                      <Text style={styles.parseText}>Auto-fill</Text>
                    </PressableScale>
                  </View>
                )}

                <AmountInput
                  ref={amountRef}
                  value={amount}
                  onChangeAmount={setAmount}
                />

                {type !== "TRANSFER" && (
                  <TextInput
                    ref={nameRef}
                    placeholder={type === "INCOME" ? "Source (e.g. Salary, Bonus)" : "Merchant / Description"}
                    placeholderTextColor={colors.inputPlaceholder}
                    value={name}
                    onChangeText={handleNameChange}
                    style={styles.input}
                    returnKeyType="done"
                  />
                )}

                {type !== "TRANSFER" && (
                  <>
                    <Text style={styles.labelSmall}>CATEGORY</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginTop: 4 }} keyboardShouldPersistTaps="handled">
                      {categories.map((c) => {
                        const isActive = category === c.name;
                        return (
                          <PressableScale
                            key={c.id}
                            onPress={() => setCategory(c.name)}
                            style={[styles.chip, isActive && { backgroundColor: c.color, borderColor: c.color }]}
                          >
                            <MaterialCommunityIcons name={c.icon as any} size={14} color={isActive ? "#FFF" : c.color} style={{ marginRight: 6 }} />
                            <Text style={[styles.chipText, isActive && { color: "#FFF" }]}>{c.name}</Text>
                          </PressableScale>
                        );
                      })}
                    </ScrollView>
                  </>
                )}

                {accounts.length > 0 && (
                  <>
                    <Text style={styles.labelSmall}>{type === "TRANSFER" ? "FROM ACCOUNT" : "ACCOUNT (OPTIONAL)"}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginTop: 4 }} keyboardShouldPersistTaps="handled">
                      {type !== "TRANSFER" && (
                        <PressableScale
                          onPress={() => setAccountId("")}
                          style={[styles.chip, !accountId && { backgroundColor: colors.borderLight }]}
                        >
                          <Text style={styles.chipText}>None</Text>
                        </PressableScale>
                      )}
                      {accounts.map((a) => {
                        const isActive = accountId === a.id;
                        return (
                          <PressableScale
                            key={a.id}
                            onPress={() => setAccountId(a.id)}
                            style={[styles.chip, isActive && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                          >
                            <MaterialCommunityIcons name="bank-outline" size={14} color={isActive ? "#FFF" : colors.primary} style={{ marginRight: 6 }} />
                            <Text style={[styles.chipText, isActive && { color: "#FFF" }]}>{a.name}</Text>
                          </PressableScale>
                        );
                      })}
                    </ScrollView>
                  </>
                )}

                {type === "TRANSFER" && accounts.length > 0 && (
                  <>
                    <Text style={styles.labelSmall}>TO ACCOUNT</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginTop: 4 }} keyboardShouldPersistTaps="handled">
                      {accounts.filter(a => a.id !== accountId).map((a) => {
                        const isActive = toAccountId === a.id;
                        return (
                          <PressableScale
                            key={a.id}
                            onPress={() => setToAccountId(a.id)}
                            style={[styles.chip, isActive && { backgroundColor: colors.success, borderColor: colors.success }]}
                          >
                            <MaterialCommunityIcons name="bank-outline" size={14} color={isActive ? "#FFF" : colors.success} style={{ marginRight: 6 }} />
                            <Text style={[styles.chipText, isActive && { color: "#FFF" }]}>{a.name}</Text>
                          </PressableScale>
                        );
                      })}
                    </ScrollView>
                  </>
                )}

                <PressableScale style={styles.saveBtn} onPress={() => handleSave(false)}>
                  <Text style={styles.saveText}>{initialData ? "Update Transaction" : "Save Transaction"}</Text>
                </PressableScale>
                </ScrollView>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
