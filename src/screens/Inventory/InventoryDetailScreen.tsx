// ============================================================
// FINMATRIX - Inventory Detail Screen
// ============================================================
// Params: { itemId }
// Top: name, SKU, category badge, stock status
// Metrics row: On Hand | On Order | Committed | Available
// SimpleTabBar: Stock Info | Transactions | Locations
// Actions: Adjust Qty, Transfer, Create PO, Edit

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { getInventoryItemByIdAPI, getAdjustmentsForItemAPI, getTransfersForItemAPI } from '../../network/inventoryNetwork';
import { InventoryItem } from '../../dummy-data/inventoryItems';
import { AdjustmentRecord } from '../../dummy-data/adjustments';
import { TransferRecord } from '../../dummy-data/transfers';
import { adjustInventoryQty, toggleInventoryActive, fetchInventory, deleteInventoryItem } from './inventorySlice';
import { LOCATION_LABELS } from '../../models/inventoryModel';
import { ROUTES } from '../../navigations-map/Base';
import SimpleTabBar from '../../Custom-Components/SimpleTabBar';

// ─── Helpers ────────────────────────────────────────────────
const fmt = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const CATEGORY_COLORS: Record<string, { text: string; bg: string }> = {
  Electronics: { text: '#6C5CE7', bg: '#6C5CE720' },
  'Office Supplies': { text: Colors.info, bg: Colors.infoLight },
  Furniture: { text: '#E17055', bg: '#E1705520' },
  'Raw Materials': { text: '#00B894', bg: '#00B89420' },
  'Finished Goods': { text: Colors.secondary, bg: Colors.secondary + '20' },
};

const getStockColor = (item: InventoryItem) => {
  if (!item.isActive) return { label: 'Inactive', color: Colors.textTertiary, bg: Colors.borderLight };
  if (item.quantityOnHand === 0) return { label: 'Out of Stock', color: Colors.danger, bg: Colors.dangerLight };
  if (item.quantityOnHand <= item.reorderPoint) return { label: 'Low Stock', color: Colors.warning, bg: Colors.warningLight };
  return { label: 'In Stock', color: Colors.success, bg: Colors.successLight };
};

// ─── Tab Bar ────────────────────────────────────────────────
type TabKey = 'stock' | 'transactions' | 'locations';
const TAB_LABELS: Record<TabKey, string> = {
  stock: 'Stock Info',
  transactions: 'Transactions',
  locations: 'Locations',
};
const TAB_KEYS: TabKey[] = ['stock', 'transactions', 'locations'];

// ─── Stock movement type (built from adjustments + transfers) ──
interface StockMovement {
  id: string;
  date: string;
  type: 'Receipt' | 'Shipment' | 'Adjustment' | 'Transfer';
  qty: number;
  reference: string;
  note: string;
}

// ─── Location breakdown type ────────────────────────────────
interface LocationQty {
  locationId: string;
  label: string;
  qty: number;
}

