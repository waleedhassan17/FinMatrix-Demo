// ============================================================
// FINMATRIX - Delivery List Screen  (Driver-facing)
// ============================================================
// Sections: In Progress (in_transit/picked_up/arrived),
//           Up Next (pending), Completed (delivered, read-only)

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Platform,
  RefreshControl,
  SectionListRenderItemInfo,
  SectionListData,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import { setActiveDelivery } from '../../../store/deliverySlice';
import { Delivery, DeliveryPriority, DeliveryStatus } from '../../../dummy-data/deliveries';
import { ROUTES } from '../../../navigations-map/Base';

// ─── Theme ──────────────────────────────────────────────────
const DP_GREEN = '#27AE60';
const DP_GREEN_LIGHT = '#E8F8EF';

// ─── Priority / Status badges ───────────────────────────────
const PRIORITY_CFG: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: 'URGENT', color: Colors.danger, bg: Colors.dangerLight },
  high:   { label: 'HIGH',   color: Colors.warning, bg: Colors.warningLight },
  normal: { label: 'NORMAL', color: Colors.textTertiary, bg: Colors.borderLight },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',    color: Colors.info,          bg: Colors.infoLight },
  picked_up: { label: 'Picked Up',  color: '#8E44AD',            bg: '#F5EEF8' },
  in_transit:{ label: 'In Transit', color: Colors.warning,       bg: Colors.warningLight },
  arrived:   { label: 'Arrived',    color: DP_GREEN,             bg: DP_GREEN_LIGHT },
  delivered: { label: 'Delivered',  color: DP_GREEN,             bg: DP_GREEN_LIGHT },
  failed:    { label: 'Failed',     color: Colors.danger,        bg: Colors.dangerLight },
  returned:  { label: 'Returned',   color: Colors.textTertiary,  bg: Colors.borderLight },
};

interface Section {
  title: string;
  data: Delivery[];
}

// ─── Component ──────────────────────────────────────────────
const DPDeliveryListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const currentPersonId = user?.uid || 'dp_001';
  const myDeliveries = useAppSelector((s) =>
    s.delivery.deliveries.filter((d) => d.deliveryPersonId === currentPersonId),
  );
  const isLoading = useAppSelector((s) => s.delivery.isLoading);

  const onRefresh = useCallback(() => {
    // Data pre-loaded in unified slice
  }, []);

  // ── Sections ──────────────────────────────────────
  const sections: Section[] = useMemo(() => {
    const inProgress = myDeliveries.filter((d) =>
      ['in_transit', 'picked_up', 'arrived'].includes(d.status),
    );
    const upNext = myDeliveries.filter((d) => d.status === 'pending');
    const completed = myDeliveries.filter((d) =>
      ['delivered', 'failed', 'returned'].includes(d.status),
    );

    const result: Section[] = [];
    if (inProgress.length > 0) result.push({ title: `🚚  In Progress (${inProgress.length})`, data: inProgress });
    if (upNext.length > 0) result.push({ title: `📋  Up Next (${upNext.length})`, data: upNext });
    if (completed.length > 0) result.push({ title: `✅  Completed (${completed.length})`, data: completed });
    return result;
  }, [myDeliveries]);

  // ── Navigate to detail ────────────────────────────
  const handleTap = useCallback(
    (delivery: Delivery) => {
      dispatch(setActiveDelivery(delivery));
      navigation.navigate(ROUTES.DP_DELIVERY_DETAIL, { deliveryId: delivery.deliveryId });
    },
    [dispatch, navigation],
  );

  // ── Render card ───────────────────────────────────
  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<Delivery>) => {
      const statusCfg = STATUS_CFG[item.status] || STATUS_CFG.pending;
      const prioCfg = PRIORITY_CFG[item.priority] || PRIORITY_CFG.normal;
      const isCompleted = ['delivered', 'failed', 'returned'].includes(item.status);

      return (
        <TouchableOpacity
          style={[styles.card, isCompleted && styles.cardCompleted]}
          activeOpacity={0.7}
          onPress={() => handleTap(item)}
        >
          {/* Top row: customer + priority */}
          <View style={styles.cardTop}>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customerName}
            </Text>
            <View style={[styles.prioBadge, { backgroundColor: prioCfg.bg }]}>
              <Text style={[styles.prioText, { color: prioCfg.color }]}>{prioCfg.label}</Text>
            </View>
          </View>

          {/* Address */}
          <Text style={styles.address} numberOfLines={1}>
            📍 {item.customerAddress.street}, {item.customerAddress.city},{' '}
            {item.customerAddress.state}
          </Text>

          {/* Bottom row: items count + status badge */}
          <View style={styles.cardBottom}>
            <Text style={styles.itemsCount}>
              📦 {item.items.length} item{item.items.length !== 1 ? 's' : ''} ·{' '}
              {item.items.reduce((s, i) => s + i.quantity, 0)} units
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[styles.statusText, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
          </View>

          {/* Notes preview */}
          {item.notes ? (
            <Text style={styles.notesPreview} numberOfLines={1}>
              📝 {item.notes}
            </Text>
          ) : null}
        </TouchableOpacity>
      );
    },
    [handleTap],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<Delivery, Section> }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: Delivery) => item.deliveryId, []);

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyTitle}>No Deliveries</Text>
        <Text style={styles.emptySub}>
          You don't have any deliveries assigned yet.
        </Text>
      </View>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Deliveries</Text>
        <Text style={styles.headerCount}>
          {myDeliveries.length} total
        </Text>
      </View>

      <SectionList<Delivery, Section>
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
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
    paddingBottom: Spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.white },
  headerCount: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  list: { padding: Spacing.base, paddingBottom: 40 },

  // Section
  sectionHeader: { marginTop: Spacing.md, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: DP_GREEN,
    ...Shadows.sm,
  },
  cardCompleted: {
    borderLeftColor: Colors.border,
    opacity: 0.75,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  prioBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  prioText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  address: { fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 16 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsCount: { fontSize: 12, color: Colors.textTertiary },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  notesPreview: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});

export default DPDeliveryListScreen;
