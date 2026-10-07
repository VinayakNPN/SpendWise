import React, { useState, useEffect } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, BackHandler } from "react-native";
import { MaterialCommunityIcons, Feather, Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAppStore } from "../state/AppStore";
import { formatInputMoney, parseInputMoney } from "../utils/finance";
import { useFinance } from "../utils/useFinance";
import { exportDatabaseToJSON } from "../services/database";
import { pickAndRestoreBackup } from "../services/backup";
import { useCategoriesQuery, useAddCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation, useIncomesQuery, useAddIncomeMutation, useDeleteIncomeMutation, useAccountsQuery, useAddAccountMutation, useDeleteAccountMutation, useUpdateAccountMutation } from "../state/queries";
import { PressableScale } from "../components/PressableScale";
import { useTheme } from "../state/ThemeContext";
import type { ThemeColors, ThemeMode } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";

const ICONS = ["food-outline", "home-outline", "car-outline", "heart-outline", "television-classic", "shopping-outline", "star-outline", "shape-outline", "cash", "bank", "airplane"];
const COLORS = ["#C78C4D", "#577A67", "#4F7AA4", "#D45A5A", "#875DB1", "#D36D4B", "#6176B7", "#61738A", "#2E7D32", "#1976D2", "#D81B60"];

const createStyles = (c: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: Spacing.lg, paddingBottom: 50 },
    section: { color: c.textTertiary, fontSize: FontSize.small + 1, letterSpacing: 1.3, fontWeight: "700", marginTop: 10 },
    title: { color: c.text, fontSize: 20.5, fontWeight: "800", marginBottom: Spacing.md },
    labelMain: { color: c.text, fontSize: 18.5, fontWeight: "700", marginTop: 6, marginBottom: 8 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Spacing.lg },
    addText: { color: c.primary, fontWeight: "700", fontSize: FontSize.bodyLarge },
    bigInputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: c.cardBackground, borderWidth: 1, borderColor: c.cardBorder, borderRadius: Radius.lg, paddingHorizontal: Spacing.md },
    currency: { color: c.textSecondary, fontSize: 22, marginRight: 8 },
    bigInput: { flex: 1, height: 58, color: c.text, fontSize: 18, fontWeight: "800" },
    help: { color: c.textTertiary, marginTop: 6, marginBottom: 8, fontWeight: "500", fontSize: FontSize.small },
    
    budgetStatus: { backgroundColor: c.forecastBackground, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: c.cardBorder },
    statusText: { fontSize: FontSize.body, fontWeight: "600", color: c.forecastBody, marginBottom: 4 },
    autoSplitBtn: { backgroundColor: c.primary, paddingVertical: 10, borderRadius: Radius.sm, alignItems: "center", marginTop: 10 },
    autoSplitText: { color: c.primaryText, fontWeight: "700" },

    row: { flexDirection: "row", alignItems: "center", backgroundColor: c.cardBackground, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.cardBorder, padding: 10, marginBottom: 8 },
    iconWrap: { width: 38, height: 38, borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
    catText: { color: c.text, fontSize: FontSize.bodyLarge, fontWeight: "600" },
    valueWrap: { flexDirection: "row", alignItems: "center", backgroundColor: c.inputBackground, borderRadius: Radius.md, paddingHorizontal: 10, width: 100 },
    valueCurrency: { color: c.textSecondary, marginRight: 6, fontWeight: "600" },
    valueInput: { height: 40, flex: 1, textAlign: "right", color: c.inputText, fontWeight: "700" },
    
    prefRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: c.cardBackground, borderWidth: 1, borderColor: c.cardBorder, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, marginBottom: 8 },
    prefLabel: { color: c.text, fontWeight: "600" },

    themeRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm, marginBottom: Spacing.lg },
    themeOption: { flex: 1, alignItems: "center", padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.cardBorder, backgroundColor: c.cardBackground },
    themeOptionActive: { borderColor: c.primary, backgroundColor: isDark ? c.primaryMuted : c.primaryMuted },
    themeOptionText: { marginTop: Spacing.sm, fontWeight: "600", color: c.textSecondary, fontSize: FontSize.small },
    themeOptionTextActive: { color: c.primary, fontWeight: "700" },

    modalOverlay: { flex: 1, backgroundColor: c.modalOverlay, justifyContent: "center", padding: Spacing.xl },
    modalCard: { backgroundColor: c.modalBackground, borderRadius: Radius.xl, padding: Spacing.xl },
    modalTitle: { fontSize: FontSize.title, fontWeight: "800", marginBottom: Spacing.lg, color: c.text },
    modalInput: { backgroundColor: c.inputBackground, padding: Spacing.md, borderRadius: Radius.md, fontWeight: "600", marginBottom: Spacing.lg, color: c.inputText },
    subLabel: { fontSize: FontSize.small, fontWeight: "700", color: c.textTertiary, marginBottom: 8 },
    iconScroll: { marginBottom: Spacing.lg },
    selIcon: { padding: 10, borderRadius: Radius.md, marginRight: 10, backgroundColor: c.cardBackground },
    selIconActive: { backgroundColor: c.chipActiveBackground, borderWidth: 1, borderColor: c.primary },
    colorBox: { width: 40, height: 40, borderRadius: 20, marginRight: 10, opacity: 0.5 },
    colorBoxActive: { opacity: 1, borderWidth: 3, borderColor: c.text },
    modalBtns: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20 },
    modalBtnCancel: { padding: Spacing.md, marginRight: 10 },
    modalBtnSave: { padding: Spacing.md, paddingHorizontal: Spacing.xl, backgroundColor: c.primary, borderRadius: Radius.md },
    
    typeChip: { borderRadius: Radius.md, borderWidth: 1, borderColor: c.chipBorder, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: c.chipBackground },
    typeChipActive: { backgroundColor: c.chipActiveBackground, borderColor: c.chipActiveBorder },
    typeText: { color: c.chipText, fontWeight: "600", fontSize: FontSize.small },
    typeTextActive: { color: c.chipActiveText },
  });

