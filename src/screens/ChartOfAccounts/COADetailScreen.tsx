// ============================================================
// FINMATRIX - Chart of Accounts Detail Screen
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { toggleAccount } from './coaSlice';
import { ROUTES } from '../../navigations-map/Base';
import SimpleTabBar from '../../Custom-Components/SimpleTabBar';
import {
  getAccountTransactions,
  AccountTransaction,
} from '../../dummy-data/accountTransactions';

// ─── Constants ──────────────────────────────────────────────
const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  asset: '#2E75B6',
  liability: '#E74C3C',
  equity: '#8E44AD',
  revenue: '#27AE60',
  expense: '#F39C12',
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expense',
};

type TabKey = 'transactions' | 'info';

const TAB_LABELS: Record<TabKey, string> = {
  transactions: 'Transactions',
  info: 'Info',
};
const TAB_KEYS: TabKey[] = ['transactions', 'info'];

// ─── Helpers ────────────────────────────────────────────────
const formatCurrency = (amount: number) => {
  const isNeg = amount < 0;
  const formatted =
    '$' +
    Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
  return isNeg ? `-${formatted}` : formatted;
};

// ─── Main Component ─────────────────────────────────────────
const COADetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const { accounts } = useAppSelector((s) => s.coa);
  const accountId: string = route.params?.accountId;

  const account = useMemo(
    () => accounts.find((a) => a.accountId === accountId),
    [accounts, accountId]
  );

  const [activeTab, setActiveTab] = useState<TabKey>('transactions');

  const transactions = useMemo(
    () => (accountId ? getAccountTransactions(accountId) : []),
    [accountId]
  );

  const parentAccount = useMemo(
    () =>
      account?.parentAccountId
        ? accounts.find((a) => a.accountId === account.parentAccountId)
        : null,
    [accounts, account]
  );

  if (!account) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>Account not found</Text>
        <TouchableOpacity
          style={styles.goBackBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeColor = ACCOUNT_TYPE_COLORS[account.type] || Colors.textSecondary;
  const typeLabel = ACCOUNT_TYPE_LABELS[account.type] || account.type;

  // ─── Handlers ──────────────────────────────────────────
  const handleEdit = () => {
    navigation.navigate(ROUTES.COA_FORM, { accountId: account.accountId });
  };

  const handleToggleActive = () => {
    const action = account.isActive ? 'Deactivate' : 'Activate';
    Alert.alert(
      `${action} Account`,
      `Are you sure you want to ${action.toLowerCase()} "${account.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: account.isActive ? 'destructive' : 'default',
          onPress: () => dispatch(toggleAccount(account.accountId)),
        },
      ]
    );
  };

  // ─── Transaction Row ───────────────────────────────────
  const renderTransaction = ({
    item,
    index,
  }: {
    item: AccountTransaction;
    index: number;
  }) => (
    <View
      style={[
        styles.txRow,
        index === 0 && styles.txRowFirst,
        index === transactions.length - 1 && styles.txRowLast,
      ]}
    >
      <View style={styles.txLeft}>
        <Text style={styles.txReference}>{item.reference}</Text>
        <Text style={styles.txMemo} numberOfLines={1}>
          {item.memo}
        </Text>
        <Text style={styles.txDate}>{item.date}</Text>
      </View>
      <View style={styles.txRight}>
        {item.debit > 0 ? (
          <Text style={[styles.txAmount, { color: Colors.success }]}>
            +{formatCurrency(item.debit)}
          </Text>
        ) : (
          <Text style={[styles.txAmount, { color: Colors.danger }]}>
            -{formatCurrency(item.credit)}
          </Text>
        )}
        <Text style={styles.txBalance}>{formatCurrency(item.balance)}</Text>
      </View>
    </View>
  );

  // ─── Info Tab Content ──────────────────────────────────
  const InfoTab = () => (
    <View style={styles.infoCard}>
      <InfoRow label="Account Number" value={account.accountNumber} />
      <InfoRow label="Account Name" value={account.name} />
      <InfoRow label="Type" value={typeLabel} color={typeColor} />
      <InfoRow label="Sub Type" value={account.subType} />
      <InfoRow
        label="Parent Account"
        value={
          parentAccount
            ? `${parentAccount.accountNumber} - ${parentAccount.name}`
            : 'None (Top Level)'
        }
      />
      <InfoRow
        label="Description"
        value={account.description || 'No description'}
      />
      <InfoRow
        label="Opening Balance"
        value={formatCurrency(account.openingBalance)}
      />
      <InfoRow
        label="Current Balance"
        value={formatCurrency(account.currentBalance)}
        highlight
      />
      <InfoRow
        label="Status"
        value={account.isActive ? 'Active' : 'Inactive'}
        color={account.isActive ? Colors.success : Colors.danger}
      />
    </View>
  );

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
        <Text style={styles.headerTitle}>Account Detail</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ─── Top Card ───────────────────────────────────── */}
      <View style={styles.topCard}>
        <View style={styles.topCardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '18' }]}>
            <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>
              {typeLabel}
            </Text>
          </View>
          {!account.isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Inactive</Text>
            </View>
          )}
        </View>
        <Text style={styles.accountName}>{account.name}</Text>
        <Text style={styles.accountNumber}>#{account.accountNumber}</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceBlock}>
            <Text style={styles.balanceLabel}>Opening Balance</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(account.openingBalance)}
            </Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceBlock}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={[styles.balanceValue, { color: typeColor }]}>
              {formatCurrency(account.currentBalance)}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Tab Bar ────────────────────────────────────── */}
      <View style={{ marginHorizontal: Spacing.base, marginTop: Spacing.base }}>
        <SimpleTabBar
          tabs={TAB_KEYS.map((k) => TAB_LABELS[k])}
          activeTab={TAB_LABELS[activeTab]}
          onTabChange={(label) => {
            const key = TAB_KEYS.find((k) => TAB_LABELS[k] === label);
            if (key) setActiveTab(key);
          }}
          variant="pill"
        />
      </View>

      {/* ─── Tab Content ────────────────────────────────── */}
      {activeTab === 'transactions' ? (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          contentContainerStyle={styles.txListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.infoContent}
          showsVerticalScrollIndicator={false}
        >
          <InfoTab />
        </ScrollView>
      )}

      {/* ─── Bottom Action Buttons ──────────────────────── */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={handleEdit}
          activeOpacity={0.7}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            account.isActive ? styles.deactivateBtn : styles.activateBtn,
          ]}
          onPress={handleToggleActive}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.toggleBtnText,
              account.isActive
                ? styles.deactivateBtnText
                : styles.activateBtnText,
            ]}
          >
            {account.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Info Row Sub-component ─────────────────────────────────
const InfoRow: React.FC<{
  label: string;
  value: string;
  color?: string;
  highlight?: boolean;
}> = ({ label, value, color, highlight }) => (
  <View style={[infoStyles.row, highlight && infoStyles.rowHighlight]}>
    <Text style={infoStyles.label}>{label}</Text>
    <Text
      style={[
        infoStyles.value,
        color ? { color } : null,
        highlight && infoStyles.valueHighlight,
      ]}
    >
      {value}
    </Text>
  </View>
);

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rowHighlight: {
    borderBottomWidth: 0,
    backgroundColor: Colors.background,
    marginHorizontal: -Spacing.base,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.sm,
  },
  label: {
    fontSize: 13,
    color: Colors.textTertiary,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1.4,
    textAlign: 'right',
  },
  valueHighlight: {
    fontSize: 16,
    fontWeight: '700',
  },
});

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
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

  // Top Card
  topCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.md,
  },
  topCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inactiveBadge: {
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.danger,
  },
  accountName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 14,
    color: Colors.textTertiary,
    marginBottom: Spacing.base,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  balanceBlock: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  balanceLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Tab Bar (styles now in shared SimpleTabBar component)

  // Transaction List
  txListContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.huge,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  txRowFirst: {
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
  },
  txRowLast: {
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    borderBottomWidth: 0,
  },
  txLeft: {
    flex: 1,
    marginRight: Spacing.base,
  },
  txReference: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  txMemo: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  txDate: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  txBalance: {
    fontSize: 11,
    color: Colors.textTertiary,
  },

  // Info Tab
  infoContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.huge,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },

  // Empty
  emptyText: {
    fontSize: 15,
    color: Colors.textTertiary,
    marginBottom: Spacing.base,
  },
  goBackBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  goBackBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  editBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  editBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  deactivateBtn: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger,
  },
  deactivateBtnText: {
    color: Colors.danger,
    fontWeight: '700',
    fontSize: 15,
  },
  activateBtn: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  activateBtnText: {
    color: Colors.success,
    fontWeight: '700',
    fontSize: 15,
  },
  toggleBtnText: {
    fontWeight: '700',
    fontSize: 15,
  },
});

export default COADetailScreen;
