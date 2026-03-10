// ============================================================
// FINMATRIX - Estimate Form Screen  (Create / Edit)
// ============================================================
// Like InvoiceFormScreen but: Expiration Date instead of Due Date,
// no payment terms field.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import CustomDropdown from '../../Custom-Components/CustomDropdown';
import LineItemRow, { LineItemData } from '../../components/LineItemRow';
import { calcLineAmount, calcInvoiceTotals, blankLine } from '../../models/invoiceModel';
import { EstimateLine } from '../../dummy-data/estimates';
import { createEstimate, updateEstimate, fetchEstimates } from './estimateSlice';
import { getEstimateByIdAPI, getNextEstimateNumberAPI } from '../../network/estimateNetwork';
import { fetchCustomers } from '../Customers/customerSlice';

const fmt = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (d: string, days: number): string => {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
};

// ─── Main ───────────────────────────────────────────────────

const EstimateFormScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const estimateId: string | undefined = route.params?.estimateId;
  const isEditing = !!estimateId;

  const customers = useAppSelector((s) => s.customers.customers);
  useEffect(() => { if (customers.length === 0) dispatch(fetchCustomers()); }, [dispatch, customers.length]);

  // ── Form state ─────────────────────────────────────────────
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [estimateNumber, setEstimateNumber] = useState('');
  const [date, setDate] = useState(todayISO());
  const [expirationDate, setExpirationDate] = useState(addDays(todayISO(), 30));
  const [lines, setLines] = useState<EstimateLine[]>([blankLine() as EstimateLine]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Load for edit ──────────────────────────────────────────
  useEffect(() => {
    if (isEditing) {
      setIsLoading(true);
      getEstimateByIdAPI(estimateId!).then((est) => {
        setCustomerId(est.customerId);
        setCustomerName(est.customerName);
        setEstimateNumber(est.estimateNumber);
        setDate(est.date);
        setExpirationDate(est.expirationDate);
        setLines(est.lines);
        setDiscountAmount(est.discountAmount);
        setDiscountType(est.discountType);
        setNotes(est.notes);
      }).finally(() => setIsLoading(false));
    } else {
      getNextEstimateNumberAPI().then(setEstimateNumber);
    }
  }, [estimateId, isEditing]);

  // ── Customer dropdown ──────────────────────────────────────
  const customerOptions = useMemo(
    () => customers.filter((c) => c.isActive).map((c) => ({ label: `${c.company} — ${c.name}`, value: c.customerId })),
    [customers],
  );
  const handleCustomerChange = useCallback((val: string) => {
    setCustomerId(val);
    const c = customers.find((x) => x.customerId === val);
    if (c) setCustomerName(c.company);
  }, [customers]);

  // ── Line items ─────────────────────────────────────────────
  const handleLineChange = useCallback((idx: number, field: keyof LineItemData, value: string | number) => {
    setLines((prev) => {
      const updated = [...prev];
      const line = { ...updated[idx] };
      if (field === 'description') line.description = value as string;
      else if (field === 'quantity') { line.quantity = Number(value) || 0; line.amount = calcLineAmount(line.quantity, line.rate); }
      else if (field === 'rate') { line.rate = Number(value) || 0; line.amount = calcLineAmount(line.quantity, line.rate); }
      else if (field === 'taxRate') line.taxRate = Number(value) || 0;
      updated[idx] = line;
      return updated;
    });
  }, []);
  const handleDeleteLine = useCallback((idx: number) => {
    setLines((prev) => { if (prev.length <= 1) return prev; return prev.filter((_, i) => i !== idx); });
  }, []);
  const handleAddLine = useCallback(() => { setLines((prev) => [...prev, blankLine() as EstimateLine]); }, []);

  // ── Totals ─────────────────────────────────────────────────
  const { subtotal, taxAmount, actualDiscount, total } = useMemo(
    () => calcInvoiceTotals(lines as any, discountAmount, discountType),
    [lines, discountAmount, discountType],
  );

  // ── Save ───────────────────────────────────────────────────
  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customer = 'Customer is required';
    if (lines.length === 0) errs.lines = 'At least one line item is required';
    lines.forEach((l, i) => {
      if (!l.description.trim()) errs[`line_${i}_desc`] = `Line ${i + 1}: description required`;
      if (l.rate <= 0) errs[`line_${i}_rate`] = `Line ${i + 1}: rate > 0`;
      if (l.quantity <= 0) errs[`line_${i}_qty`] = `Line ${i + 1}: qty > 0`;
    });
    if (Object.keys(errs).length > 0) { setErrors(errs); Alert.alert('Validation Error', Object.values(errs)[0]); return; }
    setErrors({});
    setIsSaving(true);
    try {
      const payload = {
        companyId: 'company_1',
        customerId,
        customerName,
        estimateNumber,
        date,
        expirationDate,
        lines,
        subtotal,
        taxAmount,
        discountAmount,
        discountType,
        total,
        status: 'draft' as const,
        notes,
      };
      if (isEditing) {
        await dispatch(updateEstimate({ id: estimateId!, data: payload })).unwrap();
      } else {
        await dispatch(createEstimate(payload)).unwrap();
      }
      await dispatch(fetchEstimates());
      Alert.alert('Saved', `Estimate ${estimateNumber} saved.`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save estimate.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading estimate…</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Estimate' : 'New Estimate'}</Text>
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
            <Text style={styles.sectionLabel}>ESTIMATE DETAILS</Text>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Estimate #</Text>
                <TextInput style={[styles.fieldInput, styles.fieldDisabled]} value={estimateNumber} editable={false} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput style={styles.fieldInput} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary} />
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Expiration Date</Text>
                <TextInput style={styles.fieldInput} value={expirationDate} onChangeText={setExpirationDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary} />
              </View>
              <View style={styles.fieldHalf} />
            </View>
          </View>

          {/* Line Items */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>LINE ITEMS</Text>
            {lines.map((line, idx) => (
              <LineItemRow
                key={line.lineId}
                line={line}
                index={idx}
                onChange={handleLineChange}
                onDelete={handleDeleteLine}
                errors={errors}
              />
            ))}
            <TouchableOpacity style={styles.addLineBtn} onPress={handleAddLine} activeOpacity={0.7}>
              <Text style={styles.addLineBtnText}>+ Add Line Item</Text>
            </TouchableOpacity>
          </View>

          {/* Totals */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>TOTALS</Text>
            {/* Discount toggle */}
            <View style={styles.discountRow}>
              <Text style={styles.fieldLabel}>Discount</Text>
              <View style={styles.discountToggle}>
                <TouchableOpacity
                  style={[styles.toggleBtn, discountType === 'percentage' && styles.toggleBtnActive]}
                  onPress={() => setDiscountType('percentage')}
                >
                  <Text style={[styles.toggleBtnText, discountType === 'percentage' && styles.toggleBtnTextActive]}>%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, discountType === 'fixed' && styles.toggleBtnActive]}
                  onPress={() => setDiscountType('fixed')}
                >
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
              placeholder="Notes for customer…"
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
          {isSaving ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.saveBtnText}>Save Estimate</Text>}
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

export default EstimateFormScreen;
