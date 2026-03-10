// ============================================================
// FINMATRIX - Inventory List Screen
// ============================================================
// Replaces InventoryHubScreen placeholder.
// Header: "Inventory" + Grid/List toggle + "+ Add"
// Search, filter chips (All/In Stock/Low Stock/Out of Stock), category dropdown, sort.
// List view & grid view. Summary bar at bottom.

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import {
  fetchInventory,
  setInventorySearch,
  setStockFilter,
  setCategoryFilter,
  setInventorySortKey,
  setSortDirection,
  setViewMode,
  clearInventoryError,
  StockFilter,
  InventorySortKey,
  SortDirection,
} from './inventorySlice';
import { InventoryItem, Category } from '../../dummy-data/inventoryItems';
import { ROUTES } from '../../navigations-map/Base';

// ─── Helpers ────────────────────────────────────────────────
const fmt = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const FILTER_CHIPS: { key: StockFilter; label: string; color: string; bg: string }[] = [
  { key: 'all', label: 'All', color: Colors.primary, bg: Colors.primary + '14' },
  { key: 'in_stock', label: 'In Stock', color: Colors.success, bg: Colors.successLight },
  { key: 'low_stock', label: 'Low Stock', color: Colors.warning, bg: Colors.warningLight },
  { key: 'out_of_stock', label: 'Out of Stock', color: Colors.danger, bg: Colors.dangerLight },
];

const SORT_OPTIONS: { key: InventorySortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'qty', label: 'Qty' },
  { key: 'value', label: 'Value' },
];

const CATEGORY_CHIPS: { key: Category | 'all'; label: string }[] = [
  { key: 'all', label: 'All Categories' },
  { key: 'Electronics', label: 'Electronics' },
  { key: 'Office Supplies', label: 'Office' },
  { key: 'Furniture', label: 'Furniture' },
  { key: 'Raw Materials', label: 'Raw Mat.' },
  { key: 'Finished Goods', label: 'Finished' },
];

const CATEGORY_COLORS: Record<string, { text: string; bg: string }> = {
  Electronics: { text: '#6C5CE7', bg: '#6C5CE720' },
  'Office Supplies': { text: Colors.info, bg: Colors.infoLight },
  Furniture: { text: '#E17055', bg: '#E1705520' },
  'Raw Materials': { text: '#00B894', bg: '#00B89420' },
  'Finished Goods': { text: Colors.secondary, bg: Colors.secondary + '20' },
};

const getStockStatus = (item: InventoryItem) => {
  if (!item.isActive) return { label: 'Inactive', color: Colors.textTertiary, bg: Colors.borderLight };
  if (item.quantityOnHand === 0) return { label: 'Out', color: Colors.danger, bg: Colors.dangerLight };
  if (item.quantityOnHand <= item.reorderPoint) return { label: 'Low', color: Colors.warning, bg: Colors.warningLight };
  return { label: 'OK', color: Colors.success, bg: Colors.successLight };
};

