// ============================================================
// FINMATRIX - Inventory Valuation Screen
// ============================================================
// Table: Item | SKU | Qty | Unit Cost | Value  grouped by Category
// Grand total at bottom. Uses inventoryItems dummy data.

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { inventoryItems } from '../../dummy-data/inventoryItems';

const r2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) =>
  '$' +
  n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const fmtQty = (n: number) => n.toLocaleString('en-US');

// ─── Build grouped data ─────────────────────────────────────
interface ItemRow {
  itemId: string;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
  value: number;
}

interface CategoryGroup {
  category: string;
  items: ItemRow[];
  totalQty: number;
  totalValue: number;
}

const buildValuation = (): { groups: CategoryGroup[]; grandTotalQty: number; grandTotalValue: number; totalItems: number } => {
  const active = inventoryItems.filter((it) => it.isActive);

  const catMap = new Map<string, ItemRow[]>();
  for (const it of active) {
    const row: ItemRow = {
      itemId: it.itemId,
      name: it.name,
      sku: it.sku,
      quantity: it.quantityOnHand,
      unitCost: it.unitCost,
      value: r2(it.quantityOnHand * it.unitCost),
    };
    const arr = catMap.get(it.category) ?? [];
    arr.push(row);
    catMap.set(it.category, arr);
  }

  const groups: CategoryGroup[] = [];
  for (const [category, items] of catMap) {
    items.sort((a, b) => a.name.localeCompare(b.name));
    groups.push({
      category,
      items,
      totalQty: items.reduce((s, r) => s + r.quantity, 0),
      totalValue: r2(items.reduce((s, r) => s + r.value, 0)),
    });
  }
  groups.sort((a, b) => b.totalValue - a.totalValue);

  return {
    groups,
    grandTotalQty: groups.reduce((s, g) => s + g.totalQty, 0),
    grandTotalValue: r2(groups.reduce((s, g) => s + g.totalValue, 0)),
    totalItems: active.length,
  };
};

// ─── Component ──────────────────────────────────────────────
const InventoryValuationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { groups, grandTotalQty, grandTotalValue, totalItems } = useMemo(buildValuation, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Inventory Valuation</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Categories</Text>
          <Text style={styles.summaryValue}>{groups.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Items</Text>
          <Text style={styles.summaryValue}>{totalItems}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Units</Text>
          <Text style={styles.summaryValue}>{fmtQty(grandTotalQty)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Value</Text>
          <Text style={[styles.summaryValue, { color: Colors.success }]}>
            {fmt(grandTotalValue)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.huge }}>
        {groups.map((group) => (
          <View key={group.category} style={styles.section}>
            {/* Category header */}
            <View style={styles.catHeader}>
              <Text style={styles.catName}>{group.category}</Text>
              <Text style={styles.catTotal}>{fmt(group.totalValue)}</Text>
            </View>

            {/* Column headers */}
            <View style={styles.colHeader}>
              <Text style={[styles.colText, styles.nameCol]}>Item</Text>
              <Text style={[styles.colText, styles.skuCol]}>SKU</Text>
              <Text style={[styles.colText, styles.numCol]}>Qty</Text>
              <Text style={[styles.colText, styles.numCol]}>Cost</Text>
              <Text style={[styles.colText, styles.numCol]}>Value</Text>
            </View>

            {group.items.map((item, idx) => (
              <View
                key={item.itemId}
                style={[styles.itemRow, idx % 2 === 0 && styles.itemRowAlt]}
              >
                <Text style={[styles.cellText, styles.nameCol]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.cellText, styles.skuCol, { color: Colors.textTertiary }]}>
                  {item.sku}
                </Text>
                <Text
                  style={[
                    styles.cellText,
                    styles.numCol,
                    item.quantity === 0 && { color: Colors.danger },
                  ]}
                >
                  {fmtQty(item.quantity)}
                </Text>
                <Text style={[styles.cellText, styles.numCol]}>{fmt(item.unitCost)}</Text>
                <Text style={[styles.cellText, styles.numCol, { fontWeight: '600' }]}>
                  {fmt(item.value)}
                </Text>
              </View>
            ))}

            {/* Category subtotal */}
            <View style={styles.catSubtotal}>
              <Text style={styles.catSubLabel}>
                {group.category} Total ({group.items.length} items)
              </Text>
              <Text style={styles.catSubValue}>{fmt(group.totalValue)}</Text>
            </View>
          </View>
        ))}

        {/* Grand total */}
        <View style={styles.grandTotal}>
          <Text style={styles.gtLabel}>GRAND TOTAL</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.gtQty}>{fmtQty(grandTotalQty)} units</Text>
            <Text style={styles.gtValue}>{fmt(grandTotalValue)}</Text>
          </View>
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
  summaryValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  // Sections
  section: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  catName: { fontSize: 14, fontWeight: '700', color: Colors.white },
  catTotal: { fontSize: 14, fontWeight: '700', color: Colors.white },

  colHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '15',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  colText: { fontSize: 10, fontWeight: '700', color: Colors.primary },

  nameCol: { flex: 2, paddingHorizontal: 4 },
  skuCol: { flex: 1, paddingHorizontal: 4 },
  numCol: { flex: 1, textAlign: 'right', paddingHorizontal: 4 },

  itemRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemRowAlt: { backgroundColor: Colors.background },
  cellText: { fontSize: 12, color: Colors.textPrimary, paddingHorizontal: 4 },

  catSubtotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary + '08',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  catSubLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  catSubValue: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // Grand total
  grandTotal: {
    margin: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.success,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.md,
  },
  gtLabel: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  gtQty: { fontSize: 12, color: Colors.textSecondary, marginRight: Spacing.md },
  gtValue: { fontSize: 20, fontWeight: '800', color: Colors.success },
});

export default InventoryValuationScreen;
