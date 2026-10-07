/**
 * ReceiptQueueReviewScreen.tsx
 *
 * Full-featured review screen for a queued shared receipt.
 * Shows the image, allows the user to fill / correct parsed fields,
 * and either approves (creating a transaction) or rejects the item.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../state/ThemeContext';
import { useFinance } from '../utils/useFinance';
import {
  usePaymentQueueQuery,
  useCategoriesQuery,
  useAccountsQuery,
  useApprovePaymentQueueItemMutation,
  useRejectPaymentQueueItemMutation,
  useUpdatePaymentQueueItemMutation,
} from '../state/queries';
import { PressableScale } from '../components/PressableScale';
import { Spacing, FontSize, Radius } from '../utils/theme';
import type { ThemeColors } from '../utils/theme';

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (c: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    // Hero image
    heroBg: {
      width: '100%',
      height: 260,
      backgroundColor: c.surfaceElevated,
    },
    heroOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
    },
    heroTitleWrap: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
      paddingTop: Spacing.xl,
      // Gradient simulation via background
      backgroundColor: isDark ? 'rgba(18,18,18,0.8)' : 'rgba(244,246,245,0.85)',
    },
    heroTitle: {
      color: c.text,
      fontSize: FontSize.title,
      fontWeight: '800',
    },
    heroSub: { color: c.textSecondary, fontSize: FontSize.small, marginTop: 2 },
    // Form
    formWrap: { padding: Spacing.lg },
    sectionTitle: {
      color: c.textTertiary,
      fontSize: FontSize.caption,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: Spacing.sm,
      marginTop: Spacing.md,
    },
    card: {
      backgroundColor: c.cardBackground,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.inputBackground,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      minHeight: 48,
    },
    inputIcon: { marginRight: Spacing.sm },
    input: {
      flex: 1,
      color: c.inputText,
      fontSize: FontSize.bodyLarge,
      fontWeight: '600',
      paddingVertical: Spacing.md,
    },
    inputPrefix: {
      color: c.textSecondary,
      fontSize: FontSize.bodyLarge,
      fontWeight: '800',
      marginRight: 4,
    },
    label: { color: c.textSecondary, fontWeight: '700', fontSize: FontSize.small, marginBottom: 6 },
    // Category chips
    chipScroll: { flexDirection: 'row', marginBottom: Spacing.md },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.cardBackground,
      borderWidth: 1,
      borderColor: c.chipBorder,
      borderRadius: Radius.pill,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      marginRight: Spacing.sm,
    },
    chipText: { color: c.chipText, fontWeight: '700', fontSize: FontSize.small },
    // Confidence bar
    confRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    confLabel: { color: c.textSecondary, fontWeight: '600', fontSize: FontSize.body },
    confValue: { color: c.primary, fontWeight: '800', fontSize: FontSize.body },
    confTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: c.progressTrack,
      marginBottom: Spacing.md,
    },
    confBar: {
      height: 6,
      borderRadius: 3,
    },
    // Actions
    actionRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xl,
      paddingTop: Spacing.sm,
    },
    btnReject: {
      flex: 1,
      backgroundColor: c.cardBackground,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md + 2,
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    btnRejectText: { color: c.textSecondary, fontWeight: '700', fontSize: FontSize.body },
    btnApprove: {
      flex: 2,
      backgroundColor: c.primary,
      borderRadius: Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md + 2,
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    btnApproveText: { color: c.primaryText, fontWeight: '800', fontSize: FontSize.body },
    approvedBanner: {
      backgroundColor: c.successMuted,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    approvedTitle: { color: c.success, fontWeight: '800', fontSize: FontSize.subtitle, marginTop: Spacing.sm },
    approvedSub: { color: c.success, fontWeight: '600', fontSize: FontSize.body, marginTop: 4 },
  });

// ─── Component ────────────────────────────────────────────────────────────────

export const ReceiptQueueReviewScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { formatMoney } = useFinance();
  const styles = React.useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // Queries / mutations
  const { data: queueItems = [] } = usePaymentQueueQuery();
  const { data: categories = [] } = useCategoriesQuery();
  const { data: accounts = [] } = useAccountsQuery();
  const { mutate: approve, isPending: isApproving } = useApprovePaymentQueueItemMutation();
  const { mutate: reject, isPending: isRejecting } = useRejectPaymentQueueItemMutation();
  const { mutate: update } = useUpdatePaymentQueueItemMutation();

  const queueItemId: string = route.params?.queueItemId;
  const item = queueItems.find((i) => i.id === queueItemId);

  // Form state — initialised from queue item
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setAmount(item.amount != null ? String(item.amount) : '');
      setCategory(item.category || categories[0]?.name || '');
      setAccountId(item.account_id || '');
      setNote(item.note || '');
      setDate(
        item.date
          ? item.date.split('T')[0]
          : new Date().toISOString().split('T')[0],
      );
    }
  }, [item?.id]);

  const handleApprove = useCallback(() => {
    const cleanAmount = amount ? Number(amount.replace(',', '.')) : NaN;
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      Alert.alert('Missing Amount', 'Please enter a valid positive numerical amount.');
      return;
    }
    if (!category) {
      Alert.alert('Missing Category', 'Please select a category for this transaction.');
      return;
    }

    const txName = name.trim() || 'Receipt Payment';
    let txDate = new Date().toISOString();
    try {
      if (date) {
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
          txDate = d.toISOString();
        }
      }
    } catch (_) {}

    approve(
      {
        queueId: queueItemId,
        expenseData: {
          name: txName,
          amount: cleanAmount,
          category,
          account_id: accountId || undefined,
          note: note.trim() || undefined,
          date: txDate,
          type: 'EXPENSE',
          status: 'CLEARED',
          source: 'SHARE_RECEIPT',
          merchant_name: txName,
        },
      },
      {
        onSuccess: () => {
          Alert.alert(
            '✅ Payment Approved',
            `"${txName}" has been added to your transactions.`,
            [{ text: 'OK', onPress: () => navigation.navigate('PaymentQueueHome') }],
          );
        },
      },
    );
  }, [queueItemId, name, amount, category, accountId, note, date, approve, navigation]);

  const handleReject = useCallback(() => {
    Alert.alert(
      'Reject Receipt',
      'Mark this receipt as rejected? You can delete it later from the queue.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            reject(queueItemId, {
              onSuccess: () => navigation.goBack(),
            });
          },
        },
      ],
    );
  }, [queueItemId, reject, navigation]);

  /** Auto-save editable fields to the queue whenever they change. */
  const autoSave = useCallback(
    (field: string, value: any) => {
      if (!queueItemId) return;
      update({ id: queueItemId, patch: { [field]: value } });
    },
    [queueItemId, update],
  );

  if (!item) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textSecondary, fontSize: FontSize.body }}>
          Receipt not found.
        </Text>
        <PressableScale onPress={() => navigation.goBack()} style={{ marginTop: Spacing.lg }}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Go Back</Text>
        </PressableScale>
      </View>
    );
  }

  const isApproved = item.status === 'APPROVED';
  const isRejected = item.status === 'REJECTED';
  const isLocked = isApproved || isRejected;

  const confColor = (c: number) => {
    if (c >= 75) return colors.success;
    if (c >= 50) return colors.warning;
    return colors.destructive;
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 80 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Receipt Image */}
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: item.image_uri }}
            style={styles.heroBg}
            resizeMode="cover"
          />
          {/* Back button overlay */}
          <View style={[styles.heroOverlay, { paddingTop: Math.max(insets.top, 16) }]}>
            <PressableScale onPress={() => navigation.goBack()} hitSlop={16}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="arrow-left" size={20} color={colors.text} />
              </View>
            </PressableScale>
          </View>
          {/* Title overlay */}
          <Animated.View entering={FadeIn} style={styles.heroTitleWrap}>
            <Text style={styles.heroTitle}>Review Receipt</Text>
            <Text style={styles.heroSub}>
              {isApproved
                ? '✓ Approved — transaction created'
                : isRejected
                ? '✕ Rejected'
                : 'Verify and edit the details below'}
            </Text>
          </Animated.View>
        </View>

        <View style={styles.formWrap}>
          {/* AI Confidence */}
          {item.confidence != null && (
            <Animated.View entering={FadeInDown.delay(60)} style={styles.card}>
              <View style={styles.confRow}>
                <Text style={styles.confLabel}>AI Parse Confidence</Text>
                <Text style={[styles.confValue, { color: confColor(item.confidence) }]}>
                  {item.confidence}%
                </Text>
              </View>
              <View style={styles.confTrack}>
                <View
                  style={[
                    styles.confBar,
                    { width: `${item.confidence}%`, backgroundColor: confColor(item.confidence) },
                  ]}
                />
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: FontSize.small }}>
                {item.confidence >= 75
                  ? 'High confidence — fields are likely correct.'
                  : item.confidence >= 50
                  ? 'Medium confidence — please verify the details.'
                  : 'Low confidence — please fill in the details manually.'}
              </Text>
            </Animated.View>
          )}

          {/* Amount */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
            <Text style={styles.sectionTitle}>AMOUNT</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputPrefix}>₹</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.inputPlaceholder}
                placeholder="0.00"
                editable={!isLocked}
                onBlur={() => autoSave('amount', Number(amount))}
              />
            </View>
          </Animated.View>

          {/* Merchant / Description */}
          <Animated.View entering={FadeInDown.delay(140)} style={styles.card}>
            <Text style={styles.sectionTitle}>MERCHANT / DESCRIPTION</Text>
            <View style={styles.inputRow}>
              <Feather name="shopping-bag" size={16} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Swiggy, Amazon"
                placeholderTextColor={colors.inputPlaceholder}
                editable={!isLocked}
                onBlur={() => autoSave('name', name.trim())}
              />
            </View>

            <Text style={styles.sectionTitle}>NOTE (OPTIONAL)</Text>
            <View style={styles.inputRow}>
              <Feather name="file-text" size={16} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={note}
                onChangeText={setNote}
                placeholder="Additional notes..."
                placeholderTextColor={colors.inputPlaceholder}
                editable={!isLocked}
                onBlur={() => autoSave('note', note.trim())}
              />
            </View>

            <Text style={styles.sectionTitle}>DATE</Text>
            <View style={styles.inputRow}>
              <Feather name="calendar" size={16} color={colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.inputPlaceholder}
                editable={!isLocked}
                onBlur={() => autoSave('date', date)}
              />
            </View>
          </Animated.View>

          {/* Category */}
          <Animated.View entering={FadeInDown.delay(180)} style={styles.card}>
            <Text style={styles.sectionTitle}>CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              {categories.map((cat) => {
                const active = category === cat.name;
                return (
                  <PressableScale
                    key={cat.id}
                    style={[
                      styles.chip,
                      active && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => {
                      if (!isLocked) {
                        setCategory(cat.name);
                        autoSave('category', cat.name);
                      }
                    }}
                  >
                    <MaterialCommunityIcons
                      name={cat.icon as any}
                      size={14}
                      color={active ? '#FFF' : cat.color}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[styles.chipText, active && { color: '#FFF' }]}>{cat.name}</Text>
                  </PressableScale>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Account */}
          {accounts.length > 0 && (
            <Animated.View entering={FadeInDown.delay(220)} style={styles.card}>
              <Text style={styles.sectionTitle}>ACCOUNT (OPTIONAL)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 4 }}
              >
                <PressableScale
                  style={[styles.chip, !accountId && { backgroundColor: colors.borderLight }]}
                  onPress={() => !isLocked && (setAccountId(''), autoSave('account_id', null))}
                >
                  <Text style={styles.chipText}>None</Text>
                </PressableScale>
                {accounts.map((acc) => {
                  const active = accountId === acc.id;
                  return (
                    <PressableScale
                      key={acc.id}
                      style={[
                        styles.chip,
                        active && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => {
                        if (!isLocked) {
                          setAccountId(acc.id);
                          autoSave('account_id', acc.id);
                        }
                      }}
                    >
                      <MaterialCommunityIcons
                        name="bank-outline"
                        size={14}
                        color={active ? '#FFF' : colors.primary}
                        style={{ marginRight: 5 }}
                      />
                      <Text style={[styles.chipText, active && { color: '#FFF' }]}>{acc.name}</Text>
                    </PressableScale>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}

          {/* Approved banner */}
          {isApproved && (
            <Animated.View entering={ZoomIn} style={styles.approvedBanner}>
              <MaterialCommunityIcons name="check-circle-outline" size={40} color={colors.success} />
              <Text style={styles.approvedTitle}>Payment Approved!</Text>
              <Text style={styles.approvedSub}>
                Transaction has been added to your records.
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions (only for pending items) */}
      {!isLocked && (
        <Animated.View
          entering={FadeIn.delay(300)}
          style={[
            styles.actionRow,
            {
              paddingBottom: Math.max(insets.bottom, Spacing.lg),
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.cardBorder,
            },
          ]}
        >
          <PressableScale style={styles.btnReject} onPress={handleReject} disabled={isRejecting}>
            <Feather name="x-circle" size={18} color={colors.textSecondary} />
            <Text style={styles.btnRejectText}>Reject</Text>
          </PressableScale>

          <PressableScale
            style={[styles.btnApprove, (isApproving) && { opacity: 0.7 }]}
            onPress={handleApprove}
            disabled={isApproving}
          >
            <Feather name="check-circle" size={18} color={colors.primaryText} />
            <Text style={styles.btnApproveText}>
              {isApproving ? 'Approving…' : 'Approve & Add'}
            </Text>
          </PressableScale>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
};
