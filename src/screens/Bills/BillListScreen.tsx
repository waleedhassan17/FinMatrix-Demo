// ============================================================
// FINMATRIX - Bill List Screen
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import {
  fetchBills,
  setFilter,
  setSearchQuery,
  StatusFilter,
} from './billSlice';
import { Bill, BillStatus } from '../../dummy-data/bills';

/* ── Status styling maps ─────────────────────────────────── */
const STATUS_COLOR: Record<BillStatus, string> = {
  draft: Colors.textSecondary,
  open: Colors.info,
  partially_paid: Colors.warning,
  paid: Colors.success,
  overdue: Colors.danger,
};

const STATUS_BG: Record<BillStatus, string> = {
  draft: Colors.background,
  open: Colors.infoLight,
  partially_paid: Colors.warningLight,
  paid: Colors.successLight,
  overdue: Colors.dangerLight,
};

const STATUS_LABEL: Record<BillStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  partially_paid: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
};

/* ── Filter tabs ─────────────────────────────────────────── */
const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'open', label: 'Open' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
];

/* ================================================================
   COMPONENT
   ================================================================ */
const BillListScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { filteredBills, bills, statusFilter, isLoading } = useAppSelector(
    (s) => s.bills,
  );
  const [refreshing, setRefreshing] = useState(false);

  /* ── load ─────────────────────────────────────────────── */
  useEffect(() => {
    dispatch(fetchBills());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchBills());
    setRefreshing(false);
  }, [dispatch]);

  /* ── counts per tab ──────────────────────────────────── */
  const tabCounts = useMemo(() => {
    const map: Record<string, number> = { all: bills.length };
    for (const b of bills) map[b.status] = (map[b.status] || 0) + 1;
    return map;
  }, [bills]);

  /* ── summary (outstanding + overdue) ─────────────────── */
  const { outstanding, overdue } = useMemo(() => {
    let out = 0;
    let ov = 0;
    for (const b of bills) {
      const remaining = b.total - b.amountPaid;
      if (['open', 'partially_paid', 'overdue'].includes(b.status)) out += remaining;
      if (b.status === 'overdue') ov += remaining;
    }
    return {
      outstanding: out.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      overdue: ov.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    };
  }, [bills]);

  /* ── format helper ───────────────────────────────────── */
  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  /* ── TAB CHIP ────────────────────────────────────────── */
  const TabChip: React.FC<{
    tab: (typeof FILTER_TABS)[number];
    active: boolean;
  }> = ({ tab, active }) => (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={() => dispatch(setFilter(tab.key))}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {tab.label}
      </Text>
      <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
        <Text style={[styles.chipBadgeText, active && styles.chipBadgeTextActive]}>
          {tabCounts[tab.key] ?? 0}
        </Text>
      </View>
    </TouchableOpacity>
  );

  /* ── BILL CARD ───────────────────────────────────────── */
  const BillCard: React.FC<{ item: Bill }> = ({ item }) => {
    const remaining = item.total - item.amountPaid;
    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: STATUS_COLOR[item.status] }]}
        activeOpacity={0.7}
        onPress={() =>
          nav.navigate(ROUTES.BILL_DETAIL, { billId: item.billId })
        }
      >
        {/* Row 1 : bill# + status */}
        <View style={styles.cardTopRow}>
          <Text style={styles.cardNumber}>{item.billNumber}</Text>
          <View
            style={[styles.statusBadge, { backgroundColor: STATUS_BG[item.status] }]}
          >
            <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
              {STATUS_LABEL[item.status]}
            </Text>
          </View>
        </View>

        {/* Vendor */}
        <Text style={styles.cardVendor}>{item.vendorName}</Text>

        {/* Row 2 : dates */}
        <View style={styles.cardDatesRow}>
          <Text style={styles.cardDate}>Date: {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          <Text style={styles.cardDate}>Due: {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
        </View>

        {/* Row 3 : amounts */}
        <View style={styles.cardAmountRow}>
          <Text style={styles.cardTotal}>Total: {fmt(item.total)}</Text>
          {remaining > 0 && remaining < item.total && (
            <Text style={[styles.cardRemaining, { color: Colors.danger }]}>
              Due: {fmt(remaining)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  /* ── HEADER ──────────────────────────────────────────── */
  const ListHeader = () => (
    <>
      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Outstanding</Text>
          <Text style={[styles.summaryValue, { color: Colors.info }]}>
            {outstanding}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Overdue</Text>
          <Text style={[styles.summaryValue, { color: Colors.danger }]}>
            {overdue}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search bill # or vendor..."
          placeholderTextColor={Colors.textSecondary}
          onChangeText={(t) => dispatch(setSearchQuery(t))}
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.tabRow}>
        {FILTER_TABS.map((tab) => (
          <TabChip key={tab.key} tab={tab} active={statusFilter === tab.key} />
        ))}
      </View>
    </>
  );

  /* ── LOADING ─────────────────────────────────────────── */
  if (isLoading && bills.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  /* ── RENDER ──────────────────────────────────────────── */
  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bills</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => nav.navigate(ROUTES.BILL_FORM)}
        >
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredBills}
        keyExtractor={(item) => item.billId}
        renderItem={({ item }) => <BillCard item={item} />}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No bills found</Text>
            <Text style={styles.emptySubtitle}>
              {statusFilter !== 'all'
                ? 'Try a different filter or create a new bill.'
                : 'Tap "+ New" to create your first bill.'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default BillListScreen;

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 100 },

  /* top bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.primary,
  },
  backBtn: { padding: Spacing.xs },
  backText: { color: '#fff', fontSize: 22 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  newBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  newBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },

  /* summary */
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.sm },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700' },

  /* search */
  searchRow: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  /* tabs */
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  chipBadge: {
    marginLeft: 6,
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  chipBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  chipBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  chipBadgeTextActive: { color: '#fff' },

  /* card */
  card: {
    backgroundColor: '#fff',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardNumber: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardVendor: { fontSize: 14, color: Colors.textPrimary, marginBottom: 6 },
  cardDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardDate: { fontSize: 12, color: Colors.textSecondary },
  cardAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTotal: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  cardRemaining: { fontSize: 13, fontWeight: '600' },

  /* empty */
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: Spacing.lg },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
