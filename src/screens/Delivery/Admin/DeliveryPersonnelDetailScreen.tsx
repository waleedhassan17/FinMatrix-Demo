// ============================================================
// FINMATRIX - Delivery Personnel Detail Screen (Admin)
// ============================================================
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography, SAFE_TOP_PADDING } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import { updatePersonnel, removePersonnel } from '../../../store/deliverySlice';
import { DeliveryPerson } from '../../../dummy-data/deliveryPersonnel';
import { Delivery } from '../../../dummy-data/deliveries';

// ── Helpers ─────────────────────────────────────────────────
const getInitials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

const avatarColor = (p: DeliveryPerson) => {
  if (p.status === 'on_leave') return Colors.textTertiary;
  if (!p.isAvailable || p.currentLoad >= p.maxLoad) return Colors.warning;
  return Colors.success;
};

const vehicleIcon = (type: string) => {
  switch (type) { case 'motorcycle': return '🏍️'; case 'van': return '🚐'; case 'truck': return '🚛'; default: return '🚗'; }
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ── Tab type ────────────────────────────────────────────────
type DetailTab = 'current' | 'history';

// ── Component ───────────────────────────────────────────────
const DeliveryPersonnelDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { userId } = route.params;
  const dispatch = useAppDispatch();
  const person = useAppSelector((s) =>
    s.delivery.deliveryPersonnel.find((p) => p.userId === userId),
  );
  const deliveries = useAppSelector((s) => s.delivery.deliveries);
  const [tab, setTab] = useState<DetailTab>('current');

  // ── Derived data ──────────────────────────────────────
  const todaysDeliveries = useMemo(
    () =>
      deliveries.filter(
        (d) =>
          d.deliveryPersonId === userId &&
          ['pending', 'picked_up', 'in_transit', 'arrived'].includes(d.status),
      ),
    [deliveries, userId],
  );

  const historyDeliveries = useMemo(
    () =>
      deliveries.filter(
        (d) =>
          d.deliveryPersonId === userId &&
          ['delivered', 'failed', 'returned'].includes(d.status),
      ),
    [deliveries, userId],
  );

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return deliveries.filter(
      (d) =>
        d.deliveryPersonId === userId &&
        d.status === 'delivered' &&
        new Date(d.deliveredAt ?? d.createdAt) >= start,
    ).length;
  }, [deliveries, userId]);

  if (!person) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.textSecondary }}>Person not found</Text>
      </View>
    );
  }

  // ── Actions ───────────────────────────────────────────
  const toggleAvailability = () => {
    dispatch(
      updatePersonnel({
        userId,
        data: { isAvailable: !person.isAvailable },
      }),
    );
  };

  const changeMaxLoad = () => {
    Alert.prompt
      ? Alert.prompt('Change Max Load', 'Enter new max load value:', (val) => {
          const n = parseInt(val, 10);
          if (!isNaN(n) && n > 0) {
            dispatch(updatePersonnel({ userId, data: { maxLoad: n } }));
          }
        })
      : Alert.alert('Change Max Load', 'Max load updated to 20', [
          {
            text: 'Set to 10',
            onPress: () =>
              dispatch(updatePersonnel({ userId, data: { maxLoad: 10 } })),
          },
          {
            text: 'Set to 15',
            onPress: () =>
              dispatch(updatePersonnel({ userId, data: { maxLoad: 15 } })),
          },
          {
            text: 'Set to 20',
            onPress: () =>
              dispatch(updatePersonnel({ userId, data: { maxLoad: 20 } })),
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Personnel',
      `Remove ${person.displayName} from the company?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            dispatch(removePersonnel(userId));
            navigation.goBack();
          },
        },
      ],
    );
  };

  const loadPct = Math.round((person.currentLoad / person.maxLoad) * 100);

  // ── Delivery mini-card ────────────────────────────────
  const renderDelivery = (d: Delivery) => {
    const statusColor =
      d.status === 'delivered' ? Colors.success
      : d.status === 'failed' || d.status === 'returned' ? Colors.danger
      : d.status === 'in_transit' ? Colors.info
      : Colors.warning;

    return (
      <View key={d.deliveryId} style={styles.delCard}>
        <View style={[styles.delDot, { backgroundColor: statusColor }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.delCustomer}>{d.customerName}</Text>
          <Text style={styles.delAddr}>
            {d.customerAddress.street}, {d.customerAddress.city}
          </Text>
        </View>
        <View style={[styles.delStatusBadge, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.delStatusText, { color: statusColor }]}>
            {d.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personnel Detail</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Profile Card ─────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={[styles.bigAvatar, { backgroundColor: avatarColor(person) + '20' }]}>
            <Text style={[styles.bigAvatarText, { color: avatarColor(person) }]}>
              {getInitials(person.displayName)}
            </Text>
          </View>
          <Text style={styles.profileName}>{person.displayName}</Text>
          <Text style={styles.profileEmail}>{person.email}</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.profilePhone}>{person.phone}</Text>
          </TouchableOpacity>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  person.status === 'active' ? Colors.success + '18'
                  : person.status === 'on_leave' ? Colors.warning + '18'
                  : Colors.textTertiary + '18',
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color:
                    person.status === 'active' ? Colors.success
                    : person.status === 'on_leave' ? Colors.warning
                    : Colors.textTertiary,
                },
              ]}
            >
              {person.status === 'on_leave' ? 'On Leave' : person.status === 'active' ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <Text style={styles.joinedText}>Member since {formatDate(person.joinedAt)}</Text>
        </View>

        {/* ── Vehicle Section ──────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle</Text>
          <View style={styles.vehicleCard}>
            <Text style={styles.vehicleEmoji}>{vehicleIcon(person.vehicleType)}</Text>
            <View>
              <Text style={styles.vehicleType}>
                {person.vehicleType.charAt(0).toUpperCase() + person.vehicleType.slice(1)}
              </Text>
              <Text style={styles.vehicleNumber}>{person.vehicleNumber}</Text>
            </View>
          </View>
        </View>

        {/* ── Performance Section ──────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.perfGrid}>
            <View style={styles.perfItem}>
              <Text style={styles.perfValue}>{person.totalDeliveries}</Text>
              <Text style={styles.perfLabel}>Total Deliveries</Text>
            </View>
            <View style={styles.perfItem}>
              <Text style={[styles.perfValue, { color: Colors.success }]}>
                {person.onTimeRate}%
              </Text>
              <Text style={styles.perfLabel}>On-Time Rate</Text>
            </View>
            <View style={styles.perfItem}>
              <Text style={[styles.perfValue, { color: Colors.warning }]}>
                {'★'} {person.rating.toFixed(1)}
              </Text>
              <Text style={styles.perfLabel}>Rating</Text>
            </View>
            <View style={styles.perfItem}>
              <Text style={styles.perfValue}>{thisMonthCount}</Text>
              <Text style={styles.perfLabel}>This Month</Text>
            </View>
          </View>

          {/* Load bar */}
          <View style={styles.loadSection}>
            <Text style={styles.loadTitle}>
              Current Load: {person.currentLoad}/{person.maxLoad}
            </Text>
            <View style={styles.loadBarBg}>
              <View
                style={[
                  styles.loadBarFill,
                  {
                    width: `${loadPct}%`,
                    backgroundColor:
                      loadPct < 50 ? Colors.success : loadPct <= 80 ? Colors.warning : Colors.danger,
                  },
                ]}
              />
            </View>
          </View>

          {/* Zones */}
          <View style={styles.zonesRow}>
            {person.zones.map((z) => (
              <View key={z} style={styles.zonePill}>
                <Text style={styles.zoneText}>{z}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Assignments Tabs ─────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'current' && styles.tabBtnActive]}
              onPress={() => setTab('current')}
            >
              <Text style={[styles.tabBtnText, tab === 'current' && styles.tabBtnTextActive]}>
                Current ({todaysDeliveries.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'history' && styles.tabBtnActive]}
              onPress={() => setTab('history')}
            >
              <Text style={[styles.tabBtnText, tab === 'history' && styles.tabBtnTextActive]}>
                History ({historyDeliveries.length})
              </Text>
            </TouchableOpacity>
          </View>

          {(tab === 'current' ? todaysDeliveries : historyDeliveries).length === 0 ? (
            <Text style={styles.noDeliveries}>No deliveries</Text>
          ) : (
            (tab === 'current' ? todaysDeliveries : historyDeliveries).map(renderDelivery)
          )}
        </View>

        {/* ── Actions ──────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <TouchableOpacity style={styles.actionBtn} onPress={toggleAvailability}>
            <Text style={styles.actionIcon}>{person.isAvailable ? '🔴' : '🟢'}</Text>
            <Text style={styles.actionLabel}>
              {person.isAvailable ? 'Set Unavailable' : 'Set Available'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={changeMaxLoad}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionLabel}>Change Max Load</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: Colors.danger + '40' }]}
            onPress={handleRemove}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={[styles.actionLabel, { color: Colors.danger }]}>
              Remove from Company
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingTop: SAFE_TOP_PADDING,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.full,
    backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  backText: { fontSize: 20, color: Colors.textPrimary },
  headerTitle: { fontSize: Typography.fontSize.h4, fontWeight: '700', color: Colors.textPrimary },
  scroll: { paddingBottom: Spacing.xxxl },

  // Profile
  profileCard: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.base,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  bigAvatar: {
    width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  bigAvatarText: { fontSize: 28, fontWeight: '700' },
  profileName: { fontSize: Typography.fontSize.h3, fontWeight: '700', color: Colors.textPrimary },
  profileEmail: { fontSize: Typography.fontSize.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  profilePhone: { fontSize: Typography.fontSize.bodySmall, color: Colors.info, marginTop: 4, textDecorationLine: 'underline' },
  statusBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, marginTop: Spacing.md },
  statusBadgeText: { fontSize: Typography.fontSize.caption, fontWeight: '600' },
  joinedText: { fontSize: Typography.fontSize.caption, color: Colors.textTertiary, marginTop: Spacing.sm },

  // Vehicle
  vehicleCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    padding: Spacing.base, borderRadius: BorderRadius.md, ...Shadows.sm,
  },
  vehicleEmoji: { fontSize: 32, marginRight: Spacing.md },
  vehicleType: { fontSize: Typography.fontSize.body, fontWeight: '600', color: Colors.textPrimary },
  vehicleNumber: { fontSize: Typography.fontSize.caption, color: Colors.textSecondary, marginTop: 2 },

  // Performance
  perfGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: Colors.white, borderRadius: BorderRadius.md, ...Shadows.sm,
    overflow: 'hidden',
  },
  perfItem: {
    width: '50%', alignItems: 'center', paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderRightWidth: 1, borderColor: Colors.borderLight,
  },
  perfValue: { fontSize: Typography.fontSize.h2, fontWeight: '700', color: Colors.textPrimary },
  perfLabel: { fontSize: Typography.fontSize.tiny, color: Colors.textTertiary, marginTop: 4 },
  loadSection: { marginTop: Spacing.md },
  loadTitle: { fontSize: Typography.fontSize.caption, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  loadBarBg: { height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, overflow: 'hidden' },
  loadBarFill: { height: 8, borderRadius: 4 },
  zonesRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  zonePill: { backgroundColor: Colors.primary + '14', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  zoneText: { fontSize: Typography.fontSize.caption, color: Colors.primary, fontWeight: '600' },

  // Tabs
  tabRow: { flexDirection: 'row', marginBottom: Spacing.md, gap: Spacing.sm },
  tabBtn: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabBtnText: { fontSize: Typography.fontSize.bodySmall, fontWeight: '600', color: Colors.textSecondary },
  tabBtnTextActive: { color: Colors.white },
  noDeliveries: { textAlign: 'center', color: Colors.textTertiary, paddingVertical: Spacing.lg },

  // Delivery mini-card
  delCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.sm,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.sm,
  },
  delDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.md },
  delCustomer: { fontSize: Typography.fontSize.bodySmall, fontWeight: '600', color: Colors.textPrimary },
  delAddr: { fontSize: Typography.fontSize.tiny, color: Colors.textTertiary, marginTop: 2 },
  delStatusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  delStatusText: { fontSize: Typography.fontSize.tiny, fontWeight: '600', textTransform: 'capitalize' },

  // Section
  section: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.body, fontWeight: '700', color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Actions
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  actionIcon: { fontSize: 18, marginRight: Spacing.md },
  actionLabel: { fontSize: Typography.fontSize.bodySmall, fontWeight: '600', color: Colors.textPrimary },
});

export default DeliveryPersonnelDetailScreen;
