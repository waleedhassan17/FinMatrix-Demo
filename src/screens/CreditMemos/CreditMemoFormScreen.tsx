// ============================================================
// FINMATRIX - Credit Memo Form Screen  (Create / Edit / View)
// ============================================================
// Like InvoiceFormScreen but credits customer account.
// Includes reason field. Saves as 'open' status.

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
import LineItemRow, { LineItemData } from '../../components/LineItemRow';
import { calcLineAmount, calcInvoiceTotals, blankLine } from '../../models/invoiceModel';
import { CreditMemoLine } from '../../dummy-data/creditMemos';
import { invoices as allInvoices, Invoice } from '../../dummy-data/invoices';
import { createCreditMemo, updateCreditMemo, fetchCreditMemos } from './creditMemoSlice';
import { getCreditMemoByIdAPI, getNextCreditMemoNumberAPI } from '../../network/creditMemoNetwork';
import { fetchCustomers } from '../Customers/customerSlice';

const fmt = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });
const todayISO = () => new Date().toISOString().slice(0, 10);

// ─── Main ───────────────────────────────────────────────────

const CreditMemoFormScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const creditMemoId: string | undefined = route.params?.creditMemoId;
  const isEditing = !!creditMemoId;

  const customers = useAppSelector((s) => s.customers.customers);
  useEffect(() => { if (customers.length === 0) dispatch(fetchCustomers()); }, [dispatch, customers.length]);

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [creditMemoNumber, setCreditMemoNumber] = useState('');
  const [date, setDate] = useState(todayISO());
  const [reason, setReason] = useState('');
  const [lines, setLines] = useState<CreditMemoLine[]>([blankLine() as CreditMemoLine]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [cmStatus, setCmStatus] = useState<string>('open');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load for edit / view
  useEffect(() => {
    if (isEditing) {
      setIsLoading(true);
      getCreditMemoByIdAPI(creditMemoId!).then((cm) => {
        setCustomerId(cm.customerId);
        setCustomerName(cm.customerName);
        setCreditMemoNumber(cm.creditMemoNumber);
        setDate(cm.date);
        setReason(cm.reason);
        setLines(cm.lines);
        setDiscountAmount(cm.discountAmount);
        setDiscountType(cm.discountType);
        setNotes(cm.notes);
        setCmStatus(cm.status);
        // Applied / void → view-only
        if (cm.status === 'applied' || cm.status === 'void') setIsViewMode(true);
      }).finally(() => setIsLoading(false));
    } else {
      getNextCreditMemoNumberAPI().then(setCreditMemoNumber);
    }
  }, [creditMemoId, isEditing]);

  // Customer
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
  const handleAddLine = useCallback(() => { setLines((prev) => [...prev, blankLine() as CreditMemoLine]); }, []);

  // Totals
  const { subtotal, taxAmount, actualDiscount, total } = useMemo(
    () => calcInvoiceTotals(lines as any, discountAmount, discountType),
    [lines, discountAmount, discountType],
  );

  // ── Apply to Invoices state ─────────────────────────────
  interface InvoiceApplication {
    invoiceId: string;
    invoiceNumber: string;
    date: string;
    dueDate: string;
    balanceDue: number;
    amountToApply: number;
    selected: boolean;
  }
  const [applications, setApplications] = useState<InvoiceApplication[]>([]);

  // Rebuild available invoices when customer changes
  useEffect(() => {
    if (!customerId) { setApplications([]); return; }
    const unpaid = allInvoices
      .filter(
        (inv) =>
          inv.customerId === customerId &&
          (inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'viewed') &&
          inv.amountPaid < inv.total,
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map((inv) => ({
        invoiceId: inv.invoiceId,
        invoiceNumber: inv.invoiceNumber,
        date: inv.date,
        dueDate: inv.dueDate,
        balanceDue: Math.round((inv.total - inv.amountPaid) * 100) / 100,
        amountToApply: 0,
        selected: false,
      }));
    setApplications(unpaid);
  }, [customerId]);

  const autoDistribute = useCallback(() => {
    let remaining = total;
    setApplications((prev) =>
      prev.map((app) => {
        if (!app.selected || remaining <= 0) return { ...app, amountToApply: 0 };
        const apply = Math.min(remaining, app.balanceDue);
        remaining = Math.round((remaining - apply) * 100) / 100;
        return { ...app, amountToApply: Math.round(apply * 100) / 100 };
      }),
    );
  }, [total]);

  const totalApplied = useMemo(
    () => Math.round(applications.reduce((s, a) => s + a.amountToApply, 0) * 100) / 100,
    [applications],
  );
  const creditRemaining = Math.round((total - totalApplied) * 100) / 100;

  const toggleInvoice = useCallback((idx: number) => {
    setApplications((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], selected: !updated[idx].selected, amountToApply: 0 };
      return updated;
    });
  }, []);

  const setApplyAmount = useCallback((idx: number, value: string) => {
    const num = Math.max(0, Number(value) || 0);
    setApplications((prev) => {
      const updated = [...prev];
      const app = { ...updated[idx] };
      app.amountToApply = Math.min(num, app.balanceDue);
      updated[idx] = app;
      return updated;
    });
  }, []);

  // Save
  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customer = 'Customer is required';
    if (!reason.trim()) errs.reason = 'Reason is required';
    if (lines.length === 0) errs.lines = 'At least one line item is required';
    lines.forEach((l, i) => {
      if (!l.description.trim()) errs[`line_${i}_desc`] = `Line ${i + 1}: description required`;
      if (l.rate <= 0) errs[`line_${i}_rate`] = `Line ${i + 1}: rate > 0`;
      if (l.quantity <= 0) errs[`line_${i}_qty`] = `Line ${i + 1}: qty > 0`;
    });
    if (totalApplied > total) errs.apply = 'Total applied cannot exceed credit memo total';
    if (Object.keys(errs).length > 0) { setErrors(errs); Alert.alert('Validation Error', Object.values(errs)[0]); return; }
    setErrors({});
    setIsSaving(true);
    try {
      const payload = {
        companyId: 'company_1',
        customerId,
        customerName,
        creditMemoNumber,
        date,
        lines,
        subtotal,
        taxAmount,
        discountAmount,
        discountType,
        total,
        amountApplied: totalApplied,
        amountRemaining: Math.round((total - totalApplied) * 100) / 100,
        appliedToInvoices: applications
          .filter((a) => a.amountToApply > 0)
          .map((a) => a.invoiceId),
        status: 'open' as const,
        reason,
        notes,
      };
      if (isEditing) {
        await dispatch(updateCreditMemo({ id: creditMemoId!, data: payload })).unwrap();
      } else {
        await dispatch(createCreditMemo(payload)).unwrap();
      }
      await dispatch(fetchCreditMemos());
      Alert.alert('Saved', `Credit Memo ${creditMemoNumber} saved.`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save credit memo.');
    } finally {
      setIsSaving(false);
    }
  };

  // Void action
  const handleVoid = async () => {
    Alert.alert('Void Credit Memo', `Are you sure you want to void ${creditMemoNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Void',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(updateCreditMemo({ id: creditMemoId!, data: { status: 'void' as any, amountRemaining: 0 } })).unwrap();
            await dispatch(fetchCreditMemos());
            Alert.alert('Voided', `Credit Memo ${creditMemoNumber} has been voided.`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
          } catch {
            Alert.alert('Error', 'Could not void credit memo.');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading credit memo…</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isViewMode ? `${creditMemoNumber}` : isEditing ? 'Edit Credit Memo' : 'New Credit Memo'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Status banner for view mode */}
      {isViewMode && (
        <View style={[styles.statusBanner, { backgroundColor: cmStatus === 'applied' ? Colors.successLight : Colors.background }]}>
          <Text style={[styles.statusBannerText, { color: cmStatus === 'applied' ? Colors.success : Colors.textTertiary }]}>
            This credit memo is {cmStatus === 'applied' ? 'fully applied' : 'voided'} and cannot be edited.
          </Text>
        </View>
      )}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Customer */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>CUSTOMER</Text>
            {isViewMode ? (
              <Text style={styles.viewText}>{customerName}</Text>
            ) : (
              <CustomDropdown
                label="Customer"
                options={customerOptions}
                value={customerId}
                onChange={handleCustomerChange}
                placeholder="Select customer…"
                error={errors.customer}
                searchable
              />
            )}
          </View>

          {/* Details */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>CREDIT MEMO DETAILS</Text>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>CM #</Text>
                <TextInput style={[styles.fieldInput, styles.fieldDisabled]} value={creditMemoNumber} editable={false} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput style={[styles.fieldInput, isViewMode && styles.fieldDisabled]} value={date} onChangeText={setDate} editable={!isViewMode} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textTertiary} />
              </View>
            </View>
            <View>
              <Text style={styles.fieldLabel}>Reason for Credit</Text>
              <TextInput
                style={[styles.fieldInput, { height: 60, textAlignVertical: 'top' }, isViewMode && styles.fieldDisabled]}
                value={reason}
                onChangeText={setReason}
                editable={!isViewMode}
                multiline
                placeholder="Why is this credit being issued?"
                placeholderTextColor={Colors.textTertiary}
              />
              {errors.reason && <Text style={styles.errorText}>{errors.reason}</Text>}
            </View>
          </View>

          {/* Line Items */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>CREDIT LINE ITEMS</Text>
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
            {!isViewMode && (
              <TouchableOpacity style={styles.addLineBtn} onPress={handleAddLine} activeOpacity={0.7}>
                <Text style={styles.addLineBtnText}>+ Add Line Item</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Totals */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>TOTALS</Text>
            {!isViewMode && (
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
            )}
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
              <Text style={styles.grandLabel}>CREDIT TOTAL</Text>
              <Text style={styles.grandValue}>{fmt(total)}</Text>
            </View>
          </View>

          {/* Apply to Invoices */}
          {!isViewMode && (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>APPLY CREDIT TO OUTSTANDING INVOICES</Text>
              {!customerId ? (
                <Text style={styles.applyMessage}>Select a customer to apply credit to invoices.</Text>
              ) : applications.length === 0 ? (
                <Text style={styles.applyMessage}>No outstanding invoices for this customer.</Text>
              ) : (
                <>
                  {/* Running totals */}
                  <View style={styles.applyTotalsRow}>
                    <View style={styles.applyTotalItem}>
                      <Text style={styles.applyTotalLabel}>Credit</Text>
                      <Text style={styles.applyTotalVal}>{fmt(total)}</Text>
                    </View>
                    <View style={styles.applyTotalItem}>
                      <Text style={styles.applyTotalLabel}>Applied</Text>
                      <Text style={[styles.applyTotalVal, { color: Colors.success }]}>{fmt(totalApplied)}</Text>
                    </View>
                    <View style={styles.applyTotalItem}>
                      <Text style={styles.applyTotalLabel}>Remaining</Text>
                      <Text style={[styles.applyTotalVal, { color: creditRemaining < 0 ? Colors.danger : Colors.warning }]}>{fmt(creditRemaining)}</Text>
                    </View>
                  </View>

                  {/* Auto-distribute button */}
                  <TouchableOpacity style={styles.autoDistBtn} onPress={autoDistribute} activeOpacity={0.7}>
                    <Text style={styles.autoDistBtnText}>Auto-Distribute (Oldest First)</Text>
                  </TouchableOpacity>

                  {/* Invoice table header */}
                  <View style={styles.invTableHeader}>
                    <View style={{ width: 28 }} />
                    <Text style={[styles.invTh, { flex: 1 }]}>Invoice</Text>
                    <Text style={[styles.invTh, { width: 70, textAlign: 'right' }]}>Balance</Text>
                    <Text style={[styles.invTh, { width: 80, textAlign: 'right' }]}>Apply</Text>
                  </View>

                  {applications.map((app, idx) => (
                    <View key={app.invoiceId} style={[styles.invRow, idx % 2 === 0 && styles.invRowAlt]}>
                      {/* Checkbox */}
                      <TouchableOpacity
                        style={[styles.checkbox, app.selected && styles.checkboxChecked]}
                        onPress={() => toggleInvoice(idx)}
                        activeOpacity={0.7}
                      >
                        {app.selected && <Text style={styles.checkmark}>✓</Text>}
                      </TouchableOpacity>

                      <View style={{ flex: 1, paddingHorizontal: 4 }}>
                        <Text style={styles.invNum}>{app.invoiceNumber}</Text>
                        <Text style={styles.invDates}>{app.date} · Due {app.dueDate}</Text>
                      </View>
                      <Text style={[styles.invBal, { width: 70 }]}>{fmt(app.balanceDue)}</Text>
                      <TextInput
                        style={[styles.applyInput, !app.selected && styles.applyInputDisabled]}
                        value={app.amountToApply > 0 ? String(app.amountToApply) : ''}
                        onChangeText={(v) => setApplyAmount(idx, v)}
                        editable={app.selected}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={Colors.textTertiary}
                      />
                    </View>
                  ))}

                  {errors.apply && <Text style={styles.errorText}>{errors.apply}</Text>}
                </>
              )}
            </View>
          )}

          {/* Notes */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>NOTES</Text>
            <TextInput
              style={[styles.fieldInput, { height: 80, textAlignVertical: 'top' }, isViewMode && styles.fieldDisabled]}
              value={notes}
              onChangeText={setNotes}
              editable={!isViewMode}
              multiline
              placeholder="Additional notes…"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom action bar */}
      <View style={styles.saveBar}>
        {isViewMode ? (
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.textSecondary }]} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Close</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            {isEditing && cmStatus === 'open' && (
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: Colors.danger }]} onPress={handleVoid} activeOpacity={0.8}>
                <Text style={[styles.cancelBtnText, { color: Colors.danger }]}>Void</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.6 }]} onPress={handleSave} activeOpacity={0.8} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </>
        )}
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
  statusBanner: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  statusBannerText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  scrollContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.base, marginBottom: Spacing.base, ...Shadows.sm },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 1, marginBottom: Spacing.md },
  viewText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  fieldRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  fieldHalf: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  fieldInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'ios' ? Spacing.sm + 2 : Spacing.sm, fontSize: 14, color: Colors.textPrimary, backgroundColor: Colors.white },
  fieldDisabled: { backgroundColor: Colors.background, color: Colors.textTertiary },
  errorText: { fontSize: 11, color: Colors.danger, marginTop: 2 },
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

  /* Apply to Invoices */
  applyMessage: { fontSize: 13, color: Colors.textTertiary, fontStyle: 'italic', textAlign: 'center', paddingVertical: Spacing.md },
  applyTotalsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.background, borderRadius: BorderRadius.sm },
  applyTotalItem: { alignItems: 'center' },
  applyTotalLabel: { fontSize: 10, color: Colors.textTertiary, marginBottom: 2 },
  applyTotalVal: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  autoDistBtn: { alignSelf: 'center', marginBottom: Spacing.md, paddingVertical: 6, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  autoDistBtnText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  invTableHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  invTh: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 0.5 },
  invRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  invRowAlt: { backgroundColor: Colors.background },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { fontSize: 14, fontWeight: '700', color: Colors.white, marginTop: -1 },
  invNum: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  invDates: { fontSize: 10, color: Colors.textTertiary },
  invBal: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, textAlign: 'right' },
  applyInput: { width: 80, height: 30, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm, paddingHorizontal: 6, fontSize: 12, textAlign: 'right', color: Colors.textPrimary, backgroundColor: Colors.white },
  applyInputDisabled: { backgroundColor: Colors.background, color: Colors.textTertiary },
});

export default CreditMemoFormScreen;
