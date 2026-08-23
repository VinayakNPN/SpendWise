import React, { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useAppStore } from "../state/AppStore";
import { useExpensesQuery, useCategoriesQuery } from "../state/queries";
import { budgetSignals, categorySpend, categoryStatus, currentNoSpendStreak, topThreeCategories, weeklyReport, getLast30DaysSpend } from "../utils/finance";
import { useFinance } from "../utils/useFinance";
import { FadeInView } from "../components/FadeInView";
import { PressableScale } from "../components/PressableScale";
import { useTheme } from "../state/ThemeContext";
import type { ThemeColors } from "../utils/theme";
import { Spacing, FontSize, Radius } from "../utils/theme";

const createStyles = (c: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: Spacing.lg + 2, paddingBottom: 96 },
    section: { color: c.textTertiary, fontSize: FontSize.body, letterSpacing: 1.3, fontWeight: "700", marginTop: 10 },
    title: { color: c.text, fontSize: 23, fontWeight: "800", marginTop: 2, marginBottom: Spacing.md },
    card: {
      backgroundColor: c.cardBackground,
      borderRadius: Radius.xxl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: c.cardBorder,
      marginBottom: Spacing.md + 2,
    },
    cardLabel: { color: c.textTertiary, fontSize: FontSize.body, fontWeight: "700", letterSpacing: 0.6 },
    amount: { color: c.text, fontSize: 26, fontWeight: "800", marginVertical: 6 },
    info: { color: c.textSecondary, fontSize: FontSize.body, fontWeight: "600" },
    progressTrack: { height: 10, borderRadius: Radius.xl, backgroundColor: c.progressTrack, marginTop: Spacing.md, marginBottom: Spacing.md + 2 },
    progressBar: { height: 10, borderRadius: Radius.xl, backgroundColor: c.progressBar },
    statsRow: { flexDirection: "row", justifyContent: "space-between" },
    statLabel: { color: c.textTertiary, fontSize: FontSize.small + 1, marginBottom: 4 },
    statValue: { color: c.text, fontSize: 14.5, fontWeight: "800" },
    todaySafe: { color: c.primary, fontWeight: "800", marginTop: 10, fontSize: FontSize.body },
    paceWarn: { color: c.overTone, fontWeight: "700", marginTop: 4, fontSize: FontSize.small + 1 },
    forecast: { backgroundColor: c.forecastBackground },
    forecastTitle: { color: c.forecastTitle, fontSize: 16.5, fontWeight: "800", marginBottom: 6 },
    forecastBody: { color: c.forecastBody, fontSize: 13, fontWeight: "600", marginBottom: 4 },
    forecastSub: { color: c.forecastSub, fontSize: 11.5, fontWeight: "600" },
    fixBtn: {
      marginTop: 10,
      alignSelf: "flex-start",
      backgroundColor: c.primary,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md + 2,
      paddingVertical: 9,
    },
    fixText: { color: c.primaryText, fontWeight: "700" },
    categoryTitle: { color: c.text, fontSize: 19.5, fontWeight: "700", marginTop: 6, marginBottom: 10 },
    topText: { color: isDark ? c.textSecondary : "#34403D", fontWeight: "600", lineHeight: 19, marginBottom: 7 },
    weeklyText: { color: c.textSecondary, fontWeight: "600", marginTop: 6 },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
    catCard: {
      width: "48.5%",
      backgroundColor: c.cardBackground,
      borderRadius: Radius.lg + 2,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: Spacing.md,
    },
    iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: Spacing.sm },
    catName: { color: c.textSecondary, fontSize: 14.4, fontWeight: "600" },
    catRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 2 },
    catAmount: { color: c.text, fontSize: FontSize.body, fontWeight: "800", flex: 1, marginRight: 6 },
    badge: { fontWeight: "700", fontSize: FontSize.small },
    catLimitLine: { height: 7, borderRadius: Radius.sm, backgroundColor: c.progressTrack, marginVertical: Spacing.sm, overflow: "hidden" },
    catLimitFill: { height: 7, borderRadius: Radius.sm },
    catLimit: { color: c.textTertiary, fontSize: FontSize.small + 1, fontWeight: "600" },
    fab: {
      position: "absolute",
      right: 24,
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: c.fabBackground,
      alignItems: "center",
      justifyContent: "center",
      elevation: 3,
    },
    streakSection: { marginTop: Spacing.lg, borderTopWidth: 1, borderTopColor: c.divider, paddingTop: Spacing.lg },
    streakTitle: { fontSize: FontSize.small + 1, fontWeight: "700", color: c.text, marginBottom: Spacing.sm },
    streakDot: { width: 14, height: 14, borderRadius: 3 },
    streakLabel: { fontSize: FontSize.caption, color: c.textTertiary, marginTop: Spacing.sm },
  });

export const DashboardScreen = () => {
  const insets = useSafeAreaInsets();
  const { budget, preferences, setPreferences } = useAppStore();
  const { data: expenses = [] } = useExpensesQuery();
  const { data: categories = [] } = useCategoriesQuery();
  const { colors, isDark } = useTheme();
  const { formatMoney } = useFinance();

  const styles = React.useMemo(() => createStyles(colors, isDark), [colors, isDark]);

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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View>
            <Text style={styles.section}>OVERVIEW</Text>
            <Text style={styles.title}>{format(new Date(), "MMMM yyyy")}</Text>
          </View>
          <PressableScale 
            onPress={() => setPreferences({ ...preferences, isPrivacyEnabled: !preferences.isPrivacyEnabled })}
            style={{ marginLeft: Spacing.md, padding: 8 }}
          >
            <Feather name={preferences.isPrivacyEnabled ? "eye-off" : "eye"} size={22} color={colors.textSecondary} />
          </PressableScale>
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
        <PressableScale style={styles.fixBtn} onPress={() => navigation.navigate("Advisor")}>
          <Text style={styles.fixText}>Fix my spending</Text>
        </PressableScale>
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
          <View style={styles.streakSection}>
            <Text style={styles.streakTitle}>No-spend day streak: {streak} day{streak === 1 ? "" : "s"}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
              {last30Days.map((day, idx) => (
                <View
                  key={idx}
                  style={[styles.streakDot, {
                    backgroundColor: day.noSpend ? colors.primary : (isDark ? colors.surfaceElevated : "#E2E8E5"),
                  }]}
                />
              ))}
            </View>
            <Text style={styles.streakLabel}>Last 30 days activity</Text>
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
            <PressableScale key={c.id} style={styles.catCard} onPress={() => navigation.navigate("Expenses", { initialCategory: c.name })}>
              <View style={[styles.iconWrap, { backgroundColor: c.color + (isDark ? "30" : "20") }]}>
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
                      backgroundColor: status.bar,
                    },
                  ]}
                />
              </View>
            </PressableScale>
          );
        })}
        {categories.length === 0 && (
          <Text style={styles.catLimit}>No categories found. Go to Settings to configure your categories.</Text>
        )}
        </View>
      </FadeInView>

      <PressableScale style={[styles.fab, { bottom: Math.max(insets.bottom, 20) + 70 }]} onPress={() => navigation.navigate("Expenses")}>
        <Feather name="plus" size={28} color={colors.fabIcon} />
      </PressableScale>
    </ScrollView>
  );
};
