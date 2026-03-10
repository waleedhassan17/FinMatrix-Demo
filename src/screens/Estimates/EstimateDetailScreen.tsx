// ============================================================
// FINMATRIX - Estimate Detail Screen
// ============================================================
// Professional estimate preview with context-sensitive actions:
//   Draft  → Edit, Send, Delete
//   Sent   → Convert to Invoice, Convert to SO, Mark Declined
//   Accepted → Convert to Invoice, Convert to SO
//   Declined/Expired → Duplicate, Edit (to reissue)

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
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { Estimate, EstimateStatus } from '../../dummy-data/estimates';
import { getEstimateByIdAPI } from '../../network/estimateNetwork';
import { updateEstimate, fetchEstimates } from './estimateSlice';
import { ROUTES } from '../../navigations-map/Base';

// ─── Status maps ────────────────────────────────────────────

const STATUS_COLOR: Record<EstimateStatus, string> = {
  draft: Colors.textTertiary,
  sent: Colors.info,
  accepted: Colors.success,
  declined: Colors.danger,
  expired: Colors.textDisabled,
};
const STATUS_BG: Record<EstimateStatus, string> = {
  draft: Colors.background,
  sent: Colors.infoLight,
  accepted: Colors.successLight,
  declined: Colors.dangerLight,
  expired: Colors.background,
};
const STATUS_LABEL: Record<EstimateStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
};

const fmt = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ─── Main ───────────────────────────────────────────────────

const EstimateDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const estimateId: string = route.params?.estimateId;
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!estimateId) return;
    setIsLoading(true);
    getEstimateByIdAPI(estimateId)
      .then(setEstimate)
      .catch(() => { Alert.alert('Error', 'Estimate not found.'); navigation.goBack(); })
      .finally(() => setIsLoading(false));
  }, [estimateId]);

  const actualDiscount = useMemo(() => {
    if (!estimate) return 0;
    return estimate.discountType === 'percentage'
      ? Math.round(estimate.subtotal * estimate.discountAmount) / 100
      : estimate.discountAmount;
  }, [estimate]);

  // ── Actions ────────────────────────────────────────────────
  const handleEdit = () => navigation.navigate(ROUTES.ESTIMATE_FORM, { estimateId });

  const handleSend = () => {
    if (!estimate) return;
    Alert.alert('Send Estimate', `Mark ${estimate.estimateNumber} as sent?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: async () => {
        await dispatch(updateEstimate({ id: estimateId, data: { status: 'sent' } }));
        await dispatch(fetchEstimates());
        setEstimate((p) => p ? { ...p, status: 'sent' } : p);
      }},
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Draft', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await dispatch(updateEstimate({ id: estimateId, data: { status: 'expired' } }));
        await dispatch(fetchEstimates());
        navigation.goBack();
      }},
    ]);
  };

  const handleDecline = () => {
    Alert.alert('Mark Declined', 'Mark this estimate as declined?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: async () => {
        await dispatch(updateEstimate({ id: estimateId, data: { status: 'declined' } }));
        await dispatch(fetchEstimates());
        setEstimate((p) => p ? { ...p, status: 'declined' } : p);
      }},
    ]);
  };

  const handleConvertInvoice = () =>
    Alert.alert('Convert to Invoice', 'This will create a new invoice from this estimate.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Convert', onPress: async () => {
        if (!estimate) return;
        const invoiceLines = estimate.lines.map((l: any) => ({
          lineId: `il_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          itemId: l.itemId ?? null,
          description: l.description,
          quantity: l.quantity,
          rate: l.rate,
          amount: l.amount,
          taxRate: l.taxRate,
        }));
        // Mark estimate as converted
        await dispatch(updateEstimate({ id: estimateId, data: { status: 'accepted' as any } }));
        setEstimate((p) => p ? { ...p, status: 'accepted' as any } : p);
        navigation.navigate(ROUTES.INVOICE_FORM, {
          fromEstimate: {
            customerId: estimate.customerId,
            lines: invoiceLines,
            discountAmount: estimate.discountAmount,
            discountType: estimate.discountType,
            notes: estimate.notes,
          },
        });
      }},
    ]);

  const handleConvertSO = () =>
    Alert.alert('Convert to Sales Order', 'This will create a new sales order from this estimate.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Convert', onPress: async () => {
        if (!estimate) return;
        const soLines = estimate.lines.map((l: any) => ({
          lineId: `sol_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          itemId: l.itemId ?? null,
          description: l.description,
          quantityOrdered: l.quantity,
          quantityFulfilled: 0,
          rate: l.rate,
          amount: l.amount,
          taxRate: l.taxRate,
        }));
        // Mark estimate as converted
        await dispatch(updateEstimate({ id: estimateId, data: { status: 'accepted' as any } }));
        setEstimate((p) => p ? { ...p, status: 'accepted' as any } : p);
        navigation.navigate(ROUTES.SO_FORM, {
          fromEstimate: {
            customerId: estimate.customerId,
            customerName: estimate.customerName,
            lines: soLines,
            discountAmount: estimate.discountAmount,
            discountType: estimate.discountType,
            notes: estimate.notes,
          },
        });
      }},
    ]);

  const handleDuplicate = () => {
    if (!estimate) return;
    const dupLines = estimate.lines.map((l: any) => ({
      lineId: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      itemId: l.itemId ?? null,
      description: l.description,
      quantity: l.quantity,
      rate: l.rate,
      amount: l.amount,
      taxRate: l.taxRate,
    }));
    navigation.navigate(ROUTES.ESTIMATE_FORM, {
      fromDuplicate: {
        customerId: estimate.customerId,
        customerName: estimate.customerName,
        lines: dupLines,
        discountAmount: estimate.discountAmount,
        discountType: estimate.discountType,
        notes: estimate.notes,
      },
    });
  };

  // ── Loading ────────────────────────────────────────────────
  if (isLoading || !estimate) {
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
        <Text style={styles.headerTitle}>Estimate</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.invoiceCard}>
          {/* Company vs ESTIMATE heading */}
          <View style={styles.topRow}>
            <View>
              <Text style={styles.companyName}>FinMatrix Inc.</Text>
              <Text style={styles.companyAddr}>100 Finance Way</Text>
              <Text style={styles.companyAddr}>Suite 400, New York, NY 10001</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.docWord}>ESTIMATE</Text>
              <Text style={styles.docNum}>{estimate.estimateNumber}</Text>
            </View>
          </View>

          {/* Bill To */}
          <View style={styles.billTo}>
            <Text style={styles.billToLabel}>PREPARED FOR</Text>
            <Text style={styles.billToName}>{estimate.customerName}</Text>
            <Text style={styles.billToId}>ID: {estimate.customerId}</Text>
          </View>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{fmtDate(estimate.date)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Expires</Text>
              <Text style={styles.metaValue}>{fmtDate(estimate.expirationDate)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[estimate.status] }]}>
                <Text style={[styles.statusBadgeText, { color: STATUS_COLOR[estimate.status] }]}>
                  {STATUS_LABEL[estimate.status]}
                </Text>
              </View>
            </View>
          </View>

          {/* Line items table */}
          <View style={styles.tableContainer}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.colNum, styles.thText]}>#</Text>
              <Text style={[styles.tableCell, styles.colDesc, styles.thText]}>Description</Text>
              <Text style={[styles.tableCell, styles.colQty, styles.thText]}>Qty</Text>
              <Text style={[styles.tableCell, styles.colRate, styles.thText]}>Rate</Text>
              <Text style={[styles.tableCell, styles.colTax, styles.thText]}>Tax</Text>
              <Text style={[styles.tableCell, styles.colAmt, styles.thText]}>Amount</Text>
            </View>
            {estimate.lines.map((line, idx) => (
              <View key={line.lineId} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                <Text style={[styles.tableCell, styles.colNum]}>{idx + 1}</Text>
                <Text style={[styles.tableCell, styles.colDesc]} numberOfLines={2}>{line.description}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{line.quantity}</Text>
                <Text style={[styles.tableCell, styles.colRate]}>{fmt(line.rate)}</Text>
                <Text style={[styles.tableCell, styles.colTax]}>{line.taxRate}%</Text>
                <Text style={[styles.tableCell, styles.colAmt]}>{fmt(line.amount)}</Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totalsBlock}>
            <TotalRow label="Subtotal" value={fmt(estimate.subtotal)} />
            {actualDiscount > 0 && (
              <TotalRow
                label={estimate.discountType === 'percentage' ? `Discount (${estimate.discountAmount}%)` : 'Discount'}
                value={`−${fmt(actualDiscount)}`}
                color={Colors.danger}
              />
            )}
            <TotalRow label="Tax" value={fmt(estimate.taxAmount)} />
            <View style={styles.totalDivider} />
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>TOTAL</Text>
              <Text style={styles.grandValue}>{fmt(estimate.total)}</Text>
            </View>
          </View>

          {/* Notes */}
          {estimate.notes ? (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{estimate.notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <ActionButtons
          status={estimate.status}
          onEdit={handleEdit}
          onSend={handleSend}
          onDelete={handleDelete}
          onDecline={handleDecline}
          onConvertInvoice={handleConvertInvoice}
          onConvertSO={handleConvertSO}
          onDuplicate={handleDuplicate}
        />
      </View>
    </View>
  );
};

// ─── Action Buttons ─────────────────────────────────────────

interface ActionButtonsProps {
  status: EstimateStatus;
  onEdit: () => void;
  onSend: () => void;
  onDelete: () => void;
  onDecline: () => void;
  onConvertInvoice: () => void;
  onConvertSO: () => void;
  onDuplicate: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ status, onEdit, onSend, onDelete, onDecline, onConvertInvoice, onConvertSO, onDuplicate }) => {
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
      return (
        <>
          <ActionBtn label="To Invoice" color={Colors.success} onPress={onConvertInvoice} />
          <ActionBtn label="To SO" color={Colors.info} onPress={onConvertSO} outlined />
          <ActionBtn label="Decline" color={Colors.danger} onPress={onDecline} outlined />
        </>
      );
    case 'accepted':
      return (
        <>
          <ActionBtn label="To Invoice" color={Colors.success} onPress={onConvertInvoice} />
          <ActionBtn label="To SO" color={Colors.info} onPress={onConvertSO} />
        </>
      );
    case 'declined':
    case 'expired':
      return (
        <>
          <ActionBtn label="Edit" color={Colors.primary} onPress={onEdit} />
          <ActionBtn label="Duplicate" color={Colors.secondary} onPress={onDuplicate} outlined />
        </>
      );
    default:
      return null;
  }
};

const ActionBtn: React.FC<{ label: string; color: string; onPress: () => void; outlined?: boolean }> = ({ label, color, onPress, outlined }) => (
  <TouchableOpacity
    style={[styles.actionBtn, outlined ? { borderWidth: 1.5, borderColor: color, backgroundColor: Colors.white } : { backgroundColor: color }]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[styles.actionBtnText, { color: outlined ? color : Colors.white }]}>{label}</Text>
  </TouchableOpacity>
);

const TotalRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <View style={styles.totalRow}>
    <Text style={styles.totalRowLabel}>{label}</Text>
    <Text style={[styles.totalRowValue, color ? { color } : {}]}>{value}</Text>
  </View>
);

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

  invoiceCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.lg, ...Shadows.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  companyName: { fontSize: 17, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  companyAddr: { fontSize: 11, color: Colors.textTertiary, lineHeight: 16 },
  docWord: { fontSize: 22, fontWeight: '800', color: Colors.primary, letterSpacing: 2 },
  docNum: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },

  billTo: { marginBottom: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  billToLabel: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 1, marginBottom: 4 },
  billToName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  billToId: { fontSize: 12, color: Colors.textTertiary, marginTop: 1 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.lg, gap: Spacing.sm },
  metaItem: { flex: 1, minWidth: '30%' as any },
  metaLabel: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 0.5, marginBottom: 3 },
  metaValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  statusBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },

  tableContainer: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm, overflow: 'hidden', marginBottom: Spacing.lg },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: Spacing.sm },
  tableHeader: { backgroundColor: Colors.primary + '0C', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableRowAlt: { backgroundColor: Colors.background },
  tableCell: { fontSize: 12, color: Colors.textPrimary },
  thText: { fontWeight: '700', fontSize: 10, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3 },
  colNum: { width: 22 },
  colDesc: { flex: 1, paddingRight: 4 },
  colQty: { width: 32, textAlign: 'center' },
  colRate: { width: 56, textAlign: 'right' },
  colTax: { width: 36, textAlign: 'right' },
  colAmt: { width: 64, textAlign: 'right', fontWeight: '600' },

  totalsBlock: { alignSelf: 'flex-end', width: '60%' as any, marginBottom: Spacing.lg },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalRowLabel: { fontSize: 13, color: Colors.textSecondary },
  totalRowValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  totalDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  grandLabel: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 0.5 },
  grandValue: { fontSize: 24, fontWeight: '800', color: Colors.primary },

  notesSection: { borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md },
  notesLabel: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 1, marginBottom: 4 },
  notesText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },

  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.md,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.md,
  },
  actionBtn: { flex: 1, height: 42, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
});

export default EstimateDetailScreen;
