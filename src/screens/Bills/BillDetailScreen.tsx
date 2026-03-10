// ============================================================
// FINMATRIX - Bill Detail Screen
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { fetchBills, updateBill } from './billSlice';
import { Bill, BillStatus } from '../../dummy-data/bills';
import { BillPayment } from '../../dummy-data/billPayments';
import { getBillByIdAPI, getBillPaymentsForBillAPI } from '../../network/billNetwork';

/* ── Status maps ─────────────────────────────────────────── */
const STATUS_COLOR: Record<BillStatus, string> = {
  draft: Colors.textSecondary,
  open: Colors.info,
  partially_paid: Colors.warning,
  paid: Colors.success,
  overdue: Colors.danger,
};

const STATUS_BG: Record<BillStatus, string> = {
  draft: Colors.background,
  open: Colors.infoLight,
  partially_paid: Colors.warningLight,
  paid: Colors.successLight,
  overdue: Colors.dangerLight,
};

const STATUS_LABEL: Record<BillStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
};

/* ================================================================
   COMPONENT
   ================================================================ */
const BillDetailScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const billId: string = route.params?.billId;

  const [bill, setBill] = useState<Bill | null>(null);
  const [payments, setPayments] = useState<BillPayment[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── load bill + payments ────────────────────────────── */
  const loadData = useCallback(async () => {
    setLoading(true);
    const [b, p] = await Promise.all([
      getBillByIdAPI(billId),
      getBillPaymentsForBillAPI(billId),
    ]);
    if (b) setBill(b);
    setPayments(p);
    setLoading(false);
  }, [billId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── format helpers ──────────────────────────────────── */
  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  /* ── derived ─────────────────────────────────────────── */
  const balanceDue = useMemo(
    () => (bill ? bill.total - bill.amountPaid : 0),
    [bill],
  );

  /* ── actions ─────────────────────────────────────────── */
  const handleEdit = () => {
    nav.navigate(ROUTES.BILL_FORM, { billId: bill!.billId });
  };

  const handlePayBill = () => {
    nav.navigate(ROUTES.PAY_BILLS, { preselectedBillId: bill!.billId });
  };

  const handleVoid = () => {
    Alert.alert('Void Bill', `Mark ${bill!.billNumber} as void?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Void',
        style: 'destructive',
        onPress: async () => {
          const updated: Bill = { ...bill!, status: 'draft', notes: bill!.notes + '\n[VOIDED]' };
          await dispatch(updateBill(updated));
          await dispatch(fetchBills());
          nav.goBack();
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Bill', `Delete ${bill!.billNumber}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          // In a real app this would call deleteAPI
          nav.goBack();
        },
      },
    ]);
  };

  /* ── loading ─────────────────────────────────────────── */
  if (loading || !bill) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  /* ── ACTION BAR (context-sensitive) ──────────────────── */
  const ActionBar = () => {
    const btns: { label: string; onPress: () => void; variant?: 'outlined' | 'danger' }[] = [];

    switch (bill.status) {
      case 'draft':
        btns.push({ label: 'Edit', onPress: handleEdit });
        btns.push({ label: 'Delete', onPress: handleDelete, variant: 'danger' });
        break;
      case 'open':
      case 'overdue':
        btns.push({ label: 'Pay Bill', onPress: handlePayBill });
        btns.push({ label: 'Edit', onPress: handleEdit, variant: 'outlined' });
        btns.push({ label: 'Void', onPress: handleVoid, variant: 'danger' });
        break;
      case 'partially_paid':
        btns.push({ label: 'Pay Balance', onPress: handlePayBill });
        btns.push({ label: 'Void', onPress: handleVoid, variant: 'danger' });
        break;
      case 'paid':
        btns.push({ label: 'Duplicate', onPress: () => Alert.alert('Info', 'Duplicate not yet implemented.'), variant: 'outlined' });
        break;
    }

    return (
      <View style={styles.actionBar}>
        {btns.map((b, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.actionBtn,
              b.variant === 'outlined' && styles.actionBtnOutlined,
              b.variant === 'danger' && styles.actionBtnDanger,
              !b.variant && styles.actionBtnPrimary,
            ]}
            onPress={b.onPress}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.actionBtnText,
                b.variant === 'outlined' && styles.actionBtnTextOutlined,
                b.variant === 'danger' && styles.actionBtnTextDanger,
              ]}
            >
              {b.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  /* ── RENDER ──────────────────────────────────────────── */
  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Bill Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Invoice-style card ─────────────────────────── */}
        <View style={styles.detailCard}>
          {/* Company header */}
          <View style={styles.companyHeader}>
            <Text style={styles.companyName}>FinMatrix Inc.</Text>
            <Text style={styles.companySubtitle}>Bill</Text>
          </View>

          {/* Vendor info */}
          <View style={styles.vendorSection}>
            <Text style={styles.sectionLabel}>Vendor</Text>
            <Text style={styles.vendorName}>{bill.vendorName}</Text>
          </View>

          {/* Metadata row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Bill #</Text>
              <Text style={styles.metaValue}>{bill.billNumber}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{bill.date}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaValue}>{bill.dueDate}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[bill.status] }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[bill.status] }]}>
                  {STATUS_LABEL[bill.status]}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Line items table ─────────────────────────── */}
          <Text style={styles.tableSectionTitle}>Line Items</Text>

          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, { flex: 0.4 }]}>#</Text>
            <Text style={[styles.thText, { flex: 2 }]}>Account</Text>
            <Text style={[styles.thText, { flex: 2 }]}>Description</Text>
            <Text style={[styles.thText, { flex: 1, textAlign: 'right' }]}>Tax</Text>
            <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>Amount</Text>
          </View>

          {/* Table rows */}
          {bill.lines.map((line, idx) => (
            <View
              key={line.lineId}
              style={[
                styles.tableRow,
                idx % 2 === 0 && styles.tableRowAlt,
              ]}
            >
              <Text style={[styles.tdText, { flex: 0.4 }]}>{idx + 1}</Text>
              <Text style={[styles.tdText, { flex: 2 }]} numberOfLines={1}>
                {line.accountName}
              </Text>
              <Text style={[styles.tdText, { flex: 2 }]} numberOfLines={2}>
                {line.description}
              </Text>
              <Text style={[styles.tdText, { flex: 1, textAlign: 'right' }]}>
                {line.taxRate}%
              </Text>
              <Text style={[styles.tdTextBold, { flex: 1.2, textAlign: 'right' }]}>
                {fmt(line.amount)}
              </Text>
            </View>
          ))}

          {/* ── Totals ───────────────────────────────────── */}
          <View style={styles.totalsBlock}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{fmt(bill.subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax</Text>
              <Text style={styles.totalsValue}>{fmt(bill.taxAmount)}</Text>
            </View>
            <View style={[styles.totalsRow, styles.grandRow]}>
              <Text style={styles.grandLabel}>Grand Total</Text>
              <Text style={styles.grandValue}>{fmt(bill.total)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Amount Paid</Text>
              <Text style={[styles.totalsValue, { color: Colors.success }]}>
                {fmt(bill.amountPaid)}
              </Text>
            </View>
            <View style={[styles.totalsRow, styles.grandRow]}>
              <Text style={styles.grandLabel}>Balance Due</Text>
              <Text
                style={[
                  styles.grandValue,
                  { color: balanceDue > 0 ? Colors.danger : Colors.success },
                ]}
              >
                {fmt(balanceDue)}
              </Text>
            </View>
          </View>

          {/* Notes */}
          {bill.notes ? (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{bill.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Payment History ────────────────────────────── */}
        {payments.length > 0 && (
          <View style={styles.paymentsSection}>
            <Text style={styles.paymentsSectionTitle}>Payment History</Text>
            {payments.map((p) => {
              const applied = p.appliedTo.find((a) => a.billId === billId);
              return (
                <View key={p.paymentId} style={styles.paymentCard}>
                  <View style={styles.paymentTopRow}>
                    <Text style={styles.paymentRef}>{p.referenceNumber}</Text>
                    <Text style={styles.paymentAmount}>
                      {fmt(applied?.amount ?? p.amount)}
                    </Text>
                  </View>
                  <View style={styles.paymentBottomRow}>
                    <Text style={styles.paymentDate}>{p.date}</Text>
                    <Text style={styles.paymentMethod}>
                      {p.method.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Action Bar ─────────────────────────────────── */}
        <ActionBar />
      </ScrollView>
    </View>
  );
};

export default BillDetailScreen;

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing.md, paddingBottom: 100 },

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

  /* detail card */
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },

  /* company header */
  companyHeader: {
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
  },
  companyName: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  companySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 2,
  },

  /* vendor */
  vendorSection: { marginBottom: Spacing.md },
  sectionLabel: { fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 2 },
  vendorName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  /* metadata */
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  metaItem: {
    minWidth: '22%',
  },
  metaLabel: { fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase' },
  metaValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  statusText: { fontSize: 12, fontWeight: '600' },

  /* table */
  tableSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
  },
  thText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableRowAlt: { backgroundColor: '#F8F9FA' },
  tdText: { fontSize: 12, color: Colors.textPrimary },
  tdTextBold: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },

  /* totals */
  totalsBlock: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalsLabel: { fontSize: 13, color: Colors.textSecondary },
  totalsValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  grandRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 6,
    marginTop: 4,
    marginBottom: 6,
  },
  grandLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  grandValue: { fontSize: 15, fontWeight: '700', color: Colors.primary },

  /* notes */
  notesSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  notesLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
  notesText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 20 },

  /* payment history */
  paymentsSection: { marginTop: Spacing.lg },
  paymentsSectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  paymentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentRef: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  paymentAmount: { fontSize: 14, fontWeight: '700', color: Colors.success },
  paymentBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  paymentDate: { fontSize: 12, color: Colors.textSecondary },
  paymentMethod: { fontSize: 12, color: Colors.textSecondary },

  /* action bar */
  actionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  actionBtnPrimary: { backgroundColor: Colors.primary },
  actionBtnOutlined: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionBtnDanger: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  actionBtnText: { fontWeight: '700', fontSize: 14, color: '#fff' },
  actionBtnTextOutlined: { color: Colors.primary },
  actionBtnTextDanger: { color: Colors.danger },
});
