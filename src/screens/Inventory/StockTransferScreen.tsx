// ============================================================
// FINMATRIX - Stock Transfer Screen
// ============================================================
// From Location → To Location, multi-select items, qty per item,
// date, reference (auto), notes.  Creates TransferRecord.

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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { fetchInventory, createTransfer } from './inventorySlice';
import { InventoryItem } from '../../dummy-data/inventoryItems';
import { TransferRecord } from '../../dummy-data/transfers';
import { transferStockAPI, getTransfersAPI } from '../../network/inventoryNetwork';
import { LOCATION_OPTIONS, LOCATION_LABELS } from '../../models/inventoryModel';
import CustomDropdown from '../../Custom-Components/CustomDropdown';
import CustomInput from '../../Custom-Components/CustomInput';

// ─── Picked item row ────────────────────────────────────────
interface PickedItem {
  itemId: string;
  itemName: string;
  sku: string;
  available: number;
  quantity: string; // text for editing
}

// ─── Component ──────────────────────────────────────────────
const StockTransferScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { items, isLoading } = useAppSelector((s) => s.inventory);

  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [picked, setPicked] = useState<PickedItem[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [recentTransfers, setRecentTransfers] = useState<TransferRecord[]>([]);

  useEffect(() => {
    if (items.length === 0) dispatch(fetchInventory());
  }, [dispatch, items.length]);

  // Load recent transfers
  useEffect(() => {
    getTransfersAPI().then((all) => setRecentTransfers(all.slice(0, 5)));
  }, []);

  // Items at selected "from" location
  const availableItems = useMemo(
    () =>
      items.filter((i) => i.isActive && i.locationId === fromLocation && i.quantityOnHand > 0),
    [items, fromLocation]
  );

  // To-location options (exclude fromLocation)
  const toOptions = useMemo(
    () => LOCATION_OPTIONS.filter((o) => o.value !== fromLocation),
    [fromLocation]
  );

  // Reset picks if fromLocation changes
  useEffect(() => {
    setPicked([]);
    setToLocation('');
  }, [fromLocation]);

  // ─── Add item ──────────────────────────────────────────
  const toggleItem = useCallback((item: InventoryItem) => {
    setPicked((prev) => {
      const exists = prev.find((p) => p.itemId === item.itemId);
      if (exists) return prev.filter((p) => p.itemId !== item.itemId);
      return [
        ...prev,
        {
          itemId: item.itemId,
          itemName: item.name,
          sku: item.sku,
          available: item.quantityOnHand,
          quantity: '',
        },
      ];
    });
  }, []);

  const updateQty = useCallback((itemId: string, text: string) => {
    setPicked((prev) =>
      prev.map((p) => (p.itemId === itemId ? { ...p, quantity: text } : p))
    );
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setPicked((prev) => prev.filter((p) => p.itemId !== itemId));
  }, []);

  // ─── Save ──────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    // Validate
    if (!fromLocation) return Alert.alert('Required', 'Select a From location.');
    if (!toLocation) return Alert.alert('Required', 'Select a To location.');
    if (picked.length === 0) return Alert.alert('Required', 'Add at least one item.');

    const parsed = picked.map((p) => {
      const qty = parseInt(p.quantity, 10);
      return { ...p, qty };
    });
    const invalid = parsed.find((p) => isNaN(p.qty) || p.qty <= 0);
    if (invalid)
      return Alert.alert('Invalid', `Enter a valid quantity for ${invalid.itemName}.`);
    const overStock = parsed.find((p) => p.qty > p.available);
    if (overStock)
      return Alert.alert(
        'Exceeds Stock',
        `${overStock.itemName} only has ${overStock.available} available.`
      );

    setSaving(true);
    try {
      // Transfer stock for each item via network API
      for (const p of parsed) {
        await transferStockAPI(p.itemId, toLocation, p.qty);
      }

      // Create transfer record via Redux thunk
      const record = await dispatch(
        createTransfer({
          date: new Date(date).toISOString(),
          fromLocationId: fromLocation,
          fromLocationName: LOCATION_LABELS[fromLocation] || fromLocation,
          toLocationId: toLocation,
          toLocationName: LOCATION_LABELS[toLocation] || toLocation,
          items: parsed.map((p) => ({
            itemId: p.itemId,
            itemName: p.itemName,
            sku: p.sku,
            quantity: p.qty,
          })),
          status: 'completed',
          createdBy: 'admin@finmatrix.com',
        })
      ).unwrap();

      // Refresh recent list & inventory
      setRecentTransfers((prev) => [record, ...prev].slice(0, 5));
      dispatch(fetchInventory());

      Alert.alert('Success', `Transfer ${record.reference} completed.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || e || 'Transfer failed');
    } finally {
      setSaving(false);
    }
  }, [fromLocation, toLocation, picked, date, dispatch, navigation]);

  // ─── Loading ──────────────────────────────────────────
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
      {/* ── Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stock Transfer</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{ opacity: saving ? 0.5 : 1 }}
        >
          <Text style={styles.saveBtn}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Locations ─────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦  Locations</Text>
          <CustomDropdown
            label="From Location"
            options={LOCATION_OPTIONS}
            value={fromLocation}
            onChange={setFromLocation}
            placeholder="Select origin…"
          />
          <CustomDropdown
            label="To Location"
            options={toOptions}
            value={toLocation}
            onChange={setToLocation}
            placeholder={fromLocation ? 'Select destination…' : 'Pick From first'}
            disabled={!fromLocation}
          />
        </View>

        {/* ── Item picker ───────────────────────────────── */}
        {fromLocation !== '' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>🏷️  Items</Text>
              <TouchableOpacity onPress={() => setShowPicker((v) => !v)}>
                <Text style={styles.linkBtn}>{showPicker ? 'Done' : '+ Add Items'}</Text>
              </TouchableOpacity>
            </View>

            {showPicker && (
              <View style={styles.pickerBox}>
                {availableItems.length === 0 ? (
                  <Text style={styles.emptyText}>No available items at this location.</Text>
                ) : (
                  availableItems.map((item) => {
                    const isPicked = picked.some((p) => p.itemId === item.itemId);
                    return (
                      <TouchableOpacity
                        key={item.itemId}
                        style={[styles.pickRow, isPicked && styles.pickRowSelected]}
                        onPress={() => toggleItem(item)}
                      >
                        <View style={styles.checkbox}>
                          {isPicked && <Text style={styles.check}>✓</Text>}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pickName}>{item.name}</Text>
                          <Text style={styles.pickSku}>
                            {item.sku}  •  Avail: {item.quantityOnHand}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            {/* Selected items with qty */}
            {picked.length > 0 && (
              <View style={{ marginTop: Spacing.md }}>
                {picked.map((p) => (
                  <View key={p.itemId} style={styles.selectedRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selName}>{p.itemName}</Text>
                      <Text style={styles.selSub}>{p.sku}  •  Avail: {p.available}</Text>
                    </View>
                    <TextInput
                      style={styles.qtyInput}
                      value={p.quantity}
                      onChangeText={(t) => updateQty(p.itemId, t)}
                      keyboardType="number-pad"
                      placeholder="Qty"
                      placeholderTextColor={Colors.placeholder}
                    />
                    <TouchableOpacity
                      onPress={() => removeItem(p.itemId)}
                      style={styles.removeBtn}
                    >
                      <Text style={styles.removeTxt}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Details ───────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋  Details</Text>
          <View style={styles.readOnlyRow}>
            <Text style={styles.roLabel}>Reference</Text>
            <Text style={styles.roValue}>(auto-generated)</Text>
          </View>
          <CustomInput label="Transfer Date" value={date} onChangeText={setDate} />
          <CustomInput
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={{ minHeight: 60 }}
          />
        </View>

        {/* ── Recent Transfers ──────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📜  Recent Transfers</Text>
          {recentTransfers.map((t) => (
            <View key={t.id} style={styles.histRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.histRef}>{t.reference}</Text>
                <Text style={styles.histDetail}>
                  {t.fromLocationName} → {t.toLocationName}
                </Text>
                <Text style={styles.histDate}>{t.date.slice(0, 10)}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      t.status === 'completed'
                        ? Colors.successLight
                        : t.status === 'pending'
                        ? Colors.warningLight
                        : Colors.dangerLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        t.status === 'completed'
                          ? Colors.success
                          : t.status === 'pending'
                          ? Colors.warning
                          : Colors.danger,
                    },
                  ]}
                >
                  {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                </Text>
              </View>
            </View>
          ))}
        </View>

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
  saveBtn: { fontSize: 15, color: Colors.success, fontWeight: '600' },
  scroll: { padding: Spacing.base },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },
  linkBtn: { fontSize: 14, color: Colors.secondary, fontWeight: '600' },

  // Picker
  pickerBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    maxHeight: 250,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickRowSelected: { backgroundColor: Colors.infoLight },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  check: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  pickName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  pickSku: { fontSize: 11, color: Colors.textTertiary },
  emptyText: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center', padding: Spacing.md },

  // Selected items
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  selName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  selSub: { fontSize: 11, color: Colors.textTertiary },
  qtyInput: {
    width: 65,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xs,
    paddingVertical: Platform.OS === 'ios' ? 6 : 2,
    marginHorizontal: 6,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeTxt: { fontSize: 13, color: Colors.danger, fontWeight: '700' },

  // Read-only
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  roLabel: { fontSize: 13, color: Colors.textSecondary },
  roValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // History
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  histRef: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  histDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  histDate: { fontSize: 11, color: Colors.textTertiary },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
});

export default StockTransferScreen;
