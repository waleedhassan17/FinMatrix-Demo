// ============================================================
// FINMATRIX - Profit & Loss Screen
// ============================================================
// Date-range picker (default: this month). Comparison toggle.
// Revenue → COGS → Gross Profit → Operating Expenses → Net Income.
// Comparison shows two columns + $ change + % change.

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
import { chartOfAccounts, Account } from '../../dummy-data/chartOfAccounts';

// ─── Helpers ────────────────────────────────────────────────
const r2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) =>
  '$' +
  Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Simulate "prior period" as 85%-105% of current for comparison
const priorFactor = (seed: number) => 0.85 + ((seed * 7 + 3) % 20) / 100;

// ─── Build data from COA ────────────────────────────────────
const buildData = () => {
  const revenue = chartOfAccounts.filter((a) => a.type === 'revenue');
  const cogs = chartOfAccounts.filter(
    (a) => a.type === 'expense' && a.subType === 'Direct Cost',
  );
  const opEx = chartOfAccounts.filter(
    (a) => a.type === 'expense' && a.subType === 'Operating Expense',
  );
  const otherEx = chartOfAccounts.filter(
    (a) => a.type === 'expense' && a.subType === 'Other Expense',
  );

  const totalRevenue = r2(revenue.reduce((s, a) => s + a.currentBalance, 0));
  const totalCOGS = r2(cogs.reduce((s, a) => s + a.currentBalance, 0));
  const grossProfit = r2(totalRevenue - totalCOGS);
  const totalOpEx = r2(opEx.reduce((s, a) => s + a.currentBalance, 0));
  const totalOtherEx = r2(otherEx.reduce((s, a) => s + a.currentBalance, 0));
  const totalExpenses = r2(totalOpEx + totalOtherEx);
  const netIncome = r2(grossProfit - totalExpenses);

  return {
    revenue,
    cogs,
    opEx,
    otherEx,
    totalRevenue,
    totalCOGS,
    grossProfit,
    totalOpEx,
    totalOtherEx,
    totalExpenses,
    netIncome,
  };
};

