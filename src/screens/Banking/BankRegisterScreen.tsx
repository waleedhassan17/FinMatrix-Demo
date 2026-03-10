// ============================================================
// FINMATRIX - Bank Register Screen
// ============================================================

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppSelector, useAppDispatch } from '../../hooks/useReduxHooks';
import { fetchBankTransactions, fetchBankAccounts } from './bankingSlice';
import { BankTransaction } from '../../dummy-data/bankTransactions';

// ─── Helpers ────────────────────────────────────────────────
const fmt = (n: number) =>
  `$${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y.slice(2)}`;
};

const typeIcon = (t: string) => {
  const map: Record<string, string> = {
    check: '📝',
    deposit: '💰',
    transfer: '🔄',
    card_charge: '💳',
    fee: '🏦',
    interest: '📈',
  };
  return map[t] || '📄';
};

// ─── Transaction Row ────────────────────────────────────────
const TxRow: React.FC<{ tx: BankTransaction; runningBalance: number }> = ({
  tx,
  runningBalance,
}) => {
  const isPayment = tx.amount < 0;

  return (
    <View style={styles.txRow}>
      <View style={styles.txLeft}>
        <View style={styles.txDateCol}>
          <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
          <Text style={styles.txTypeIcon}>{typeIcon(tx.type)}</Text>
        </View>
        <View style={styles.txPayeeCol}>
          <View style={styles.txPayeeLine}>
            <Text style={styles.txPayee} numberOfLines={1}>
              {tx.payee}
            </Text>
            {tx.isCleared && <Text style={styles.clearedCheck}>✓</Text>}
            {tx.isReconciled && <Text style={styles.reconciledBadge}>R</Text>}
          </View>
          <Text style={styles.txDesc} numberOfLines={1}>
            {tx.description}
          </Text>
          {tx.checkNumber && (
            <Text style={styles.txRef}>Check #{tx.checkNumber}</Text>
          )}
        </View>
      </View>
      <View style={styles.txRight}>
        {isPayment ? (
          <Text style={[styles.txAmount, { color: Colors.danger }]}>
            -{fmt(tx.amount)}
          </Text>
        ) : (
          <Text style={[styles.txAmount, { color: Colors.success }]}>
            {fmt(tx.amount)}
          </Text>
        )}
        <Text style={styles.txRunning}>{fmt(runningBalance)}</Text>
      </View>
    </View>
  );
};

