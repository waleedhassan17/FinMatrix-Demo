// ============================================================
// FINMATRIX - Delivery Item Confirmation Screen
// ============================================================
// Per-item confirmation: delivered qty, status picker
// (Delivered / Damaged / Returned), optional notes per item.
// "Confirm Items" → navigates to Photo Proof screen.

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import {
  setItemConfirmations,
} from '../../../store/deliverySlice';
import type { DeliveryItemConfirmation, ItemConfirmStatus } from '../../../store/deliverySlice';
import { ROUTES } from '../../../navigations-map/Base';

// ─── Theme ──────────────────────────────────────────────────
const DP_GREEN = '#27AE60';
const DP_GREEN_LIGHT = '#E8F8EF';

const STATUS_OPTIONS: { key: ItemConfirmStatus; label: string; color: string; bg: string }[] = [
  { key: 'delivered', label: 'Delivered', color: DP_GREEN, bg: DP_GREEN_LIGHT },
  { key: 'damaged',  label: 'Damaged',  color: Colors.warning, bg: Colors.warningLight },
  { key: 'returned', label: 'Returned', color: Colors.danger, bg: Colors.dangerLight },
];

// ─── Component ──────────────────────────────────────────────
const DeliveryItemConfirmScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const { activeDelivery } = useAppSelector((s) => s.delivery);
  const deliveryId: string = route.params?.deliveryId;
  const delivery = activeDelivery;

  // Build initial confirmations from delivery items
  const [confirmations, setConfirmations] = useState<DeliveryItemConfirmation[]>(() => {
    if (!delivery) return [];
    return delivery.items.map((item) => ({
      itemId: item.itemId,
      itemName: item.itemName,
      orderedQty: item.quantity,
      deliveredQty: item.quantity,
      status: 'delivered' as ItemConfirmStatus,
      notes: '',
    }));
  });

  // ── Update a single field ────────────────────────
  const updateItem = useCallback(
    (index: number, patch: Partial<DeliveryItemConfirmation>) => {
      setConfirmations((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...patch };
        return next;
      });
    },
    [],
  );

  // ── Summary stats ────────────────────────────────
  const summary = useMemo(() => {
    let delivered = 0;
    let damaged = 0;
    let returned = 0;
    for (const c of confirmations) {
      if (c.status === 'delivered') delivered += c.deliveredQty;
      if (c.status === 'damaged') damaged += c.deliveredQty;
      if (c.status === 'returned') returned += c.deliveredQty;
    }
    const total = confirmations.reduce((s, c) => s + c.orderedQty, 0);
    const isPartial = damaged > 0 || returned > 0;
    return { delivered, damaged, returned, total, isPartial };
  }, [confirmations]);

  // ── Confirm ──────────────────────────────────────
  const handleConfirmItems = useCallback(() => {
    // Validate: all deliveredQty must be >= 0 and <= orderedQty
    for (const c of confirmations) {
      if (c.deliveredQty < 0 || c.deliveredQty > c.orderedQty) {
        Alert.alert('Invalid Quantity', `${c.itemName}: delivered qty must be 0–${c.orderedQty}`);
        return;
      }
    }

    dispatch(setItemConfirmations(confirmations));
    navigation.navigate(ROUTES.DELIVERY_PHOTO_PROOF, { deliveryId });
  }, [confirmations, deliveryId, dispatch, navigation]);

  if (!delivery) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No delivery found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Confirm Items</Text>
          <Text style={styles.headerSub}>{delivery.customerName}</Text>
        </View>
      </View>

      {/* ── Partial delivery warning ───────────────────── */}
      {summary.isPartial && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️  Partial delivery — {summary.damaged + summary.returned} unit(s) not fully delivered
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Instructions ─────────────────────────────── */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionText}>
            Review each item below. Adjust the delivered quantity and status as needed, then tap{' '}
            <Text style={styles.bold}>Confirm Items</Text> to continue.
          </Text>
        </View>

        {/* ── Item Cards ───────────────────────────────── */}
        {confirmations.map((c, idx) => (
          <View key={c.itemId + idx} style={styles.itemCard}>
            {/* Item header */}
            <View style={styles.itemHeader}>
              <View style={styles.itemNumBadge}>
                <Text style={styles.itemNumText}>{idx + 1}</Text>
              </View>
              <Text style={styles.itemName} numberOfLines={2}>
                {c.itemName}
              </Text>
            </View>

            {/* Ordered qty row */}
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Ordered</Text>
              <Text style={styles.qtyOrdered}>{c.orderedQty}</Text>
            </View>

            {/* Delivered qty row */}
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Delivered</Text>
              <TextInput
                style={styles.qtyInput}
                keyboardType="number-pad"
                value={String(c.deliveredQty)}
                onChangeText={(val) => {
                  const n = parseInt(val, 10);
                  updateItem(idx, { deliveredQty: isNaN(n) ? 0 : n });
                }}
                selectTextOnFocus
              />
            </View>

            {/* Status picker */}
            <Text style={styles.statusLabel}>Status</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((opt) => {
                const active = c.status === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.statusChip,
                      { borderColor: opt.color },
                      active && { backgroundColor: opt.bg },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => updateItem(idx, { status: opt.key })}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        { color: opt.color },
                        active && styles.statusChipActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Notes */}
            <TextInput
              style={styles.notesInput}
              placeholder="Notes (optional)..."
              placeholderTextColor={Colors.placeholder}
              value={c.notes}
              onChangeText={(val) => updateItem(idx, { notes: val })}
            />
          </View>
        ))}

        {/* ── Summary ──────────────────────────────────── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Ordered</Text>
            <Text style={styles.summaryValue}>{summary.total} units</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: DP_GREEN }]}>Delivered</Text>
            <Text style={[styles.summaryValue, { color: DP_GREEN }]}>{summary.delivered} units</Text>
          </View>
          {summary.damaged > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.warning }]}>Damaged</Text>
              <Text style={[styles.summaryValue, { color: Colors.warning }]}>{summary.damaged} units</Text>
            </View>
          )}
          {summary.returned > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.danger }]}>Returned</Text>
              <Text style={[styles.summaryValue, { color: Colors.danger }]}>{summary.returned} units</Text>
            </View>
          )}
        </View>

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Confirm Button ─────────────────────────────── */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.confirmBtn}
          activeOpacity={0.8}
          onPress={handleConfirmItems}
        >
          <Text style={styles.confirmBtnText}>📋  Confirm Items</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: Colors.textSecondary },

  // Header
  header: {
    backgroundColor: DP_GREEN,
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginRight: Spacing.md },
  backText: { fontSize: 15, fontWeight: '600', color: Colors.white },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Warning banner
  warningBanner: {
    backgroundColor: Colors.warningLight,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning,
  },
  warningText: { fontSize: 13, fontWeight: '600', color: Colors.warning, textAlign: 'center' },

  scroll: { padding: Spacing.base },

  // Instruction
  instructionCard: {
    backgroundColor: DP_GREEN_LIGHT,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: DP_GREEN,
  },
  instructionText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  bold: { fontWeight: '700', color: Colors.textPrimary },

  // Item card
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  itemNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: DP_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  itemNumText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  itemName: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  // Qty rows
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  qtyLabel: { fontSize: 13, color: Colors.textSecondary },
  qtyOrdered: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  qtyInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    width: 64,
    height: 36,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    backgroundColor: Colors.borderLight,
  },

  // Status picker
  statusLabel: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary, marginBottom: Spacing.xs },
  statusRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statusChip: {
    flex: 1,
    height: 34,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusChipText: { fontSize: 12, fontWeight: '600' },
  statusChipActive: { fontWeight: '800' },

  // Notes
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 40,
  },

  // Summary
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    borderTopWidth: 3,
    borderTopColor: DP_GREEN,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },

  // Action bar
  actionBar: {
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
  confirmBtn: {
    backgroundColor: DP_GREEN,
    borderRadius: BorderRadius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});

export default DeliveryItemConfirmScreen;
