// ============================================================
// FINMATRIX - Payroll Summary Screen
// ============================================================
// DateRangePicker. Department grouping with subtotals.
// Summary cards: Total Gross, Deductions, Net, Employee Count.

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
import { payrollRuns, PayrollEntry } from '../../dummy-data/payrollRuns';
import { employees } from '../../dummy-data/employees';
import { ROUTES } from '../../navigations-map/Base';
import { formatCurrency, formatDate } from '../../utils/formatters';
import DateRangePicker from '../../Custom-Components/DateRangePicker';

// ─── Date presets ───────────────────────────────────────────
const PRESETS = [
  { label: 'Jan 1-15', from: '2026-01-01', to: '2026-01-15' },
  { label: 'Jan 16-31', from: '2026-01-16', to: '2026-01-31' },
  { label: 'Feb 1-15', from: '2026-02-01', to: '2026-02-15' },
  { label: 'All Periods', from: '2026-01-01', to: '2026-03-04' },
];

// ─── Build data ─────────────────────────────────────────────
interface DeptGroup {
  department: string;
  entries: (PayrollEntry & { department: string })[];
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
}

const empDeptMap = new Map(employees.map((e) => [e.employeeId, e.department]));

const buildData = (from: string, to: string): { groups: DeptGroup[]; totals: { gross: number; deductions: number; net: number; empCount: number } } => {
  // Collect entries from matching payroll runs
  const matchedEntries: (PayrollEntry & { department: string })[] = [];

  for (const run of payrollRuns) {
    if (run.payPeriodEnd < from || run.payPeriodStart > to) continue;
    for (const entry of run.entries) {
      const dept = empDeptMap.get(entry.employeeId) ?? 'Other';
      matchedEntries.push({ ...entry, department: dept });
    }
  }

  // Group by department
  const deptMap = new Map<string, (PayrollEntry & { department: string })[]>();
  for (const entry of matchedEntries) {
    const arr = deptMap.get(entry.department) ?? [];
    arr.push(entry);
    deptMap.set(entry.department, arr);
  }

  const groups: DeptGroup[] = Array.from(deptMap.entries())
    .map(([dept, entries]) => ({
      department: dept,
      entries: entries.sort((a, b) => b.grossPay - a.grossPay),
      totalGross: entries.reduce((s, e) => s + e.grossPay, 0),
      totalDeductions: entries.reduce((s, e) => s + e.totalDeductions, 0),
      totalNet: entries.reduce((s, e) => s + e.netPay, 0),
    }))
    .sort((a, b) => b.totalGross - a.totalGross);

  const totals = {
    gross: matchedEntries.reduce((s, e) => s + e.grossPay, 0),
    deductions: matchedEntries.reduce((s, e) => s + e.totalDeductions, 0),
    net: matchedEntries.reduce((s, e) => s + e.netPay, 0),
    empCount: new Set(matchedEntries.map((e) => e.employeeId)).size,
  };

  return { groups, totals };
};

