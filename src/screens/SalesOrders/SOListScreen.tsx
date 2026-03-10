// ============================================================
// FINMATRIX - Sales Order List Screen
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
import { fetchSalesOrders, setSOFilter, setSOSearch } from './soSlice';
import { SalesOrder, SOStatus } from '../../dummy-data/salesOrders';
import { ROUTES } from '../../navigations-map/Base';

const STATUS_COLOR: Record<SOStatus, string> = {
  open: Colors.info,
  partially_fulfilled: Colors.warning,
  fulfilled: Colors.success,
  closed: Colors.textTertiary,
};
const STATUS_BG: Record<SOStatus, string> = {
  open: Colors.infoLight,
  partially_fulfilled: Colors.warningLight,
  fulfilled: Colors.successLight,
  closed: Colors.background,
};
const STATUS_LABEL: Record<SOStatus, string> = {
  open: 'Open',
  partially_fulfilled: 'Partial',
  fulfilled: 'Fulfilled',
  closed: 'Closed',
};

const fmt = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'partially_fulfilled', label: 'Partial' },
  { key: 'fulfilled', label: 'Fulfilled' },
  { key: 'closed', label: 'Closed' },
];

const TabChip: React.FC<{ tab: { key: string; label: string }; count: number; isSelected: boolean; onPress: () => void }> = ({ tab, count, isSelected, onPress }) => (
  <TouchableOpacity style={[styles.tab, isSelected && styles.tabActive]} onPress={onPress} activeOpacity={0.7}>
    <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>{tab.label}</Text>
    <View style={[styles.tabBadge, isSelected && styles.tabBadgeActive]}>
      <Text style={[styles.tabBadgeText, isSelected && styles.tabBadgeTextActive]}>{count}</Text>
    </View>
  </TouchableOpacity>
);

const SOCard: React.FC<{ so: SalesOrder; onPress: () => void }> = React.memo(({ so, onPress }) => {
  const fulfilledPct = useMemo(() => {
    const totalOrdered = so.lines.reduce((s, l) => s + l.quantityOrdered, 0);
    const totalFulfilled = so.lines.reduce((s, l) => s + l.quantityFulfilled, 0);
    return totalOrdered > 0 ? Math.round((totalFulfilled / totalOrdered) * 100) : 0;
  }, [so.lines]);

  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: STATUS_COLOR[so.status] }]} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.cardTop}>
        <Text style={styles.cardNumber}>{so.soNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[so.status] }]}>
          <Text style={[styles.statusBadgeText, { color: STATUS_COLOR[so.status] }]}>{STATUS_LABEL[so.status]}</Text>
        </View>
      </View>
      <Text style={styles.cardCustomer}>{so.customerName}</Text>
      <View style={styles.cardDatesRow}>
        <Text style={styles.cardDate}>Date: {fmtDate(so.date)}</Text>
        <Text style={styles.cardDate}>Expected: {fmtDate(so.expectedDate)}</Text>
      </View>
      {/* Fulfillment bar */}
      <View style={styles.fulfillBar}>
        <View style={styles.fulfillTrack}>
          <View style={[styles.fulfillFill, { width: `${fulfilledPct}%` as any, backgroundColor: STATUS_COLOR[so.status] }]} />
        </View>
        <Text style={styles.fulfillPct}>{fulfilledPct}%</Text>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardTotal}>{fmt(so.total)}</Text>
      </View>
    </TouchableOpacity>
  );
});

const EmptyState: React.FC = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>📦</Text>
    <Text style={styles.emptyTitle}>No Sales Orders Found</Text>
    <Text style={styles.emptySubtitle}>Tap "+ New" to create your first sales order</Text>
  </View>
);

const SOListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { salesOrders: all, filteredSalesOrders, statusFilter, searchQuery, isLoading } = useAppSelector((s) => s.salesOrders);

  useEffect(() => { dispatch(fetchSalesOrders()); }, [dispatch]);
  const onRefresh = useCallback(() => { dispatch(fetchSalesOrders()); }, [dispatch]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: all.length };
    FILTER_TABS.forEach((t) => { if (t.key !== 'all') m[t.key] = all.filter((s) => s.status === t.key).length; });
    return m;
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Orders</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate(ROUTES.SO_FORM)} activeOpacity={0.7}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(t) => dispatch(setSOSearch(t))}
          placeholder="Search by number or customer..."
          placeholderTextColor={Colors.placeholder}
        />
      </View>

      <View style={styles.tabRow}>
        {FILTER_TABS.map((tab) => (
          <TabChip key={tab.key} tab={tab} count={counts[tab.key] ?? 0} isSelected={statusFilter === tab.key} onPress={() => dispatch(setSOFilter(tab.key as any))} />
        ))}
      </View>

      <FlatList
        data={filteredSalesOrders}
        keyExtractor={(item) => item.salesOrderId}
        renderItem={({ item }) => (
          <SOCard so={item} onPress={() => navigation.navigate(ROUTES.SO_DETAIL, { salesOrderId: item.salesOrderId })} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: SAFE_TOP_PADDING, paddingBottom: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { fontSize: 24, fontWeight: '300', color: Colors.textPrimary, marginTop: -2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  newBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, backgroundColor: Colors.primary },
  newBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  searchContainer: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInput: { height: 40, backgroundColor: Colors.background, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, fontSize: 14, color: Colors.textPrimary },
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
  fulfillBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 8 },
  fulfillTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight, overflow: 'hidden' },
  fulfillFill: { height: 4, borderRadius: 2 },
  fulfillPct: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, width: 32, textAlign: 'right' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 8 },
  cardTotal: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});

export default SOListScreen;