// ─── Component ──────────────────────────────────────────────
const ProfitLossScreen: React.FC = () => {
  const navigation = useNavigation();
  const [startDate, setStartDate] = useState('2026-03-01');
  const [endDate, setEndDate] = useState('2026-03-31');
  const [showComparison, setShowComparison] = useState(false);

  const data = useMemo(buildData, []);

  const renderLine = (
    acct: Account,
    idx: number,
    isCOGS = false,
  ) => {
    const amt = acct.currentBalance;
    const prior = r2(amt * priorFactor(idx));
    const change = r2(amt - prior);
    const pctChange = prior !== 0 ? r2((change / Math.abs(prior)) * 100) : 0;

    return (
      <View key={acct.accountId} style={styles.lineRow}>
        <Text style={styles.lineName} numberOfLines={1}>
          {acct.accountNumber} – {acct.name}
        </Text>
        {showComparison ? (
          <View style={styles.compRow}>
            <Text style={styles.lineAmt}>{fmt(amt)}</Text>
            <Text style={styles.lineAmt}>{fmt(prior)}</Text>
            <Text
              style={[
                styles.changeAmt,
                { color: change >= 0 ? (isCOGS ? Colors.danger : Colors.success) : (isCOGS ? Colors.success : Colors.danger) },
              ]}
            >
              {change >= 0 ? '+' : '-'}{fmt(change)}
            </Text>
            <Text
              style={[
                styles.changeAmt,
                { color: change >= 0 ? (isCOGS ? Colors.danger : Colors.success) : (isCOGS ? Colors.success : Colors.danger) },
              ]}
            >
              {change >= 0 ? '+' : ''}{pctChange}%
            </Text>
          </View>
        ) : (
          <Text style={styles.lineAmt}>{fmt(amt)}</Text>
        )}
      </View>
    );
  };

  const renderTotal = (
    label: string,
    amount: number,
    bold = false,
    highlight?: string,
    priorAmount?: number,
  ) => {
    const prior = priorAmount ?? r2(amount * 0.92);
    const change = r2(amount - prior);
    const pct = prior !== 0 ? r2((change / Math.abs(prior)) * 100) : 0;

    return (
      <View
        style={[
          styles.totalRow,
          highlight ? { backgroundColor: highlight } : undefined,
        ]}
      >
        <Text style={[styles.totalLabel, bold && styles.boldTotal]}>
          {label}
        </Text>
        {showComparison ? (
          <View style={styles.compRow}>
            <Text style={[styles.totalAmt, bold && styles.boldTotal]}>
              {fmt(amount)}
            </Text>
            <Text style={[styles.totalAmt, bold && styles.boldTotal]}>
              {fmt(prior)}
            </Text>
            <Text
              style={[
                styles.changeAmt,
                { color: change >= 0 ? Colors.success : Colors.danger },
              ]}
            >
              {change >= 0 ? '+' : '-'}{fmt(change)}
            </Text>
            <Text
              style={[
                styles.changeAmt,
                { color: change >= 0 ? Colors.success : Colors.danger },
              ]}
            >
              {change >= 0 ? '+' : ''}{pct}%
            </Text>
          </View>
        ) : (
          <Text style={[styles.totalAmt, bold && styles.boldTotal]}>
            {amount < 0 ? `(${fmt(amount)})` : fmt(amount)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profit & Loss</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Date range + comparison toggle */}
      <View style={styles.controls}>
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>From</Text>
            <TextInput
              style={styles.dateInput}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.placeholder}
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>To</Text>
            <TextInput
              style={styles.dateInput}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.placeholder}
            />
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.compToggle,
            showComparison && styles.compToggleActive,
          ]}
          onPress={() => setShowComparison(!showComparison)}
        >
          <Text
            style={[
              styles.compToggleText,
              showComparison && styles.compToggleTextActive,
            ]}
          >
            {showComparison ? '✓ Comparison' : 'Compare'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Comparison column headers */}
      {showComparison && (
        <View style={styles.compHeader}>
          <Text style={styles.compHeaderLabel}>Account</Text>
          <View style={styles.compRow}>
            <Text style={styles.compCol}>Current</Text>
            <Text style={styles.compCol}>Prior</Text>
            <Text style={styles.compCol}>$ Chg</Text>
            <Text style={styles.compCol}>% Chg</Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Revenue */}
        <Text style={styles.sectionLabel}>REVENUE</Text>
        <View style={styles.card}>
          {data.revenue.map((a, i) => renderLine(a, i))}
          {renderTotal('Total Revenue', data.totalRevenue, true)}
        </View>

        {/* COGS */}
        <Text style={styles.sectionLabel}>COST OF GOODS SOLD</Text>
        <View style={styles.card}>
          {data.cogs.map((a, i) => renderLine(a, i, true))}
          {renderTotal('Total COGS', data.totalCOGS, true)}
        </View>

        {/* Gross Profit */}
        {renderTotal(
          'Gross Profit',
          data.grossProfit,
          true,
          Colors.successLight,
        )}

        {/* Operating Expenses */}
        <Text style={styles.sectionLabel}>OPERATING EXPENSES</Text>
        <View style={styles.card}>
          {data.opEx.map((a, i) => renderLine(a, i, true))}
          {renderTotal('Total Operating Expenses', data.totalOpEx, true)}
        </View>

        {/* Other Expenses */}
        <Text style={styles.sectionLabel}>OTHER EXPENSES</Text>
        <View style={styles.card}>
          {data.otherEx.map((a, i) => renderLine(a, i, true))}
          {renderTotal('Total Other Expenses', data.totalOtherEx, true)}
        </View>

        {/* Total Expenses */}
        {renderTotal('Total Expenses', data.totalExpenses, true)}

        {/* NET INCOME */}
        <View style={styles.netBox}>
          <Text style={styles.netLabel}>NET INCOME</Text>
          <Text
            style={[
              styles.netAmount,
              { color: data.netIncome >= 0 ? Colors.success : Colors.danger },
            ]}
          >
            {data.netIncome < 0
              ? `(${fmt(data.netIncome)})`
              : fmt(data.netIncome)}
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

  // Controls
  controls: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dateRow: { flexDirection: 'row', gap: Spacing.sm },
  dateField: { flex: 1 },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  compToggle: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compToggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  compToggleText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  compToggleTextActive: { color: Colors.white },

  // Comparison header
  compHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.borderLight,
  },
  compHeaderLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
  },
  compRow: { flexDirection: 'row', flex: 2 },
  compCol: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    textAlign: 'right',
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
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    ...Shadows.sm,
  },

  // Line rows
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
  },
  lineName: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  lineAmt: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
    textAlign: 'right',
    minWidth: 70,
  },
  changeAmt: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },

  // Totals
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: 2,
  },
  totalLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  totalAmt: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'right',
    minWidth: 80,
  },
  boldTotal: { fontWeight: '700' },

  // Net income box
  netBox: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  netLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  netAmount: {
    fontSize: 32,
    fontWeight: '800',
  },
});

export default ProfitLossScreen;
