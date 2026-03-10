// ============================================================
// FINMATRIX - Analytics Screen (View-Based Charts)
// ============================================================
// 4 chart cards: Revenue trend (6-mo bars), Expense breakdown
// (horizontal bars), Top 5 customers (horizontal bars),
// AR aging (stacked bars).  Pure View-based — no external lib.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { chartOfAccounts } from '../../dummy-data/chartOfAccounts';
import { invoices } from '../../dummy-data/invoices';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - Spacing.base * 4;
const fmt = (n: number) =>
  '$' + (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toFixed(0));
const fmtFull = (n: number) =>
  '$' +
  n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

// ─── 1. Revenue Trend (6 months) ────────────────────────────
const MONTHS_LABELS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
// Simulated monthly revenue (based on total $182,850 spread across 6 months)
const REVENUE_DATA = [28400, 31200, 34800, 29500, 32100, 26850];
const REV_MAX = Math.max(...REVENUE_DATA);

// ─── 2. Expense Breakdown ───────────────────────────────────
const buildExpenseBreakdown = () => {
  const cats: Record<string, number> = {};
  for (const acc of chartOfAccounts) {
    if (acc.type !== 'expense' || acc.currentBalance <= 0) continue;
    const cat =
      acc.subType === 'Direct Cost'
        ? 'Cost of Goods Sold'
        : acc.subType === 'Other Expense'
        ? 'Other Expenses'
        : acc.name;
    cats[cat] = (cats[cat] || 0) + acc.currentBalance;
  }
  return Object.entries(cats)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
};

// ─── 3. Top 5 Customers ────────────────────────────────────
const buildTopCustomers = () => {
  const map = new Map<string, { name: string; total: number }>();
  for (const inv of invoices) {
    if (inv.status === 'cancelled') continue;
    const c = map.get(inv.customerId) ?? { name: inv.customerName, total: 0 };
    c.total += inv.total;
    map.set(inv.customerId, c);
  }
  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
};

// ─── 4. AR Aging Buckets ────────────────────────────────────
const TODAY = new Date('2026-03-03');
const buildARBuckets = () => {
  const buckets = { current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 };
  for (const inv of invoices) {
    if (inv.status === 'paid' || inv.status === 'cancelled') continue;
    const balance = inv.total - inv.amountPaid;
    if (balance <= 0) continue;
    const days = Math.floor(
      (TODAY.getTime() - new Date(inv.dueDate + 'T00:00:00').getTime()) / 86400000,
    );
    if (days <= 0) buckets.current += balance;
    else if (days <= 30) buckets.d1_30 += balance;
    else if (days <= 60) buckets.d31_60 += balance;
    else if (days <= 90) buckets.d61_90 += balance;
    else buckets.d90plus += balance;
  }
  return [
    { label: 'Current', value: buckets.current, color: Colors.success },
    { label: '1-30', value: buckets.d1_30, color: Colors.info },
    { label: '31-60', value: buckets.d31_60, color: Colors.warning },
    { label: '61-90', value: buckets.d61_90, color: '#E67E22' },
    { label: '90+', value: buckets.d90plus, color: Colors.danger },
  ];
};

const EXPENSE_COLORS = [
  Colors.primary,
  Colors.danger,
  Colors.success,
  Colors.warning,
  Colors.info,
  '#8E44AD',
  '#E67E22',
  Colors.primaryLight,
  Colors.secondaryDark,
  Colors.deliveryAccent,
];

