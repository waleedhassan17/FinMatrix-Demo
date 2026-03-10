// ============================================================
// FINMATRIX - Sales by Item Screen
// ============================================================
// Revenue breakdown by item/description from invoice line items.
// Top 10 bar visualization.

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
import { invoices } from '../../dummy-data/invoices';
import { formatCurrency } from '../../utils/formatters';

// ─── Build data ─────────────────────────────────────────────
interface ItemSales {
  description: string;
  qtySold: number;
  revenue: number;
  pctOfRevenue: number;
}

const BAR_COLORS = [
  Colors.primary, Colors.secondary, Colors.success, Colors.warning,
  Colors.info, '#8E44AD', '#E67E22', Colors.danger, Colors.primaryLight, Colors.secondaryDark,
];

const buildData = (): { rows: ItemSales[]; totalRevenue: number } => {
  const map = new Map<string, { qty: number; revenue: number }>();

  for (const inv of invoices) {
    if (inv.status === 'cancelled' || inv.status === 'draft') continue;
    for (const line of inv.lines) {
      const existing = map.get(line.description) ?? { qty: 0, revenue: 0 };
      existing.qty += line.quantity;
      existing.revenue += line.amount;
      map.set(line.description, existing);
    }
  }

  const totalRevenue = Array.from(map.values()).reduce((s, v) => s + v.revenue, 0);

  const rows: ItemSales[] = Array.from(map.entries())
    .map(([desc, v]) => ({
      description: desc,
      qtySold: v.qty,
      revenue: v.revenue,
      pctOfRevenue: totalRevenue > 0 ? (v.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return { rows, totalRevenue };
};

// ─── Component ──────────────────────────────────────────────
const SalesByItemScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const { rows, totalRevenue } = useMemo(buildData, []);
  const top10 = rows.slice(0, 10);
  const barMax = top10.length > 0 ? top10[0].revenue : 1;

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
        <Text style={s.title}>Sales by Item</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Summary */}
      <View style={s.summaryBar}>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Total Revenue</Text>
          <Text style={s.summaryValue}>{formatCurrency(totalRevenue)}</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Unique Items</Text>
          <Text style={s.summaryValue}>{rows.length}</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Total Qty Sold</Text>
          <Text style={s.summaryValue}>
            {rows.reduce((s, r) => s + r.qtySold, 0)}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top 10 bar chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Top 10 Items by Revenue</Text>
          {top10.map((row, i) => {
            const pct = (row.revenue / barMax) * 100;
            const color = BAR_COLORS[i % BAR_COLORS.length];
            return (
              <View key={row.description} style={s.hBarRow}>
                <Text style={s.hBarLabel} numberOfLines={1}>{row.description}</Text>
                <View style={s.hBarTrack}>
                  <View style={[s.hBarFill, { width: `${Math.max(pct, 2)}%`, backgroundColor: color }]} />
                </View>
                <Text style={s.hBarVal}>{formatCurrency(row.revenue)}</Text>
              </View>
            );
          })}
        </View>

        {/* Table */}
        <View style={s.tableHeader}>
          <Text style={[s.thCell, { flex: 2 }]}>Item / Description</Text>
          <Text style={[s.thCell, s.numCol]}>Qty Sold</Text>
          <Text style={[s.thCell, s.amtCol]}>Revenue</Text>
          <Text style={[s.thCell, { width: 50, textAlign: 'right' }]}>%</Text>
        </View>

        {rows.map((row, idx) => (
          <View
            key={row.description}
            style={[s.tableRow, idx % 2 === 0 && s.tableRowAlt]}
          >
            <Text style={[s.tdCell, { flex: 2, paddingHorizontal: 6, fontWeight: '600' }]} numberOfLines={1}>
              {row.description}
            </Text>
            <Text style={[s.tdCell, s.numCol]}>{row.qtySold}</Text>
            <Text style={[s.tdCell, s.amtCol]}>{formatCurrency(row.revenue)}</Text>
            <Text style={[s.tdCell, { width: 50, textAlign: 'right' }]}>
              {row.pctOfRevenue.toFixed(1)}%
            </Text>
          </View>
        ))}

        {/* Totals */}
        <View style={s.tableTotalRow}>
          <Text style={[s.totalCell, { flex: 2, paddingHorizontal: 6 }]}>TOTALS</Text>
          <Text style={[s.totalCell, s.numCol]}>
            {rows.reduce((acc, r) => acc + r.qtySold, 0)}
          </Text>
          <Text style={[s.totalCell, s.amtCol]}>{formatCurrency(totalRevenue)}</Text>
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
  hBarLabel: { width: 110, fontSize: 11, color: Colors.textSecondary, marginRight: 8 },
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
  tdCell: { fontSize: 12, color: Colors.textPrimary },

  tableTotalRow: {
    flexDirection: 'row', paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primary + '10', borderTopWidth: 2, borderTopColor: Colors.primary,
  },
  totalCell: { fontSize: 12, fontWeight: '800', color: Colors.primary },
});

export default SalesByItemScreen;
