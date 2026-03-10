// ============================================================
// FINMATRIX - Sales Tax Report Screen
// ============================================================
// DateRangePicker + Tax table: Name | Rate | Collected | Paid | Net Liability.

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
import { taxRates, TaxRate } from '../../dummy-data/taxRates';
import { invoices } from '../../dummy-data/invoices';
import { bills } from '../../dummy-data/bills';
import { ROUTES } from '../../navigations-map/Base';
import { formatCurrency, formatDate } from '../../utils/formatters';
import DateRangePicker from '../../Custom-Components/DateRangePicker';

// ─── Date presets ───────────────────────────────────────────
const PRESETS = [
  { label: 'This Month', from: '2026-03-01', to: '2026-03-31' },
  { label: 'Last Month', from: '2026-02-01', to: '2026-02-28' },
  { label: 'This Quarter', from: '2026-01-01', to: '2026-03-31' },
  { label: 'Year to Date', from: '2026-01-01', to: '2026-03-04' },
];

// ─── Build data ─────────────────────────────────────────────
interface TaxRow {
  taxId: string;
  name: string;
  rate: number;
  collected: number;
  paid: number;
  netLiability: number;
}

const buildTaxData = (from: string, to: string): TaxRow[] => {
  const activeTaxes = taxRates.filter((t) => t.isActive);

  return activeTaxes.map((tax) => {
    // Tax collected = sum of (line.qty * line.rate * line.taxRate / 100) for matching invoices
    let collected = 0;
    for (const inv of invoices) {
      if (inv.status === 'cancelled' || inv.status === 'draft') continue;
      if (inv.date < from || inv.date > to) continue;
      for (const line of inv.lines) {
        if (line.taxRate === tax.rate) {
          collected += (line.quantity * line.rate * line.taxRate) / 100;
        }
      }
    }

    // Tax paid = sum of (line.amount * line.taxRate / 100) for matching bills
    let paid = 0;
    for (const bill of bills) {
      if (bill.status === 'draft') continue;
      if (bill.date < from || bill.date > to) continue;
      for (const line of bill.lines) {
        if (line.taxRate === tax.rate) {
          paid += (line.amount * line.taxRate) / 100;
        }
      }
    }

    collected = Math.round(collected * 100) / 100;
    paid = Math.round(paid * 100) / 100;

    return {
      taxId: tax.taxId,
      name: tax.name,
      rate: tax.rate,
      collected,
      paid,
      netLiability: Math.round((collected - paid) * 100) / 100,
    };
  });
};

// ─── Component ──────────────────────────────────────────────
const SalesTaxReportScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-03-04');

  const rows = useMemo(() => buildTaxData(fromDate, toDate), [fromDate, toDate]);

  const totals = useMemo(() => {
    const t = { collected: 0, paid: 0, net: 0 };
    for (const r of rows) {
      t.collected += r.collected;
      t.paid += r.paid;
      t.net += r.netLiability;
    }
    return { collected: Math.round(t.collected * 100) / 100, paid: Math.round(t.paid * 100) / 100, net: Math.round(t.net * 100) / 100 };
  }, [rows]);

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
        <Text style={s.title}>Sales Tax Report</Text>
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
        <View style={s.summaryRow}>
          <View style={[s.summaryCard, { borderLeftColor: Colors.success }]}>
            <Text style={s.summaryLabel}>Tax Collected</Text>
            <Text style={[s.summaryValue, { color: Colors.success }]}>{formatCurrency(totals.collected)}</Text>
          </View>
          <View style={[s.summaryCard, { borderLeftColor: Colors.danger }]}>
            <Text style={s.summaryLabel}>Tax Paid</Text>
            <Text style={[s.summaryValue, { color: Colors.danger }]}>{formatCurrency(totals.paid)}</Text>
          </View>
          <View style={[s.summaryCard, { borderLeftColor: Colors.warning }]}>
            <Text style={s.summaryLabel}>Net Liability</Text>
            <Text style={[s.summaryValue, { color: Colors.warning }]}>{formatCurrency(totals.net)}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={s.tableHeader}>
          <Text style={[s.thCell, { flex: 2 }]}>Tax Name</Text>
          <Text style={[s.thCell, { width: 45, textAlign: 'right' }]}>Rate</Text>
          <Text style={[s.thCell, s.amtCol]}>Collected</Text>
          <Text style={[s.thCell, s.amtCol]}>Paid</Text>
          <Text style={[s.thCell, s.amtCol]}>Net</Text>
        </View>

        {rows.map((row, idx) => (
          <View key={row.taxId} style={[s.tableRow, idx % 2 === 0 && s.tableRowAlt]}>
            <Text style={[s.tdCell, { flex: 2, fontWeight: '600', paddingHorizontal: 6 }]}>
              {row.name}
            </Text>
            <Text style={[s.tdCell, { width: 45, textAlign: 'right' }]}>{row.rate}%</Text>
            <Text style={[s.tdCell, s.amtCol, { color: Colors.success }]}>
              {formatCurrency(row.collected)}
            </Text>
            <Text style={[s.tdCell, s.amtCol, { color: Colors.danger }]}>
              {formatCurrency(row.paid)}
            </Text>
            <Text style={[s.tdCell, s.amtCol, { fontWeight: '700', color: row.netLiability >= 0 ? Colors.warning : Colors.success }]}>
              {formatCurrency(row.netLiability)}
            </Text>
          </View>
        ))}

        {/* Totals */}
        <View style={s.tableTotalRow}>
          <Text style={[s.totalCell, { flex: 2, paddingHorizontal: 6 }]}>TOTALS</Text>
          <Text style={[s.totalCell, { width: 45 }]} />
          <Text style={[s.totalCell, s.amtCol]}>{formatCurrency(totals.collected)}</Text>
          <Text style={[s.totalCell, s.amtCol]}>{formatCurrency(totals.paid)}</Text>
          <Text style={[s.totalCell, s.amtCol]}>{formatCurrency(totals.net)}</Text>
        </View>

        {/* Record Payment button */}
        <TouchableOpacity
          style={s.actionBtn}
          onPress={() => navigation.navigate(ROUTES.TAX_PAYMENT)}
        >
          <Text style={s.actionBtnText}>Record Tax Payment</Text>
        </TouchableOpacity>

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

  summaryRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, gap: 8,
  },
  summaryCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.sm,
    padding: Spacing.sm, borderLeftWidth: 3, ...Shadows.sm,
  },
  summaryLabel: { fontSize: 10, color: Colors.textTertiary, marginBottom: 2 },
  summaryValue: { fontSize: 14, fontWeight: '700' },

  tableHeader: {
    flexDirection: 'row', backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm,
  },
  thCell: { fontSize: 11, fontWeight: '700', color: Colors.white },
  amtCol: { flex: 1, textAlign: 'right', paddingHorizontal: 6 },

  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  tableRowAlt: { backgroundColor: Colors.background },
  tdCell: { fontSize: 12, color: Colors.textPrimary },

  tableTotalRow: {
    flexDirection: 'row', paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primary + '10', borderTopWidth: 2, borderTopColor: Colors.primary,
  },
  totalCell: { fontSize: 12, fontWeight: '800', color: Colors.primary, textAlign: 'right' },

  actionBtn: {
    marginHorizontal: Spacing.base, marginTop: Spacing.lg,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', ...Shadows.sm,
  },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});

export default SalesTaxReportScreen;
