// ============================================================
// FINMATRIX - Shadow Inventory Screen  (Driver-facing)
// ============================================================
// "My Inventory Copy" — personal shadow of real inventory.
// List items with change counts & status badges.
// Tap item → change log. Submit button → InventoryUpdateRequest.

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import { submitShadowInventoryUpdate } from '../../../store/deliverySlice';
import {
  ShadowInventoryItem,
  ShadowInventoryChange,
  ShadowInventoryStatus,
} from '../../../dummy-data/shadowInventory';

// ─── Theme ──────────────────────────────────────────────────
const DP_GREEN = '#27AE60';
const DP_GREEN_LIGHT = '#E8F8EF';

const STATUS_CFG: Record<ShadowInventoryStatus, { label: string; color: string; bg: string }> = {
  synced:   { label: 'Synced',   color: DP_GREEN,        bg: DP_GREEN_LIGHT },
  pending:  { label: 'Pending',  color: Colors.warning,  bg: Colors.warningLight },
  rejected: { label: 'Rejected', color: Colors.danger,   bg: Colors.dangerLight },
};

// ─── Component ──────────────────────────────────────────────
const DPShadowInventoryScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const currentPersonId = user?.uid || 'dp_001';
  const items = useAppSelector((s) => s.delivery.shadowInventory[currentPersonId] || []);
  const isLoading = useAppSelector((s) => s.delivery.isLoading);
  const isUpdating = useAppSelector((s) => s.delivery.isUpdating);

  const [selectedItem, setSelectedItem] = useState<ShadowInventoryItem | null>(null);
  const [changeLogVisible, setChangeLogVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  // ── Stats ─────────────────────────────────────────
  const stats = useMemo(() => {
    const synced = items.filter((i) => i.status === 'synced').length;
    const pending = items.filter((i) => i.status === 'pending').length;
    const rejected = items.filter((i) => i.status === 'rejected').length;
    return { synced, pending, rejected, total: items.length };
  }, [items]);

  // ── Submit update ─────────────────────────────────
  const handleSubmit = useCallback(() => {
    const pendingItems = items.filter((i) => i.status === 'pending' || i.changes.length > 0 && i.status !== 'synced');
    if (pendingItems.length === 0) {
      Alert.alert('No Changes', 'All items are already synced or have been submitted.');
      return;
    }
    dispatch(
      submitShadowInventoryUpdate({
        deliveryPersonId: currentPersonId,
        shadowIds: pendingItems.map((i) => i.shadowId),
      }),
    );
    Alert.alert(
      'Update Submitted',
      `${pendingItems.length} item change(s) sent to admin for review.`,
    );
  }, [items, dispatch, currentPersonId]);

  // ── Open change log ───────────────────────────────
  const openChangeLog = useCallback((item: ShadowInventoryItem) => {
    setSelectedItem(item);
    setChangeLogVisible(true);
  }, []);

  // ── Render item ───────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: ShadowInventoryItem }) => {
      const cfg = STATUS_CFG[item.status];
      const delta = item.currentQuantity - item.originalQuantity;

      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => openChangeLog(item)}
        >
          <View style={styles.cardTop}>
            <Text style={styles.itemName} numberOfLines={1}>{item.itemName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          <View style={styles.qtyRow}>
            <View style={styles.qtyBlock}>
              <Text style={styles.qtyLabel}>Original</Text>
              <Text style={styles.qtyValue}>{item.originalQuantity}</Text>
            </View>
            <Text style={styles.qtyArrow}>→</Text>
            <View style={styles.qtyBlock}>
              <Text style={styles.qtyLabel}>Current</Text>
              <Text style={[styles.qtyValue, { color: delta < 0 ? Colors.danger : DP_GREEN }]}>
                {item.currentQuantity}
              </Text>
            </View>
            <View style={styles.qtyBlock}>
              <Text style={styles.qtyLabel}>Changes</Text>
              <View style={styles.changeCountBadge}>
                <Text style={styles.changeCountText}>{item.changes.length}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.deltaText}>
            Δ {delta >= 0 ? '+' : ''}{delta} units
          </Text>
        </TouchableOpacity>
      );
    },
    [openChangeLog],
  );

  const keyExtractor = useCallback((item: ShadowInventoryItem) => item.shadowId, []);

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>My Inventory Copy</Text>
          <Text style={styles.headerSub}>{stats.total} items tracked</Text>
        </View>
        <TouchableOpacity
          style={styles.infoBtn}
          onPress={() => setInfoVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.infoIcon}>ℹ️</Text>
        </TouchableOpacity>
      </View>

      {/* ── Status Summary ─────────────────────────────── */}
      <View style={styles.summaryRow}>
        {(['synced', 'pending', 'rejected'] as ShadowInventoryStatus[]).map((s) => {
          const cfg = STATUS_CFG[s];
          const count = s === 'synced' ? stats.synced : s === 'pending' ? stats.pending : stats.rejected;
          return (
            <View key={s} style={[styles.summaryChip, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.summaryCount, { color: cfg.color }]}>{count}</Text>
              <Text style={[styles.summaryLabel, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          );
        })}
      </View>

      {/* ── List ───────────────────────────────────────── */}
      {isLoading && items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={DP_GREEN} />
        </View>
      ) : (
      <FlatList<ShadowInventoryItem>
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {}}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
          <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📦</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 }}>No Shadow Items</Text>
            <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center' }}>Your personal inventory copy is empty. Items will appear after your next delivery sync.</Text>
          </View>
          ) : null
        }
      />
      )}

      {/* ── Submit Button ──────────────────────────────── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitBtn, isUpdating && styles.submitBtnDisabled]}
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>
              📤  Submit Update ({stats.pending} pending)
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Change Log Modal ───────────────────────────── */}
      <Modal
        visible={changeLogVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setChangeLogVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                📦 {selectedItem?.itemName}
              </Text>
              <TouchableOpacity onPress={() => setChangeLogVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <>
                <View style={styles.modalQtyRow}>
                  <Text style={styles.modalQtyLabel}>
                    {selectedItem.originalQuantity} → {selectedItem.currentQuantity}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_CFG[selectedItem.status].bg }]}>
                    <Text style={[styles.statusText, { color: STATUS_CFG[selectedItem.status].color }]}>
                      {STATUS_CFG[selectedItem.status].label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.logSectionLabel}>Change History</Text>

                {selectedItem.changes.map((c) => (
                  <View key={c.changeId} style={styles.logRow}>
                    <View style={styles.logDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.logCustomer}>{c.deliveryCustomer}</Text>
                      <Text style={styles.logMeta}>
                        {c.deliveryId} · {new Date(c.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={[styles.logQty, { color: c.quantityChanged < 0 ? Colors.danger : DP_GREEN }]}>
                      {c.quantityChanged > 0 ? '+' : ''}{c.quantityChanged}
                    </Text>
                  </View>
                ))}
              </>
            )}

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setChangeLogVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Info Tooltip Modal ─────────────────────────── */}
      <Modal
        visible={infoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalContent}>
            <Text style={styles.infoModalTitle}>ℹ️  Shadow Inventory</Text>
            <Text style={styles.infoModalText}>
              This is your personal copy of the company inventory. As you make
              deliveries, quantities are adjusted locally.{'\n\n'}
              Changes are <Text style={{ fontWeight: '700' }}>not reflected</Text> in the
              real inventory until an admin reviews and approves your submission.{'\n\n'}
              <Text style={{ fontWeight: '700', color: DP_GREEN }}>Synced</Text> — Admin
              approved your changes.{'\n'}
              <Text style={{ fontWeight: '700', color: Colors.warning }}>Pending</Text> —
              Awaiting admin review.{'\n'}
              <Text style={{ fontWeight: '700', color: Colors.danger }}>Rejected</Text> —
              Admin declined; you may need to re-verify.
            </Text>
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setInfoVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDoneBtnText}>Got it</Text>
            </TouchableOpacity>
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
    backgroundColor: DP_GREEN,
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: { fontSize: 18 },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  summaryChip: {
    flex: 1,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  summaryCount: { fontSize: 18, fontWeight: '700' },
  summaryLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  // List
  list: { padding: Spacing.base, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  itemName: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginRight: Spacing.sm },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  qtyBlock: { flex: 1, alignItems: 'center' },
  qtyLabel: { fontSize: 10, color: Colors.textTertiary, marginBottom: 2 },
  qtyValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  qtyArrow: { fontSize: 16, color: Colors.textTertiary, marginHorizontal: Spacing.xs },
  changeCountBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeCountText: { fontSize: 11, fontWeight: '700', color: Colors.info },
  deltaText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'right',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.base,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitBtn: {
    backgroundColor: DP_GREEN,
    borderRadius: BorderRadius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  // Modal shared
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginRight: Spacing.sm },
  modalClose: { fontSize: 20, color: Colors.textTertiary, padding: Spacing.xs },
  modalQtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalQtyLabel: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  logSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DP_GREEN,
    marginTop: 5,
    marginRight: Spacing.sm,
  },
  logCustomer: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  logMeta: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  logQty: { fontSize: 15, fontWeight: '700', marginLeft: Spacing.sm },
  modalDoneBtn: {
    backgroundColor: DP_GREEN,
    borderRadius: BorderRadius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  modalDoneBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  // Info modal
  infoModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  infoModalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  infoModalText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
});

export default DPShadowInventoryScreen;
