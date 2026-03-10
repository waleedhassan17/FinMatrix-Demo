// ============================================================
// FINMATRIX - Budget vs Actual Screen
// ============================================================
// Table: Account | Budget | Actual | Variance $ | Variance %
// Green = under budget, Red = over.  Monthly bar chart.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { budgets } from '../../dummy-data/budgets';
import { chartOfAccounts } from '../../dummy-data/chartOfAccounts';

const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtCur = (n: number) =>
  (n < 0 ? '-' : '') +
  '$' +
  Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

// Simulate monthly actuals: distribute COA currentBalance evenly across
// Jan-Feb (elapsed months) so data looks realistic. Remaining months = 0.
const ELAPSED_MONTHS = 2; // Jan & Feb 2026 are "actual"

const buildRows = (budgetId: string) => {
  const budget = budgets.find((b) => b.budgetId === budgetId) ?? budgets[0];
  if (!budget) return { rows: [], monthlyBudget: [], monthlyActual: [] };

  const rows = budget.lineItems.map((li) => {
    const coaAccount = chartOfAccounts.find((a) => a.accountId === li.accountId);
    const actualAnnual = coaAccount ? coaAccount.currentBalance : 0;

    // YTD budget = sum of first ELAPSED_MONTHS
    const ytdBudget = li.monthly.slice(0, ELAPSED_MONTHS).reduce((a, b) => a + b, 0);
    // YTD actual approximation: proportion of annual actual
    const ytdActual = Math.round(actualAnnual * (ELAPSED_MONTHS / 12));

    const variance = ytdBudget - ytdActual; // positive = under budget
    const variancePct = ytdBudget !== 0 ? (variance / ytdBudget) * 100 : 0;

    return {
      accountId: li.accountId,
      accountNumber: li.accountNumber,
      accountName: li.accountName,
      budget: ytdBudget,
      actual: ytdActual,
      variance,
      variancePct,
    };
  });

  // Monthly chart data
  const monthlyBudget = Array(12).fill(0) as number[];
  const monthlyActual = Array(12).fill(0) as number[];

  for (const li of budget.lineItems) {
    for (let m = 0; m < 12; m++) {
      monthlyBudget[m] += li.monthly[m];
    }
  }
  // Actuals only for elapsed months
  const totalActual = chartOfAccounts
    .filter((a) => a.type === 'expense')
    .reduce((s, a) => s + a.currentBalance, 0);
  // Simple 50/50 split for Jan/Feb
  monthlyActual[0] = Math.round(totalActual * 0.47);
  monthlyActual[1] = totalActual - monthlyActual[0];

  return { rows, monthlyBudget, monthlyActual };
};

const BudgetVsActualScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const budgetId = route.params?.budgetId ?? budgets[0]?.budgetId;

  const { rows, monthlyBudget, monthlyActual } = useMemo(
    () => buildRows(budgetId),
    [budgetId],
  );

  const totBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totActual = rows.reduce((s, r) => s + r.actual, 0);
  const totVariance = totBudget - totActual;
  const totVarPct = totBudget !== 0 ? (totVariance / totBudget) * 100 : 0;

  // Chart max for bar height
  const chartMax = Math.max(
    ...monthlyBudget.slice(0, ELAPSED_MONTHS),
    ...monthlyActual.slice(0, ELAPSED_MONTHS),
    1,
  );

  const [activeTip, setActiveTip] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Budget vs Actual</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Summary */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>YTD Budget</Text>
          <Text style={styles.summaryValue}>{fmtCur(totBudget)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>YTD Actual</Text>
          <Text style={styles.summaryValue}>{fmtCur(totActual)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Variance</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: totVariance >= 0 ? Colors.success : Colors.danger },
            ]}
          >
            {fmtCur(totVariance)} ({totVarPct.toFixed(1)}%)
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: Spacing.huge }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Monthly Bar Chart ────────────────────────── */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Monthly Budget vs Actual</Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>Budget</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.legendText}>Actual</Text>
            </View>
          </View>
          <View style={styles.barChart}>
            {MO.slice(0, 6).map((m, i) => {
              const budH = i < ELAPSED_MONTHS ? (monthlyBudget[i] / chartMax) * 100 : 0;
              const actH = i < ELAPSED_MONTHS ? (monthlyActual[i] / chartMax) * 100 : 0;
              const future = i >= ELAPSED_MONTHS;
              return (
                <TouchableOpacity
                  key={m}
                  style={styles.barGroup}
                  activeOpacity={0.7}
                  onPress={() => setActiveTip(activeTip === i ? null : i)}
                >
                  {activeTip === i && i < ELAPSED_MONTHS && (
                    <View style={styles.tooltip}>
                      <Text style={styles.tipText}>
                        B: {fmtCur(monthlyBudget[i])}
                      </Text>
                      <Text style={styles.tipText}>
                        A: {fmtCur(monthlyActual[i])}
                      </Text>
                    </View>
                  )}
                  <View style={styles.barPair}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(budH, 2),
                          backgroundColor: future
                            ? Colors.borderLight
                            : Colors.primary,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(actH, 2),
                          backgroundColor: future
                            ? Colors.borderLight
                            : Colors.success,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, future && { color: Colors.textDisabled }]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Account Table ────────────────────────────── */}
        <View style={styles.tableCard}>
          <Text style={styles.cardTitle}>Account Detail (YTD)</Text>

          {/* Table header */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.thRow}>
                <Text style={[styles.th, styles.nameCol]}>Account</Text>
                <Text style={[styles.th, styles.numCol]}>Budget</Text>
                <Text style={[styles.th, styles.numCol]}>Actual</Text>
                <Text style={[styles.th, styles.numCol]}>Var $</Text>
                <Text style={[styles.th, styles.numCol]}>Var %</Text>
              </View>

              {rows.map((row, idx) => {
                const over = row.variance < 0;
                return (
                  <View
                    key={row.accountId}
                    style={[styles.tr, idx % 2 === 0 && styles.trAlt]}
                  >
                    <View style={styles.nameCol}>
                      <Text style={styles.cellAcctNum}>{row.accountNumber}</Text>
                      <Text style={styles.cellAcctName} numberOfLines={1}>
                        {row.accountName}
                      </Text>
                    </View>
                    <Text style={[styles.cellNum, styles.numCol]}>
                      {fmtCur(row.budget)}
                    </Text>
                    <Text style={[styles.cellNum, styles.numCol]}>
                      {fmtCur(row.actual)}
                    </Text>
                    <Text
                      style={[
                        styles.cellNum,
                        styles.numCol,
                        { color: over ? Colors.danger : Colors.success },
                      ]}
                    >
                      {fmtCur(row.variance)}
                    </Text>
                    <Text
                      style={[
                        styles.cellNum,
                        styles.numCol,
                        { color: over ? Colors.danger : Colors.success },
                      ]}
                    >
                      {row.variancePct.toFixed(1)}%
                    </Text>
                  </View>
                );
              })}

              {/* Totals */}
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, styles.nameCol]}>TOTALS</Text>
                <Text style={[styles.totalCell, styles.numCol]}>
                  {fmtCur(totBudget)}
                </Text>
                <Text style={[styles.totalCell, styles.numCol]}>
                  {fmtCur(totActual)}
                </Text>
                <Text
                  style={[
                    styles.totalCell,
                    styles.numCol,
                    { color: totVariance >= 0 ? Colors.success : Colors.danger },
                  ]}
                >
                  {fmtCur(totVariance)}
                </Text>
                <Text
                  style={[
                    styles.totalCell,
                    styles.numCol,
                    { color: totVariance >= 0 ? Colors.success : Colors.danger },
                  ]}
                >
                  {totVarPct.toFixed(1)}%
                </Text>
              </View>
            </View>
          </ScrollView>
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

  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 2 },
  summaryValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },

  // Chart card
  chartCard: {
    margin: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  legend: { flexDirection: 'row', marginBottom: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: Spacing.base },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  legendText: { fontSize: 11, color: Colors.textSecondary },

  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 130,
    paddingTop: 24,
  },
  barGroup: { alignItems: 'center', flex: 1 },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 14, borderRadius: 3, minHeight: 2 },
  barLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 4 },
  tooltip: {
    position: 'absolute',
    top: -8,
    backgroundColor: Colors.textPrimary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 10,
  },
  tipText: { color: Colors.white, fontSize: 9, fontWeight: '600' },

  // Table card
  tableCard: {
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
  },
  th: { fontSize: 10, fontWeight: '700', color: Colors.white, paddingHorizontal: 4 },
  nameCol: { width: 140, paddingHorizontal: 4 },
  numCol: { width: 75, textAlign: 'right', paddingHorizontal: 4 },

  tr: {
    flexDirection: 'row',
    paddingVertical: 7,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    alignItems: 'center',
  },
  trAlt: { backgroundColor: Colors.background },
  cellAcctNum: { fontSize: 10, color: Colors.textTertiary },
  cellAcctName: { fontSize: 12, color: Colors.textPrimary, fontWeight: '500' },
  cellNum: { fontSize: 12, color: Colors.textPrimary },

  totalRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary + '10',
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    alignItems: 'center',
  },
  totalLabel: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  totalCell: { fontSize: 12, fontWeight: '700', color: Colors.primary, textAlign: 'right', paddingHorizontal: 4 },
});

export default BudgetVsActualScreen;
