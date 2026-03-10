// ============================================================
// FINMATRIX - Invoice List Screen
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
import { fetchInvoices, setFilter, setSearchQuery } from './invoiceSlice';
import { Invoice, InvoiceStatus } from '../../dummy-data/invoices';
import { ROUTES } from '../../navigations-map/Base';

// ─── Helpers ────────────────────────────────────────────────

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  draft: Colors.textTertiary,
  sent: Colors.info,
  viewed: Colors.warning,
  paid: Colors.success,
  overdue: Colors.danger,
  cancelled: Colors.textDisabled,
};

const STATUS_BG: Record<InvoiceStatus, string> = {
  draft: Colors.background,
  sent: Colors.infoLight,
  viewed: Colors.warningLight,
  paid: Colors.successLight,
  overdue: Colors.dangerLight,
  cancelled: Colors.background,
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

const formatCurrency = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const formatDate = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Filter Tabs ────────────────────────────────────────────
interface FilterTab {
  key: string;
  label: string;
}

const FILTER_TABS: FilterTab[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
];

const TabChip: React.FC<{
  tab: FilterTab;
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

// ─── Invoice Card ───────────────────────────────────────────

const InvoiceCard: React.FC<{
  invoice: Invoice;
  onPress: () => void;
}> = React.memo(({ invoice, onPress }) => {
  const borderColor = STATUS_COLOR[invoice.status];
  const remaining = invoice.total - invoice.amountPaid;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: borderColor }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Top row: invoice# + status badge */}
      <View style={styles.cardTop}>
        <Text style={styles.cardNumber}>{invoice.invoiceNumber}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: STATUS_BG[invoice.status] },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              { color: STATUS_COLOR[invoice.status] },
            ]}
          >
            {STATUS_LABEL[invoice.status]}
          </Text>
        </View>
      </View>

      {/* Customer name */}
      <Text style={styles.cardCustomer}>{invoice.customerName}</Text>

      {/* Dates */}
      <View style={styles.cardDatesRow}>
        <Text style={styles.cardDate}>
          Issued: {formatDate(invoice.date)}
        </Text>
        <Text style={styles.cardDate}>
          Due: {formatDate(invoice.dueDate)}
        </Text>
      </View>

      {/* Amount */}
      <View style={styles.cardBottom}>
        <Text style={styles.cardTotal}>{formatCurrency(invoice.total)}</Text>
        {invoice.amountPaid > 0 && invoice.amountPaid < invoice.total && (
          <Text style={styles.cardRemaining}>
            Due: {formatCurrency(remaining)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

// ─── Empty State ────────────────────────────────────────────
const EmptyState: React.FC = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>📄</Text>
    <Text style={styles.emptyTitle}>No Invoices Found</Text>
    <Text style={styles.emptySubtitle}>
      Tap "+ New" to create your first invoice
    </Text>
  </View>
);

// ─── Main Component ─────────────────────────────────────────
const InvoiceListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const {
    invoices: allInvoices,
    filteredInvoices,
    statusFilter,
    searchQuery,
    isLoading,
  } = useAppSelector((s) => s.invoices);

  useEffect(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);

  // ── Count badges ──────────────────────────────────────────
  const counts = useMemo(() => {
    const m: Record<string, number> = { all: allInvoices.length };
    FILTER_TABS.forEach((t) => {
      if (t.key !== 'all') {
        m[t.key] = allInvoices.filter((i) => i.status === t.key).length;
      }
    });
    return m;
  }, [allInvoices]);

  // ── Summary bar ───────────────────────────────────────────
  const { outstanding, overdue } = useMemo(() => {
    let out = 0;
    let od = 0;
    allInvoices.forEach((inv) => {
      if (['sent', 'viewed', 'overdue'].includes(inv.status)) {
        const rem = inv.total - inv.amountPaid;
        out += rem;
        if (inv.status === 'overdue') od += rem;
      }
    });
    return { outstanding: out, overdue: od };
  }, [allInvoices]);

  if (isLoading && allInvoices.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ─── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoices</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate(ROUTES.INVOICE_FORM)}
          activeOpacity={0.7}
        >
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Search ─────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(t) => dispatch(setSearchQuery(t))}
          placeholder="Search by number or customer..."
          placeholderTextColor={Colors.placeholder}
        />
      </View>

      {/* ─── Summary bar ───────────────────────────────── */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          Outstanding:{' '}
          <Text style={styles.summaryAmount}>{formatCurrency(outstanding)}</Text>
        </Text>
        <View style={styles.summaryDivider} />
        <Text style={styles.summaryText}>
          Overdue:{' '}
          <Text style={[styles.summaryAmount, { color: Colors.danger }]}>
            {formatCurrency(overdue)}
          </Text>
        </Text>
      </View>

      {/* ─── Filter tabs ───────────────────────────────── */}
      <View style={styles.tabRow}>
        {FILTER_TABS.map((tab) => (
          <TabChip
            key={tab.key}
            tab={tab}
            count={counts[tab.key] ?? 0}
            isSelected={statusFilter === tab.key}
            onPress={() => dispatch(setFilter(tab.key as any))}
          />
        ))}
      </View>

      {/* ─── List ───────────────────────────────────────── */}
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.invoiceId}
        renderItem={({ item }) => (
          <InvoiceCard
            invoice={item}
            onPress={() =>
              navigation.navigate(ROUTES.INVOICE_DETAIL, {
                invoiceId: item.invoiceId,
              })
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

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  newBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
  },
  newBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },

  // Search
  searchContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    height: 40,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // Summary
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.primary + '08',
  },
  summaryText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryAmount: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summaryDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },

  // Filter tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
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
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabBadgeTextActive: {
    color: Colors.white,
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: 40,
  },

  // Card
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
  cardNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
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
  cardCustomer: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  cardDatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 8,
  },
  cardTotal: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardRemaining: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.warning,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
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

export default InvoiceListScreen;
