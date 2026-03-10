// ============================================================
// FINMATRIX - Reconciliation History Screen
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import {
  getReconciliationHistory,
  ReconciliationRecord,
} from './ReconciliationScreen';

// ─── Helpers ────────────────────────────────────────────────
const fmt = (n: number) =>
  `$${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ─── Record Card ────────────────────────────────────────────
const RecordCard: React.FC<{ record: ReconciliationRecord }> = ({
  record,
}) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardAccount}>{record.accountName}</Text>
        <Text style={styles.cardDate}>
          Statement: {formatDate(record.statementDate)}
        </Text>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>✓ Reconciled</Text>
      </View>
    </View>

    <View style={styles.cardDivider} />

    <View style={styles.cardBody}>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Statement Balance</Text>
        <Text style={styles.detailValue}>{fmt(record.statementBalance)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Beginning Balance</Text>
        <Text style={styles.detailValue}>
          {fmt(record.beginningBalance)}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Transactions Cleared</Text>
        <Text style={styles.detailValue}>{record.transactionCount}</Text>
      </View>
    </View>

    <Text style={styles.reconciledAt}>
      Reconciled {formatDateTime(record.reconciledAt)}
    </Text>
  </View>
);

// ─── Main Component ─────────────────────────────────────────
const ReconciliationHistoryScreen: React.FC<{
  navigation: any;
  route: any;
}> = ({ navigation, route }) => {
  const bankAccountId = route.params?.bankAccountId || '';
  const allHistory = getReconciliationHistory();

  const [filter, setFilter] = useState<'all' | 'account'>('all');

  const records = useMemo(() => {
    const list =
      filter === 'account' && bankAccountId
        ? allHistory.filter((r) => r.bankAccountId === bankAccountId)
        : allHistory;
    return list.sort((a, b) =>
      b.statementDate.localeCompare(a.statementDate),
    );
  }, [allHistory, filter, bankAccountId]);

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
        <Text style={styles.title}>Reconciliation History</Text>
        <Text style={styles.subtitle}>
          {records.length} reconciliation{records.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Filter Tabs */}
      {bankAccountId ? (
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={[styles.tab, filter === 'all' && styles.tabActive]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.tabText,
                filter === 'all' && styles.tabTextActive,
              ]}
            >
              All Accounts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filter === 'account' && styles.tabActive]}
            onPress={() => setFilter('account')}
          >
            <Text
              style={[
                styles.tabText,
                filter === 'account' && styles.tabTextActive,
              ]}
            >
              This Account
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* List */}
      <FlatList
        data={records}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <RecordCard record={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No reconciliations yet</Text>
            <Text style={styles.emptySubtext}>
              Complete a bank reconciliation to see it here.
            </Text>
          </View>
        }
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  // Filter
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.background,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  // List
  list: { paddingBottom: Spacing.xxxl },
  // Card
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardAccount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardDate: { fontSize: 13, color: Colors.textSecondary },
  statusBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  cardBody: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  detailLabel: { fontSize: 13, color: Colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  reconciledAt: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    textAlign: 'right',
  },
  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingTop: Spacing.huge,
  },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.md },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default ReconciliationHistoryScreen;
