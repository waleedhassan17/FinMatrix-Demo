// ============================================================
// FINMATRIX - AP Aging Screen
// ============================================================
// Table: Vendor | Current | 1-30 | 31-60 | 61-90 | 90+ | Total
// Calculated from bill due dates vs today. Same pattern as ARAgingScreen.

import React, { useMemo, useState } from 'react';
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
import { bills } from '../../dummy-data/bills';

const r2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) =>
  n === 0
    ? '—'
    : '$' +
      n.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

// ─── Build aging buckets ────────────────────────────────────
interface AgingRow {
  vendorId: string;
  vendorName: string;
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90plus: number;
  total: number;
}

const TODAY = new Date('2026-03-03');

const diffDays = (due: string) => {
  const d = new Date(due + 'T00:00:00');
  return Math.floor((TODAY.getTime() - d.getTime()) / 86400000);
};

const buildAging = (): { rows: AgingRow[]; totals: Omit<AgingRow, 'vendorId' | 'vendorName'> } => {
  // Only unpaid/partially paid bills with balance > 0
  const open = bills.filter(
    (b) =>
      b.status !== 'paid' &&
      b.status !== 'draft' &&
      b.total - b.amountPaid > 0,
  );

  const map = new Map<string, AgingRow>();

  for (const bill of open) {
    const balance = r2(bill.total - bill.amountPaid);
    const daysOverdue = diffDays(bill.dueDate);

    if (!map.has(bill.vendorId)) {
      map.set(bill.vendorId, {
        vendorId: bill.vendorId,
        vendorName: bill.vendorName,
        current: 0,
        days1_30: 0,
        days31_60: 0,
        days61_90: 0,
        days90plus: 0,
        total: 0,
      });
    }

    const row = map.get(bill.vendorId)!;
    if (daysOverdue <= 0) row.current = r2(row.current + balance);
    else if (daysOverdue <= 30) row.days1_30 = r2(row.days1_30 + balance);
    else if (daysOverdue <= 60) row.days31_60 = r2(row.days31_60 + balance);
    else if (daysOverdue <= 90) row.days61_90 = r2(row.days61_90 + balance);
    else row.days90plus = r2(row.days90plus + balance);
    row.total = r2(row.total + balance);
  }

  const rows = Array.from(map.values()).sort((a, b) => b.total - a.total);

  const totals = {
    current: r2(rows.reduce((s, r) => s + r.current, 0)),
    days1_30: r2(rows.reduce((s, r) => s + r.days1_30, 0)),
    days31_60: r2(rows.reduce((s, r) => s + r.days31_60, 0)),
    days61_90: r2(rows.reduce((s, r) => s + r.days61_90, 0)),
    days90plus: r2(rows.reduce((s, r) => s + r.days90plus, 0)),
    total: r2(rows.reduce((s, r) => s + r.total, 0)),
  };

  return { rows, totals };
};

const BUCKETS = ['Current', '1–30', '31–60', '61–90', '90+', 'Total'] as const;

// ─── Component ──────────────────────────────────────────────
const APAgingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { rows, totals } = useMemo(buildAging, []);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  };

  const getBucket = (row: AgingRow, idx: number) => {
    switch (idx) {
      case 0: return row.current;
      case 1: return row.days1_30;
      case 2: return row.days31_60;
      case 3: return row.days61_90;
      case 4: return row.days90plus;
      case 5: return row.total;
      default: return 0;
    }
  };

  const getTotalBucket = (idx: number) => {
    switch (idx) {
      case 0: return totals.current;
      case 1: return totals.days1_30;
      case 2: return totals.days31_60;
      case 3: return totals.days61_90;
      case 4: return totals.days90plus;
      case 5: return totals.total;
      default: return 0;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AP Aging</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Vendors</Text>
          <Text style={styles.summaryValue}>{rows.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Outstanding</Text>
          <Text style={[styles.summaryValue, { color: Colors.danger }]}>
            {fmt(totals.total)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Overdue</Text>
          <Text style={[styles.summaryValue, { color: Colors.warning }]}>
            {fmt(r2(totals.days1_30 + totals.days31_60 + totals.days61_90 + totals.days90plus))}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View>
          {/* Column headers */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thCell, styles.nameCol]}>Vendor</Text>
            {BUCKETS.map((b) => (
              <Text key={b} style={[styles.thCell, styles.amtCol]}>
                {b}
              </Text>
            ))}
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: Spacing.huge }}
            showsVerticalScrollIndicator={false}
          >
            {rows.map((row, rIdx) => (
              <View
                key={row.vendorId}
                style={[
                  styles.tableRow,
                  rIdx % 2 === 0 && styles.tableRowAlt,
                ]}
              >
                <Text style={[styles.tdCell, styles.nameCol]} numberOfLines={1}>
                  {row.vendorName}
                </Text>
                {BUCKETS.map((_, bIdx) => {
                  const val = getBucket(row, bIdx);
                  return (
                    <Text
                      key={bIdx}
                      style={[
                        styles.tdCell,
                        styles.amtCol,
                        bIdx === 5 && styles.totalCol,
                        bIdx >= 3 && val > 0 && { color: Colors.danger },
                      ]}
                    >
                      {fmt(val)}
                    </Text>
                  );
                })}
              </View>
            ))}

            {/* Totals row */}
            <View style={styles.tableTotalRow}>
              <Text style={[styles.totalCell, styles.nameCol]}>TOTALS</Text>
              {BUCKETS.map((_, bIdx) => (
                <Text
                  key={bIdx}
                  style={[styles.totalCell, styles.amtCol]}
                >
                  {fmt(getTotalBucket(bIdx))}
                </Text>
              ))}
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
  summaryValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
  },
  thCell: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    paddingHorizontal: 6,
  },
  nameCol: { width: 150 },
  amtCol: { width: 85, textAlign: 'right' },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tableRowAlt: { backgroundColor: Colors.background },
  tdCell: {
    fontSize: 12,
    color: Colors.textPrimary,
    paddingHorizontal: 6,
  },
  totalCol: { fontWeight: '700' },

  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary + '10',
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  totalCell: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    paddingHorizontal: 6,
  },
});

export default APAgingScreen;
