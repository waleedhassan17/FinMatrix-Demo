// ============================================================
// FINMATRIX - Vendor Credit Form Screen
// ============================================================
// Like Bill form but creates a credit. Can be applied to open bills.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import CustomDropdown from '../../Custom-Components/CustomDropdown';
import { useAppSelector } from '../../hooks/useReduxHooks';
import { chartOfAccounts } from '../../dummy-data/chartOfAccounts';
import {
  VendorCredit,
  VendorCreditLine,
  VendorCreditStatus,
  vendorCredits,
} from '../../dummy-data/vendorCredits';
import { bills, Bill } from '../../dummy-data/bills';

/* ── Helpers ─────────────────────────────────────────────── */
const uid = () =>
  `vcl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

const blankLine = (): VendorCreditLine => ({
  lineId: uid(),
  accountId: '',
  accountName: '',
  description: '',
  amount: 0,
  taxRate: 10,
});

const TAX_RATE_OPTIONS = [
  { label: '0%', value: '0' },
  { label: '5%', value: '5' },
  { label: '10%', value: '10' },
  { label: '15%', value: '15' },
];

/* ================================================================
   COMPONENT
   ================================================================ */
const VendorCreditFormScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const vendors = useAppSelector((s) => s.vendors.vendors);

  /* ── dropdown data ───────────────────────────────────── */
  const vendorOptions = useMemo(
    () =>
      vendors
        .filter((v) => v.isActive)
        .map((v) => ({ label: v.companyName, value: v.vendorId })),
    [vendors],
  );

  const expenseAccountOptions = useMemo(
    () =>
      chartOfAccounts
        .filter((a) => a.type === 'expense' && a.isActive)
        .map((a) => ({
          label: `${a.accountNumber} - ${a.name}`,
          value: a.accountId,
        })),
    [],
  );

  /* ── form state ──────────────────────────────────────── */
  const [vendorId, setVendorId] = useState('');
  const [creditNumber, setCreditNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<VendorCreditLine[]>([blankLine()]);
  const [notes, setNotes] = useState('');
  const [applyToBillId, setApplyToBillId] = useState('');
  const [saving, setSaving] = useState(false);

  /* ── auto credit number ──────────────────────────────── */
  useEffect(() => {
    const nums = vendorCredits.map((vc) => {
      const m = vc.creditNumber.match(/VC-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    });
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    setCreditNumber(`VC-${String(next).padStart(3, '0')}`);
  }, []);

  /* ── open bills for selected vendor ──────────────────── */
  const openBills = useMemo(() => {
    if (!vendorId) return [];
    return bills.filter(
      (b) =>
        b.vendorId === vendorId &&
        ['open', 'partially_paid', 'overdue'].includes(b.status),
    );
  }, [vendorId]);

  const billOptions = useMemo(
    () =>
      [{ label: 'None — save as unapplied credit', value: '' }].concat(
        openBills.map((b) => ({
          label: `${b.billNumber} — $${(b.total - b.amountPaid).toFixed(2)} due`,
          value: b.billId,
        })),
      ),
    [openBills],
  );

  /* ── totals ──────────────────────────────────────────── */
  const { subtotal, taxAmount, total } = useMemo(() => {
    let sub = 0;
    let tax = 0;
    for (const l of lines) {
      sub += l.amount;
      tax += l.amount * (l.taxRate / 100);
    }
    return {
      subtotal: Math.round(sub * 100) / 100,
      taxAmount: Math.round(tax * 100) / 100,
      total: Math.round((sub + tax) * 100) / 100,
    };
  }, [lines]);

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  /* ── line handlers ───────────────────────────────────── */
  const updateLine = useCallback(
    (idx: number, patch: Partial<VendorCreditLine>) => {
      setLines((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...patch };
        return copy;
      });
    },
    [],
  );

  const removeLine = useCallback((idx: number) => {
    setLines((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx),
    );
  }, []);

  const addLine = useCallback(
    () => setLines((prev) => [...prev, blankLine()]),
    [],
  );

  /* ── save ────────────────────────────────────────────── */
  const handleSave = async (status: VendorCreditStatus) => {
    if (!vendorId) {
      Alert.alert('Validation', 'Vendor is required.');
      return;
    }
    if (!lines.some((l) => l.amount > 0)) {
      Alert.alert('Validation', 'At least one line with an amount is required.');
      return;
    }

    const vendorName =
      vendors.find((v) => v.vendorId === vendorId)?.companyName ?? '';

    const credit: VendorCredit = {
      creditId: `vc_${Date.now()}`,
      companyId: 'company_1',
      vendorId,
      vendorName,
      creditNumber,
      date,
      lines,
      subtotal,
      taxAmount,
      total,
      amountApplied: applyToBillId ? total : 0,
      appliedToBillIds: applyToBillId ? [applyToBillId] : [],
      status: applyToBillId ? 'applied' : status,
      notes,
      createdAt: new Date().toISOString(),
    };

    setSaving(true);
    // Mock save — in real app this would dispatch to redux
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);

    Alert.alert(
      'Vendor Credit Created',
      `${creditNumber} for ${fmt(total)} has been ${
        applyToBillId ? 'applied to bill' : 'saved as ' + status
      }.`,
    );
    navigation.goBack();
  };

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
        <Text style={styles.headerTitle}>New Vendor Credit</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Vendor */}
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

        {/* Credit Details */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>CREDIT DETAILS</Text>
          <Text style={styles.fieldLabel}>Credit Number</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={creditNumber}
            editable={false}
          />
          <Text style={styles.fieldLabel}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.placeholder}
          />
        </View>

        {/* Line Items */}
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
                label="Expense Account"
                options={expenseAccountOptions}
                value={line.accountId}
                onChange={(val) => {
                  const acc = chartOfAccounts.find(
                    (a) => a.accountId === val,
                  );
                  updateLine(idx, {
                    accountId: val,
                    accountName: acc?.name ?? '',
                  });
                }}
                placeholder="Select account..."
                searchable
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.input}
                value={line.description}
                onChangeText={(t) => updateLine(idx, { description: t })}
                placeholder="Credit description"
                placeholderTextColor={Colors.placeholder}
              />

              <View style={styles.rowFields}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Amount</Text>
                  <TextInput
                    style={styles.input}
                    value={line.amount > 0 ? String(line.amount) : ''}
                    onChangeText={(t) =>
                      updateLine(idx, { amount: parseFloat(t) || 0 })
                    }
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={Colors.placeholder}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.fieldLabel}>Tax Rate</Text>
                  <CustomDropdown
                    label="Tax"
                    options={TAX_RATE_OPTIONS}
                    value={String(line.taxRate)}
                    onChange={(v) =>
                      updateLine(idx, { taxRate: parseInt(v) || 0 })
                    }
                  />
                </View>
              </View>

              {idx < lines.length - 1 && <View style={styles.lineDivider} />}
            </View>
          ))}

          <TouchableOpacity style={styles.addLineBtn} onPress={addLine}>
            <Text style={styles.addLineBtnText}>+ Add Line Item</Text>
          </TouchableOpacity>
        </View>

        {/* Totals */}
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
            <Text style={styles.grandLabel}>Credit Total</Text>
            <Text style={[styles.grandValue, { color: Colors.success }]}>
              {fmt(total)}
            </Text>
          </View>
        </View>

        {/* Apply to Bill */}
        {vendorId && openBills.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>APPLY TO BILL</Text>
            <CustomDropdown
              label="Apply to Bill"
              options={billOptions}
              value={applyToBillId}
              onChange={setApplyToBillId}
              placeholder="Select bill to apply credit..."
            />
          </View>
        )}

        {/* Notes */}
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

      {/* Action bar */}
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
          style={[styles.saveBtn, { backgroundColor: Colors.success }]}
          onPress={() => handleSave('open')}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>
            {saving ? '...' : applyToBillId ? 'Save & Apply' : 'Save Credit'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
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
  inputDisabled: {
    backgroundColor: Colors.borderLight,
    color: Colors.textTertiary,
  },
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
  removeBtn: {
    fontSize: 16,
    color: Colors.danger,
    fontWeight: '700',
    padding: 4,
  },
  lineDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
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
  grandValue: { fontSize: 20, fontWeight: '800' },

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

export default VendorCreditFormScreen;
