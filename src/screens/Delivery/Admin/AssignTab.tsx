// ============================================================
// FINMATRIX - Assign Tab  (Delivery Management)
// ============================================================
// CREATE DELIVERY → modal with customer, items, priority, notes
// UNASSIGNED LIST → cards with checkboxes
// PERSONNEL ROW → horizontal scroll of available persons
// ASSIGN / AUTO-ASSIGN buttons

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import {
  createDelivery,
  assignDeliveries,
  autoAssignDeliveries,
} from '../../../store/deliverySlice';
import { Delivery, DeliveryPriority } from '../../../dummy-data/deliveries';
import { DeliveryPerson } from '../../../dummy-data/deliveryPersonnel';
import { InventoryItem } from '../../../dummy-data/inventoryItems';
import CustomDropdown from '../../../Custom-Components/CustomDropdown';
import CustomInput from '../../../Custom-Components/CustomInput';

// ─── Constants ──────────────────────────────────────────────
const PRIORITY_OPTIONS = [
  { label: 'Normal', value: 'normal' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

const PRIORITY_COLORS: Record<DeliveryPriority, { bg: string; text: string }> = {
  normal: { bg: Colors.borderLight, text: Colors.textSecondary },
  high: { bg: Colors.warningLight, text: Colors.warning },
  urgent: { bg: Colors.dangerLight, text: Colors.danger },
};

// ─── Component ──────────────────────────────────────────────
const AssignTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const { deliveries, deliveryPersonnel: personnel, isAssigning } = useAppSelector((s) => s.delivery);
  const inventoryItems = useAppSelector((s) => s.inventory.items);
  const customers = useAppSelector((s) => s.customers.customers);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formPriority, setFormPriority] = useState<DeliveryPriority>('normal');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<{ itemId: string; quantity: string }[]>([]);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [creating, setCreating] = useState(false);

  // ─── Derived data ─────────────────────────────────────
  const unassigned = useMemo(
    () => deliveries.filter((d) => d.status === 'unassigned'),
    [deliveries]
  );

  const availablePersonnel = useMemo(
    () => personnel.filter((p) => p.isAvailable && p.currentLoad < p.maxLoad),
    [personnel]
  );

  const customerOptions = useMemo(
    () =>
      customers
        .filter((c) => c.isActive)
        .map((c) => ({ label: `${c.company} — ${c.name}`, value: c.customerId })),
    [customers]
  );

  const activeInventory = useMemo(
    () => inventoryItems.filter((i) => i.isActive && i.quantityOnHand > 0),
    [inventoryItems]
  );

  // ─── Toggle selection ─────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === unassigned.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unassigned.map((d) => d.deliveryId)));
    }
  }, [unassigned, selectedIds.size]);

  // ─── Assign ───────────────────────────────────────────
  const handleAssign = useCallback(() => {
    if (selectedIds.size === 0) return Alert.alert('Select Deliveries', 'Check at least one delivery.');
    if (!selectedPersonId) return Alert.alert('Select Person', 'Tap a delivery person below.');
    Alert.alert(
      'Confirm Assignment',
      `Assign ${selectedIds.size} delivery(ies) to ${personnel.find((p) => p.userId === selectedPersonId)?.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: () => {
            dispatch(
              assignDeliveries({
                deliveryIds: Array.from(selectedIds),
                deliveryPersonId: selectedPersonId!,
              })
            );
            setSelectedIds(new Set());
            setSelectedPersonId(null);
          },
        },
      ]
    );
  }, [selectedIds, selectedPersonId, personnel, dispatch]);

  const handleAutoAssign = useCallback(() => {
    const ids = selectedIds.size > 0 ? Array.from(selectedIds) : unassigned.map((d) => d.deliveryId);
    if (ids.length === 0) return Alert.alert('No Deliveries', 'Nothing to assign.');
    Alert.alert(
      'Auto-Assign',
      `Distribute ${ids.length} delivery(ies) evenly among available personnel?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Auto-Assign',
          onPress: () => {
            dispatch(autoAssignDeliveries(ids));
            setSelectedIds(new Set());
            setSelectedPersonId(null);
          },
        },
      ]
    );
  }, [selectedIds, unassigned, dispatch]);

  // ─── Create Delivery ──────────────────────────────────
  const toggleFormItem = useCallback((item: InventoryItem) => {
    setFormItems((prev) => {
      const exists = prev.find((fi) => fi.itemId === item.itemId);
      if (exists) return prev.filter((fi) => fi.itemId !== item.itemId);
      return [...prev, { itemId: item.itemId, quantity: '1' }];
    });
  }, []);

  const updateFormItemQty = useCallback((itemId: string, qty: string) => {
    setFormItems((prev) =>
      prev.map((fi) => (fi.itemId === itemId ? { ...fi, quantity: qty } : fi))
    );
  }, []);

  const handleCreateDelivery = useCallback(async () => {
    if (!formCustomerId) return Alert.alert('Required', 'Select a customer.');
    if (formItems.length === 0) return Alert.alert('Required', 'Add at least one item.');

    const customer = customers.find((c) => c.customerId === formCustomerId);
    if (!customer) return Alert.alert('Error', 'Customer not found.');

    const parsedItems = formItems.map((fi) => {
      const inv = inventoryItems.find((i) => i.itemId === fi.itemId);
      return {
        itemId: fi.itemId,
        itemName: inv?.name || '',
        quantity: parseInt(fi.quantity, 10) || 1,
        description: inv?.description || '',
      };
    });

    setCreating(true);
    try {
      await dispatch(
        createDelivery({
          companyId: 'comp_001',
          assignmentId: null,
          customerId: customer.customerId,
          customerName: customer.company || customer.name,
          customerAddress: {
            street: customer.shippingAddress.street,
            city: customer.shippingAddress.city,
            state: customer.shippingAddress.state,
            zipCode: customer.shippingAddress.zipCode,
          },
          customerPhone: customer.phone,
          items: parsedItems,
          status: 'unassigned',
          deliveryPersonId: null,
          deliveryPersonName: null,
          priority: formPriority,
          signatureUrl: null,
          signedAt: null,
          customerVerified: false,
          customerVerifiedAt: null,
          notes: formNotes,
          photoUrls: [],
          deliveredAt: null,
          createdAt: new Date().toISOString(),
          originCoords: { latitude: 40.7128, longitude: -74.006 },
          destinationCoords: { latitude: 40.7580, longitude: -73.9855 },
        })
      );

      // Reset & close
      setFormCustomerId('');
      setFormPriority('normal');
      setFormNotes('');
      setFormItems([]);
      setShowCreate(false);
      Alert.alert('Created', 'Delivery added to unassigned list.');
    } finally {
      setCreating(false);
    }
  }, [formCustomerId, formItems, formPriority, formNotes, customers, inventoryItems, dispatch]);

  // ─── Render ───────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Action Bar ────────────────────────────────── */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.createBtnText}>+ Create Delivery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.autoBtn} onPress={handleAutoAssign} disabled={isAssigning}>
          <Text style={styles.autoBtnText}>⚡ Auto-Assign</Text>
        </TouchableOpacity>
      </View>

      {/* ── Personnel Row ─────────────────────────────── */}
      <View style={styles.personnelSection}>
        <Text style={styles.sectionLabel}>DELIVERY PERSONNEL</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.personnelScroll}>
          {personnel.map((p) => {
            const isSelected = selectedPersonId === p.userId;
            const loadPct = Math.round((p.currentLoad / p.maxLoad) * 100);
            return (
              <TouchableOpacity
                key={p.userId}
                style={[
                  styles.personCard,
                  isSelected && styles.personCardSelected,
                  !p.isAvailable && styles.personCardDisabled,
                ]}
                onPress={() => {
                  if (!p.isAvailable || p.currentLoad >= p.maxLoad) return;
                  setSelectedPersonId(isSelected ? null : p.userId);
                }}
                activeOpacity={p.isAvailable ? 0.7 : 1}
              >
                <View style={styles.personHeader}>
                  <View
                    style={[
                      styles.availDot,
                      { backgroundColor: p.isAvailable ? Colors.success : Colors.danger },
                    ]}
                  />
                  <Text style={styles.personName} numberOfLines={1}>{p.displayName}</Text>
                </View>
                <Text style={styles.personLoad}>
                  {p.currentLoad}/{p.maxLoad}
                </Text>
                <View style={styles.loadTrack}>
                  <View
                    style={[
                      styles.loadFill,
                      {
                        width: `${loadPct}%`,
                        backgroundColor:
                          loadPct >= 90 ? Colors.danger : loadPct >= 60 ? Colors.warning : Colors.success,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.personRating}>⭐ {p.rating} · {p.totalDeliveries} trips</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Unassigned Header ─────────────────────────── */}
      <View style={styles.listHeader}>
        <TouchableOpacity onPress={selectAll} style={styles.selectAllBtn}>
          <View style={[styles.checkbox, selectedIds.size === unassigned.length && unassigned.length > 0 && styles.checkboxChecked]}>
            {selectedIds.size === unassigned.length && unassigned.length > 0 && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
          <Text style={styles.selectAllText}>
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : `All (${unassigned.length})`}
          </Text>
        </TouchableOpacity>

        {selectedIds.size > 0 && selectedPersonId && (
          <TouchableOpacity
            style={[styles.assignBtn, isAssigning && { opacity: 0.6 }]}
            onPress={handleAssign}
            disabled={isAssigning}
          >
            <Text style={styles.assignBtnText}>
              {isAssigning ? 'Assigning…' : `Assign (${selectedIds.size})`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Unassigned List ───────────────────────────── */}
      {unassigned.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No Unassigned Deliveries</Text>
          <Text style={styles.emptySub}>Create a new delivery or all have been assigned.</Text>
        </View>
      ) : (
        <FlatList<Delivery>
          data={unassigned}
          keyExtractor={(d) => d.deliveryId}
          contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 20 }}
          renderItem={({ item: del }) => {
            const checked = selectedIds.has(del.deliveryId);
            const pc = PRIORITY_COLORS[del.priority as DeliveryPriority];
            return (
              <TouchableOpacity
                style={[styles.deliveryCard, checked && styles.deliveryCardChecked]}
                onPress={() => toggleSelect(del.deliveryId)}
                activeOpacity={0.7}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardCustomer} numberOfLines={1}>{del.customerName}</Text>
                      <View style={[styles.priorityBadge, { backgroundColor: pc.bg }]}>
                        <Text style={[styles.priorityText, { color: pc.text }]}>
                          {del.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardAddress} numberOfLines={1}>
                      {del.customerAddress.street}, {del.customerAddress.city}
                    </Text>
                    <Text style={styles.cardItems}>
                      {del.items.length} item{del.items.length > 1 ? 's' : ''} · {del.items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0)} units
                    </Text>
                    {del.notes ? (
                      <Text style={styles.cardNotes} numberOfLines={1}>📝 {del.notes}</Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ═══ CREATE DELIVERY MODAL ════════════════════════ */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Delivery</Text>
            <TouchableOpacity
              onPress={handleCreateDelivery}
              disabled={creating}
              style={{ opacity: creating ? 0.5 : 1 }}
            >
              <Text style={styles.modalSave}>{creating ? 'Creating…' : 'Create'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {/* Customer */}
            <View style={styles.formCard}>
              <Text style={styles.formCardTitle}>👤  Customer</Text>
              <CustomDropdown
                label="Customer"
                options={customerOptions}
                value={formCustomerId}
                onChange={setFormCustomerId}
                placeholder="Select customer…"
                searchable
              />
            </View>

            {/* Items */}
            <View style={styles.formCard}>
              <View style={styles.formCardHeader}>
                <Text style={styles.formCardTitle}>🏷️  Items</Text>
                <TouchableOpacity onPress={() => setShowItemPicker((v) => !v)}>
                  <Text style={styles.linkBtn}>{showItemPicker ? 'Done' : '+ Add Items'}</Text>
                </TouchableOpacity>
              </View>

              {showItemPicker && (
                <View style={styles.pickerBox}>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {activeInventory.map((inv) => {
                      const isPicked = formItems.some((fi) => fi.itemId === inv.itemId);
                      return (
                        <TouchableOpacity
                          key={inv.itemId}
                          style={[styles.pickRow, isPicked && styles.pickRowSelected]}
                          onPress={() => toggleFormItem(inv)}
                        >
                          <View style={[styles.checkbox, isPicked && styles.checkboxChecked]}>
                            {isPicked && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                            <Text style={styles.pickName}>{inv.name}</Text>
                            <Text style={styles.pickSku}>{inv.sku} · Avail: {inv.quantityOnHand}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {formItems.length > 0 && (
                <View style={{ marginTop: Spacing.md }}>
                  {formItems.map((fi) => {
                    const inv = inventoryItems.find((i) => i.itemId === fi.itemId);
                    return (
                      <View key={fi.itemId} style={styles.selectedItemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.selItemName}>{inv?.name || fi.itemId}</Text>
                          <Text style={styles.selItemSku}>{inv?.sku}</Text>
                        </View>
                        <TextInput
                          style={styles.qtyInput}
                          value={fi.quantity}
                          onChangeText={(t) => updateFormItemQty(fi.itemId, t)}
                          keyboardType="number-pad"
                          placeholder="Qty"
                          placeholderTextColor={Colors.placeholder}
                        />
                        <TouchableOpacity
                          onPress={() => setFormItems((p) => p.filter((x) => x.itemId !== fi.itemId))}
                          style={styles.removeBtn}
                        >
                          <Text style={styles.removeTxt}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Priority & Notes */}
            <View style={styles.formCard}>
              <Text style={styles.formCardTitle}>📋  Details</Text>
              <CustomDropdown
                label="Priority"
                options={PRIORITY_OPTIONS}
                value={formPriority}
                onChange={(v) => setFormPriority(v as DeliveryPriority)}
              />
              <CustomInput
                label="Notes (optional)"
                value={formNotes}
                onChangeText={setFormNotes}
                multiline
                numberOfLines={3}
                style={{ minHeight: 60 }}
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  createBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  createBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  autoBtn: {
    flex: 1,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  autoBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },

  // Personnel
  personnelSection: {
    paddingTop: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  personnelScroll: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  personCard: {
    width: 130,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  personCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.infoLight,
  },
  personCardDisabled: { opacity: 0.45 },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  availDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  personName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  personLoad: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginVertical: 2 },
  loadTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
    marginVertical: 3,
  },
  loadFill: { height: 4, borderRadius: 2 },
  personRating: { fontSize: 10, color: Colors.textTertiary, textAlign: 'center' },

  // List header
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center' },
  selectAllText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginLeft: 6 },
  assignBtn: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  assignBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },

  // Checkbox
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: { fontSize: 13, fontWeight: '700', color: Colors.white },

  // Delivery card
  deliveryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.sm,
  },
  deliveryCardChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.infoLight + '40',
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  cardCustomer: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  cardAddress: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  cardItems: { fontSize: 12, color: Colors.textTertiary },
  cardNotes: { fontSize: 11, color: Colors.info, marginTop: 3 },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginLeft: Spacing.sm,
  },
  priorityText: { fontSize: 10, fontWeight: '700' },

  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.base },
  emptyIcon: { fontSize: 36, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  emptySub: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center' },

  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  modalCancel: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  modalSave: { fontSize: 15, color: Colors.success, fontWeight: '700' },
  modalScroll: { padding: Spacing.base },

  // Form cards
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  formCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formCardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },
  linkBtn: { fontSize: 14, color: Colors.secondary, fontWeight: '600' },

  // Item picker
  pickerBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickRowSelected: { backgroundColor: Colors.infoLight },
  pickName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  pickSku: { fontSize: 11, color: Colors.textTertiary },

  selectedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  selItemName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  selItemSku: { fontSize: 11, color: Colors.textTertiary },
  qtyInput: {
    width: 60,
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
});

export default AssignTab;
