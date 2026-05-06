import React, { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppStore } from "../state/AppStore";
import { askGroq } from "../services/groq";
import { budgetSignals, categorySpend, monthlySpend, topThreeCategories, weeklyReport } from "../utils/finance";
import type { ChatSession } from "../state/types";

export const AIInsightsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { expenses, budget, aiHistory, chatSessions, addChatMessage, clearChatHistory, saveChatSession, clearAllSessions } = useAppStore();
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
    "How do I save ₹5000 this month?",
    "Break down my top 3 expense categories"
  ];

  useEffect(() => {
    const isSunday = new Date().getDay() === 0;
    const tag = "Weekly AI report:";
    const alreadyPosted = aiHistory.some((msg) => msg.role === "assistant" && msg.text.includes(tag) && msg.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10));
    if (isSunday && !alreadyPosted) {
      addChatMessage({
        role: "assistant",
        text: `${tag} You spent ₹${Math.round(weekly.thisWeek)} this week and ${weekly.diffPct >= 0 ? "increased" : "reduced"} by ${Math.abs(weekly.diffPct)}% vs last week.`
      });
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

  function fixSpending() {
    const first = top[0];
    const second = top[1];
    const overshootPerDay = Math.max(80, Math.round(stats.projectedOvershoot / Math.max(1, stats.daysLeft || 1)));
    const action = first
      ? `Action plan: Cut ₹${overshootPerDay} from ${first.name}. Limit ${second?.name ?? "Transport"} to ₹${Math.max(120, Math.round((split[second?.name ?? "Transport"] ?? 0) / Math.max(1, new Date().getDate())))} / day. Pause non-essential spends for 3 days.`
      : "Action plan: Log 5 days of expenses first, then tap Fix my spending.";
    addChatMessage({ role: "assistant", text: action });
  }

  async function submit(prompt: string) {
    if (!prompt.trim()) return;
    addChatMessage({ role: "user", text: prompt.trim() });
    setLoading(true);
    setQuery("");
    const spend = monthlySpend(expenses);
    const split = categorySpend(expenses);
    const context = `Monthly budget: ₹${budget.monthlyLimit}. Month spend: ₹${Math.round(spend)}. Category split: ${JSON.stringify(split)}.`;
    try {
      const reply = await askGroq(prompt, context);
      addChatMessage({ role: "assistant", text: reply });
    } catch (error: any) {
      addChatMessage({
        role: "assistant",
        text:
          error?.message === "Missing EXPO_PUBLIC_GROQ_API_KEY"
            ? "Add EXPO_PUBLIC_GROQ_API_KEY to run live Groq responses."
            : "Could not reach Groq right now. Please try again."
      });
    } finally {
      setLoading(false);
    }
  }

  const Wrapper = KeyboardAvoidingView;
  const wrapperProps = {
    behavior: Platform.OS === "ios" ? "padding" as const : "height" as const,
    keyboardVerticalOffset: Platform.OS === "ios" ? 90 : 0,
    style: styles.root
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
            <Text style={styles.title}>Financial Coach</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.goalBtn} onPress={() => navigation.navigate("Goals")}>
            <Text style={styles.goalText}>◎ Goal Planner</Text>
          </Pressable>
          <Pressable style={styles.historyToggle} onPress={() => setHistoryOpen((v) => !v)}>
            <Text style={styles.historyToggleText}>{historyOpen ? "Hide History" : "History"}</Text>
          </Pressable>
        </View>

        {!isTyping && (
          <>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="creation-outline" size={30} color="#2D5950" />
            </View>
            <Text style={styles.heroTitle}>Hi! I'm your AI money coach.</Text>
            <Text style={styles.heroSub}>I see your expense data. Ask me anything.</Text>
            {suggestions.map((s) => (
              <Pressable key={s} style={styles.suggestion} onPress={() => submit(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.fixButton} onPress={fixSpending}>
              <Text style={styles.fixButtonText}>Fix my spending</Text>
            </Pressable>
          </>
        )}

        <View style={styles.chatThread}>
          {aiHistory.map((msg) => (
            <View key={msg.id} style={[styles.msg, msg.role === "user" ? styles.userMsg : styles.botMsg]}>
              <Text style={styles.msgText}>{msg.text}</Text>
            </View>
          ))}
          {loading && (
            <View style={[styles.msg, styles.botMsg, { alignSelf: 'flex-start', paddingHorizontal: 16 }]}>
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
              {selectedSession ? (
                 <Text style={styles.historyTitle}>Past Chat</Text>
              ) : null}
              {selectedSession ? (
                 <View style={{width: 40}} />
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
                    <Pressable key={session.id} style={styles.historyItem} onPress={() => setSelectedSession(session)}>
                      <Text style={styles.historyItemTitle}>{session.title}</Text>
                      <Text style={styles.historyItemTime}>{new Date(session.createdAt).toLocaleString()}</Text>
                    </Pressable>
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
          placeholderTextColor="#7E8E88"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsTyping(true)}
          multiline
        />
        <Pressable style={[styles.send, loading && styles.sendDisabled]} onPress={() => submit(query)} disabled={loading}>
          <MaterialCommunityIcons name="send-outline" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F6F5" },
  scrollArea: { flex: 1 },
  content: { padding: 18, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 14 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  section: { color: "#6C7873", letterSpacing: 1.4, fontWeight: "700", fontSize: 13 },
  title: { color: "#102238", fontSize: 42 / 2, fontWeight: "800" },
  goalBtn: { backgroundColor: "#E7F0EC", borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8 },
  goalText: { color: "#184B43", fontWeight: "700" },
  historyToggle: { backgroundColor: "#EEF2F0", borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8 },
  historyToggleText: { color: "#31594F", fontWeight: "700" },
  heroIcon: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", backgroundColor: "#EAF0EC", alignSelf: "center", marginTop: 20 },
  heroTitle: { color: "#252E2C", fontSize: 39 / 2, fontWeight: "700", textAlign: "center", marginTop: 14 },
  heroSub: { color: "#7B8783", textAlign: "center", marginBottom: 14, marginTop: 6, fontWeight: "500" },
  suggestion: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8E5", borderRadius: 14, padding: 14, marginBottom: 10 },
  suggestionText: { color: "#24302E", fontSize: 27 / 2, fontWeight: "500" },
  fixButton: { backgroundColor: "#184B43", borderRadius: 12, alignItems: "center", paddingVertical: 12, marginBottom: 4, marginTop: 4 },
  fixButtonText: { color: "#FFFFFF", fontWeight: "700" },
  chatThread: { marginTop: 10 },
  historyDrawer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "80%",
    backgroundColor: "#F8FBF9",
    borderLeftWidth: 1,
    borderLeftColor: "#DCE4E0",
    padding: 12
  },
  historyHead: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, marginBottom: 8 },
  historyTitle: { color: "#283130", fontWeight: "700", fontSize: 16 },
  clear: { color: "#1D5A50", fontWeight: "700" },
  msg: { borderRadius: 12, padding: 10, marginBottom: 8, maxWidth: "85%" },
  userMsg: { backgroundColor: "#E9EFEA", alignSelf: "flex-end" },
  botMsg: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E8E5", alignSelf: "flex-start" },
  msgText: { color: "#1F2927", lineHeight: 19 },
  emptyHistory: { color: "#6F7F79", marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#E2E8E5",
    backgroundColor: "#F8FAF9",
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  input: { flex: 1, backgroundColor: "#EBEFED", borderRadius: 16, paddingHorizontal: 16, minHeight: 50, maxHeight: 120, paddingTop: 14, paddingBottom: 14, color: "#20302D" },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#184B43", alignItems: "center", justifyContent: "center", marginLeft: 8, marginBottom: 3 },
  sendDisabled: { opacity: 0.55 },
  historyItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#EAF0EC" },
  historyItemTitle: { color: "#1F2927", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  historyItemTime: { color: "#7B8783", fontSize: 11 }
});
