// ============================================================
// FINMATRIX - Purchase Order Form Screen
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import CustomDropdown from '../../Custom-Components/CustomDropdown';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { createPurchaseOrder, updatePurchaseOrder, fetchPurchaseOrders } from './poSlice';
import { PurchaseOrder, POLine, POStatus } from '../../dummy-data/purchaseOrders';
import {
  blankPOLine,
  calcPOTotals,
  validatePO,
  PO_TAX_RATE_OPTIONS,
  ITEM_DROPDOWN_OPTIONS,
  getItemById,
} from '../../models/poModel';
import { getNextPONumberAPI, getPurchaseOrderByIdAPI } from '../../network/poNetwork';

/* ================================================================
   COMPONENT
   ================================================================ */
const POFormScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();

  const poId: string | undefined = route.params?.poId;
  const isEdit = !!poId;

  const vendors = useAppSelector((s) => s.vendors.vendors);

  /* ── vendor dropdown options ─────────────────────────── */
  const vendorOptions = useMemo(
    () =>
      vendors
        .filter((v) => v.isActive)
        .map((v) => ({ label: v.companyName, value: v.vendorId })),
    [vendors],
  );

  /* ── form state ──────────────────────────────────────── */
  const [vendorId, setVendorId] = useState('');
  const [poNumber, setPONumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [lines, setLines] = useState<POLine[]>([blankPOLine()]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ── auto-calc expected date (14 days from date) ─────── */
  useEffect(() => {
    if (date && !isEdit && !expectedDate) {
      const d = new Date(date);
      d.setDate(d.getDate() + 14);
      setExpectedDate(d.toISOString().split('T')[0]);
    }
  }, [date, isEdit, expectedDate]);

  /* ── load existing PO (edit mode) ────────────────────── */
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getPurchaseOrderByIdAPI(poId!).then((p) => {
        if (p) {
          setVendorId(p.vendorId);
          setPONumber(p.poNumber);
          setDate(p.date);
          setExpectedDate(p.expectedDate);
          setLines(p.lines.length ? p.lines : [blankPOLine()]);
          setNotes(p.notes);
        }
        setLoading(false);
      });
    } else {
      getNextPONumberAPI().then(setPONumber);
    }
  }, [poId, isEdit]);

  /* ── totals ──────────────────────────────────────────── */
  const { subtotal, taxAmount, total } = useMemo(
    () => calcPOTotals(lines),
    [lines],
  );

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  /* ── line handlers ───────────────────────────────────── */
  const updateLine = useCallback(
    (idx: number, patch: Partial<POLine>) => {
      setLines((prev) => {
        const copy = [...prev];
        const updated = { ...copy[idx], ...patch };
        // auto-calc amount
        updated.amount = updated.quantity * updated.unitCost;
        copy[idx] = updated;
        return copy;
      });
    },
    [],
  );

  const handleItemSelect = useCallback(
    (idx: number, itemId: string) => {
      const item = getItemById(itemId);
      if (item) {
        updateLine(idx, {
          itemId: item.itemId,
          itemName: item.itemName,
          description: item.itemName,
          unitCost: item.unitCost,
        });
      }
    },
    [updateLine],
  );

  const removeLine = useCallback((idx: number) => {
    setLines((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx),
    );
  }, []);

  const addLine = useCallback(
    () => setLines((prev) => [...prev, blankPOLine()]),
    [],
  );

  /* ── save ────────────────────────────────────────────── */
  const handleSave = async (status: POStatus) => {
    const vendorName =
      vendors.find((v) => v.vendorId === vendorId)?.companyName ?? '';

    const po: PurchaseOrder = {
      poId: isEdit ? poId! : `po_${Date.now()}`,
      companyId: 'company_1',
      vendorId,
      vendorName,
      poNumber,
      date,
      expectedDate,
      lines: lines.map((l) => ({
        ...l,
        amount: l.quantity * l.unitCost,
      })),
      subtotal,
      taxAmount,
      total,
      status,
      notes,
      createdAt: isEdit ? date : new Date().toISOString(),
    };

    const errors = validatePO(po);
    if (errors.length) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await dispatch(updatePurchaseOrder(po)).unwrap();
      } else {
        await dispatch(createPurchaseOrder(po)).unwrap();
      }
      await dispatch(fetchPurchaseOrders());
      Alert.alert('Success', `PO ${isEdit ? 'updated' : 'created'} successfully.`);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save purchase order.');
    } finally {
      setSaving(false);
    }
  };

  /* ── loading state ───────────────────────────────────── */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  /* ── render ──────────────────────────────────────────── */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Edit PO' : 'New Purchase Order'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Vendor ─────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>VENDOR</Text>
          <CustomDropdown
            label="Vendor"
            options={vendorOptions}
            value={vendorId}
            onChange={setVendorId}
            placeholder="Select vendor..."
            searchable
          />
        </View>

        {/* ── PO Details ─────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PO DETAILS</Text>
          <Text style={styles.fieldLabel}>PO Number</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={poNumber}
            editable={false}
          />
          <Text style={styles.fieldLabel}>PO Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.placeholder}
          />
          <Text style={styles.fieldLabel}>Expected Delivery Date</Text>
          <TextInput
            style={styles.input}
            value={expectedDate}
            onChangeText={setExpectedDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.placeholder}
          />
        </View>

        {/* ── Line Items ─────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>LINE ITEMS</Text>
          {lines.map((line, idx) => (
            <View key={line.lineId} style={styles.lineItem}>
              <View style={styles.lineHeader}>
                <Text style={styles.lineIndex}>#{idx + 1}</Text>
                {lines.length > 1 && (
                  <TouchableOpacity onPress={() => removeLine(idx)}>
                    <Text style={styles.removeBtn}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <CustomDropdown
                label="Item"
                options={ITEM_DROPDOWN_OPTIONS}
                value={line.itemId ?? ''}
                onChange={(val) => handleItemSelect(idx, val)}
                placeholder="Select item..."
                searchable
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.input}
                value={line.description}
                onChangeText={(t) => updateLine(idx, { description: t })}
                placeholder="Item description"
                placeholderTextColor={Colors.placeholder}
              />

              <View style={styles.rowFields}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={line.quantity > 0 ? String(line.quantity) : ''}
                    onChangeText={(t) =>
                      updateLine(idx, { quantity: parseInt(t) || 0 })
                    }
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.placeholder}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Unit Cost</Text>
                  <TextInput
                    style={styles.input}
                    value={line.unitCost > 0 ? String(line.unitCost) : ''}
                    onChangeText={(t) =>
                      updateLine(idx, { unitCost: parseFloat(t) || 0 })
                    }
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={Colors.placeholder}
                  />
                </View>
              </View>

              <View style={styles.rowFields}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Tax Rate</Text>
                  <CustomDropdown
                    label="Tax"
                    options={PO_TAX_RATE_OPTIONS.map((o) => ({
                      label: o.label,
                      value: String(o.value),
                    }))}
                    value={String(line.taxRate)}
                    onChange={(v) =>
                      updateLine(idx, { taxRate: parseInt(v) || 0 })
                    }
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Amount</Text>
                  <View style={[styles.input, styles.inputDisabled, styles.amountBox]}>
                    <Text style={styles.amountText}>
                      {fmt(line.quantity * line.unitCost)}
                    </Text>
                  </View>
                </View>
              </View>

              {idx < lines.length - 1 && <View style={styles.lineDivider} />}
            </View>
          ))}

          <TouchableOpacity style={styles.addLineBtn} onPress={addLine}>
            <Text style={styles.addLineBtnText}>+ Add Line Item</Text>
          </TouchableOpacity>
        </View>

        {/* ── Totals ─────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>{fmt(taxAmount)}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{fmt(total)}</Text>
          </View>
        </View>

        {/* ── Notes ──────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>NOTES</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Internal notes..."
            placeholderTextColor={Colors.placeholder}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Save Buttons ─────────────────────────────────── */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: Colors.textSecondary }]}
          onPress={() => handleSave('draft')}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>
            {saving ? '...' : 'Save Draft'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: Colors.primary }]}
          onPress={() => handleSave('sent')}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>
            {saving ? '...' : 'Save & Send'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    paddingTop: SAFE_TOP_PADDING,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: { fontSize: 24, fontWeight: '300', color: Colors.textPrimary, marginTop: -2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  input: {
    height: 42,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputDisabled: { backgroundColor: Colors.borderLight, color: Colors.textTertiary },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: Spacing.sm },
  rowFields: { flexDirection: 'row', gap: Spacing.sm },
  fieldHalf: { flex: 1 },

  /* Line items */
  lineItem: { marginBottom: Spacing.sm },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  lineIndex: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  removeBtn: { fontSize: 16, color: Colors.danger, fontWeight: '700', padding: 4 },
  lineDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  amountBox: { justifyContent: 'center' },
  amountText: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  addLineBtn: {
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  addLineBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  /* Totals */
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: { fontSize: 13, color: Colors.textSecondary },
  totalValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  grandLabel: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  grandValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },

  /* Action bar */
  actionBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.md,
  },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
});

export default POFormScreen;
