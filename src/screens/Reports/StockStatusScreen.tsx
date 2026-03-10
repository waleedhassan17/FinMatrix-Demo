// ============================================================
// FINMATRIX - Stock Status Screen
// ============================================================
// All inventory items with status indicators.
// Filter chips: All | In Stock | Low Stock | Out of Stock.
// Category dropdown filter. Summary bar.

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
import { inventoryItems, InventoryItem, Category } from '../../dummy-data/inventoryItems';

// ─── Status helpers ─────────────────────────────────────────
type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

const getStatus = (item: InventoryItem): StockStatus => {
  if (item.quantityOnHand === 0) return 'Out of Stock';
  if (item.quantityOnHand <= item.reorderPoint) return 'Low Stock';
  return 'In Stock';
};

const STATUS_COLOR: Record<StockStatus, string> = {
  'In Stock': Colors.success,
  'Low Stock': Colors.warning,
  'Out of Stock': Colors.danger,
};

type FilterChip = 'All' | StockStatus;
const CHIPS: FilterChip[] = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];

const CATEGORIES: Category[] = [
  'Electronics',
  'Office Supplies',
  'Furniture',
  'Raw Materials',
  'Finished Goods',
];

// ─── Component ──────────────────────────────────────────────
const StockStatusScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [activeChip, setActiveChip] = useState<FilterChip>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCatPicker, setShowCatPicker] = useState(false);

  const activeItems = useMemo(
    () => inventoryItems.filter((i) => i.isActive),
    [],
  );

  const filtered = useMemo(() => {
    let items = activeItems;
    if (activeChip !== 'All') {
      items = items.filter((i) => getStatus(i) === activeChip);
    }
    if (selectedCategory !== 'All') {
      items = items.filter((i) => i.category === selectedCategory);
    }
    return items;
  }, [activeItems, activeChip, selectedCategory]);

  // Summary counts
  const counts = useMemo(() => {
    const c = { total: activeItems.length, inStock: 0, lowStock: 0, outOfStock: 0 };
    for (const item of activeItems) {
      const s = getStatus(item);
      if (s === 'In Stock') c.inStock++;
      else if (s === 'Low Stock') c.lowStock++;
      else c.outOfStock++;
    }
    return c;
  }, [activeItems]);

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
        <Text style={s.title}>Stock Status</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Summary bar */}
      <View style={s.summaryBar}>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Total</Text>
          <Text style={s.summaryValue}>{counts.total}</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>In Stock</Text>
          <Text style={[s.summaryValue, { color: Colors.success }]}>{counts.inStock}</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Low Stock</Text>
          <Text style={[s.summaryValue, { color: Colors.warning }]}>{counts.lowStock}</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Out of Stock</Text>
          <Text style={[s.summaryValue, { color: Colors.danger }]}>{counts.outOfStock}</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={s.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
          {CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={[s.chip, activeChip === chip && s.chipActive]}
              onPress={() => setActiveChip(chip)}
            >
              <Text style={[s.chipText, activeChip === chip && s.chipTextActive]}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Category dropdown */}
      <View style={s.catRow}>
        <Text style={s.catLabel}>Category:</Text>
        <TouchableOpacity style={s.catDropdown} onPress={() => setShowCatPicker(!showCatPicker)}>
          <Text style={s.catDropdownText}>{selectedCategory}</Text>
          <Text style={s.catChevron}>{showCatPicker ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      {showCatPicker && (
        <View style={s.catPickerList}>
          {['All', ...CATEGORIES].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[s.catPickerItem, selectedCategory === cat && s.catPickerItemActive]}
              onPress={() => { setSelectedCategory(cat); setShowCatPicker(false); }}
            >
              <Text style={[s.catPickerText, selectedCategory === cat && { color: Colors.white }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Table header */}
        <View style={s.tableHeader}>
          <Text style={[s.thCell, { flex: 2 }]}>Item</Text>
          <Text style={[s.thCell, { flex: 1 }]}>SKU</Text>
          <Text style={[s.thCell, s.numCol]}>On Hand</Text>
          <Text style={[s.thCell, s.numCol]}>On Order</Text>
          <Text style={[s.thCell, s.numCol]}>Avail</Text>
          <Text style={[s.thCell, { width: 80, textAlign: 'center' }]}>Status</Text>
        </View>

        {filtered.map((item, idx) => {
          const status = getStatus(item);
          const available = item.quantityOnHand - item.quantityCommitted;
          return (
            <View
              key={item.itemId}
              style={[s.tableRow, idx % 2 === 0 && s.tableRowAlt]}
            >
              <View style={{ flex: 2, paddingHorizontal: 4 }}>
                <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={s.itemCat} numberOfLines={1}>{item.category}</Text>
              </View>
              <Text style={[s.tdCell, { flex: 1 }]} numberOfLines={1}>{item.sku}</Text>
              <Text style={[s.tdCell, s.numCol]}>{item.quantityOnHand}</Text>
              <Text style={[s.tdCell, s.numCol]}>{item.quantityOnOrder}</Text>
              <Text style={[s.tdCell, s.numCol]}>{available}</Text>
              <View style={{ width: 80, alignItems: 'center' }}>
                <View style={[s.badge, { backgroundColor: STATUS_COLOR[status] + '18' }]}>
                  <Text style={[s.badgeText, { color: STATUS_COLOR[status] }]}>{status}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyText}>No items match the selected filters.</Text>
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

  filterRow: { backgroundColor: Colors.white, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  chipRow: { paddingHorizontal: Spacing.base, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.white },

  catRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  catLabel: { fontSize: 13, color: Colors.textSecondary, marginRight: 8 },
  catDropdown: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  catDropdownText: { fontSize: 13, color: Colors.textPrimary, marginRight: 6 },
  catChevron: { fontSize: 10, color: Colors.textTertiary },
  catPickerList: {
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    paddingHorizontal: Spacing.base,
  },
  catPickerItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: BorderRadius.sm, marginBottom: 2 },
  catPickerItemActive: { backgroundColor: Colors.primary },
  catPickerText: { fontSize: 13, color: Colors.textPrimary },

  scroll: { paddingBottom: 100 },

  tableHeader: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm, paddingHorizontal: 4,
  },
  thCell: { fontSize: 10, fontWeight: '700', color: Colors.white, paddingHorizontal: 4 },
  numCol: { width: 50, textAlign: 'right', paddingHorizontal: 4 },

  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: 4,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  tableRowAlt: { backgroundColor: Colors.background },
  itemName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  itemCat: { fontSize: 10, color: Colors.textTertiary },
  tdCell: { fontSize: 11, color: Colors.textPrimary, paddingHorizontal: 4 },

  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: '700' },

  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textTertiary },
});

export default StockStatusScreen;
