import React, { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "../state/AppStore";
import { formatMoney, formatInputMoney, parseInputMoney } from "../utils/finance";
import { exportDatabaseToJSON } from "../services/database";
import { useCategoriesQuery, useAddCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation, useIncomesQuery, useAddIncomeMutation, useDeleteIncomeMutation, useAccountsQuery, useAddAccountMutation, useDeleteAccountMutation, useUpdateAccountMutation } from "../state/queries";

const ICONS = ["food-outline", "home-outline", "car-outline", "heart-outline", "television-classic", "shopping-outline", "star-outline", "shape-outline", "cash", "bank", "airplane"];
const COLORS = ["#C78C4D", "#577A67", "#4F7AA4", "#D45A5A", "#875DB1", "#D36D4B", "#6176B7", "#61738A", "#2E7D32", "#1976D2", "#D81B60"];

export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const { budget, setBudget, preferences, setPreferences } = useAppStore();
  const { data: categories = [] } = useCategoriesQuery();
  const { mutate: addCategory } = useAddCategoryMutation();
  const { mutate: updateCategory } = useUpdateCategoryMutation();
  const { mutate: deleteCategory } = useDeleteCategoryMutation();
  
  const { data: incomes = [] } = useIncomesQuery();
  const { mutate: addIncome } = useAddIncomeMutation();
  const { mutate: deleteIncome } = useDeleteIncomeMutation();

  const { data: accounts = [] } = useAccountsQuery();
  const { mutate: addAccount } = useAddAccountMutation();
  const { mutate: deleteAccount } = useDeleteAccountMutation();
  const { mutate: updateAccount } = useUpdateAccountMutation();

  const [showModal, setShowModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatAmount, setNewCatAmount] = useState("");
  const [newCatIcon, setNewCatIcon] = useState(ICONS[0]);
  const [newCatColor, setNewCatColor] = useState(COLORS[0]);
  const [newCatFixed, setNewCatFixed] = useState(false);

  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [newIncSource, setNewIncSource] = useState("");
  const [newIncAmount, setNewIncAmount] = useState("");
  const [newIncRecurring, setNewIncRecurring] = useState(false);

  const [showAccModal, setShowAccModal] = useState(false);
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState<"SAVINGS" | "EMERGENCY_FUND">("SAVINGS");
  const [newAccBalance, setNewAccBalance] = useState("");

  const totalIncome = budget.monthlyIncome || 0;
  const totalExtraIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const overallIncome = totalIncome + totalExtraIncome;
  
  const totalAllocated = categories.reduce((sum, cat) => sum + cat.monthly_limit, 0);
  const unallocated = overallIncome - totalAllocated;

  const handleAutoSplit = () => {
    if (overallIncome <= 0) return Alert.alert("Error", "Please set your monthly income first.");
    const fixedCategories = categories.filter(c => c.is_fixed);
    const flexibleCategories = categories.filter(c => !c.is_fixed);
    
    if (flexibleCategories.length === 0) return Alert.alert("No flexible categories", "All your categories are marked as fixed.");
    
    const fixedSum = fixedCategories.reduce((sum, c) => sum + c.monthly_limit, 0);
    const remaining = overallIncome - fixedSum;
    
    if (remaining < 0) return Alert.alert("Over-budget", "Your fixed expenses exceed your income!");
    
    const splitAmount = Math.floor(remaining / flexibleCategories.length);
    
    flexibleCategories.forEach(cat => {
      updateCategory({ id: cat.id, patch: { monthly_limit: splitAmount } });
    });
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      icon: newCatIcon,
      color: newCatColor,
      monthly_limit: Number(newCatAmount || 0),
      is_fixed: newCatFixed
    });
    setNewCatName("");
    setNewCatAmount("");
    setShowModal(false);
  };

  const handleAddIncome = () => {
    if (!newIncSource.trim() || !newIncAmount) return;
    addIncome({
      source: newIncSource.trim(),
      amount: Number(newIncAmount),
      date: new Date().toISOString(),
      is_recurring: newIncRecurring
    });
    setNewIncSource("");
    setNewIncAmount("");
    setShowIncomeModal(false);
  };

  const handleAddAccount = () => {
    if (!newAccName.trim() || !newAccBalance) return;
    addAccount({
      name: newAccName.trim(),
      type: newAccType,
      balance: Number(newAccBalance)
    });
    setNewAccName("");
    setNewAccBalance("");
    setShowAccModal(false);
  };

  const handleExportData = async () => {
    try {
      const json = exportDatabaseToJSON();
      if (!json) throw new Error("Failed to export data");
      
      const fileUri = `${FileSystem.documentDirectory}SpendWise_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      await FileSystem.writeAsStringAsync(fileUri, json);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Export Successful", `File saved to ${fileUri}`);
      }
    } catch (e: any) {
      Alert.alert("Export Failed", e.message || "Something went wrong.");
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 14), paddingBottom: Math.max(insets.bottom, 50) }]}>
      <Text style={styles.section}>INCOME & CYCLE</Text>
      <Text style={styles.title}>Settings</Text>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 2 }}>
          <Text style={styles.labelMain}>Monthly Income</Text>
          <View style={[styles.bigInputWrap, { paddingHorizontal: 12 }]}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              style={styles.bigInput}
              keyboardType="numeric"
              value={formatInputMoney(budget.monthlyIncome || 0)}
              placeholder="50,000"
              placeholderTextColor="#A0ABA6"
              onChangeText={(value) => setBudget({ ...budget, monthlyIncome: Number(parseInputMoney(value) || 0) })}
            />
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.labelMain}>Paycheck</Text>
          <View style={[styles.bigInputWrap, { paddingHorizontal: 12 }]}>
            <TextInput
              style={styles.bigInput}
              keyboardType="numeric"
              value={budget.paycheckDate ? String(budget.paycheckDate) : ""}
              placeholder="e.g. 7"
              placeholderTextColor="#A0ABA6"
              onChangeText={(value) => setBudget({ ...budget, paycheckDate: Number(value || "1") })}
            />
          </View>
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={styles.labelMain}>Monthly Budget</Text>
        <View style={styles.bigInputWrap}>
          <Text style={styles.currency}>₹</Text>
          <TextInput
            style={styles.bigInput}
            keyboardType="numeric"
            value={formatInputMoney(budget.monthlyLimit || 0)}
            placeholder="e.g. 30,000"
            placeholderTextColor="#A0ABA6"
            onChangeText={(value) => setBudget({ ...budget, monthlyLimit: Number(parseInputMoney(value) || 0) })}
          />
        </View>
        <Text style={styles.help}>Your actual target spending limit. This drives your dashboard rings.</Text>
      </View>

      {/* --- EXTRA INCOMES --- */}
      <View style={styles.headerRow}>
        <Text style={styles.labelMain}>Extra Incomes (Side Hustles)</Text>
        <Pressable onPress={() => setShowIncomeModal(true)}>
          <Text style={styles.addText}>+ Log Income</Text>
        </Pressable>
      </View>
      {incomes.map(inc => (
        <View key={inc.id} style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: "#D5E8D4" }]}>
            <MaterialCommunityIcons name="cash-plus" size={18} color="#2E7D32" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.catText}>{inc.source}</Text>
            <Text style={{ fontSize: 12, color: "#8A9792" }}>{inc.date.slice(0,10)} {inc.is_recurring ? "🔄" : ""}</Text>
          </View>
          <Text style={{ fontWeight: "700", color: "#2E7D32" }}>+{formatMoney(inc.amount)}</Text>
          <Pressable onPress={() => deleteIncome(inc.id)} style={{ paddingLeft: 10 }}>
            <Feather name="trash-2" size={16} color="#A0ABA6" />
          </Pressable>
        </View>
      ))}
      <Text style={styles.help}>Track side hustles, bonuses, and gifts.</Text>

      {/* --- ACCOUNTS --- */}
      <View style={styles.headerRow}>
        <Text style={styles.labelMain}>Accounts & Balances</Text>
        <Pressable onPress={() => setShowAccModal(true)}>
          <Text style={styles.addText}>+ Add Account</Text>
        </Pressable>
      </View>
      {accounts.map(acc => (
        <View key={acc.id} style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: acc.type === 'EMERGENCY_FUND' ? "#FCE4EC" : "#E3F2FD" }]}>
            <MaterialCommunityIcons name={acc.type === 'EMERGENCY_FUND' ? "shield-plus" : "bank"} size={18} color={acc.type === 'EMERGENCY_FUND' ? "#D81B60" : "#1976D2"} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.catText}>{acc.name}</Text>
            <Text style={{ fontSize: 12, color: "#8A9792" }}>{acc.type}</Text>
          </View>
          <View style={styles.valueWrap}>
            <Text style={styles.valueCurrency}>₹</Text>
            <TextInput
              style={styles.valueInput}
              keyboardType="numeric"
              value={formatInputMoney(String(acc.balance || 0))}
              onChangeText={(val) => updateAccount({ id: acc.id, patch: { balance: Number(parseInputMoney(val) || 0) } })}
            />
          </View>
          <Pressable onPress={() => deleteAccount(acc.id)} style={{ paddingLeft: 10 }}>
            <Feather name="trash-2" size={16} color="#A0ABA6" />
          </Pressable>
        </View>
      ))}
      <Text style={styles.help}>Emergency funds & liquid savings to include in your net worth.</Text>

      <View style={styles.headerRow}>
        <Text style={styles.labelMain}>Category Budgets</Text>
        <Pressable onPress={() => setShowModal(true)}>
          <Text style={styles.addText}>+ Add</Text>
        </Pressable>
      </View>

      <View style={styles.budgetStatus}>
        <Text style={styles.statusText}>Allocated: {formatMoney(totalAllocated)} / {formatMoney(overallIncome)}</Text>
        <Text style={[styles.statusText, { color: unallocated < 0 ? "#D32F2F" : "#2D8A73" }]}>
          {unallocated >= 0 ? `Unallocated: ${formatMoney(unallocated)}` : `Over-budget: ${formatMoney(Math.abs(unallocated))}`}
        </Text>
        <Pressable style={styles.autoSplitBtn} onPress={handleAutoSplit}>
          <Text style={styles.autoSplitText}>Auto-Split Remaining</Text>
        </Pressable>
      </View>

      {categories.map((cat) => (
        <View key={cat.id} style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: cat.color + "20" }]}>
            <MaterialCommunityIcons name={cat.icon as any} size={18} color={cat.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.catText}>{cat.name} {cat.is_fixed ? "📌" : ""}</Text>
          </View>
          <View style={styles.valueWrap}>
            <Text style={styles.valueCurrency}>₹</Text>
            <TextInput
              style={styles.valueInput}
              keyboardType="numeric"
              value={formatInputMoney(cat.monthly_limit || 0)}
              onChangeText={(val) => updateCategory({ id: cat.id, patch: { monthly_limit: Number(parseInputMoney(val) || 0) } })}
            />
          </View>
          <Pressable onPress={() => deleteCategory(cat.id)} style={{ paddingLeft: 10 }}>
            <Feather name="trash-2" size={16} color="#A0ABA6" />
          </Pressable>
        </View>
      ))}

      <Text style={[styles.labelMain, { marginTop: 20 }]}>Basic preferences</Text>
      <View style={styles.prefRow}>
        <Text style={styles.prefLabel}>Daily reminder</Text>
        <Switch
          value={preferences.dailyReminder}
          onValueChange={(value) => setPreferences({ ...preferences, dailyReminder: value })}
          trackColor={{ false: "#CED6D2", true: "#8BB2A9" }}
          thumbColor="#FFFFFF"
        />
      </View>
      <View style={styles.prefRow}>
        <Text style={styles.prefLabel}>Compact mode</Text>
        <Switch
          value={preferences.compactMode}
          onValueChange={(value) => setPreferences({ ...preferences, compactMode: value })}
          trackColor={{ false: "#CED6D2", true: "#8BB2A9" }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.labelMain}>Data Management</Text>
      </View>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: "#E3E8E5" }]}>
          <MaterialCommunityIcons name="database-export" size={18} color="#455551" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.catText}>Export Data</Text>
          <Text style={{ fontSize: 12, color: "#8A9792" }}>Backup your entire database as a JSON file</Text>
        </View>
        <Pressable onPress={handleExportData} style={{ backgroundColor: "#184B43", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
           <Text style={{ color: "#FFF", fontWeight: "700" }}>Export</Text>
        </Pressable>
      </View>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Category</Text>
            <TextInput style={styles.modalInput} placeholder="Category Name" placeholderTextColor="#7E8E88" value={newCatName} onChangeText={setNewCatName} />
            <TextInput style={styles.modalInput} placeholder="Monthly Target Amount (₹)" placeholderTextColor="#7E8E88" keyboardType="numeric" value={formatInputMoney(newCatAmount)} onChangeText={v => setNewCatAmount(parseInputMoney(v))} />
            
            <Text style={styles.subLabel}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
              {ICONS.map(ic => (
                <Pressable key={ic} onPress={() => setNewCatIcon(ic)} style={[styles.selIcon, newCatIcon === ic && styles.selIconActive]}>
                  <MaterialCommunityIcons name={ic as any} size={24} color={newCatIcon === ic ? "#184B43" : "#8A9792"} />
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.subLabel}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
              {COLORS.map(c => (
                <Pressable key={c} onPress={() => setNewCatColor(c)} style={[styles.colorBox, { backgroundColor: c }, newCatColor === c && styles.colorBoxActive]} />
              ))}
            </ScrollView>

            <View style={[styles.prefRow, { marginTop: 10 }]}>
              <Text style={styles.prefLabel}>Fixed/Recurring Expense?</Text>
              <Switch value={newCatFixed} onValueChange={setNewCatFixed} />
            </View>
            <Text style={styles.help}>Fixed expenses are excluded from Auto-Split.</Text>

            <View style={styles.modalBtns}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setShowModal(false)}><Text style={{ color: "#D32F2F", fontWeight: "700" }}>Cancel</Text></Pressable>
              <Pressable style={styles.modalBtnSave} onPress={handleAddCategory}><Text style={{ color: "#FFF", fontWeight: "700" }}>Save</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showIncomeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Extra Income</Text>
            <TextInput style={styles.modalInput} placeholder="Source (e.g. Freelance, Bonus)" placeholderTextColor="#7E8E88" value={newIncSource} onChangeText={setNewIncSource} />
            <TextInput style={styles.modalInput} placeholder="Amount" placeholderTextColor="#7E8E88" keyboardType="numeric" value={formatInputMoney(newIncAmount)} onChangeText={v => setNewIncAmount(parseInputMoney(v))} />

            <View style={[styles.prefRow, { marginTop: 10, borderWidth: 0, paddingHorizontal: 0 }]}>
              <Text style={styles.prefLabel}>Is this a recurring monthly income?</Text>
              <Switch value={newIncRecurring} onValueChange={setNewIncRecurring} />
            </View>

            <View style={styles.modalBtns}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setShowIncomeModal(false)}><Text style={{ color: "#D32F2F", fontWeight: "700" }}>Cancel</Text></Pressable>
              <Pressable style={styles.modalBtnSave} onPress={handleAddIncome}><Text style={{ color: "#FFF", fontWeight: "700" }}>Save</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAccModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Account</Text>
            <TextInput style={styles.modalInput} placeholder="Account Name (e.g. HDFC Savings)" placeholderTextColor="#7E8E88" value={newAccName} onChangeText={setNewAccName} />
            <TextInput style={styles.modalInput} placeholder="Current Balance (₹)" placeholderTextColor="#7E8E88" keyboardType="numeric" value={formatInputMoney(newAccBalance)} onChangeText={v => setNewAccBalance(parseInputMoney(v))} />

            <Text style={styles.subLabel}>Account Type</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
               <Pressable onPress={() => setNewAccType("SAVINGS")} style={[styles.typeChip, newAccType === "SAVINGS" && styles.typeChipActive]}>
                 <Text style={[styles.typeText, newAccType === "SAVINGS" && styles.typeTextActive]}>SAVINGS</Text>
               </Pressable>
               <Pressable onPress={() => setNewAccType("EMERGENCY_FUND")} style={[styles.typeChip, newAccType === "EMERGENCY_FUND" && styles.typeChipActive]}>
                 <Text style={[styles.typeText, newAccType === "EMERGENCY_FUND" && styles.typeTextActive]}>EMERGENCY FUND</Text>
               </Pressable>
            </View>

            {newAccType === "EMERGENCY_FUND" && (
               <Text style={[styles.help, { marginBottom: 16, color: '#184B43' }]}>💡 Recommended target: {formatMoney(totalAllocated * 6)} (6x Monthly Expenses)</Text>
            )}

            <View style={styles.modalBtns}>
              <Pressable style={styles.modalBtnCancel} onPress={() => setShowAccModal(false)}><Text style={{ color: "#D32F2F", fontWeight: "700" }}>Cancel</Text></Pressable>
              <Pressable style={styles.modalBtnSave} onPress={handleAddAccount}><Text style={{ color: "#FFF", fontWeight: "700" }}>Save</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F6F5" },
  content: { padding: 14, paddingBottom: 50 },
  section: { color: "#8B9792", fontSize: 13, letterSpacing: 1.3, fontWeight: "700", marginTop: 10 },
  title: { color: "#1F2928", fontSize: 41 / 2, fontWeight: "800", marginBottom: 12 },
  labelMain: { color: "#303937", fontSize: 37 / 2, fontWeight: "700", marginTop: 6, marginBottom: 8 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  addText: { color: "#184B43", fontWeight: "700", fontSize: 15 },
  bigInputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8E5", borderRadius: 16, paddingHorizontal: 14 },
  currency: { color: "#6F7A76", fontSize: 22, marginRight: 8 },
  bigInput: { flex: 1, height: 58, color: "#2A3230", fontSize: 36 / 2, fontWeight: "800" },
  help: { color: "#7F8C87", marginTop: 6, marginBottom: 8, fontWeight: "500", fontSize: 12 },
  
  budgetStatus: { backgroundColor: "#EDF2F0", padding: 14, borderRadius: 12, marginBottom: 16 },
  statusText: { fontSize: 14, fontWeight: "600", color: "#4A5652", marginBottom: 4 },
  autoSplitBtn: { backgroundColor: "#184B43", paddingVertical: 10, borderRadius: 8, alignItems: "center", marginTop: 10 },
  autoSplitText: { color: "#FFF", fontWeight: "700" },

  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E2E8E5", padding: 10, marginBottom: 8 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  catText: { color: "#2F3836", fontSize: 15, fontWeight: "600" },
  valueWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F4F2", borderRadius: 12, paddingHorizontal: 10, width: 100 },
  valueCurrency: { color: "#8A9792", marginRight: 6, fontWeight: "600" },
  valueInput: { height: 40, flex: 1, textAlign: "right", color: "#46524E", fontWeight: "700" },
  
  prefRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8E5", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8 },
  prefLabel: { color: "#2D3734", fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16 },
  modalInput: { backgroundColor: "#F1F4F2", padding: 12, borderRadius: 12, fontWeight: "600", marginBottom: 16 },
  subLabel: { fontSize: 12, fontWeight: "700", color: "#8A9792", marginBottom: 8 },
  iconScroll: { marginBottom: 16 },
  selIcon: { padding: 10, borderRadius: 12, marginRight: 10, backgroundColor: "#F4F6F5" },
  selIconActive: { backgroundColor: "#DCE5E3", borderWidth: 1, borderColor: "#184B43" },
  colorBox: { width: 40, height: 40, borderRadius: 20, marginRight: 10, opacity: 0.5 },
  colorBoxActive: { opacity: 1, borderWidth: 3, borderColor: "#333" },
  modalBtns: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20 },
  modalBtnCancel: { padding: 12, marginRight: 10 },
  modalBtnSave: { padding: 12, paddingHorizontal: 20, backgroundColor: "#184B43", borderRadius: 12 },
  
  typeChip: { borderRadius: 12, borderWidth: 1, borderColor: "#DCE3DF", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#F4F6F5" },
  typeChipActive: { backgroundColor: "#184B43", borderColor: "#184B43" },
  typeText: { color: "#46524E", fontWeight: "600", fontSize: 12 },
  typeTextActive: { color: "#FFFFFF" }
});
