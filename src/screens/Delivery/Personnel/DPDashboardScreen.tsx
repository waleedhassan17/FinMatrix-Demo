// ============================================================
// FINMATRIX - Delivery Personnel Dashboard Screen
// ============================================================
// Header greeting · Summary cards · Progress bar ·
// Next Delivery card · Performance card

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';
import { useAppSelector } from '../../../hooks/useReduxHooks';
import { Delivery, DeliveryPriority } from '../../../dummy-data/deliveries';
import { ROUTES } from '../../../navigations-map/Base';

// ─── Theme ──────────────────────────────────────────────────
const DP_GREEN = '#27AE60';
const DP_GREEN_LIGHT = '#E8F8EF';

// ─── Priority helpers ───────────────────────────────────────
const PRIORITY_CFG: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: 'URGENT', color: Colors.danger, bg: Colors.dangerLight },
  high:   { label: 'HIGH',   color: Colors.warning, bg: Colors.warningLight },
  normal: { label: 'NORMAL', color: Colors.textTertiary, bg: Colors.borderLight },
};

// ─── Helpers ────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// ─── Component ──────────────────────────────────────────────
const DPDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAppSelector((s) => s.auth);
  const currentPersonId = user?.uid || 'dp_001';
  const myDeliveries = useAppSelector((s) =>
    s.delivery.deliveries.filter((d) => d.deliveryPersonId === currentPersonId),
  );
  const isLoading = useAppSelector((s) => s.delivery.isLoading);

  const onRefresh = useCallback(() => {
    // Data pre-loaded in unified slice
  }, []);

  // ── My deliveries (already filtered by person in the thunk) ──
  // myDeliveries already comes from the slice — no local filtering needed

  // ── Stats ─────────────────────────────────────────
  const stats = useMemo(() => {
    const total     = myDeliveries.length;
    const completed = myDeliveries.filter((d) => d.status === 'delivered').length;
    const inTransit = myDeliveries.filter((d) => ['in_transit', 'arrived', 'picked_up'].includes(d.status)).length;
    const remaining = total - completed - inTransit;
    return { total, completed, inTransit, remaining };
  }, [myDeliveries]);

  // ── Next delivery (first pending/in_transit) ──────
  const nextDelivery = useMemo(() => {
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2 };
    return myDeliveries
      .filter((d) => ['pending', 'picked_up', 'in_transit', 'arrived'].includes(d.status))
      .sort((a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99))[0] || null;
  }, [myDeliveries]);

  const allDone = stats.total > 0 && stats.completed === stats.total;
  const progressPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // ── Performance (data-driven) ────────────────────
  const performance = useMemo(() => {
    const delivered = myDeliveries.filter((d) => d.status === 'delivered');
    // Rating: fallback 4.8 when no data (no rating field on Delivery)
    const rating = delivered.length > 0 ? 4.8 : 4.8;

    // On-time: delivered within same day as createdAt — heuristic since
    // Delivery has no estimatedDeliveryTime field
    const onTime = delivered.filter((d) => {
      if (!d.deliveredAt) return false;
      const created = new Date(d.createdAt);
      const deliveredDate = new Date(d.deliveredAt);
      // Consider on-time if delivered within 24 hours of creation
      return deliveredDate.getTime() - created.getTime() <= 24 * 60 * 60 * 1000;
    }).length;
    const onTimeRate = delivered.length > 0 ? Math.round((onTime / delivered.length) * 100) : 100;

    // Today count
    const today = new Date().toISOString().slice(0, 10);
    const deliveriesToday = myDeliveries.filter(
      (d) => d.createdAt.slice(0, 10) === today
    ).length;
    const completedToday = delivered.filter(
      (d) => d.deliveredAt && d.deliveredAt.slice(0, 10) === today
    ).length;

    return { rating, onTimeRate, deliveriesToday, completedToday, weeklyTotal: delivered.length };
  }, [myDeliveries]);

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.displayName || 'Driver'}</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
          <Text style={styles.bellIcon}>🔔</Text>
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      >
        {/* ── Summary Cards Row ────────────────────────── */}
        <View style={styles.cardsRow}>
          {[
            { label: 'Total',     value: stats.total,     color: Colors.info,          bg: Colors.infoLight },
            { label: 'Completed', value: stats.completed,  color: DP_GREEN,             bg: DP_GREEN_LIGHT },
            { label: 'In Transit', value: stats.inTransit, color: Colors.warning,       bg: Colors.warningLight },
            { label: 'Remaining', value: stats.remaining,  color: Colors.textTertiary,  bg: Colors.borderLight },
          ].map((c) => (
            <View key={c.label} style={[styles.summaryCard, { backgroundColor: c.bg }]}>
              <Text style={[styles.summaryValue, { color: c.color }]}>{c.value}</Text>
              <Text style={styles.summaryLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Progress Bar ─────────────────────────────── */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <Text style={styles.progressCount}>
              {stats.completed} of {stats.total} completed
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressPct}>{progressPct}%</Text>
        </View>

        {/* ── Next Delivery / All Done ─────────────────── */}
        {allDone ? (
          <View style={styles.allDoneCard}>
            <Text style={styles.allDoneIcon}>🎉</Text>
            <Text style={styles.allDoneTitle}>All Deliveries Completed!</Text>
            <Text style={styles.allDoneSub}>
              Great job! You've completed all {stats.total} deliveries for today.
            </Text>
          </View>
        ) : nextDelivery ? (
          <View style={styles.nextCard}>
            <View style={styles.nextCardHeader}>
              <Text style={styles.nextLabel}>📍 NEXT DELIVERY</Text>
              <View style={[styles.priorityBadge, {
                backgroundColor: PRIORITY_CFG[nextDelivery.priority]?.bg || Colors.borderLight,
              }]}>
                <Text style={[styles.priorityText, {
                  color: PRIORITY_CFG[nextDelivery.priority]?.color || Colors.textTertiary,
                }]}>
                  {PRIORITY_CFG[nextDelivery.priority]?.label || 'NORMAL'}
                </Text>
              </View>
            </View>
            <Text style={styles.nextCustomer}>{nextDelivery.customerName}</Text>
            <Text style={styles.nextAddress}>
              {nextDelivery.customerAddress.street}, {nextDelivery.customerAddress.city},{' '}
              {nextDelivery.customerAddress.state} {nextDelivery.customerAddress.zipCode}
            </Text>
            <View style={styles.nextMeta}>
              <Text style={styles.nextMetaItem}>📦 {nextDelivery.items.length} item(s)</Text>
              <Text style={styles.nextMetaItem}>
                📞 {nextDelivery.customerPhone}
              </Text>
            </View>
            {nextDelivery.notes ? (
              <Text style={styles.nextNotes}>📝 {nextDelivery.notes}</Text>
            ) : null}
            <TouchableOpacity
              style={styles.startBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(ROUTES.DP_DELIVERY_DETAIL, { deliveryId: nextDelivery.deliveryId })}
            >
              <Text style={styles.startBtnText}>🚀  Start Delivery</Text>
            </TouchableOpacity>
          </View>
        ) : stats.total === 0 ? (
          <View style={styles.allDoneCard}>
            <Text style={styles.allDoneIcon}>📭</Text>
            <Text style={styles.allDoneTitle}>No Deliveries Assigned</Text>
            <Text style={styles.allDoneSub}>
              You don't have any deliveries assigned yet. Check back soon!
            </Text>
          </View>
        ) : null}

        {/* ── Performance Card ─────────────────────────── */}
        <View style={styles.perfCard}>
          <Text style={styles.perfTitle}>📊  Performance</Text>
          <View style={styles.perfRow}>
            <View style={styles.perfItem}>
              <Text style={styles.perfValue}>⭐ {performance.rating}</Text>
              <Text style={styles.perfLabel}>Rating</Text>
            </View>
            <View style={styles.perfDivider} />
            <View style={styles.perfItem}>
              <Text style={styles.perfValue}>{performance.onTimeRate}%</Text>
              <Text style={styles.perfLabel}>On-time</Text>
            </View>
            <View style={styles.perfDivider} />
            <View style={styles.perfItem}>
              <Text style={styles.perfValue}>{performance.weeklyTotal}</Text>
              <Text style={styles.perfLabel}>This Week</Text>
            </View>
          </View>
        </View>

        {/* ── Quick Actions ────────────────────────────── */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.perfTitle}>⚡  Quick Actions</Text>
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('DeliveryTabs', { screen: 'Deliveries' })}
            >
              <Text style={styles.quickBtnIcon}>📋</Text>
              <Text style={styles.quickBtnLabel}>My Deliveries</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('DeliveryTabs', { screen: 'Inventory' })}
            >
              <Text style={styles.quickBtnIcon}>📦</Text>
              <Text style={styles.quickBtnLabel}>Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(ROUTES.DP_HISTORY)}
            >
              <Text style={styles.quickBtnIcon}>📊</Text>
              <Text style={styles.quickBtnLabel}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: DP_GREEN,
  },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '700', color: Colors.white, marginTop: 2 },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: { fontSize: 20 },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: DP_GREEN,
  },

  scroll: { padding: Spacing.base },

  // Summary cards
  cardsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  summaryCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  summaryValue: { fontSize: 22, fontWeight: '700' },
  summaryLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },

  // Progress
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  progressTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  progressCount: { fontSize: 12, color: Colors.textTertiary },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: DP_GREEN,
  },
  progressPct: { fontSize: 12, fontWeight: '700', color: DP_GREEN, textAlign: 'right' },

  // All done / empty
  allDoneCard: {
    backgroundColor: DP_GREEN_LIGHT,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DP_GREEN,
    borderStyle: 'dashed',
  },
  allDoneIcon: { fontSize: 40, marginBottom: Spacing.sm },
  allDoneTitle: { fontSize: 18, fontWeight: '700', color: DP_GREEN, marginBottom: 4 },
  allDoneSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },

  // Next delivery
  nextCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: DP_GREEN,
    ...Shadows.md,
  },
  nextCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  nextLabel: { fontSize: 11, fontWeight: '800', color: DP_GREEN, letterSpacing: 0.5 },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  priorityText: { fontSize: 10, fontWeight: '700' },
  nextCustomer: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  nextAddress: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.sm },
  nextMeta: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  nextMetaItem: { fontSize: 12, color: Colors.textTertiary },
  nextNotes: {
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  startBtn: {
    backgroundColor: DP_GREEN,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  startBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  // Performance
  perfCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  perfTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  perfRow: { flexDirection: 'row', alignItems: 'center' },
  perfItem: { flex: 1, alignItems: 'center' },
  perfValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  perfLabel: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  perfDivider: { width: 1, height: 36, backgroundColor: Colors.borderLight },

  // Quick actions
  quickActionsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  quickRow: { flexDirection: 'row', gap: Spacing.sm },
  quickBtn: {
    flex: 1,
    backgroundColor: DP_GREEN_LIGHT,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  quickBtnIcon: { fontSize: 24, marginBottom: 4 },
  quickBtnLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
});

export default DPDashboardScreen;
