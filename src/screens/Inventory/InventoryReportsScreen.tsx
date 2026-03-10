// ============================================================
// FINMATRIX - Inventory Reports Screen
// ============================================================
// Sub-menu with 4 report views:
//   1. Valuation Summary  (by category, with totals)
//   2. Stock Status        (all items with status indicators)
//   3. Low Stock Alert     (items at/below reorderPoint)
//   4. Turnover            (items with movement frequency via adjustmentStore)

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { fetchInventory } from './inventorySlice';
import { InventoryItem, Category } from '../../dummy-data/inventoryItems';
import { getAdjustmentsAPI } from '../../network/inventoryNetwork';
import { LOCATION_LABELS } from '../../models/inventoryModel';
import { ROUTES } from '../../navigations-map/Base';

type ReportType = 'menu' | 'valuation' | 'status' | 'lowStock' | 'turnover';

const REPORT_CARDS: { key: ReportType; icon: string; title: string; desc: string }[] = [
  { key: 'valuation', icon: '💰', title: 'Valuation Summary', desc: 'Inventory value by category with totals' },
  { key: 'status', icon: '📊', title: 'Stock Status', desc: 'All items with quantity & status indicators' },
  { key: 'lowStock', icon: '⚠️', title: 'Low Stock Alert', desc: 'Items at or below reorder point' },
  { key: 'turnover', icon: '🔄', title: 'Turnover', desc: 'Item movement frequency from adjustments' },
];

// ─── Helpers ────────────────────────────────────────────────
const fmtCurrency = (n: number) =>
  '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const statusColor = (item: InventoryItem): { label: string; color: string; bg: string } => {
  if (!item.isActive) return { label: 'Inactive', color: Colors.textTertiary, bg: Colors.borderLight };
  if (item.quantityOnHand <= 0) return { label: 'Out of Stock', color: Colors.danger, bg: Colors.dangerLight };
  if (item.quantityOnHand <= item.reorderPoint) return { label: 'Low Stock', color: Colors.warning, bg: Colors.warningLight };
  return { label: 'In Stock', color: Colors.success, bg: Colors.successLight };
};

