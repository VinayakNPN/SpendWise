import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useAppStore } from "../state/AppStore";
import { budgetSignals, categorySpend, categoryStatus, currentNoSpendStreak, topThreeCategories, weeklyReport } from "../utils/finance";
import { FadeInView } from "../components/FadeInView";
import { GoalPlanner } from "../components/GoalPlanner";

export const DashboardScreen = () => {
  const insets = useSafeAreaInsets();
  const { expenses, budget } = useAppStore();
  const navigation = useNavigation<any>();
  const stats = budgetSignals(expenses, budget);
  const cat = categorySpend(expenses);
  const topThree = topThreeCategories(expenses);
  const streak = currentNoSpendStreak(expenses);
  const weekly = weeklyReport(expenses);
  const categoryCards = [
    { key: "Food", icon: "food-outline", color: "#F5E8D9", text: "#C78C4D" },
    { key: "Rent", icon: "home-outline", color: "#EAF0EC", text: "#577A67" },
    { key: "Transport", icon: "car-outline", color: "#E8EEF5", text: "#4F7AA4" },
    { key: "Health", icon: "heart-outline", color: "#FCE8E8", text: "#D45A5A" },
    { key: "Shopping", icon: "shopping-outline", color: "#FCE9E2", text: "#D36D4B" },
    { key: "Sapna", icon: "star-outline", color: "#E8EDFA", text: "#6176B7" }
  ];
  const sortedCards = [...categoryCards].sort((a, b) => (cat[b.key] ?? 0) - (cat[a.key] ?? 0));

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 100) }]}>
      <Text style={styles.section}>OVERVIEW</Text>
      <Text style={styles.title}>{format(new Date(), "MMMM yyyy")}</Text>

      <FadeInView>
        <View style={styles.card}>
        <Text style={styles.cardLabel}>TOTAL SPENT</Text>
        <Text style={styles.amount}>₹{Math.round(stats.monthSpent)}</Text>
        <Text style={styles.info}>
          of ₹{budget.monthlyLimit.toLocaleString()} budget · {Math.round(stats.ratio * 100)}% used
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${Math.min(100, Math.round(stats.ratio * 100))}%` }]} />
        </View>
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statLabel}>Avg / day</Text>
            <Text style={styles.statValue}>₹{Math.round(stats.perDay)}</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Ideal / day</Text>
            <Text style={styles.statValue}>₹{Math.round(stats.idealPerDay)}</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Days left</Text>
            <Text style={styles.statValue}>{stats.daysLeft}</Text>
          </View>
        </View>
        <Text style={styles.todaySafe}>You can safely spend ₹{Math.round(stats.safeToSpendToday)} today</Text>
        {stats.paceRatio > 1.2 && <Text style={styles.paceWarn}>You are {stats.paceRatio.toFixed(1)}x above ideal pace</Text>}
        </View>
      </FadeInView>

      <FadeInView delay={40}>
        <View style={[styles.card, styles.forecast]}>
        <Text style={styles.forecastTitle}>↗ AI Forecast</Text>
        <Text style={styles.forecastBody}>
          {stats.projectedOvershoot > 0
            ? `At this rate, you will overshoot by ₹${Math.round(stats.projectedOvershoot)}`
            : "You are currently within monthly budget trajectory"}
        </Text>
        {stats.projectedOvershoot > 0 && (
          <Text style={styles.forecastSub}>Reduce Food by about ₹{Math.max(50, Math.round(stats.projectedOvershoot / Math.max(1, stats.daysLeft || 1)))} / day to recover.</Text>
        )}
        <Pressable style={styles.fixBtn} onPress={() => navigation.navigate("AI Coach")}>
          <Text style={styles.fixText}>Fix my spending</Text>
        </Pressable>
        </View>
      </FadeInView>

      <FadeInView delay={65}>
        <View style={styles.card}>
          <Text style={styles.categoryTitle}>Top 3 Spending Categories</Text>
          {topThree.length === 0 ? (
            <Text style={styles.catLimit}>No spending data yet.</Text>
          ) : (
            <Text style={styles.topText}>
              Your highest spending: {topThree.map((item) => `${item.name} (${item.pct}%)`).join(", ")}
            </Text>
          )}
          <Text style={styles.catLimit}>
            Days left {stats.daysLeft} vs Budget left ₹{Math.round(stats.budgetLeft)}
          </Text>
          {new Date().getDay() === 0 && (
            <Text style={styles.weeklyText}>
              Weekly AI report: You spent ₹{Math.round(weekly.thisWeek)} this week ({weekly.diffPct >= 0 ? "+" : ""}
              {weekly.diffPct}% vs last week).
            </Text>
          )}
          <Text style={styles.weeklyText}>No-spend day streak: {streak} day{streak === 1 ? "" : "s"}</Text>
        </View>
      </FadeInView>

      <Text style={styles.categoryTitle}>Categories</Text>
      <FadeInView delay={90}>
        <View style={styles.grid}>
        {sortedCards.map((c) => (
          <Pressable key={c.key} style={styles.catCard} onPress={() => navigation.navigate("Expenses", { initialCategory: c.key })}>
            <View style={[styles.iconWrap, { backgroundColor: c.color }]}>
              <MaterialCommunityIcons name={c.icon as any} size={16} color={c.text} />
            </View>
            <Text style={styles.catName}>{c.key}</Text>
            <View style={styles.catRow}>
              <Text style={styles.catAmount}>₹{Math.round(cat[c.key] ?? 0)} / ₹{Math.round(budget.categoryLimits[c.key as keyof typeof budget.categoryLimits] ?? 0)}</Text>
              <Text style={[styles.badge, { color: categoryStatus(cat[c.key] ?? 0, budget.categoryLimits[c.key as keyof typeof budget.categoryLimits] ?? 0).tone }]}>
                {categoryStatus(cat[c.key] ?? 0, budget.categoryLimits[c.key as keyof typeof budget.categoryLimits] ?? 0).badge}
              </Text>
            </View>
            <View style={styles.catLimitLine}>
              <View
                style={[
                  styles.catLimitFill,
                  {
                    width: `${Math.min(100, Math.round(categoryStatus(cat[c.key] ?? 0, budget.categoryLimits[c.key as keyof typeof budget.categoryLimits] ?? 0).ratio * 100))}%`,
                    backgroundColor: categoryStatus(cat[c.key] ?? 0, budget.categoryLimits[c.key as keyof typeof budget.categoryLimits] ?? 0).bar
                  }
                ]}
              />
            </View>
          </Pressable>
        ))}
        </View>
      </FadeInView>

      <GoalPlanner />

      <Pressable style={[styles.fab, { bottom: Math.max(insets.bottom, 20) + 70 }]} onPress={() => navigation.navigate("Expenses")}>
        <Feather name="plus" size={28} color="#FFFFFF" />
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F6F5" },
  content: { padding: 18, paddingBottom: 96 },
  section: { color: "#8B9792", fontSize: 14, letterSpacing: 1.3, fontWeight: "700", marginTop: 10 },
  title: { color: "#1F2827", fontSize: 46 / 2, fontWeight: "800", marginTop: 2, marginBottom: 12 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 22, padding: 16, borderWidth: 1, borderColor: "#E8ECEB", marginBottom: 14 },
  cardLabel: { color: "#95A09A", fontSize: 14, fontWeight: "700", letterSpacing: 0.6 },
  amount: { color: "#1C2523", fontSize: 52 / 2, fontWeight: "800", marginVertical: 6 },
  info: { color: "#8D9893", fontSize: 14, fontWeight: "600" },
  progressTrack: { height: 10, borderRadius: 20, backgroundColor: "#E9ECEA", marginTop: 12, marginBottom: 14 },
  progressBar: { height: 10, borderRadius: 20, backgroundColor: "#1F534A" },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statLabel: { color: "#8E9894", fontSize: 13, marginBottom: 4 },
  statValue: { color: "#1C2523", fontSize: 29 / 2, fontWeight: "800" },
  todaySafe: { color: "#1F534A", fontWeight: "800", marginTop: 10, fontSize: 14 },
  paceWarn: { color: "#A23D3D", fontWeight: "700", marginTop: 4, fontSize: 13 },
  forecast: { backgroundColor: "#E6EEEA" },
  forecastTitle: { color: "#31594F", fontSize: 33 / 2, fontWeight: "800", marginBottom: 6 },
  forecastBody: { color: "#3D4D47", fontSize: 26 / 2, fontWeight: "600", marginBottom: 4 },
  forecastSub: { color: "#5F7069", fontSize: 23 / 2, fontWeight: "600" },
  fixBtn: { marginTop: 10, alignSelf: "flex-start", backgroundColor: "#184B43", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  fixText: { color: "#FFFFFF", fontWeight: "700" },
  categoryTitle: { color: "#283130", fontSize: 18 * 1.08, fontWeight: "700", marginTop: 6, marginBottom: 10 },
  topText: { color: "#34403D", fontWeight: "600", lineHeight: 19, marginBottom: 7 },
  weeklyText: { color: "#5E6D68", fontWeight: "600", marginTop: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  catCard: { width: "48.5%", backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E6EBE8", padding: 12 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  catName: { color: "#6F7977", fontSize: 15 * 0.96, fontWeight: "600" },
  catRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 2 },
  catAmount: { color: "#1F2928", fontSize: 14, fontWeight: "800", flex: 1, marginRight: 6 },
  badge: { fontWeight: "700", fontSize: 12 },
  catLimitLine: { height: 7, borderRadius: 8, backgroundColor: "#E5E9E7", marginVertical: 8, overflow: "hidden" },
  catLimitFill: { height: 7, borderRadius: 8 },
  catLimit: { color: "#8C9692", fontSize: 13, fontWeight: "600" },
  fab: {
    position: "absolute",
    right: 24,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#184B43",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3
  }
});
