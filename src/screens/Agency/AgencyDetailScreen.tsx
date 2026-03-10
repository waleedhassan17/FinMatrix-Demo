// ============================================================
// FINMATRIX - Agency Detail Screen (3 tabs)
// ============================================================
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  FlatList,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppSelector } from '../../hooks/useReduxHooks';
import { selectActiveCompany } from '../../store/companySlice';
import type { WarehouseAgency, AgencyInventoryItem } from '../../dummy-data/warehouseAgencies';

// ── Type badge styles ───────────────────────────────────────
const TYPE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  manufacturing: { bg: Colors.infoLight, text: Colors.info, label: 'Manufacturing' },
  supply: { bg: Colors.successLight, text: Colors.success, label: 'Supply' },
  distribution: { bg: '#F3E5F5', text: '#8E44AD', label: 'Distribution' },
};
const getTypeStyle = (t: string) =>
  TYPE_STYLE[t] ?? { bg: Colors.border, text: Colors.textSecondary, label: t };

type SortKey = 'name' | 'qty' | 'value';
type TabKey = 'inventory' | 'deliveries' | 'analytics';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'deliveries', label: 'Deliveries' },
  { key: 'analytics', label: 'Analytics' },
];

// ── Stock indicator dot ─────────────────────────────────────
const stockDotColor = (qty: number, reorder: number) => {
  if (qty === 0) return Colors.danger;
  if (qty <= reorder) return Colors.warning;
  return Colors.success;
};