// ─── Component ──────────────────────────────────────────────
const InventoryReportsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { items, isLoading } = useAppSelector((s) => s.inventory);
  const [report, setReport] = useState<ReportType>('menu');

  // Date-range filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const asOfLabel = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }, []);

  useEffect(() => {
    if (items.length === 0) dispatch(fetchInventory());
  }, [dispatch, items.length]);

  // ─── Valuation data ──────────────────────────────────
  const valuation = useMemo(() => {
    const cats: Record<string, { count: number; totalCost: number; totalRetail: number }> = {};
    items.forEach((i) => {
      if (!cats[i.category]) cats[i.category] = { count: 0, totalCost: 0, totalRetail: 0 };
      cats[i.category].count += i.quantityOnHand;
      cats[i.category].totalCost += i.quantityOnHand * i.unitCost;
      cats[i.category].totalRetail += i.quantityOnHand * i.sellingPrice;
    });
    const rows = Object.entries(cats)
      .map(([cat, d]) => ({ category: cat, ...d }))
      .sort((a, b) => b.totalCost - a.totalCost);
    const grandCost = rows.reduce((s, r) => s + r.totalCost, 0);
    const grandRetail = rows.reduce((s, r) => s + r.totalRetail, 0);
    const grandCount = rows.reduce((s, r) => s + r.count, 0);
    return { rows, grandCost, grandRetail, grandCount };
  }, [items]);

  // ─── Low stock data ──────────────────────────────────
  const lowStockItems = useMemo(
    () =>
      items
        .filter((i) => i.isActive && i.quantityOnHand <= i.reorderPoint)
        .sort((a, b) => a.quantityOnHand - b.quantityOnHand),
    [items]
  );

  // ─── Turnover data ───────────────────────────────────
  const [turnoverData, setTurnoverData] = useState<{ item: InventoryItem; adjustments: number }[]>([]);
  useEffect(() => {
    if (items.length === 0) return;
    getAdjustmentsAPI().then((adjs) => {
      // Filter by date range when set
      let filtered = adjs;
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!isNaN(from.getTime())) {
          filtered = filtered.filter((a) => new Date(a.date) >= from);
        }
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (!isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          filtered = filtered.filter((a) => new Date(a.date) <= to);
        }
      }
      const freq: Record<string, number> = {};
      filtered.forEach((a) => {
        freq[a.itemId] = (freq[a.itemId] || 0) + 1;
      });
      setTurnoverData(
        items
          .map((i) => ({ item: i, adjustments: freq[i.itemId] || 0 }))
          .sort((a, b) => b.adjustments - a.adjustments)
      );
    });
  }, [items, dateFrom, dateTo]);

  // ─── Loading ──────────────────────────────────────────
  if (isLoading && items.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // ─── Export Handler ───────────────────────────────────
  const handleExport = useCallback(() => {
    let text = `FinMatrix — ${REPORT_CARDS.find((r) => r.key === report)?.title || 'Report'}\n`;
    text += `Generated: ${new Date().toLocaleString()}\n\n`;

    if (report === 'valuation') {
      text += `Grand Totals:\n  Units: ${valuation.grandCount}\n  Cost: ${fmtCurrency(valuation.grandCost)}\n  Retail: ${fmtCurrency(valuation.grandRetail)}\n\nBy Category:\n`;
      valuation.rows.forEach((r) => {
        text += `  ${r.category}: ${r.count} units, Cost ${fmtCurrency(r.totalCost)}, Retail ${fmtCurrency(r.totalRetail)}\n`;
      });
    } else if (report === 'status') {
      text += `Total items: ${items.length}\n\n`;
      items.forEach((i) => {
        const s = statusColor(i);
        text += `${i.name} (${i.sku}): ${i.quantityOnHand} — ${s.label}\n`;
      });
    } else if (report === 'lowStock') {
      text += `${lowStockItems.length} items need attention:\n\n`;
      lowStockItems.forEach((i) => {
        text += `${i.name} (${i.sku}): On Hand ${i.quantityOnHand}, Reorder Pt ${i.reorderPoint}\n`;
      });
    } else if (report === 'turnover') {
      text += `Movement Frequency:\n\n`;
      turnoverData.slice(0, 30).forEach(({ item: i, adjustments: adj }) => {
        text += `${i.name}: ${i.quantityOnHand} on hand, ${adj} adjustments\n`;
      });
    }

    Alert.alert('Export Preview', text, [{ text: 'OK' }]);
  }, [report, valuation, items, lowStockItems, turnoverData]);

  // ─── Header ───────────────────────────────────────────
  const headerTitle = report === 'menu' ? 'Inventory Reports' : REPORT_CARDS.find((r) => r.key === report)?.title || '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (report === 'menu' ? navigation.goBack() : setReport('menu'))}
        >
          <Text style={styles.backBtn}>← {report === 'menu' ? 'Back' : 'Reports'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        {report !== 'menu' ? (
          <TouchableOpacity onPress={handleExport} style={{ width: 50, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 20 }}>📤</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      {/* ═══ Menu ══════════════════════════════════════════ */}
      {report === 'menu' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          {REPORT_CARDS.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={styles.menuCard}
              onPress={() => setReport(r.key)}
            >
              <Text style={styles.menuIcon}>{r.icon}</Text>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.menuTitle}>{r.title}</Text>
                <Text style={styles.menuDesc}>{r.desc}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}

          {/* Quick stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{items.length}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{items.filter((i) => i.isActive).length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: Colors.warning }]}>{lowStockItems.length}</Text>
              <Text style={styles.statLabel}>Low Stock</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ═══ Date Range Filter ════════════════════════════ */}
      {report !== 'menu' && (
        <View style={styles.dateRangeRow}>
          {report === 'turnover' ? (
            <>
              <View style={styles.dateField}>
                <Text style={styles.dateFieldLabel}>From</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.placeholder}
                  value={dateFrom}
                  onChangeText={setDateFrom}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateFieldLabel}>To</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.placeholder}
                  value={dateTo}
                  onChangeText={setDateTo}
                />
              </View>
            </>
          ) : (
            <Text style={styles.asOfText}>📅  As of {asOfLabel}</Text>
          )}
        </View>
      )}

      {/* ═══ Valuation Summary ═════════════════════════════ */}
      {report === 'valuation' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Grand totals */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Grand Totals</Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Units</Text>
              <Text style={styles.totalValue}>{valuation.grandCount.toLocaleString()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Cost Value</Text>
              <Text style={styles.totalValue}>{fmtCurrency(valuation.grandCost)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Retail Value</Text>
              <Text style={[styles.totalValue, { color: Colors.success }]}>
                {fmtCurrency(valuation.grandRetail)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Potential Margin</Text>
              <Text style={[styles.totalValue, { color: Colors.secondary }]}>
                {fmtCurrency(valuation.grandRetail - valuation.grandCost)}
              </Text>
            </View>
          </View>

          {/* By category */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>By Category</Text>
            {/* Column header */}
            <View style={styles.colRow}>
              <Text style={[styles.colHead, { flex: 1 }]}>Category</Text>
              <Text style={[styles.colHead, { width: 50, textAlign: 'right' }]}>Qty</Text>
              <Text style={[styles.colHead, { width: 90, textAlign: 'right' }]}>Cost</Text>
              <Text style={[styles.colHead, { width: 90, textAlign: 'right' }]}>Retail</Text>
            </View>
            {valuation.rows.map((r) => (
              <View key={r.category} style={styles.dataRow}>
                <Text style={[styles.dataCell, { flex: 1 }]}>{r.category}</Text>
                <Text style={[styles.dataCellNum, { width: 50 }]}>{r.count}</Text>
                <Text style={[styles.dataCellNum, { width: 90 }]}>{fmtCurrency(r.totalCost)}</Text>
                <Text style={[styles.dataCellNum, { width: 90 }]}>{fmtCurrency(r.totalRetail)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ═══ Stock Status ══════════════════════════════════ */}
      {report === 'status' && (
        <FlatList
          data={items}
          keyExtractor={(i) => i.itemId}
          contentContainerStyle={{ padding: Spacing.base, paddingBottom: 60 }}
          renderItem={({ item }) => {
            const s = statusColor(item);
            return (
              <TouchableOpacity
                style={styles.statusRow}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(ROUTES.INVENTORY_DETAIL, { itemId: item.itemId })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusName}>{item.name}</Text>
                  <Text style={styles.statusSku}>
                    {item.sku}  •  {LOCATION_LABELS[item.locationId] || item.locationId}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.statusQty}>{item.quantityOnHand}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: s.color }]}>{s.label}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ═══ Low Stock Alert ═══════════════════════════════ */}
      {report === 'lowStock' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          {lowStockItems.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>All Clear</Text>
              <Text style={styles.emptySub}>No items are at or below their reorder point.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} need attention
              </Text>
              {lowStockItems.map((item) => {
                const deficit = item.reorderPoint - item.quantityOnHand;
                const pct =
                  item.reorderPoint > 0
                    ? Math.min((item.quantityOnHand / item.reorderPoint) * 100, 100)
                    : 0;
                return (
                  <TouchableOpacity
                    key={item.itemId}
                    style={styles.lowRow}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate(ROUTES.INVENTORY_DETAIL, { itemId: item.itemId })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lowName}>{item.name}</Text>
                      <Text style={styles.lowSku}>{item.sku}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${pct}%`,
                              backgroundColor:
                                pct <= 25 ? Colors.danger : pct <= 60 ? Colors.warning : Colors.success,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', marginLeft: Spacing.sm }}>
                      <Text style={styles.lowQty}>{item.quantityOnHand}</Text>
                      <Text style={styles.lowReorder}>RP: {item.reorderPoint}</Text>
                      {deficit > 0 && (
                        <Text style={styles.lowDeficit}>Need {deficit} more</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* ═══ Turnover ══════════════════════════════════════ */}
      {report === 'turnover' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Movement Frequency (from Adjustments)</Text>
            {/* Column header */}
            <View style={styles.colRow}>
              <Text style={[styles.colHead, { flex: 1 }]}>Item</Text>
              <Text style={[styles.colHead, { width: 60, textAlign: 'center' }]}>On Hand</Text>
              <Text style={[styles.colHead, { width: 50, textAlign: 'center' }]}>Adj</Text>
              <Text style={[styles.colHead, { width: 70, textAlign: 'center' }]}>Activity</Text>
            </View>
            {turnoverData.slice(0, 30).map(({ item, adjustments: adj }) => {
              const activity = adj === 0 ? 'None' : adj <= 2 ? 'Low' : adj <= 4 ? 'Medium' : 'High';
              const actColor =
                activity === 'None'
                  ? Colors.textTertiary
                  : activity === 'Low'
                  ? Colors.info
                  : activity === 'Medium'
                  ? Colors.warning
                  : Colors.success;
              return (
                <View key={item.itemId} style={styles.dataRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.turnName}>{item.name}</Text>
                    <Text style={styles.turnSku}>{item.sku}</Text>
                  </View>
                  <Text style={[styles.dataCellNum, { width: 60 }]}>{item.quantityOnHand}</Text>
                  <Text style={[styles.dataCellNum, { width: 50 }]}>{adj}</Text>
                  <View
                    style={[
                      styles.actBadge,
                      { backgroundColor: actColor + '20' },
                    ]}
                  >
                    <Text style={[styles.actBadgeText, { color: actColor }]}>{activity}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  backBtn: { fontSize: 15, color: Colors.primary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: Spacing.base },

  // Date range
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  dateField: { flex: 1 },
  dateFieldLabel: { fontSize: 11, fontWeight: '600', color: Colors.textTertiary, marginBottom: 3, textTransform: 'uppercase' },
  dateInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    fontSize: 13,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  asOfText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

  // Menu cards
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  menuIcon: { fontSize: 28 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  menuDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  arrow: { fontSize: 22, color: Colors.textTertiary },

  // Quick stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statNum: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },

  // Totals
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  totalLabel: { fontSize: 14, color: Colors.textSecondary },
  totalValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },

  // Data table
  colRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  colHead: { fontSize: 11, fontWeight: '700', color: Colors.textTertiary, textTransform: 'uppercase' },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dataCell: { fontSize: 13, color: Colors.textPrimary },
  dataCellNum: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'right',
  },

  // Stock Status
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  statusName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  statusSku: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  statusQty: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginTop: 3,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },

  // Low stock
  lowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  lowName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  lowSku: { fontSize: 11, color: Colors.textTertiary, marginTop: 1, marginBottom: 6 },
  lowQty: { fontSize: 18, fontWeight: '700', color: Colors.danger },
  lowReorder: { fontSize: 11, color: Colors.textTertiary },
  lowDeficit: { fontSize: 11, fontWeight: '600', color: Colors.warning, marginTop: 2 },
  barTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  barFill: { height: 5, borderRadius: 3 },

  // Turnover
  turnName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  turnSku: { fontSize: 10, color: Colors.textTertiary },
  actBadge: {
    width: 70,
    alignItems: 'center',
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  actBadgeText: { fontSize: 11, fontWeight: '700' },

  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyIcon: { fontSize: 36, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  emptySub: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center' },
});

export default InventoryReportsScreen;
