// ============================================================
// FINMATRIX - Low Stock Alert Screen
// ============================================================
// Items at or below reorder point. "Create PO" per item.

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
import { inventoryItems, InventoryItem } from '../../dummy-data/inventoryItems';
import { ROUTES } from '../../navigations-map/Base';

// ─── Build data ─────────────────────────────────────────────
interface AlertRow {
  item: InventoryItem;
  shortage: number;
  suggestedQty: number;
}

const buildRows = (): AlertRow[] => {
  return inventoryItems
    .filter((i) => i.isActive && i.quantityOnHand <= i.reorderPoint)
    .map((item) => ({
      item,
      shortage: Math.max(item.reorderPoint - item.quantityOnHand, 0),
      suggestedQty: item.reorderQuantity,
    }))
    .sort((a, b) => b.shortage - a.shortage);
};

// ─── Component ──────────────────────────────────────────────
const LowStockAlertScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const rows = useMemo(buildRows, []);

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
        <Text style={s.title}>Low Stock Alerts</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Summary */}
      <View style={s.summaryBar}>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Items Below Reorder</Text>
          <Text style={[s.summaryValue, { color: Colors.danger }]}>{rows.length}</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Out of Stock</Text>
          <Text style={[s.summaryValue, { color: Colors.danger }]}>
            {rows.filter((r) => r.item.quantityOnHand === 0).length}
          </Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Low Stock</Text>
          <Text style={[s.summaryValue, { color: Colors.warning }]}>
            {rows.filter((r) => r.item.quantityOnHand > 0).length}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Table header */}
        <View style={s.tableHeader}>
          <Text style={[s.thCell, { flex: 2 }]}>Item</Text>
          <Text style={[s.thCell, { flex: 1 }]}>SKU</Text>
          <Text style={[s.thCell, s.numCol]}>Qty</Text>
          <Text style={[s.thCell, s.numCol]}>Reorder</Text>
          <Text style={[s.thCell, s.numCol]}>Short</Text>
          <Text style={[s.thCell, s.numCol]}>Suggest</Text>
          <Text style={[s.thCell, { width: 60, textAlign: 'center' }]}>Action</Text>
        </View>

        {rows.map((row, idx) => {
          const isZero = row.item.quantityOnHand === 0;
          return (
            <View
              key={row.item.itemId}
              style={[s.tableRow, idx % 2 === 0 && s.tableRowAlt]}
            >
              <View style={{ flex: 2, paddingHorizontal: 4 }}>
                <Text style={s.itemName} numberOfLines={1}>{row.item.name}</Text>
                <Text style={s.itemCat} numberOfLines={1}>{row.item.category}</Text>
              </View>
              <Text style={[s.tdCell, { flex: 1 }]} numberOfLines={1}>{row.item.sku}</Text>
              <Text style={[s.tdCell, s.numCol, isZero && { color: Colors.danger, fontWeight: '700' }]}>
                {row.item.quantityOnHand}
              </Text>
              <Text style={[s.tdCell, s.numCol]}>{row.item.reorderPoint}</Text>
              <Text style={[s.tdCell, s.numCol, { color: Colors.danger, fontWeight: '700' }]}>
                {row.shortage}
              </Text>
              <Text style={[s.tdCell, s.numCol]}>{row.suggestedQty}</Text>
              <View style={{ width: 60, alignItems: 'center' }}>
                <TouchableOpacity
                  style={s.poBtn}
                  onPress={() =>
                    navigation.navigate(ROUTES.PO_FORM, {
                      itemId: row.item.itemId,
                      itemName: row.item.name,
                      suggestedQty: row.suggestedQty,
                    })
                  }
                >
                  <Text style={s.poBtnText}>+ PO</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {rows.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>✅</Text>
            <Text style={s.emptyText}>All items are above their reorder point.</Text>
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

  summaryBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: Colors.white, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 2 },
  summaryValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  scroll: { paddingBottom: 100 },

  tableHeader: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm, paddingHorizontal: 4,
  },
  thCell: { fontSize: 10, fontWeight: '700', color: Colors.white, paddingHorizontal: 4 },
  numCol: { width: 45, textAlign: 'right', paddingHorizontal: 4 },

  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: 4,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  tableRowAlt: { backgroundColor: Colors.background },
  itemName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  itemCat: { fontSize: 10, color: Colors.textTertiary },
  tdCell: { fontSize: 11, color: Colors.textPrimary, paddingHorizontal: 4 },

  poBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  poBtnText: { fontSize: 10, fontWeight: '700', color: Colors.white },

  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyIcon: { fontSize: 36, marginBottom: Spacing.md },
  emptyText: { fontSize: 14, color: Colors.textTertiary },
});

export default LowStockAlertScreen;