// ─── Main Component ─────────────────────────────────────────
const BankRegisterScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { bankAccountId } = route.params;
  const dispatch = useAppDispatch();
  const { accounts, transactions, isLoading } = useAppSelector(
    (s) => s.banking,
  );

  const account = accounts.find((a) => a.accountId === bankAccountId);

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const loadData = useCallback(() => {
    if (!accounts.length) dispatch(fetchBankAccounts());
    dispatch(fetchBankTransactions(bankAccountId));
  }, [dispatch, bankAccountId, accounts.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Re-load on focus (after adding transaction)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  // Filtered & sorted
  const filtered = useMemo(() => {
    let txs = [...transactions];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      txs = txs.filter(
        (t) =>
          t.payee.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.referenceNumber.toLowerCase().includes(q),
      );
    }

    // Date range
    if (startDate) txs = txs.filter((t) => t.date >= startDate);
    if (endDate) txs = txs.filter((t) => t.date <= endDate);

    // Sort chronologically (oldest first for running balance)
    return txs.sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, search, startDate, endDate]);

  // Running balances
  const withRunning = useMemo(() => {
    let balance = 0;
    // Get beginning balance from the account balance minus all transaction amounts
    const totalTxAmounts = transactions.reduce((s, t) => s + t.amount, 0);
    balance = (account?.currentBalance ?? 0) - totalTxAmounts;

    return filtered.map((tx) => {
      balance += tx.amount;
      return { tx, runningBalance: balance };
    });
  }, [filtered, transactions, account]);

  // Display in reverse chronological
  const displayList = useMemo(() => [...withRunning].reverse(), [withRunning]);

  // Totals
  const totals = useMemo(() => {
    const payments = filtered
      .filter((t) => t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const deposits = filtered
      .filter((t) => t.amount > 0)
      .reduce((s, t) => s + t.amount, 0);
    return { payments, deposits, net: deposits - payments };
  }, [filtered]);

  const balanceColor =
    (account?.currentBalance ?? 0) >= 0 ? Colors.success : Colors.danger;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {account?.name || 'Bank Register'}
            </Text>
            <Text style={styles.subtitle}>
              {account?.institution} · {account?.accountNumberMasked}
            </Text>
          </View>
          <View style={styles.headerBalance}>
            <Text style={[styles.balanceAmount, { color: balanceColor }]}>
              {account ? fmt(account.currentBalance) : '--'}
            </Text>
            <Text style={styles.balanceLabel}>Balance</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.reconcileHeaderBtn}
          onPress={() =>
            navigation.navigate(ROUTES.RECONCILIATION, { bankAccountId })
          }
        >
          <Text style={styles.reconcileHeaderText}>⚖️ Reconcile</Text>
        </TouchableOpacity>
      </View>

      {/* Search + Date Filter */}
      <View style={styles.filterBar}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search payee..."
            placeholderTextColor={Colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.dateToggle,
            showDateFilter && { backgroundColor: Colors.primaryDark + '15' },
          ]}
          onPress={() => setShowDateFilter(!showDateFilter)}
        >
          <Text style={styles.dateToggleText}>📅</Text>
        </TouchableOpacity>
      </View>

      {showDateFilter && (
        <View style={styles.dateRow}>
          <TextInput
            style={styles.dateInput}
            placeholder="Start (YYYY-MM-DD)"
            placeholderTextColor={Colors.placeholder}
            value={startDate}
            onChangeText={setStartDate}
          />
          <Text style={styles.dateSep}>to</Text>
          <TextInput
            style={styles.dateInput}
            placeholder="End (YYYY-MM-DD)"
            placeholderTextColor={Colors.placeholder}
            value={endDate}
            onChangeText={setEndDate}
          />
          {(startDate || endDate) ? (
            <TouchableOpacity
              onPress={() => {
                setStartDate('');
                setEndDate('');
              }}
            >
              <Text style={styles.clearFilter}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Column Header */}
      <View style={styles.colHeader}>
        <Text style={[styles.colText, { flex: 0.6 }]}>Date</Text>
        <Text style={[styles.colText, { flex: 1.4 }]}>Payee</Text>
        <Text style={[styles.colText, { flex: 0.5, textAlign: 'right' }]}>
          Amount
        </Text>
        <Text style={[styles.colText, { flex: 0.5, textAlign: 'right' }]}>
          Balance
        </Text>
      </View>

      {/* Transactions List */}
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: Spacing.xxl }}
        />
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item.tx.txId}
          renderItem={({ item }) => (
            <TxRow tx={item.tx} runningBalance={item.runningBalance} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadData} />
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💳</Text>
                <Text style={styles.emptyTitle}>No Transactions Found</Text>
                <Text style={styles.emptySubtitle}>Tap "+ Transaction" to record one</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Totals Bar */}
      <View style={styles.totalsBar}>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Payments</Text>
          <Text style={[styles.totalValue, { color: Colors.danger }]}>
            {fmt(totals.payments)}
          </Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Deposits</Text>
          <Text style={[styles.totalValue, { color: Colors.success }]}>
            {fmt(totals.deposits)}
          </Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Net</Text>
          <Text
            style={[
              styles.totalValue,
              { color: totals.net >= 0 ? Colors.success : Colors.danger },
            ]}
          >
            {totals.net >= 0 ? '' : '-'}
            {fmt(totals.net)}
          </Text>
        </View>
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate(ROUTES.ADD_TRANSACTION, { bankAccountId })
        }
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+ Transaction</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginBottom: Spacing.sm },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  reconcileHeaderBtn: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  reconcileHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  headerBalance: { alignItems: 'flex-end' },
  balanceAmount: { fontSize: 22, fontWeight: '800' },
  balanceLabel: { fontSize: 11, color: Colors.textTertiary },
  // Filter
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    alignItems: 'center',
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    height: 38,
  },
  searchIcon: { fontSize: 14, marginRight: Spacing.xs },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  dateToggle: {
    marginLeft: Spacing.sm,
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateToggleText: { fontSize: 18 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dateInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.sm,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  dateSep: {
    marginHorizontal: Spacing.sm,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  clearFilter: {
    marginLeft: Spacing.sm,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Column header
  colHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryDark + '08',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  colText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // List
  list: { paddingBottom: 120 },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: Spacing.xxl,
  },
  emptyIcon: { fontSize: 42, marginBottom: Spacing.md },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // Tx Row
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  txLeft: { flex: 1, flexDirection: 'row' },
  txDateCol: {
    width: 52,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  txDate: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  txTypeIcon: { fontSize: 14, marginTop: 2 },
  txPayeeCol: { flex: 1 },
  txPayeeLine: { flexDirection: 'row', alignItems: 'center' },
  txPayee: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  clearedCheck: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '800',
    marginLeft: Spacing.xs,
  },
  reconciledBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.info,
    backgroundColor: Colors.infoLight,
    paddingHorizontal: 4,
    borderRadius: 3,
    marginLeft: 4,
    overflow: 'hidden',
  },
  txDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  txRef: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  txRight: { width: 100, alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txRunning: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  // Totals
  totalsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    ...Shadows.md,
  },
  totalItem: { flex: 1, alignItems: 'center' },
  totalLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 2 },
  totalValue: { fontSize: 14, fontWeight: '700' },
  totalDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 2,
  },
  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.base,
    bottom: 80,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.md,
  },
  fabText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
});

export default BankRegisterScreen;
