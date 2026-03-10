// ============================================================
// FINMATRIX - Balance Sheet Screen
// ============================================================
// As-of date. ASSETS (Current + Fixed) | LIABILITIES (Current +
// Long-term) | EQUITY. Balancing check: Total Assets = Total L + E.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { chartOfAccounts } from '../../dummy-data/chartOfAccounts';

const r2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) =>
  '$' +
  Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ─── Build data from COA ────────────────────────────────────
const buildData = () => {
  const accts = chartOfAccounts;

  // Assets
  const currentAssets = accts.filter(
    (a) => a.type === 'asset' && a.subType === 'Current Asset',
  );
  const fixedAssets = accts.filter(
    (a) => a.type === 'asset' && a.subType === 'Fixed Asset',
  );
  const totalCurrentAssets = r2(
    currentAssets.reduce((s, a) => s + a.currentBalance, 0),
  );
  const totalFixedAssets = r2(
    fixedAssets.reduce((s, a) => s + a.currentBalance, 0),
  );
  const totalAssets = r2(totalCurrentAssets + totalFixedAssets);

  // Liabilities
  const currentLiabilities = accts.filter(
    (a) => a.type === 'liability' && a.subType === 'Current Liability',
  );
  const longTermLiabilities = accts.filter(
    (a) => a.type === 'liability' && a.subType === 'Long-term Liability',
  );
  const totalCurrentLiab = r2(
    currentLiabilities.reduce((s, a) => s + a.currentBalance, 0),
  );
  const totalLongTermLiab = r2(
    longTermLiabilities.reduce((s, a) => s + a.currentBalance, 0),
  );
  const totalLiabilities = r2(totalCurrentLiab + totalLongTermLiab);

  // Equity
  const equity = accts.filter((a) => a.type === 'equity');
  const totalEquity = r2(equity.reduce((s, a) => s + a.currentBalance, 0));

  const totalLiabEquity = r2(totalLiabilities + totalEquity);
  const isBalanced = Math.abs(totalAssets - totalLiabEquity) < 0.01;

  return {
    currentAssets,
    fixedAssets,
    totalCurrentAssets,
    totalFixedAssets,
    totalAssets,
    currentLiabilities,
    longTermLiabilities,
    totalCurrentLiab,
    totalLongTermLiab,
    totalLiabilities,
    equity,
    totalEquity,
    totalLiabEquity,
    isBalanced,
  };
};

// ─── Component ──────────────────────────────────────────────
const BalanceSheetScreen: React.FC = () => {
  const navigation = useNavigation();
  const [asOfDate, setAsOfDate] = useState('2026-03-03');
  const data = useMemo(buildData, []);

  const renderAcct = (a: (typeof chartOfAccounts)[0]) => (
    <View key={a.accountId} style={styles.lineRow}>
      <Text style={styles.lineName} numberOfLines={1}>
        {a.accountNumber} – {a.name}
      </Text>
      <Text style={styles.lineAmt}>
        {a.currentBalance < 0 ? `(${fmt(a.currentBalance)})` : fmt(a.currentBalance)}
      </Text>
    </View>
  );

  const renderSubTotal = (label: string, amount: number) => (
    <View style={styles.subTotalRow}>
      <Text style={styles.subTotalLabel}>{label}</Text>
      <Text style={styles.subTotalAmt}>{fmt(amount)}</Text>
    </View>
  );

  const renderGrandTotal = (
    label: string,
    amount: number,
    color?: string,
  ) => (
    <View style={[styles.grandTotalRow, color ? { backgroundColor: color } : undefined]}>
      <Text style={styles.grandTotalLabel}>{label}</Text>
      <Text style={styles.grandTotalAmt}>{fmt(amount)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Balance Sheet</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* As-of date */}
      <View style={styles.dateBar}>
        <Text style={styles.dateLabel}>As of</Text>
        <TextInput
          style={styles.dateInput}
          value={asOfDate}
          onChangeText={setAsOfDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.placeholder}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── ASSETS ──────────────────────────────────── */}
        <Text style={styles.sectionLabel}>ASSETS</Text>

        <View style={styles.card}>
          <Text style={styles.subSection}>Current Assets</Text>
          {data.currentAssets.map(renderAcct)}
          {renderSubTotal('Total Current Assets', data.totalCurrentAssets)}
        </View>

        <View style={[styles.card, { marginTop: Spacing.sm }]}>
          <Text style={styles.subSection}>Fixed Assets</Text>
          {data.fixedAssets.map(renderAcct)}
          {renderSubTotal('Total Fixed Assets', data.totalFixedAssets)}
        </View>

        {renderGrandTotal('TOTAL ASSETS', data.totalAssets, Colors.infoLight)}

        {/* ── LIABILITIES ─────────────────────────────── */}
        <Text style={styles.sectionLabel}>LIABILITIES</Text>

        <View style={styles.card}>
          <Text style={styles.subSection}>Current Liabilities</Text>
          {data.currentLiabilities.map(renderAcct)}
          {renderSubTotal('Total Current Liabilities', data.totalCurrentLiab)}
        </View>

        <View style={[styles.card, { marginTop: Spacing.sm }]}>
          <Text style={styles.subSection}>Long-term Liabilities</Text>
          {data.longTermLiabilities.map(renderAcct)}
          {renderSubTotal('Total Long-term Liabilities', data.totalLongTermLiab)}
        </View>

        {renderGrandTotal('TOTAL LIABILITIES', data.totalLiabilities)}

        {/* ── EQUITY ──────────────────────────────────── */}
        <Text style={styles.sectionLabel}>EQUITY</Text>
        <View style={styles.card}>
          {data.equity.map(renderAcct)}
          {renderSubTotal('Total Equity', data.totalEquity)}
        </View>

        {renderGrandTotal(
          'TOTAL LIABILITIES + EQUITY',
          data.totalLiabEquity,
          Colors.infoLight,
        )}

        {/* Balance check */}
        <View
          style={[
            styles.balanceCheck,
            {
              backgroundColor: data.isBalanced
                ? Colors.successLight
                : Colors.dangerLight,
            },
          ]}
        >
          <Text style={styles.balanceIcon}>
            {data.isBalanced ? '✅' : '⚠️'}
          </Text>
          <Text
            style={[
              styles.balanceText,
              {
                color: data.isBalanced ? Colors.success : Colors.danger,
              },
            ]}
          >
            {data.isBalanced
              ? 'Balance Sheet is balanced'
              : `Out of balance by ${fmt(data.totalAssets - data.totalLiabEquity)}`}
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

  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    fontSize: 13,
    color: Colors.textPrimary,
  },

  content: { padding: Spacing.base, paddingBottom: Spacing.huge },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  subSection: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    ...Shadows.sm,
  },

  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: Spacing.md,
  },
  lineName: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  lineAmt: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'right',
    minWidth: 80,
  },

  subTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 4,
  },
  subTotalLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  subTotalAmt: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
    minWidth: 80,
  },

  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  grandTotalAmt: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'right',
    minWidth: 90,
  },

  balanceCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  balanceIcon: { fontSize: 20 },
  balanceText: { fontSize: 15, fontWeight: '700' },
});

export default BalanceSheetScreen;
