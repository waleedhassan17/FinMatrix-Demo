// ============================================================
// FINMATRIX - Delivery Detail Screen  (Driver-facing)
// ============================================================
// Customer info · Items table · Status progress dots ·
// Action button that changes per delivery status

import React, { useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import {
  updateDeliveryStatus,
  setActiveDelivery,
} from '../../../store/deliverySlice';
import { DeliveryStatus } from '../../../dummy-data/deliveries';
import { ROUTES } from '../../../navigations-map/Base';
import DeliveryMapView, { estimateETA } from '../../../components/DeliveryMapView';

// ─── Theme ──────────────────────────────────────────────────
const DP_GREEN = '#27AE60';
const DP_GREEN_LIGHT = '#E8F8EF';

// ─── Status progression steps ───────────────────────────────
const STATUS_STEPS: { key: DeliveryStatus; label: string }[] = [
  { key: 'pending',   label: 'Pending' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'arrived',   label: 'Arrived' },
  { key: 'delivered', label: 'Delivered' },
];

const statusIndex = (s: DeliveryStatus) =>
  STATUS_STEPS.findIndex((st) => st.key === s);

// ─── Action config per status ───────────────────────────────
const ACTION_CFG: Record<string, { label: string; icon: string; nextStatus: DeliveryStatus | null }> = {
  pending:   { label: 'Pick Up Items',     icon: '📦', nextStatus: 'picked_up' },
  picked_up: { label: 'Start Delivery',    icon: '🚚', nextStatus: 'in_transit' },
  in_transit:{ label: 'Arrived',           icon: '📍', nextStatus: 'arrived' },
  arrived:   { label: 'Confirm Items', icon: '📋', nextStatus: null }, // navigate → item confirm
};

const PRIORITY_CFG: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: 'URGENT', color: Colors.danger, bg: Colors.dangerLight },
  high:   { label: 'HIGH',   color: Colors.warning, bg: Colors.warningLight },
  normal: { label: 'NORMAL', color: Colors.textTertiary, bg: Colors.borderLight },
};

