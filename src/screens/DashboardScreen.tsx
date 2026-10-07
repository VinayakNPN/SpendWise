import React, { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useAppStore } from "../state/AppStore";
import { useExpensesQuery, useCategoriesQuery, useAccountsQuery, useRecurringPaymentsQuery, useDebtsQuery, useGoalsQuery, usePendingPaymentQueueQuery } from "../state/queries";
import { budgetSignals, categorySpend, categoryStatus, currentNoSpendStreak, topThreeCategories, weeklyReport, getLast30DaysSpend, calculateAccountBalance } from "../utils/finance";
import { calculateSafeToSpend } from "../utils/safeToSpend";
import { useFinance } from "../utils/useFinance";
import { FadeInView } from "../components/FadeInView";
import { PressableScale } from "../components/PressableScale";
import { NeedsReviewInbox } from "../components/NeedsReviewInbox";
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
  const { data: accounts = [] } = useAccountsQuery();
  const { data: recurringPayments = [] } = useRecurringPaymentsQuery();
  const { data: debts = [] } = useDebtsQuery();
  const { data: goals = [] } = useGoalsQuery();
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
  
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const spentToday = expenses
    .filter(e => e.date.startsWith(todayStr) && (e.type === 'EXPENSE' || !e.type))
    .reduce((sum, e) => sum + e.amount, 0);

  const { data: pendingQueueItems = [] } = usePendingPaymentQueueQuery();
  const pendingQueueCount = pendingQueueItems.length;

  const dailyLimit = preferences?.dailyLimit || 0;
  const dailyPct = dailyLimit > 0 ? (spentToday / dailyLimit) * 100 : 0;
  let dailyColor = colors.success;
  if (dailyPct >= 100) dailyColor = colors.destructive;
  else if (dailyPct >= 75) dailyColor = colors.warning;

  const safeToSpendObj = React.useMemo(() => calculateSafeToSpend(accounts, expenses, recurringPayments, debts, goals, budget), [accounts, expenses, recurringPayments, debts, goals, budget]);

  const sortedCards = [...categories].sort((a, b) => (cat[b.name] ?? 0) - (cat[a.name] ?? 0));

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 18), paddingBottom: Math.max(insets.bottom, 100) }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View>
            <Text style={styles.section}>OVERVIEW</Text>
            <Text style={styles.title}>{format(new Date(), "MMMM yyyy")}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <PressableScale onPress={() => navigation.navigate("Reports")} style={{ padding: 8, backgroundColor: colors.cardBackground, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder }}>
            <MaterialCommunityIcons name="chart-bar" size={24} color={colors.primary} />
          </PressableScale>
          <Image source={require('../../logo-cropped.png')} style={{ width: 48, height: 48, borderRadius: 12, opacity: 0.9 }} resizeMode="contain" />
        </View>
      </View>

      <NeedsReviewInbox />

      {/* Payment Queue Banner */}
      {pendingQueueCount > 0 && (
        <PressableScale
          onPress={() => navigation.navigate("Queue")}
          style={{
            backgroundColor: colors.infoMuted,
            borderRadius: Radius.lg,
            borderWidth: 1,
            borderColor: colors.info,
            padding: Spacing.md + 2,
            marginBottom: Spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.md,
          }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.info + '22', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="receipt-text-outline" size={20} color={colors.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.info, fontWeight: '800', fontSize: FontSize.body }}>
              {pendingQueueCount} Shared Receipt{pendingQueueCount > 1 ? 's' : ''} Awaiting Review
            </Text>
            <Text style={{ color: colors.info, fontSize: FontSize.small, marginTop: 2, opacity: 0.8 }}>
              Tap to open Payment Queue →
            </Text>
          </View>
        </PressableScale>
      )}

      {dailyLimit > 0 && (
        <FadeInView>
          <View style={[styles.card, { borderColor: dailyColor }]}>
            <Text style={styles.cardLabel}>DAILY LIMIT</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <Text style={[styles.amount, { color: dailyColor }]}>{formatMoney(spentToday)}</Text>
              <Text style={[styles.info, { marginBottom: 12 }]}>/ {formatMoney(dailyLimit)} spent</Text>
            </View>
            
            <View style={[styles.progressTrack, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}>
              <View style={[styles.progressBar, { width: `${Math.min(100, dailyPct)}%`, backgroundColor: dailyColor }]} />
            </View>
            
            {dailyPct > 100 ? (
              <Text style={{ color: colors.destructive, fontWeight: '700' }}>Exceeded by: {formatMoney(spentToday - dailyLimit)}</Text>
            ) : (
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Remaining: {formatMoney(dailyLimit - spentToday)}</Text>
            )}
          </View>
        </FadeInView>
      )}

      <FadeInView delay={10}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>SAFE TO SPEND</Text>
          <Text style={[styles.amount, { color: safeToSpendObj.safeToSpend > 0 ? colors.success : colors.destructive }]}>
            {formatMoney(safeToSpendObj.safeToSpend)}
          </Text>
          <Text style={styles.info}>until {format(new Date(safeToSpendObj.untilDate), "MMM dd")}</Text>
          <View style={[styles.statsRow, { marginTop: 16 }]}>
            <View>
              <Text style={styles.statLabel}>Available Cash</Text>
              <Text style={styles.statValue}>{formatMoney(safeToSpendObj.breakdown.availableCash)}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Obligations</Text>
              <Text style={styles.statValue}>{formatMoney(safeToSpendObj.breakdown.upcomingObligations + safeToSpendObj.breakdown.debtPayments + safeToSpendObj.breakdown.goalAllocations)}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Buffer</Text>
              <Text style={styles.statValue}>{formatMoney(safeToSpendObj.breakdown.safetyBuffer)}</Text>
            </View>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={20}>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
            <Text style={styles.categoryTitle}>Accounts Summary</Text>
            <PressableScale onPress={() => navigation.navigate("Settings", { screen: "Accounts" })}>
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: FontSize.small }}>View All</Text>
            </PressableScale>
          </View>
          {accounts.slice(0, 3).map(acc => (
            <View key={acc.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>{acc.name}</Text>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{formatMoney(calculateAccountBalance(acc, expenses))}</Text>
            </View>
          ))}
          {accounts.length === 0 && <Text style={styles.catLimit}>No accounts added yet.</Text>}
        </View>
      </FadeInView>

      <FadeInView delay={40}>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
            <Text style={styles.categoryTitle}>Upcoming Payments</Text>
            <PressableScale onPress={() => navigation.navigate("RecurringPayments")}>
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: FontSize.small }}>Manage</Text>
            </PressableScale>
          </View>
          {recurringPayments.filter(p => p.status !== 'PAID' && p.status !== 'SKIPPED').slice(0, 3).map(p => (
            <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, alignItems: 'center' }}>
              <View>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{p.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: FontSize.small }}>Due {format(new Date(p.next_due), "MMM dd")}</Text>
              </View>
              <Text style={{ color: colors.destructive, fontWeight: '700' }}>{formatMoney(p.amount)}</Text>
            </View>
          ))}
          {recurringPayments.length === 0 && <Text style={styles.catLimit}>No upcoming payments.</Text>}
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
      
      <FadeInView delay={60}>
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

      <Text style={styles.categoryTitle}>Categories</Text>
      <FadeInView delay={90}>
        <View style={styles.grid}>
        {sortedCards.map((c) => {
          const spent = cat[c.name] ?? 0;
          const limit = c.monthly_limit || 0;
          const left = limit - spent;
          const status = categoryStatus(spent, limit);

          return (
            <PressableScale key={c.id} style={styles.catCard} onPress={() => navigation.navigate("Activity", { initialCategory: c.name })}>
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

      <PressableScale style={[styles.fab, { bottom: Math.max(insets.bottom, 20) + 70 }]} onPress={() => navigation.navigate("Activity")}>
        <Feather name="plus" size={28} color={colors.fabIcon} />
      </PressableScale>
    </ScrollView>
  );
};
