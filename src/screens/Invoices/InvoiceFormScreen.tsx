// ============================================================
// FINMATRIX - Invoice Form Screen  (Create / Edit)
// ============================================================
// Params: { invoiceId?, customerId? }
// Sections:
//   1. Customer (searchable dropdown)
//   2. Invoice# (auto), Date, Due Date (auto from terms)
//   3. Line items (LineItemRow) + "Add Line"
//   4. Subtotal, Discount toggle %/$, Tax, GRAND TOTAL
//   5. Notes, Payment Terms
//   6. Buttons: Save Draft, Preview

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
import {
  validateInvoice,
  calcLineAmount,
  calcInvoiceTotals,
  blankLine,
  PAYMENT_TERMS_OPTIONS,
  PAYMENT_TERMS_DAYS,
} from '../../models/invoiceModel';
import { InvoiceLine } from '../../dummy-data/invoices';
import {
  createInvoice,
  updateInvoice,
  fetchInvoices,
} from './invoiceSlice';
import {
  getInvoiceByIdAPI,
  getNextInvoiceNumberAPI,
} from '../../network/invoiceNetwork';
import { fetchCustomers } from '../Customers/customerSlice';

// ─── Helpers ────────────────────────────────────────────────

const formatCurrency = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const todayISO = () => new Date().toISOString().slice(0, 10);

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// ─── Main Component ─────────────────────────────────────────

const InvoiceFormScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const invoiceId: string | undefined = route.params?.invoiceId;
  const preselectedCustomerId: string | undefined = route.params?.customerId;
  const fromEstimate: any | undefined = route.params?.fromEstimate;
  const fromSalesOrder: any | undefined = route.params?.fromSalesOrder;
  const isEditing = !!invoiceId;

  // ── Customer list for dropdown ────────────────────────────
  const customers = useAppSelector((s) => s.customers.customers);

  useEffect(() => {
    if (customers.length === 0) dispatch(fetchCustomers());
  }, [dispatch, customers.length]);

  const customerOptions = useMemo(
    () =>
      customers
        .filter((c) => c.isActive)
        .map((c) => ({ label: `${c.name} (${c.company})`, value: c.customerId })),
    [customers],
  );

  // ── Form state ────────────────────────────────────────────
  const [customerId, setCustomerId] = useState(preselectedCustomerId ?? fromEstimate?.customerId ?? fromSalesOrder?.customerId ?? '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(todayISO());
  const [paymentTerms, setPaymentTerms] = useState('net_30');
  const [dueDate, setDueDate] = useState(addDays(todayISO(), 30));
  const [lines, setLines] = useState<InvoiceLine[]>(
    fromEstimate?.lines ?? fromSalesOrder?.lines ?? [blankLine()],
  );
  const [discountAmount, setDiscountAmount] = useState(
    fromEstimate?.discountAmount ?? fromSalesOrder?.discountAmount ?? 0,
  );
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(
    fromEstimate?.discountType ?? fromSalesOrder?.discountType ?? 'fixed',
  );
  const [notes, setNotes] = useState(
    fromEstimate?.notes ?? fromSalesOrder?.notes ?? '',
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Auto due-date from terms ──────────────────────────────
  useEffect(() => {
    const days = PAYMENT_TERMS_DAYS[paymentTerms] ?? 30;
    setDueDate(addDays(date, days));
  }, [paymentTerms, date]);

  // ── Load next invoice # or existing invoice ───────────────
  useEffect(() => {
    if (isEditing && invoiceId) {
      setIsLoadingEntry(true);
      getInvoiceByIdAPI(invoiceId)
        .then((inv) => {
          setCustomerId(inv.customerId);
          setInvoiceNumber(inv.invoiceNumber);
          setDate(inv.date);
          setPaymentTerms(inv.paymentTerms);
          setDueDate(inv.dueDate);
          setLines(inv.lines.map((l) => ({ ...l })));
          setDiscountAmount(inv.discountAmount);
          setDiscountType(inv.discountType);
          setNotes(inv.notes);
        })
        .catch(() => {
          Alert.alert('Error', 'Failed to load invoice');
          navigation.goBack();
        })
        .finally(() => setIsLoadingEntry(false));
    } else {
      getNextInvoiceNumberAPI().then(setInvoiceNumber);
    }
  }, [isEditing, invoiceId]);

  // ── Totals (recalculate on every line / discount change) ──
  const totals = useMemo(
    () => calcInvoiceTotals(lines, discountAmount, discountType),
    [lines, discountAmount, discountType],
  );

  // ── Line change handler ───────────────────────────────────
  const handleLineChange = useCallback(
    (index: number, field: keyof LineItemData, value: string | number) => {
      setLines((prev) => {
        const updated = prev.map((l) => ({ ...l }));
        const line = updated[index];
        if (field === 'description') {
          line.description = value as string;
        } else if (field === 'quantity') {
          line.quantity = value as number;
          line.amount = calcLineAmount(line.quantity, line.rate);
        } else if (field === 'rate') {
          line.rate = value as number;
          line.amount = calcLineAmount(line.quantity, line.rate);
        } else if (field === 'taxRate') {
          line.taxRate = value as number;
        }
        return updated;
      });
    },
    [],
  );

  const handleDeleteLine = useCallback((index: number) => {
    setLines((prev) => {
      if (prev.length <= 1) {
        Alert.alert('Cannot Delete', 'An invoice must have at least one line.');
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleAddLine = useCallback(() => {
    setLines((prev) => [...prev, blankLine()]);
  }, []);

  // ── Discount toggle ───────────────────────────────────────
  const toggleDiscountType = () => {
    setDiscountType((prev) => (prev === 'fixed' ? 'percentage' : 'fixed'));
    setDiscountAmount(0);
  };

  // ── Customer name from id ─────────────────────────────────
  const customerName = useMemo(() => {
    const c = customers.find((cu) => cu.customerId === customerId);
    return c ? c.name : '';
  }, [customerId, customers]);

  // ── Validate & Submit ─────────────────────────────────────
  const handleSave = async () => {
    setHasAttemptedSubmit(true);

    const formData = {
      customerId,
      customerName,
      invoiceNumber,
      date,
      dueDate,
      lines,
      discountAmount,
      discountType,
      notes,
      paymentTerms,
    };

    const result = validateInvoice(formData);
    setErrors(result.errors);
    if (!result.isValid) {
      Alert.alert('Validation Error', 'Please fix the highlighted errors.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        companyId: 'company_1',
        customerId,
        customerName,
        invoiceNumber,
        date,
        dueDate,
        lines,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount,
        discountType,
        total: totals.total,
        amountPaid: 0,
        status: 'draft' as const,
        notes,
        paymentTerms,
      };

      if (isEditing && invoiceId) {
        await dispatch(updateInvoice({ id: invoiceId, data: payload })).unwrap();
      } else {
        await dispatch(createInvoice(payload)).unwrap();
      }
      await dispatch(fetchInvoices());
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    const linesSummary = lines
      .filter((l) => l.description.trim())
      .map(
        (l, i) =>
          `${i + 1}. ${l.description}  ×${l.quantity}  @${formatCurrency(l.rate)}  = ${formatCurrency(l.amount)}`,
      )
      .join('\n');

    Alert.alert(
      `Invoice Preview — ${invoiceNumber || 'New'}`,
      `Customer: ${customerName || '(none)'}
Date: ${date}
Due: ${dueDate}
Terms: ${paymentTerms}

——— Line Items ———
${linesSummary || '(no items)'}

Subtotal: ${formatCurrency(totals.subtotal)}
Discount: ${formatCurrency(totals.actualDiscount)}
Tax: ${formatCurrency(totals.taxAmount)}
Total: ${formatCurrency(totals.total)}`,
    );
  };

  // ── Loading state ─────────────────────────────────────────
  if (isLoadingEntry) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading invoice...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ─── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Invoice' : 'New Invoice'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Section: Customer ────────────────────────── */}
        <Text style={styles.sectionTitle}>Customer</Text>
        <View style={styles.section}>
          <CustomDropdown
            label="Customer *"
            options={customerOptions}
            value={customerId}
            onChange={setCustomerId}
            placeholder="Select a customer"
            searchable
            error={hasAttemptedSubmit ? errors.customer : undefined}
          />
        </View>

        {/* ─── Section: Invoice Details ─────────────────── */}
        <Text style={styles.sectionTitle}>Invoice Details</Text>
        <View style={styles.section}>
          {/* Invoice Number */}
          <Text style={styles.fieldLabel}>Invoice #</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={invoiceNumber}
            editable={false}
          />

          {/* Date */}
          <Text style={styles.fieldLabel}>Date *</Text>
          <TextInput
            style={[styles.input, hasAttemptedSubmit && errors.date && styles.inputError]}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.placeholder}
          />
          {hasAttemptedSubmit && errors.date && (
            <Text style={styles.errorText}>{errors.date}</Text>
          )}

          {/* Payment Terms */}
          <CustomDropdown
            label="Payment Terms"
            options={PAYMENT_TERMS_OPTIONS}
            value={paymentTerms}
            onChange={setPaymentTerms}
          />

          {/* Due Date (auto, read-only) */}
          <Text style={styles.fieldLabel}>Due Date (auto)</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={dueDate}
            editable={false}
          />
        </View>

        {/* ─── Section: Line Items ──────────────────────── */}
        <Text style={styles.sectionTitle}>Line Items</Text>
        {hasAttemptedSubmit && errors.lines && (
          <Text style={styles.errorText}>{errors.lines}</Text>
        )}

        {lines.map((line, i) => (
          <LineItemRow
            key={line.lineId}
            line={line}
            index={i}
            onChange={handleLineChange}
            onDelete={handleDeleteLine}
            errors={hasAttemptedSubmit ? errors : undefined}
          />
        ))}

        <TouchableOpacity
          style={styles.addLineBtn}
          onPress={handleAddLine}
          activeOpacity={0.7}
        >
          <Text style={styles.addLineBtnText}>+ Add Line</Text>
        </TouchableOpacity>

        {/* ─── Section: Totals ──────────────────────────── */}
        <Text style={styles.sectionTitle}>Totals</Text>
        <View style={styles.section}>
          {/* Subtotal */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.subtotal)}</Text>
          </View>

          {/* Discount */}
          <View style={styles.discountRow}>
            <View style={styles.discountLeft}>
              <Text style={styles.totalLabel}>Discount</Text>
              <TouchableOpacity
                style={styles.discountToggle}
                onPress={toggleDiscountType}
                activeOpacity={0.6}
              >
                <Text style={styles.discountToggleText}>
                  {discountType === 'percentage' ? '%' : '$'}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.discountInput}
              value={discountAmount === 0 ? '' : String(discountAmount)}
              onChangeText={(t) => setDiscountAmount(parseFloat(t) || 0)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.placeholder}
            />
          </View>
          {totals.actualDiscount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: Colors.danger }]}>
                − Discount applied
              </Text>
              <Text style={[styles.totalValue, { color: Colors.danger }]}>
                −{formatCurrency(totals.actualDiscount)}
              </Text>
            </View>
          )}
          {hasAttemptedSubmit && errors.discount && (
            <Text style={styles.errorText}>{errors.discount}</Text>
          )}

          {/* Tax */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.taxAmount)}</Text>
          </View>

          {/* Divider */}
          <View style={styles.totalDivider} />

          {/* Grand Total */}
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(totals.total)}</Text>
          </View>
        </View>

        {/* ─── Section: Notes ───────────────────────────── */}
        <Text style={styles.sectionTitle}>Notes</Text>
        <View style={styles.section}>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes or terms..."
            placeholderTextColor={Colors.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* ─── Buttons ──────────────────────────────────── */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.saveDraftBtn]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.saveDraftBtnText}>
                {isEditing ? 'Save Changes' : 'Save Draft'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.previewBtn]}
            onPress={handlePreview}
            activeOpacity={0.8}
          >
            <Text style={styles.previewBtnText}>Preview</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.textSecondary,
  },

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

  // Scroll
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },

  // Sections
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },

  // Fields
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: Spacing.md,
  },
  input: {
    height: 44,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputDisabled: {
    backgroundColor: Colors.borderLight,
    color: Colors.textTertiary,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  multilineInput: {
    height: 80,
    paddingTop: Spacing.md,
  },
  errorText: {
    fontSize: 11,
    color: Colors.danger,
    marginTop: 3,
  },

  // Add Line
  addLineBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginBottom: Spacing.sm,
  },
  addLineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Totals
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  grandTotalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },

  // Discount
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  discountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  discountToggle: {
    width: 30,
    height: 24,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.primary + '14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  discountInput: {
    width: 90,
    height: 34,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveDraftBtn: {
    backgroundColor: Colors.primary,
  },
  saveDraftBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  previewBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  previewBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
});

export default InvoiceFormScreen;
