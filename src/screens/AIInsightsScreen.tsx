import React, { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppStore } from "../state/AppStore";
import { useExpensesQuery, useAccountsQuery, useInvestmentsQuery, useGoalsQuery, useIncomesQuery } from "../state/queries";
import { askGroq } from "../services/groq";
import { budgetSignals, categorySpend, monthlySpend, topThreeCategories, weeklyReport, calculateNetWorth } from "../utils/finance";
import { useFinance } from "../utils/useFinance";
import { calculateInvestmentProjections } from "../utils/investmentCalc";
import { PressableScale } from "../components/PressableScale";
import { useTheme } from "../state/ThemeContext";
import type { ThemeColors } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";
import type { ChatSession } from "../state/types";

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    scrollArea: { flex: 1 },
    content: { padding: Spacing.lg + 2, paddingBottom: Spacing.xl },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 14 },
    actionRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: 10 },
    section: { color: c.textSecondary, letterSpacing: 1.4, fontWeight: "700", fontSize: FontSize.small + 1 },
    title: { color: c.text, fontSize: 21, fontWeight: "800" },
    goalBtn: { backgroundColor: c.primaryMuted, borderRadius: Radius.lg + 2, paddingHorizontal: 13, paddingVertical: Spacing.sm },
    goalText: { color: c.primary, fontWeight: "700" },
    historyToggle: { backgroundColor: c.surfaceElevated, borderRadius: Radius.lg + 2, paddingHorizontal: 13, paddingVertical: Spacing.sm },
    historyToggleText: { color: c.primary, fontWeight: "700" },
    heroIcon: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", backgroundColor: c.primaryMuted, alignSelf: "center", marginTop: Spacing.xl },
    heroTitle: { color: c.text, fontSize: 19.5, fontWeight: "700", textAlign: "center", marginTop: 14 },
    heroSub: { color: c.textTertiary, textAlign: "center", marginBottom: 14, marginTop: 6, fontWeight: "500" },
    suggestion: { backgroundColor: c.cardBackground, borderWidth: 1, borderColor: c.cardBorder, borderRadius: Radius.md + 2, padding: 14, marginBottom: 10 },
    suggestionText: { color: c.text, fontSize: 13.5, fontWeight: "500" },
    fixButton: { backgroundColor: c.primary, borderRadius: Radius.md, alignItems: "center", paddingVertical: Spacing.md, marginBottom: 4, marginTop: 4 },
    fixButtonText: { color: c.primaryText, fontWeight: "700" },
    chatThread: { marginTop: 10 },
    historyDrawer: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: "80%",
      backgroundColor: c.surface,
      borderLeftWidth: 1,
      borderLeftColor: c.border,
      padding: Spacing.md,
    },
    historyHead: { flexDirection: "row", justifyContent: "space-between", marginTop: Spacing.md, marginBottom: Spacing.sm },
    historyTitle: { color: c.text, fontWeight: "700", fontSize: FontSize.subtitle },
    clear: { color: c.primary, fontWeight: "700" },
    msg: { borderRadius: Radius.md, padding: 10, marginBottom: Spacing.sm, maxWidth: "85%" },
    userMsg: { backgroundColor: c.primaryMuted, alignSelf: "flex-end" },
    botMsg: { backgroundColor: c.cardBackground, borderWidth: 1, borderColor: c.cardBorder, alignSelf: "flex-start" },
    msgText: { color: c.text, lineHeight: 19 },
    emptyHistory: { color: c.textSecondary, marginTop: Spacing.sm },
    modalOverlay: { flex: 1, backgroundColor: c.modalOverlay },
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.surface,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    input: { flex: 1, backgroundColor: c.inputBackground, borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, minHeight: 50, maxHeight: 120, paddingTop: 14, paddingBottom: 14, color: c.inputText },
    send: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", marginLeft: Spacing.sm, marginBottom: 3 },
    sendDisabled: { opacity: 0.55 },
    historyItem: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: c.borderLight },
    historyItemTitle: { color: c.text, fontSize: FontSize.body, fontWeight: "600", marginBottom: 4 },
    historyItemTime: { color: c.textTertiary, fontSize: FontSize.caption },
  });

