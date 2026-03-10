// ============================================================
// FINMATRIX - Agency Form Screen (Create / Edit)
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import {
  addAgency,
  updateAgency,
  selectActiveCompany,
  selectActiveCompanyId,
} from '../../store/companySlice';
import { syncAgencyItems } from '../Inventory/inventorySlice';
import type {
  WarehouseAgency,
  AgencyInventoryItem,
  AgencyAddress,
} from '../../dummy-data/warehouseAgencies';
import type { InventoryItem } from '../../dummy-data/inventoryItems';

const AGENCY_TYPES: { value: WarehouseAgency['type']; label: string }[] = [
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'supply', label: 'Supply' },
  { value: 'distribution', label: 'Distribution' },
];

interface ItemForm {
  tempId: string;
  name: string;
  sku: string;
  unitCost: string;
  sellingPrice: string;
  quantity: string;
  reorderPoint: string;
}

const generateSKU = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let sku = 'AG-';
  for (let i = 0; i < 6; i++) sku += chars.charAt(Math.floor(Math.random() * chars.length));
  return sku;
};

const generateId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

// ─── Main Component ─────────────────────────────────────────
const AgencyFormScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const agencyId = route.params?.agencyId as string | undefined;
  const dispatch = useAppDispatch();
  const company = useAppSelector(selectActiveCompany);
  const companyId = useAppSelector(selectActiveCompanyId) ?? '';

  const existingAgency = agencyId
    ? company?.agencies.find((a) => a.agencyId === agencyId)
    : undefined;

  const isEdit = !!existingAgency;

  // ── Form state ────────────────────────────────────────────
  const [name, setName] = useState('');
  const [type, setType] = useState<WarehouseAgency['type']>('manufacturing');
  const [description, setDescription] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Inventory items
  const [inventoryItems, setInventoryItems] = useState<AgencyInventoryItem[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState<ItemForm>({
    tempId: '',
    name: '',
    sku: generateSKU(),
    unitCost: '',
    sellingPrice: '',
    quantity: '',
    reorderPoint: '',
  });

  // Seed from existing agency on edit
  useEffect(() => {
    if (existingAgency) {
      setName(existingAgency.name);
      setType(existingAgency.type);
      setDescription(existingAgency.description);
      setStreet(existingAgency.address.street);
      setCity(existingAgency.address.city);
      setAddrState(existingAgency.address.state);
      setZipCode(existingAgency.address.zipCode);
      setContactPerson(existingAgency.contactPerson);
      setPhone(existingAgency.contactPhone);
      setEmail(existingAgency.contactEmail);
      setInventoryItems([...existingAgency.inventoryItems]);
    }
  }, [existingAgency?.agencyId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Validation ────────────────────────────────────────────
  const validate = (): boolean => {
    if (!name.trim()) { Alert.alert('Validation', 'Agency name is required'); return false; }
    if (!contactPerson.trim()) { Alert.alert('Validation', 'Contact person is required'); return false; }
    if (!phone.trim()) { Alert.alert('Validation', 'Phone is required'); return false; }
    if (!email.trim()) { Alert.alert('Validation', 'Email is required'); return false; }
    return true;
  };

  // ── Save ──────────────────────────────────────────────────
  const handleSave = () => {
    if (!validate()) return;

    const address: AgencyAddress = { street, city, state: addrState, zipCode };
    const agencyData: WarehouseAgency = {
      agencyId: existingAgency?.agencyId ?? generateId('agency'),
      companyId,
      name: name.trim(),
      type,
      description: description.trim(),
      address,
      contactPerson: contactPerson.trim(),
      contactPhone: phone.trim(),
      contactEmail: email.trim(),
      inventoryItems,
      isActive: true,
      createdAt: existingAgency?.createdAt ?? new Date().toISOString(),
    };

    if (isEdit) {
      dispatch(updateAgency({ companyId, agencyId: agencyData.agencyId, updates: agencyData }));
    } else {
      dispatch(addAgency({ companyId, agency: agencyData }));
    }

    // Sync agency inventory items into main inventory system
    const mainItems: InventoryItem[] = inventoryItems.map((ai) => ({
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
      maxStock: ai.quantityOnHand * 3,
      isActive: true,
      serialTracking: false,
      lotTracking: false,
      barcodeData: null,
      locationId: 'warehouse_1' as any,
      imageUrl: null,
      lastUpdated: new Date().toISOString(),
      sourceAgencyId: agencyData.agencyId,
    }));
    dispatch(syncAgencyItems({ items: mainItems }));

    navigation.goBack();
  };

  // ── Inventory item add ────────────────────────────────────
  const handleAddItem = () => {
    if (!itemForm.name.trim()) {
      Alert.alert('Validation', 'Item name is required');
      return;
    }
    const newItem: AgencyInventoryItem = {
      itemId: generateId('aginv'),
      name: itemForm.name.trim(),
      sku: itemForm.sku || generateSKU(),
      unitCost: parseFloat(itemForm.unitCost) || 0,
      sellingPrice: parseFloat(itemForm.sellingPrice) || 0,
      quantityOnHand: parseInt(itemForm.quantity, 10) || 0,
      reorderPoint: parseInt(itemForm.reorderPoint, 10) || 10,
    };
    setInventoryItems((prev) => [...prev, newItem]);
    setItemForm({
      tempId: '',
      name: '',
      sku: generateSKU(),
      unitCost: '',
      sellingPrice: '',
      quantity: '',
      reorderPoint: '',
    });
    setShowItemForm(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setInventoryItems((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  // ── Render ────────────────────────────────────────────────
  const renderField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts?: { placeholder?: string; required?: boolean; keyboard?: any; multiline?: boolean },
  ) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {opts?.required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.fieldInput, opts?.multiline && styles.fieldMultiline]}
        value={value}
        onChangeText={onChange}
        placeholder={opts?.placeholder ?? ''}
        placeholderTextColor={Colors.placeholder}
        keyboardType={opts?.keyboard}
        multiline={opts?.multiline}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Edit Agency' : 'New Agency'}
        </Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* BASIC INFO */}
          <Text style={styles.sectionLabel}>BASIC INFO</Text>
          <View style={styles.card}>
            {renderField('Agency Name', name, setName, { required: true })}
            {/* Type Picker */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Type <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowTypePicker(!showTypePicker)}
              >
                <Text style={styles.pickerBtnText}>
                  {AGENCY_TYPES.find((t) => t.value === type)?.label ?? type}
                </Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
              {showTypePicker && (
                <View style={styles.pickerOptions}>
                  {AGENCY_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      style={[
                        styles.pickerOption,
                        type === t.value && styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        setType(t.value);
                        setShowTypePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          type === t.value && styles.pickerOptionTextActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            {renderField('Description', description, setDescription, {
              multiline: true,
            })}
          </View>

          {/* ADDRESS */}
          <Text style={styles.sectionLabel}>ADDRESS</Text>
          <View style={styles.card}>
            {renderField('Street', street, setStreet)}
            <View style={styles.row}>
              <View style={styles.halfField}>
                {renderField('City', city, setCity)}
              </View>
              <View style={styles.halfField}>
                {renderField('State', addrState, setAddrState)}
              </View>
            </View>
            {renderField('ZIP Code', zipCode, setZipCode, { keyboard: 'number-pad' })}
          </View>

          {/* CONTACT */}
          <Text style={styles.sectionLabel}>CONTACT</Text>
          <View style={styles.card}>
            {renderField('Contact Person', contactPerson, setContactPerson, {
              required: true,
            })}
            {renderField('Phone', phone, setPhone, {
              required: true,
              keyboard: 'phone-pad',
            })}
            {renderField('Email', email, setEmail, {
              required: true,
              keyboard: 'email-address',
            })}
          </View>

          {/* INVENTORY */}
          <Text style={styles.sectionLabel}>INVENTORY ITEMS</Text>
          <View style={styles.card}>
            {inventoryItems.length === 0 && !showItemForm && (
              <Text style={styles.emptyItems}>No items added yet</Text>
            )}

            {inventoryItems.map((item) => (
              <View key={item.itemId} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSku}>{item.sku}</Text>
                  <Text style={styles.itemMeta}>
                    Qty: {item.quantityOnHand} | Cost: PKR {item.unitCost.toLocaleString()} | Sell: PKR{' '}
                    {item.sellingPrice.toLocaleString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveItem(item.itemId)}
                >
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {showItemForm && (
              <View style={styles.inlineForm}>
                <Text style={styles.inlineFormTitle}>Add Item</Text>
                {renderField('Item Name', itemForm.name, (v) =>
                  setItemForm((prev) => ({ ...prev, name: v })),
                )}
                {renderField('SKU (auto-generated)', itemForm.sku, (v) =>
                  setItemForm((prev) => ({ ...prev, sku: v })),
                )}
                <View style={styles.row}>
                  <View style={styles.halfField}>
                    {renderField('Unit Cost', itemForm.unitCost, (v) =>
                      setItemForm((prev) => ({ ...prev, unitCost: v })),
                      { keyboard: 'numeric' },
                    )}
                  </View>
                  <View style={styles.halfField}>
                    {renderField('Selling Price', itemForm.sellingPrice, (v) =>
                      setItemForm((prev) => ({ ...prev, sellingPrice: v })),
                      { keyboard: 'numeric' },
                    )}
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.halfField}>
                    {renderField('Initial Quantity', itemForm.quantity, (v) =>
                      setItemForm((prev) => ({ ...prev, quantity: v })),
                      { keyboard: 'numeric' },
                    )}
                  </View>
                  <View style={styles.halfField}>
                    {renderField('Reorder Point', itemForm.reorderPoint, (v) =>
                      setItemForm((prev) => ({ ...prev, reorderPoint: v })),
                      { keyboard: 'numeric' },
                    )}
                  </View>
                </View>
                <View style={styles.inlineActions}>
                  <TouchableOpacity
                    style={styles.cancelItemBtn}
                    onPress={() => setShowItemForm(false)}
                  >
                    <Text style={styles.cancelItemText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
                    <Text style={styles.addItemText}>Add Item</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!showItemForm && (
              <TouchableOpacity
                style={styles.addItemTrigger}
                onPress={() => setShowItemForm(true)}
              >
                <Text style={styles.addItemTriggerText}>+ Add Item</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginLeft: Spacing.sm },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  saveBtnText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  // Fields
  field: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  required: { color: Colors.danger },
  fieldInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldMultiline: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: Spacing.md },
  halfField: { flex: 1 },
  // Picker
  pickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerBtnText: { fontSize: 15, color: Colors.textPrimary },
  pickerArrow: { fontSize: 10, color: Colors.textTertiary },
  pickerOptions: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerOption: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  pickerOptionActive: { backgroundColor: Colors.primary + '10' },
  pickerOptionText: { fontSize: 14, color: Colors.textPrimary },
  pickerOptionTextActive: { color: Colors.primary, fontWeight: '600' },
  // Inventory items
  emptyItems: { fontSize: 14, color: Colors.textTertiary, textAlign: 'center', paddingVertical: Spacing.md },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  itemSku: { fontSize: 11, color: Colors.textTertiary, fontFamily: 'monospace' },
  itemMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.dangerLight, justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: Colors.danger, fontSize: 12, fontWeight: '700' },
  // Inline form
  inlineForm: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  inlineFormTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  inlineActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.sm },
  cancelItemBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  cancelItemText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
  addItemBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  addItemText: { color: Colors.white, fontSize: 14, fontWeight: '600' },
  addItemTrigger: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: Spacing.sm,
  },
  addItemTriggerText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});

export default AgencyFormScreen;
