// ============================================================
// FINMATRIX - Inventory Form Screen  (Add / Edit)
// ============================================================
// Params: { itemId? }
// Collapsible sections: Basic, Pricing, Stock, Tracking, Location

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Switch,
  KeyboardAvoidingView,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { createInventoryItem, updateInventoryItem, fetchInventory } from './inventorySlice';
import { getInventoryItemByIdAPI } from '../../network/inventoryNetwork';
import { InventoryItem, Category, UnitOfMeasure, LocationId } from '../../dummy-data/inventoryItems';
import {
  InventoryFormData,
  validateInventoryItem,
  blankInventoryForm,
  generateSku,
  calcMarkupPercent,
  CATEGORY_OPTIONS,
  UOM_OPTIONS,
  LOCATION_OPTIONS,
} from '../../models/inventoryModel';
import CustomInput from '../../Custom-Components/CustomInput';
import CustomDropdown from '../../Custom-Components/CustomDropdown';

// ─── Section Component ──────────────────────────────────────
const CollapsibleSection: React.FC<{
  title: string;
  icon: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon, expanded, onToggle, children }) => (
  <View style={styles.section}>
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionArrow}>{expanded ? '▲' : '▼'}</Text>
    </TouchableOpacity>
    {expanded && <View style={styles.sectionBody}>{children}</View>}
  </View>
);

