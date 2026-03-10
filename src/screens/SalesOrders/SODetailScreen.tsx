// ============================================================
// FINMATRIX - Sales Order Detail Screen
// ============================================================
// Professional preview layout with per-line fulfillment progress,
// context-sensitive action bar per SO status.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { SalesOrder, SOStatus } from '../../dummy-data/salesOrders';
import { getSalesOrderByIdAPI, updateSalesOrderAPI } from '../../network/salesOrderNetwork';
import { fetchSalesOrders } from './soSlice';
import { ROUTES } from '../../navigations-map/Base';

const STATUS_COLOR: Record<SOStatus, string> = {
  open: Colors.info,
  partially_fulfilled: Colors.warning,
  fulfilled: Colors.success,
  closed: Colors.textTertiary,
};
const STATUS_BG: Record<SOStatus, string> = {
  open: Colors.infoLight,
  partially_fulfilled: Colors.warningLight,
  fulfilled: Colors.successLight,
  closed: Colors.background,
};
const STATUS_LABEL: Record<SOStatus, string> = {
  open: 'Open',
  partially_fulfilled: 'Partially Fulfilled',
  fulfilled: 'Fulfilled',
  closed: 'Closed',
};

const fmt = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ─── Main ───────────────────────────────────────────────────

const SODetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const salesOrderId: string = route.params?.salesOrderId;
  const [so, setSO] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSalesOrderByIdAPI(salesOrderId)
      .then(setSO)
      .finally(() => setLoading(false));
  }, [salesOrderId]);

  // Fulfillment metrics
  const fulfillment = useMemo(() => {
    if (!so) return { totalOrdered: 0, totalFulfilled: 0, pct: 0 };
    const totalOrdered = so.lines.reduce((s, l) => s + l.quantityOrdered, 0);
    const totalFulfilled = so.lines.reduce((s, l) => s + l.quantityFulfilled, 0);
    return { totalOrdered, totalFulfilled, pct: totalOrdered > 0 ? Math.round((totalFulfilled / totalOrdered) * 100) : 0 };
  }, [so]);

  // ── Actions ────────────────────────────────────────────────
  const handleStatusChange = useCallback(async (newStatus: SOStatus) => {
    if (!so) return;
    try {
      await updateSalesOrderAPI(so.salesOrderId, { ...so, status: newStatus });
      await dispatch(fetchSalesOrders());
      setSO({ ...so, status: newStatus });
      Alert.alert('Updated', `Sales Order marked as ${STATUS_LABEL[newStatus]}.`);
    } catch {
      Alert.alert('Error', 'Could not update status.');
    }
  }, [so, dispatch]);

  const handleCreateInvoice = useCallback(async () => {
    if (!so) return;
    const invoiceLines = so.lines.map((l: any) => ({
      lineId: `il_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      itemId: l.itemId ?? null,
      description: l.description,
      quantity: l.quantityOrdered,
      rate: l.rate,
      amount: l.amount,
      taxRate: l.taxRate,
    }));
    // Mark SO as fulfilled after creating invoice
    try {
      await updateSalesOrderAPI(so.salesOrderId, { ...so, status: 'fulfilled' });
      await dispatch(fetchSalesOrders());
      setSO({ ...so, status: 'fulfilled' });
    } catch {
      // best-effort status update
    }
    navigation.navigate(ROUTES.INVOICE_FORM, {
      fromSalesOrder: {
        customerId: so.customerId,
        lines: invoiceLines,
        discountAmount: so.discountAmount,
        discountType: so.discountType,
        notes: so.notes ?? '',
      },
    });
  }, [so, navigation, dispatch]);

  const handleEdit = useCallback(() => {
    if (!so) return;
    navigation.navigate(ROUTES.SO_FORM, { salesOrderId: so.salesOrderId });
  }, [so, navigation]);

  const handleDuplicate = useCallback(() => {
    if (!so) return;
    navigation.navigate(ROUTES.SO_FORM, { duplicateFromId: so.salesOrderId });
  }, [so, navigation]);

  // ── Render ─────────────────────────────────────────────────
  if (loading || !so) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading sales order…</Text>
      </View>
    );
  }

  const renderActions = () => {
    switch (so.status) {
      case 'open':
        return (
          <>
            <ActionBtn label="Edit" bg={Colors.info} onPress={handleEdit} />
            <ActionBtn label="Mark Fulfilled" bg={Colors.success} onPress={() => handleStatusChange('fulfilled')} />
            <ActionBtn label="Create Invoice" bg={Colors.primary} onPress={handleCreateInvoice} />
          </>
        );
      case 'partially_fulfilled':
        return (
          <>
            <ActionBtn label="Mark Fulfilled" bg={Colors.success} onPress={() => handleStatusChange('fulfilled')} />
            <ActionBtn label="Create Invoice" bg={Colors.primary} onPress={handleCreateInvoice} />
          </>
        );
      case 'fulfilled':
        return (
          <>
            <ActionBtn label="Create Invoice" bg={Colors.primary} onPress={handleCreateInvoice} />
            <ActionBtn label="Close" bg={Colors.textSecondary} onPress={() => handleStatusChange('closed')} />
          </>
        );
      case 'closed':
        return <ActionBtn label="Duplicate" bg={Colors.info} onPress={handleDuplicate} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Order</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title Card */}
        <View style={styles.titleCard}>
          <View style={styles.titleLeft}>
            <Text style={styles.companyName}>FinMatrix Inc.</Text>
            <Text style={styles.docLabel}>SALES ORDER</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[so.status] }]}>
            <Text style={[styles.statusBadgeText, { color: STATUS_COLOR[so.status] }]}>{STATUS_LABEL[so.status]}</Text>
          </View>
        </View>

        {/* Customer & Dates */}
        <View style={styles.card}>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.detailLabel}>SHIP TO</Text>
              <Text style={styles.detailValue}>{so.customerName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.detailLabel}>SO NUMBER</Text>
              <Text style={styles.detailValue}>{so.soNumber}</Text>
            </View>
          </View>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.detailLabel}>ORDER DATE</Text>
              <Text style={styles.detailValue}>{fmtDate(so.date)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.detailLabel}>EXPECTED</Text>
              <Text style={styles.detailValue}>{fmtDate(so.expectedDate)}</Text>
            </View>
          </View>
        </View>

        {/* Fulfillment Progress */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>FULFILLMENT PROGRESS</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${fulfillment.pct}%` as any, backgroundColor: STATUS_COLOR[so.status] }]} />
            </View>
            <Text style={styles.progressPct}>{fulfillment.pct}%</Text>
          </View>
          <Text style={styles.progressSub}>{fulfillment.totalFulfilled} of {fulfillment.totalOrdered} units fulfilled</Text>
        </View>

        {/* Line Items */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>LINE ITEMS</Text>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 3 }]}>Item</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Ord</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Ful</Text>
            <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>Amount</Text>
          </View>
          {so.lines.map((line, idx) => {
            const linePct = line.quantityOrdered > 0 ? Math.round((line.quantityFulfilled / line.quantityOrdered) * 100) : 0;
            return (
              <View key={line.lineId} style={styles.tableRow}>
                <View style={{ flex: 3 }}>
                  <Text style={styles.tdDesc}>{line.description}</Text>
                  <Text style={styles.tdDetail}>{line.rate.toFixed(2)} × {line.quantityOrdered} · Tax {line.taxRate}%</Text>
                  <View style={styles.lineFill}>
                    <View style={styles.lineFillTrack}>
                      <View style={[styles.lineFillBar, { width: `${linePct}%` as any }]} />
                    </View>
                  </View>
                </View>
                <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>{line.quantityOrdered}</Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>{line.quantityFulfilled}</Text>
                <Text style={[styles.td, { flex: 1.5, textAlign: 'right', fontWeight: '600' }]}>{fmt(line.amount)}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(so.subtotal)}</Text>
          </View>
          {so.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount {so.discountType === 'percentage' ? `(${so.discountAmount}%)` : ''}</Text>
              <Text style={[styles.totalValue, { color: Colors.danger }]}>−{fmt(so.discountType === 'percentage' ? (so.subtotal * so.discountAmount / 100) : so.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>{fmt(so.taxAmount)}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandLabel}>TOTAL</Text>
            <Text style={styles.grandValue}>{fmt(so.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {so.notes ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>NOTES</Text>
            <Text style={styles.notesText}>{so.notes}</Text>
          </View>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        {renderActions()}
      </View>
    </View>
  );
};

// ── Action button ────────────────────────────────────────────
const ActionBtn: React.FC<{ label: string; bg: string; onPress: () => void }> = ({ label, bg, onPress }) => (
  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: bg }]} activeOpacity={0.8} onPress={onPress}>
    <Text style={styles.actionBtnText}>{label}</Text>
  </TouchableOpacity>
);

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.base },
  titleCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base, ...Shadows.sm },
  titleLeft: {},
  companyName: { fontSize: 16, fontWeight: '800', color: Colors.primary, marginBottom: 2 },
  docLabel: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 2 },
  statusBadge: { paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: BorderRadius.full },
  statusBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.base, marginBottom: Spacing.base, ...Shadows.sm },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 1, marginBottom: Spacing.md },
  twoCol: { flexDirection: 'row', marginBottom: Spacing.md },
  col: { flex: 1 },
  detailLabel: { fontSize: 9, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 0.8, marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  // Progress
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  progressTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.borderLight, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressPct: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, width: 40, textAlign: 'right' },
  progressSub: { fontSize: 12, color: Colors.textSecondary },
  // Line items table
  tableHeader: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  th: { fontSize: 9, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, alignItems: 'center' },
  tdDesc: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  tdDetail: { fontSize: 11, color: Colors.textTertiary, marginTop: 1, marginBottom: 4 },
  td: { fontSize: 13, color: Colors.textPrimary },
  lineFill: { flexDirection: 'row', alignItems: 'center' },
  lineFillTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Colors.borderLight, overflow: 'hidden' },
  lineFillBar: { height: 3, borderRadius: 2, backgroundColor: Colors.success },
  // Totals
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 13, color: Colors.textSecondary },
  totalValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  totalDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  grandLabel: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  grandValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  notesText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  // Action bar
  actionBar: {
    flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 30 : Spacing.md,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.md,
  },
  actionBtn: { flex: 1, height: 42, borderRadius: BorderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },
});

export default SODetailScreen;
