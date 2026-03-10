// ============================================================
// FINMATRIX - Delivery Analytics Screen
// ============================================================
// Stats cards · Success-rate gauge · Avg delivery time ·
// Top 3 performers · Failed reasons breakdown

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';
import { useAppSelector } from '../../../hooks/useReduxHooks';

// ─── Component ──────────────────────────────────────────────
const DeliveryAnalyticsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { deliveries, deliveryPersonnel: personnel } = useAppSelector((s) => s.delivery);

  // ── Aggregate stats ───────────────────────────────
  const stats = useMemo(() => {
    const total     = deliveries.length;
    const delivered = deliveries.filter((d) => d.status === 'delivered').length;
    const failed    = deliveries.filter((d) => d.status === 'failed').length;
    const returned  = deliveries.filter((d) => d.status === 'returned').length;
    const inTransit = deliveries.filter((d) => d.status === 'in_transit').length;
    const pending   = deliveries.filter((d) => d.status === 'pending').length;
    const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    return { total, delivered, failed, returned, inTransit, pending, successRate };
  }, [deliveries]);

  // ── Average delivery time (mock: hours between createdAt and deliveredAt) ──
  const avgDeliveryTime = useMemo(() => {
    const completedDeliveries = deliveries.filter((d) => d.status === 'delivered' && d.deliveredAt);
    if (completedDeliveries.length === 0) return '—';
    const totalHours = completedDeliveries.reduce((sum, d) => {
      const created   = new Date(d.createdAt).getTime();
      const delivered = new Date(d.deliveredAt!).getTime();
      return sum + (delivered - created) / (1000 * 60 * 60);
    }, 0);
    const avg = totalHours / completedDeliveries.length;
    if (avg < 1) return `${Math.round(avg * 60)} min`;
    return `${avg.toFixed(1)} hrs`;
  }, [deliveries]);

  // ── Top performers ────────────────────────────────
  const topPerformers = useMemo(() => {
    return [...personnel]
      .sort((a, b) => {
        // Sort by rating desc, then total deliveries desc
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.totalDeliveries - a.totalDeliveries;
      })
      .slice(0, 3);
  }, [personnel]);

  // ── Failed reasons (mock breakdown) ───────────────
  const failureReasons = useMemo(() => {
    const failedDeliveries = deliveries.filter((d) => d.status === 'failed' || d.status === 'returned');
    if (failedDeliveries.length === 0) return [];
    // Mock reasons derived from notes
    const reasons: Record<string, number> = {};
    failedDeliveries.forEach((d) => {
      const reason = d.notes
        ? (d.notes.toLowerCase().includes('refused') ? 'Customer Refused'
          : d.notes.toLowerCase().includes('address') ? 'Wrong Address'
          : d.notes.toLowerCase().includes('damage') ? 'Damaged Goods'
          : 'Other')
        : 'Unknown';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });
    return Object.entries(reasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  }, [deliveries]);

  // ── Delivery volume by status ─────────────────────
  const statusBreakdown = useMemo(() => {
    const map: Record<string, { label: string; count: number; color: string }> = {
      unassigned: { label: 'Unassigned', count: 0, color: Colors.textTertiary },
      pending:    { label: 'Pending',    count: 0, color: Colors.warning },
      picked_up:  { label: 'Picked Up',  count: 0, color: Colors.info },
      in_transit:  { label: 'In Transit', count: 0, color: Colors.secondary },
      arrived:    { label: 'Arrived',    count: 0, color: Colors.primaryLight },
      delivered:  { label: 'Delivered',  count: 0, color: Colors.success },
      failed:     { label: 'Failed',     count: 0, color: Colors.danger },
      returned:   { label: 'Returned',   count: 0, color: Colors.danger },
    };
    deliveries.forEach((d) => {
      if (map[d.status]) map[d.status].count++;
    });
    return Object.values(map);
  }, [deliveries]);

  // ── Gauge helper ──────────────────────────────────
  const gaugeColor =
    stats.successRate >= 80 ? Colors.success
      : stats.successRate >= 50 ? Colors.warning
      : Colors.danger;

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Analytics</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Stats Cards ──────────────────────────────── */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total',      value: stats.total,     color: Colors.primary,   bg: Colors.infoLight },
            { label: 'Delivered',   value: stats.delivered,  color: Colors.success,   bg: Colors.successLight },
            { label: 'In Transit',  value: stats.inTransit, color: Colors.secondary,  bg: Colors.infoLight },
            { label: 'Failed',      value: stats.failed,    color: Colors.danger,    bg: Colors.dangerLight },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <Text style={[styles.statCardValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statCardLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Success Rate Gauge ───────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯  Success Rate</Text>
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeTrack}>
              <View style={[styles.gaugeFill, { width: `${stats.successRate}%`, backgroundColor: gaugeColor }]} />
            </View>
            <Text style={[styles.gaugeValue, { color: gaugeColor }]}>{stats.successRate}%</Text>
          </View>
          <View style={styles.gaugeLabels}>
            <Text style={styles.gaugeLabel}>{stats.delivered} delivered</Text>
            <Text style={styles.gaugeLabel}>{stats.total} total</Text>
          </View>
          <View style={styles.gaugeLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.legendText}>≥80% Excellent</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.legendText}>50-79% Fair</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
              <Text style={styles.legendText}>&lt;50% Poor</Text>
            </View>
          </View>
        </View>

        {/* ── Average Delivery Time ────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⏱️  Average Delivery Time</Text>
          <View style={styles.bigStatContainer}>
            <Text style={styles.bigStatValue}>{avgDeliveryTime}</Text>
            <Text style={styles.bigStatSub}>across {deliveries.filter((d) => d.status === 'delivered').length} completed deliveries</Text>
          </View>
        </View>

        {/* ── Status Breakdown ─────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊  Status Breakdown</Text>
          {statusBreakdown.map((s) => {
            const pct = stats.total > 0 ? Math.round((s.count / stats.total) * 100) : 0;
            return (
              <View key={s.label} style={styles.breakdownRow}>
                <View style={[styles.breakdownDot, { backgroundColor: s.color }]} />
                <Text style={styles.breakdownLabel}>{s.label}</Text>
                <View style={styles.breakdownBarTrack}>
                  <View style={[styles.breakdownBarFill, { width: `${pct}%`, backgroundColor: s.color }]} />
                </View>
                <Text style={styles.breakdownCount}>{s.count}</Text>
                <Text style={styles.breakdownPct}>{pct}%</Text>
              </View>
            );
          })}
        </View>

        {/* ── Top 3 Performers ─────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏆  Top Performers</Text>
          {topPerformers.map((p, idx) => {
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <View key={p.userId} style={styles.performerRow}>
                <Text style={styles.performerMedal}>{medals[idx] || ''}</Text>
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={styles.performerName}>{p.displayName}</Text>
                  <Text style={styles.performerStats}>
                    {p.totalDeliveries} deliveries · {p.currentLoad}/{p.maxLoad} load
                  </Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {p.rating}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Failed Reasons ───────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚠️  Failure Reasons</Text>
          {failureReasons.length === 0 ? (
            <View style={styles.emptyMini}>
              <Text style={styles.emptyMiniIcon}>🎉</Text>
              <Text style={styles.emptyMiniText}>No failures recorded</Text>
            </View>
          ) : (
            failureReasons.map((r, idx) => {
              const total = failureReasons.reduce((s, x) => s + x.count, 0);
              const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
              return (
                <View key={r.reason} style={styles.failRow}>
                  <Text style={styles.failReason}>{r.reason}</Text>
                  <View style={styles.failBarTrack}>
                    <View style={[styles.failBarFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.failCount}>{r.count}</Text>
                  <Text style={styles.failPct}>{pct}%</Text>
                </View>
              );
            })
          )}
        </View>

        {/* ── Personnel Overview ───────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥  Personnel Overview</Text>
          {personnel.map((p) => {
            const pct = Math.round((p.currentLoad / p.maxLoad) * 100);
            return (
              <View key={p.userId} style={styles.personnelRow}>
                <View style={[styles.availDot, { backgroundColor: p.isAvailable ? Colors.success : Colors.danger }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pName}>{p.displayName}</Text>
                  <View style={styles.pBarTrack}>
                    <View
                      style={[styles.pBarFill, {
                        width: `${pct}%`,
                        backgroundColor: pct >= 90 ? Colors.danger : pct >= 60 ? Colors.warning : Colors.success,
                      }]}
                    />
                  </View>
                </View>
                <Text style={styles.pLoad}>{p.currentLoad}/{p.maxLoad}</Text>
                <Text style={styles.pRating}>⭐{p.rating}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  backBtn: { fontSize: 15, color: Colors.primary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: Spacing.base },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    alignItems: 'center',
  },
  statCardValue: { fontSize: 28, fontWeight: '700' },
  statCardLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },

  // Gauge
  gaugeContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  gaugeTrack: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  gaugeFill: { height: 14, borderRadius: 7 },
  gaugeValue: { fontSize: 24, fontWeight: '700', width: 60, textAlign: 'right' },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  gaugeLabel: { fontSize: 11, color: Colors.textTertiary },
  gaugeLegend: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: Colors.textTertiary },

  // Big stat
  bigStatContainer: { alignItems: 'center', paddingVertical: Spacing.md },
  bigStatValue: { fontSize: 36, fontWeight: '700', color: Colors.primary },
  bigStatSub: { fontSize: 12, color: Colors.textTertiary, marginTop: 4 },

  // Status breakdown
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  breakdownDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  breakdownLabel: { fontSize: 12, color: Colors.textSecondary, width: 76 },
  breakdownBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
    marginHorizontal: Spacing.sm,
  },
  breakdownBarFill: { height: 8, borderRadius: 4 },
  breakdownCount: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, width: 24, textAlign: 'right' },
  breakdownPct: { fontSize: 10, color: Colors.textTertiary, width: 32, textAlign: 'right' },

  // Top performers
  performerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  performerMedal: { fontSize: 22 },
  performerName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  performerStats: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  ratingBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  ratingText: { fontSize: 12, fontWeight: '700', color: Colors.warning },

  // Failure reasons
  failRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  failReason: { fontSize: 12, color: Colors.textSecondary, width: 110 },
  failBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
    marginHorizontal: Spacing.sm,
  },
  failBarFill: { height: 8, borderRadius: 4, backgroundColor: Colors.danger },
  failCount: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, width: 20, textAlign: 'right' },
  failPct: { fontSize: 10, color: Colors.textTertiary, width: 32, textAlign: 'right' },

  // Personnel overview
  personnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  availDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  pName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3 },
  pBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  pBarFill: { height: 5, borderRadius: 3 },
  pLoad: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, width: 38, textAlign: 'right', marginLeft: Spacing.sm },
  pRating: { fontSize: 11, color: Colors.warning, width: 36, textAlign: 'right' },

  // Empty
  emptyMini: { alignItems: 'center', paddingVertical: Spacing.lg },
  emptyMiniIcon: { fontSize: 28, marginBottom: 4 },
  emptyMiniText: { fontSize: 13, color: Colors.textTertiary },
});

export default DeliveryAnalyticsScreen;
