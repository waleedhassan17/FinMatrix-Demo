// ============================================================
// FINMATRIX - Purchase Order List Screen
// ============================================================
import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import {
  fetchPurchaseOrders,
  setPOFilter,
  setPOSearch,
  POStatusFilter,
} from './poSlice';
import { PurchaseOrder, POStatus } from '../../dummy-data/purchaseOrders';
import { ROUTES } from '../../navigations-map/Base';

/* ── Status styling maps ─────────────────────────────────── */
const STATUS_COLOR: Record<POStatus, string> = {
  draft: Colors.textSecondary,
  sent: Colors.info,
  partially_received: Colors.warning,
  fully_received: Colors.success,
  closed: Colors.textTertiary,
};

const STATUS_BG: Record<POStatus, string> = {
  draft: Colors.background,
  sent: Colors.infoLight,
  partially_received: Colors.warningLight,
  fully_received: Colors.successLight,
  closed: Colors.background,
};

const STATUS_LABEL: Record<POStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  partially_received: 'Partial',
  fully_received: 'Received',
  closed: 'Closed',
};

/* ── Filter tabs ─────────────────────────────────────────── */
const FILTER_TABS: { key: POStatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'partially_received', label: 'Partial' },
  { key: 'fully_received', label: 'Received' },
  { key: 'closed', label: 'Closed' },
];

const fmt = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

/* ── Tab Chip ────────────────────────────────────────────── */
const TabChip: React.FC<{
  tab: { key: string; label: string };
  count: number;
  isSelected: boolean;
  onPress: () => void;
}> = ({ tab, count, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.tab, isSelected && styles.tabActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
      {tab.label}
    </Text>
    <View style={[styles.tabBadge, isSelected && styles.tabBadgeActive]}>
      <Text
        style={[styles.tabBadgeText, isSelected && styles.tabBadgeTextActive]}
      >
        {count}
      </Text>
    </View>
  </TouchableOpacity>
);

/* ── PO Card ─────────────────────────────────────────────── */
const POCard: React.FC<{ po: PurchaseOrder; onPress: () => void }> = React.memo(
  ({ po, onPress }) => {
    const receivedPct = useMemo(() => {
      const totalOrdered = po.lines.reduce((s, l) => s + l.quantity, 0);
      const totalReceived = po.lines.reduce(
        (s, l) => s + l.receivedQuantity,
        0,
      );
      return totalOrdered > 0
        ? Math.round((totalReceived / totalOrdered) * 100)
        : 0;
    }, [po.lines]);

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: STATUS_COLOR[po.status] }]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardNumber}>{po.poNumber}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_BG[po.status] },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: STATUS_COLOR[po.status] },
              ]}
            >
              {STATUS_LABEL[po.status]}
            </Text>
          </View>
        </View>
        <Text style={styles.cardVendor}>{po.vendorName}</Text>
        <View style={styles.cardDatesRow}>
          <Text style={styles.cardDate}>Date: {fmtDate(po.date)}</Text>
          <Text style={styles.cardDate}>
            Expected: {fmtDate(po.expectedDate)}
          </Text>
        </View>

        {/* Receiving progress bar */}
        {po.status !== 'draft' && (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${receivedPct}%` as any,
                    backgroundColor: STATUS_COLOR[po.status],
                  },
                ]}
              />
            </View>
            <Text style={styles.progressPct}>{receivedPct}%</Text>
          </View>
        )}

        <View style={styles.cardBottom}>
          <Text style={styles.cardItems}>
            {po.lines.length} item{po.lines.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.cardTotal}>{fmt(po.total)}</Text>
        </View>
      </TouchableOpacity>
    );
  },
);

/* ── Empty State ─────────────────────────────────────────── */
const EmptyState: React.FC = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>📦</Text>
    <Text style={styles.emptyTitle}>No Purchase Orders Found</Text>
    <Text style={styles.emptySubtitle}>
      Tap "+ New" to create your first purchase order
    </Text>
  </View>
);

/* ================================================================
   COMPONENT
   ================================================================ */
const POListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const {
    purchaseOrders: all,
    filteredPurchaseOrders,
    statusFilter,
    searchQuery,
    isLoading,
  } = useAppSelector((s) => s.purchaseOrders);

  useEffect(() => {
    dispatch(fetchPurchaseOrders());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchPurchaseOrders());
  }, [dispatch]);

  /* ── counts per tab ──────────────────────────────────── */
  const counts = useMemo(() => {
    const m: Record<string, number> = { all: all.length };
    FILTER_TABS.forEach((t) => {
      if (t.key !== 'all')
        m[t.key] = all.filter((p) => p.status === t.key).length;
    });
    return m;
  }, [all]);

  /* ── summary ─────────────────────────────────────────── */
  const { openTotal, pendingReceive } = useMemo(() => {
    let open = 0;
    let pending = 0;
    for (const p of all) {
      if (['sent', 'partially_received'].includes(p.status)) open += p.total;
      if (p.status === 'partially_received') pending++;
    }
    return {
      openTotal: '$' + open.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      pendingReceive: pending,
    };
  }, [all]);

  if (isLoading && all.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase Orders</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate(ROUTES.PO_FORM)}
          activeOpacity={0.7}
        >
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Open POs</Text>
          <Text style={[styles.summaryValue, { color: Colors.info }]}>
            {openTotal}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Pending Receive</Text>
          <Text style={[styles.summaryValue, { color: Colors.warning }]}>
            {pendingReceive}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(t) => dispatch(setPOSearch(t))}
          placeholder="Search by PO # or vendor..."
          placeholderTextColor={Colors.placeholder}
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.tabRow}>
        {FILTER_TABS.map((tab) => (
          <TabChip
            key={tab.key}
            tab={tab}
            count={counts[tab.key] ?? 0}
            isSelected={statusFilter === tab.key}
            onPress={() => dispatch(setPOFilter(tab.key as POStatusFilter))}
          />
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredPurchaseOrders}
        keyExtractor={(item) => item.poId}
        renderItem={({ item }) => (
          <POCard
            po={item}
            onPress={() =>
              navigation.navigate(ROUTES.PO_DETAIL, { poId: item.poId })
            }
          />
        )}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />
    </View>
  );
};

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 24,
    fontWeight: '300',
    color: Colors.textPrimary,
    marginTop: -2,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  newBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
  },
  newBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },

  /* Summary */
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textTertiary, fontWeight: '600', marginBottom: 2 },
  summaryValue: { fontSize: 18, fontWeight: '800' },
  summaryDivider: { width: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.md },

  /* Search */
  searchContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchInput: {
    height: 40,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  /* Tabs */
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  tabBadgeTextActive: { color: Colors.white },

  /* List */
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: 40,
  },

  /* Card */
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: Colors.border,
    ...Shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardNumber: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cardVendor: { fontSize: 14, color: Colors.textSecondary, marginBottom: 6 },
  cardDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardDate: { fontSize: 12, color: Colors.textTertiary },

  /* Progress bar */
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2 },
  progressPct: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    width: 32,
    textAlign: 'right',
  },

  /* Card bottom */
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 8,
  },
  cardItems: { fontSize: 12, color: Colors.textTertiary },
  cardTotal: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },

  /* Empty */
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default POListScreen;
