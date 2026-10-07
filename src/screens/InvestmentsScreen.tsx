import React, { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { format, parse } from "date-fns";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useAppStore } from "../state/AppStore";
import { useInvestmentsQuery, useAddInvestmentMutation, useDeleteInvestmentMutation, useAccountsQuery, useGoalsQuery, useIncomesQuery, useExpensesQuery } from "../state/queries";
import { calculateInvestmentProjections, getInvestableSurplus } from "../utils/investmentCalc";
import { calculateNetWorth, formatInputMoney, parseInputMoney } from "../utils/finance";
import { useFinance } from "../utils/useFinance";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PressableScale } from "../components/PressableScale";
import { useTheme } from "../state/ThemeContext";
import type { ThemeColors } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";

const createStyles = (c: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: Spacing.lg + 2, paddingBottom: 34 },
    nwCard: { backgroundColor: isDark ? c.surfaceElevated : c.primary, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.xl },
    nwTitle: { color: isDark ? c.textTertiary : "#1C2B28", fontSize: FontSize.small, fontWeight: "700", letterSpacing: 1.5, marginBottom: 4 },
    nwAmount: { color: isDark ? c.primary : "#000000", fontSize: 38, fontWeight: "800", marginBottom: Spacing.lg },
    nwRow: { flexDirection: "row", backgroundColor: isDark ? c.surface : "#A5D6A7", borderRadius: Radius.md + 2, padding: Spacing.md },
    nwCol: { flex: 1, paddingHorizontal: Spacing.sm },
    nwDivider: { width: 1, backgroundColor: isDark ? c.border : "#81C784", marginVertical: 4 },
    nwSub: { color: isDark ? c.textTertiary : "#1C2B28", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
    nwSubVal: { color: isDark ? c.text : "#000000", fontSize: FontSize.bodyLarge, fontWeight: "700", marginTop: 2 },
    nwMeta: { fontSize: FontSize.caption, color: isDark ? c.textTertiary : "#1C2B28", fontWeight: "600" },
    section: { color: c.textTertiary, fontSize: FontSize.small + 1, letterSpacing: 1.3, fontWeight: "700", marginTop: 10 },
    titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md + 2 },
    title: { color: c.text, fontSize: 20.5, fontWeight: "800" },
    addBtn: { backgroundColor: c.primary, borderRadius: Radius.lg + 2, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
    addText: { color: c.primaryText, fontWeight: "700" },
    insightsCard: { backgroundColor: c.forecastBackground, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: c.cardBorder },
    insightsTitle: { fontSize: FontSize.bodyLarge, fontWeight: "700", color: c.forecastTitle, marginBottom: 6 },
    insightText: { fontSize: FontSize.small + 1, color: c.forecastBody, marginBottom: 4, lineHeight: 18 },
    summaryCard: { backgroundColor: c.cardBackground, borderRadius: Radius.xl, borderWidth: 1, borderColor: c.cardBorder, padding: Spacing.xl, marginBottom: Spacing.lg },
    summaryHead: { color: c.textTertiary, fontWeight: "700", letterSpacing: 1.2, fontSize: FontSize.small },
    summaryAmount: { color: c.text, fontSize: 32, fontWeight: "800", marginVertical: Spacing.sm },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginTop: Spacing.sm },
    summarySubLabel: { color: c.textTertiary, fontSize: FontSize.small, fontWeight: "600", marginBottom: 2 },
    summarySubValue: { color: c.text, fontSize: FontSize.bodyLarge, fontWeight: "700" },
    commitmentRow: { marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: c.divider },
    commitmentText: { color: c.textSecondary, fontSize: FontSize.small + 1, fontWeight: "600" },
    formCard: { backgroundColor: c.cardBackground, borderRadius: Radius.lg + 2, borderWidth: 1, borderColor: c.cardBorder, padding: Spacing.lg, marginBottom: Spacing.md + 2 },
    formTitle: { color: c.text, fontSize: FontSize.title, fontWeight: "700", marginBottom: Spacing.md + 2 },
    label: { color: c.textTertiary, fontSize: FontSize.caption, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6 },
    input: { backgroundColor: c.inputBackground, color: c.inputText, borderRadius: Radius.md, paddingHorizontal: Spacing.md + 2, paddingVertical: Spacing.md, marginBottom: Spacing.md, fontWeight: "500" },
    notes: { minHeight: 76, textAlignVertical: "top" },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md, marginTop: 4 },
    switchLabel: { color: c.text, fontWeight: "600", fontSize: FontSize.body },
    typeChip: { borderRadius: Radius.lg + 2, borderWidth: 1, borderColor: c.chipBorder, paddingHorizontal: Spacing.md + 2, paddingVertical: Spacing.sm, marginRight: Spacing.sm, backgroundColor: c.chipBackground },
    typeChipActive: { backgroundColor: c.chipActiveBackground, borderColor: c.chipActiveBorder },
    typeText: { color: c.chipText, fontWeight: "600", fontSize: FontSize.small + 1 },
    typeTextActive: { color: c.chipActiveText },
    saveBtn: { backgroundColor: c.primary, borderRadius: Radius.md, alignItems: "center", paddingVertical: Spacing.md + 2, marginTop: 10 },
    saveText: { color: c.primaryText, fontWeight: "700", fontSize: FontSize.bodyLarge },
    allTitle: { color: c.text, fontSize: FontSize.title, fontWeight: "700", marginBottom: Spacing.md, marginTop: 4 },
    listCard: { backgroundColor: c.cardBackground, borderWidth: 1, borderColor: c.cardBorder, borderRadius: Radius.lg + 2, padding: Spacing.md + 2 },
    row: { borderBottomColor: c.borderLight, borderBottomWidth: 1, paddingVertical: Spacing.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    name: { color: c.text, fontWeight: "700", fontSize: FontSize.bodyLarge },
    metaSub: { color: c.textTertiary, fontSize: FontSize.small, marginTop: 3 },
    meta: { color: c.text, fontWeight: "700", fontSize: FontSize.bodyLarge },
    modalOverlay: { flex: 1, backgroundColor: c.modalOverlay, justifyContent: "flex-end" },
    modalCard: { backgroundColor: c.modalBackground, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xxl },
    modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xl },
    modalMetrics: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.xl, backgroundColor: c.surfaceElevated, padding: Spacing.md + 2, borderRadius: Radius.md, borderWidth: 1, borderColor: c.cardBorder },
    modalMetricBox: { alignItems: "center" },
    metricLabel: { color: c.textTertiary, fontSize: FontSize.caption, fontWeight: "700", marginBottom: 4 },
    metricValue: { color: c.text, fontSize: FontSize.bodyLarge, fontWeight: "800" },
    modalDetails: { gap: Spacing.sm },
    detailRow: { fontSize: FontSize.body, color: c.text },
    detailLabel: { fontWeight: "600", color: c.textSecondary },
    insightTextModal: { marginTop: Spacing.xxl, fontSize: FontSize.small + 1, color: c.forecastTitle, backgroundColor: c.forecastBackground, padding: Spacing.md, borderRadius: 10, lineHeight: 18 },
    deleteBtn: { backgroundColor: c.destructiveMuted, paddingVertical: Spacing.md + 2, borderRadius: Radius.md, alignItems: "center", marginTop: Spacing.xxl, borderWidth: 1, borderColor: isDark ? c.destructive + "40" : "#F5C6C6" },
    deleteText: { color: c.destructive, fontWeight: "700", fontSize: FontSize.bodyLarge },
  });

