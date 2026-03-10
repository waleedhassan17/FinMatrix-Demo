// ============================================================
// FINMATRIX - Credit Memo List Screen
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
import { fetchCreditMemos, setCMFilter, setCMSearch } from './creditMemoSlice';
import { CreditMemo, CreditMemoStatus } from '../../dummy-data/creditMemos';
import { ROUTES } from '../../navigations-map/Base';

const STATUS_COLOR: Record<CreditMemoStatus, string> = {
  open: Colors.info,
  applied: Colors.success,
  void: Colors.textTertiary,
};
const STATUS_BG: Record<CreditMemoStatus, string> = {
  open: Colors.infoLight,
  applied: Colors.successLight,
  void: Colors.background,
};
const STATUS_LABEL: Record<CreditMemoStatus, string> = {
  open: 'Open',
  applied: 'Applied',
  void: 'Void',
};

const fmt = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'applied', label: 'Applied' },
  { key: 'void', label: 'Void' },
];

const TabChip: React.FC<{ tab: { key: string; label: string }; count: number; isSelected: boolean; onPress: () => void }> = ({ tab, count, isSelected, onPress }) => (
  <TouchableOpacity style={[styles.tab, isSelected && styles.tabActive]} onPress={onPress} activeOpacity={0.7}>
    <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>{tab.label}</Text>
    <View style={[styles.tabBadge, isSelected && styles.tabBadgeActive]}>
      <Text style={[styles.tabBadgeText, isSelected && styles.tabBadgeTextActive]}>{count}</Text>
    </View>
  </TouchableOpacity>
);

const CMCard: React.FC<{ cm: CreditMemo; onPress: () => void }> = React.memo(({ cm, onPress }) => (
  <TouchableOpacity style={[styles.card, { borderLeftColor: STATUS_COLOR[cm.status] }]} activeOpacity={0.7} onPress={onPress}>
    <View style={styles.cardTop}>
      <Text style={styles.cardNumber}>{cm.creditMemoNumber}</Text>
      <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[cm.status] }]}>
        <Text style={[styles.statusBadgeText, { color: STATUS_COLOR[cm.status] }]}>{STATUS_LABEL[cm.status]}</Text>
      </View>
    </View>
    <Text style={styles.cardCustomer}>{cm.customerName}</Text>
    <Text style={styles.cardReason} numberOfLines={1}>{cm.reason}</Text>
    <View style={styles.cardDatesRow}>
      <Text style={styles.cardDate}>Date: {fmtDate(cm.date)}</Text>
    </View>
    {cm.status === 'open' && cm.amountRemaining > 0 && (
      <View style={styles.remainingRow}>
        <Text style={styles.remainingLabel}>Remaining Credit:</Text>
        <Text style={styles.remainingValue}>{fmt(cm.amountRemaining)}</Text>
      </View>
    )}
    <View style={styles.cardBottom}>
      <Text style={styles.cardTotal}>{fmt(cm.total)}</Text>
    </View>
  </TouchableOpacity>
));

const EmptyState: React.FC = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>↩️</Text>
    <Text style={styles.emptyTitle}>No Credit Memos Found</Text>
    <Text style={styles.emptySubtitle}>Tap "+ New" to create your first credit memo</Text>
  </View>
);

const CreditMemoListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { creditMemos: all, filteredCreditMemos, statusFilter, searchQuery, isLoading } = useAppSelector((s) => s.creditMemos);

  useEffect(() => { dispatch(fetchCreditMemos()); }, [dispatch]);
  const onRefresh = useCallback(() => { dispatch(fetchCreditMemos()); }, [dispatch]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: all.length };
    FILTER_TABS.forEach((t) => { if (t.key !== 'all') m[t.key] = all.filter((c) => c.status === t.key).length; });
    return m;
  }, [all]);

  const openCreditTotal = useMemo(
    () => all.filter((c) => c.status === 'open').reduce((s, c) => s + c.amountRemaining, 0),
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credit Memos</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate(ROUTES.CM_FORM)} activeOpacity={0.7}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(t) => dispatch(setCMSearch(t))}
          placeholder="Search by number, customer, reason..."
          placeholderTextColor={Colors.placeholder}
        />
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryLabel}>Open Credits</Text>
        <Text style={styles.summaryValue}>{fmt(openCreditTotal)}</Text>
      </View>

      <View style={styles.tabRow}>
        {FILTER_TABS.map((tab) => (
          <TabChip key={tab.key} tab={tab} count={counts[tab.key] ?? 0} isSelected={statusFilter === tab.key} onPress={() => dispatch(setCMFilter(tab.key as any))} />
        ))}
      </View>

      <FlatList
        data={filteredCreditMemos}
        keyExtractor={(item) => item.creditMemoId}
        renderItem={({ item }) => (
          <CMCard cm={item} onPress={() => navigation.navigate(ROUTES.CM_FORM, { creditMemoId: item.creditMemoId })} />
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
  summaryBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, backgroundColor: Colors.infoLight, borderBottomWidth: 1, borderBottomColor: Colors.border },
  summaryLabel: { fontSize: 13, fontWeight: '600', color: Colors.info },
  summaryValue: { fontSize: 15, fontWeight: '800', color: Colors.info },
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
  cardCustomer: { fontSize: 14, color: Colors.textSecondary, marginBottom: 2 },
  cardReason: { fontSize: 12, color: Colors.textTertiary, fontStyle: 'italic', marginBottom: 6 },
  cardDatesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardDate: { fontSize: 12, color: Colors.textTertiary },
  remainingRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.infoLight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4, marginBottom: 6 },
  remainingLabel: { fontSize: 11, fontWeight: '600', color: Colors.info },
  remainingValue: { fontSize: 12, fontWeight: '700', color: Colors.info },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 8 },
  cardTotal: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});

export default CreditMemoListScreen;
