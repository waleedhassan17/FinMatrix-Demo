// ============================================================
// FINMATRIX - Inventory Adjustment Screen
// ============================================================
// Params: { itemId? }
// Item selector, Current Qty (read-only), New Qty (editable),
// Adjustment auto-calc, Reason dropdown, Reference, Date, Notes.

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { fetchInventory, createAdjustment } from './inventorySlice';
import { InventoryItem } from '../../dummy-data/inventoryItems';
import { AdjustmentRecord } from '../../dummy-data/adjustments';
import { getAdjustmentsAPI } from '../../network/inventoryNetwork';
import CustomInput from '../../Custom-Components/CustomInput';
import CustomDropdown from '../../Custom-Components/CustomDropdown';

const REASON_OPTIONS = [
  { label: 'Physical Count', value: 'Physical Count' },
  { label: 'Damage', value: 'Damage' },
  { label: 'Theft', value: 'Theft' },
  { label: 'Return', value: 'Return' },
  { label: 'Received', value: 'Received' },
  { label: 'Other', value: 'Other' },
];

const todayISO = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

// ─── Component ──────────────────────────────────────────────
const AdjustmentScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const preItemId: string | undefined = route.params?.itemId;
  const dispatch = useAppDispatch();
  const { items, isLoading } = useAppSelector((s) => s.inventory);

  const [selectedItemId, setSelectedItemId] = useState(preItemId || '');
  const [newQty, setNewQty] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [recentAdj, setRecentAdj] = useState<AdjustmentRecord[]>([]);

  useEffect(() => {
    if (items.length === 0) dispatch(fetchInventory());
  }, [dispatch, items.length]);

  // Load recent adjustments
  useEffect(() => {
    getAdjustmentsAPI().then((all) => setRecentAdj(all.slice(0, 10)));
  }, []);

  const selectedItem: InventoryItem | undefined = useMemo(
    () => items.find((i) => i.itemId === selectedItemId),
    [items, selectedItemId]
  );

  const currentQty = selectedItem?.quantityOnHand ?? 0;
  const parsedNew = parseInt(newQty, 10);
  const adjustment = !isNaN(parsedNew) ? parsedNew - currentQty : 0;

  const itemOptions = useMemo(
    () =>
      items
        .filter((i) => i.isActive)
        .map((i) => ({ label: `${i.name} (${i.sku})`, value: i.itemId })),
    [items]
  );

  // Pre-fill newQty when item changes
  useEffect(() => {
    if (selectedItem) {
      setNewQty(String(selectedItem.quantityOnHand));
    }
  }, [selectedItemId]);

  // ─── Save ─────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!selectedItemId) { Alert.alert('Error', 'Select an item'); return; }
    if (isNaN(parsedNew) || parsedNew < 0) { Alert.alert('Error', 'Enter a valid new quantity'); return; }
    if (!reason) { Alert.alert('Error', 'Select a reason'); return; }
    if (adjustment === 0) { Alert.alert('Info', 'No change to quantity'); return; }

    setSaving(true);
    try {
      const adj = await dispatch(
        createAdjustment({
          record: {
            itemId: selectedItemId,
            itemName: selectedItem?.name || '',
            date: new Date(date).toISOString(),
            quantityBefore: currentQty,
            quantityAfter: parsedNew,
            reason: reason as AdjustmentRecord['reason'],
            createdBy: 'admin@finmatrix.com',
          },
          adjustment,
        })
      ).unwrap();

      // Refresh recent list
      setRecentAdj((prev) => [adj, ...prev].slice(0, 10));

      Alert.alert(
        'Success',
        `Adjusted ${selectedItem?.name} from ${currentQty} to ${parsedNew}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Error', e || 'Adjustment failed');
    } finally {
      setSaving(false);
    }
  }, [selectedItemId, parsedNew, reason, adjustment, date, selectedItem, currentQty, dispatch, navigation]);

  // ─── Recent adjustments (filtered by item if selected) ──
  const displayAdj = useMemo(() => {
    if (!selectedItemId) return recentAdj.slice(0, 5);
    return recentAdj.filter((a) => a.itemId === selectedItemId).slice(0, 5);
  }, [selectedItemId, recentAdj]);

  if (isLoading && items.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ───────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory Adjustment</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* ── Item Selector ──────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦  Select Item</Text>
          <CustomDropdown
            label="Item"
            options={itemOptions}
            value={selectedItemId}
            onChange={setSelectedItemId}
            searchable
            placeholder="Choose inventory item…"
          />
        </View>

        {/* ── Quantity Card ──────────────────────────────── */}
        {selectedItem && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊  Quantity</Text>

            {/* Current Qty */}
            <View style={styles.readRow}>
              <Text style={styles.readLabel}>Current Quantity</Text>
              <View style={styles.readValueBox}>
                <Text style={styles.readValue}>{currentQty}</Text>
              </View>
            </View>

            {/* New Qty */}
            <CustomInput
              label="New Quantity"
              placeholder="Enter new quantity"
              value={newQty}
              onChangeText={setNewQty}
              keyboardType="number-pad"
            />

            {/* Adjustment */}
            <View style={styles.adjustRow}>
              <Text style={styles.adjustLabel}>Adjustment</Text>
              <View
                style={[
                  styles.adjustBadge,
                  {
                    backgroundColor:
                      adjustment > 0
                        ? Colors.successLight
                        : adjustment < 0
                        ? Colors.dangerLight
                        : Colors.borderLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.adjustValue,
                    {
                      color:
                        adjustment > 0
                          ? Colors.success
                          : adjustment < 0
                          ? Colors.danger
                          : Colors.textTertiary,
                    },
                  ]}
                >
                  {adjustment > 0 ? '+' : ''}
                  {adjustment}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Details Card ───────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝  Details</Text>
          <CustomDropdown
            label="Reason *"
            options={REASON_OPTIONS}
            value={reason}
            onChange={setReason}
            placeholder="Select reason…"
          />
          <CustomInput
            label="Reference # (auto)"
            value={reference || '(auto-generated)'}
            editable={false}
          />
          <CustomInput
            label="Date"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
          <CustomInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* ── Recent History ─────────────────────────────── */}
        {displayAdj.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🕐  Recent Adjustments</Text>
            {displayAdj.map((a) => {
              const diff = a.quantityAfter - a.quantityBefore;
              return (
                <View key={a.id} style={styles.histRow}>
                  <View style={styles.histLeft}>
                    <Text style={styles.histItem} numberOfLines={1}>{a.itemName}</Text>
                    <Text style={styles.histMeta}>
                      {a.reason} · {a.reference} · {new Date(a.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.histDiff,
                      { color: diff > 0 ? Colors.success : diff < 0 ? Colors.danger : Colors.textTertiary },
                    ]}
                  >
                    {diff > 0 ? '+' : ''}{diff}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  saveBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  scroll: { padding: Spacing.base },

  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },

  readRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  readLabel: { fontSize: 14, color: Colors.textSecondary },
  readValueBox: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  readValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  adjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  adjustLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  adjustBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 56,
    alignItems: 'center',
  },
  adjustValue: { fontSize: 18, fontWeight: '800' },

  histRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  histLeft: { flex: 1, marginRight: Spacing.sm },
  histItem: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  histMeta: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  histDiff: { fontSize: 15, fontWeight: '700' },
});

export default AdjustmentScreen;
