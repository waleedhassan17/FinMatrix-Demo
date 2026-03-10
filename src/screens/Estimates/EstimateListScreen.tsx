// ============================================================
// FINMATRIX - Estimate List Screen
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
import { fetchEstimates, setEstimateFilter, setEstimateSearch } from './estimateSlice';
import { Estimate, EstimateStatus } from '../../dummy-data/estimates';
import { ROUTES } from '../../navigations-map/Base';

// ─── Status Maps ────────────────────────────────────────────

const STATUS_COLOR: Record<EstimateStatus, string> = {
  draft: Colors.textTertiary,
  sent: Colors.info,
  accepted: Colors.success,
  declined: Colors.danger,
  expired: Colors.textDisabled,
};

const STATUS_BG: Record<EstimateStatus, string> = {
  draft: Colors.background,
  sent: Colors.infoLight,
  accepted: Colors.successLight,
  declined: Colors.dangerLight,
  expired: Colors.background,
};

const STATUS_LABEL: Record<EstimateStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
};

const fmt = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ─── Filter Tabs ────────────────────────────────────────────
const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'declined', label: 'Declined' },
  { key: 'expired', label: 'Expired' },
];

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
      <Text style={[styles.tabBadgeText, isSelected && styles.tabBadgeTextActive]}>
        {count}
      </Text>
    </View>
  </TouchableOpacity>
);

// ─── Estimate Card ──────────────────────────────────────────

const EstimateCard: React.FC<{
  estimate: Estimate;
  onPress: () => void;
}> = React.memo(({ estimate, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { borderLeftColor: STATUS_COLOR[estimate.status] }]}
    activeOpacity={0.7}
    onPress={onPress}
  >
    <View style={styles.cardTop}>
      <Text style={styles.cardNumber}>{estimate.estimateNumber}</Text>
      <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[estimate.status] }]}>
        <Text style={[styles.statusBadgeText, { color: STATUS_COLOR[estimate.status] }]}>
          {STATUS_LABEL[estimate.status]}
        </Text>
      </View>
    </View>
    <Text style={styles.cardCustomer}>{estimate.customerName}</Text>
    <View style={styles.cardDatesRow}>
      <Text style={styles.cardDate}>Date: {fmtDate(estimate.date)}</Text>
      <Text style={styles.cardDate}>Expires: {fmtDate(estimate.expirationDate)}</Text>
    </View>
    <View style={styles.cardBottom}>
      <Text style={styles.cardTotal}>{fmt(estimate.total)}</Text>
    </View>
  </TouchableOpacity>
));

// ─── Empty State ────────────────────────────────────────────
const EmptyState: React.FC = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>📋</Text>
    <Text style={styles.emptyTitle}>No Estimates Found</Text>
    <Text style={styles.emptySubtitle}>Tap "+ New" to create your first estimate</Text>
  </View>
);

// ─── Main Component ─────────────────────────────────────────
const EstimateListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const {
    estimates: all,
    filteredEstimates,
    statusFilter,
    searchQuery,
    isLoading,
  } = useAppSelector((s) => s.estimates);

  useEffect(() => { dispatch(fetchEstimates()); }, [dispatch]);
  const onRefresh = useCallback(() => { dispatch(fetchEstimates()); }, [dispatch]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: all.length };
    FILTER_TABS.forEach((t) => {
      if (t.key !== 'all') m[t.key] = all.filter((e) => e.status === t.key).length;
    });
    return m;
  }, [all]);

  const totalValue = useMemo(
    () => all.filter((e) => e.status === 'sent').reduce((s, e) => s + e.total, 0),
    [all],
  );

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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estimates</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate(ROUTES.ESTIMATE_FORM)}
          activeOpacity={0.7}
        >
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(t) => dispatch(setEstimateSearch(t))}
          placeholder="Search by number or customer..."
          placeholderTextColor={Colors.placeholder}
        />
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          Pending: <Text style={styles.summaryAmount}>{fmt(totalValue)}</Text>
        </Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabRow}>
        {FILTER_TABS.map((tab) => (
          <TabChip
            key={tab.key}
            tab={tab}
            count={counts[tab.key] ?? 0}
            isSelected={statusFilter === tab.key}
            onPress={() => dispatch(setEstimateFilter(tab.key as any))}
          />
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredEstimates}
        keyExtractor={(item) => item.estimateId}
        renderItem={({ item }) => (
          <EstimateCard
            estimate={item}
            onPress={() => navigation.navigate(ROUTES.ESTIMATE_DETAIL, { estimateId: item.estimateId })}
          />
        )}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingTop: SAFE_TOP_PADDING, paddingBottom: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { fontSize: 24, fontWeight: '300', color: Colors.textPrimary, marginTop: -2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  newBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: Colors.primary },
  newBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  searchContainer: {
    paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchInput: { height: 40, backgroundColor: Colors.background, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, fontSize: 14, color: Colors.textPrimary },
  summaryBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base, backgroundColor: Colors.primary + '08' },
  summaryText: { fontSize: 13, color: Colors.textSecondary },
  summaryAmount: { fontWeight: '700', color: Colors.textPrimary },
  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.xs, flexWrap: 'wrap' },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  tabBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  tabBadgeTextActive: { color: Colors.white },
  listContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: 40 },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.base, borderLeftWidth: 3, borderLeftColor: Colors.border, ...Shadows.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardNumber: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  statusBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardCustomer: { fontSize: 14, color: Colors.textSecondary, marginBottom: 6 },
  cardDatesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardDate: { fontSize: 12, color: Colors.textTertiary },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 8 },
  cardTotal: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});

export default EstimateListScreen;