// ─── Main Component ─────────────────────────────────────────
const InventoryDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { itemId } = route.params;
  const dispatch = useAppDispatch();

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('stock');
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [locations, setLocations] = useState<LocationQty[]>([]);

  const loadItem = useCallback(() => {
    setLoading(true);
    getInventoryItemByIdAPI(itemId)
      .then((data) => { setItem(data); setLoading(false); })
      .catch(() => { Alert.alert('Error', 'Item not found'); navigation.goBack(); });
  }, [itemId, navigation]);

  // Load movements from adjustments + transfers
  const loadMovements = useCallback(async () => {
    try {
      const [adjs, xfrs] = await Promise.all([
        getAdjustmentsForItemAPI(itemId),
        getTransfersForItemAPI(itemId),
      ]);
      const mvs: StockMovement[] = [];
      adjs.forEach((a: AdjustmentRecord) => {
        const diff = a.quantityAfter - a.quantityBefore;
        mvs.push({
          id: a.id,
          date: a.date,
          type: 'Adjustment',
          qty: diff,
          reference: a.reference,
          note: a.reason,
        });
      });
      xfrs.forEach((t: TransferRecord) => {
        const lineItem = t.items.find((i) => i.itemId === itemId);
        if (!lineItem) return;
        mvs.push({
          id: t.id,
          date: t.date,
          type: 'Transfer',
          qty: -lineItem.quantity,
          reference: t.reference,
          note: `${t.fromLocationName} → ${t.toLocationName}`,
        });
      });
      mvs.sort((a, b) => b.date.localeCompare(a.date));
      setMovements(mvs);
    } catch {
      // silently fail — movements are informational
    }
  }, [itemId]);

  useEffect(() => { loadItem(); }, [loadItem]);
  useEffect(() => { loadMovements(); }, [loadMovements]);

  // Build location breakdown from item
  useEffect(() => {
    if (!item) return;
    const locs: LocationQty[] = [
      {
        locationId: item.locationId,
        label: LOCATION_LABELS[item.locationId] || item.locationId,
        qty: item.quantityOnHand,
      },
    ];
    setLocations(locs);
  }, [item]);

  const available = useMemo(() => {
    if (!item) return 0;
    return item.quantityOnHand - item.quantityCommitted;
  }, [item]);

  // ─── Adjust Qty ─────────────────────────────────────────
  const handleAdjust = useCallback(async () => {
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty === 0) {
      Alert.alert('Error', 'Enter a non-zero adjustment');
      return;
    }
    if (!adjustReason.trim()) {
      Alert.alert('Error', 'Reason is required');
      return;
    }
    try {
      const updated = await dispatch(adjustInventoryQty({ id: itemId, adjustment: qty, reason: adjustReason })).unwrap();
      setItem(updated);
      setAdjustModalVisible(false);
      setAdjustQty('');
      setAdjustReason('');
      Alert.alert('Done', `Quantity adjusted by ${qty > 0 ? '+' : ''}${qty}`);
    } catch (e: any) {
      Alert.alert('Error', e || 'Adjustment failed');
    }
  }, [adjustQty, adjustReason, itemId, dispatch]);

  // ─── Toggle Active ──────────────────────────────────────
  const handleToggle = useCallback(() => {
    if (!item) return;
    Alert.alert(
      item.isActive ? 'Deactivate' : 'Activate',
      `${item.isActive ? 'Deactivate' : 'Activate'} "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: item.isActive ? 'destructive' : 'default',
          onPress: async () => {
            const updated = await dispatch(toggleInventoryActive(itemId)).unwrap();
            setItem(updated);
          },
        },
      ]
    );
  }, [item, itemId, dispatch]);

  if (loading || !item) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const stock = getStockColor(item);
  const catColor = CATEGORY_COLORS[item.category] || { text: Colors.textSecondary, bg: Colors.borderLight };
  const totalValue = item.quantityOnHand * item.unitCost;

  // ─────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Item Detail</Text>
        <TouchableOpacity onPress={() => navigation.navigate(ROUTES.INVENTORY_FORM, { itemId: item.itemId })}>
          <Text style={styles.editBtn}>Edit ✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Top Card ──────────────────────────────────── */}
        <View style={styles.topCard}>
          <View style={styles.topRow}>
            <View style={styles.topLeft}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemSku}>{item.sku}</Text>
            </View>
            <View style={[styles.stockBadge, { backgroundColor: stock.bg }]}>
              <Text style={[styles.stockBadgeText, { color: stock.color }]}>{stock.label}</Text>
            </View>
          </View>
          <View style={styles.topBadges}>
            <View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
              <Text style={[styles.categoryBadgeText, { color: catColor.text }]}>{item.category}</Text>
            </View>
            <Text style={styles.uom}>{item.unitOfMeasure}</Text>
            {!item.isActive && (
              <View style={[styles.inactiveBadge]}>
                <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
              </View>
            )}
          </View>
          {item.description ? (
            <Text style={styles.description}>{item.description}</Text>
          ) : null}
        </View>

        {/* ── Metrics Row ───────────────────────────────── */}
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{item.quantityOnHand}</Text>
            <Text style={styles.metricLabel}>On Hand</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{item.quantityOnOrder}</Text>
            <Text style={styles.metricLabel}>On Order</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{item.quantityCommitted}</Text>
            <Text style={styles.metricLabel}>Committed</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: available >= 0 ? Colors.success : Colors.danger }]}>
              {available}
            </Text>
            <Text style={styles.metricLabel}>Available</Text>
          </View>
        </View>

        {/* ── Tab Bar ────────────────────────────────────── */}
        <SimpleTabBar
          tabs={TAB_KEYS.map((k) => TAB_LABELS[k])}
          activeTab={TAB_LABELS[activeTab]}
          onTabChange={(label) => {
            const key = TAB_KEYS.find((k) => TAB_LABELS[k] === label);
            if (key) setActiveTab(key);
          }}
        />

        {/* ── Tab Content ────────────────────────────────── */}
        {activeTab === 'stock' && (
          <View style={styles.tabContent}>
            {/* Pricing */}
            <Text style={styles.sectionLabel}>Pricing</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cost Method</Text>
              <Text style={styles.detailValue}>Weighted Average</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Unit Cost</Text>
              <Text style={styles.detailValue}>{fmt(item.unitCost)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Selling Price</Text>
              <Text style={styles.detailValue}>{fmt(item.sellingPrice)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Markup</Text>
              <Text style={[styles.detailValue, { color: Colors.success }]}>
                {item.unitCost > 0 ? `${Math.round(((item.sellingPrice - item.unitCost) / item.unitCost) * 100)}%` : '—'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Value</Text>
              <Text style={[styles.detailValue, { fontWeight: '700' }]}>{fmt(totalValue)}</Text>
            </View>

            {/* Stock Thresholds */}
            <Text style={[styles.sectionLabel, { marginTop: Spacing.base }]}>Stock Thresholds</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reorder Point</Text>
              <Text style={styles.detailValue}>{item.reorderPoint}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reorder Qty</Text>
              <Text style={styles.detailValue}>{item.reorderQuantity}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Min Stock</Text>
              <Text style={styles.detailValue}>{item.minStock}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Max Stock</Text>
              <Text style={styles.detailValue}>{item.maxStock}</Text>
            </View>

            {/* Tracking */}
            <Text style={[styles.sectionLabel, { marginTop: Spacing.base }]}>Tracking</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Serial Tracking</Text>
              <Text style={[styles.detailValue, { color: item.serialTracking ? Colors.success : Colors.textTertiary }]}>
                {item.serialTracking ? 'Yes ✓' : 'No'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Lot Tracking</Text>
              <Text style={[styles.detailValue, { color: item.lotTracking ? Colors.success : Colors.textTertiary }]}>
                {item.lotTracking ? 'Yes ✓' : 'No'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Barcode</Text>
              <Text style={styles.detailValue}>{item.barcodeData || '—'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{LOCATION_LABELS[item.locationId] || item.locationId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Updated</Text>
              <Text style={styles.detailValue}>{fmtDate(item.lastUpdated)}</Text>
            </View>
          </View>
        )}

        {activeTab === 'transactions' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionLabel}>Stock Movements</Text>
            {movements.length === 0 ? (
              <View style={styles.emptyTab}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyText}>No stock movements recorded</Text>
              </View>
            ) : (
              movements.map((mv) => (
                <View key={mv.id} style={styles.mvRow}>
                  <View style={styles.mvLeft}>
                    <Text style={styles.mvType}>{mv.type}</Text>
                    <Text style={styles.mvNote}>{mv.note}</Text>
                    <Text style={styles.mvDate}>{fmtDate(mv.date)}</Text>
                  </View>
                  <View style={styles.mvRight}>
                    <Text
                      style={[
                        styles.mvQty,
                        { color: mv.qty > 0 ? Colors.success : Colors.danger },
                      ]}
                    >
                      {mv.qty > 0 ? '+' : ''}{mv.qty}
                    </Text>
                    <Text style={styles.mvRef}>{mv.reference}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'locations' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionLabel}>Quantity by Location</Text>
            {locations.map((loc) => (
              <View key={loc.locationId} style={styles.locRow}>
                <View style={styles.locIcon}>
                  <Text style={styles.locIconText}>🏭</Text>
                </View>
                <View style={styles.locInfo}>
                  <Text style={styles.locName}>{loc.label}</Text>
                  <Text style={styles.locId}>{loc.locationId}</Text>
                </View>
                <Text style={[styles.locQty, { color: loc.qty > 0 ? Colors.textPrimary : Colors.textTertiary }]}>
                  {loc.qty}
                </Text>
              </View>
            ))}
            <View style={styles.locTotalRow}>
              <Text style={styles.locTotalLabel}>Total On Hand</Text>
              <Text style={styles.locTotalValue}>{item.quantityOnHand}</Text>
            </View>
          </View>
        )}

        {/* ── Action Buttons ────────────────────────────── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setAdjustModalVisible(true)}>
            <Text style={styles.actionIcon}>⚖️</Text>
            <Text style={styles.actionLabel}>Adjust Qty</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate(ROUTES.STOCK_TRANSFER, { preselectedItemId: item.itemId })}
          >
            <Text style={styles.actionIcon}>🔀</Text>
            <Text style={styles.actionLabel}>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              navigation.navigate(ROUTES.PO_FORM, {
                prefillItems: [
                  {
                    itemId: item.itemId,
                    name: item.name,
                    sku: item.sku,
                    quantity: item.reorderQuantity,
                    unitCost: item.unitCost,
                  },
                ],
              })
            }
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionLabel}>Create PO</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: item.isActive ? Colors.danger : Colors.success }]}
            onPress={handleToggle}
          >
            <Text style={styles.actionIcon}>{item.isActive ? '⏸️' : '▶️'}</Text>
            <Text style={[styles.actionLabel, { color: item.isActive ? Colors.danger : Colors.success }]}>
              {item.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: Colors.danger }]}
            onPress={() =>
              Alert.alert('Delete Item', 'Are you sure? This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await dispatch(deleteInventoryItem(itemId)).unwrap();
                      navigation.goBack();
                    } catch (e: any) {
                      Alert.alert('Error', e || 'Failed to delete item');
                    }
                  },
                },
              ])
            }
          >
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={[styles.actionLabel, { color: Colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── Adjust Qty Modal ────────────────────────────── */}
      <Modal visible={adjustModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Adjust Quantity</Text>
            <Text style={styles.modalSub}>Current: {item.quantityOnHand}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Qty (+/-)"
              placeholderTextColor={Colors.placeholder}
              keyboardType="number-pad"
              value={adjustQty}
              onChangeText={setAdjustQty}
            />
            <TextInput
              style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
              placeholder="Reason for adjustment"
              placeholderTextColor={Colors.placeholder}
              value={adjustReason}
              onChangeText={setAdjustReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => { setAdjustModalVisible(false); setAdjustQty(''); setAdjustReason(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleAdjust}>
                <Text style={styles.modalConfirmText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

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
  backBtn: { fontSize: 15, color: Colors.primary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  editBtn: { fontSize: 14, color: Colors.primary, fontWeight: '600' },

  scroll: { padding: Spacing.base },

  // Top card
  topCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  topLeft: { flex: 1, marginRight: Spacing.sm },
  itemName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  itemSku: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: Spacing.sm,
  },
  stockBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  stockBadgeText: { fontSize: 12, fontWeight: '700' },
  topBadges: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  categoryBadgeText: { fontSize: 12, fontWeight: '600' },
  uom: { fontSize: 13, color: Colors.textTertiary, fontStyle: 'italic' },
  inactiveBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.dangerLight,
  },
  inactiveBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.danger, letterSpacing: 1 },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  metricLabel: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  metricDivider: { width: 1, backgroundColor: Colors.border },

  // Tab bar (styles now in shared SimpleTabBar component)

  // Tab content
  tabContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: { fontSize: 14, color: Colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },

  // Transactions tab
  mvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  mvLeft: { flex: 1 },
  mvType: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  mvNote: { fontSize: 12, color: Colors.textTertiary },
  mvDate: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  mvRight: { alignItems: 'flex-end' },
  mvQty: { fontSize: 15, fontWeight: '700' },
  mvRef: { fontSize: 11, color: Colors.textTertiary },

  // Empty
  emptyTab: { alignItems: 'center', paddingVertical: 30 },
  emptyIcon: { fontSize: 32, marginBottom: Spacing.sm },
  emptyText: { fontSize: 14, color: Colors.textTertiary },

  // Locations tab
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  locIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  locIconText: { fontSize: 18 },
  locInfo: { flex: 1 },
  locName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  locId: { fontSize: 12, color: Colors.textTertiary },
  locQty: { fontSize: 18, fontWeight: '700' },
  locTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  locTotalLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  locTotalValue: { fontSize: 18, fontWeight: '700', color: Colors.primary },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
    minWidth: '45%' as any,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  actionIcon: { fontSize: 22, marginBottom: 4 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
    ...Shadows.lg,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: 14, color: Colors.textTertiary, marginBottom: Spacing.base },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  modalCancel: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  modalConfirm: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 14, fontWeight: '600', color: Colors.white },
});

export default InventoryDetailScreen;
