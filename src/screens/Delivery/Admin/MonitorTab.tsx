// ============================================================
// FINMATRIX - Monitor Tab (Admin Delivery)
// ============================================================
// Stats bar · Map placeholder · Filter chips · Delivery feed
// Sort by time / status / priority · Tap → detail

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../../../theme';
import { useAppSelector } from '../../../hooks/useReduxHooks';
import { Delivery, DeliveryStatus } from '../../../dummy-data/deliveries';
import { ROUTES } from '../../../navigations-map/Base';
import DeliveryMapView from '../../../components/DeliveryMapView';

// ─── Status config ──────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  unassigned: { label: 'Unassigned', color: Colors.textTertiary, bg: Colors.borderLight, icon: '📦' },
  pending:    { label: 'Pending',    color: Colors.warning,       bg: Colors.warningLight, icon: '⏳' },
  picked_up:  { label: 'Picked Up',  color: Colors.info,          bg: Colors.infoLight,    icon: '🤲' },
  in_transit:  { label: 'In Transit', color: Colors.secondary,     bg: Colors.infoLight,    icon: '🚚' },
  arrived:    { label: 'Arrived',    color: Colors.primaryLight,   bg: Colors.infoLight,    icon: '📍' },
  delivered:  { label: 'Delivered',  color: Colors.success,        bg: Colors.successLight, icon: '✅' },
  failed:     { label: 'Failed',     color: Colors.danger,         bg: Colors.dangerLight,  icon: '❌' },
  returned:   { label: 'Returned',   color: Colors.danger,         bg: Colors.dangerLight,  icon: '↩️' },
};

// ─── Filter chips ───────────────────────────────────────────
type FilterKey = 'all' | 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'all',        label: 'All' },
  { key: 'pending',    label: 'Pending' },
  { key: 'picked_up',  label: 'Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'failed',     label: 'Failed' },
];

// ─── Sort options ───────────────────────────────────────────
type SortKey = 'time' | 'status' | 'priority';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'time',     label: '🕐 Time' },
  { key: 'status',   label: '📋 Status' },
  { key: 'priority', label: '🔥 Priority' },
];

const STATUS_ORDER: Record<string, number> = {
  in_transit: 0, arrived: 1, picked_up: 2, pending: 3,
  unassigned: 4, delivered: 5, failed: 6, returned: 7,
};
const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, normal: 2 };