// ─── Component ──────────────────────────────────────────────
const DPDeliveryDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { activeDelivery, isUpdating } = useAppSelector((s) => s.delivery);
  const myDeliveries = useAppSelector((s) => s.delivery.deliveries);
  const deliveryId: string = route.params?.deliveryId;

  // Make sure we have activeDelivery set
  useEffect(() => {
    if (!activeDelivery || activeDelivery.deliveryId !== deliveryId) {
      const found = myDeliveries.find((d) => d.deliveryId === deliveryId);
      if (found) dispatch(setActiveDelivery(found));
    }
  }, [deliveryId, activeDelivery, myDeliveries, dispatch]);

  const delivery = activeDelivery;

  // ── Open maps ─────────────────────────────────────
  const openMaps = useCallback(() => {
    if (!delivery) return;
    const addr = delivery.customerAddress;
    const q = encodeURIComponent(
      `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`,
    );
    const url = Platform.OS === 'ios'
      ? `maps:0,0?q=${q}`
      : `geo:0,0?q=${q}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://maps.google.com/?q=${q}`),
    );
  }, [delivery]);

  // ── Call phone ────────────────────────────────────
  const callPhone = useCallback(() => {
    if (!delivery) return;
    Linking.openURL(`tel:${delivery.customerPhone}`);
  }, [delivery]);

  // ── Action button press ───────────────────────────
  const handleAction = useCallback(() => {
    if (!delivery) return;
    const cfg = ACTION_CFG[delivery.status];
    if (!cfg) return;

    // arrived -> navigate to per-item confirmation flow
    if (delivery.status === 'arrived') {
      navigation.navigate(ROUTES.DELIVERY_ITEM_CONFIRM, { deliveryId: delivery.deliveryId });
      return;
    }

    // Otherwise advance status
    if (cfg.nextStatus) {
      dispatch(
        updateDeliveryStatus({
          deliveryId: delivery.deliveryId,
          status: cfg.nextStatus,
        }),
      );
    }
  }, [delivery, dispatch, navigation]);

  if (!delivery) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DP_GREEN} />
      </View>
    );
  }

  const currentIdx = statusIndex(delivery.status);
  const actionCfg = ACTION_CFG[delivery.status];
  const isCompleted = delivery.status === 'delivered';
  const prioCfg = PRIORITY_CFG[delivery.priority] || PRIORITY_CFG.normal;
  const totalQty = delivery.items.reduce((s, i) => s + i.quantity, 0);
  const showMap = delivery.status === 'in_transit' || delivery.status === 'arrived';
  const etaMinutes = useMemo(
    () => estimateETA(delivery.originCoords, delivery.destinationCoords),
    [delivery.originCoords, delivery.destinationCoords],
  );

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Details</Text>
        <View style={[styles.prioBadge, { backgroundColor: prioCfg.bg }]}>
          <Text style={[styles.prioText, { color: prioCfg.color }]}>{prioCfg.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Status Progress Dots ─────────────────────── */}
        <View style={styles.progressContainer}>
          {STATUS_STEPS.map((step, i) => {
            const done = i <= currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <View key={step.key} style={styles.progressStep}>
                <View style={styles.dotRow}>
                  {i > 0 && (
                    <View
                      style={[
                        styles.dotLine,
                        { backgroundColor: done ? DP_GREEN : Colors.border },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.dot,
                      done && styles.dotDone,
                      isCurrent && styles.dotCurrent,
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.dotLabel,
                    done && styles.dotLabelDone,
                    isCurrent && styles.dotLabelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── Map View (in_transit / arrived only) ──────── */}
        {showMap && (
          <View style={styles.mapSection}>
            <DeliveryMapView
              origin={{
                latitude: delivery.originCoords.latitude,
                longitude: delivery.originCoords.longitude,
                label: 'Warehouse (NYC)',
              }}
              destination={{
                latitude: delivery.destinationCoords.latitude,
                longitude: delivery.destinationCoords.longitude,
                label: `${delivery.customerAddress.street}, ${delivery.customerAddress.city}`,
              }}
              height={180}
            />
            <View style={styles.etaRow}>
              <Text style={styles.etaText}>
                📍  Estimated arrival: ~{etaMinutes} min
              </Text>
            </View>
          </View>
        )}

        {/* ── Customer Info ─────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CUSTOMER</Text>
          <Text style={styles.customerName}>{delivery.customerName}</Text>

          {/* Address + navigate */}
          <TouchableOpacity style={styles.addressRow} onPress={openMaps} activeOpacity={0.7}>
            <Text style={styles.addressText}>
              📍 {delivery.customerAddress.street}, {delivery.customerAddress.city},{' '}
              {delivery.customerAddress.state} {delivery.customerAddress.zipCode}
            </Text>
            <View style={styles.navigateBtn}>
              <Text style={styles.navigateBtnText}>🧭 Navigate</Text>
            </View>
          </TouchableOpacity>

          {/* Phone */}
          <TouchableOpacity onPress={callPhone} activeOpacity={0.7}>
            <Text style={styles.phone}>📞 {delivery.customerPhone}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Items Table ──────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>ITEMS</Text>
            <Text style={styles.itemsSummary}>
              {delivery.items.length} item{delivery.items.length !== 1 ? 's' : ''} · {totalQty} units
            </Text>
          </View>

          <View style={styles.table}>
            {/* Header row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellName, styles.tableHeader]}>Name</Text>
              <Text style={[styles.tableCell, styles.tableCellQty, styles.tableHeader]}>Qty</Text>
              <Text style={[styles.tableCell, styles.tableCellDesc, styles.tableHeader]}>Description</Text>
            </View>

            {delivery.items.map((item, idx) => (
              <View
                key={item.itemId + idx}
                style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}
              >
                <Text style={[styles.tableCell, styles.tableCellName]} numberOfLines={2}>
                  {item.itemName}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellQty, styles.qtyText]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellDesc]} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Notes ────────────────────────────────────── */}
        {delivery.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTES</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{delivery.notes}</Text>
            </View>
          </View>
        ) : null}

        {/* ── Delivery ID & meta ─────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DELIVERY INFO</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Delivery ID</Text>
            <Text style={styles.metaValue}>{delivery.deliveryId}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Created</Text>
            <Text style={styles.metaValue}>
              {new Date(delivery.createdAt).toLocaleDateString()}
            </Text>
          </View>
          {delivery.deliveredAt ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Delivered</Text>
              <Text style={styles.metaValue}>
                {new Date(delivery.deliveredAt).toLocaleString()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Action Button ──────────────────────────────── */}
      {actionCfg && !isCompleted && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, isUpdating && styles.actionBtnDisabled]}
            activeOpacity={0.8}
            onPress={handleAction}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.actionBtnText}>
                {actionCfg.icon}  {actionCfg.label}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isCompleted && (
        <View style={styles.actionBar}>
          <View style={styles.completedBanner}>
            <Text style={styles.completedBannerText}>✅  Delivery Completed</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    backgroundColor: DP_GREEN,
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginRight: Spacing.md },
  backText: { fontSize: 15, fontWeight: '600', color: Colors.white },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.white },
  prioBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.xs },
  prioText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  scroll: { padding: Spacing.base },

  // Progress dots
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  progressStep: { flex: 1, alignItems: 'center' },
  dotRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  dotLine: { flex: 1, height: 2, marginRight: -2 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.border,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  dotDone: { backgroundColor: DP_GREEN, borderColor: DP_GREEN },
  dotCurrent: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: DP_GREEN,
    backgroundColor: Colors.white,
  },
  dotLabel: { fontSize: 9, color: Colors.textTertiary, marginTop: 4, textAlign: 'center' },
  dotLabelDone: { color: DP_GREEN, fontWeight: '600' },
  dotLabelCurrent: { color: DP_GREEN, fontWeight: '700' },

  // Section
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  addressText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  navigateBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginLeft: Spacing.sm,
  },
  navigateBtnText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  phone: { fontSize: 14, color: Colors.info, fontWeight: '600' },

  // Map section
  mapSection: {
    marginBottom: Spacing.md,
  },
  etaRow: {
    backgroundColor: DP_GREEN_LIGHT,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DP_GREEN,
  },
  etaText: { fontSize: 13, fontWeight: '700', color: DP_GREEN },

  // Items table
  itemsSummary: { fontSize: 12, color: Colors.textTertiary },
  table: { borderRadius: BorderRadius.sm, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  tableRowAlt: { backgroundColor: Colors.borderLight },
  tableHeader: { fontWeight: '700', color: Colors.textPrimary, fontSize: 11 },
  tableCell: { fontSize: 12, color: Colors.textSecondary },
  tableCellName: { flex: 3 },
  tableCellQty: { flex: 1, textAlign: 'center' },
  tableCellDesc: { flex: 3 },
  qtyText: { fontWeight: '700', color: Colors.textPrimary },

  // Notes
  notesBox: {
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  notesText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

  // Meta
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  metaLabel: { fontSize: 13, color: Colors.textTertiary },
  metaValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },

  // Action bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.base,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    backgroundColor: DP_GREEN,
    borderRadius: BorderRadius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  completedBanner: {
    backgroundColor: DP_GREEN_LIGHT,
    borderRadius: BorderRadius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DP_GREEN,
  },
  completedBannerText: { fontSize: 16, fontWeight: '700', color: DP_GREEN },
});

export default DPDeliveryDetailScreen;
