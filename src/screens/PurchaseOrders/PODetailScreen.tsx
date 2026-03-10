// ============================================================
// FINMATRIX - Purchase Order Detail Screen
// ============================================================
// Preview layout with per-line receiving progress,
// context-sensitive action bar per PO status.

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
import { PurchaseOrder, POStatus } from '../../dummy-data/purchaseOrders';
import StatusTimeline from '../../Custom-Components/StatusTimeline';
import {
  getPurchaseOrderByIdAPI,
  updatePurchaseOrderAPI,
} from '../../network/poNetwork';
import { fetchPurchaseOrders } from './poSlice';
import { ROUTES } from '../../navigations-map/Base';

/* ── PO status → timeline step mapping ───────────────────── */
const PO_TIMELINE_STEPS = [
  { label: 'Draft' },
  { label: 'Sent' },
  { label: 'Partial' },
  { label: 'Received' },
  { label: 'Closed' },
];

const PO_STATUS_TO_STEP: Record<POStatus, number> = {
  draft: 0,
  sent: 1,
  partially_received: 2,
  fully_received: 3,
  closed: 4,
};

/* ── Status styling maps ─────────────────────────────────── */
const STATUS_COLOR: Record<POStatus, string> = {
  draft: Colors.textSecondary,
  sent: Colors.info,
  partially_received: Colors.warning,
  fully_received: Colors.success,
  closed: Colors.textTertiary,
};

const STATUS_BG: Record<POStatus, string> = {
  draft: Colors.background,
  sent: Colors.infoLight,
  partially_received: Colors.warningLight,
  fully_received: Colors.successLight,
  closed: Colors.background,
};

const STATUS_LABEL: Record<POStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  partially_received: 'Partially Received',
  fully_received: 'Fully Received',
  closed: 'Closed',
};

const fmt = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

/* ================================================================
   COMPONENT
   ================================================================ */
const PODetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const poId: string = route.params?.poId;
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── load data ───────────────────────────────────────── */
  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getPurchaseOrderByIdAPI(poId);
    if (data) setPO(data);
    setLoading(false);
  }, [poId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload when coming back from ReceiveItemsScreen
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadData();
    });
    return unsub;
  }, [navigation, loadData]);

  /* ── receiving metrics ───────────────────────────────── */
  const receiving = useMemo(() => {
    if (!po) return { totalOrdered: 0, totalReceived: 0, pct: 0 };
    const totalOrdered = po.lines.reduce((s, l) => s + l.quantity, 0);
    const totalReceived = po.lines.reduce(
      (s, l) => s + l.receivedQuantity,
      0,
    );
    return {
      totalOrdered,
      totalReceived,
      pct: totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0,
    };
  }, [po]);

  /* ── actions ─────────────────────────────────────────── */
  const handleEdit = useCallback(() => {
    if (!po) return;
    navigation.navigate(ROUTES.PO_FORM, { poId: po.poId });
  }, [po, navigation]);

  const handleSend = useCallback(async () => {
    if (!po) return;
    try {
      const updated = { ...po, status: 'sent' as POStatus };
      await updatePurchaseOrderAPI(updated);
      await dispatch(fetchPurchaseOrders());
      setPO(updated);
      Alert.alert('Sent', 'Purchase order has been sent to the vendor.');
    } catch {
      Alert.alert('Error', 'Could not update status.');
    }
  }, [po, dispatch]);

  const handleReceiveItems = useCallback(() => {
    if (!po) return;
    navigation.navigate(ROUTES.RECEIVE_ITEMS, { poId: po.poId });
  }, [po, navigation]);

  const handleConvertToBill = useCallback(() => {
    if (!po) return;
    const billLines = po.lines.map((l: any) => ({
      lineId: `bl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      accountId: '',
      accountName: '',
      description: `${l.itemName}${l.description ? ' — ' + l.description : ''}`,
      amount: l.amount,
      taxRate: l.taxRate,
    }));
    navigation.navigate(ROUTES.BILL_FORM, {
      fromPO: {
        vendorId: po.vendorId,
        lines: billLines,
        notes: po.notes ?? '',
      },
    });
  }, [po, navigation]);

  const handleClose = useCallback(async () => {
    if (!po) return;
    Alert.alert('Close PO', `Close ${po.poNumber}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close',
        style: 'destructive',
        onPress: async () => {
          try {
            const updated = { ...po, status: 'closed' as POStatus };
            await updatePurchaseOrderAPI(updated);
            await dispatch(fetchPurchaseOrders());
            setPO(updated);
            Alert.alert('Closed', 'Purchase order has been closed.');
          } catch {
            Alert.alert('Error', 'Could not close PO.');
          }
        },
      },
    ]);
  }, [po, dispatch]);

  /* ── render actions bar ──────────────────────────────── */
  const renderActions = () => {
    if (!po) return null;
    switch (po.status) {
      case 'draft':
        return (
          <>
            <ActionBtn label="Edit" bg={Colors.info} onPress={handleEdit} />
            <ActionBtn label="Send" bg={Colors.primary} onPress={handleSend} />
          </>
        );
      case 'sent':
        return (
          <>
            <ActionBtn label="Receive Items" bg={Colors.warning} onPress={handleReceiveItems} />
            <ActionBtn label="Convert to Bill" bg={Colors.primary} onPress={handleConvertToBill} />
          </>
        );
      case 'partially_received':
        return (
          <>
            <ActionBtn label="Receive Items" bg={Colors.warning} onPress={handleReceiveItems} />
            <ActionBtn label="Convert to Bill" bg={Colors.primary} onPress={handleConvertToBill} />
            <ActionBtn label="Close" bg={Colors.textSecondary} onPress={handleClose} />
          </>
        );
      case 'fully_received':
        return (
          <>
            <ActionBtn label="Convert to Bill" bg={Colors.primary} onPress={handleConvertToBill} />
            <ActionBtn label="Close" bg={Colors.textSecondary} onPress={handleClose} />
          </>
        );
      case 'closed':
        return null;
      default:
        return null;
    }
  };

  /* ── loading ─────────────────────────────────────────── */
  if (loading || !po) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading purchase order…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase Order</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title Card */}
        <View style={styles.titleCard}>
          <View style={styles.titleLeft}>
            <Text style={styles.companyName}>FinMatrix Inc.</Text>
            <Text style={styles.docLabel}>PURCHASE ORDER</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: STATUS_BG[po.status] },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: STATUS_COLOR[po.status] },
              ]}
            >
              {STATUS_LABEL[po.status]}
            </Text>
          </View>
        </View>

        {/* Vendor & Dates */}
        <View style={styles.card}>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.detailLabel}>VENDOR</Text>
              <Text style={styles.detailValue}>{po.vendorName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.detailLabel}>PO NUMBER</Text>
              <Text style={styles.detailValue}>{po.poNumber}</Text>
            </View>
          </View>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.detailLabel}>ORDER DATE</Text>
              <Text style={styles.detailValue}>{fmtDate(po.date)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.detailLabel}>EXPECTED</Text>
              <Text style={styles.detailValue}>{fmtDate(po.expectedDate)}</Text>
            </View>
          </View>
        </View>

        {/* Status Timeline */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ORDER STATUS</Text>
          <StatusTimeline
            steps={PO_TIMELINE_STEPS}
            current={PO_STATUS_TO_STEP[po.status]}
          />
        </View>

        {/* Receiving Progress */}
        {po.status !== 'draft' && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>RECEIVING PROGRESS</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${receiving.pct}%` as any,
                      backgroundColor: STATUS_COLOR[po.status],
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressPct}>{receiving.pct}%</Text>
            </View>
            <Text style={styles.progressSub}>
              {receiving.totalReceived} of {receiving.totalOrdered} units
              received
            </Text>
          </View>
        )}

        {/* Line Items */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>LINE ITEMS</Text>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 3 }]}>Item</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Ord</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Rcv</Text>
            <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>
              Amount
            </Text>
          </View>
          {po.lines.map((line) => {
            const linePct =
              line.quantity > 0
                ? Math.round((line.receivedQuantity / line.quantity) * 100)
                : 0;
            return (
              <View key={line.lineId} style={styles.tableRow}>
                <View style={{ flex: 3 }}>
                  <Text style={styles.tdDesc}>{line.itemName}</Text>
                  <Text style={styles.tdDetail}>
                    {line.unitCost.toFixed(2)} × {line.quantity} · Tax{' '}
                    {line.taxRate}%
                  </Text>
                  {po.status !== 'draft' && (
                    <View style={styles.lineFill}>
                      <View style={styles.lineFillTrack}>
                        <View
                          style={[
                            styles.lineFillBar,
                            { width: `${linePct}%` as any },
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </View>
                <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>
                  {line.quantity}
                </Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>
                  {line.receivedQuantity}
                </Text>
                <Text
                  style={[
                    styles.td,
                    { flex: 1.5, textAlign: 'right', fontWeight: '600' },
                  ]}
                >
                  {fmt(line.amount)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(po.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>{fmt(po.taxAmount)}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandLabel}>TOTAL</Text>
            <Text style={styles.grandValue}>{fmt(po.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {po.notes ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>NOTES</Text>
            <Text style={styles.notesText}>{po.notes}</Text>
          </View>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action bar */}
      {po.status !== 'closed' && (
        <View style={styles.actionBar}>{renderActions()}</View>
      )}
    </View>
  );
};

/* ── Action button ────────────────────────────────────────── */
const ActionBtn: React.FC<{
  label: string;
  bg: string;
  onPress: () => void;
}> = ({ label, bg, onPress }) => (
  <TouchableOpacity
    style={[styles.actionBtn, { backgroundColor: bg }]}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <Text style={styles.actionBtnText}>{label}</Text>
  </TouchableOpacity>
);

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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

  /* Title card */
  titleCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  titleLeft: {},
  companyName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 2,
  },
  docLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* Card */
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

  /* Two column layout */
  twoCol: { flexDirection: 'row', marginBottom: Spacing.md },
  col: { flex: 1 },
  detailLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  /* Progress */
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 4 },
  progressPct: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    width: 40,
    textAlign: 'right',
  },
  progressSub: { fontSize: 12, color: Colors.textSecondary },

  /* Line items table */
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  th: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    alignItems: 'center',
  },
  tdDesc: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  tdDetail: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
    marginBottom: 4,
  },
  td: { fontSize: 13, color: Colors.textPrimary },
  lineFill: { flexDirection: 'row', alignItems: 'center' },
  lineFillTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  lineFillBar: { height: 3, borderRadius: 2, backgroundColor: Colors.success },

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
  grandValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  notesText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

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
  actionBtn: {
    flex: 1,
    height: 42,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },
});

export default PODetailScreen;
