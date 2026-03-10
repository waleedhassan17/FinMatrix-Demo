// ============================================================
// FINMATRIX - Sales by Customer Screen
// ============================================================
// Revenue breakdown by customer. Top 5 horizontal bar chart.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { invoices } from '../../dummy-data/invoices';
import { ROUTES } from '../../navigations-map/Base';
import { formatCurrency } from '../../utils/formatters';

const SCREEN_W = Dimensions.get('window').width;

// ─── Build data ─────────────────────────────────────────────
interface CustomerSales {
  customerId: string;
  customerName: string;
  invoiceCount: number;
  total: number;
  pctOfTotal: number;
}

const BAR_COLORS = [
  Colors.primary,
  Colors.secondary,
  Colors.success,
  Colors.warning,
  Colors.info,
];

const buildData = (): { rows: CustomerSales[]; grandTotal: number } => {
  const map = new Map<string, { name: string; count: number; total: number }>();

  for (const inv of invoices) {
    if (inv.status === 'cancelled' || inv.status === 'draft') continue;
    const existing = map.get(inv.customerId) ?? { name: inv.customerName, count: 0, total: 0 };
    existing.count += 1;
    existing.total += inv.total;
    map.set(inv.customerId, existing);
  }

  const grandTotal = Array.from(map.values()).reduce((s, v) => s + v.total, 0);

  const rows: CustomerSales[] = Array.from(map.entries())
    .map(([id, v]) => ({
      customerId: id,
      customerName: v.name,
      invoiceCount: v.count,
      total: v.total,
      pctOfTotal: grandTotal > 0 ? (v.total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return { rows, grandTotal };
};

// ─── Component ──────────────────────────────────────────────
const SalesByCustomerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const { rows, grandTotal } = useMemo(buildData, []);
  const top5 = rows.slice(0, 5);
  const barMax = top5.length > 0 ? top5[0].total : 1;
  const avgPerCustomer = rows.length > 0 ? grandTotal / rows.length : 0;

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
        <Text style={s.title}>Sales by Customer</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Summary */}
      <View style={s.summaryBar}>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Total Sales</Text>
          <Text style={s.summaryValue}>{formatCurrency(grandTotal)}</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Customers</Text>
          <Text style={s.summaryValue}>{rows.length}</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Avg / Customer</Text>
          <Text style={s.summaryValue}>{formatCurrency(avgPerCustomer)}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top 5 bar chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Top 5 Customers</Text>
          {top5.map((row, i) => {
            const pct = (row.total / barMax) * 100;
            const color = BAR_COLORS[i % BAR_COLORS.length];
            return (
              <View key={row.customerId} style={s.hBarRow}>
                <Text style={s.hBarLabel} numberOfLines={1}>{row.customerName}</Text>
                <View style={s.hBarTrack}>
                  <View style={[s.hBarFill, { width: `${Math.max(pct, 2)}%`, backgroundColor: color }]} />
                </View>
                <Text style={s.hBarVal}>{formatCurrency(row.total)}</Text>
              </View>
            );
          })}
        </View>

        {/* Table */}
        <View style={s.tableHeader}>
          <Text style={[s.thCell, { flex: 2 }]}>Customer</Text>
          <Text style={[s.thCell, s.numCol]}>Invoices</Text>
          <Text style={[s.thCell, s.amtCol]}>Total Sales</Text>
          <Text style={[s.thCell, { width: 50, textAlign: 'right' }]}>%</Text>
        </View>

        {rows.map((row, idx) => (
          <TouchableOpacity
            key={row.customerId}
            style={[s.tableRow, idx % 2 === 0 && s.tableRowAlt]}
            activeOpacity={0.6}
            onPress={() => navigation.navigate(ROUTES.CUSTOMER_DETAIL, { customerId: row.customerId })}
          >
            <View style={{ flex: 2, paddingHorizontal: 6 }}>
              <Text style={s.customerName} numberOfLines={1}>{row.customerName}</Text>
              {idx === 0 && <Text style={s.topBadge}>★ Top Customer</Text>}
            </View>
            <Text style={[s.tdCell, s.numCol]}>{row.invoiceCount}</Text>
            <Text style={[s.tdCell, s.amtCol]}>{formatCurrency(row.total)}</Text>
            <Text style={[s.tdCell, { width: 50, textAlign: 'right' }]}>
              {row.pctOfTotal.toFixed(1)}%
            </Text>
          </TouchableOpacity>
        ))}

        {/* Totals */}
        <View style={s.tableTotalRow}>
          <Text style={[s.totalCell, { flex: 2, paddingHorizontal: 6 }]}>TOTALS</Text>
          <Text style={[s.totalCell, s.numCol]}>
            {rows.reduce((acc, r) => acc + r.invoiceCount, 0)}
          </Text>
          <Text style={[s.totalCell, s.amtCol]}>{formatCurrency(grandTotal)}</Text>
          <Text style={[s.totalCell, { width: 50, textAlign: 'right' }]}>100%</Text>
        </View>

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

  summaryBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: Colors.white, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 2 },
  summaryValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  scroll: { paddingBottom: 100 },

  card: {
    margin: Spacing.base, backgroundColor: Colors.white,
    borderRadius: BorderRadius.md, padding: Spacing.base, ...Shadows.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  hBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  hBarLabel: { width: 100, fontSize: 11, color: Colors.textSecondary, marginRight: 8 },
  hBarTrack: { flex: 1, height: 14, backgroundColor: Colors.borderLight, borderRadius: 7, overflow: 'hidden' },
  hBarFill: { height: 14, borderRadius: 7 },
  hBarVal: { width: 80, fontSize: 11, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right', marginLeft: 8 },

  tableHeader: {
    flexDirection: 'row', backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm,
  },
  thCell: { fontSize: 11, fontWeight: '700', color: Colors.white },
  numCol: { width: 55, textAlign: 'right', paddingHorizontal: 6 },
  amtCol: { flex: 1, textAlign: 'right', paddingHorizontal: 6 },

  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  tableRowAlt: { backgroundColor: Colors.background },
  customerName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  topBadge: { fontSize: 10, color: Colors.warning, fontWeight: '700' },
  tdCell: { fontSize: 12, color: Colors.textPrimary },

  tableTotalRow: {
    flexDirection: 'row', paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primary + '10', borderTopWidth: 2, borderTopColor: Colors.primary,
  },
  totalCell: { fontSize: 12, fontWeight: '800', color: Colors.primary },
});

export default SalesByCustomerScreen;
