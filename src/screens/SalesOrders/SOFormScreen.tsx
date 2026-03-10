// ============================================================
// FINMATRIX - Sales Order Form Screen  (Create / Edit)
// ============================================================
// Like EstimateFormScreen but: Expected Date, lines have quantityOrdered
// (quantityFulfilled defaults 0 on create), saves as 'open' status.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import CustomDropdown from '../../Custom-Components/CustomDropdown';
import { SOLine } from '../../dummy-data/salesOrders';
import { createSalesOrder, updateSalesOrder, fetchSalesOrders } from './soSlice';
import { getSalesOrderByIdAPI, getNextSONumberAPI } from '../../network/salesOrderNetwork';
import { fetchCustomers } from '../Customers/customerSlice';
import { TAX_RATE_OPTIONS } from '../../models/invoiceModel';

// ── Helpers ─────────────────────────────────────────────────
const fmt = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (d: string, days: number): string => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
};
let lineCounter = Date.now();
const blankSOLine = (): SOLine => ({
  lineId: `sol_${lineCounter++}`,
  itemId: null,
  description: '',
  quantityOrdered: 0,
  quantityFulfilled: 0,
  rate: 0,
  amount: 0,
  taxRate: 10,
});
const calcSOLineAmount = (qty: number, rate: number) =>
  Math.round(qty * rate * 100) / 100;
const calcSOTotals = (lines: SOLine[], discountAmount: number, discountType: 'percentage' | 'fixed') => {
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const actualDiscount = discountType === 'percentage' ? Math.round(subtotal * (discountAmount / 100) * 100) / 100 : discountAmount;
  const afterDiscount = subtotal - actualDiscount;
  const taxAmount = lines.reduce((s, l) => {
    const portion = subtotal > 0 ? l.amount / subtotal : 0;
    const lineAfter = afterDiscount * portion;
    return s + lineAfter * (l.taxRate / 100);
  }, 0);
  const total = Math.round((afterDiscount + taxAmount) * 100) / 100;
  return { subtotal, taxAmount: Math.round(taxAmount * 100) / 100, actualDiscount, total };
};

// ── SO Line Row ─────────────────────────────────────────────
const SOLineRow: React.FC<{
  line: SOLine;
  index: number;
  onChange: (idx: number, field: string, val: string | number) => void;
  onDelete: (idx: number) => void;
}> = React.memo(({ line, index, onChange, onDelete }) => (
  <View style={styles.lineRow}>
    <View style={styles.lineHeader}>
      <Text style={styles.lineIdx}>#{index + 1}</Text>
      <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => onDelete(index)}>
        <Text style={styles.lineDelete}>✕</Text>
      </TouchableOpacity>
    </View>
    <TextInput
      style={styles.lineInput}
      value={line.description}
      onChangeText={(t) => onChange(index, 'description', t)}
      placeholder="Description"
      placeholderTextColor={Colors.textTertiary}
    />
    <View style={styles.lineNumbers}>
      <View style={styles.lineNumField}>
        <Text style={styles.lineNumLabel}>Qty Ordered</Text>
        <TextInput
          style={styles.lineInput}
          value={line.quantityOrdered > 0 ? String(line.quantityOrdered) : ''}
          onChangeText={(t) => onChange(index, 'quantityOrdered', t)}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={Colors.textTertiary}
        />
      </View>
      <View style={styles.lineNumField}>
        <Text style={styles.lineNumLabel}>Rate</Text>
        <TextInput
          style={styles.lineInput}
          value={line.rate > 0 ? String(line.rate) : ''}
          onChangeText={(t) => onChange(index, 'rate', t)}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={Colors.textTertiary}
        />
      </View>
      <View style={styles.lineNumField}>
        <Text style={styles.lineNumLabel}>Tax %</Text>
        <TextInput
          style={styles.lineInput}
          value={String(line.taxRate)}
          onChangeText={(t) => onChange(index, 'taxRate', t)}
          keyboardType="decimal-pad"
        />
      </View>
    </View>
    <Text style={styles.lineAmount}>{fmt(line.amount)}</Text>
  </View>
));

// ─── Main ───────────────────────────────────────────────────

const SOFormScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const salesOrderId: string | undefined = route.params?.salesOrderId;
  const fromEstimate: any | undefined = route.params?.fromEstimate;
  const isEditing = !!salesOrderId;

  const customers = useAppSelector((s) => s.customers.customers);
  useEffect(() => { if (customers.length === 0) dispatch(fetchCustomers()); }, [dispatch, customers.length]);

  // Form state
  const [customerId, setCustomerId] = useState(fromEstimate?.customerId ?? '');
  const [customerName, setCustomerName] = useState(fromEstimate?.customerName ?? '');
  const [soNumber, setSONumber] = useState('');
  const [date, setDate] = useState(todayISO());
  const [expectedDate, setExpectedDate] = useState(addDays(todayISO(), 14));
  const [lines, setLines] = useState<SOLine[]>(
    fromEstimate?.lines ?? [blankSOLine()],
  );
  const [discountAmount, setDiscountAmount] = useState(
    fromEstimate?.discountAmount ?? 0,
  );
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
    fromEstimate?.discountType ?? 'fixed',
  );
  const [notes, setNotes] = useState(fromEstimate?.notes ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load for edit
  useEffect(() => {
    if (isEditing) {
      setIsLoading(true);
      getSalesOrderByIdAPI(salesOrderId!).then((so) => {
        setCustomerId(so.customerId);
        setCustomerName(so.customerName);
        setSONumber(so.soNumber);
        setDate(so.date);
        setExpectedDate(so.expectedDate);
        setLines(so.lines);
        setDiscountAmount(so.discountAmount);
        setDiscountType(so.discountType);
        setNotes(so.notes);
      }).finally(() => setIsLoading(false));
    } else {
      getNextSONumberAPI().then(setSONumber);
    }
  }, [salesOrderId, isEditing]);

  // Customer dropdown
  const customerOptions = useMemo(
    () => customers.filter((c) => c.isActive).map((c) => ({ label: `${c.company} — ${c.name}`, value: c.customerId })),
    [customers],
  );
  const handleCustomerChange = useCallback((val: string) => {
    setCustomerId(val);
    const c = customers.find((x) => x.customerId === val);
    if (c) setCustomerName(c.company);
  }, [customers]);

  // Line items
  const handleLineChange = useCallback((idx: number, field: string, value: string | number) => {
    setLines((prev) => {
      const updated = [...prev];
      const line = { ...updated[idx] };
      if (field === 'description') line.description = value as string;
      else if (field === 'quantityOrdered') { line.quantityOrdered = Number(value) || 0; line.amount = calcSOLineAmount(line.quantityOrdered, line.rate); }
      else if (field === 'rate') { line.rate = Number(value) || 0; line.amount = calcSOLineAmount(line.quantityOrdered, line.rate); }
      else if (field === 'taxRate') line.taxRate = Number(value) || 0;
      updated[idx] = line;
      return updated;
    });
  }, []);
  const handleDeleteLine = useCallback((idx: number) => {
    setLines((prev) => { if (prev.length <= 1) return prev; return prev.filter((_, i) => i !== idx); });
  }, []);
  const handleAddLine = useCallback(() => { setLines((prev) => [...prev, blankSOLine()]); }, []);

  // Totals
  const { subtotal, taxAmount, actualDiscount, total } = useMemo(
    () => calcSOTotals(lines, discountAmount, discountType),
    [lines, discountAmount, discountType],
  );

  // Save
  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customer = 'Customer is required';
    if (lines.length === 0) errs.lines = 'At least one line item is required';
    lines.forEach((l, i) => {
      if (!l.description.trim()) errs[`line_${i}_desc`] = `Line ${i + 1}: description required`;
      if (l.rate <= 0) errs[`line_${i}_rate`] = `Line ${i + 1}: rate > 0`;
      if (l.quantityOrdered <= 0) errs[`line_${i}_qty`] = `Line ${i + 1}: quantity > 0`;
    });
    if (Object.keys(errs).length > 0) { setErrors(errs); Alert.alert('Validation Error', Object.values(errs)[0]); return; }
    setErrors({});
    setIsSaving(true);
    try {
      const payload = {
        companyId: 'company_1',
        customerId,
        customerName,
        soNumber,
        date,
        expectedDate,
        lines,
        subtotal,
        taxAmount,
        discountAmount,
        discountType,
        total,
        status: 'open' as const,
        notes,
      };
      if (isEditing) {
        await dispatch(updateSalesOrder({ id: salesOrderId!, data: payload })).unwrap();
      } else {
        await dispatch(createSalesOrder(payload)).unwrap();
      }
      await dispatch(fetchSalesOrders());
      Alert.alert('Saved', `Sales Order ${soNumber} saved.`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save sales order.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading sales order…</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Sales Order' : 'New Sales Order'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Customer */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>CUSTOMER</Text>
            <CustomDropdown
              label="Customer"
              options={customerOptions}
              value={customerId}
              onChange={handleCustomerChange}
              placeholder="Select customer…"
              error={errors.customer}
              searchable
            />
          </View>

          {/* Details */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>ORDER DETAILS</Text>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>SO #</Text>
                <TextInput style={[styles.fieldInput, styles.fieldDisabled]} value={soNumber} editable={false} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput style={styles.fieldInput} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary} />
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Expected Date</Text>
                <TextInput style={styles.fieldInput} value={expectedDate} onChangeText={setExpectedDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary} />
              </View>
              <View style={styles.fieldHalf} />
            </View>
          </View>

          {/* Line Items */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>LINE ITEMS</Text>
            {lines.map((line, idx) => (
              <SOLineRow key={line.lineId} line={line} index={idx} onChange={handleLineChange} onDelete={handleDeleteLine} />
            ))}
            <TouchableOpacity style={styles.addLineBtn} onPress={handleAddLine} activeOpacity={0.7}>
              <Text style={styles.addLineBtnText}>+ Add Line Item</Text>
            </TouchableOpacity>
          </View>

          {/* Totals */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>TOTALS</Text>
            <View style={styles.discountRow}>
              <Text style={styles.fieldLabel}>Discount</Text>
              <View style={styles.discountToggle}>
                <TouchableOpacity style={[styles.toggleBtn, discountType === 'percentage' && styles.toggleBtnActive]} onPress={() => setDiscountType('percentage')}>
                  <Text style={[styles.toggleBtnText, discountType === 'percentage' && styles.toggleBtnTextActive]}>%</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, discountType === 'fixed' && styles.toggleBtnActive]} onPress={() => setDiscountType('fixed')}>
                  <Text style={[styles.toggleBtnText, discountType === 'fixed' && styles.toggleBtnTextActive]}>$</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.fieldInput, { width: 80, textAlign: 'right' }]}
                value={String(discountAmount)}
                onChangeText={(t) => setDiscountAmount(Number(t) || 0)}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
            </View>
            {actualDiscount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={[styles.totalValue, { color: Colors.danger }]}>−{fmt(actualDiscount)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{fmt(taxAmount)}</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandLabel}>TOTAL</Text>
              <Text style={styles.grandValue}>{fmt(total)}</Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>NOTES</Text>
            <TextInput
              style={[styles.fieldInput, { height: 80, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Internal notes…"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save bar */}
      <View style={styles.saveBar}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.6 }]} onPress={handleSave} activeOpacity={0.8} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.saveBtnText}>Save Sales Order</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: Spacing.md, fontSize: 14, color: Colors.textSecondary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    paddingTop: SAFE_TOP_PADDING,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { fontSize: 24, fontWeight: '300', color: Colors.textPrimary, marginTop: -2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scrollContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.base, marginBottom: Spacing.base, ...Shadows.sm },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 1, marginBottom: Spacing.md },
  fieldRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  fieldHalf: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  fieldInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'ios' ? Spacing.sm + 2 : Spacing.sm, fontSize: 14, color: Colors.textPrimary, backgroundColor: Colors.white },
  fieldDisabled: { backgroundColor: Colors.background, color: Colors.textTertiary },
  // SO Line Row
  lineRow: { backgroundColor: Colors.background, borderRadius: BorderRadius.sm, padding: Spacing.sm, marginBottom: Spacing.sm },
  lineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  lineIdx: { fontSize: 11, fontWeight: '700', color: Colors.textTertiary },
  lineDelete: { fontSize: 14, color: Colors.danger, fontWeight: '600' },
  lineInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'ios' ? Spacing.sm + 2 : Spacing.sm, fontSize: 14, color: Colors.textPrimary, backgroundColor: Colors.white, marginBottom: 6 },
  lineNumbers: { flexDirection: 'row', gap: Spacing.sm },
  lineNumField: { flex: 1 },
  lineNumLabel: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary, marginBottom: 2 },
  lineAmount: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right', marginTop: 2 },
  addLineBtn: { alignSelf: 'center', marginTop: Spacing.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.primary, borderStyle: 'dashed' },
  addLineBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  discountRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  discountToggle: { flexDirection: 'row', borderRadius: BorderRadius.sm, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  toggleBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, backgroundColor: Colors.white },
  toggleBtnActive: { backgroundColor: Colors.primary },
  toggleBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  toggleBtnTextActive: { color: Colors.white },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 13, color: Colors.textSecondary },
  totalValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  totalDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  grandLabel: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  grandValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  saveBar: {
    flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.md, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.md,
  },
  cancelBtn: { flex: 1, height: 44, borderRadius: BorderRadius.sm, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: { flex: 2, height: 44, borderRadius: BorderRadius.sm, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
});

export default SOFormScreen;
