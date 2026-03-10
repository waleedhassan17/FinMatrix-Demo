// ============================================================
// FINMATRIX - Receive Payment Screen
// ============================================================
// Record customer payments and distribute across invoices.
//   • Customer picker → loads open invoices
//   • Payment date, method, reference
//   • Amount + "Pay in Full" shortcut
//   • Outstanding-invoice table with per-row editable amounts
//   • Auto-distribute from oldest first
//   • Save persists payment and updates each invoice

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { PaymentMethod } from '../../dummy-data/payments';
import { Invoice } from '../../dummy-data/invoices';
import { Customer } from '../../dummy-data/customers';
import { getUnpaidInvoicesForCustomerAPI } from '../../network/paymentNetwork';
import { createPayment } from './paymentSlice';
import { updateInvoice, fetchInvoices } from '../Invoices/invoiceSlice';
import { ROUTES } from '../../navigations-map/Base';

// ─── Helpers ────────────────────────────────────────────────

const fmt = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const today = () => new Date().toISOString().slice(0, 10);

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'check', label: 'Check' },
  { value: 'cash', label: 'Cash' },
];

// ─── Row Model ──────────────────────────────────────────────

interface InvoiceRow {
  invoiceId: string;
  invoiceNumber: string;
  dueDate: string;
  total: number;
  amountPaid: number;
  balance: number;
  selected: boolean;
  applyAmount: string; // string for editing
}

// ─── Component ──────────────────────────────────────────────

const ReceivePaymentScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();

  // Params
  const paramCustomerId: string | undefined = route.params?.customerId;
  const paramInvoiceId: string | undefined = route.params?.invoiceId;

  // Redux state
  const invoices = useAppSelector((s) => s.invoices.invoices);
  const customers: Customer[] = useAppSelector((s) => (s as any).customers?.customers ?? []);

  // ── Form state ─────────────────────────────────────────────
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    paramCustomerId ?? '',
  );
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const [paymentDate, setPaymentDate] = useState(today());
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [amount, setAmount] = useState('');

  // ── Invoice rows ───────────────────────────────────────────
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── Selected customer ──────────────────────────────────────
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.customerId === selectedCustomerId),
    [customers, selectedCustomerId],
  );

  // ── Filtered customers for picker ──────────────────────────
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customers.filter((c) => c.isActive);
    return customers
      .filter((c) => c.isActive)
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q),
      );
  }, [customers, customerSearch]);

  // ── Load unpaid invoices when customer changes ─────────────
  useEffect(() => {
    if (!selectedCustomerId) {
      setRows([]);
      return;
    }
    setIsLoadingInvoices(true);
    getUnpaidInvoicesForCustomerAPI(selectedCustomerId, invoices)
      .then((unpaid) => {
        const mapped: InvoiceRow[] = unpaid.map((inv) => {
          const balance = inv.total - inv.amountPaid;
          return {
            invoiceId: inv.invoiceId,
            invoiceNumber: inv.invoiceNumber,
            dueDate: inv.dueDate,
            total: inv.total,
            amountPaid: inv.amountPaid,
            balance,
            selected: inv.invoiceId === paramInvoiceId,
            applyAmount:
              inv.invoiceId === paramInvoiceId ? balance.toFixed(2) : '',
          };
        });
        setRows(mapped);

        // If coming from a specific invoice, pre-fill amount
        if (paramInvoiceId) {
          const target = mapped.find((r) => r.invoiceId === paramInvoiceId);
          if (target) setAmount(target.balance.toFixed(2));
        }
      })
      .finally(() => setIsLoadingInvoices(false));
  }, [selectedCustomerId, invoices, paramInvoiceId]);

  // ── Totals ─────────────────────────────────────────────────
  const totalOutstanding = useMemo(
    () => rows.reduce((s, r) => s + r.balance, 0),
    [rows],
  );

  const totalApplied = useMemo(
    () =>
      rows.reduce((s, r) => {
        const v = parseFloat(r.applyAmount) || 0;
        return s + (r.selected ? v : 0);
      }, 0),
    [rows],
  );

  const amountNum = parseFloat(amount) || 0;
  const unapplied = amountNum - totalApplied;

  // ── Auto-distribute ────────────────────────────────────────
  const autoDistribute = useCallback(
    (totalAmt: number) => {
      let remaining = totalAmt;
      setRows((prev) =>
        prev.map((r) => {
          if (remaining <= 0)
            return { ...r, selected: false, applyAmount: '' };
          const apply = Math.min(r.balance, remaining);
          remaining -= apply;
          return {
            ...r,
            selected: apply > 0,
            applyAmount: apply > 0 ? apply.toFixed(2) : '',
          };
        }),
      );
    },
    [],
  );

  const handlePayInFull = () => {
    const total = totalOutstanding;
    setAmount(total.toFixed(2));
    autoDistribute(total);
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    const parsed = parseFloat(val) || 0;
    autoDistribute(parsed);
  };

  // ── Toggle row selection ───────────────────────────────────
  const toggleRow = (idx: number) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        if (r.selected) {
          return { ...r, selected: false, applyAmount: '' };
        }
        // Auto-fill with balance (capped by unapplied)
        const fill = Math.min(r.balance, Math.max(unapplied, 0));
        return {
          ...r,
          selected: true,
          applyAmount: fill > 0 ? fill.toFixed(2) : '',
        };
      }),
    );
  };

  // ── Edit per-row applyAmount ───────────────────────────────
  const handleRowAmount = (idx: number, val: string) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const parsed = parseFloat(val) || 0;
        const capped = Math.min(parsed, r.balance);
        return {
          ...r,
          applyAmount: val,
          selected: capped > 0,
        };
      }),
    );
  };

  // ── Customer select ────────────────────────────────────────
  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.customerId);
    setShowCustomerPicker(false);
    setCustomerSearch('');
  };

  // ── Save ───────────────────────────────────────────────────
  const handleSave = async () => {
    // Validations
    if (!selectedCustomerId) {
      Alert.alert('Error', 'Please select a customer.');
      return;
    }
    if (amountNum <= 0) {
      Alert.alert('Error', 'Payment amount must be greater than zero.');
      return;
    }
    if (totalApplied <= 0) {
      Alert.alert('Error', 'Please apply the payment to at least one invoice.');
      return;
    }
    if (totalApplied > amountNum + 0.01) {
      Alert.alert('Error', 'Applied total exceeds payment amount.');
      return;
    }

    setIsSaving(true);
    try {
      const appliedTo = rows
        .filter((r) => r.selected && parseFloat(r.applyAmount) > 0)
        .map((r) => ({
          invoiceId: r.invoiceId,
          invoiceNumber: r.invoiceNumber,
          amount: parseFloat(parseFloat(r.applyAmount).toFixed(2)),
        }));

      // 1. Create payment record
      await dispatch(
        createPayment({
          companyId: 'company_1',
          customerId: selectedCustomerId,
          customerName:
            selectedCustomer?.company ?? selectedCustomer?.name ?? '',
          date: paymentDate || today(),
          method,
          referenceNumber,
          amount: amountNum,
          appliedTo,
        }),
      ).unwrap();

      // 2. Update each invoice
      for (const app of appliedTo) {
        const inv = invoices.find((i) => i.invoiceId === app.invoiceId);
        if (!inv) continue;
        const newPaid = inv.amountPaid + app.amount;
        const newStatus = newPaid >= inv.total ? 'paid' : inv.status;
        await dispatch(
          updateInvoice({
            id: app.invoiceId,
            data: { amountPaid: newPaid, status: newStatus },
          }),
        ).unwrap();
      }

      // 3. Refresh invoice list
      await dispatch(fetchInvoices());

      Alert.alert('Payment Recorded', `${fmt(amountNum)} applied successfully.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to record payment.');
    } finally {
      setIsSaving(false);
    }
  };

  // ═════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════
  return (
    <View style={styles.flex}>
      {/* ─── Header ─────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receive Payment</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ═══ Customer Section ═══════════════════════ */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>CUSTOMER</Text>

            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setShowCustomerPicker(!showCustomerPicker)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pickerBtnText,
                  !selectedCustomer && { color: Colors.textTertiary },
                ]}
              >
                {selectedCustomer
                  ? `${selectedCustomer.company} — ${selectedCustomer.name}`
                  : 'Select a customer…'}
              </Text>
              <Text style={styles.pickerChevron}>
                {showCustomerPicker ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showCustomerPicker && (
              <View style={styles.dropdownContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search customers…"
                  placeholderTextColor={Colors.textTertiary}
                  value={customerSearch}
                  onChangeText={setCustomerSearch}
                  autoFocus
                />
                <ScrollView
                  style={styles.dropdownList}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredCustomers.map((c) => (
                    <TouchableOpacity
                      key={c.customerId}
                      style={[
                        styles.dropdownItem,
                        c.customerId === selectedCustomerId &&
                          styles.dropdownItemActive,
                      ]}
                      onPress={() => handleSelectCustomer(c)}
                    >
                      <Text style={styles.dropdownItemCompany}>
                        {c.company}
                      </Text>
                      <Text style={styles.dropdownItemName}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <Text style={styles.dropdownEmpty}>No customers found</Text>
                  )}
                </ScrollView>
              </View>
            )}

            {selectedCustomer && (
              <View style={styles.customerInfo}>
                <View style={styles.customerInfoRow}>
                  <Text style={styles.customerInfoLabel}>Balance</Text>
                  <Text style={styles.customerInfoValue}>
                    {fmt(selectedCustomer.balance)}
                  </Text>
                </View>
                <View style={styles.customerInfoRow}>
                  <Text style={styles.customerInfoLabel}>Terms</Text>
                  <Text style={styles.customerInfoValue}>
                    {selectedCustomer.paymentTerms.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* ═══ Payment Details ════════════════════════ */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>PAYMENT DETAILS</Text>

            {/* Date */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Payment Date</Text>
              <TextInput
                style={styles.fieldInput}
                value={paymentDate}
                onChangeText={setPaymentDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            {/* Method */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Payment Method</Text>
              <TouchableOpacity
                style={styles.fieldPicker}
                onPress={() => setShowMethodPicker(!showMethodPicker)}
                activeOpacity={0.8}
              >
                <Text style={styles.fieldPickerText}>
                  {METHODS.find((m) => m.value === method)?.label}
                </Text>
                <Text style={styles.pickerChevron}>
                  {showMethodPicker ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
            </View>

            {showMethodPicker && (
              <View style={styles.methodDropdown}>
                {METHODS.map((m) => (
                  <TouchableOpacity
                    key={m.value}
                    style={[
                      styles.methodItem,
                      m.value === method && styles.methodItemActive,
                    ]}
                    onPress={() => {
                      setMethod(m.value);
                      setShowMethodPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.methodItemText,
                        m.value === method && styles.methodItemTextActive,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Reference */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Reference / Check #</Text>
              <TextInput
                style={styles.fieldInput}
                value={referenceNumber}
                onChangeText={setReferenceNumber}
                placeholder="e.g. CHK-12345"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            {/* Amount + Pay in Full */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Amount Received</Text>
              <View style={styles.amountRow}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={[styles.fieldInput, styles.amountInput]}
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="decimal-pad"
                />
                {rows.length > 0 && (
                  <TouchableOpacity
                    style={styles.payFullBtn}
                    onPress={handlePayInFull}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.payFullBtnText}>Pay in Full</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* ═══ Outstanding Invoices ═══════════════════ */}
          {selectedCustomerId ? (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>OUTSTANDING INVOICES</Text>

              {isLoadingInvoices ? (
                <ActivityIndicator
                  color={Colors.primary}
                  style={{ marginVertical: Spacing.lg }}
                />
              ) : rows.length === 0 ? (
                <Text style={styles.emptyText}>
                  No unpaid invoices for this customer.
                </Text>
              ) : (
                <>
                  {/* Table header */}
                  <View style={[styles.invRow, styles.invRowHeader]}>
                    <View style={styles.invCheckCol} />
                    <Text style={[styles.invCell, styles.invInvoice, styles.thText]}>
                      Invoice
                    </Text>
                    <Text style={[styles.invCell, styles.invDue, styles.thText]}>
                      Due
                    </Text>
                    <Text style={[styles.invCell, styles.invBalance, styles.thText]}>
                      Balance
                    </Text>
                    <Text style={[styles.invCell, styles.invApply, styles.thText]}>
                      Payment
                    </Text>
                  </View>

                  {/* Data rows */}
                  {rows.map((row, idx) => (
                    <View
                      key={row.invoiceId}
                      style={[
                        styles.invRow,
                        idx % 2 === 1 && styles.invRowAlt,
                        row.selected && styles.invRowSelected,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.invCheckCol}
                        onPress={() => toggleRow(idx)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            row.selected && styles.checkboxChecked,
                          ]}
                        >
                          {row.selected && (
                            <Text style={styles.checkMark}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      <View style={styles.invInvoice}>
                        <Text style={styles.invNumber}>
                          {row.invoiceNumber}
                        </Text>
                        <Text style={styles.invTotal}>
                          Total: {fmt(row.total)}
                        </Text>
                      </View>

                      <Text style={[styles.invCell, styles.invDue]}>
                        {fmtDate(row.dueDate)}
                      </Text>

                      <Text
                        style={[
                          styles.invCell,
                          styles.invBalance,
                          styles.invBalanceText,
                        ]}
                      >
                        {fmt(row.balance)}
                      </Text>

                      <View style={styles.invApply}>
                        <TextInput
                          style={styles.applyInput}
                          value={row.applyAmount}
                          onChangeText={(val) => handleRowAmount(idx, val)}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          placeholderTextColor={Colors.textTertiary}
                          editable={row.selected}
                        />
                      </View>
                    </View>
                  ))}

                  {/* Summary */}
                  <View style={styles.invSummary}>
                    <View style={styles.invSummaryRow}>
                      <Text style={styles.summaryLabel}>Total Outstanding</Text>
                      <Text style={styles.summaryValue}>
                        {fmt(totalOutstanding)}
                      </Text>
                    </View>
                    <View style={styles.invSummaryRow}>
                      <Text style={styles.summaryLabel}>Amount to Apply</Text>
                      <Text
                        style={[
                          styles.summaryValue,
                          { color: Colors.success },
                        ]}
                      >
                        {fmt(totalApplied)}
                      </Text>
                    </View>
                    {unapplied !== 0 && (
                      <View style={styles.invSummaryRow}>
                        <Text style={styles.summaryLabel}>
                          {unapplied > 0 ? 'Unapplied' : 'Over-Applied'}
                        </Text>
                        <Text
                          style={[
                            styles.summaryValue,
                            {
                              color:
                                unapplied > 0
                                  ? Colors.warning
                                  : Colors.danger,
                            },
                          ]}
                        >
                          {fmt(Math.abs(unapplied))}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          ) : null}

          {/* Spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ═══ Save Bar ══════════════════════════════════ */}
      <View style={styles.saveBar}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Record Payment</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },

  // Header
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
  backBtnText: {
    fontSize: 24,
    fontWeight: '300',
    color: Colors.textPrimary,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },

  // ─── Card ──────────────────────────────
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

  // ─── Customer Picker ──────────────────
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.background,
  },
  pickerBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  pickerChevron: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginLeft: Spacing.sm,
  },

  dropdownContainer: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  searchInput: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 13,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  dropdownList: {
    maxHeight: 180,
    backgroundColor: Colors.white,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  dropdownItemCompany: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dropdownItemName: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dropdownEmpty: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },

  customerInfo: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  customerInfoRow: {},
  customerInfoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.3,
  },
  customerInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 1,
  },

  // ─── Fields ────────────────────────────
  fieldRow: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm + 2 : Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  fieldPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm + 2 : Spacing.sm,
    backgroundColor: Colors.white,
  },
  fieldPickerText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },

  methodDropdown: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  methodItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  methodItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  methodItemText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  methodItemTextActive: {
    fontWeight: '600',
    color: Colors.primary,
  },

  // Amount
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dollarSign: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  payFullBtn: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  payFullBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },

  // ─── Outstanding Invoice Table ─────────
  emptyText: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  invRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  invRowHeader: {
    backgroundColor: Colors.primary + '08',
    borderBottomColor: Colors.border,
  },
  invRowAlt: {
    backgroundColor: Colors.background,
  },
  invRowSelected: {
    backgroundColor: Colors.successLight + '60',
  },
  invCheckCol: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkMark: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '700',
  },
  invCell: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  thText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  invInvoice: { flex: 2 },
  invDue: { flex: 1.5, textAlign: 'center' as any },
  invBalance: { flex: 1.5, textAlign: 'right' as any },
  invBalanceText: {
    fontWeight: '600',
    color: Colors.danger,
  },
  invApply: { flex: 1.5, alignItems: 'flex-end' as any },
  invNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  invTotal: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  applyInput: {
    width: 72,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === 'ios' ? 4 : 2,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
    textAlign: 'right',
    backgroundColor: Colors.white,
  },

  // ─── Invoice Summary ──────────────────
  invSummary: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  invSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // ─── Save Bar ─────────────────────────
  saveBar: {
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
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default ReceivePaymentScreen;
