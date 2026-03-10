// ============================================================
// FINMATRIX - Trial Balance Screen
// ============================================================
// All active accounts: Name | Debit | Credit. Totals row (must balance).

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { chartOfAccounts, Account } from '../../dummy-data/chartOfAccounts';

const r2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) =>
  n === 0
    ? '—'
    : '$' +
      Math.abs(n).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

// ─── Build trial balance data ───────────────────────────────
// Normal balance rules:
//   Asset / Expense  → Debit normal  (positive = debit)
//   Liability / Equity / Revenue → Credit normal (positive = credit)
// Negative currentBalance = contra entry on opposite side.

interface TBRow {
  acct: Account;
  debit: number;
  credit: number;
}

const buildTB = (): { rows: TBRow[]; totalDebit: number; totalCredit: number; isBalanced: boolean } => {
  const rows: TBRow[] = chartOfAccounts
    .filter((a) => a.isActive || a.currentBalance !== 0)
    .map((acct) => {
      let debit = 0;
      let credit = 0;
      const bal = acct.currentBalance;

      if (acct.type === 'asset' || acct.type === 'expense') {
        // Normal debit balance
        if (bal >= 0) debit = bal;
        else credit = Math.abs(bal);
      } else {
        // liability / equity / revenue → normal credit
        if (bal >= 0) credit = bal;
        else debit = Math.abs(bal);
      }

      return { acct, debit: r2(debit), credit: r2(credit) };
    })
    .sort((a, b) =>
      a.acct.accountNumber.localeCompare(b.acct.accountNumber),
    );

  const totalDebit = r2(rows.reduce((s, r) => s + r.debit, 0));
  const totalCredit = r2(rows.reduce((s, r) => s + r.credit, 0));
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return { rows, totalDebit, totalCredit, isBalanced };
};

// ─── Component ──────────────────────────────────────────────
const TrialBalanceScreen: React.FC = () => {
  const navigation = useNavigation();
  const { rows, totalDebit, totalCredit, isBalanced } = useMemo(buildTB, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Trial Balance</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Column headers */}
      <View style={styles.colHeader}>
        <Text style={[styles.colLabel, { flex: 2 }]}>Account</Text>
        <Text style={[styles.colLabel, styles.colRight]}>Debit</Text>
        <Text style={[styles.colLabel, styles.colRight]}>Credit</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {rows.map(({ acct, debit, credit }) => (
          <View
            key={acct.accountId}
            style={[
              styles.row,
              !acct.isActive && styles.inactiveRow,
            ]}
          >
            <View style={{ flex: 2 }}>
              <Text style={styles.acctName} numberOfLines={1}>
                {acct.accountNumber} – {acct.name}
              </Text>
              <Text style={styles.acctType}>{acct.subType}</Text>
            </View>
            <Text style={[styles.amt, styles.colRight]}>
              {fmt(debit)}
            </Text>
            <Text style={[styles.amt, styles.colRight]}>
              {fmt(credit)}
            </Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { flex: 2 }]}>TOTALS</Text>
          <Text style={[styles.totalAmt, styles.colRight]}>
            {fmt(totalDebit)}
          </Text>
          <Text style={[styles.totalAmt, styles.colRight]}>
            {fmt(totalCredit)}
          </Text>
        </View>

        {/* Balance check */}
        <View
          style={[
            styles.balanceCheck,
            {
              backgroundColor: isBalanced
                ? Colors.successLight
                : Colors.dangerLight,
            },
          ]}
        >
          <Text style={styles.balanceIcon}>
            {isBalanced ? '✅' : '⚠️'}
          </Text>
          <Text
            style={[
              styles.balanceText,
              { color: isBalanced ? Colors.success : Colors.danger },
            ]}
          >
            {isBalanced
              ? 'Trial Balance is balanced'
              : `Out of balance by ${fmt(Math.abs(totalDebit - totalCredit))}`}
          </Text>
        </View>
      </ScrollView>
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
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },

  colHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
  },
  colLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    flex: 1,
  },
  colRight: { textAlign: 'right', flex: 1 },

  content: { paddingBottom: Spacing.huge },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  inactiveRow: { opacity: 0.5 },
  acctName: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  acctType: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  amt: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },

  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.primary + '10',
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  totalLabel: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  totalAmt: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    flex: 1,
  },

  balanceCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  balanceIcon: { fontSize: 20 },
  balanceText: { fontSize: 15, fontWeight: '700' },
});

export default TrialBalanceScreen;
