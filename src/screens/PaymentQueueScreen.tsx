/**
 * PaymentQueueScreen.tsx
 *
 * Displays all items in the payment queue — images shared into the app from
 * other applications.  Each item can be tapped to review / edit / approve it,
 * or swiped / long-pressed to reject / delete it.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../state/ThemeContext';
import { useFinance } from '../utils/useFinance';
import {
  usePaymentQueueQuery,
  useRejectPaymentQueueItemMutation,
  useDeletePaymentQueueItemMutation,
} from '../state/queries';
import { PressableScale } from '../components/PressableScale';
import { Spacing, FontSize, Radius } from '../utils/theme';
import type { ThemeColors } from '../utils/theme';
import type { PaymentQueueItem } from '../state/types';

// ─── Styles ──────────────────────────────────────────────────────────────────

const createStyles = (c: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    headerTitle: {
      color: c.text,
      fontSize: FontSize.headline,
      fontWeight: '800',
      marginLeft: Spacing.md,
      flex: 1,
    },
    badge: {
      backgroundColor: c.primary,
      borderRadius: Radius.pill,
      minWidth: 22,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    badgeText: { color: c.primaryText, fontSize: FontSize.small, fontWeight: '800' },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
    emptyIcon: { marginBottom: Spacing.md },
    emptyTitle: {
      color: c.text,
      fontSize: FontSize.subtitle,
      fontWeight: '700',
      marginBottom: Spacing.sm,
    },
    emptyBody: {
      color: c.textSecondary,
      fontSize: FontSize.body,
      textAlign: 'center',
      lineHeight: 22,
    },
    card: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      backgroundColor: c.cardBackground,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: c.cardBorder,
      overflow: 'hidden',
    },
    thumbnail: {
      width: '100%',
      height: 180,
      backgroundColor: c.surfaceElevated,
    },
    cardBody: { padding: Spacing.md },
    cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardTitle: { color: c.text, fontSize: FontSize.bodyLarge, fontWeight: '700', flex: 1 },
    cardAmount: { color: c.primary, fontSize: FontSize.bodyLarge, fontWeight: '800' },
    cardMeta: { color: c.textSecondary, fontSize: FontSize.small, marginTop: 4 },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: Radius.pill,
      marginTop: Spacing.sm,
    },
    statusText: { fontSize: FontSize.caption, fontWeight: '800' },
    cardActions: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: c.cardBorder,
      marginTop: Spacing.sm,
    },
    actionBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    actionBtnDivider: {
      width: 1,
      backgroundColor: c.cardBorder,
    },
    actionText: { fontSize: FontSize.small, fontWeight: '700' },
    sectionLabel: {
      color: c.textTertiary,
      fontSize: FontSize.caption,
      fontWeight: '700',
      letterSpacing: 1,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
      marginTop: Spacing.sm,
    },
    pendingIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.warning,
      marginRight: Spacing.xs,
    },
  });

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusLabel(status: string) {
  switch (status) {
    case 'PENDING': return '● Awaiting Review';
    case 'APPROVED': return '✓ Approved';
    case 'REJECTED': return '✕ Rejected';
    default: return status;
  }
}

function statusColors(status: string, c: ThemeColors) {
  switch (status) {
    case 'PENDING': return { bg: c.warningMuted, text: c.warning };
    case 'APPROVED': return { bg: c.successMuted, text: c.success };
    case 'REJECTED': return { bg: c.destructiveMuted, text: c.destructive };
    default: return { bg: c.cardBackground, text: c.textSecondary };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PaymentQueueScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { formatMoney } = useFinance();
  const styles = React.useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const { data: queueItems = [] } = usePaymentQueueQuery();
  const { mutate: rejectItem } = useRejectPaymentQueueItemMutation();
  const { mutate: deleteItem } = useDeletePaymentQueueItemMutation();

  const pendingCount = queueItems.filter((i) => i.status === 'PENDING').length;

  const handleReview = useCallback(
    (item: PaymentQueueItem) => {
      navigation.navigate('ReceiptQueueReview', { queueItemId: item.id });
    },
    [navigation],
  );

  const handleReject = useCallback(
    (item: PaymentQueueItem) => {
      Alert.alert(
        'Reject Receipt',
        'This receipt will be marked as rejected and removed from the active queue.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: () => rejectItem(item.id),
          },
        ],
      );
    },
    [rejectItem],
  );

  const handleDelete = useCallback(
    (item: PaymentQueueItem) => {
      Alert.alert(
        'Delete Receipt',
        'This will permanently remove the receipt image and its queue entry.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteItem(item.id),
          },
        ],
      );
    },
    [deleteItem],
  );

  const renderItem = ({ item, index }: { item: PaymentQueueItem; index: number }) => {
    const statusC = statusColors(item.status, colors);
    return (
      <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
        <View style={styles.card}>
          {/* Thumbnail */}
          <PressableScale onPress={() => handleReview(item)}>
            <Image
              source={{ uri: item.image_uri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          </PressableScale>

          {/* Body */}
          <View style={styles.cardBody}>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.name || 'Untitled Receipt'}
              </Text>
              {item.amount != null && (
                <Text style={styles.cardAmount}>{formatMoney(item.amount)}</Text>
              )}
            </View>

            <Text style={styles.cardMeta}>
              {item.category ? `${item.category}  ·  ` : ''}
              {item.date
                ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              {item.confidence != null ? `  ·  ${item.confidence}% confidence` : ''}
            </Text>

            <View style={[styles.statusBadge, { backgroundColor: statusC.bg }]}>
              <Text style={[styles.statusText, { color: statusC.text }]}>
                {statusLabel(item.status)}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.cardActions}>
            {item.status === 'PENDING' && (
              <>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleReview(item)}>
                  <Feather name="edit-2" size={14} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Review</Text>
                </TouchableOpacity>
                <View style={styles.actionBtnDivider} />
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleReject(item)}>
                  <Feather name="x" size={14} color={colors.warning} />
                  <Text style={[styles.actionText, { color: colors.warning }]}>Reject</Text>
                </TouchableOpacity>
              </>
            )}
            {(item.status === 'APPROVED' || item.status === 'REJECTED') && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)}>
                <Feather name="trash-2" size={14} color={colors.destructive} />
                <Text style={[styles.actionText, { color: colors.destructive }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <>
      <View style={styles.sectionLabel}>
        {queueItems.length > 0
          ? `${queueItems.length} RECEIPT${queueItems.length !== 1 ? 'S' : ''} IN QUEUE`
          : ''}
      </View>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <MaterialCommunityIcons
        name="receipt-text-check-outline"
        size={64}
        color={colors.textTertiary}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>Queue is Empty</Text>
      <Text style={styles.emptyBody}>
        Share a payment screenshot from any UPI / banking app and it will
        appear here for review.
      </Text>
    </View>
  );

  return (
    <View style={[styles.root, { flex: 1 }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, Spacing.lg) + 4 },
        ]}
      >
        <PressableScale onPress={() => navigation.goBack()} hitSlop={16}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </PressableScale>
        <Text style={styles.headerTitle}>Payment Queue</Text>
        {pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={queueItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 24) + 40,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};
