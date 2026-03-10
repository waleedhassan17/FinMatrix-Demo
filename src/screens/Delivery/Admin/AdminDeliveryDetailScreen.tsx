// ============================================================
// FINMATRIX - Admin Delivery Detail Screen
// ============================================================
// Route params: { deliveryId: string }
// Customer · Items · Delivery Person · Status Timeline ·
// Signature · Verification · Actions (re-assign, cancel, contact)

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import { assignDeliveries, updateDeliveryStatus } from '../../../store/deliverySlice';
import { DeliveryStatus } from '../../../dummy-data/deliveries';

// ─── Status config ──────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  unassigned: { label: 'Unassigned', color: Colors.textTertiary, bg: Colors.borderLight, icon: '📦' },
  pending:    { label: 'Pending',    color: Colors.warning,       bg: Colors.warningLight, icon: '⏳' },
  picked_up:  { label: 'Picked Up',  color: Colors.info,          bg: Colors.infoLight,    icon: '🤲' },
  in_transit:  { label: 'In Transit', color: Colors.secondary,     bg: Colors.infoLight,    icon: '🚚' },
  arrived:    { label: 'Arrived',    color: Colors.primaryLight,   bg: Colors.infoLight,    icon: '📍' },
  delivered:  { label: 'Delivered',  color: Colors.success,        bg: Colors.successLight, icon: '✅' },
  failed:     { label: 'Failed',     color: Colors.danger,         bg: Colors.dangerLight,  icon: '❌' },
  returned:   { label: 'Returned',   color: Colors.danger,         bg: Colors.dangerLight,  icon: '↩️' },
};

// ─── Timeline steps ─────────────────────────────────────────
const TIMELINE_ORDER: DeliveryStatus[] = [
  'unassigned', 'pending', 'picked_up', 'in_transit', 'arrived', 'delivered',
];

const STATUS_IDX: Record<string, number> = {};
TIMELINE_ORDER.forEach((s, i) => { STATUS_IDX[s] = i; });