export const InvestmentsScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { budget, preferences } = useAppStore();
  const { data: expenses = [] } = useExpensesQuery();
  const { data: investments = [] } = useInvestmentsQuery();
  const { data: accounts = [] } = useAccountsQuery();
  const { data: goals = [] } = useGoalsQuery();
  const { data: incomes = [] } = useIncomesQuery();
  const { colors, isDark } = useTheme();
  const { formatMoney } = useFinance();

  const styles = React.useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const { mutate: addInvestmentMut } = useAddInvestmentMutation();
  const { mutate: deleteInvestmentMut } = useDeleteInvestmentMutation();

  const addInvestment = (inv: any) => addInvestmentMut(inv);
  const deleteInvestment = (id: string) => deleteInvestmentMut(id);

  const [activeTab, setActiveTab] = useState<"Portfolio" | "Planner">("Portfolio");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<any>("SIP");
  const [amount, setAmount] = useState("");
  const [tenure, setTenure] = useState("");
  const [returnRate, setReturnRate] = useState("12");
  const [sipDate, setSipDate] = useState("1");
  const [startDate, setStartDate] = useState(format(new Date(), "dd/MM/yyyy"));
  const [notes, setNotes] = useState("");
  const [stepUpEnabled, setStepUpEnabled] = useState(false);
  const [stepUpRate, setStepUpRate] = useState("10");
  const [stepUpFreq, setStepUpFreq] = useState("12");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  React.useEffect(() => {
    if (route.params?.prefillGoal) {
      const g = route.params.prefillGoal;
      setName(g.name);
      setAmount(String(g.targetAmount));
      setShowForm(true);
      navigation.setParams({ prefillGoal: undefined });
    }
  }, [route.params?.prefillGoal, navigation]);

  const surplus = getInvestableSurplus(budget, expenses);
  const types = ["SIP", "Mutual Fund", "Stocks", "FD", "RD", "Gold ETF", "Liquid Fund", "Index Fund", "ETF"];

  const projectedInvestments = useMemo(() => {
    return investments.map(calculateInvestmentProjections);
  }, [investments]);

  const selected = projectedInvestments.find((inv) => inv.id === selectedId);
  const totalCommittedMonthly = projectedInvestments.reduce((acc, inv) => acc + inv.monthly_amount, 0);
  const totalCurrentInvested = projectedInvestments.reduce((acc, inv) => acc + inv.currentInvested, 0);
  const totalCurrentFv = projectedInvestments.reduce((acc, inv) => acc + inv.currentFv, 0);
  const totalProjectedInvested = projectedInvestments.reduce((acc, inv) => acc + inv.projectedInvested, 0);
  const totalProjectedFv = projectedInvestments.reduce((acc, inv) => acc + inv.projectedFv, 0);
  const totalProjectedReturns = totalProjectedFv - totalProjectedInvested;

  const { netWorth, assets, liabilities, accountsTotal, investmentsActual, pfBalance } = calculateNetWorth(accounts, goals, projectedInvestments, incomes, expenses, preferences);
  const bestPerforming = projectedInvestments.reduce((best, curr) => curr.projectedReturns > (best?.projectedReturns || 0) ? curr : best, projectedInvestments[0]);

  const handleSave = () => {
    if (!name || !amount || !tenure || !sipDate || !returnRate) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }
    const day = Number(sipDate);
    if (day < 1 || day > 31) { Alert.alert("Invalid Input", "SIP Day must be between 1 and 31."); return; }
    const rate = Number(returnRate);
    if (rate < 0 || rate > 25) { Alert.alert("Invalid Input", "Expected return must be between 0% and 25%."); return; }
    if (stepUpEnabled && Number(stepUpFreq) < 1) { Alert.alert("Invalid Input", "Step-up frequency must be at least 1 month."); return; }
    const parsedDate = parse(startDate, "dd/MM/yyyy", new Date());
    if (isNaN(parsedDate.getTime())) { Alert.alert("Invalid Input", "Start Date must be valid (DD/MM/YYYY)."); return; }

    addInvestment({
      name, type, monthly_amount: Number(amount), startDate: parsedDate.toISOString(), tenureMonths: Number(tenure),
      expected_annual_return: rate, compounding_frequency: "monthly", step_up_enabled: stepUpEnabled,
      step_up_rate: Number(stepUpRate) || 0, step_up_frequency: Number(stepUpFreq) || 12, sip_day: day, notes,
    });
    setName(""); setAmount(""); setTenure(""); setSipDate("1"); setReturnRate("12");
    setStartDate(format(new Date(), "dd/MM/yyyy")); setNotes(""); setStepUpEnabled(false); setStepUpRate("10"); setStepUpFreq("12");
    setShowForm(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0} style={{ flex: 1 }}>
      <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 18), paddingBottom: Math.max(insets.bottom, 40) }]} keyboardShouldPersistTaps="handled">

        <PressableScale style={styles.nwCard} onPress={() => navigation.navigate("NetWorthBreakdown")}>
          <Text style={styles.nwTitle}>NET WORTH</Text>
          <Text style={styles.nwAmount}>{formatMoney(netWorth)}</Text>
          <View style={styles.nwRow}>
            <View style={styles.nwCol}><Text style={styles.nwSub}>ASSETS</Text><Text style={styles.nwSubVal}>{formatMoney(assets)}</Text></View>
            <View style={styles.nwDivider} />
            <View style={styles.nwCol}><Text style={styles.nwSub}>LIABILITIES</Text><Text style={styles.nwSubVal}>{formatMoney(liabilities)}</Text></View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
            <Text style={styles.nwMeta}>Accounts: {formatMoney(accountsTotal)}</Text>
            <Text style={styles.nwMeta}>Investments: {formatMoney(investmentsActual)}</Text>
            {pfBalance > 0 && <Text style={styles.nwMeta}>PF: {formatMoney(pfBalance)}</Text>}
          </View>
        </PressableScale>

        <View style={{ flexDirection: "row", backgroundColor: isDark ? colors.surfaceElevated : colors.surface, borderRadius: Radius.pill, padding: 4, marginBottom: Spacing.xl }}>
          <PressableScale onPress={() => setActiveTab("Portfolio")} style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: Radius.pill, backgroundColor: activeTab === "Portfolio" ? colors.primary : "transparent" }}>
            <Text style={{ color: activeTab === "Portfolio" ? colors.primaryText : colors.textSecondary, fontWeight: "700" }}>Portfolio</Text>
          </PressableScale>
          <PressableScale onPress={() => setActiveTab("Planner")} style={{ flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: Radius.pill, backgroundColor: activeTab === "Planner" ? colors.primary : "transparent" }}>
            <Text style={{ color: activeTab === "Planner" ? colors.primaryText : colors.textSecondary, fontWeight: "700" }}>Planner</Text>
          </PressableScale>
        </View>

        {activeTab === "Portfolio" ? (
          <>
            <View style={styles.summaryCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View><Text style={styles.summaryHead}>CURRENT INVESTED</Text><Text style={styles.summaryAmount}>{formatMoney(totalCurrentInvested)}</Text></View>
                <View style={{ alignItems: "flex-end" }}><Text style={styles.summaryHead}>CURRENT VALUE</Text><Text style={[styles.summaryAmount, { color: colors.primary }]}>{formatMoney(totalCurrentFv)}</Text></View>
              </View>
              <View style={styles.summaryRow}>
                <View><Text style={styles.summarySubLabel}>Total Gains</Text><Text style={[styles.summarySubValue, { color: colors.success }]}>+{formatMoney(Math.max(0, totalCurrentFv - totalCurrentInvested))}</Text></View>
              </View>
            </View>

            <Text style={styles.allTitle}>Your Holdings</Text>
            <View style={styles.listCard}>
              {projectedInvestments.length === 0 ? (
                <Text style={[styles.metaSub, { textAlign: "center", paddingVertical: 20 }]}>No holdings yet{"\n"}Go to Planner to add an investment.</Text>
              ) : (
                projectedInvestments.map((inv) => (
                  <PressableScale key={inv.id} style={styles.row} onPress={() => setSelectedId(inv.id)}>
                    <View>
                      <Text style={styles.name}>{inv.name}</Text>
                      <Text style={styles.metaSub}>{inv.type}</Text>
                      <Text style={[styles.metaSub, { fontWeight: "600", color: colors.primary, marginTop: 4 }]}>Invested: {formatMoney(inv.currentInvested)}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.meta}>{formatMoney(inv.currentFv)}</Text>
                      <Text style={[styles.metaSub, { color: colors.success }]}>+{formatMoney(Math.max(0, inv.currentFv - inv.currentInvested))} gain</Text>
                    </View>
                  </PressableScale>
                ))
              )}
            </View>
          </>
        ) : (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Investment Projections</Text>
              <PressableScale style={styles.addBtn} onPress={() => setShowForm((v) => !v)}>
                <Text style={styles.addText}>{showForm ? "Cancel" : "+ Add"}</Text>
              </PressableScale>
            </View>

        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>💡 Smart Insights</Text>
          {surplus > 0 ? (
            <Text style={styles.insightText}>• You have an investable surplus of <Text style={{ fontWeight: "700" }}>{formatMoney(surplus)}</Text>/month based on income and expenses.</Text>
          ) : (
            <Text style={styles.insightText}>• Consider optimizing your expenses to free up investable surplus. Try adding a Monthly Income in Settings if you haven't.</Text>
          )}
          {projectedInvestments.length > 0 && (
            <Text style={styles.insightText}>• Your portfolio is projected to grow to <Text style={{ fontWeight: "700" }}>{formatMoney(totalProjectedFv)}</Text>, generating {formatMoney(totalProjectedReturns)} in total returns.</Text>
          )}
          {bestPerforming && bestPerforming.projectedReturns > 0 && (
            <Text style={styles.insightText}>• Top performer: <Text style={{ fontWeight: "700" }}>{bestPerforming.name}</Text> is expected to yield {formatMoney(bestPerforming.projectedReturns)} in returns.</Text>
          )}
          {surplus > totalCommittedMonthly && totalCommittedMonthly > 0 && (
            <Text style={styles.insightText}>• You have room to grow! Safely invest up to {formatMoney(surplus - totalCommittedMonthly)} more per month without exceeding your surplus.</Text>
          )}
        </View>

        <View style={styles.summaryCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View><Text style={styles.summaryHead}>CURRENT INVESTED</Text><Text style={styles.summaryAmount}>{formatMoney(totalCurrentInvested)}</Text></View>
            <View style={{ alignItems: "flex-end" }}><Text style={styles.summaryHead}>PROJECTED VALUE</Text><Text style={styles.summaryAmount}>{formatMoney(totalProjectedFv)}</Text></View>
          </View>
          <View style={styles.summaryRow}>
            <View><Text style={styles.summarySubLabel}>Proj. Invested</Text><Text style={styles.summarySubValue}>{formatMoney(totalProjectedInvested)}</Text></View>
            <View style={{ alignItems: "flex-end" }}><Text style={styles.summarySubLabel}>Total Returns</Text><Text style={[styles.summarySubValue, { color: colors.primary }]}>+{formatMoney(totalProjectedReturns)}</Text></View>
          </View>
          <View style={[styles.commitmentRow, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
            <Text style={styles.commitmentText}>Commitment: {formatMoney(totalCommittedMonthly)}/mo</Text>
            <Text style={[styles.commitmentText, { color: colors.primary }]}>Current Value: {formatMoney(totalCurrentFv)}</Text>
          </View>
        </View>

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New Investment</Text>
            <Text style={styles.label}>NAME</Text>
            <TextInput style={styles.input} placeholder="e.g. Nifty 50 SIP" placeholderTextColor={colors.inputPlaceholder} value={name} onChangeText={setName} />
            <Text style={styles.label}>TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }} keyboardShouldPersistTaps="handled">
              {types.map((t) => (
                <PressableScale key={t} style={[styles.typeChip, type === t && styles.typeChipActive]} onPress={() => setType(t)}>
                  <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
                </PressableScale>
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Text style={styles.label}>AMOUNT/MO (₹)</Text><TextInput style={styles.input} keyboardType="numeric" value={formatInputMoney(amount)} onChangeText={(v) => setAmount(parseInputMoney(v))} placeholder="5000" placeholderTextColor={colors.inputPlaceholder} /></View>
              <View style={{ flex: 1 }}><Text style={styles.label}>TENURE (MO)</Text><TextInput style={styles.input} keyboardType="numeric" value={tenure} onChangeText={setTenure} placeholder="36" placeholderTextColor={colors.inputPlaceholder} /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Text style={styles.label}>START DATE</Text><TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="DD/MM/YYYY" placeholderTextColor={colors.inputPlaceholder} /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><Text style={styles.label}>RETURN RATE (%)</Text><TextInput style={styles.input} keyboardType="numeric" value={returnRate} onChangeText={setReturnRate} placeholder="12" placeholderTextColor={colors.inputPlaceholder} /></View>
              <View style={{ flex: 1 }}><Text style={styles.label}>SIP DAY (1-31)</Text><TextInput style={styles.input} keyboardType="numeric" value={sipDate} onChangeText={setSipDate} placeholder="1" placeholderTextColor={colors.inputPlaceholder} /></View>
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Enable Step-Up SIP</Text>
              <Switch value={stepUpEnabled} onValueChange={setStepUpEnabled} trackColor={{ true: colors.primary, false: colors.switchTrackOff }} thumbColor={colors.switchThumb} />
            </View>
            {stepUpEnabled && (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}><Text style={styles.label}>STEP-UP RATE (%)</Text><TextInput style={styles.input} keyboardType="numeric" value={stepUpRate} onChangeText={setStepUpRate} placeholder="10" placeholderTextColor={colors.inputPlaceholder} /></View>
                <View style={{ flex: 1 }}><Text style={styles.label}>FREQUENCY (MO)</Text><TextInput style={styles.input} keyboardType="numeric" value={stepUpFreq} onChangeText={setStepUpFreq} placeholder="12" placeholderTextColor={colors.inputPlaceholder} /></View>
              </View>
            )}
            <Text style={styles.label}>NOTES (OPTIONAL)</Text>
            <TextInput style={[styles.input, styles.notes]} value={notes} onChangeText={setNotes} multiline placeholderTextColor={colors.inputPlaceholder} />
            <PressableScale style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveText}>Save Investment</Text></PressableScale>
          </View>
        )}

            <Text style={styles.allTitle}>All Projections</Text>
            <View style={styles.listCard}>
              {projectedInvestments.length === 0 ? (
                <Text style={[styles.metaSub, { textAlign: "center", paddingVertical: 20 }]}>No investments yet{"\n"}Tap Add to create your first projection.</Text>
              ) : (
                projectedInvestments.map((inv) => (
                  <PressableScale key={inv.id} style={styles.row} onPress={() => setSelectedId(inv.id)}>
                    <View>
                      <Text style={styles.name}>{inv.name}</Text>
                      <Text style={styles.metaSub}>{inv.type} · Day {inv.sip_day} {inv.step_up_enabled && "· Step-Up"}</Text>
                      <Text style={[styles.metaSub, { fontWeight: "600", color: colors.primary, marginTop: 4 }]}>({formatMoney(inv.monthly_amount)})</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.meta}>{formatMoney(inv.projectedFv)}</Text>
                      <Text style={styles.metaSub}>{inv.expected_annual_return}% · {inv.tenureMonths}mo</Text>
                    </View>
                  </PressableScale>
                ))
              )}
            </View>
          </>
        )}

        <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelectedId(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHead}>
                <Text style={styles.formTitle}>{selected?.name}</Text>
                <PressableScale onPress={() => setSelectedId(null)} style={{ padding: 4 }}>
                  <Feather name="x" size={24} color={colors.textSecondary} />
                </PressableScale>
              </View>
              <View style={styles.modalMetrics}>
                <View style={styles.modalMetricBox}><Text style={styles.metricLabel}>Projected FV</Text><Text style={styles.metricValue}>{formatMoney(selected?.projectedFv ?? 0)}</Text></View>
                <View style={styles.modalMetricBox}><Text style={styles.metricLabel}>Total Invested</Text><Text style={styles.metricValue}>{formatMoney(selected?.projectedInvested ?? 0)}</Text></View>
                <View style={styles.modalMetricBox}><Text style={styles.metricLabel}>Total Returns</Text><Text style={[styles.metricValue, { color: colors.primary }]}>+{formatMoney(selected?.projectedReturns ?? 0)}</Text></View>
              </View>
              <View style={styles.modalDetails}>
                <Text style={styles.detailRow}><Text style={styles.detailLabel}>Type:</Text> {selected?.type}</Text>
                <Text style={styles.detailRow}><Text style={styles.detailLabel}>Initial SIP:</Text> {formatMoney(selected?.monthly_amount ?? 0)}</Text>
                <Text style={styles.detailRow}><Text style={styles.detailLabel}>Expected Return:</Text> {selected?.expected_annual_return}% p.a.</Text>
                <Text style={styles.detailRow}><Text style={styles.detailLabel}>Tenure:</Text> {selected?.tenureMonths} months</Text>
                <Text style={styles.detailRow}><Text style={styles.detailLabel}>Start Date:</Text> {selected?.startDate ? format(new Date(selected.startDate), "dd/MM/yyyy") : "-"}</Text>
                <Text style={styles.detailRow}><Text style={styles.detailLabel}>Months Elapsed:</Text> {selected?.monthsElapsed} months</Text>
                <Text style={styles.detailRow}><Text style={styles.detailLabel}>SIP Date:</Text> {selected?.sip_day} of month</Text>
                {selected?.step_up_enabled && (
                  <Text style={styles.detailRow}><Text style={styles.detailLabel}>Step-Up:</Text> {selected.step_up_rate}% every {selected.step_up_frequency} months</Text>
                )}
              </View>
              {selected?.notes ? <Text style={[styles.detailRow, { marginTop: 10 }]}><Text style={styles.detailLabel}>Notes:</Text> {selected.notes}</Text> : null}
              <Text style={styles.insightTextModal}>💡 Insight: Increasing your SIP by 10% next year could boost your returns significantly due to compounding!</Text>
              <PressableScale
                style={styles.deleteBtn}
                onPress={() => {
                  if (selected) {
                    Alert.alert("Delete Investment", `Are you sure you want to delete ${selected.name}?`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => { deleteInvestment(selected.id); setSelectedId(null); } },
                    ]);
                  }
                }}
              >
                <Text style={styles.deleteText}>Delete Investment</Text>
              </PressableScale>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
