// ============================================================
// FINMATRIX - Bill Form Screen
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import CustomDropdown from '../../Custom-Components/CustomDropdown';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { createBill, updateBill, fetchBills } from './billSlice';
import { Bill, BillLine, BillStatus } from '../../dummy-data/bills';
import { chartOfAccounts } from '../../dummy-data/chartOfAccounts';
import {
  blankBillLine,
  calcBillTotals,
  validateBill,
  PAYMENT_TERMS_OPTIONS,
  PAYMENT_TERMS_DAYS,
  TAX_RATE_OPTIONS,
} from '../../models/billModel';
import { getNextBillNumberAPI, getBillByIdAPI } from '../../network/billNetwork';

/* ================================================================
   COMPONENT
   ================================================================ */
const BillFormScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();

  const billId: string | undefined = route.params?.billId;
  const fromPO: any | undefined = route.params?.fromPO;
  const isEdit = !!billId;

  const vendors = useAppSelector((s) => s.vendors.vendors);

  /* ── expense-account dropdown options (from COA) ─────── */
  const expenseAccountOptions = useMemo(
    () =>
      chartOfAccounts
        .filter((a) => a.type === 'expense' && a.isActive)
        .map((a) => ({ label: `${a.accountNumber} - ${a.name}`, value: a.accountId })),
    [],
  );

  /* ── vendor dropdown ─────────────────────────────────── */
  const vendorOptions = useMemo(
    () =>
      vendors
        .filter((v) => v.isActive)
        .map((v) => ({ label: v.companyName, value: v.vendorId })),
    [vendors],
  );

  /* ── form state ──────────────────────────────────────── */
  const [vendorId, setVendorId] = useState(fromPO?.vendorId ?? '');
  const [billNumber, setBillNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('net_30');
  const [lines, setLines] = useState<BillLine[]>(fromPO?.lines ?? [blankBillLine()]);
  const [notes, setNotes] = useState(fromPO?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ── auto-calc due date from terms ───────────────────── */
  useEffect(() => {
    if (date && paymentTerms) {
      const d = new Date(date);
      d.setDate(d.getDate() + (PAYMENT_TERMS_DAYS[paymentTerms] ?? 30));
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [date, paymentTerms]);

  /* ── load existing bill (edit mode) ──────────────────── */
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getBillByIdAPI(billId!).then((b) => {
        if (b) {
          setVendorId(b.vendorId);
          setBillNumber(b.billNumber);
          setDate(b.date);
          setDueDate(b.dueDate);
          setLines(b.lines.length ? b.lines : [blankBillLine()]);
          setNotes(b.notes);
        }
        setLoading(false);
      });
    } else {
      getNextBillNumberAPI().then(setBillNumber);
    }
  }, [billId, isEdit]);

  /* ── totals ──────────────────────────────────────────── */
  const { subtotal, taxAmount, total } = useMemo(
    () => calcBillTotals(lines),
    [lines],
  );

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  /* ── line item handlers ──────────────────────────────── */
  const updateLine = useCallback(
    (idx: number, patch: Partial<BillLine>) => {
      setLines((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...patch };
        return copy;
      });
    },
    [],
  );

  const removeLine = useCallback((idx: number) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  }, []);

  const addLine = useCallback(() => setLines((prev) => [...prev, blankBillLine()]), []);

  /* ── save ─────────────────────────────────────────────── */
  const handleSave = async (status: BillStatus) => {
    const vendorName =
      vendors.find((v) => v.vendorId === vendorId)?.companyName ?? '';

    const bill: Bill = {
      billId: isEdit ? billId! : `bill_${Date.now()}`,
      companyId: 'company_1',
      vendorId,
      vendorName,
      billNumber,
      date,
      dueDate,
      lines,
      subtotal,
      taxAmount,
      total,
      amountPaid: 0,
      status,
      notes,
      createdAt: isEdit ? '' : new Date().toISOString(),
    };

    const errs = validateBill(bill);
    if (errs.length) {
      Alert.alert('Validation', errs.join('\n'));
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await dispatch(updateBill(bill)).unwrap();
      } else {
        await dispatch(createBill(bill)).unwrap();
      }
      await dispatch(fetchBills());
      nav.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save bill.');
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

  /* ── RENDER ──────────────────────────────────────────── */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>
          {isEdit ? 'Edit Bill' : 'New Bill'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Vendor ─────────────────────────────────────── */}
        <CustomDropdown
          label="Vendor *"
          options={vendorOptions}
          value={vendorId}
          onChange={setVendorId}
          placeholder="Select vendor..."
          searchable
        />

        {/* ── Bill Number ────────────────────────────────── */}
        <Text style={styles.label}>Bill Number</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={billNumber}
          editable={false}
        />

        {/* ── Date ───────────────────────────────────────── */}
        <Text style={styles.label}>Bill Date *</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.textSecondary}
        />

        {/* ── Payment Terms ──────────────────────────────── */}
        <CustomDropdown
          label="Payment Terms"
          options={PAYMENT_TERMS_OPTIONS}
          value={paymentTerms}
          onChange={setPaymentTerms}
        />

        {/* ── Due Date (auto) ────────────────────────────── */}
        <Text style={styles.label}>Due Date</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={dueDate}
          editable={false}
        />

        {/* ── Line Items ─────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Line Items</Text>

        {lines.map((line, idx) => (
          <View key={line.lineId} style={styles.lineCard}>
            <View style={styles.lineHeader}>
              <Text style={styles.lineNum}>#{idx + 1}</Text>
              {lines.length > 1 && (
                <TouchableOpacity onPress={() => removeLine(idx)}>
                  <Text style={styles.lineRemove}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Account dropdown */}
            <CustomDropdown
              label="Expense Account *"
              options={expenseAccountOptions}
              value={line.accountId}
              onChange={(v) => {
                const acct = chartOfAccounts.find((a) => a.accountId === v);
                updateLine(idx, {
                  accountId: v,
                  accountName: acct?.name ?? '',
                });
              }}
              placeholder="Select account..."
              searchable
            />

            {/* Description */}
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={styles.input}
              value={line.description}
              onChangeText={(t) => updateLine(idx, { description: t })}
              placeholder="Item description"
              placeholderTextColor={Colors.textSecondary}
            />

            {/* Amount + Tax row */}
            <View style={styles.lineAmountRow}>
              <View style={{ flex: 2 }}>
                <Text style={styles.label}>Amount *</Text>
                <TextInput
                  style={styles.input}
                  value={line.amount ? String(line.amount) : ''}
                  onChangeText={(t) =>
                    updateLine(idx, { amount: parseFloat(t) || 0 })
                  }
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <CustomDropdown
                  label="Tax"
                  options={TAX_RATE_OPTIONS.map((o) => ({
                    label: o.label,
                    value: String(o.value),
                  }))}
                  value={String(line.taxRate)}
                  onChange={(v) => updateLine(idx, { taxRate: parseFloat(v) })}
                />
              </View>
            </View>
          </View>
        ))}

        {/* Add line */}
        <TouchableOpacity style={styles.addLineBtn} onPress={addLine}>
          <Text style={styles.addLineText}>+ Add Line</Text>
        </TouchableOpacity>

        {/* ── Totals ─────────────────────────────────────── */}
        <View style={styles.totalsCard}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{fmt(subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tax</Text>
            <Text style={styles.totalsValue}>{fmt(taxAmount)}</Text>
          </View>
          <View style={[styles.totalsRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{fmt(total)}</Text>
          </View>
        </View>

        {/* ── Notes ──────────────────────────────────────── */}
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          placeholder="Add notes or memo..."
          placeholderTextColor={Colors.textSecondary}
        />

        {/* ── Action Buttons ─────────────────────────────── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.draftBtn]}
            onPress={() => handleSave('draft')}
            disabled={saving}
          >
            <Text style={styles.draftBtnText}>
              {saving ? 'Saving...' : 'Save Draft'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.openBtn]}
            onPress={() => handleSave('open')}
            disabled={saving}
          >
            <Text style={styles.openBtnText}>
              {saving ? 'Saving...' : 'Save as Open'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default BillFormScreen;

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing.md, paddingBottom: 120 },

  /* top bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.primary,
  },
  backBtn: { padding: Spacing.xs },
  backText: { color: '#fff', fontSize: 22 },
  topTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  /* inputs */
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  inputDisabled: { backgroundColor: Colors.background },
  textArea: { minHeight: 60, textAlignVertical: 'top' },

  /* sections */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  /* line card */
  lineCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  lineNum: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  lineRemove: { fontSize: 18, color: Colors.danger, fontWeight: '700' },
  lineAmountRow: { flexDirection: 'row', alignItems: 'flex-end' },

  /* add line */
  addLineBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  addLineText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },

  /* totals */
  totalsCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    ...Shadows.sm,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalsLabel: { fontSize: 14, color: Colors.textSecondary },
  totalsValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  grandTotalValue: { fontSize: 16, fontWeight: '700', color: Colors.primary },

  /* actions */
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  draftBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  draftBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  openBtn: { backgroundColor: Colors.primary },
  openBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