export const AIInsightsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { budget, aiHistory, chatSessions, addChatMessage, clearChatHistory, saveChatSession, clearAllSessions } = useAppStore();
  const { data: expenses = [] } = useExpensesQuery();
  const { data: accounts = [] } = useAccountsQuery();
  const { data: investments = [] } = useInvestmentsQuery();
  const { data: goals = [] } = useGoalsQuery();
  const { data: incomes = [] } = useIncomesQuery();
  const { colors } = useTheme();
  const { formatMoney } = useFinance();

  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const projectedInvestments = investments.map(calculateInvestmentProjections);
  const { netWorth } = calculateNetWorth(accounts, goals, projectedInvestments, incomes, expenses);

  const split = categorySpend(expenses);
  const top = topThreeCategories(expenses);
  const stats = budgetSignals(expenses, budget);
  const weekly = weeklyReport(expenses);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const aiHistoryRef = useRef(aiHistory);
  aiHistoryRef.current = aiHistory;
  const suggestions = [
    "Where am I overspending?",
    `How do I save ${formatMoney(5000)} this month?`,
    "Break down my top 3 expense categories",
  ];

  useEffect(() => {
    const isSunday = new Date().getDay() === 0;
    const tag = "Weekly AI report:";
    const alreadyPosted = aiHistory.some((msg) => msg.role === "assistant" && msg.text.includes(tag) && msg.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10));

    if (isSunday && !alreadyPosted) {
      const generateWeekly = async () => {
        addChatMessage({ role: "assistant", text: `${tag} Generating your weekly analysis...` });
        const context = `Weekly spend: ${formatMoney(weekly.thisWeek)}. Difference from last week: ${weekly.diffPct}%.`;
        const prompt = "Write a very short (1-2 sentences) weekly financial review for the user based on their weekly spend context. Give a quick encouraging note.";
        try {
          const reply = await askGroq(prompt, context);
          addChatMessage({ role: "assistant", text: `${tag} ${reply}` });
        } catch {
          addChatMessage({
            role: "assistant",
            text: `${tag} You spent ${formatMoney(weekly.thisWeek)} this week and ${weekly.diffPct >= 0 ? "increased" : "reduced"} by ${Math.abs(weekly.diffPct)}% vs last week.`,
          });
        }
      };
      generateWeekly();
    }
  }, [aiHistory, addChatMessage, weekly.diffPct, weekly.thisWeek]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setIsTyping(true);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setIsTyping(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const storeRef = useRef({ saveChatSession, clearChatHistory });
  useEffect(() => {
    storeRef.current = { saveChatSession, clearChatHistory };
  }, [saveChatSession, clearChatHistory]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (aiHistoryRef.current.length > 0) {
          const title = aiHistoryRef.current[0].text.substring(0, 30) + (aiHistoryRef.current[0].text.length > 30 ? "..." : "");
          storeRef.current.saveChatSession({ title, messages: [...aiHistoryRef.current] });
          storeRef.current.clearChatHistory();
        }
      };
    }, [])
  );

  async function fixSpending() {
    addChatMessage({ role: "user", text: "Fix my spending" });
    setLoading(true);
    const spend = monthlySpend(expenses);
    const split = categorySpend(expenses);
    const context = `Monthly budget: ${formatMoney(budget.monthlyLimit)}. Month spend: ${formatMoney(Math.round(spend))}. Category split: ${JSON.stringify(split)}. Top categories: ${JSON.stringify(top)}. Projected overshoot: ${formatMoney(stats.projectedOvershoot)}. Days left: ${stats.daysLeft}. Net Worth: ${formatMoney(netWorth)}.`;
    const prompt = "Provide a very short, highly actionable plan to fix my overspending. Mention specific amounts to cut from my top categories to recover the projected overshoot. Be concise.";

    try {
      const reply = await askGroq(prompt, context);
      addChatMessage({ role: "assistant", text: reply });
    } catch (error: any) {
      addChatMessage({
        role: "assistant",
        text:
          error?.message === "Missing EXPO_PUBLIC_GROQ_API_KEY"
            ? "Add EXPO_PUBLIC_GROQ_API_KEY to run live Groq responses."
            : "Could not reach Groq right now. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function submit(prompt: string) {
    if (!prompt.trim()) return;
    addChatMessage({ role: "user", text: prompt.trim() });
    setLoading(true);
    setQuery("");
    const spend = monthlySpend(expenses);
    const split = categorySpend(expenses);
    const context = `Monthly budget: ${formatMoney(budget.monthlyLimit)}. Month spend: ${formatMoney(Math.round(spend))}. Category split: ${JSON.stringify(split)}. Net Worth: ${formatMoney(netWorth)}. Total Investments: ${investments.length}.`;
    try {
      const reply = await askGroq(prompt, context);
      addChatMessage({ role: "assistant", text: reply });
    } catch (error: any) {
      addChatMessage({
        role: "assistant",
        text:
          error?.message === "Missing EXPO_PUBLIC_GROQ_API_KEY"
            ? "Add EXPO_PUBLIC_GROQ_API_KEY to run live Groq responses."
            : "Could not reach Groq right now. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const Wrapper = KeyboardAvoidingView;
  const wrapperProps = {
    behavior: Platform.OS === "ios" ? ("padding" as const) : ("height" as const),
    keyboardVerticalOffset: Platform.OS === "ios" ? 90 : 0,
    style: [styles.root, { paddingTop: Math.max(insets.top, 14) }],
  };

  return (
    <Wrapper {...wrapperProps}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.section}>GROQ AI</Text>
            <Text style={styles.title}>Financial Advisor</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <PressableScale style={styles.goalBtn} onPress={() => navigation.navigate("Goals")}>
            <Text style={styles.goalText}>◎ Goal Planner</Text>
          </PressableScale>
          <PressableScale style={styles.historyToggle} onPress={() => setHistoryOpen((v) => !v)}>
            <Text style={styles.historyToggleText}>{historyOpen ? "Hide History" : "History"}</Text>
          </PressableScale>
        </View>

        {!isTyping && (
          <>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="creation-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Hi! I'm your AI Wealth Manager.</Text>
            <Text style={styles.heroSub}>I monitor your net worth, goals, and spending. Ask me anything.</Text>
            {suggestions.map((s) => (
              <PressableScale key={s} style={styles.suggestion} onPress={() => submit(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </PressableScale>
            ))}
            <PressableScale style={styles.fixButton} onPress={fixSpending}>
              <Text style={styles.fixButtonText}>Fix my spending</Text>
            </PressableScale>
          </>
        )}

        <View style={styles.chatThread}>
          {aiHistory.map((msg) => (
            <View key={msg.id} style={[styles.msg, msg.role === "user" ? styles.userMsg : styles.botMsg]}>
              <Text style={styles.msgText}>{msg.text}</Text>
            </View>
          ))}
          {loading && (
            <View style={[styles.msg, styles.botMsg, { alignSelf: "flex-start", paddingHorizontal: 16 }]}>
              <Text style={styles.msgText}>...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={historyOpen} transparent animationType="fade" onRequestClose={() => setHistoryOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setHistoryOpen(false)} />
          <View style={[styles.historyDrawer, { paddingTop: Math.max(insets.top, 12) }]}>
            <View style={styles.historyHead}>
              {selectedSession ? (
                <Pressable onPress={() => setSelectedSession(null)}>
                  <Text style={styles.clear}>← Back</Text>
                </Pressable>
              ) : (
                <Text style={styles.historyTitle}>History</Text>
              )}
              {selectedSession ? <Text style={styles.historyTitle}>Past Chat</Text> : null}
              {selectedSession ? (
                <View style={{ width: 40 }} />
              ) : (
                <Pressable onPress={clearAllSessions}>
                  <Text style={styles.clear}>Clear</Text>
                </Pressable>
              )}
            </View>
            {selectedSession ? (
              <View style={{ flex: 1 }}>
                <ScrollView>
                  {selectedSession.messages.map((msg) => (
                    <View key={msg.id} style={[styles.msg, msg.role === "user" ? styles.userMsg : styles.botMsg]}>
                      <Text style={styles.msgText}>{msg.text}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <ScrollView>
                {chatSessions.length === 0 ? (
                  <Text style={styles.emptyHistory}>No history yet.</Text>
                ) : (
                  chatSessions.map((session) => (
                    <PressableScale key={session.id} style={styles.historyItem} onPress={() => setSelectedSession(session)}>
                      <Text style={styles.historyItemTitle}>{session.title}</Text>
                      <Text style={styles.historyItemTime}>{new Date(session.createdAt).toLocaleString()}</Text>
                    </PressableScale>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          style={styles.input}
          placeholder="Ask about your spending..."
          placeholderTextColor={colors.inputPlaceholder}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsTyping(true)}
          multiline
        />
        <PressableScale style={[styles.send, loading && styles.sendDisabled]} onPress={() => submit(query)} disabled={loading}>
          <MaterialCommunityIcons name="send-outline" size={22} color={colors.primaryText} />
        </PressableScale>
      </View>
    </Wrapper>
  );
};
