// ============================================================
// FINMATRIX - Bank Accounts Screen
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppSelector, useAppDispatch } from '../../hooks/useReduxHooks';
import { fetchBankAccounts } from './bankingSlice';
import { BankAccount } from '../../dummy-data/bankAccounts';

// ─── Helpers ────────────────────────────────────────────────
const fmt = (n: number) =>
  `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const typeLabel = (t: string) => {
  const map: Record<string, string> = {
    checking: 'Checking',
    savings: 'Savings',
    credit_card: 'Credit Card',
  };
  return map[t] || t;
};

const typeBadgeColor = (t: string) => {
  const map: Record<string, { bg: string; fg: string }> = {
    checking: { bg: Colors.infoLight, fg: Colors.info },
    savings: { bg: Colors.successLight, fg: Colors.success },
    credit_card: { bg: Colors.warningLight, fg: Colors.warning },
  };
  return map[t] || { bg: Colors.borderLight, fg: Colors.textSecondary };
};

const institutionIcon = (inst: string) => {
  if (inst.toLowerCase().includes('chase')) return '🏦';
  if (inst.toLowerCase().includes('first national')) return '🏛️';
  return '🏢';
};

// ─── Account Card ───────────────────────────────────────────
const AccountCard: React.FC<{
  account: BankAccount;
  onPress: () => void;
}> = ({ account, onPress }) => {
  const badge = typeBadgeColor(account.accountType);
  const isNegative = account.currentBalance < 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardRow}>
        {/* Institution icon */}
        <View style={styles.iconArea}>
          <Text style={styles.iconText}>
            {institutionIcon(account.institution)}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.accountName}>{account.name}</Text>
          <Text style={styles.institution}>{account.institution}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.typeBadgeText, { color: badge.fg }]}>
                {typeLabel(account.accountType)}
              </Text>
            </View>
            <Text style={styles.maskedNumber}>
              {account.accountNumberMasked}
            </Text>
          </View>
        </View>

        {/* Balance */}
        <View style={styles.balanceArea}>
          <Text
            style={[
              styles.balance,
              { color: isNegative ? Colors.danger : Colors.success },
            ]}
          >
            {isNegative ? '-' : ''}
            {fmt(account.currentBalance)}
          </Text>
          <Text style={styles.balanceLabel}>Current Balance</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Summary Bar ────────────────────────────────────────────
const SummaryBar: React.FC<{ accounts: BankAccount[] }> = ({ accounts }) => {
  const totalAssets = accounts
    .filter((a) => a.currentBalance > 0)
    .reduce((s, a) => s + a.currentBalance, 0);
  const totalLiabilities = accounts
    .filter((a) => a.currentBalance < 0)
    .reduce((s, a) => s + Math.abs(a.currentBalance), 0);
  const netWorth = totalAssets - totalLiabilities;

  return (
    <View style={styles.summaryBar}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total Assets</Text>
        <Text style={[styles.summaryValue, { color: Colors.success }]}>
          {fmt(totalAssets)}
        </Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Liabilities</Text>
        <Text style={[styles.summaryValue, { color: Colors.danger }]}>
          {fmt(totalLiabilities)}
        </Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Net Position</Text>
        <Text
          style={[
            styles.summaryValue,
            { color: netWorth >= 0 ? Colors.success : Colors.danger },
          ]}
        >
          {fmt(netWorth)}
        </Text>
      </View>
    </View>
  );
};

// ─── Main Component ─────────────────────────────────────────
const BankAccountsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { accounts, isLoading } = useAppSelector((s) => s.banking);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchBankAccounts()).unwrap();
    setRefreshing(false);
  };

  useEffect(() => {
    dispatch(fetchBankAccounts());
  }, [dispatch]);

  const renderAccount = ({ item }: { item: BankAccount }) => (
    <AccountCard
      account={item}
      onPress={() =>
        navigation.navigate(ROUTES.BANK_REGISTER, {
          bankAccountId: item.accountId,
        })
      }
    />
  );

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
        <Text style={styles.title}>Banking</Text>
        <Text style={styles.subtitle}>
          {accounts.length} account{accounts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: Spacing.xxl }}
        />
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(a) => a.accountId}
          renderItem={renderAccount}
          ListHeaderComponent={<SummaryBar accounts={accounts} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 32 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🏦</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 }}>No Bank Accounts</Text>
              <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center' }}>Add your first bank account to start tracking balances and transactions.</Text>
            </View>
          }
        />
      )}
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
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginBottom: Spacing.sm },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: { fontSize: 14, color: Colors.textSecondary },
  list: { paddingBottom: Spacing.xxxl },
  // Summary
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    ...Shadows.sm,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 2 },
  summaryValue: { fontSize: 15, fontWeight: '700' },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 2,
  },
  // Card
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconArea: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryDark + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconText: { fontSize: 24 },
  cardInfo: { flex: 1 },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  institution: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.sm,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  maskedNumber: { fontSize: 12, color: Colors.textTertiary },
  balanceArea: { alignItems: 'flex-end', marginLeft: Spacing.sm },
  balance: { fontSize: 18, fontWeight: '800' },
  balanceLabel: { fontSize: 10, color: Colors.textTertiary, marginTop: 2 },
});

export default BankAccountsScreen;
