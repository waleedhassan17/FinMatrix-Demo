// ============================================================
// FINMATRIX - Agency Inventory Sync Screen
// ============================================================
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { selectActiveCompany, selectActiveCompanyId } from '../../store/companySlice';
import { syncAgencyItems } from '../Inventory/inventorySlice';
import type { WarehouseAgency, AgencyInventoryItem } from '../../dummy-data/warehouseAgencies';
import type { InventoryItem } from '../../dummy-data/inventoryItems';

type SyncStatus = 'synced' | 'mismatch' | 'missing';

interface SyncRow {
  agencyItem: AgencyInventoryItem;
  systemItem: InventoryItem | undefined;
  status: SyncStatus;
}

// ─── Main Component ─────────────────────────────────────────
const AgencyInventorySyncScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { agencyId } = route.params as { agencyId: string };
  const dispatch = useAppDispatch();
  const company = useAppSelector(selectActiveCompany);
  const companyId = useAppSelector(selectActiveCompanyId) ?? '';
  const mainItems = useAppSelector((s) => s.inventory.items);

  const agency: WarehouseAgency | undefined = company?.agencies.find(
    (a) => a.agencyId === agencyId,
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Build sync table ──────────────────────────────────────
  const syncRows: SyncRow[] = useMemo(() => {
    if (!agency) return [];
    return agency.inventoryItems.map((ai) => {
      const sys = mainItems.find((m) => m.itemId === ai.itemId);
      let status: SyncStatus = 'missing';
      if (sys) {
        status = sys.quantityOnHand === ai.quantityOnHand ? 'synced' : 'mismatch';
      }
      return { agencyItem: ai, systemItem: sys, status };
    });
  }, [agency, mainItems]);

  const summary = useMemo(() => {
    const synced = syncRows.filter((r) => r.status === 'synced').length;
    const mismatch = syncRows.filter((r) => r.status === 'mismatch').length;
    const missing = syncRows.filter((r) => r.status === 'missing').length;
    return { synced, mismatch, missing };
  }, [syncRows]);

  // ── Sync handlers ─────────────────────────────────────────
  const buildMainItem = (ai: AgencyInventoryItem): InventoryItem => ({
    itemId: ai.itemId,
    companyId,
    sku: ai.sku,
    name: ai.name,
    description: '',
    category: 'Finished Goods' as any,
    unitOfMeasure: 'each' as any,
    costMethod: 'average' as any,
    unitCost: ai.unitCost,
    sellingPrice: ai.sellingPrice,
    quantityOnHand: ai.quantityOnHand,
    quantityOnOrder: 0,
    quantityCommitted: 0,
    reorderPoint: ai.reorderPoint,
    reorderQuantity: ai.reorderPoint * 2,
    minStock: Math.floor(ai.reorderPoint * 0.5),
    maxStock: ai.quantityOnHand * 3 || 100,
    isActive: true,
    serialTracking: false,
    lotTracking: false,
    barcodeData: null,
    locationId: 'warehouse_1' as any,
    imageUrl: null,
    lastUpdated: new Date().toISOString(),
    sourceAgencyId: agencyId,
  });

  const handleSyncAll = () => {
    if (!agency) return;
    const toSync = syncRows
      .filter((r) => r.status !== 'synced')
      .map((r) => buildMainItem(r.agencyItem));

    if (toSync.length === 0) {
      Alert.alert('All Synced', 'All items are already in sync.');
      return;
    }
    dispatch(syncAgencyItems({ items: toSync }));
    Alert.alert('Sync Complete', `${toSync.length} item(s) synchronized.`);
  };

  const handleSelectiveSync = () => {
    if (selectedIds.size === 0) {
      Alert.alert('No Selection', 'Select items to sync first.');
      return;
    }
    const toSync = syncRows
      .filter((r) => selectedIds.has(r.agencyItem.itemId))
      .map((r) => buildMainItem(r.agencyItem));

    dispatch(syncAgencyItems({ items: toSync }));
    setSelectedIds(new Set());
    Alert.alert('Sync Complete', `${toSync.length} item(s) synchronized.`);
  };

  const toggleSelect = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const statusColor = (s: SyncStatus) => {
    switch (s) {
      case 'synced': return { bg: Colors.successLight, text: Colors.success, label: 'Synced' };
      case 'mismatch': return { bg: Colors.warningLight, text: Colors.warning, label: 'Mismatch' };
      case 'missing': return { bg: Colors.dangerLight, text: Colors.danger, label: 'Missing' };
    }
  };

  if (!agency) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: Colors.textSecondary }}>Agency not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Inventory Sync</Text>
          <Text style={styles.headerSubtitle}>{agency.name}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              {summary.synced}
            </Text>
            <Text style={styles.summaryLabel}>Synced</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.warning }]}>
              {summary.mismatch}
            </Text>
            <Text style={styles.summaryLabel}>Mismatch</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.danger }]}>
              {summary.missing}
            </Text>
            <Text style={styles.summaryLabel}>Missing</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.syncAllBtn} onPress={handleSyncAll}>
            <Text style={styles.syncAllText}>🔄 Sync All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectiveSyncBtn} onPress={handleSelectiveSync}>
            <Text style={styles.selectiveSyncText}>
              ✓ Selective Sync ({selectedIds.size})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, { flex: 0.3 }]}>✓</Text>
          <Text style={[styles.thText, { flex: 2 }]}>Agency Item</Text>
          <Text style={[styles.thText, { flex: 1 }]}>SKU</Text>
          <Text style={[styles.thText, { flex: 0.8, textAlign: 'right' }]}>Agency</Text>
          <Text style={[styles.thText, { flex: 0.8, textAlign: 'right' }]}>System</Text>
          <Text style={[styles.thText, { flex: 1, textAlign: 'right' }]}>Status</Text>
        </View>

        {/* Rows */}
        {syncRows.map((row) => {
          const sc = statusColor(row.status);
          const isSelected = selectedIds.has(row.agencyItem.itemId);
          const isSynced = row.status === 'synced';
          return (
            <TouchableOpacity
              key={row.agencyItem.itemId}
              style={[styles.tableRow, isSelected && styles.tableRowSelected]}
              onPress={() => !isSynced && toggleSelect(row.agencyItem.itemId)}
              activeOpacity={isSynced ? 1 : 0.6}
            >
              <View style={{ flex: 0.3, alignItems: 'center' }}>
                {!isSynced && (
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxChecked,
                    ]}
                  >
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                )}
              </View>
              <Text style={[styles.cellText, { flex: 2 }]} numberOfLines={1}>
                {row.agencyItem.name}
              </Text>
              <Text
                style={[styles.cellText, { flex: 1, fontFamily: 'monospace', fontSize: 11 }]}
                numberOfLines={1}
              >
                {row.agencyItem.sku}
              </Text>
              <Text style={[styles.cellText, { flex: 0.8, textAlign: 'right', fontWeight: '600' }]}>
                {row.agencyItem.quantityOnHand}
              </Text>
              <Text style={[styles.cellText, { flex: 0.8, textAlign: 'right', fontWeight: '600' }]}>
                {row.systemItem?.quantityOnHand ?? '—'}
              </Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.text }]}>
                    {sc.label}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
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
  headerCenter: { flex: 1, marginLeft: Spacing.sm },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 13, color: Colors.textSecondary },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.xs },
  summaryValue: { fontSize: 24, fontWeight: '700', marginBottom: 2 },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary },
  // Actions
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  syncAllBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  syncAllText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  selectiveSyncBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  selectiveSyncText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '08',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  thText: { fontSize: 11, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tableRowSelected: { backgroundColor: Colors.primary + '06' },
  cellText: { fontSize: 13, color: Colors.textPrimary },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
});

export default AgencyInventorySyncScreen;
