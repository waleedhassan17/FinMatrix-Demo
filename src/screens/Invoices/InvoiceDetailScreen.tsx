// ============================================================
// FINMATRIX - Invoice Detail Screen
// ============================================================
// Professional invoice layout with:
//   Company header, Bill To, metadata, line-items table,
//   totals, payment history, context-sensitive action bar.

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { Invoice, InvoiceStatus, InvoiceLine } from '../../dummy-data/invoices';
import { Payment } from '../../dummy-data/payments';
import { getInvoiceByIdAPI } from '../../network/invoiceNetwork';
import { fetchPaymentsForInvoice } from '../Payments/paymentSlice';
import { updateInvoice, fetchInvoices } from './invoiceSlice';
import { ROUTES } from '../../navigations-map/Base';

// ─── Constants ──────────────────────────────────────────────

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  draft: Colors.textTertiary,
  sent: Colors.info,
  viewed: Colors.warning,
  paid: Colors.success,
  overdue: Colors.danger,
  cancelled: Colors.textDisabled,
};

const STATUS_BG: Record<InvoiceStatus, string> = {
  draft: Colors.background,
  sent: Colors.infoLight,
  viewed: Colors.warningLight,
  paid: Colors.successLight,
  overdue: Colors.dangerLight,
  cancelled: Colors.background,
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

const METHOD_LABEL: Record<string, string> = {
  cash: 'Cash',
  check: 'Check',
  credit_card: 'Credit Card',
  bank_transfer: 'Bank Transfer',
};

const TERMS_LABEL: Record<string, string> = {
  due_on_receipt: 'Due on Receipt',
  net_15: 'Net 15',
  net_30: 'Net 30',
  net_45: 'Net 45',
  net_60: 'Net 60',
};

const fmt = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

// ─── Main Component ─────────────────────────────────────────

const InvoiceDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const invoiceId: string = route.params?.invoiceId;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const invoicePayments = useAppSelector((s) => s.payments.invoicePayments);

  // ── Load invoice + payments ────────────────────────────────
  useEffect(() => {
    if (!invoiceId) return;
    setIsLoading(true);
    getInvoiceByIdAPI(invoiceId)
      .then((inv) => setInvoice(inv))
      .catch(() => {
        Alert.alert('Error', 'Invoice not found.');
        navigation.goBack();
      })
      .finally(() => setIsLoading(false));
    dispatch(fetchPaymentsForInvoice(invoiceId));
  }, [invoiceId, dispatch]);

  // ── Derived values ─────────────────────────────────────────
  const balanceDue = useMemo(
    () => (invoice ? invoice.total - invoice.amountPaid : 0),
    [invoice],
  );

  const actualDiscount = useMemo(() => {
    if (!invoice) return 0;
    return invoice.discountType === 'percentage'
      ? Math.round(invoice.subtotal * invoice.discountAmount) / 100
      : invoice.discountAmount;
  }, [invoice]);

  // ── Action handlers ────────────────────────────────────────

  const handleEdit = () =>
    navigation.navigate(ROUTES.INVOICE_FORM, { invoiceId });

  const handleSend = async () => {
    if (!invoice) return;
    Alert.alert('Send Invoice', `Mark ${invoice.invoiceNumber} as sent?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: async () => {
          await dispatch(
            updateInvoice({ id: invoiceId, data: { status: 'sent' } }),
          );
          await dispatch(fetchInvoices());
          setInvoice((prev) => (prev ? { ...prev, status: 'sent' } : prev));
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!invoice) return;
    Alert.alert('Delete Draft', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await dispatch(
            updateInvoice({ id: invoiceId, data: { status: 'cancelled' } }),
          );
          await dispatch(fetchInvoices());
          navigation.goBack();
        },
      },
    ]);
  };

  const handleVoid = () => {
    if (!invoice) return;
    Alert.alert('Void Invoice', `Void ${invoice.invoiceNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Void',
        style: 'destructive',
        onPress: async () => {
          await dispatch(
            updateInvoice({ id: invoiceId, data: { status: 'cancelled' } }),
          );
          await dispatch(fetchInvoices());
          setInvoice((prev) =>
            prev ? { ...prev, status: 'cancelled' } : prev,
          );
        },
      },
    ]);
  };

  const handleRecordPayment = () =>
    navigation.navigate(ROUTES.RECEIVE_PAYMENT, {
      customerId: invoice?.customerId,
      invoiceId,
    });

  const handleResend = () => {
    if (!invoice) return;
    Alert.alert(
      'Resend Invoice',
      `Resend ${invoice.invoiceNumber} to ${invoice.customerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resend',
          onPress: async () => {
            await dispatch(
              updateInvoice({ id: invoiceId, data: { status: 'sent' } }),
            );
            setInvoice((prev) => (prev ? { ...prev, status: 'sent' } : prev));
            Alert.alert('Sent', `${invoice.invoiceNumber} has been resent to the customer.`);
          },
        },
      ],
    );
  };

  const handleReminder = () => {
    if (!invoice) return;
    Alert.alert(
      'Send Payment Reminder',
      `Send a payment reminder for ${invoice.invoiceNumber} (${fmt(balanceDue)} due)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reminder',
          onPress: () =>
            Alert.alert('Reminder Sent', `Payment reminder sent to ${invoice.customerName}.`),
        },
      ],
    );
  };

  const handleDuplicate = () => {
    if (!invoice) return;
    const dupLines = invoice.lines.map((l: InvoiceLine) => ({
      lineId: `il_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      itemId: l.itemId ?? null,
      description: l.description,
      quantity: l.quantity,
      rate: l.rate,
      amount: l.amount,
      taxRate: l.taxRate,
    }));
    navigation.navigate(ROUTES.INVOICE_FORM, {
      fromEstimate: {
        customerId: invoice.customerId,
        lines: dupLines,
        discountAmount: invoice.discountAmount,
        discountType: invoice.discountType,
        notes: invoice.notes,
      },
    });
  };

  const handleViewPDF = () => {
    if (!invoice) return;
    const linesSummary = invoice.lines
      .map(
        (l: InvoiceLine, i: number) =>
          `${i + 1}. ${l.description}  ×${l.quantity}  @${fmt(l.rate)}  = ${fmt(l.amount)}`,
      )
      .join('\n');
    Alert.alert(
      `${invoice.invoiceNumber} — PDF Preview`,
      `To: ${invoice.customerName}\n` +
        `Date: ${fmtDate(invoice.date)}\n` +
        `Due: ${fmtDate(invoice.dueDate)}\n\n` +
        `─── Line Items ───\n${linesSummary}\n\n` +
        `Subtotal: ${fmt(invoice.subtotal)}\n` +
        `Tax: ${fmt(invoice.taxAmount)}\\n` +
        `Total: ${fmt(invoice.total)}\n` +
        `Amount Paid: ${fmt(invoice.amountPaid)}\n` +
        `Balance Due: ${fmt(balanceDue)}`,
    );
  };

  // ── Loading ────────────────────────────────────────────────
  if (isLoading || !invoice) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading invoice…</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {/* ─── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ Invoice Card ═══════════════════════════════ */}
        <View style={styles.invoiceCard}>
          {/* ─── Company vs Invoice Heading ────────────── */}
          <View style={styles.topRow}>
            <View style={styles.companyBlock}>
              <Text style={styles.companyName}>FinMatrix Inc.</Text>
              <Text style={styles.companyAddr}>100 Finance Way</Text>
              <Text style={styles.companyAddr}>Suite 400, New York, NY 10001</Text>
            </View>
            <View style={styles.invoiceLabel}>
              <Text style={styles.invoiceWord}>INVOICE</Text>
              <Text style={styles.invoiceNum}>{invoice.invoiceNumber}</Text>
            </View>
          </View>

          {/* ─── Bill To ──────────────────────────────── */}
          <View style={styles.billToSection}>
            <Text style={styles.billToLabel}>BILL TO</Text>
            <Text style={styles.billToName}>{invoice.customerName}</Text>
            <Text style={styles.billToId}>ID: {invoice.customerId}</Text>
          </View>

          {/* ─── Metadata Row ─────────────────────────── */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.date)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.dueDate)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Terms</Text>
              <Text style={styles.metaValue}>
                {TERMS_LABEL[invoice.paymentTerms] ?? invoice.paymentTerms}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Status</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_BG[invoice.status] },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: STATUS_COLOR[invoice.status] },
                  ]}
                >
                  {STATUS_LABEL[invoice.status]}
                </Text>
              </View>
            </View>
          </View>

          {/* ─── Line Items Table ─────────────────────── */}
          <View style={styles.tableContainer}>
            {/* Header row */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.colNum, styles.thText]}>#</Text>
              <Text style={[styles.tableCell, styles.colDesc, styles.thText]}>
                Description
              </Text>
              <Text style={[styles.tableCell, styles.colQty, styles.thText]}>
                Qty
              </Text>
              <Text style={[styles.tableCell, styles.colRate, styles.thText]}>
                Rate
              </Text>
              <Text style={[styles.tableCell, styles.colTax, styles.thText]}>
                Tax
              </Text>
              <Text style={[styles.tableCell, styles.colAmt, styles.thText]}>
                Amount
              </Text>
            </View>

            {/* Data rows */}
            {invoice.lines.map((line, idx) => (
              <View
                key={line.lineId}
                style={[
                  styles.tableRow,
                  idx % 2 === 1 && styles.tableRowAlt,
                ]}
              >
                <Text style={[styles.tableCell, styles.colNum]}>{idx + 1}</Text>
                <Text
                  style={[styles.tableCell, styles.colDesc]}
                  numberOfLines={2}
                >
                  {line.description}
                </Text>
                <Text style={[styles.tableCell, styles.colQty]}>
                  {line.quantity}
                </Text>
                <Text style={[styles.tableCell, styles.colRate]}>
                  {fmt(line.rate)}
                </Text>
                <Text style={[styles.tableCell, styles.colTax]}>
                  {line.taxRate}%
                </Text>
                <Text style={[styles.tableCell, styles.colAmt]}>
                  {fmt(line.amount)}
                </Text>
              </View>
            ))}
          </View>

          {/* ─── Totals ───────────────────────────────── */}
          <View style={styles.totalsBlock}>
            <TotalRow label="Subtotal" value={fmt(invoice.subtotal)} />
            {actualDiscount > 0 && (
              <TotalRow
                label={
                  invoice.discountType === 'percentage'
                    ? `Discount (${invoice.discountAmount}%)`
                    : 'Discount'
                }
                value={`−${fmt(actualDiscount)}`}
                valueColor={Colors.danger}
              />
            )}
            <TotalRow label="Tax" value={fmt(invoice.taxAmount)} />
            <View style={styles.totalDivider} />
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL</Text>
              <Text style={styles.grandTotalValue}>{fmt(invoice.total)}</Text>
            </View>

            {invoice.amountPaid > 0 && (
              <>
                <TotalRow
                  label="Amount Paid"
                  value={fmt(invoice.amountPaid)}
                  valueColor={Colors.success}
                />
                {balanceDue > 0 && (
                  <View style={styles.balanceDueRow}>
                    <Text style={styles.balanceDueLabel}>Balance Due</Text>
                    <Text style={styles.balanceDueValue}>
                      {fmt(balanceDue)}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* ─── Notes ────────────────────────────────── */}
          {invoice.notes ? (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* ═══ Payment History ════════════════════════════ */}
        {invoicePayments.length > 0 && (
          <View style={styles.paymentHistoryCard}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {invoicePayments.map((p) => (
              <View key={p.paymentId} style={styles.paymentRow}>
                <View style={styles.paymentLeft}>
                  <Text style={styles.paymentDate}>{fmtDate(p.date)}</Text>
                  <Text style={styles.paymentMethod}>
                    {METHOD_LABEL[p.method] ?? p.method}
                  </Text>
                  {p.referenceNumber ? (
                    <Text style={styles.paymentRef}>
                      Ref: {p.referenceNumber}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.paymentAmount}>
                  {fmt(
                    p.appliedTo
                      .filter((a) => a.invoiceId === invoiceId)
                      .reduce((s, a) => s + a.amount, 0),
                  )}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* spacer for action bar */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ═══ Action Bar ══════════════════════════════════ */}
      <View style={styles.actionBar}>
        <ActionBarContent
          status={invoice.status}
          onEdit={handleEdit}
          onSend={handleSend}
          onDelete={handleDelete}
          onRecordPayment={handleRecordPayment}
          onResend={handleResend}
          onVoid={handleVoid}
          onReminder={handleReminder}
          onDuplicate={handleDuplicate}
          onViewPDF={handleViewPDF}
        />
      </View>
    </View>
  );
};

// ─── Action Bar Content ─────────────────────────────────────

interface ActionBarContentProps {
  status: InvoiceStatus;
  onEdit: () => void;
  onSend: () => void;
  onDelete: () => void;
  onRecordPayment: () => void;
  onResend: () => void;
  onVoid: () => void;
  onReminder: () => void;
  onDuplicate: () => void;
  onViewPDF: () => void;
}

const ActionBarContent: React.FC<ActionBarContentProps> = ({
  status,
  onEdit,
  onSend,
  onDelete,
  onRecordPayment,
  onResend,
  onVoid,
  onReminder,
  onDuplicate,
  onViewPDF,
}) => {
  switch (status) {
    case 'draft':
      return (
        <>
          <ActionBtn label="Edit" color={Colors.primary} onPress={onEdit} />
          <ActionBtn label="Send" color={Colors.success} onPress={onSend} />
          <ActionBtn label="Delete" color={Colors.danger} onPress={onDelete} outlined />
        </>
      );
    case 'sent':
    case 'viewed':
      return (
        <>
          <ActionBtn
            label="Record Payment"
            color={Colors.success}
            onPress={onRecordPayment}
          />
          <ActionBtn label="Resend" color={Colors.info} onPress={onResend} outlined />
          <ActionBtn label="Void" color={Colors.danger} onPress={onVoid} outlined />
        </>
      );
    case 'overdue':
      return (
        <>
          <ActionBtn
            label="Record Payment"
            color={Colors.success}
            onPress={onRecordPayment}
          />
          <ActionBtn
            label="Reminder"
            color={Colors.warning}
            onPress={onReminder}
            outlined
          />
        </>
      );
    case 'paid':
      return (
        <>
          <ActionBtn
            label="Duplicate"
            color={Colors.primary}
            onPress={onDuplicate}
          />
          <ActionBtn
            label="View PDF"
            color={Colors.secondary}
            onPress={onViewPDF}
            outlined
          />
        </>
      );
    default:
      return null;
  }
};

// ─── Action Button ──────────────────────────────────────────

const ActionBtn: React.FC<{
  label: string;
  color: string;
  onPress: () => void;
  outlined?: boolean;
}> = ({ label, color, onPress, outlined }) => (
  <TouchableOpacity
    style={[
      styles.actionBtn,
      outlined
        ? { borderWidth: 1.5, borderColor: color, backgroundColor: Colors.white }
        : { backgroundColor: color },
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text
      style={[styles.actionBtnText, { color: outlined ? color : Colors.white }]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Total Row Helper ───────────────────────────────────────

const TotalRow: React.FC<{
  label: string;
  value: string;
  valueColor?: string;
}> = ({ label, value, valueColor }) => (
  <View style={styles.totalRow}>
    <Text style={styles.totalLabel}>{label}</Text>
    <Text style={[styles.totalValue, valueColor ? { color: valueColor } : {}]}>
      {value}
    </Text>
  </View>
);

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
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },

  // ─── Invoice Card ──────────────────────
  invoiceCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  companyBlock: {},
  companyName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  companyAddr: {
    fontSize: 11,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
  invoiceLabel: {
    alignItems: 'flex-end',
  },
  invoiceWord: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 2,
  },
  invoiceNum: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // ─── Bill To ───────────────────────────
  billToSection: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  billToLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  billToName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  billToId: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },

  // ─── Metadata row ─────────────────────
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  metaItem: {
    flex: 1,
    minWidth: '22%' as any,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ─── Table ─────────────────────────────
  tableContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: Spacing.sm,
  },
  tableHeader: {
    backgroundColor: Colors.primary + '0C',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableRowAlt: {
    backgroundColor: Colors.background,
  },
  tableCell: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  thText: {
    fontWeight: '700',
    fontSize: 10,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  colNum: { width: 22 },
  colDesc: { flex: 1, paddingRight: 4 },
  colQty: { width: 32, textAlign: 'center' },
  colRate: { width: 56, textAlign: 'right' },
  colTax: { width: 36, textAlign: 'right' },
  colAmt: { width: 64, textAlign: 'right', fontWeight: '600' },

  // ─── Totals ────────────────────────────
  totalsBlock: {
    alignSelf: 'flex-end',
    width: '60%' as any,
    marginBottom: Spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  balanceDueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.dangerLight,
  },
  balanceDueLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
  },
  balanceDueValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.danger,
  },

  // ─── Notes ─────────────────────────────
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  // ─── Payment History ───────────────────
  paymentHistoryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginTop: Spacing.base,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  paymentLeft: {},
  paymentDate: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  paymentMethod: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  paymentRef: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.success,
  },

  // ─── Action Bar ────────────────────────
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  actionBtn: {
    flex: 1,
    height: 42,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default InvoiceDetailScreen;