// ─── Main Component ─────────────────────────────────────────
const InventoryFormScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const itemId: string | undefined = route.params?.itemId;
  const isEdit = !!itemId;
  const dispatch = useAppDispatch();
  const allItems = useAppSelector((s) => s.inventory.items);

  const [form, setForm] = useState<InventoryFormData>(blankInventoryForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isDirty = useRef(false);

  // Section expansion state
  const [basicOpen, setBasicOpen] = useState(true);
  const [pricingOpen, setPricingOpen] = useState(true);
  const [stockOpen, setStockOpen] = useState(!isEdit);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  // ─── Load existing item ─────────────────────────────────
  useEffect(() => {
    if (isEdit && itemId) {
      setLoading(true);
      getInventoryItemByIdAPI(itemId)
        .then((item) => {
          setForm({
            name: item.name,
            sku: item.sku,
            description: item.description,
            category: item.category,
            unitOfMeasure: item.unitOfMeasure,
            costMethod: item.costMethod,
            unitCost: item.unitCost,
            sellingPrice: item.sellingPrice,
            quantityOnHand: item.quantityOnHand,
            reorderPoint: item.reorderPoint,
            reorderQuantity: item.reorderQuantity,
            minStock: item.minStock,
            maxStock: item.maxStock,
            serialTracking: item.serialTracking,
            lotTracking: item.lotTracking,
            barcodeData: item.barcodeData || '',
            locationId: item.locationId,
          });
          setLoading(false);
        })
        .catch(() => {
          Alert.alert('Error', 'Item not found');
          navigation.goBack();
        });
    }
  }, [isEdit, itemId]);

  // ─── Auto-generate SKU for new items ────────────────────
  useEffect(() => {
    if (!isEdit && !form.sku && allItems.length > 0) {
      setForm((prev) => ({ ...prev, sku: generateSku(allItems) }));
    }
  }, [isEdit, allItems]);

  // ─── Unsaved-changes guard ──────────────────────────────
  const confirmDiscard = useCallback((): boolean => {
    if (!isDirty.current) return false;
    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. Discard them?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
    return true;
  }, [navigation]);

  // Android hardware back
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => confirmDiscard());
    return () => sub.remove();
  }, [confirmDiscard]);

  // Header back button uses confirmDiscard (see onPress below)

  // ─── Markup calc ────────────────────────────────────────
  const markupPercent = useMemo(
    () => calcMarkupPercent(form.unitCost, form.sellingPrice),
    [form.unitCost, form.sellingPrice]
  );

  // ─── Field helpers ──────────────────────────────────────
  const set = useCallback(
    <K extends keyof InventoryFormData>(key: K, value: InventoryFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      isDirty.current = true;
      if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    },
    [errors]
  );

  const setNum = useCallback(
    (key: keyof InventoryFormData, text: string) => {
      const cleaned = text.replace(/[^0-9.]/g, '');
      const val = parseFloat(cleaned) || 0;
      set(key, val as any);
    },
    [set]
  );

  // ─── Save ───────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const result = validateInventoryItem(form, allItems, itemId);
    if (!result.isValid) {
      setErrors(result.errors);
      // Expand sections with errors
      if (result.errors.name || result.errors.sku) setBasicOpen(true);
      if (result.errors.unitCost || result.errors.sellingPrice) setPricingOpen(true);
      if (result.errors.quantityOnHand || result.errors.minStock || result.errors.maxStock || result.errors.reorderPoint) setStockOpen(true);
      return;
    }

    setSaving(true);
    try {
      if (isEdit && itemId) {
        // Only send editable fields — preserve quantityOnOrder, quantityCommitted, isActive
        await dispatch(
          updateInventoryItem({
            id: itemId,
            data: {
              ...form,
              barcodeData: form.barcodeData || null,
            },
          })
        ).unwrap();
        Alert.alert('Success', 'Item updated', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await dispatch(
          createInventoryItem({
            ...form,
            companyId: 'comp_001',
            barcodeData: form.barcodeData || null,
            quantityOnOrder: 0,
            quantityCommitted: 0,
            isActive: true,
            imageUrl: null,
          })
        ).unwrap();
        Alert.alert('Success', 'Item created', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (e: any) {
      Alert.alert('Error', e || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [form, allItems, itemId, isEdit, dispatch, navigation]);

  // ─── Loading ────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // ─── Render ─────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ───────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (!confirmDiscard()) navigation.goBack(); }}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Item' : 'New Item'}</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ═══ BASIC INFO ════════════════════════════════════ */}
        <CollapsibleSection
          title="Basic Info"
          icon="📋"
          expanded={basicOpen}
          onToggle={() => setBasicOpen(!basicOpen)}
        >
          <CustomInput
            label="Name *"
            placeholder="Item name"
            value={form.name}
            onChangeText={(t) => set('name', t)}
            error={errors.name}
          />
          <View style={styles.row}>
            <View style={styles.rowFlex}>
              <CustomInput
                label="SKU *"
                placeholder="SKU-001"
                value={form.sku}
                onChangeText={(t) => set('sku', t)}
                error={errors.sku}
              />
            </View>
            {!isEdit && (
              <TouchableOpacity
                style={styles.autoBtn}
                onPress={() => set('sku', generateSku(allItems))}
              >
                <Text style={styles.autoBtnText}>Auto</Text>
              </TouchableOpacity>
            )}
          </View>
          <CustomInput
            label="Description"
            placeholder="Optional description"
            value={form.description}
            onChangeText={(t) => set('description', t)}
            multiline
            numberOfLines={3}
          />
          <CustomDropdown
            label="Category"
            options={CATEGORY_OPTIONS}
            value={form.category}
            onChange={(v) => set('category', v as Category)}
          />
          <CustomDropdown
            label="Unit of Measure"
            options={UOM_OPTIONS}
            value={form.unitOfMeasure}
            onChange={(v) => set('unitOfMeasure', v as UnitOfMeasure)}
          />
        </CollapsibleSection>

        {/* ═══ PRICING ═══════════════════════════════════════ */}
        <CollapsibleSection
          title="Pricing"
          icon="💰"
          expanded={pricingOpen}
          onToggle={() => setPricingOpen(!pricingOpen)}
        >
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Cost Method</Text>
            <Text style={styles.readOnlyValue}>Weighted Average</Text>
          </View>
          <CustomInput
            label="Unit Cost *"
            placeholder="0.00"
            value={form.unitCost > 0 ? String(form.unitCost) : ''}
            onChangeText={(t) => setNum('unitCost', t)}
            keyboardType="decimal-pad"
            error={errors.unitCost}
          />
          <CustomInput
            label="Selling Price *"
            placeholder="0.00"
            value={form.sellingPrice > 0 ? String(form.sellingPrice) : ''}
            onChangeText={(t) => setNum('sellingPrice', t)}
            keyboardType="decimal-pad"
            error={errors.sellingPrice}
          />
          <View style={styles.readOnlyRow}>
            <Text style={styles.readOnlyLabel}>Markup %</Text>
            <Text
              style={[
                styles.readOnlyValue,
                { color: markupPercent > 0 ? Colors.success : Colors.danger },
              ]}
            >
              {markupPercent > 0 ? '+' : ''}{markupPercent}%
            </Text>
          </View>
        </CollapsibleSection>

        {/* ═══ STOCK ═════════════════════════════════════════ */}
        <CollapsibleSection
          title="Stock Levels"
          icon="📦"
          expanded={stockOpen}
          onToggle={() => setStockOpen(!stockOpen)}
        >
          <CustomInput
            label="Quantity on Hand *"
            placeholder="0"
            value={form.quantityOnHand > 0 ? String(form.quantityOnHand) : ''}
            onChangeText={(t) => setNum('quantityOnHand', t)}
            keyboardType="number-pad"
            error={errors.quantityOnHand}
          />
          <View style={styles.row2}>
            <View style={styles.halfField}>
              <CustomInput
                label="Reorder Point"
                placeholder="0"
                value={form.reorderPoint > 0 ? String(form.reorderPoint) : ''}
                onChangeText={(t) => setNum('reorderPoint', t)}
                keyboardType="number-pad"
                error={errors.reorderPoint}
              />
            </View>
            <View style={styles.halfField}>
              <CustomInput
                label="Reorder Qty"
                placeholder="0"
                value={form.reorderQuantity > 0 ? String(form.reorderQuantity) : ''}
                onChangeText={(t) => setNum('reorderQuantity', t)}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.halfField}>
              <CustomInput
                label="Min Stock"
                placeholder="0"
                value={form.minStock > 0 ? String(form.minStock) : ''}
                onChangeText={(t) => setNum('minStock', t)}
                keyboardType="number-pad"
                error={errors.minStock}
              />
            </View>
            <View style={styles.halfField}>
              <CustomInput
                label="Max Stock"
                placeholder="100"
                value={form.maxStock > 0 ? String(form.maxStock) : ''}
                onChangeText={(t) => setNum('maxStock', t)}
                keyboardType="number-pad"
                error={errors.maxStock}
              />
            </View>
          </View>
        </CollapsibleSection>

        {/* ═══ TRACKING ══════════════════════════════════════ */}
        <CollapsibleSection
          title="Tracking"
          icon="🔖"
          expanded={trackingOpen}
          onToggle={() => setTrackingOpen(!trackingOpen)}
        >
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Serial Number Tracking</Text>
            <Switch
              value={form.serialTracking}
              onValueChange={(v) => set('serialTracking', v)}
              trackColor={{ false: Colors.border, true: Colors.success + '80' }}
              thumbColor={form.serialTracking ? Colors.success : Colors.textTertiary}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Lot / Batch Tracking</Text>
            <Switch
              value={form.lotTracking}
              onValueChange={(v) => set('lotTracking', v)}
              trackColor={{ false: Colors.border, true: Colors.success + '80' }}
              thumbColor={form.lotTracking ? Colors.success : Colors.textTertiary}
            />
          </View>
          <CustomInput
            label="Barcode / UPC"
            placeholder="Enter or scan barcode"
            value={form.barcodeData}
            onChangeText={(t) => set('barcodeData', t)}
          />
          <TouchableOpacity style={styles.scanBtn} onPress={() => Alert.alert('Scanner', 'Barcode scanner placeholder – hardware integration required.')}>
            <Text style={styles.scanBtnText}>📷  Scan Barcode</Text>
          </TouchableOpacity>
        </CollapsibleSection>

        {/* ═══ LOCATION ══════════════════════════════════════ */}
        <CollapsibleSection
          title="Location"
          icon="📍"
          expanded={locationOpen}
          onToggle={() => setLocationOpen(!locationOpen)}
        >
          <CustomDropdown
            label="Warehouse / Location"
            options={LOCATION_OPTIONS}
            value={form.locationId}
            onChange={(v) => set('locationId', v as LocationId)}
          />
        </CollapsibleSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  saveBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },

  scroll: { padding: Spacing.base },

  // Sections
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  sectionIcon: { fontSize: 18, marginRight: Spacing.sm },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  sectionArrow: { fontSize: 12, color: Colors.textTertiary },
  sectionBody: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },

  // Rows
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  rowFlex: { flex: 1 },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  halfField: { flex: 1 },

  // Auto SKU button
  autoBtn: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: 6,
    height: 38,
    justifyContent: 'center',
  },
  autoBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },

  // Read-only row
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  readOnlyLabel: { fontSize: 14, color: Colors.textSecondary },
  readOnlyValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  toggleLabel: { fontSize: 14, color: Colors.textPrimary },

  // Scan button
  scanBtn: {
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  scanBtnText: { fontSize: 14, color: Colors.secondary, fontWeight: '500' },
});

export default InventoryFormScreen;
