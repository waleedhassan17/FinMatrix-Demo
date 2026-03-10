// ============================================================
// FINMATRIX - Cash Flow Statement Screen
// ============================================================
// Three sections: Operating, Investing, Financing.
// Calculated from Chart of Accounts opening vs current balances.

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { chartOfAccounts, Account } from '../../dummy-data/chartOfAccounts';
import { formatCurrency } from '../../utils/formatters';

// ─── Helpers ────────────────────────────────────────────────
const findAccount = (num: string): Account | undefined =>
  chartOfAccounts.find((a) => a.accountNumber === num);

const balChange = (num: string): number => {
  const a = findAccount(num);
  if (!a) return 0;
  return a.currentBalance - a.openingBalance;
};

const currentBal = (num: string): number => findAccount(num)?.currentBalance ?? 0;

const buildCashFlow = () => {
  // ── OPERATING ──────────────────────────────────────
  // Net Income = Total Revenue - Total Expenses
  const revenue = chartOfAccounts
    .filter((a) => a.type === 'revenue')
    .reduce((s, a) => s + a.currentBalance, 0);
  const expenses = chartOfAccounts
    .filter((a) => a.type === 'expense')
    .reduce((s, a) => s + a.currentBalance, 0);
  const netIncome = revenue - expenses;

  // Adjustments
  const depreciation = Math.abs(balChange('1510')); // Accum. Depreciation increase → add back
  const arChange = -balChange('1100'); // AR decrease → cash inflow (positive)
  const inventoryChange = -balChange('1200'); // Inventory increase → cash outflow
  const apChange = balChange('2000'); // AP decrease → cash outflow

  const netOperating =
    netIncome + depreciation + arChange + inventoryChange + apChange;

  // ── INVESTING ──────────────────────────────────────
  const equipmentChange = -balChange('1500'); // Equipment purchase → negative
  const netInvesting = equipmentChange;

  // ── FINANCING ──────────────────────────────────────
  const notesPayableChange = balChange('2500'); // Notes decrease → outflow
  const ownerDraws = -Math.abs(balChange('3200')); // Draws are outflow
  const netFinancing = notesPayableChange + ownerDraws;

  // ── TOTALS ─────────────────────────────────────────
  const netChange = netOperating + netInvesting + netFinancing;

  // Beginning cash = sum of opening balances for cash accounts
  const cashAccounts = ['1000', '1010', '1020'];
  const beginningCash = cashAccounts.reduce(
    (s, num) => s + (findAccount(num)?.openingBalance ?? 0),
    0,
  );
  const endingCash = beginningCash + netChange;

  return {
    operating: {
      netIncome,
      depreciation,
      arChange,
      inventoryChange,
      apChange,
      total: netOperating,
    },
    investing: {
      equipmentChange,
      total: netInvesting,
    },
    financing: {
      notesPayableChange,
      ownerDraws,
      total: netFinancing,
    },
    netChange,
    beginningCash,
    endingCash,
  };
};

// ─── Line item row ──────────────────────────────────────────
const LineRow: React.FC<{ label: string; value: number; bold?: boolean; highlight?: boolean }> = ({
  label,
  value,
  bold,
  highlight,
}) => (
  <View style={[s.lineRow, highlight && s.lineHighlight]}>
    <Text style={[s.lineLabel, bold && s.bold]}>{label}</Text>
    <Text
      style={[
        s.lineValue,
        bold && s.bold,
        value > 0 && s.positive,
        value < 0 && s.negative,
      ]}
    >
      {formatCurrency(value)}
    </Text>
  </View>
);

// ─── Section header ─────────────────────────────────────────
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <View style={s.sectionHeader}>
    <Text style={s.sectionTitle}>{title}</Text>
  </View>
);

// ─── Component ──────────────────────────────────────────────
const CashFlowScreen: React.FC = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const data = useMemo(buildCashFlow, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Cash Flow Statement</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── OPERATING ACTIVITIES ────────────────── */}
        <View style={s.card}>
          <SectionHeader title="OPERATING ACTIVITIES" />
          <LineRow label="Net Income" value={data.operating.netIncome} />
          <Text style={s.adjustmentLabel}>Adjustments to reconcile:</Text>
          <LineRow label="  Depreciation" value={data.operating.depreciation} />
          <LineRow label="  AR Changes" value={data.operating.arChange} />
          <LineRow label="  Inventory Changes" value={data.operating.inventoryChange} />
          <LineRow label="  AP Changes" value={data.operating.apChange} />
          <LineRow label="Net Cash from Operations" value={data.operating.total} bold highlight />
        </View>

        {/* ── INVESTING ACTIVITIES ────────────────── */}
        <View style={s.card}>
          <SectionHeader title="INVESTING ACTIVITIES" />
          <LineRow label="  Equipment Purchases" value={data.investing.equipmentChange} />
          <LineRow label="Net Cash from Investing" value={data.investing.total} bold highlight />
        </View>

        {/* ── FINANCING ACTIVITIES ────────────────── */}
        <View style={s.card}>
          <SectionHeader title="FINANCING ACTIVITIES" />
          <LineRow label="  Notes Payable Changes" value={data.financing.notesPayableChange} />
          <LineRow label="  Owner Draws" value={data.financing.ownerDraws} />
          <LineRow label="Net Cash from Financing" value={data.financing.total} bold highlight />
        </View>

        {/* ── NET CHANGE ─────────────────────────── */}
        <View style={s.summaryCard}>
          <LineRow label="NET CHANGE IN CASH" value={data.netChange} bold />
          <View style={s.divider} />
          <LineRow label="Beginning Cash Balance" value={data.beginningCash} />
          <LineRow label="Ending Cash Balance" value={data.endingCash} bold highlight />
        </View>

        <View style={{ height: Spacing.huge }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
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
  scroll: { padding: Spacing.base, paddingBottom: 100 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  summaryCard: {
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  sectionHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.8,
  },
  adjustmentLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  lineHighlight: {
    backgroundColor: Colors.primary + '08',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  lineLabel: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
  lineValue: { fontSize: 14, color: Colors.textPrimary, textAlign: 'right' },
  bold: { fontWeight: '700' },
  positive: { color: Colors.success },
  negative: { color: Colors.danger },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
});

export default CashFlowScreen;