// ─── Component ──────────────────────────────────────────────
const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation();
  const expenses = useMemo(buildExpenseBreakdown, []);
  const topCustomers = useMemo(buildTopCustomers, []);
  const arBuckets = useMemo(buildARBuckets, []);

  const expMax = expenses.length > 0 ? expenses[0].amount : 1;
  const custMax = topCustomers.length > 0 ? topCustomers[0].total : 1;
  const arMax = Math.max(...arBuckets.map((b) => b.value), 1);

  // Tooltip state
  const [activeTip, setActiveTip] = useState<{ chart: string; idx: number } | null>(null);
  const toggleTip = (chart: string, idx: number) =>
    setActiveTip((prev) =>
      prev?.chart === chart && prev?.idx === idx ? null : { chart, idx },
    );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Revenue Trend ─────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Revenue Trend (6 Months)</Text>
          <View style={styles.barChart}>
            {REVENUE_DATA.map((val, i) => (
              <TouchableOpacity
                key={i}
                style={styles.barCol}
                activeOpacity={0.7}
                onPress={() => toggleTip('rev', i)}
              >
                {activeTip?.chart === 'rev' && activeTip.idx === i && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>{fmtFull(val)}</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max((val / REV_MAX) * 120, 4),
                      backgroundColor: Colors.primary,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{MONTHS_LABELS[i]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.chartNote}>
            Total: {fmtFull(REVENUE_DATA.reduce((a, b) => a + b, 0))}
          </Text>
        </View>

        {/* ── Expense Breakdown ─────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Expense Breakdown</Text>
          {expenses.map((exp, i) => {
            const pct = (exp.amount / expMax) * 100;
            const color = EXPENSE_COLORS[i % EXPENSE_COLORS.length];
            return (
              <TouchableOpacity
                key={exp.name}
                style={styles.hBarRow}
                activeOpacity={0.7}
                onPress={() => toggleTip('exp', i)}
              >
                <Text style={styles.hBarLabel} numberOfLines={1}>
                  {exp.name}
                </Text>
                <View style={styles.hBarTrack}>
                  <View
                    style={[
                      styles.hBarFill,
                      { width: `${Math.max(pct, 2)}%`, backgroundColor: color },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.hBarValue,
                    activeTip?.chart === 'exp' && activeTip.idx === i && styles.hBarValueActive,
                  ]}
                >
                  {fmtFull(exp.amount)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Top 5 Customers ───────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top 5 Customers by Revenue</Text>
          {topCustomers.map((cust, i) => {
            const pct = (cust.total / custMax) * 100;
            return (
              <TouchableOpacity
                key={cust.name}
                style={styles.hBarRow}
                activeOpacity={0.7}
                onPress={() => toggleTip('cust', i)}
              >
                <Text style={styles.hBarLabel} numberOfLines={1}>
                  {cust.name}
                </Text>
                <View style={styles.hBarTrack}>
                  <View
                    style={[
                      styles.hBarFill,
                      { width: `${Math.max(pct, 2)}%`, backgroundColor: Colors.success },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.hBarValue,
                    activeTip?.chart === 'cust' && activeTip.idx === i && styles.hBarValueActive,
                  ]}
                >
                  {fmtFull(cust.total)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── AR Aging (Stacked Bars) ───────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AR Aging Overview</Text>
          <View style={styles.barChart}>
            {arBuckets.map((b, i) => (
              <TouchableOpacity
                key={b.label}
                style={styles.barCol}
                activeOpacity={0.7}
                onPress={() => toggleTip('ar', i)}
              >
                {activeTip?.chart === 'ar' && activeTip.idx === i && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipText}>{fmtFull(b.value)}</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max((b.value / arMax) * 120, 4),
                      backgroundColor: b.color,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.chartNote}>
            Total Outstanding:{' '}
            {fmtFull(arBuckets.reduce((s, b) => s + b.value, 0))}
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
  scroll: { padding: Spacing.base, paddingBottom: Spacing.huge },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  chartNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'right',
  },

  // Vertical bar chart
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
    paddingTop: 30,
  },
  barCol: { alignItems: 'center', flex: 1 },
  bar: {
    width: 28,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // Tooltip
  tooltip: {
    position: 'absolute',
    top: -6,
    backgroundColor: Colors.textPrimary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 10,
  },
  tooltipText: { color: Colors.white, fontSize: 10, fontWeight: '700' },

  // Horizontal bar rows
  hBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  hBarLabel: {
    width: 110,
    fontSize: 12,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  hBarTrack: {
    flex: 1,
    height: 16,
    backgroundColor: Colors.borderLight,
    borderRadius: 8,
    overflow: 'hidden',
  },
  hBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  hBarValue: {
    width: 65,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'right',
    marginLeft: Spacing.sm,
  },
  hBarValueActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default AnalyticsScreen;
