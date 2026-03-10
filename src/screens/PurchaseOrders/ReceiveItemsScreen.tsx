// ============================================================
// FINMATRIX - Receive Items Screen
// ============================================================
// Batch-receive items against a Purchase Order.
// Shows Ordered / Previously Received / Receiving Now (editable) / Remaining.
// Two actions: "Receive" (updates PO) and "Receive & Create Bill" (updates PO + navigates to BillForm).

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { PurchaseOrder, POLine } from '../../dummy-data/purchaseOrders';
import { getPurchaseOrderByIdAPI } from '../../network/poNetwork';
import { receiveItems, fetchPurchaseOrders } from './poSlice';
import { ROUTES } from '../../navigations-map/Base';

/* ================================================================
   COMPONENT
   ================================================================ */
const ReceiveItemsScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const poId: string = route.params?.poId;

  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [receiveDate, setReceiveDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [referenceNumber, setReferenceNumber] = useState('');

  /* ── receiving quantities per line ───────────────────── */
  const [receivingQty, setReceivingQty] = useState<Record<string, number>>({});

  /* ── load PO ─────────────────────────────────────────── */
  useEffect(() => {
    setLoading(true);
    getPurchaseOrderByIdAPI(poId).then((data) => {
      if (data) {
        setPO(data);
        // Default: receive all remaining
        const defaults: Record<string, number> = {};
        for (const line of data.lines) {
          const remaining = line.quantity - line.receivedQuantity;
          defaults[line.lineId] = Math.max(remaining, 0);
        }
        setReceivingQty(defaults);
      }
      setLoading(false);
    });
  }, [poId]);

  /* ── update receiving quantity for a line ─────────────── */
  const updateReceivingQty = useCallback(
    (lineId: string, value: number, maxRemaining: number) => {
      const clamped = Math.max(0, Math.min(value, maxRemaining));
      setReceivingQty((prev) => ({ ...prev, [lineId]: clamped }));
    },
    [],
  );

  /* ── totals for summary ──────────────────────────────── */
  const summary = useMemo(() => {
    if (!po) return { totalReceiving: 0, totalRemaining: 0, anyToReceive: false };
    let totalReceiving = 0;
    let totalRemaining = 0;
    for (const line of po.lines) {
      const remaining = line.quantity - line.receivedQuantity;
      const receiving = receivingQty[line.lineId] ?? 0;
      totalReceiving += receiving;
      totalRemaining += remaining - receiving;
    }
    return {
      totalReceiving,
      totalRemaining,
      anyToReceive: totalReceiving > 0,
    };
  }, [po, receivingQty]);

  /* ── handle receive ──────────────────────────────────── */
  const handleReceive = useCallback(
    async (createBill = false) => {
      if (!po) return;
      if (!summary.anyToReceive) {
        Alert.alert('Nothing to Receive', 'Enter quantities to receive.');
        return;
      }

      const receivingLines = po.lines
        .filter((l) => (receivingQty[l.lineId] ?? 0) > 0)
        .map((l) => ({
          lineId: l.lineId,
          quantityReceiving: receivingQty[l.lineId],
        }));

      setSaving(true);
      try {
        await dispatch(
          receiveItems({ poId: po.poId, receivingLines }),
        ).unwrap();
        await dispatch(fetchPurchaseOrders());

        if (createBill) {
          const billLines = po.lines
            .filter((l) => (receivingQty[l.lineId] ?? 0) > 0)
            .map((l) => ({
              lineId: `bl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              accountId: '',
              accountName: '',
              description: `${l.itemName} (${receivingQty[l.lineId]} received)`,
              amount: Math.round(receivingQty[l.lineId] * l.unitCost * 100) / 100,
              taxRate: l.taxRate,
            }));
          Alert.alert(
            'Items Received',
            'Items received successfully. Creating bill...',
          );
          navigation.replace(ROUTES.BILL_FORM, {
            fromPO: {
              vendorId: po.vendorId,
              lines: billLines,
              notes: po.notes ?? '',
            },
          });
        } else {
          Alert.alert('Items Received', 'Items received successfully.');
          navigation.goBack();
        }
      } catch {
        Alert.alert('Error', 'Failed to receive items.');
      } finally {
        setSaving(false);
      }
    },
    [po, receivingQty, summary.anyToReceive, dispatch, navigation],
  );

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
        <Text style={styles.headerTitle}>Receive Items</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PO Info */}
        <View style={styles.card}>
          <View style={styles.poInfoRow}>
            <View>
              <Text style={styles.poNumber}>{po.poNumber}</Text>
              <Text style={styles.vendorName}>{po.vendorName}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{po.status.replace(/_/g, ' ')}</Text>
            </View>
          </View>
        </View>

        {/* Receive Date & Reference */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>RECEIVING DETAILS</Text>
          <Text style={styles.fieldLabel}>Receive Date</Text>
          <TextInput
            style={styles.input}
            value={receiveDate}
            onChangeText={setReceiveDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.placeholder}
          />
          <Text style={styles.fieldLabel}>Reference Number (optional)</Text>
          <TextInput
            style={styles.input}
            value={referenceNumber}
            onChangeText={setReferenceNumber}
            placeholder="e.g., Delivery Note #"
            placeholderTextColor={Colors.placeholder}
          />
        </View>

        {/* Line Items */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>LINE ITEMS</Text>

          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2.5 }]}>Item</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Ord</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Prev</Text>
            <Text style={[styles.th, { flex: 1.2, textAlign: 'center' }]}>Now</Text>
            <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Left</Text>
          </View>

          {po.lines.map((line) => {
            const remaining = line.quantity - line.receivedQuantity;
            const receiving = receivingQty[line.lineId] ?? 0;
            const afterReceive = remaining - receiving;
            const isFullyReceived = remaining === 0;

            return (
              <View
                key={line.lineId}
                style={[
                  styles.tableRow,
                  isFullyReceived && styles.tableRowDone,
                ]}
              >
                <View style={{ flex: 2.5 }}>
                  <Text
                    style={[
                      styles.tdItem,
                      isFullyReceived && styles.tdItemDone,
                    ]}
                  >
                    {line.itemName}
                  </Text>
                  <Text style={styles.tdDetail}>
                    {line.unitCost.toFixed(2)} ea
                  </Text>
                </View>
                <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>
                  {line.quantity}
                </Text>
                <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>
                  {line.receivedQuantity}
                </Text>
                <View style={{ flex: 1.2, alignItems: 'center' }}>
                  {isFullyReceived ? (
                    <Text style={[styles.td, styles.doneText]}>✓</Text>
                  ) : (
                    <TextInput
                      style={styles.qtyInput}
                      value={String(receiving)}
                      onChangeText={(t) =>
                        updateReceivingQty(
                          line.lineId,
                          parseInt(t) || 0,
                          remaining,
                        )
                      }
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.td,
                    { flex: 1, textAlign: 'center' },
                    afterReceive === 0 && styles.doneText,
                  ]}
                >
                  {isFullyReceived ? '0' : String(afterReceive)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Receiving Now</Text>
            <Text style={[styles.summaryValue, { color: Colors.primary }]}>
              {summary.totalReceiving} units
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining After</Text>
            <Text
              style={[
                styles.summaryValue,
                {
                  color:
                    summary.totalRemaining === 0
                      ? Colors.success
                      : Colors.warning,
                },
              ]}
            >
              {summary.totalRemaining} units
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.success }]}
          onPress={() => handleReceive(false)}
          disabled={saving || !summary.anyToReceive}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>
            {saving ? '...' : 'Receive'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
          onPress={() => handleReceive(true)}
          disabled={saving || !summary.anyToReceive}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>
            {saving ? '...' : 'Receive & Create Bill'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

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

  /* Cards */
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

  /* PO info */
  poInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poNumber: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  vendorName: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.warning,
    textTransform: 'uppercase',
  },

  /* Table */
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
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
  tableRowDone: { opacity: 0.5 },
  tdItem: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  tdItemDone: { textDecorationLine: 'line-through' },
  tdDetail: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  td: { fontSize: 13, color: Colors.textPrimary },
  doneText: { color: Colors.success, fontWeight: '700' },

  /* Quantity input */
  qtyInput: {
    width: 48,
    height: 32,
    backgroundColor: Colors.primaryLight || '#E8F0FE',
    borderRadius: BorderRadius.sm,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },

  /* Summary */
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: { fontSize: 14, color: Colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '700' },

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
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },
});

export default ReceiveItemsScreen;