// ─── Helpers ────────────────────────────────────────────────
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const mon = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hr  = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${mon}/${day} ${hr}:${min}`;
};

// ─── Component ──────────────────────────────────────────────
const MonitorTab: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { deliveries, deliveryPersonnel: personnel, isLoading } = useAppSelector((s) => s.delivery);

  const [filter, setFilter] = useState<FilterKey>('all');
  const [sortBy, setSortBy] = useState<SortKey>('time');

  const onRefresh = useCallback(() => {
    // Data is pre-loaded in unified slice — no fetch needed
  }, []);

  // ── Stats ───────────────────────────────────────────
  const stats = useMemo(() => {
    const total     = deliveries.length;
    const pending   = deliveries.filter((d) => d.status === 'pending').length;
    const inTransit = deliveries.filter((d) => d.status === 'in_transit').length;
    const delivered = deliveries.filter((d) => d.status === 'delivered').length;
    const failed    = deliveries.filter((d) => d.status === 'failed').length;
    return { total, pending, inTransit, delivered, failed };
  }, [deliveries]);

  // ── Status counts ───────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    deliveries.forEach((d) => { counts[d.status] = (counts[d.status] || 0) + 1; });
    return counts;
  }, [deliveries]);

  // ── Active (in-transit) deliveries for map ─────────
  const activeDeliveries = useMemo(
    () => deliveries.filter((d) => d.status === 'in_transit'),
    [deliveries],
  );

  // ── Filtered & sorted feed ─────────────────────────
  const feed = useMemo(() => {
    let list = filter === 'all'
      ? deliveries.filter((d) => d.status !== 'unassigned')
      : deliveries.filter((d) => d.status === filter);

    if (sortBy === 'time') {
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'status') {
      list = [...list].sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));
    } else {
      list = [...list].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99));
    }
    return list;
  }, [deliveries, filter, sortBy]);

  // ── Navigate to detail ─────────────────────────────
  const openDetail = (deliveryId: string) => {
    navigation.navigate(ROUTES.ADMIN_DELIVERY_DETAIL, { deliveryId });
  };

  // ── Navigate to analytics ──────────────────────────
  const openAnalytics = () => {
    navigation.navigate(ROUTES.DELIVERY_ANALYTICS);
  };

  // ── Render delivery card ───────────────────────────
  const renderDelivery = ({ item }: { item: Delivery }) => {
    const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const totalQty = item.items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);
    return (
      <TouchableOpacity style={styles.feedCard} activeOpacity={0.7} onPress={() => openDetail(item.deliveryId)}>
        <View style={styles.feedHeader}>
          <Text style={styles.feedIcon}>{sc.icon}</Text>
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <Text style={styles.feedCustomer}>{item.customerName}</Text>
            <Text style={styles.feedAddress} numberOfLines={1}>
              {item.customerAddress.street}, {item.customerAddress.city}
            </Text>
          </View>
          <View style={[styles.priorityBadge, {
            backgroundColor: item.priority === 'urgent' ? Colors.dangerLight
              : item.priority === 'high' ? Colors.warningLight : Colors.borderLight,
          }]}>
            <Text style={[styles.priorityText, {
              color: item.priority === 'urgent' ? Colors.danger
                : item.priority === 'high' ? Colors.warning : Colors.textTertiary,
            }]}>
              {item.priority.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.feedMeta}>
          <Text style={styles.feedPerson}>
            👤 {item.deliveryPersonName || 'Unassigned'}
          </Text>
          <Text style={styles.feedItems}>📦 {item.items.length} item(s) · {totalQty} units</Text>
          <Text style={styles.feedTime}>🕐 {fmtDate(item.createdAt)}</Text>
        </View>

        <View style={styles.feedFooter}>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
          </View>
          <Text style={styles.feedArrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Header component (stats + map + filters)  ─────
  const ListHeader = () => (
    <View>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        {[
          { label: 'Total',      value: stats.total,     color: Colors.primary },
          { label: 'Pending',    value: stats.pending,   color: Colors.warning },
          { label: 'In Transit', value: stats.inTransit, color: Colors.secondary },
          { label: 'Delivered',  value: stats.delivered,  color: Colors.success },
          { label: 'Failed',     value: stats.failed,    color: Colors.danger },
        ].map((s) => (
          <View key={s.label} style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: s.color }]} />
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Live Map — Active Deliveries */}
      {activeDeliveries.length > 0 ? (
        <View style={styles.mapContainer}>
          <Text style={styles.mapContainerTitle}>🗺️  Live Tracking ({activeDeliveries.length})</Text>
          <DeliveryMapView
            origin={{
              latitude: 40.7128,
              longitude: -74.0060,
              label: 'Warehouse (NYC HQ)',
            }}
            destination={{
              latitude: activeDeliveries[0].destinationCoords.latitude,
              longitude: activeDeliveries[0].destinationCoords.longitude,
              label: `${activeDeliveries[0].customerAddress.street}, ${activeDeliveries[0].customerAddress.city}`,
            }}
            extraMarkers={activeDeliveries.map((d) => ({
              id: d.deliveryId,
              latitude: d.destinationCoords.latitude,
              longitude: d.destinationCoords.longitude,
              label: d.deliveryPersonName || 'Driver',
              subtitle: `${d.customerName} — In Transit`,
            }))}
            height={220}
          />
        </View>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapTitle}>Live Map</Text>
          <Text style={styles.mapSub}>No active deliveries to track</Text>
        </View>
      )}

      {/* Personnel Load Bars */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👥  Personnel Loads</Text>
        {personnel.map((p) => {
          const pct = Math.round((p.currentLoad / p.maxLoad) * 100);
          return (
            <View key={p.userId} style={styles.personnelRow}>
              <View style={[styles.dotSmall, { backgroundColor: p.isAvailable ? Colors.success : Colors.danger }]} />
              <Text style={styles.prName}>{p.displayName}</Text>
              <View style={styles.prBarTrack}>
                <View
                  style={[styles.prBarFill, {
                    width: `${pct}%`,
                    backgroundColor: pct >= 90 ? Colors.danger : pct >= 60 ? Colors.warning : Colors.success,
                  }]}
                />
              </View>
              <Text style={styles.prLoad}>{p.currentLoad}/{p.maxLoad}</Text>
            </View>
          );
        })}
      </View>

      {/* Analytics Link */}
      <TouchableOpacity style={styles.analyticsBtn} activeOpacity={0.7} onPress={openAnalytics}>
        <Text style={styles.analyticsIcon}>📊</Text>
        <Text style={styles.analyticsLabel}>View Delivery Analytics</Text>
        <Text style={styles.analyticsArrow}>›</Text>
      </TouchableOpacity>

      {/* Filter Chips */}
      <View style={styles.chipRow}>
        {FILTER_CHIPS.map((c) => {
          const active = filter === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(c.key)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sort Row */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {SORT_OPTIONS.map((o) => {
          const active = sortBy === o.key;
          return (
            <TouchableOpacity
              key={o.key}
              style={[styles.sortChip, active && styles.sortChipActive]}
              onPress={() => setSortBy(o.key)}
            >
              <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Feed heading */}
      <Text style={styles.feedHeading}>🚚 Delivery Feed ({feed.length})</Text>
    </View>
  );

  return (
    <FlatList<Delivery>
      data={feed}
      keyExtractor={(item) => item.deliveryId}
      renderItem={renderDelivery}
      ListHeaderComponent={ListHeader}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.emptyMini}>
          <Text style={styles.emptyMiniIcon}>📭</Text>
          <Text style={styles.emptyMiniText}>No deliveries match this filter</Text>
        </View>
      }
    />
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { padding: Spacing.base, paddingBottom: 40 },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textTertiary, marginTop: 1 },

  // Map container (live tracking)
  mapContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  mapContainerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  // Map placeholder (no active deliveries)
  mapPlaceholder: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  mapIcon: { fontSize: 36, marginBottom: Spacing.xs },
  mapTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  mapSub: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },

  // Personnel row
  personnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dotSmall: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  prName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, width: 100 },
  prBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
    marginHorizontal: Spacing.sm,
  },
  prBarFill: { height: 6, borderRadius: 3 },
  prLoad: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, width: 40, textAlign: 'right' },

  // Analytics link
  analyticsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  analyticsIcon: { fontSize: 20, marginRight: Spacing.sm },
  analyticsLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.primary },
  analyticsArrow: { fontSize: 22, color: Colors.textTertiary },

  // Filter chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },

  // Sort
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sortLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  sortChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight,
  },
  sortChipActive: { backgroundColor: Colors.primaryLight },
  sortChipText: { fontSize: 11, fontWeight: '600', color: Colors.textTertiary },
  sortChipTextActive: { color: Colors.white },

  // Feed
  feedHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  feedCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  feedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  feedIcon: { fontSize: 22 },
  feedCustomer: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  feedAddress: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  feedMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  feedPerson: { fontSize: 11, color: Colors.textSecondary },
  feedItems: { fontSize: 11, color: Colors.textSecondary },
  feedTime: { fontSize: 11, color: Colors.textTertiary },
  feedFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  feedArrow: { fontSize: 22, color: Colors.textTertiary, fontWeight: '700' },

  // Status badge
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  // Priority badge
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  priorityText: { fontSize: 10, fontWeight: '700' },

  // Empty
  emptyMini: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyMiniIcon: { fontSize: 28, marginBottom: 4 },
  emptyMiniText: { fontSize: 13, color: Colors.textTertiary },
});

export default MonitorTab;