// ─── Main Component ─────────────────────────────────────────
const AgencyDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { agencyId } = route.params as { agencyId: string };
  const company = useAppSelector(selectActiveCompany);
  const agency: WarehouseAgency | undefined = company?.agencies.find(
    (a) => a.agencyId === agencyId,
  );
  const deliveries = useAppSelector((s) => s.delivery.deliveries);

  const [activeTab, setActiveTab] = useState<TabKey>('inventory');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');

  // ── Inventory items for this agency ───────────────────────
  const items = agency?.inventoryItems ?? [];

  const filteredItems = useMemo(() => {
    let list = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q),
      );
    }
    switch (sortKey) {
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'qty':
        list.sort((a, b) => b.quantityOnHand - a.quantityOnHand);
        break;
      case 'value':
        list.sort(
          (a, b) =>
            b.quantityOnHand * b.sellingPrice - a.quantityOnHand * a.sellingPrice,
        );
        break;
    }
    return list;
  }, [items, search, sortKey]);

  const inventorySummary = useMemo(() => {
    const totalItems = items.length;
    const totalValue = items.reduce(
      (sum, i) => sum + i.quantityOnHand * i.sellingPrice,
      0,
    );
    const lowStock = items.filter(
      (i) => i.quantityOnHand > 0 && i.quantityOnHand <= i.reorderPoint,
    ).length;
    return { totalItems, totalValue, lowStock };
  }, [items]);

  // ── Deliveries involving this agency's items ──────────────
  const agencyItemIds = useMemo(
    () => new Set(items.map((i) => i.itemId)),
    [items],
  );

  const agencyDeliveries = useMemo(() => {
    const list = deliveries.filter((d) =>
      d.items.some((di: any) => agencyItemIds.has(di.itemId)),
    );
    if (deliveryFilter === 'all') return list;
    return list.filter((d) => d.status === deliveryFilter);
  }, [deliveries, agencyItemIds, deliveryFilter]);

  // ── Analytics data ────────────────────────────────────────
  const analyticsData = useMemo(() => {
    // Top sold: count how many times each item appears in delivered orders
    const soldMap = new Map<string, { name: string; qty: number }>();
    for (const d of deliveries.filter((dd) => dd.status === 'delivered')) {
      for (const di of d.items) {
        if (agencyItemIds.has(di.itemId)) {
          const prev = soldMap.get(di.itemId) ?? { name: di.itemName, qty: 0 };
          prev.qty += di.quantity;
          soldMap.set(di.itemId, prev);
        }
      }
    }
    const topSold = Array.from(soldMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Stock movement: items below reorder vs above
    const belowReorder = items.filter(
      (i) => i.quantityOnHand <= i.reorderPoint && i.quantityOnHand > 0,
    ).length;
    const outOfStock = items.filter((i) => i.quantityOnHand === 0).length;
    const healthy = items.length - belowReorder - outOfStock;

    return { topSold, belowReorder, outOfStock, healthy };
  }, [deliveries, agencyItemIds, items]);

  if (!agency) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyTitle}>Agency not found</Text>
      </View>
    );
  }

  const typeStyle = getTypeStyle(agency.type);

  // ── Render functions ──────────────────────────────────────
  const renderHeaderCard = () => (
    <View style={styles.headerCard}>
      <View style={styles.headerCardTop}>
        <Text style={styles.agencyName}>{agency.name}</Text>
        <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
          <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>
            {typeStyle.label}
          </Text>
        </View>
      </View>
      <Text style={styles.address}>
        {agency.address.street}, {agency.address.city}, {agency.address.state}{' '}
        {agency.address.zipCode}
      </Text>
      <View style={styles.contactRow}>
        <Text style={styles.contactLabel}>👤 {agency.contactPerson}</Text>
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${agency.contactPhone}`)}>
          <Text style={styles.contactLink}>📞 {agency.contactPhone}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => Linking.openURL(`mailto:${agency.contactEmail}`)}>
        <Text style={styles.contactLink}>✉️ {agency.contactEmail}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.syncBtn}
        onPress={() =>
          navigation.navigate(ROUTES.AGENCY_INVENTORY_SYNC, { agencyId: agency.agencyId })
        }
      >
        <Text style={styles.syncBtnText}>🔄 Sync Inventory</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabBar}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          onPress={() => setActiveTab(tab.key)}
        >
          <Text
            style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderInventoryTab = () => (
    <View>
      {/* Search + Sort */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or SKU..."
          placeholderTextColor={Colors.placeholder}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <View style={styles.sortRow}>
        {(['name', 'qty', 'value'] as SortKey[]).map((k) => (
          <TouchableOpacity
            key={k}
            style={[styles.sortChip, sortKey === k && styles.sortChipActive]}
            onPress={() => setSortKey(k)}
          >
            <Text
              style={[styles.sortChipText, sortKey === k && styles.sortChipTextActive]}
            >
              {k === 'name' ? 'Name' : k === 'qty' ? 'Qty' : 'Value'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items */}
      {filteredItems.map((item) => (
        <TouchableOpacity
          key={item.itemId}
          style={styles.itemRow}
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate(ROUTES.INVENTORY_DETAIL, { itemId: item.itemId })
          }
        >
          <View style={styles.itemMain}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSku}>{item.sku}</Text>
          </View>
          <View style={styles.itemMeta}>
            <View style={styles.qtyRow}>
              <View
                style={[
                  styles.stockDot,
                  { backgroundColor: stockDotColor(item.quantityOnHand, item.reorderPoint) },
                ]}
              />
              <Text style={styles.qtyText}>{item.quantityOnHand}</Text>
            </View>
            <Text style={styles.priceText}>
              Cost: PKR {item.unitCost.toLocaleString()}
            </Text>
            <Text style={styles.priceText}>
              Sell: PKR {item.sellingPrice.toLocaleString()}
            </Text>
            <Text style={styles.valueText}>
              PKR {(item.quantityOnHand * item.sellingPrice).toLocaleString()}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Summary Footer */}
      <View style={styles.footerSummary}>
        <Text style={styles.footerText}>
          Total Items: {inventorySummary.totalItems}
        </Text>
        <Text style={styles.footerText}>
          Total Value: PKR {inventorySummary.totalValue.toLocaleString()}
        </Text>
        <Text style={styles.footerText}>
          Low Stock: {inventorySummary.lowStock}
        </Text>
      </View>
    </View>
  );

  const DELIVERY_STATUSES = ['all', 'unassigned', 'pending', 'in_transit', 'delivered', 'failed'];

  const renderDeliveriesTab = () => (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {DELIVERY_STATUSES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, deliveryFilter === s && styles.filterChipActive]}
            onPress={() => setDeliveryFilter(s)}
          >
            <Text
              style={[
                styles.filterChipText,
                deliveryFilter === s && styles.filterChipTextActive,
              ]}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {agencyDeliveries.length === 0 ? (
        <View style={styles.emptyInline}>
          <Text style={styles.emptySubtitle}>No deliveries found</Text>
        </View>
      ) : (
        agencyDeliveries.map((d) => (
          <TouchableOpacity
            key={d.deliveryId}
            style={styles.deliveryCard}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate(ROUTES.ADMIN_DELIVERY_DETAIL, {
                deliveryId: d.deliveryId,
              })
            }
          >
            <View style={styles.deliveryTop}>
              <Text style={styles.deliveryId}>{d.deliveryId}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      d.status === 'delivered'
                        ? Colors.successLight
                        : d.status === 'failed'
                        ? Colors.dangerLight
                        : Colors.warningLight,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color:
                      d.status === 'delivered'
                        ? Colors.success
                        : d.status === 'failed'
                        ? Colors.danger
                        : Colors.warning,
                  }}
                >
                  {d.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.deliveryCustomer}>{d.customerName}</Text>
            <Text style={styles.deliveryItems}>
              {d.items.length} item{d.items.length !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderAnalyticsTab = () => {
    const maxQty = analyticsData.topSold.length > 0
      ? Math.max(...analyticsData.topSold.map((i) => i.qty))
      : 1;

    return (
      <View>
        {/* Stock Health */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsTitle}>Stock Health</Text>
          <View style={styles.healthRow}>
            <View style={styles.healthItem}>
              <Text style={[styles.healthValue, { color: Colors.success }]}>
                {analyticsData.healthy}
              </Text>
              <Text style={styles.healthLabel}>Healthy</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={[styles.healthValue, { color: Colors.warning }]}>
                {analyticsData.belowReorder}
              </Text>
              <Text style={styles.healthLabel}>Low Stock</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={[styles.healthValue, { color: Colors.danger }]}>
                {analyticsData.outOfStock}
              </Text>
              <Text style={styles.healthLabel}>Out of Stock</Text>
            </View>
          </View>
        </View>

        {/* Top Sold Items */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsTitle}>Top Sold Items</Text>
          {analyticsData.topSold.length === 0 ? (
            <Text style={styles.emptySubtitle}>No delivered orders yet</Text>
          ) : (
            analyticsData.topSold.map((item, idx) => (
              <View key={idx} style={styles.barRow}>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${(item.qty / maxQty) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.barValue}>{item.qty}</Text>
              </View>
            ))
          )}
        </View>

        {/* Stock Movement This Month */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsTitle}>Stock Movement This Month</Text>
          <View style={styles.movementRow}>
            {items.slice(0, 5).map((item) => (
              <View key={item.itemId} style={styles.movementItem}>
                <Text style={styles.movementName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.movementQty}>{item.quantityOnHand} on hand</Text>
                <View
                  style={[
                    styles.movementIndicator,
                    {
                      backgroundColor: stockDotColor(
                        item.quantityOnHand,
                        item.reorderPoint,
                      ),
                    },
                  ]}
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {agency.name}
        </Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() =>
            navigation.navigate(ROUTES.AGENCY_FORM, { agencyId: agency.agencyId })
          }
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderHeaderCard()}
        {renderTabs()}
        {activeTab === 'inventory' && renderInventoryTab()}
        {activeTab === 'deliveries' && renderDeliveriesTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </ScrollView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 28, color: Colors.primary, fontWeight: '300', marginTop: -2 },
  topBarTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginLeft: Spacing.sm },
  editBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary + '10',
  },
  editBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  // Header card
  headerCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  headerCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  agencyName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  address: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  contactLabel: { fontSize: 14, color: Colors.textPrimary },
  contactLink: { fontSize: 14, color: Colors.secondary, textDecorationLine: 'underline' },
  syncBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center' as const,
  },
  syncBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  // Search / Sort
  searchRow: { marginBottom: Spacing.sm },
  searchInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  sortChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sortChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  sortChipTextActive: { color: Colors.white },
  // Item Row
  itemRow: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    ...Shadows.sm,
  },
  itemMain: { flex: 1, marginRight: Spacing.md },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  itemSku: { fontSize: 12, color: Colors.textTertiary, fontFamily: 'monospace' },
  itemMeta: { alignItems: 'flex-end' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  stockDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  qtyText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  priceText: { fontSize: 11, color: Colors.textTertiary },
  valueText: { fontSize: 13, fontWeight: '600', color: Colors.primary, marginTop: 2 },
  // Footer
  footerSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  footerText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  // Delivery filter
  filterScroll: { marginBottom: Spacing.md },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.white },
  // Delivery card
  deliveryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  deliveryTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  deliveryId: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  deliveryCustomer: { fontSize: 14, color: Colors.textSecondary },
  deliveryItems: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  // Analytics
  analyticsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  analyticsTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  healthRow: { flexDirection: 'row', justifyContent: 'space-around' },
  healthItem: { alignItems: 'center' },
  healthValue: { fontSize: 28, fontWeight: '700' },
  healthLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  barLabel: { width: 100, fontSize: 12, color: Colors.textSecondary, marginRight: Spacing.sm },
  barTrack: { flex: 1, height: 12, borderRadius: 6, backgroundColor: Colors.borderLight },
  barFill: { height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  barValue: { width: 36, textAlign: 'right', fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginLeft: Spacing.sm },
  movementRow: { gap: Spacing.sm },
  movementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  movementName: { flex: 1, fontSize: 13, color: Colors.textPrimary },
  movementQty: { fontSize: 12, color: Colors.textSecondary, marginRight: Spacing.sm },
  movementIndicator: { width: 10, height: 10, borderRadius: 5 },
  // Empty
  emptyInline: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary },
});

export default AgencyDetailScreen;
