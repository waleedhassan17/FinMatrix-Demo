// ============================================================
// FINMATRIX - Assign Work Screen (Admin)
// 3-panel: Select Deliveries → Select Personnel → Review
// ============================================================
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography, SAFE_TOP_PADDING } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import {
  assignDeliveries,
  autoAssignDeliveries,
} from '../../../store/deliverySlice';
import { Delivery, DeliveryPriority } from '../../../dummy-data/deliveries';
import { DeliveryPerson } from '../../../dummy-data/deliveryPersonnel';

// ── Helpers ─────────────────────────────────────────────────
const priorityColor: Record<DeliveryPriority, string> = {
  urgent: Colors.danger,
  high: Colors.warning,
  normal: Colors.textTertiary,
};

const priorityLabel: Record<DeliveryPriority, string> = {
  urgent: 'URGENT',
  high: 'HIGH',
  normal: 'NORMAL',
};

const loadPercent = (p: DeliveryPerson) =>
  p.maxLoad > 0 ? Math.round((p.currentLoad / p.maxLoad) * 100) : 0;

const loadColor = (pct: number) =>
  pct >= 80 ? Colors.danger : pct >= 50 ? Colors.warning : Colors.success;

// ── Component ───────────────────────────────────────────────
const AssignWorkScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const deliveries = useAppSelector((s) => s.delivery.deliveries);
  const personnel = useAppSelector((s) => s.delivery.deliveryPersonnel);
  const isAssigning = useAppSelector((s) => s.delivery.isAssigning);
  const isLoading = useAppSelector((s) => s.delivery.isLoading);

  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<string[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  useEffect(() => {
    // Data pre-loaded in unified slice
  }, []);

  // ── Derived data ──────────────────────────────────────
  const unassigned = useMemo(
    () => deliveries.filter((d) => d.status === 'unassigned'),
    [deliveries],
  );

  const availablePersonnel = useMemo(
    () => personnel.filter((p) => p.isAvailable && p.currentLoad < p.maxLoad),
    [personnel],
  );

  const selectedPerson = useMemo(
    () => personnel.find((p) => p.userId === selectedPersonId) ?? null,
    [personnel, selectedPersonId],
  );

  // ── Toggle delivery selection ─────────────────────────
  const toggleDelivery = useCallback((id: string) => {
    setSelectedDeliveryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const selectAll = () => setSelectedDeliveryIds(unassigned.map((d) => d.deliveryId));
  const deselectAll = () => setSelectedDeliveryIds([]);

  // ── Manual Assign ─────────────────────────────────────
  const handleAssign = async () => {
    if (selectedDeliveryIds.length === 0) {
      Alert.alert('No Deliveries', 'Select at least one delivery to assign.');
      return;
    }
    if (!selectedPersonId) {
      Alert.alert('No Personnel', 'Select a delivery person to assign to.');
      return;
    }
    try {
      dispatch(
        assignDeliveries({ deliveryIds: selectedDeliveryIds, deliveryPersonId: selectedPersonId }),
      );
      Alert.alert(
        'Assigned!',
        `${selectedDeliveryIds.length} delivery(ies) assigned to ${selectedPerson?.displayName}.`,
      );
      setSelectedDeliveryIds([]);
      setSelectedPersonId(null);
    } catch (err: any) {
      Alert.alert('Error', err || 'Assignment failed');
    }
  };

  // ── Auto-Assign ───────────────────────────────────────
  const handleAutoAssign = async () => {
    if (unassigned.length === 0) {
      Alert.alert('Nothing to assign', 'No unassigned deliveries.');
      return;
    }
    Alert.alert(
      'Auto-Assign',
      `Automatically assign ${unassigned.length} unassigned deliveries to available personnel?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Auto-Assign',
          onPress: () => {
            try {
              const ids = unassigned.map((d) => d.deliveryId);
              dispatch(autoAssignDeliveries(ids));
              Alert.alert('Done', 'Auto-assignment complete.');
              setSelectedDeliveryIds([]);
              setSelectedPersonId(null);
            } catch (err: any) {
              Alert.alert('Error', err || 'Auto-assign failed');
            }
          },
        },
      ],
    );
  };

  // ── Render helpers ────────────────────────────────────
  const renderDeliveryCard = ({ item }: { item: Delivery }) => {
    const selected = selectedDeliveryIds.includes(item.deliveryId);
    return (
      <TouchableOpacity
        style={[styles.deliveryCard, selected && styles.deliveryCardSelected]}
        onPress={() => toggleDelivery(item.deliveryId)}
        activeOpacity={0.7}
      >
        <View style={styles.checkRow}>
          <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
            {selected && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.deliveryInfo}>
            <View style={styles.deliveryTopRow}>
              <Text style={styles.customerName} numberOfLines={1}>
                {item.customerName}
              </Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor[item.priority] + '1A' }]}>
                <Text style={[styles.priorityText, { color: priorityColor[item.priority] }]}>
                  {priorityLabel[item.priority]}
                </Text>
              </View>
            </View>
            <Text style={styles.addressText} numberOfLines={1}>
              📍 {item.customerAddress.street}, {item.customerAddress.city}
            </Text>
            <Text style={styles.itemCount}>
              📦 {item.items.length} item{item.items.length !== 1 ? 's' : ''}
              {item.estimatedMinutes ? `  •  ~${item.estimatedMinutes} min` : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPersonCard = ({ item }: { item: DeliveryPerson }) => {
    const selected = selectedPersonId === item.userId;
    const pct = loadPercent(item);
    return (
      <TouchableOpacity
        style={[styles.personCard, selected && styles.personCardSelected]}
        onPress={() => setSelectedPersonId(selected ? null : item.userId)}
        activeOpacity={0.7}
      >
        <View style={styles.radioRow}>
          <View style={[styles.radio, selected && styles.radioChecked]}>
            {selected && <View style={styles.radioDot} />}
          </View>
          <View style={styles.personInfo}>
            <Text style={styles.personName}>{item.displayName}</Text>
            <Text style={styles.personMeta}>
              {item.vehicleType === 'motorcycle' ? '🏍️' : item.vehicleType === 'van' ? '🚐' : '🚛'}{' '}
              {item.vehicleNumber}
            </Text>
            {/* Load bar */}
            <View style={styles.loadRow}>
              <View style={styles.loadTrack}>
                <View style={[styles.loadFill, { width: `${pct}%`, backgroundColor: loadColor(pct) }]} />
              </View>
              <Text style={[styles.loadLabel, { color: loadColor(pct) }]}>
                {item.currentLoad}/{item.maxLoad}
              </Text>
            </View>
            {/* Zones */}
            {item.zones.length > 0 && (
              <View style={styles.zonesRowInline}>
                {item.zones.map((z) => (
                  <View key={z} style={styles.miniZone}>
                    <Text style={styles.miniZoneText}>{z}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Panel header ──────────────────────────────────────
  const PanelHeader: React.FC<{ title: string; count: number; extra?: React.ReactNode }> = ({
    title,
    count,
    extra,
  }) => (
    <View style={styles.panelHeader}>
      <View style={styles.panelHeaderLeft}>
        <Text style={styles.panelTitle}>{title}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      </View>
      {extra}
    </View>
  );

  // ── MAIN RENDER ───────────────────────────────────────
  if (isLoading && deliveries.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.deliveryAccent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Work</Text>
        <TouchableOpacity style={styles.autoBtn} onPress={handleAutoAssign} activeOpacity={0.8}>
          <Text style={styles.autoBtnText}>⚡ Auto-Assign</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ PANEL 1: Select Deliveries ═══════════════ */}
        <View style={styles.panel}>
          <PanelHeader
            title="Select Deliveries"
            count={unassigned.length}
            extra={
              <TouchableOpacity
                onPress={selectedDeliveryIds.length === unassigned.length ? deselectAll : selectAll}
              >
                <Text style={styles.selectAllText}>
                  {selectedDeliveryIds.length === unassigned.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            }
          />
          {unassigned.length === 0 ? (
            <Text style={styles.emptyText}>No unassigned deliveries 🎉</Text>
          ) : (
            <FlatList
              data={unassigned}
              keyExtractor={(d) => d.deliveryId}
              renderItem={renderDeliveryCard}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            />
          )}
          {selectedDeliveryIds.length > 0 && (
            <Text style={styles.selectionNote}>
              {selectedDeliveryIds.length} of {unassigned.length} selected
            </Text>
          )}
        </View>

        {/* ═══ PANEL 2: Select Personnel ════════════════ */}
        <View style={styles.panel}>
          <PanelHeader title="Select Personnel" count={availablePersonnel.length} />
          {availablePersonnel.length === 0 ? (
            <Text style={styles.emptyText}>No available personnel</Text>
          ) : (
            <FlatList
              data={availablePersonnel}
              keyExtractor={(p) => p.userId}
              renderItem={renderPersonCard}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
            />
          )}
        </View>

        {/* ═══ PANEL 3: Review & Assign ═════════════════ */}
        <View style={[styles.panel, styles.reviewPanel]}>
          <PanelHeader title="Review & Assign" count={selectedDeliveryIds.length} />

          <View style={styles.reviewRow}>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Deliveries</Text>
              <Text style={styles.reviewValue}>{selectedDeliveryIds.length}</Text>
            </View>
            <View style={styles.reviewDivider} />
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Assigned To</Text>
              <Text style={styles.reviewValue} numberOfLines={1}>
                {selectedPerson?.displayName ?? '—'}
              </Text>
            </View>
            <View style={styles.reviewDivider} />
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>New Load</Text>
              <Text style={styles.reviewValue}>
                {selectedPerson
                  ? `${selectedPerson.currentLoad + selectedDeliveryIds.length}/${selectedPerson.maxLoad}`
                  : '—'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.assignBtn,
              (selectedDeliveryIds.length === 0 || !selectedPersonId || isAssigning) && styles.assignBtnDisabled,
            ]}
            onPress={handleAssign}
            disabled={selectedDeliveryIds.length === 0 || !selectedPersonId || isAssigning}
            activeOpacity={0.8}
          >
            {isAssigning ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.assignBtnText}>
                Assign {selectedDeliveryIds.length} Deliver{selectedDeliveryIds.length !== 1 ? 'ies' : 'y'} to{' '}
                {selectedPerson?.displayName ?? '...'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    paddingTop: SAFE_TOP_PADDING, paddingHorizontal: Spacing.base, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.full,
    backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  backText: { fontSize: 20, color: Colors.textPrimary },
  headerTitle: { flex: 1, fontSize: Typography.fontSize.h4, fontWeight: '700', color: Colors.textPrimary },
  autoBtn: {
    backgroundColor: Colors.warning, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  autoBtnText: { color: Colors.white, fontSize: Typography.fontSize.caption, fontWeight: '700' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing.xxxl * 2 },

  // Panel
  panel: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.base, marginBottom: Spacing.base, ...Shadows.sm,
  },
  reviewPanel: { borderWidth: 1.5, borderColor: Colors.deliveryAccent },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  panelHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  panelTitle: { fontSize: Typography.fontSize.body, fontWeight: '700', color: Colors.textPrimary },
  countBadge: {
    backgroundColor: Colors.deliveryAccent + '1A', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
  },
  countText: { fontSize: Typography.fontSize.tiny, fontWeight: '700', color: Colors.deliveryAccent },
  selectAllText: { fontSize: Typography.fontSize.caption, fontWeight: '600', color: Colors.deliveryAccent },
  emptyText: { fontSize: Typography.fontSize.bodySmall, color: Colors.textTertiary, textAlign: 'center', paddingVertical: Spacing.lg },
  selectionNote: { fontSize: Typography.fontSize.caption, color: Colors.deliveryAccent, fontWeight: '600', textAlign: 'right', marginTop: Spacing.sm },

  // Delivery card
  deliveryCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1.5, borderColor: 'transparent',
  },
  deliveryCardSelected: { borderColor: Colors.deliveryAccent, backgroundColor: Colors.deliveryAccent + '08' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  checkbox: {
    width: 22, height: 22, borderRadius: BorderRadius.xs, borderWidth: 2,
    borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  checkboxChecked: { backgroundColor: Colors.deliveryAccent, borderColor: Colors.deliveryAccent },
  checkmark: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  deliveryInfo: { flex: 1 },
  deliveryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  customerName: { fontSize: Typography.fontSize.bodySmall, fontWeight: '600', color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  priorityBadge: { borderRadius: BorderRadius.xs, paddingHorizontal: 6, paddingVertical: 2 },
  priorityText: { fontSize: Typography.fontSize.tiny, fontWeight: '700' },
  addressText: { fontSize: Typography.fontSize.caption, color: Colors.textSecondary, marginBottom: 2 },
  itemCount: { fontSize: Typography.fontSize.caption, color: Colors.textTertiary },

  // Person card
  personCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1.5, borderColor: 'transparent',
  },
  personCardSelected: { borderColor: Colors.deliveryAccent, backgroundColor: Colors.deliveryAccent + '08' },
  radioRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  radio: {
    width: 22, height: 22, borderRadius: BorderRadius.full, borderWidth: 2,
    borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  radioChecked: { borderColor: Colors.deliveryAccent },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.deliveryAccent },
  personInfo: { flex: 1 },
  personName: { fontSize: Typography.fontSize.bodySmall, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  personMeta: { fontSize: Typography.fontSize.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },

  // Load bar
  loadRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  loadTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.borderLight, overflow: 'hidden' },
  loadFill: { height: '100%', borderRadius: 3 },
  loadLabel: { fontSize: Typography.fontSize.tiny, fontWeight: '700', width: 36, textAlign: 'right' },

  // Zones
  zonesRowInline: { flexDirection: 'row', gap: 4, marginTop: 2 },
  miniZone: { backgroundColor: Colors.primary + '12', borderRadius: BorderRadius.xs, paddingHorizontal: 6, paddingVertical: 1 },
  miniZoneText: { fontSize: 10, fontWeight: '600', color: Colors.primary },

  // Review panel
  reviewRow: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.base,
  },
  reviewItem: { flex: 1, alignItems: 'center' },
  reviewDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.sm },
  reviewLabel: { fontSize: Typography.fontSize.tiny, color: Colors.textTertiary, marginBottom: 4 },
  reviewValue: { fontSize: Typography.fontSize.body, fontWeight: '700', color: Colors.textPrimary },

  // Assign button
  assignBtn: {
    backgroundColor: Colors.success, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2, alignItems: 'center', ...Shadows.md,
  },
  assignBtnDisabled: { opacity: 0.4 },
  assignBtnText: { color: Colors.white, fontSize: Typography.fontSize.body, fontWeight: '700' },
});

export default AssignWorkScreen;