export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { budget, setBudget, preferences, setPreferences } = useAppStore();
  const { mode, setMode, colors, isDark } = useTheme();
  const { formatMoney } = useFinance();

  const styles = React.useMemo(() => createStyles(colors, isDark), [colors, isDark]);

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

  type Section = 'main' | 'money' | 'planning' | 'security' | 'data' | 'appearance';
  const [activeSection, setActiveSection] = useState<Section>('main');

  useEffect(() => {
    const backAction = () => {
      if (activeSection !== 'main') {
        setActiveSection('main');
        return true; // Prevent default behavior
      }
      return false; // Allow default behavior
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [activeSection]);

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



  const handleExportData = async () => {
    try {
      const json = exportDatabaseToJSON();
      if (!json) throw new Error("Failed to export data");
      
      const fileUri = `${(FileSystem as any).documentDirectory}Velnora_Backup_${new Date().toISOString().slice(0, 10)}.json`;
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

  const handleImportData = async () => {
    const success = await pickAndRestoreBackup();
    if (success) {
      // Force refresh data in UI if needed, or rely on restart
    }
  };

  const renderSectionHeader = (title: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg }}>
      <PressableScale onPress={() => setActiveSection('main')} style={{ paddingRight: Spacing.md }}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
      </PressableScale>
      <Text style={styles.title}>{title}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 14), paddingBottom: Math.max(insets.bottom, 50) }]} keyboardShouldPersistTaps="handled">
      {activeSection === 'main' && (
        <View>
          <Text style={styles.section}>PREFERENCES</Text>
          <Text style={styles.title}>Settings</Text>

          <PressableScale onPress={() => setActiveSection('money')} style={styles.prefRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="wallet-outline" size={22} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={styles.prefLabel}>Money & Budget</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </PressableScale>

          <PressableScale onPress={() => setActiveSection('planning')} style={styles.prefRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="chart-timeline-variant" size={22} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={styles.prefLabel}>Planning & Debt</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </PressableScale>

          <PressableScale onPress={() => setActiveSection('security')} style={styles.prefRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={styles.prefLabel}>Security & Privacy</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </PressableScale>

          <PressableScale onPress={() => setActiveSection('data')} style={styles.prefRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="database-outline" size={22} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={styles.prefLabel}>Data Management</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </PressableScale>

          <PressableScale onPress={() => setActiveSection('appearance')} style={styles.prefRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="palette-outline" size={22} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={styles.prefLabel}>Appearance</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </PressableScale>
        </View>
      )}

      {activeSection === 'appearance' && (
        <View>
          {renderSectionHeader('Appearance')}
          <Text style={styles.labelMain}>Theme</Text>
          <View style={styles.themeRow}>
            <PressableScale style={[styles.themeOption, mode === "light" && styles.themeOptionActive]} onPress={() => setMode("light")}>
              <Ionicons name="sunny-outline" size={24} color={mode === "light" ? colors.primary : colors.textSecondary} />
              <Text style={[styles.themeOptionText, mode === "light" && styles.themeOptionTextActive]}>Light</Text>
            </PressableScale>
            <PressableScale style={[styles.themeOption, mode === "dark" && styles.themeOptionActive]} onPress={() => setMode("dark")}>
              <Ionicons name="moon-outline" size={24} color={mode === "dark" ? colors.primary : colors.textSecondary} />
              <Text style={[styles.themeOptionText, mode === "dark" && styles.themeOptionTextActive]}>Dark</Text>
            </PressableScale>
            <PressableScale style={[styles.themeOption, mode === "system" && styles.themeOptionActive]} onPress={() => setMode("system")}>
              <Ionicons name="phone-portrait-outline" size={24} color={mode === "system" ? colors.primary : colors.textSecondary} />
              <Text style={[styles.themeOptionText, mode === "system" && styles.themeOptionTextActive]}>System</Text>
            </PressableScale>
          </View>
          <View style={[styles.prefRow, { marginTop: 20 }]}>
            <Text style={styles.prefLabel}>Compact mode</Text>
            <Switch value={preferences.compactMode} onValueChange={(value) => setPreferences({ ...preferences, compactMode: value })} trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }} thumbColor={colors.switchThumb} />
          </View>
        </View>
      )}

      {activeSection === 'money' && (
        <View>
          {renderSectionHeader('Money & Budget')}
          
          <PressableScale onPress={() => navigation.navigate("Accounts")} style={styles.prefRow}>
            <Text style={styles.prefLabel}>Manage Accounts</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </PressableScale>

          <Text style={[styles.labelMain, { marginTop: 16 }]}>Income & Cycle</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 2 }}>
              <Text style={styles.labelMain}>Monthly Income</Text>
              <View style={[styles.bigInputWrap, { paddingHorizontal: 12 }]}>
                <Text style={styles.currency}>₹</Text>
                <TextInput style={styles.bigInput} keyboardType="numeric" value={formatInputMoney(budget.monthlyIncome || 0)} placeholder="50,000" placeholderTextColor={colors.inputPlaceholder} onChangeText={(value) => setBudget({ ...budget, monthlyIncome: Number(parseInputMoney(value) || 0) })} />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.labelMain}>Paycheck</Text>
              <View style={[styles.bigInputWrap, { paddingHorizontal: 12 }]}>
                <TextInput style={styles.bigInput} keyboardType="numeric" value={budget.paycheckDate ? String(budget.paycheckDate) : ""} placeholder="e.g. 7" placeholderTextColor={colors.inputPlaceholder} onChangeText={(value) => setBudget({ ...budget, paycheckDate: Number(value || "1") })} />
              </View>
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.labelMain}>Monthly Budget</Text>
            <View style={styles.bigInputWrap}>
              <Text style={styles.currency}>₹</Text>
              <TextInput style={styles.bigInput} keyboardType="numeric" value={formatInputMoney(budget.monthlyLimit || 0)} placeholder="e.g. 30,000" placeholderTextColor={colors.inputPlaceholder} onChangeText={(value) => setBudget({ ...budget, monthlyLimit: Number(parseInputMoney(value) || 0) })} />
            </View>
            <Text style={styles.help}>Your actual target spending limit. This drives your dashboard rings.</Text>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.labelMain}>Daily Spending Limit</Text>
            <View style={styles.bigInputWrap}>
              <Text style={styles.currency}>₹</Text>
              <TextInput style={styles.bigInput} keyboardType="numeric" value={formatInputMoney(preferences.dailyLimit || 0)} placeholder="e.g. 800" placeholderTextColor={colors.inputPlaceholder} onChangeText={(value) => setPreferences({ ...preferences, dailyLimit: Number(parseInputMoney(value) || 0) })} />
            </View>
            <Text style={styles.help}>Limit your daily expenses (excluding transfers/investments/incomes).</Text>
          </View>

          <View style={[styles.headerRow, { marginTop: 24 }]}>
            <Text style={styles.labelMain}>Category Budgets</Text>
            <PressableScale onPress={() => setShowModal(true)}><Text style={styles.addText}>+ Add</Text></PressableScale>
          </View>

          <View style={styles.budgetStatus}>
            <Text style={styles.statusText}>Allocated: {formatMoney(totalAllocated)} / {formatMoney(overallIncome)}</Text>
            <Text style={[styles.statusText, { color: unallocated < 0 ? colors.destructive : colors.success }]}>
              {unallocated >= 0 ? `Unallocated: ${formatMoney(unallocated)}` : `Over-budget: ${formatMoney(Math.abs(unallocated))}`}
            </Text>
            <PressableScale style={styles.autoSplitBtn} onPress={handleAutoSplit}>
              <Text style={styles.autoSplitText}>Auto-Split Remaining</Text>
            </PressableScale>
          </View>

          {categories.map((cat) => (
            <View key={cat.id} style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: cat.color + (isDark ? "30" : "20") }]}><MaterialCommunityIcons name={cat.icon as any} size={18} color={cat.color} /></View>
              <View style={{ flex: 1, marginLeft: 10 }}><Text style={styles.catText}>{cat.name} {cat.is_fixed ? "📌" : ""}</Text></View>
              <View style={styles.valueWrap}>
                <Text style={styles.valueCurrency}>₹</Text>
                <TextInput style={styles.valueInput} keyboardType="numeric" value={formatInputMoney(cat.monthly_limit || 0)} onChangeText={(val) => updateCategory({ id: cat.id, patch: { monthly_limit: Number(parseInputMoney(val) || 0) } })} />
              </View>
              <PressableScale onPress={() => deleteCategory(cat.id)} style={{ paddingLeft: 10 }}><Feather name="trash-2" size={16} color={colors.textTertiary} /></PressableScale>
            </View>
          ))}
          
          <View style={[styles.headerRow, { marginTop: 24 }]}>
            <Text style={styles.labelMain}>Extra Incomes</Text>
            <PressableScale onPress={() => setShowIncomeModal(true)}><Text style={styles.addText}>+ Log</Text></PressableScale>
          </View>
          {incomes.map(inc => (
            <View key={inc.id} style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: colors.successMuted }]}><MaterialCommunityIcons name="cash-plus" size={18} color={colors.success} /></View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.catText}>{inc.source}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{inc.date.slice(0,10)} {inc.is_recurring ? "🔄" : ""}</Text>
              </View>
              <Text style={{ fontWeight: "700", color: colors.success }}>+{formatMoney(inc.amount)}</Text>
              <PressableScale onPress={() => deleteIncome(inc.id)} style={{ paddingLeft: 10 }}><Feather name="trash-2" size={16} color={colors.textTertiary} /></PressableScale>
            </View>
          ))}
        </View>
      )}

      {activeSection === 'planning' && (
        <View>
          {renderSectionHeader('Planning & Debt')}
          
          <PressableScale onPress={() => navigation.navigate("Debt")} style={[styles.prefRow, { marginTop: 10 }]}>
            <Text style={styles.prefLabel}>Debt Tracker</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </PressableScale>
          
          <PressableScale onPress={() => navigation.navigate("PF")} style={styles.prefRow}>
            <Text style={styles.prefLabel}>Provident Fund (PF)</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </PressableScale>
          
          <PressableScale onPress={() => navigation.navigate("DashboardHome", { screen: 'RecurringPayments' })} style={styles.prefRow}>
            <Text style={styles.prefLabel}>Recurring Payments</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </PressableScale>
        </View>
      )}

      {activeSection === 'security' && (
        <View>
          {renderSectionHeader('Security & Privacy')}
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>Global Privacy Mode</Text>
            <Switch value={preferences.isPrivacyEnabled} onValueChange={(value) => setPreferences({ ...preferences, isPrivacyEnabled: value })} trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }} thumbColor={colors.switchThumb} />
          </View>
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>Biometric App Lock</Text>
            <Switch value={preferences.biometricLock} onValueChange={(value) => setPreferences({ ...preferences, biometricLock: value })} trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }} thumbColor={colors.switchThumb} />
          </View>
        </View>
      )}

      {activeSection === 'data' && (
        <View>
          {renderSectionHeader('Data Management')}
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated }]}><MaterialCommunityIcons name="database-export" size={18} color={colors.textSecondary} /></View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.catText}>Export Data</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Backup your entire database</Text>
            </View>
            <PressableScale onPress={handleExportData} style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
               <Text style={{ color: colors.primaryText, fontWeight: "700" }}>Export</Text>
            </PressableScale>
          </View>
          
          <PressableScale onPress={handleImportData} style={[styles.row, { marginTop: 10 }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated }]}><MaterialCommunityIcons name="database-import" size={18} color={colors.textSecondary} /></View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.catText}>Import Data</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Restore from a JSON file</Text>
            </View>
          </PressableScale>
        </View>
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Category</Text>
            <TextInput style={styles.modalInput} placeholder="Category Name" placeholderTextColor={colors.inputPlaceholder} value={newCatName} onChangeText={setNewCatName} />
            <TextInput style={styles.modalInput} placeholder="Monthly Target Amount (₹)" placeholderTextColor={colors.inputPlaceholder} keyboardType="numeric" value={formatInputMoney(newCatAmount)} onChangeText={v => setNewCatAmount(parseInputMoney(v))} />
            
            <Text style={styles.subLabel}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll} keyboardShouldPersistTaps="handled">
              {ICONS.map(ic => (
                <PressableScale key={ic} onPress={() => setNewCatIcon(ic)} style={[styles.selIcon, newCatIcon === ic && styles.selIconActive]}>
                  <MaterialCommunityIcons name={ic as any} size={24} color={newCatIcon === ic ? colors.primary : colors.textTertiary} />
                </PressableScale>
              ))}
            </ScrollView>

            <Text style={styles.subLabel}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll} keyboardShouldPersistTaps="handled">
              {COLORS.map(c => (
                <PressableScale key={c} onPress={() => setNewCatColor(c)} style={[styles.colorBox, { backgroundColor: c }, newCatColor === c && styles.colorBoxActive]}><View /></PressableScale>
              ))}
            </ScrollView>

            <View style={[styles.prefRow, { marginTop: 10 }]}>
              <Text style={styles.prefLabel}>Fixed/Recurring Expense?</Text>
              <Switch value={newCatFixed} onValueChange={setNewCatFixed} trackColor={{ false: colors.switchTrackOff, true: colors.primary }} thumbColor={colors.switchThumb} />
            </View>
            <Text style={styles.help}>Fixed expenses are excluded from Auto-Split.</Text>

            <View style={styles.modalBtns}>
              <PressableScale style={styles.modalBtnCancel} onPress={() => setShowModal(false)}><Text style={{ color: colors.destructive, fontWeight: "700" }}>Cancel</Text></PressableScale>
              <PressableScale style={styles.modalBtnSave} onPress={handleAddCategory}><Text style={{ color: colors.primaryText, fontWeight: "700" }}>Save</Text></PressableScale>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showIncomeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Extra Income</Text>
            <TextInput style={styles.modalInput} placeholder="Source (e.g. Freelance, Bonus)" placeholderTextColor={colors.inputPlaceholder} value={newIncSource} onChangeText={setNewIncSource} />
            <TextInput style={styles.modalInput} placeholder="Amount" placeholderTextColor={colors.inputPlaceholder} keyboardType="numeric" value={formatInputMoney(newIncAmount)} onChangeText={v => setNewIncAmount(parseInputMoney(v))} />

            <View style={[styles.prefRow, { marginTop: 10, borderWidth: 0, paddingHorizontal: 0 }]}>
              <Text style={styles.prefLabel}>Is this a recurring monthly income?</Text>
              <Switch value={newIncRecurring} onValueChange={setNewIncRecurring} trackColor={{ false: colors.switchTrackOff, true: colors.primary }} thumbColor={colors.switchThumb} />
            </View>

            <View style={styles.modalBtns}>
              <PressableScale style={styles.modalBtnCancel} onPress={() => setShowIncomeModal(false)}><Text style={{ color: colors.destructive, fontWeight: "700" }}>Cancel</Text></PressableScale>
              <PressableScale style={styles.modalBtnSave} onPress={handleAddIncome}><Text style={{ color: colors.primaryText, fontWeight: "700" }}>Save</Text></PressableScale>
            </View>
          </View>
        </View>
      </Modal>


    </ScrollView>
  );
};