// ─── Component ──────────────────────────────────────────────
const PayrollSummaryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-03-04');

  const { groups, totals } = useMemo(() => buildData(fromDate, toDate), [fromDate, toDate]);

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
        <Text style={s.title}>Payroll Summary</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Date Range */}
        <DateRangePicker
          fromDate={fromDate}
          toDate={toDate}
          onFromChange={setFromDate}
          onToChange={setToDate}
          presets={PRESETS}
        />

        {/* Summary cards */}
        <View style={s.cardsRow}>
          <View style={[s.summaryCard, { borderLeftColor: Colors.primary }]}>
            <Text style={s.cardLabel}>Total Gross</Text>
            <Text style={[s.cardValue, { color: Colors.primary }]}>{formatCurrency(totals.gross)}</Text>
          </View>
          <View style={[s.summaryCard, { borderLeftColor: Colors.danger }]}>
            <Text style={s.cardLabel}>Deductions</Text>
            <Text style={[s.cardValue, { color: Colors.danger }]}>{formatCurrency(totals.deductions)}</Text>
          </View>
        </View>
        <View style={s.cardsRow}>
          <View style={[s.summaryCard, { borderLeftColor: Colors.success }]}>
            <Text style={s.cardLabel}>Total Net</Text>
            <Text style={[s.cardValue, { color: Colors.success }]}>{formatCurrency(totals.net)}</Text>
          </View>
          <View style={[s.summaryCard, { borderLeftColor: Colors.info }]}>
            <Text style={s.cardLabel}>Employees</Text>
            <Text style={[s.cardValue, { color: Colors.info }]}>{totals.empCount}</Text>
          </View>
        </View>

        {/* Department groups */}
        {groups.map((group) => (
          <View key={group.department} style={s.deptGroup}>
            {/* Department header */}
            <View style={s.deptHeader}>
              <Text style={s.deptName}>{group.department}</Text>
              <Text style={s.deptTotal}>{formatCurrency(group.totalNet)} net</Text>
            </View>

            {/* Table header */}
            <View style={s.tableHeader}>
              <Text style={[s.thCell, { flex: 2 }]}>Employee</Text>
              <Text style={[s.thCell, s.amtCol]}>Gross</Text>
              <Text style={[s.thCell, s.amtCol]}>Deductions</Text>
              <Text style={[s.thCell, s.amtCol]}>Net Pay</Text>
            </View>

            {group.entries.map((entry, idx) => (
              <TouchableOpacity
                key={entry.employeeId + idx}
                style={[s.tableRow, idx % 2 === 0 && s.tableRowAlt]}
                activeOpacity={0.6}
                onPress={() => navigation.navigate(ROUTES.PAY_STUB, { employeeId: entry.employeeId })}
              >
                <Text style={[s.tdCell, { flex: 2, fontWeight: '600', paddingHorizontal: 6 }]} numberOfLines={1}>
                  {entry.employeeName}
                </Text>
                <Text style={[s.tdCell, s.amtCol]}>{formatCurrency(entry.grossPay)}</Text>
                <Text style={[s.tdCell, s.amtCol, { color: Colors.danger }]}>
                  {formatCurrency(entry.totalDeductions)}
                </Text>
                <Text style={[s.tdCell, s.amtCol, { fontWeight: '700', color: Colors.success }]}>
                  {formatCurrency(entry.netPay)}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Dept subtotals */}
            <View style={s.subtotalRow}>
              <Text style={[s.subtotalCell, { flex: 2, paddingHorizontal: 6 }]}>
                Subtotal ({group.entries.length})
              </Text>
              <Text style={[s.subtotalCell, s.amtCol]}>{formatCurrency(group.totalGross)}</Text>
              <Text style={[s.subtotalCell, s.amtCol]}>{formatCurrency(group.totalDeductions)}</Text>
              <Text style={[s.subtotalCell, s.amtCol]}>{formatCurrency(group.totalNet)}</Text>
            </View>
          </View>
        ))}

        {groups.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyText}>No payroll data for the selected period.</Text>
          </View>
        )}

        <View style={{ height: Spacing.huge }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingTop: SAFE_TOP_PADDING, paddingBottom: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },

  scroll: { paddingBottom: 100 },

  cardsRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm, gap: 8,
  },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.sm,
    padding: Spacing.sm, borderLeftWidth: 3, ...Shadows.sm,
  },
  cardLabel: { fontSize: 10, color: Colors.textTertiary, marginBottom: 2 },
  cardValue: { fontSize: 15, fontWeight: '700' },

  deptGroup: { marginTop: Spacing.lg },
  deptHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary + '08',
  },
  deptName: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  deptTotal: { fontSize: 13, fontWeight: '600', color: Colors.success },

  tableHeader: {
    flexDirection: 'row', backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm,
  },
  thCell: { fontSize: 11, fontWeight: '700', color: Colors.white },
  amtCol: { flex: 1, textAlign: 'right', paddingHorizontal: 6 },

  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  tableRowAlt: { backgroundColor: Colors.background },
  tdCell: { fontSize: 12, color: Colors.textPrimary },

  subtotalRow: {
    flexDirection: 'row', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primary + '10', borderTopWidth: 1, borderTopColor: Colors.primary + '30',
  },
  subtotalCell: { fontSize: 11, fontWeight: '700', color: Colors.primary, textAlign: 'right' },

  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textTertiary },
});

export default PayrollSummaryScreen;
