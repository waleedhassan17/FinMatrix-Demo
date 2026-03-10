// ============================================================
// FINMATRIX - Delivery History Screen  (Driver-facing)
// ============================================================
// Past deliveries (delivered / failed / returned) paginated.
// Each row: Date · Customer · Items · Status · Time taken
// Filter by status and date range

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';
import { useAppSelector } from '../../../hooks/useReduxHooks';
import { Delivery, DeliveryStatus } from '../../../dummy-data/deliveries';

// ─── Theme ──────────────────────────────────────────────────
const DP_GREEN = '#27AE60';
const DP_GREEN_LIGHT = '#E8F8EF';

const PAGE_SIZE = 10;

type FilterStatus = 'all' | 'delivered' | 'failed' | 'returned';

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  delivered: { label: 'Delivered', color: DP_GREEN,       bg: DP_GREEN_LIGHT },
  failed:    { label: 'Failed',    color: Colors.danger,  bg: Colors.dangerLight },
  returned:  { label: 'Returned',  color: Colors.warning, bg: Colors.warningLight },
};

// ─── Component ──────────────────────────────────────────────
const DPHistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAppSelector((s) => s.auth);
  const currentPersonId = user?.uid || 'dp_001';
  const myDeliveries = useAppSelector((s) =>
    s.delivery.deliveries.filter((d) => d.deliveryPersonId === currentPersonId),
  );
  const isLoading = useAppSelector((s) => s.delivery.isLoading);

  const [filter, setFilter] = useState<FilterStatus>('all');
  const [pageEnd, setPageEnd] = useState(PAGE_SIZE);

  // Past deliveries only
  const completedStatuses: DeliveryStatus[] = ['delivered', 'failed', 'returned'];

  const pastDeliveries = useMemo(() => {
    const past = myDeliveries
      .filter((d) => completedStatuses.includes(d.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filter === 'all') return past;
    return past.filter((d) => d.status === filter);
  }, [myDeliveries, filter]);

  const paginatedData = useMemo(() => pastDeliveries.slice(0, pageEnd), [pastDeliveries, pageEnd]);

  const onRefresh = useCallback(() => {
    // Data pre-loaded in unified slice
  }, []);

  const loadMore = useCallback(() => {
    if (pageEnd < pastDeliveries.length) setPageEnd((p) => p + PAGE_SIZE);
  }, [pageEnd, pastDeliveries.length]);

  // ── Time helper ───────────────────────────────────
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // ── Render item ───────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: Delivery }) => {
      const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.delivered;
      const totalItems = item.items.reduce((sum, li) => sum + li.quantity, 0);

      return (
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          <Text style={styles.customerName} numberOfLines={1}>{item.customerName}</Text>

          <View style={styles.cardMeta}>
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>📦 {totalItems} item{totalItems !== 1 ? 's' : ''}</Text>
            </View>
            {item.deliveredAt && (
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>🕐 {formatTime(item.deliveredAt)}</Text>
              </View>
            )}
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>🆔 {item.deliveryId}</Text>
            </View>
          </View>

          {item.notes ? (
            <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
          ) : null}
        </View>
      );
    },
    [],
  );

  const keyExtractor = useCallback((item: Delivery) => item.deliveryId, []);

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'failed', label: 'Failed' },
    { key: 'returned', label: 'Returned' },
  ];

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: Spacing.xs }}>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery History</Text>
        <Text style={styles.headerSub}>{pastDeliveries.length} past deliveries</Text>
      </View>

      {/* ── Filters ────────────────────────────────────── */}
      <View style={styles.filterRow}>
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              activeOpacity={0.7}
              onPress={() => {
                setFilter(f.key);
                setPageEnd(PAGE_SIZE);
              }}
            >
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── List ───────────────────────────────────────── */}
      <FlatList<Delivery>
        data={paginatedData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No deliveries found</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          pageEnd < pastDeliveries.length ? (
            <Text style={styles.footerText}>Loading more…</Text>
            ) : null
          }
        />
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: DP_GREEN,
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: DP_GREEN,
    borderColor: DP_GREEN,
  },
  filterLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterLabelActive: { color: Colors.white },

  // List
  list: { padding: Spacing.base, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardDate: { fontSize: 12, color: Colors.textTertiary, fontWeight: '600' },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  customerName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  cardMeta: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  metaChip: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  metaText: { fontSize: 11, color: Colors.textSecondary },
  notes: { fontSize: 12, color: Colors.textTertiary, fontStyle: 'italic', marginTop: Spacing.xs },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.sm },
  emptyText: { fontSize: 15, color: Colors.textTertiary },

  // Footer
  footerText: { textAlign: 'center', color: Colors.textTertiary, paddingVertical: Spacing.md },
});

export default DPHistoryScreen;
