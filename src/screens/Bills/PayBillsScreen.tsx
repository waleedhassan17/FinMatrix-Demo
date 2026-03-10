// ============================================================
// FINMATRIX - Pay Bills Screen (Batch Payment)
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import CustomDropdown from '../../Custom-Components/CustomDropdown';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { fetchBills, createBillPayment } from './billSlice';
import { Bill } from '../../dummy-data/bills';
import { BillPayment, BillPaymentApplication } from '../../dummy-data/billPayments';
import {
  BANK_ACCOUNT_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '../../models/billModel';

/* ================================================================
   COMPONENT
   ================================================================ */
const PayBillsScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();

  const { bills, isLoading } = useAppSelector((s) => s.bills);
  const preselectedBillId: string | undefined = route.params?.preselectedBillId;

  /* ── payable bills (open, partially_paid, overdue) ───── */
  const payableBills = useMemo(
    () =>
      bills.filter((b) =>
        ['open', 'partially_paid', 'overdue'].includes(b.status),
      ),
    [bills],
  );

  /* ── local state ─────────────────────────────────────── */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bankAccountId, setBankAccountId] = useState('acc_002'); // default Checking
  const [paymentMethod, setPaymentMethod] = useState('check');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [referenceNumber, setReferenceNumber] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [saving, setSaving] = useState(false);

  /* ── load bills on mount ─────────────────────────────── */
  useEffect(() => {
    dispatch(fetchBills());
  }, [dispatch]);

  /* ── preselect a bill if navigated from detail ─────── */
  useEffect(() => {
    if (preselectedBillId) {
      setSelectedIds(new Set([preselectedBillId]));
    }
  }, [preselectedBillId]);

  /* ── vendor filter options ───────────────────────────── */
  const vendorOptions = useMemo(() => {
    const unique = new Map<string, string>();
    for (const b of payableBills) unique.set(b.vendorId, b.vendorName);
    return [
      { label: 'All Vendors', value: '' },
      ...Array.from(unique.entries()).map(([id, name]) => ({
        label: name,
        value: id,
      })),
    ];
  }, [payableBills]);

  /* ── filtered bills ──────────────────────────────────── */
  const filteredBills = useMemo(() => {
    if (!vendorFilter) return payableBills;
    return payableBills.filter((b) => b.vendorId === vendorFilter);
  }, [payableBills, vendorFilter]);

  /* ── totals ──────────────────────────────────────────── */
  const selectedTotal = useMemo(() => {
    let total = 0;
    for (const b of payableBills) {
      if (selectedIds.has(b.billId)) {
        total += b.total - b.amountPaid;
      }
    }
    return total;
  }, [payableBills, selectedIds]);

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  /* ── toggle selection ────────────────────────────────── */
  const toggleBill = useCallback((billId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(billId)) next.delete(billId);
      else next.add(billId);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === filteredBills.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBills.map((b) => b.billId)));
    }
  }, [filteredBills, selectedIds]);

  /* ── pay selected ────────────────────────────────────── */
  const handlePay = async () => {
    if (selectedIds.size === 0) {
      Alert.alert('No Bills Selected', 'Please select at least one bill to pay.');
      return;
    }
    if (!bankAccountId) {
      Alert.alert('Validation', 'Please select a bank account.');
      return;
    }
    if (!paymentDate) {
      Alert.alert('Validation', 'Please enter a payment date.');
      return;
    }

    const appliedTo: BillPaymentApplication[] = [];
    for (const b of payableBills) {
      if (selectedIds.has(b.billId)) {
        appliedTo.push({
          billId: b.billId,
          billNumber: b.billNumber,
          amount: b.total - b.amountPaid,
        });
      }
    }

    // Group by vendor for separate payment records
    const vendorGroups = new Map<string, { vendorId: string; vendorName: string; items: BillPaymentApplication[] }>();
    for (const app of appliedTo) {
      const bill = payableBills.find((b) => b.billId === app.billId)!;
      if (!vendorGroups.has(bill.vendorId)) {
        vendorGroups.set(bill.vendorId, {
          vendorId: bill.vendorId,
          vendorName: bill.vendorName,
          items: [],
        });
      }
      vendorGroups.get(bill.vendorId)!.items.push(app);
    }

    const count = appliedTo.length;
    Alert.alert(
      'Confirm Payment',
      `Pay ${count} bill${count > 1 ? 's' : ''} totaling ${fmt(selectedTotal)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay',
          onPress: async () => {
            setSaving(true);
            try {
              for (const [, group] of vendorGroups) {
                const totalAmount = group.items.reduce((s, i) => s + i.amount, 0);
                const payment: BillPayment = {
                  paymentId: `bpay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                  companyId: 'company_1',
                  vendorId: group.vendorId,
                  vendorName: group.vendorName,
                  date: paymentDate,
                  method: paymentMethod as any,
                  bankAccountId,
                  referenceNumber: referenceNumber || `PAY-${Date.now().toString().slice(-6)}`,
                  amount: totalAmount,
                  appliedTo: group.items,
                  createdAt: new Date().toISOString(),
                };
                await dispatch(createBillPayment(payment)).unwrap();
              }
              await dispatch(fetchBills());
              Alert.alert('Success', `${count} bill${count > 1 ? 's' : ''} paid successfully.`);
              nav.goBack();
            } catch {
              Alert.alert('Error', 'Failed to process payment.');
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  /* ── BILL ROW ────────────────────────────────────────── */
  const BillRow: React.FC<{ item: Bill }> = ({ item }) => {
    const checked = selectedIds.has(item.billId);
    const remaining = item.total - item.amountPaid;
    const isOverdue = item.status === 'overdue';

    return (
      <TouchableOpacity
        style={[styles.billRow, checked && styles.billRowSelected]}
        onPress={() => toggleBill(item.billId)}
        activeOpacity={0.7}
      >
        {/* Checkbox */}
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Text style={styles.checkmark}>✓</Text>}
        </View>

        {/* Bill info */}
        <View style={styles.billInfo}>
          <View style={styles.billTopRow}>
            <Text style={styles.billNumber}>{item.billNumber}</Text>
            {isOverdue && (
              <View style={styles.overdueBadge}>
                <Text style={styles.overdueText}>OVERDUE</Text>
              </View>
            )}
          </View>
          <Text style={styles.billVendor}>{item.vendorName}</Text>
          <Text style={styles.billDueDate}>Due: {item.dueDate}</Text>
        </View>

        {/* Amount */}
        <View style={styles.billAmountCol}>
          <Text style={styles.billAmountLabel}>Balance Due</Text>
          <Text style={[styles.billAmount, isOverdue && { color: Colors.danger }]}>
            {fmt(remaining)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  /* ── Loading ─────────────────────────────────────────── */
  if (isLoading && bills.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  /* ── RENDER ──────────────────────────────────────────── */
  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Pay Bills</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={filteredBills}
        keyExtractor={(item) => item.billId}
        renderItem={({ item }) => <BillRow item={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* Payment settings */}
            <View style={styles.settingsCard}>
              <CustomDropdown
                label="Bank Account"
                options={BANK_ACCOUNT_OPTIONS}
                value={bankAccountId}
                onChange={setBankAccountId}
              />
              <CustomDropdown
                label="Payment Method"
                options={PAYMENT_METHOD_OPTIONS}
                value={paymentMethod}
                onChange={setPaymentMethod}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Payment Date</Text>
                  <TextInput
                    style={styles.input}
                    value={paymentDate}
                    onChangeText={setPaymentDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={styles.label}>Reference #</Text>
                  <TextInput
                    style={styles.input}
                    value={referenceNumber}
                    onChangeText={setReferenceNumber}
                    placeholder="Optional"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              </View>
            </View>

            {/* Vendor filter + select all */}
            <View style={styles.filterRow}>
              <View style={{ flex: 1 }}>
                <CustomDropdown
                  label="Filter by Vendor"
                  options={vendorOptions}
                  value={vendorFilter}
                  onChange={setVendorFilter}
                  searchable
                />
              </View>
            </View>

            <TouchableOpacity style={styles.selectAllBtn} onPress={toggleAll}>
              <Text style={styles.selectAllText}>
                {selectedIds.size === filteredBills.length && filteredBills.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </Text>
              <Text style={styles.selectAllCount}>
                {selectedIds.size} of {filteredBills.length} selected
              </Text>
            </TouchableOpacity>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>No payable bills</Text>
            <Text style={styles.emptySubtitle}>All bills are paid or in draft status.</Text>
          </View>
        }
      />

      {/* Bottom total + pay button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomLeft}>
          <Text style={styles.bottomLabel}>Total Payment</Text>
          <Text style={styles.bottomTotal}>{fmt(selectedTotal)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.payBtn,
            selectedIds.size === 0 && styles.payBtnDisabled,
          ]}
          onPress={handlePay}
          disabled={selectedIds.size === 0 || saving}
        >
          <Text style={styles.payBtnText}>
            {saving ? 'Processing...' : `Pay Selected (${selectedIds.size})`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PayBillsScreen;

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 120 },

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

  /* settings card */
  settingsCard: {
    backgroundColor: '#fff',
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  rowInputs: { flexDirection: 'row', marginTop: Spacing.xs },
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

  /* filter row */
  filterRow: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },

  /* select all */
  selectAllBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  selectAllText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  selectAllCount: { fontSize: 13, color: Colors.textSecondary },

  /* bill row */
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  billRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F0F5FF',
  },

  /* checkbox */
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },

  /* bill info */
  billInfo: { flex: 1 },
  billTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  billNumber: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  overdueBadge: {
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  overdueText: { fontSize: 10, fontWeight: '700', color: Colors.danger },
  billVendor: { fontSize: 13, color: Colors.textPrimary },
  billDueDate: { fontSize: 12, color: Colors.textSecondary },

  /* amount column */
  billAmountCol: { alignItems: 'flex-end' },
  billAmountLabel: { fontSize: 10, color: Colors.textSecondary },
  billAmount: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  /* empty */
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: Spacing.lg },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  /* bottom bar */
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.sm,
  },
  bottomLeft: {},
  bottomLabel: { fontSize: 12, color: Colors.textSecondary },
  bottomTotal: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  payBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  payBtnDisabled: { backgroundColor: Colors.textSecondary, opacity: 0.5 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
