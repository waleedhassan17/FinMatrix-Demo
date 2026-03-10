// ============================================================
// FINMATRIX - Approvals Tab  (Admin Delivery)
// ============================================================
// Shadow → real inventory approval flow with audit trail logging.
// Sections: Pending (default expanded) | Approved | Rejected
// Pending cards: avatar · delivery info · changes table (yellow
//   highlight on qty delta) · View Delivery Proof · APPROVE / REJECT
// Approve → confirmation modal listing real qty changes → dispatches
//   approveInventoryUpdate + applyDeliveryChanges + audit entry
// Reject → modal with required comment → dispatches reject + audit

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import {
  approveInventoryUpdate,
  rejectInventoryUpdate,
  setApprovalFilter,
  ApprovalFilterKey,
} from '../../../store/deliverySlice';
import { applyDeliveryChanges } from '../../Inventory/inventorySlice';
import { addAuditEntry } from '../../AuditTrail/auditTrailSlice';
import {
  InventoryUpdateRequest,
  InventoryChangeItem,
} from '../../../dummy-data/inventoryUpdateRequests';
import type { AuditEntry } from '../../../dummy-data/auditTrail';

// ─── Filter chips ───────────────────────────────────────────
const FILTERS: { key: ApprovalFilterKey; label: string }[] = [
  { key: 'pending',  label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all',      label: 'All' },
];

// ─── Helpers ────────────────────────────────────────────────
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const mon = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hr  = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${mon}/${day} ${hr}:${min}`;
};

const statusBadgeCfg: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pending',  color: Colors.warning, bg: Colors.warningLight },
  approved: { label: 'Approved', color: Colors.success, bg: Colors.successLight },
  rejected: { label: 'Rejected', color: Colors.danger,  bg: Colors.dangerLight },
};

const AVATAR_COLORS = [Colors.primary, Colors.secondary, Colors.info, Colors.success, Colors.warning];
const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
const getInitials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

const makeAuditId = () => `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ─── Changes Table ──────────────────────────────────────────
const ChangesTable: React.FC<{ changes: InventoryChangeItem[] }> = ({ changes }) => (
  <View style={styles.table}>
    <View style={[styles.tableRow, styles.tableHeaderRow]}>
      <Text style={[styles.tableHeader, { flex: 2 }]}>Item</Text>
      <Text style={[styles.tableHeader, styles.tableCell]}>Before</Text>
      <Text style={[styles.tableHeader, styles.tableCell]}>Dlvrd</Text>
      <Text style={[styles.tableHeader, styles.tableCell]}>Rtrnd</Text>
      <Text style={[styles.tableHeader, styles.tableCell]}>After</Text>
    </View>
    {changes.map((c: InventoryChangeItem) => {
      const changed = c.quantityBefore !== c.quantityAfter;
      return (
        <View key={c.itemId} style={[styles.tableRow, changed && styles.tableRowChanged]}>
          <Text style={[styles.tableData, { flex: 2 }]} numberOfLines={1}>{c.itemName}</Text>
          <Text style={[styles.tableData, styles.tableCell]}>{c.quantityBefore}</Text>
          <Text style={[styles.tableData, styles.tableCell, { color: Colors.success, fontWeight: '700' }]}>
            -{c.quantityDelivered}
          </Text>
          <Text style={[styles.tableData, styles.tableCell, c.quantityReturned > 0 && { color: Colors.warning, fontWeight: '700' }]}>
            +{c.quantityReturned}
          </Text>
          <Text style={[styles.tableData, styles.tableCell, changed && { color: Colors.primary, fontWeight: '700' }]}>
            {c.quantityAfter}
          </Text>
        </View>
      );
    })}
  </View>
);

// ─── Component ──────────────────────────────────────────────
const ApprovalsTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const requests = useAppSelector((s) => s.delivery.inventoryUpdateRequests);
  const deliveries = useAppSelector((s) => s.delivery.deliveries);
  const filter = useAppSelector((s) => s.delivery.approvalFilter);
  const isLoading = useAppSelector((s) => s.delivery.isLoading);
  const isProcessing = useAppSelector((s) => s.delivery.isProcessing);

  // Modals
  const [approveModalReq, setApproveModalReq] = useState<InventoryUpdateRequest | null>(null);
  const [rejectModalReq, setRejectModalReq]   = useState<InventoryUpdateRequest | null>(null);
  const [rejectNotes, setRejectNotes]           = useState('');
  const [proofModalReq, setProofModalReq]       = useState<InventoryUpdateRequest | null>(null);
  const [localProcessing, setLocalProcessing]   = useState(false);

  const onRefresh = useCallback(() => {}, []);

  // ── Filtered list ─────────────────────────────────
  const filteredRequests = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  // ── Counts ────────────────────────────────────────
  const counts = useMemo(() => {
    const map: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };
    requests.forEach((r) => { map[r.status] = (map[r.status] || 0) + 1; });
    return map;
  }, [requests]);

  // ── Delivery proof lookup ─────────────────────────
  const getDeliveryProof = useCallback(
    (deliveryId: string) => deliveries.find((d) => d.deliveryId === deliveryId),
    [deliveries],
  );

  // ── Approve handler ───────────────────────────────
  const handleApprove = useCallback(() => {
    if (!approveModalReq) return;
    setLocalProcessing(true);
    try {
      // 1. Mark request approved in delivery slice
      dispatch(approveInventoryUpdate({ requestId: approveModalReq.requestId }));

      // 2. Apply changes to real inventory
      dispatch(
        applyDeliveryChanges({
          changes: approveModalReq.changes.map((c: InventoryChangeItem) => ({
            itemId: c.itemId,
            quantityDelivered: c.quantityDelivered,
            quantityReturned: c.quantityReturned,
          })),
        }),
      );

      // 3. Audit trail entry
      const changesSummary = approveModalReq.changes
        .map((c: InventoryChangeItem) => `${c.itemName}: -${c.quantityDelivered}+${c.quantityReturned}`)
        .join(', ');
      const entry: AuditEntry = {
        id: makeAuditId(),
        userId: 'admin',
        userName: 'Admin',
        action: 'update',
        module: 'delivery',
        recordId: approveModalReq.requestId,
        description: `Approved inventory update for delivery ${approveModalReq.deliveryId} (${approveModalReq.customerName}). Changes: ${changesSummary}`,
        oldValue: JSON.stringify(approveModalReq.changes.map((c: InventoryChangeItem) => ({ item: c.itemName, qty: c.quantityBefore }))),
        newValue: JSON.stringify(approveModalReq.changes.map((c: InventoryChangeItem) => ({ item: c.itemName, qty: c.quantityAfter }))),
        timestamp: new Date().toISOString(),
      };
      dispatch(addAuditEntry(entry));

      setApproveModalReq(null);
      Alert.alert('Approved', 'Inventory has been updated with the delivered quantities.');
    } finally {
      setLocalProcessing(false);
    }
  }, [approveModalReq, dispatch]);

  // ── Reject handler ────────────────────────────────
  const handleReject = useCallback(() => {
    if (!rejectModalReq) return;
    if (!rejectNotes.trim()) {
      Alert.alert('Required', 'Please add a note explaining the rejection.');
      return;
    }
    dispatch(
      rejectInventoryUpdate({
        requestId: rejectModalReq.requestId,
        adminNotes: rejectNotes.trim(),
      }),
    );

    // Audit trail
    const entry: AuditEntry = {
      id: makeAuditId(),
      userId: 'admin',
      userName: 'Admin',
      action: 'update',
      module: 'delivery',
      recordId: rejectModalReq.requestId,
      description: `Rejected inventory update for delivery ${rejectModalReq.deliveryId} (${rejectModalReq.customerName}). Reason: ${rejectNotes.trim()}`,
      oldValue: null,
      newValue: null,
      timestamp: new Date().toISOString(),
    };
    dispatch(addAuditEntry(entry));

    setRejectModalReq(null);
    setRejectNotes('');
    Alert.alert('Rejected', 'Request has been rejected. The driver will be notified.');
  }, [rejectModalReq, rejectNotes, dispatch]);

  // ── Render request card ───────────────────────────
  const renderCard = ({ item: req }: { item: InventoryUpdateRequest }) => {
    const badge = statusBadgeCfg[req.status] || statusBadgeCfg.pending;
    const isPending = req.status === 'pending';
    const delivery = getDeliveryProof(req.deliveryId);

    return (
      <View style={[styles.card, isPending && styles.cardPending]}>
        {/* Colored left accent */}
        <View style={[styles.cardAccent, { backgroundColor: badge.color }]} />

        {/* Header row: avatar + info + badge */}
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={[styles.avatar, { backgroundColor: getAvatarColor(req.deliveryPersonName) }]}>
              <Text style={styles.avatarText}>{getInitials(req.deliveryPersonName)}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.personName}>{req.deliveryPersonName}</Text>
              <Text style={styles.cardSub}>
                {req.customerName}  ·  {req.deliveryId}
              </Text>
              <Text style={styles.cardDate}>{fmtDate(req.createdAt)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>

          {/* Changes table */}
          <ChangesTable changes={req.changes} />

          {/* Delivery proof button (pending cards) */}
          {isPending && delivery && (
            <TouchableOpacity
              style={styles.proofBtn}
              onPress={() => setProofModalReq(req)}
            >
              <Text style={styles.proofBtnText}>🔍  View Delivery Proof</Text>
            </TouchableOpacity>
          )}

          {/* Review details for approved/rejected */}
          {req.status !== 'pending' && (
            <View style={styles.reviewBox}>
              <Text style={styles.reviewLabel}>
                {req.status === 'approved' ? '✅ Approved' : '❌ Rejected'} by {req.reviewedBy}
              </Text>
              {req.reviewedAt && (
                <Text style={styles.reviewDate}>{fmtDate(req.reviewedAt)}</Text>
              )}
              {req.adminNotes && (
                <Text style={styles.reviewNotes}>"{req.adminNotes}"</Text>
              )}
              {/* Show applied changes for approved */}
              {req.status === 'approved' && (
                <View style={styles.appliedBanner}>
                  <Text style={styles.appliedText}>
                    ✅ Real inventory updated · {req.changes.length} item{req.changes.length !== 1 ? 's' : ''} adjusted
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action buttons (pending only) */}
          {isPending && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                onPress={() => setApproveModalReq(req)}
                disabled={isProcessing || localProcessing}
              >
                <Text style={styles.actionBtnText}>✅  APPROVE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.danger }]}
                onPress={() => { setRejectModalReq(req); setRejectNotes(''); }}
                disabled={isProcessing || localProcessing}
              >
                <Text style={styles.actionBtnText}>❌  REJECT</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ── Header (counts + filter chips) ────────────────
  const ListHeader = () => (
    <View>
      <View style={styles.countsRow}>
        <View style={[styles.countCard, { backgroundColor: Colors.warningLight }]}>
          <Text style={[styles.countValue, { color: Colors.warning }]}>{counts.pending || 0}</Text>
          <Text style={styles.countLabel}>Pending</Text>
        </View>
        <View style={[styles.countCard, { backgroundColor: Colors.successLight }]}>
          <Text style={[styles.countValue, { color: Colors.success }]}>{counts.approved || 0}</Text>
          <Text style={styles.countLabel}>Approved</Text>
        </View>
        <View style={[styles.countCard, { backgroundColor: Colors.dangerLight }]}>
          <Text style={[styles.countValue, { color: Colors.danger }]}>{counts.rejected || 0}</Text>
          <Text style={styles.countLabel}>Rejected</Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => dispatch(setApprovalFilter(f.key))}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}{f.key !== 'all' ? ` (${counts[f.key] || 0})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>
        📋 {filter === 'all' ? 'All' : FILTERS.find((f) => f.key === filter)?.label} Requests ({filteredRequests.length})
      </Text>
    </View>
  );

  // ── Delivery proof for the proof modal ────────────
  const proofDelivery = proofModalReq ? getDeliveryProof(proofModalReq.deliveryId) : null;

  return (
    <View style={{ flex: 1 }}>
      <FlatList<InventoryUpdateRequest>
        data={filteredRequests}
        keyExtractor={(item) => item.requestId}
        renderItem={renderCard}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyMini}>
            <Text style={styles.emptyMiniIcon}>
              {filter === 'pending' ? '✅' : filter === 'rejected' ? '🎉' : '📭'}
            </Text>
            <Text style={styles.emptyMiniText}>
              {filter === 'pending'
                ? 'No pending requests — all caught up!'
                : `No ${filter} requests`}
            </Text>
          </View>
        }
      />

      {/* ═══ APPROVE CONFIRMATION MODAL ═══════════════════ */}
      <Modal visible={!!approveModalReq} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>✅  Approve Inventory Update</Text>
            <Text style={styles.modalSub}>
              Approving will update <Text style={{ fontWeight: '700' }}>real inventory</Text> for{' '}
              <Text style={{ fontWeight: '700' }}>{approveModalReq?.customerName}</Text>:
            </Text>

            {approveModalReq && (
              <View style={styles.modalTable}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <Text style={[styles.tableHeader, { flex: 2 }]}>Item</Text>
                  <Text style={[styles.tableHeader, styles.tableCell]}>Before</Text>
                  <Text style={[styles.tableHeader, styles.tableCell]}>After</Text>
                  <Text style={[styles.tableHeader, styles.tableCell]}>Δ</Text>
                </View>
                {approveModalReq.changes.map((c: InventoryChangeItem) => {
                  const delta = c.quantityAfter - c.quantityBefore;
                  return (
                    <View key={c.itemId} style={styles.tableRow}>
                      <Text style={[styles.tableData, { flex: 2 }]} numberOfLines={1}>
                        {c.itemName}
                      </Text>
                      <Text style={[styles.tableData, styles.tableCell]}>{c.quantityBefore}</Text>
                      <Text style={[styles.tableData, styles.tableCell, { fontWeight: '700' }]}>
                        {c.quantityAfter}
                      </Text>
                      <Text style={[
                        styles.tableData,
                        styles.tableCell,
                        { fontWeight: '700', color: delta < 0 ? Colors.danger : Colors.success },
                      ]}>
                        {delta >= 0 ? `+${delta}` : `${delta}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.borderLight }]}
                onPress={() => setApproveModalReq(null)}
                disabled={localProcessing}
              >
                <Text style={[styles.modalBtnText, { color: Colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.success }]}
                onPress={handleApprove}
                disabled={localProcessing}
              >
                {localProcessing ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.modalBtnText}>Confirm Approve</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ REJECT MODAL ════════════════════════════════ */}
      <Modal visible={!!rejectModalReq} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>❌  Reject Inventory Update</Text>
            <Text style={styles.modalSub}>
              Rejecting request from{' '}
              <Text style={{ fontWeight: '700' }}>{rejectModalReq?.deliveryPersonName}</Text>{' '}
              for <Text style={{ fontWeight: '700' }}>{rejectModalReq?.customerName}</Text>.
            </Text>

            <Text style={styles.inputLabel}>Rejection Notes (required)</Text>
            <TextInput
              style={styles.textArea}
              value={rejectNotes}
              onChangeText={setRejectNotes}
              placeholder="Explain why this update is being rejected…"
              placeholderTextColor={Colors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.borderLight }]}
                onPress={() => { setRejectModalReq(null); setRejectNotes(''); }}
                disabled={isProcessing}
              >
                <Text style={[styles.modalBtnText, { color: Colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: Colors.danger }]}
                onPress={handleReject}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.modalBtnText}>Confirm Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ DELIVERY PROOF MODAL ════════════════════════ */}
      <Modal visible={!!proofModalReq} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.modal, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>📋  Delivery Proof</Text>

            {proofDelivery ? (
              <View>
                {/* Signature status */}
                <View style={styles.proofSection}>
                  <Text style={styles.proofSectionLabel}>Signature</Text>
                  {proofDelivery.signatureUrl ? (
                    <View style={styles.proofRow}>
                      <Text style={styles.proofIcon}>✅</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.proofText}>Signature captured</Text>
                        {proofDelivery.signedAt && (
                          <Text style={styles.proofMeta}>Signed: {fmtDate(proofDelivery.signedAt)}</Text>
                        )}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.proofRow}>
                      <Text style={styles.proofIcon}>⚠️</Text>
                      <Text style={styles.proofText}>No signature captured</Text>
                    </View>
                  )}
                </View>

                {/* Customer verification */}
                <View style={styles.proofSection}>
                  <Text style={styles.proofSectionLabel}>Customer Verification</Text>
                  <View style={styles.proofRow}>
                    <Text style={styles.proofIcon}>{proofDelivery.customerVerified ? '✅' : '❌'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.proofText}>
                        {proofDelivery.customerVerified ? 'Customer verified delivery' : 'Not verified by customer'}
                      </Text>
                      {proofDelivery.customerVerifiedAt && (
                        <Text style={styles.proofMeta}>Verified: {fmtDate(proofDelivery.customerVerifiedAt)}</Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Photos */}
                <View style={styles.proofSection}>
                  <Text style={styles.proofSectionLabel}>Photos</Text>
                  {proofDelivery.photoUrls && proofDelivery.photoUrls.length > 0 ? (
                    <Text style={styles.proofText}>{proofDelivery.photoUrls.length} photo(s) attached</Text>
                  ) : (
                    <Text style={[styles.proofText, { color: Colors.textTertiary }]}>No photos</Text>
                  )}
                </View>

                {/* Delivery info */}
                <View style={styles.proofSection}>
                  <Text style={styles.proofSectionLabel}>Delivery Details</Text>
                  <Text style={styles.proofText}>Status: {proofDelivery.status}</Text>
                  {proofDelivery.deliveredAt && (
                    <Text style={styles.proofMeta}>Delivered: {fmtDate(proofDelivery.deliveredAt)}</Text>
                  )}
                  {proofDelivery.notes ? (
                    <Text style={[styles.proofMeta, { marginTop: 4 }]}>Notes: {proofDelivery.notes}</Text>
                  ) : null}
                </View>
              </View>
            ) : (
              <Text style={styles.proofText}>Delivery record not found.</Text>
            )}

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: Colors.primary, marginTop: Spacing.md }]}
              onPress={() => setProofModalReq(null)}
            >
              <Text style={styles.modalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { padding: Spacing.base, paddingBottom: 40 },

  // Counts
  countsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  countCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  countValue: { fontSize: 22, fontWeight: '700' },
  countLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },

  // Chips
  chipRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  cardPending: { borderWidth: 1, borderColor: Colors.warning + '40' },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: Spacing.base },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  personName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  cardDate: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },

  // Status badge
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    marginLeft: Spacing.sm,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  // Table
  table: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  tableHeaderRow: { backgroundColor: Colors.background },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
  },
  tableRowChanged: { backgroundColor: '#FFFDE7' },
  tableHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
  },
  tableCell: { width: 48, textAlign: 'right' },
  tableData: { fontSize: 12, color: Colors.textPrimary },

  // Proof button
  proofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  proofBtnText: { fontSize: 13, fontWeight: '600', color: Colors.info },

  // Review box
  reviewBox: {
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reviewLabel: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  reviewDate: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  reviewNotes: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
  appliedBanner: {
    marginTop: Spacing.sm,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.xs,
  },
  appliedText: { fontSize: 11, fontWeight: '600', color: Colors.success },

  // Actions
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  modalSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 18 },
  modalTable: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  modalBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  modalBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  // Input
  inputLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 80,
    marginBottom: Spacing.md,
  },

  // Proof modal sections
  proofSection: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  proofSectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textTertiary, textTransform: 'uppercase', marginBottom: Spacing.xs },
  proofRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  proofIcon: { fontSize: 18 },
  proofText: { fontSize: 13, color: Colors.textPrimary },
  proofMeta: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },

  // Empty
  emptyMini: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyMiniIcon: { fontSize: 28, marginBottom: 4 },
  emptyMiniText: { fontSize: 13, color: Colors.textTertiary },
});

export default ApprovalsTab;