// ─── Helpers ────────────────────────────────────────────────
const fmtDateTime = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const mon = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const yr  = d.getFullYear();
  const hr  = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${mon}/${day}/${yr}  ${hr}:${min}`;
};

// ─── Component ──────────────────────────────────────────────
const AdminDeliveryDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { deliveryId } = route.params as { deliveryId: string };
  const dispatch = useAppDispatch();

  const delivery = useAppSelector((s) =>
    s.delivery.deliveries.find((d) => d.deliveryId === deliveryId)
  );
  const personnel = useAppSelector((s) => s.delivery.deliveryPersonnel);

  const [showReassign, setShowReassign] = useState(false);

  if (!delivery) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>Delivery not found.</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
          <Text style={styles.backLinkText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sc = STATUS_META[delivery.status] || STATUS_META.pending;
  const currentIdx = STATUS_IDX[delivery.status] ?? -1;
  const isFinalState = ['delivered', 'failed', 'returned'].includes(delivery.status);

  // Total quantity
  const totalQty = delivery.items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0);

  // ── Actions ────────────────────────────────────────
  const handleReassign = (personId: string) => {
    const person = personnel.find((p) => p.userId === personId);
    if (!person) return;
    dispatch(assignDeliveries({
      deliveryIds: [delivery.deliveryId],
      deliveryPersonId: personId,
    }));
    setShowReassign(false);
    Alert.alert('Reassigned', `Delivery reassigned to ${person.displayName}`);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Delivery', 'Are you sure you want to cancel this delivery?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => {
          dispatch(updateDeliveryStatus({ deliveryId: delivery.deliveryId, status: 'returned' as DeliveryStatus }));
          navigation.goBack();
        },
      },
    ]);
  };

  const handleContact = () => {
    if (!delivery.deliveryPersonName) {
      Alert.alert('No Driver', 'This delivery has no assigned driver.');
      return;
    }
    const phone = delivery.customerPhone ?? '';
    Alert.alert(
      'Contact Driver',
      `Call ${delivery.deliveryPersonName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            const tel = `tel:${phone.replace(/[^\d+]/g, '')}`;
            Linking.openURL(tel).catch(() =>
              Alert.alert('Error', 'Unable to open phone dialer.'),
            );
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Detail</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Status banner ────────────────────────────── */}
        <View style={[styles.statusBanner, { backgroundColor: sc.bg }]}>
          <Text style={styles.statusIcon}>{sc.icon}</Text>
          <Text style={[styles.statusTitle, { color: sc.color }]}>{sc.label}</Text>
          <View style={[styles.priorityBadge, {
            backgroundColor: delivery.priority === 'urgent' ? Colors.dangerLight
              : delivery.priority === 'high' ? Colors.warningLight : Colors.borderLight,
          }]}>
            <Text style={[styles.priorityText, {
              color: delivery.priority === 'urgent' ? Colors.danger
                : delivery.priority === 'high' ? Colors.warning : Colors.textTertiary,
            }]}>
              {delivery.priority.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ── Customer Section ─────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤  Customer</Text>
          <Text style={styles.fieldLabel}>Name</Text>
          <Text style={styles.fieldValue}>{delivery.customerName}</Text>
          <Text style={styles.fieldLabel}>Address</Text>
          <Text style={styles.fieldValue}>
            {delivery.customerAddress.street}{'\n'}
            {delivery.customerAddress.city}, {delivery.customerAddress.state} {delivery.customerAddress.zipCode}
          </Text>
          <Text style={styles.fieldLabel}>Phone</Text>
          <Text style={styles.fieldValue}>{delivery.customerPhone}</Text>
          {delivery.notes ? (
            <>
              <Text style={styles.fieldLabel}>Notes</Text>
              <Text style={styles.fieldValue}>{delivery.notes}</Text>
            </>
          ) : null}
        </View>

        {/* ── Items Section ────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📦  Items ({delivery.items.length} · {totalQty} units)</Text>
          {delivery.items.map((item, idx) => (
            <View key={item.itemId + idx} style={styles.itemRow}>
              <View style={styles.itemQtyBadge}>
                <Text style={styles.itemQtyText}>×{item.quantity}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Delivery Person Section ──────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚗  Delivery Person</Text>
          {delivery.deliveryPersonName ? (
            <>
              <Text style={styles.fieldValue}>{delivery.deliveryPersonName}</Text>
              <Text style={styles.fieldSub}>ID: {delivery.deliveryPersonId}</Text>
              {delivery.assignmentId && (
                <Text style={styles.fieldSub}>Assignment: {delivery.assignmentId}</Text>
              )}
            </>
          ) : (
            <Text style={styles.noData}>No driver assigned</Text>
          )}
        </View>

        {/* ── Status Timeline ──────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋  Status Timeline</Text>
          {isFinalState && (delivery.status === 'failed' || delivery.status === 'returned') ? (
            <>
              {TIMELINE_ORDER.slice(0, Math.min(currentIdx + 1, TIMELINE_ORDER.length)).map((step, idx) => {
                const meta = STATUS_META[step];
                const reached = true;
                return (
                  <View key={step} style={styles.timelineStep}>
                    <View style={styles.timelineTrack}>
                      <View style={[styles.timelineDot, { backgroundColor: meta.color }]} />
                      {idx < Math.min(currentIdx, TIMELINE_ORDER.length - 1) && (
                        <View style={[styles.timelineLine, { backgroundColor: meta.color }]} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineLabel, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
                    </View>
                  </View>
                );
              })}
              {/* Show failed/returned as final */}
              <View style={styles.timelineStep}>
                <View style={styles.timelineTrack}>
                  <View style={[styles.timelineDot, { backgroundColor: sc.color }]} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineLabel, { color: sc.color }]}>{sc.icon} {sc.label}</Text>
                  <Text style={styles.timelineTime}>{fmtDateTime(delivery.createdAt)}</Text>
                </View>
              </View>
            </>
          ) : (
            TIMELINE_ORDER.map((step, idx) => {
              const meta = STATUS_META[step];
              const reached = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <View key={step} style={styles.timelineStep}>
                  <View style={styles.timelineTrack}>
                    <View
                      style={[
                        styles.timelineDot,
                        {
                          backgroundColor: reached ? meta.color : Colors.borderLight,
                          borderWidth: isCurrent ? 2 : 0,
                          borderColor: isCurrent ? Colors.primary : 'transparent',
                        },
                      ]}
                    />
                    {idx < TIMELINE_ORDER.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: reached && idx < currentIdx ? meta.color : Colors.borderLight },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        { color: reached ? meta.color : Colors.textDisabled },
                        isCurrent && { fontWeight: '700' },
                      ]}
                    >
                      {meta.icon}  {meta.label}
                    </Text>
                    {isCurrent && step === 'delivered' && delivery.deliveredAt && (
                      <Text style={styles.timelineTime}>{fmtDateTime(delivery.deliveredAt)}</Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* ── Signature Section ────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✍️  Signature</Text>
          {delivery.signatureUrl ? (
            <View style={styles.signaturePlaceholder}>
              <Text style={styles.signatureIcon}>✍️</Text>
              <Text style={styles.signatureText}>Signature captured</Text>
              <Text style={styles.fieldSub}>Signed at: {fmtDateTime(delivery.signedAt)}</Text>
            </View>
          ) : (
            <Text style={styles.noData}>No signature captured</Text>
          )}
        </View>

        {/* ── Customer Verification Section ────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔒  Customer Verification</Text>
          {delivery.customerVerified ? (
            <View style={[styles.verifyBadge, { backgroundColor: Colors.successLight }]}>
              <Text style={styles.verifyIcon}>✅</Text>
              <View>
                <Text style={[styles.verifyLabel, { color: Colors.success }]}>Verified</Text>
                <Text style={styles.fieldSub}>At: {fmtDateTime(delivery.customerVerifiedAt)}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.verifyBadge, { backgroundColor: Colors.warningLight }]}>
              <Text style={styles.verifyIcon}>⏳</Text>
              <Text style={[styles.verifyLabel, { color: Colors.warning }]}>Not Verified</Text>
            </View>
          )}
        </View>

        {/* ── Photo Proof ──────────────────────────────── */}
        {delivery.photoUrls.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📷  Photo Proof ({delivery.photoUrls.length})</Text>
            <View style={styles.photoGrid}>
              {delivery.photoUrls.map((url, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Text style={styles.photoThumbText}>📷</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Dates ────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅  Dates</Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Created</Text>
            <Text style={styles.dateValue}>{fmtDateTime(delivery.createdAt)}</Text>
          </View>
          {delivery.deliveredAt && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Delivered</Text>
              <Text style={styles.dateValue}>{fmtDateTime(delivery.deliveredAt)}</Text>
            </View>
          )}
        </View>

        {/* ── Actions ──────────────────────────────────── */}
        {!isFinalState && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚡  Actions</Text>

            {/* Re-assign */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
              onPress={() => setShowReassign(!showReassign)}
            >
              <Text style={styles.actionBtnText}>🔄  Re-assign Driver</Text>
            </TouchableOpacity>

            {showReassign && (
              <View style={styles.reassignList}>
                {personnel
                  .filter((p) => p.isAvailable && p.userId !== delivery.deliveryPersonId)
                  .map((p) => (
                    <TouchableOpacity
                      key={p.userId}
                      style={styles.reassignRow}
                      onPress={() => handleReassign(p.userId)}
                    >
                      <View style={[styles.dotSmall, { backgroundColor: Colors.success }]} />
                      <Text style={styles.reassignName}>{p.displayName}</Text>
                      <Text style={styles.reassignLoad}>{p.currentLoad}/{p.maxLoad}</Text>
                      <Text style={styles.reassignRating}>⭐ {p.rating}</Text>
                    </TouchableOpacity>
                  ))}
                {personnel.filter((p) => p.isAvailable && p.userId !== delivery.deliveryPersonId).length === 0 && (
                  <Text style={styles.noData}>No available personnel</Text>
                )}
              </View>
            )}

            {/* Contact */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.info }]}
              onPress={handleContact}
            >
              <Text style={styles.actionBtnText}>📞  Contact Driver</Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.danger }]}
              onPress={handleCancel}
            >
              <Text style={styles.actionBtnText}>🚫  Cancel Delivery</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  backBtn: { fontSize: 15, color: Colors.primary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: Spacing.base },

  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  statusIcon: { fontSize: 28, marginRight: Spacing.sm },
  statusTitle: { fontSize: 18, fontWeight: '700', flex: 1 },

  // Priority badge
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  priorityText: { fontSize: 11, fontWeight: '700' },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },

  // Fields
  fieldLabel: { fontSize: 11, fontWeight: '600', color: Colors.textTertiary, marginTop: Spacing.sm },
  fieldValue: { fontSize: 14, color: Colors.textPrimary, marginTop: 1 },
  fieldSub: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },

  // Items
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemQtyBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemQtyText: { fontSize: 12, fontWeight: '700', color: Colors.info },
  itemName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  itemDesc: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },

  // Timeline
  timelineStep: { flexDirection: 'row', minHeight: 44 },
  timelineTrack: { width: 24, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 2 },
  timelineLine: { width: 2, flex: 1, marginVertical: 2 },
  timelineContent: { flex: 1, marginLeft: Spacing.sm, paddingBottom: Spacing.sm },
  timelineLabel: { fontSize: 13, fontWeight: '600' },
  timelineTime: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },

  // Signature
  signaturePlaceholder: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.sm,
  },
  signatureIcon: { fontSize: 32, marginBottom: 4 },
  signatureText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },

  // Verification
  verifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  verifyIcon: { fontSize: 22 },
  verifyLabel: { fontSize: 14, fontWeight: '700' },

  // Photo grid
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoThumbText: { fontSize: 22 },

  // Dates
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dateLabel: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary },
  dateValue: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },

  // Actions
  actionBtn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  // Re-assign list
  reassignList: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  reassignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dotSmall: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  reassignName: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  reassignLoad: { fontSize: 11, color: Colors.textSecondary, marginRight: Spacing.sm },
  reassignRating: { fontSize: 11, color: Colors.warning },

  // Empty
  noData: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center', padding: Spacing.md },
  emptyText: { fontSize: 15, color: Colors.textTertiary },
  backLink: { marginTop: Spacing.md },
  backLinkText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
});

export default AdminDeliveryDetailScreen;
