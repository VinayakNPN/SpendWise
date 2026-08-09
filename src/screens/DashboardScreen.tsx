import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useAppStore } from "../state/AppStore";
import { useExpensesQuery, useCategoriesQuery } from "../state/queries";
import { budgetSignals, categorySpend, categoryStatus, currentNoSpendStreak, topThreeCategories, weeklyReport, formatMoney, getLast30DaysSpend } from "../utils/finance";
import { FadeInView } from "../components/FadeInView";

export const DashboardScreen = () => {
  const insets = useSafeAreaInsets();
  const { budget } = useAppStore();
  const { data: expenses = [] } = useExpensesQuery();
  const { data: categories = [] } = useCategoriesQuery();
  
  const navigation = useNavigation<any>();
  const stats = budgetSignals(expenses, budget);
  
  const pd = budget.paycheckDate || 1;
  const cat = categorySpend(expenses, pd);
  const topThree = topThreeCategories(expenses, pd);
  const streak = currentNoSpendStreak(expenses);
  const weekly = weeklyReport(expenses);
  const last30Days = getLast30DaysSpend(expenses);

  const sortedCards = [...categories].sort((a, b) => (cat[b.name] ?? 0) - (cat[a.name] ?? 0));

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 18), paddingBottom: Math.max(insets.bottom, 100) }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View>
          <Text style={styles.section}>OVERVIEW</Text>
          <Text style={styles.title}>{format(new Date(), "MMMM yyyy")}</Text>
        </View>
        <Image source={require('../../logo-cropped.png')} style={{ width: 48, height: 48, borderRadius: 12, opacity: 0.9 }} resizeMode="contain" />
      </View>

      <FadeInView>
        <View style={styles.card}>
        <Text style={styles.cardLabel}>TOTAL SPENT</Text>
        <Text style={styles.amount}>{formatMoney(stats.monthSpent)}</Text>
        <Text style={styles.info}>
          of {formatMoney(budget.monthlyLimit || budget.monthlyIncome || 0)} limit · {Math.round(stats.ratio * 100)}% used
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${Math.min(100, Math.round(stats.ratio * 100))}%` }]} />
        </View>
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statLabel}>Avg / day</Text>
            <Text style={styles.statValue}>{formatMoney(stats.perDay)}</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Ideal / day</Text>
            <Text style={styles.statValue}>{formatMoney(stats.idealPerDay)}</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Days left</Text>
            <Text style={styles.statValue}>{stats.daysLeft}</Text>
          </View>
        </View>
        <Text style={styles.todaySafe}>You can safely spend {formatMoney(stats.safeToSpendToday)} today</Text>
        {stats.paceRatio > 1.2 && <Text style={styles.paceWarn}>You are {stats.paceRatio.toFixed(1)}x above ideal pace</Text>}
        </View>
      </FadeInView>

      <FadeInView delay={40}>
        <View style={[styles.card, styles.forecast]}>
        <Text style={styles.forecastTitle}>↗ AI Forecast</Text>
        <Text style={styles.forecastBody}>
          {stats.projectedOvershoot > 0
            ? `At this rate, you will overshoot by ${formatMoney(stats.projectedOvershoot)}`
            : "You are currently within monthly budget trajectory"}
        </Text>
        {stats.projectedOvershoot > 0 && (
          <Text style={styles.forecastSub}>Reduce spending by about {formatMoney(Math.max(50, stats.projectedOvershoot / Math.max(1, stats.daysLeft || 1)))} / day to recover.</Text>
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
            Days left {stats.daysLeft} vs Budget left {formatMoney(stats.budgetLeft)}
          </Text>
          {new Date().getDay() === 0 && (
            <Text style={styles.weeklyText}>
              Weekly AI report: You spent {formatMoney(weekly.thisWeek)} this week ({weekly.diffPct >= 0 ? "+" : ""}
              {weekly.diffPct}% vs last week).
            </Text>
          )}
          <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: "#E9EEEB", paddingTop: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#1F2928", marginBottom: 8 }}>No-spend day streak: {streak} day{streak === 1 ? "" : "s"}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
              {last30Days.map((day, idx) => (
                <View 
                  key={idx} 
                  style={{ 
                    width: 14, 
                    height: 14, 
                    borderRadius: 3, 
                    backgroundColor: day.noSpend ? "#2D8A73" : "#E2E8E5" 
                  }} 
                />
              ))}
            </View>
            <Text style={{ fontSize: 11, color: "#8B9792", marginTop: 8 }}>Last 30 days activity</Text>
          </View>
        </View>
      </FadeInView>

      <Text style={styles.categoryTitle}>Categories</Text>
      <FadeInView delay={90}>
        <View style={styles.grid}>
        {sortedCards.map((c) => {
          const spent = cat[c.name] ?? 0;
          const limit = c.monthly_limit || 0;
          const left = limit - spent;
          const status = categoryStatus(spent, limit);
          
          return (
            <Pressable key={c.id} style={styles.catCard} onPress={() => navigation.navigate("Expenses", { initialCategory: c.name })}>
              <View style={[styles.iconWrap, { backgroundColor: c.color + "20" }]}>
                <MaterialCommunityIcons name={c.icon as any} size={16} color={c.color} />
              </View>
              <Text style={styles.catName}>{c.name}</Text>
              <View style={styles.catRow}>
                <Text style={styles.catAmount}>{formatMoney(spent)} / {formatMoney(limit)}</Text>
                <Text style={[styles.badge, { color: status.tone }]}>
                  {left >= 0 ? `${formatMoney(left)} left` : `${formatMoney(Math.abs(left))} over`}
                </Text>
              </View>
              <View style={styles.catLimitLine}>
                <View
                  style={[
                    styles.catLimitFill,
                    {
                      width: `${Math.min(100, Math.round(status.ratio * 100))}%`,
                      backgroundColor: status.bar
                    }
                  ]}
                />
              </View>
            </Pressable>
          );
        })}
        {categories.length === 0 && (
          <Text style={styles.catLimit}>No categories found. Go to Settings to configure your categories.</Text>
        )}
        </View>
      </FadeInView>

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
