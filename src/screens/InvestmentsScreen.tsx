import React, { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { format, parse } from "date-fns";
import { useAppStore } from "../state/AppStore";
import { calculateInvestmentProjections, getInvestableSurplus } from "../utils/investmentCalc";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const InvestmentsScreen = () => {
  const insets = useSafeAreaInsets();
  const { investments, addInvestment, deleteInvestment, budget, expenses } = useAppStore();
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

  const handleSave = () => {
    if (!name || !amount || !tenure || !sipDate || !returnRate) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }
    const day = Number(sipDate);
    if (day < 1 || day > 31) {
      Alert.alert("Invalid Input", "SIP Day must be between 1 and 31.");
      return;
    }
    const rate = Number(returnRate);
    if (rate < 0 || rate > 25) {
      Alert.alert("Invalid Input", "Expected return must be between 0% and 25%.");
      return;
    }
    if (stepUpEnabled) {
      if (Number(stepUpFreq) < 1) {
        Alert.alert("Invalid Input", "Step-up frequency must be at least 1 month.");
        return;
      }
    }
    const parsedDate = parse(startDate, "dd/MM/yyyy", new Date());
    if (isNaN(parsedDate.getTime())) {
      Alert.alert("Invalid Input", "Start Date must be valid (DD/MM/YYYY).");
      return;
    }

    addInvestment({
      name,
      type,
      monthly_amount: Number(amount),
      startDate: parsedDate.toISOString(),
      tenureMonths: Number(tenure),
      expected_annual_return: rate,
      compounding_frequency: "monthly",
      step_up_enabled: stepUpEnabled,
      step_up_rate: Number(stepUpRate) || 0,
      step_up_frequency: Number(stepUpFreq) || 12,
      sip_day: day,
      notes
    });
    setName(""); setAmount(""); setTenure(""); setSipDate("1"); setReturnRate("12");
    setStartDate(format(new Date(), "dd/MM/yyyy")); setNotes(""); setStepUpEnabled(false); setStepUpRate("10"); setStepUpFreq("12");
    setShowForm(false);
  };

  const formatMoney = (val: number) => {
    if (Number.isNaN(val) || val == null) return "₹0";
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const bestPerforming = projectedInvestments.reduce((best, curr) => curr.projectedReturns > (best?.projectedReturns || 0) ? curr : best, projectedInvestments[0]);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 40) }]}>
        <Text style={styles.section}>PORTFOLIO</Text>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Investment Planner</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.addText}>{showForm ? "Cancel" : "+ Add"}</Text>
        </Pressable>
      </View>

      <View style={styles.insightsCard}>
        <Text style={styles.insightsTitle}>💡 Smart Insights</Text>
        {surplus > 0 ? (
          <Text style={styles.insightText}>• You have an investable surplus of <Text style={{fontWeight:'700'}}>{formatMoney(surplus)}</Text>/month based on income and expenses.</Text>
        ) : (
          <Text style={styles.insightText}>• Consider optimizing your expenses to free up investable surplus. Try adding a Monthly Income in Settings if you haven't.</Text>
        )}
        {projectedInvestments.length > 0 && (
          <Text style={styles.insightText}>• Your portfolio is projected to grow to <Text style={{fontWeight:'700'}}>{formatMoney(totalProjectedFv)}</Text>, generating {formatMoney(totalProjectedReturns)} in total returns.</Text>
        )}
        {bestPerforming && bestPerforming.projectedReturns > 0 && (
          <Text style={styles.insightText}>• Top performer: <Text style={{fontWeight:'700'}}>{bestPerforming.name}</Text> is expected to yield {formatMoney(bestPerforming.projectedReturns)} in returns.</Text>
        )}
        {surplus > totalCommittedMonthly && totalCommittedMonthly > 0 && (
          <Text style={styles.insightText}>• You have room to grow! Safely invest up to {formatMoney(surplus - totalCommittedMonthly)} more per month without exceeding your surplus.</Text>
        )}
      </View>

      <View style={styles.summaryCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={styles.summaryHead}>CURRENT INVESTED</Text>
            <Text style={styles.summaryAmount}>{formatMoney(totalCurrentInvested)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.summaryHead}>PROJECTED VALUE</Text>
            <Text style={styles.summaryAmount}>{formatMoney(totalProjectedFv)}</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summarySubLabel}>Proj. Invested</Text>
            <Text style={styles.summarySubValue}>{formatMoney(totalProjectedInvested)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.summarySubLabel}>Total Returns</Text>
            <Text style={[styles.summarySubValue, { color: "#2D8A73" }]}>+{formatMoney(totalProjectedReturns)}</Text>
          </View>
        </View>
        <View style={[styles.commitmentRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={styles.commitmentText}>Commitment: {formatMoney(totalCommittedMonthly)}/mo</Text>
            <Text style={[styles.commitmentText, { color: "#2D8A73" }]}>Current Value: {formatMoney(totalCurrentFv)}</Text>
        </View>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New Investment</Text>
          <Text style={styles.label}>NAME</Text>
          <TextInput style={styles.input} placeholder="e.g. Nifty 50 SIP" placeholderTextColor="#9AA4A0" value={name} onChangeText={setName} />
          
          <Text style={styles.label}>TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {types.map((t) => (
              <Pressable key={t} style={[styles.typeChip, type === t && styles.typeChipActive]} onPress={() => setType(t)}>
                <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>AMOUNT/MO (₹)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} placeholder="5000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>TENURE (MO)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={tenure} onChangeText={setTenure} placeholder="36" />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>START DATE</Text>
              <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="DD/MM/YYYY" />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>RETURN RATE (%)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={returnRate} onChangeText={setReturnRate} placeholder="12" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>SIP DAY (1-31)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={sipDate} onChangeText={setSipDate} placeholder="1" />
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enable Step-Up SIP</Text>
            <Switch value={stepUpEnabled} onValueChange={setStepUpEnabled} trackColor={{ true: '#184B43', false: '#DCE3DF' }} />
          </View>
          
          {stepUpEnabled && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>STEP-UP RATE (%)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={stepUpRate} onChangeText={setStepUpRate} placeholder="10" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>FREQUENCY (MO)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={stepUpFreq} onChangeText={setStepUpFreq} placeholder="12" />
              </View>
            </View>
          )}

          <Text style={styles.label}>NOTES (OPTIONAL)</Text>
          <TextInput style={[styles.input, styles.notes]} value={notes} onChangeText={setNotes} multiline />
          
          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>Save Investment</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.allTitle}>All Investments</Text>
      <View style={styles.listCard}>
        {projectedInvestments.length === 0 ? (
          <Text style={styles.meta}>No investments yet{"\n"}Tap Add to create your first projection.</Text>
        ) : (
          projectedInvestments.map((inv) => (
            <Pressable key={inv.id} style={styles.row} onPress={() => setSelectedId(inv.id)}>
              <View>
                <Text style={styles.name}>{inv.name}</Text>
                <Text style={styles.metaSub}>{inv.type} · Day {inv.sip_day} {inv.step_up_enabled && '· Step-Up'}</Text>
                <Text style={[styles.metaSub, { fontWeight: '600', color: '#2D8A73', marginTop: 4 }]}>({formatMoney(inv.monthly_amount)})</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.meta}>{formatMoney(inv.projectedFv)}</Text>
                <Text style={styles.metaSub}>{inv.expected_annual_return}% · {inv.tenureMonths}mo</Text>
              </View>
            </Pressable>
          ))
        )}
      </View>

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelectedId(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.formTitle}>{selected?.name}</Text>
              <Pressable onPress={() => setSelectedId(null)} style={{ padding: 4 }}>
                <Feather name="x" size={24} color="#41504C" />
              </Pressable>
            </View>
            
            <View style={styles.modalMetrics}>
              <View style={styles.modalMetricBox}>
                <Text style={styles.metricLabel}>Projected FV</Text>
                <Text style={styles.metricValue}>{formatMoney(selected?.projectedFv ?? 0)}</Text>
              </View>
              <View style={styles.modalMetricBox}>
                <Text style={styles.metricLabel}>Total Invested</Text>
                <Text style={styles.metricValue}>{formatMoney(selected?.projectedInvested ?? 0)}</Text>
              </View>
              <View style={styles.modalMetricBox}>
                <Text style={styles.metricLabel}>Total Returns</Text>
                <Text style={[styles.metricValue, { color: "#2D8A73" }]}>+{formatMoney(selected?.projectedReturns ?? 0)}</Text>
              </View>
            </View>

            <View style={styles.modalDetails}>
              <Text style={styles.detailRow}><Text style={styles.detailLabel}>Type:</Text> {selected?.type}</Text>
              <Text style={styles.detailRow}><Text style={styles.detailLabel}>Initial SIP:</Text> {formatMoney(selected?.monthly_amount ?? 0)}</Text>
              <Text style={styles.detailRow}><Text style={styles.detailLabel}>Expected Return:</Text> {selected?.expected_annual_return}% p.a.</Text>
              <Text style={styles.detailRow}><Text style={styles.detailLabel}>Tenure:</Text> {selected?.tenureMonths} months</Text>
              <Text style={styles.detailRow}><Text style={styles.detailLabel}>Start Date:</Text> {selected?.startDate ? format(new Date(selected.startDate), 'dd/MM/yyyy') : '-'}</Text>
              <Text style={styles.detailRow}><Text style={styles.detailLabel}>Months Elapsed:</Text> {selected?.monthsElapsed} months</Text>
              <Text style={styles.detailRow}><Text style={styles.detailLabel}>SIP Date:</Text> {selected?.sip_day} of month</Text>
              {selected?.step_up_enabled && (
                <Text style={styles.detailRow}><Text style={styles.detailLabel}>Step-Up:</Text> {selected.step_up_rate}% every {selected.step_up_frequency} months</Text>
              )}
            </View>
            
            {selected?.notes ? (
              <Text style={[styles.detailRow, { marginTop: 10 }]}><Text style={styles.detailLabel}>Notes:</Text> {selected.notes}</Text>
            ) : null}

            <Text style={styles.insightTextModal}>💡 Insight: Increasing your SIP by 10% next year could boost your returns significantly due to compounding!</Text>
            
            <Pressable 
              style={{ backgroundColor: '#FDECEC', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 24, borderWidth: 1, borderColor: '#F5C6C6' }}
              onPress={() => {
                if (selected) {
                  Alert.alert(
                    "Delete Investment",
                    `Are you sure you want to delete ${selected.name}?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Delete", 
                        style: "destructive",
                        onPress: () => {
                          deleteInvestment(selected.id);
                          setSelectedId(null);
                        }
                      }
                    ]
                  );
                }
              }}
            >
              <Text style={{ color: '#D32F2F', fontWeight: '700', fontSize: 15 }}>Delete Investment</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F6F5" },
  content: { padding: 18, paddingBottom: 34 },
  section: { color: "#8A9792", fontSize: 13, letterSpacing: 1.3, fontWeight: "700", marginTop: 10 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { color: "#1D2725", fontSize: 41 / 2, fontWeight: "800" },
  addBtn: { backgroundColor: "#184B43", borderRadius: 18, paddingHorizontal: 15, paddingVertical: 8 },
  addText: { color: "#FFFFFF", fontWeight: "700" },
  
  insightsCard: { backgroundColor: "#EDF2F0", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#DCE3DF" },
  insightsTitle: { fontSize: 15, fontWeight: "700", color: "#23463F", marginBottom: 6 },
  insightText: { fontSize: 13, color: "#455551", marginBottom: 4, lineHeight: 18 },
  
  summaryCard: { backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#E3E8E5", padding: 20, marginBottom: 16 },
  summaryHead: { color: "#8A9792", fontWeight: "700", letterSpacing: 1.2, fontSize: 12 },
  summaryAmount: { color: "#1D2725", fontSize: 32, fontWeight: "800", marginVertical: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  summarySubLabel: { color: "#7D8A85", fontSize: 12, fontWeight: "600", marginBottom: 2 },
  summarySubValue: { color: "#1F2928", fontSize: 15, fontWeight: "700" },
  commitmentRow: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E9EEEB" },
  commitmentText: { color: "#5D6C67", fontSize: 13, fontWeight: "600" },

  formCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E3E8E5", padding: 16, marginBottom: 14 },
  formTitle: { color: "#1F2928", fontSize: 18, fontWeight: "700", marginBottom: 14 },
  label: { color: "#8A9792", fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6 },
  input: { backgroundColor: "#F1F4F2", color: "#1F2928", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontWeight: "500" },
  notes: { minHeight: 76, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 4 },
  switchLabel: { color: "#1F2928", fontWeight: "600", fontSize: 14 },
  
  typeChip: { borderRadius: 18, borderWidth: 1, borderColor: "#DCE3DF", paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, backgroundColor: "#FAFCFB" },
  typeChipActive: { backgroundColor: "#184B43", borderColor: "#184B43" },
  typeText: { color: "#38413F", fontWeight: "600", fontSize: 13 },
  typeTextActive: { color: "#FFFFFF" },
  
  saveBtn: { backgroundColor: "#184B43", borderRadius: 12, alignItems: "center", paddingVertical: 14, marginTop: 10 },
  saveText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  
  allTitle: { color: "#2E3634", fontSize: 18, fontWeight: "700", marginBottom: 12, marginTop: 4 },
  listCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E3E8E5", borderRadius: 18, padding: 14 },
  row: { borderBottomColor: "#E9EEEB", borderBottomWidth: 1, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { color: "#1F2928", fontWeight: "700", fontSize: 15 },
  metaSub: { color: "#7D8A85", fontSize: 12, marginTop: 3 },
  meta: { color: "#1D2725", fontWeight: "700", fontSize: 15 },
  
  progressTrack: { height: 4, backgroundColor: "#E9EEEB", borderRadius: 2, marginTop: 8, overflow: "hidden", width: 120 },
  progressFill: { height: "100%", backgroundColor: "#2D8A73" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(10,22,20,0.4)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  
  modalMetrics: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, backgroundColor: "#F8FAF9", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E3E8E5" },
  modalMetricBox: { alignItems: "center" },
  metricLabel: { color: "#8A9792", fontSize: 11, fontWeight: "700", marginBottom: 4 },
  metricValue: { color: "#1D2725", fontSize: 15, fontWeight: "800" },
  
  modalDetails: { gap: 8 },
  detailRow: { fontSize: 14, color: "#1F2928" },
  detailLabel: { fontWeight: "600", color: "#6D7A76" },
  insightTextModal: { marginTop: 24, fontSize: 13, color: "#23463F", backgroundColor: "#EDF2F0", padding: 12, borderRadius: 10, lineHeight: 18 }
});