const getInitials = (name: string) => {
  const parts = name.split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

// ─── Component ──────────────────────────────────────────────
const InventoryListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const {
    filteredItems,
    items,
    searchQuery,
    stockFilter,
    categoryFilter,
    sortKey,
    sortDirection,
    viewMode,
    isLoading,
    error,
  } = useAppSelector((s) => s.inventory);

  const [sortOpen, setSortOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchInventory()).unwrap();
    setRefreshing(false);
  };

  useEffect(() => {
    dispatch(fetchInventory());
  }, [dispatch]);

  // ─── Summary ────────────────────────────────────────────
  const summary = useMemo(() => {
    const active = filteredItems.filter((i) => i.isActive);
    const totalValue = active.reduce((s, i) => s + i.quantityOnHand * i.unitCost, 0);
    const lowCount = active.filter((i) => i.quantityOnHand > 0 && i.quantityOnHand <= i.reorderPoint).length;
    const outCount = active.filter((i) => i.quantityOnHand === 0).length;
    return { total: active.length, totalValue, lowCount, outCount };
  }, [filteredItems]);

  const isFiltered = searchQuery || stockFilter !== 'all' || categoryFilter !== 'all';

  // ─── Handlers ───────────────────────────────────────────
  const handleAdd = useCallback(() => {
    navigation.navigate(ROUTES.INVENTORY_FORM);
  }, [navigation]);

  const handleItemPress = useCallback(
    (itemId: string) => {
      navigation.navigate(ROUTES.INVENTORY_DETAIL, { itemId });
    },
    [navigation]
  );

  // ─── List Row ───────────────────────────────────────────
  const renderListItem = useCallback(
    ({ item }: { item: InventoryItem }) => {
      const stock = getStockStatus(item);
      const catColor = CATEGORY_COLORS[item.category] || { text: Colors.textSecondary, bg: Colors.borderLight };
      const totalValue = item.quantityOnHand * item.unitCost;

      return (
        <TouchableOpacity
          style={styles.listRow}
          activeOpacity={0.6}
          onPress={() => handleItemPress(item.itemId)}
        >
          <View style={styles.listRowLeft}>
            <Text style={styles.listRowName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.listRowSku}>{item.sku}</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
            <Text style={[styles.categoryBadgeText, { color: catColor.text }]}>
              {item.category}
            </Text>
          </View>
          <View style={styles.listRowRight}>
            <View style={[styles.qtyBadge, { backgroundColor: stock.bg }]}>
              <Text style={[styles.qtyBadgeText, { color: stock.color }]}>{item.quantityOnHand}</Text>
            </View>
            <Text style={styles.listRowCost}>{fmt(item.unitCost)}</Text>
            <Text style={styles.listRowValue}>{fmt(totalValue)}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleItemPress]
  );

  // ─── Grid Card ──────────────────────────────────────────
  const renderGridItem = useCallback(
    ({ item }: { item: InventoryItem }) => {
      const stock = getStockStatus(item);
      const initials = getInitials(item.name);
      const catColor = CATEGORY_COLORS[item.category] || { text: Colors.textSecondary, bg: Colors.borderLight };

      return (
        <TouchableOpacity
          style={styles.gridCard}
          activeOpacity={0.6}
          onPress={() => handleItemPress(item.itemId)}
        >
          <View style={[styles.gridIcon, { backgroundColor: catColor.bg }]}>
            <Text style={[styles.gridIconText, { color: catColor.text }]}>{initials}</Text>
          </View>
          <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.gridSku}>{item.sku}</Text>
          <View style={styles.gridBottom}>
            <Text style={[styles.gridQty, { color: stock.color }]}>{item.quantityOnHand}</Text>
            <View style={[styles.stockDot, { backgroundColor: stock.color }]} />
          </View>
        </TouchableOpacity>
      );
    },
    [handleItemPress]
  );

  // ─── Render ────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.viewToggle, viewMode === 'list' && styles.viewToggleActive]}
            onPress={() => dispatch(setViewMode('list'))}
          >
            <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>☰</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggle, viewMode === 'grid' && styles.viewToggleActive]}
            onPress={() => dispatch(setViewMode('grid'))}
          >
            <Text style={[styles.viewToggleText, viewMode === 'grid' && styles.viewToggleTextActive]}>▦</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Error Banner ───────────────────────────────── */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠ {error}</Text>
          <TouchableOpacity onPress={() => dispatch(clearInventoryError())}>
            <Text style={styles.errorBannerDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── Quick Actions ─────────────────────────────── */}
      <View style={styles.quickActionsRow}>
        {[
          { icon: '📦', label: 'Adjust', route: ROUTES.INVENTORY_ADJUSTMENT },
          { icon: '🔄', label: 'Transfer', route: ROUTES.STOCK_TRANSFER },
          { icon: '📋', label: 'Count', route: ROUTES.PHYSICAL_COUNT },
          { icon: '📊', label: 'Reports', route: ROUTES.INVENTORY_REPORTS },
        ].map((action) => (
          <TouchableOpacity
            key={action.route}
            style={styles.quickActionCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(action.route)}
          >
            <View style={styles.quickActionIconWrap}>
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Search ─────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or SKU…"
            placeholderTextColor={Colors.placeholder}
            value={searchQuery}
            onChangeText={(t) => dispatch(setInventorySearch(t))}
          />
        </View>
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setSortOpen(!sortOpen)}
        >
          <Text style={styles.sortBtnText}>Sort: {SORT_OPTIONS.find((s) => s.key === sortKey)?.label}</Text>
          <Text style={styles.sortArrow}>{sortOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortDirBtn}
          onPress={() => dispatch(setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'))}
        >
          <Text style={styles.sortDirText}>{sortDirection === 'asc' ? '↑' : '↓'}</Text>
        </TouchableOpacity>
      </View>

      {sortOpen && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortOption, sortKey === opt.key && styles.sortOptionActive]}
              onPress={() => { dispatch(setInventorySortKey(opt.key)); setSortOpen(false); }}
            >
              <Text style={[styles.sortOptionText, sortKey === opt.key && styles.sortOptionTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Filter Chips ───────────────────────────────── */}
      <View style={styles.chipRow}>
        {FILTER_CHIPS.map((chip) => {
          const active = stockFilter === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              style={[
                styles.chip,
                { borderColor: active ? chip.color : Colors.border },
                active && { backgroundColor: chip.bg },
              ]}
              onPress={() => dispatch(setStockFilter(chip.key))}
            >
              <Text style={[styles.chipText, active && { color: chip.color, fontWeight: '600' }]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Category Chips ─────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catChipRow}
        style={styles.catChipScroll}
      >
        {CATEGORY_CHIPS.map((cat) => {
          const active = categoryFilter === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.catChip,
                active && styles.catChipActive,
              ]}
              onPress={() => dispatch(setCategoryFilter(cat.key))}
            >
              <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Main List ──────────────────────────────────── */}
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.itemId}
          renderItem={viewMode === 'list' ? renderListItem : renderGridItem}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          contentContainerStyle={
            viewMode === 'grid' ? styles.gridContainer : styles.listContainer
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No items found</Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? 'Try adjusting your filters'
                  : 'Tap "+ Add" to create your first item'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* ── Summary Bar ────────────────────────────────── */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{isFiltered ? 'Showing' : 'Items'}</Text>
          <Text style={styles.summaryValue}>
            {isFiltered ? `${filteredItems.length}/${items.length}` : summary.total}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Value</Text>
          <Text style={styles.summaryValue}>{fmt(summary.totalValue)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Low</Text>
          <Text style={[styles.summaryValue, { color: Colors.warning }]}>{summary.lowCount}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Out</Text>
          <Text style={[styles.summaryValue, { color: Colors.danger }]}>{summary.outCount}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: Colors.danger, fontWeight: '600' },
  errorBannerDismiss: { fontSize: 16, color: Colors.danger, fontWeight: '700', paddingLeft: Spacing.sm },

  // Header
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
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  viewToggle: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  viewToggleActive: { backgroundColor: Colors.primary },
  viewToggleText: { fontSize: 16, color: Colors.textSecondary },
  viewToggleTextActive: { color: Colors.white },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  addBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    marginHorizontal: 4,
    ...Shadows.sm,
  },
  quickActionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionIcon: { fontSize: 20 },
  quickActionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 42,
    marginRight: Spacing.sm,
  },
  searchIcon: { fontSize: 14, marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 42,
    marginRight: Spacing.sm,
  },
  sortBtnText: { fontSize: 13, color: Colors.textSecondary, marginRight: 4 },
  sortArrow: { fontSize: 10, color: Colors.textTertiary },
  sortDirBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortDirText: { fontSize: 18, color: Colors.primary, fontWeight: '700' },
  sortDropdown: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.xs,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
    overflow: 'hidden',
  },
  sortOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  sortOptionActive: { backgroundColor: Colors.primary + '12' },
  sortOptionText: { fontSize: 14, color: Colors.textSecondary },
  sortOptionTextActive: { color: Colors.primary, fontWeight: '600' },

  // Filter chips
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  chipText: { fontSize: 13, color: Colors.textSecondary },

  // Category chips
  catChipScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  catChipRow: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    alignItems: 'center',
  },
  catChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.borderLight,
    marginRight: Spacing.sm,
  },
  catChipActive: { backgroundColor: Colors.primary },
  catChipText: { fontSize: 12, color: Colors.textSecondary },
  catChipTextActive: { color: Colors.white, fontWeight: '600' },

  // List view
  listContainer: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: 80 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  listRowLeft: { flex: 1, marginRight: Spacing.sm },
  listRowName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  listRowSku: { fontSize: 12, color: Colors.textTertiary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.sm,
  },
  categoryBadgeText: { fontSize: 10, fontWeight: '600' },
  listRowRight: { alignItems: 'flex-end' },
  qtyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    minWidth: 32,
    alignItems: 'center',
  },
  qtyBadgeText: { fontSize: 13, fontWeight: '700' },
  listRowCost: { fontSize: 11, color: Colors.textTertiary },
  listRowValue: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },

  // Grid view
  gridContainer: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: 80 },
  gridCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    margin: Spacing.xs,
    ...Shadows.sm,
    alignItems: 'center',
  },
  gridIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  gridIconText: { fontSize: 16, fontWeight: '700' },
  gridName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center', marginBottom: 2 },
  gridSku: { fontSize: 11, color: Colors.textTertiary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: Spacing.sm },
  gridBottom: { flexDirection: 'row', alignItems: 'center' },
  gridQty: { fontSize: 15, fontWeight: '700', marginRight: 6 },
  stockDot: { width: 8, height: 8, borderRadius: 4 },

  // Empty
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  emptySub: { fontSize: 14, color: Colors.textTertiary, textAlign: 'center' },

  // Summary bar
  summaryBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 2 },
  summaryValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  summaryDivider: { width: 1, height: 28, backgroundColor: Colors.border },
});

export default InventoryListScreen;
