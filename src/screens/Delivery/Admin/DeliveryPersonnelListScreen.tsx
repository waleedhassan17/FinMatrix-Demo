// ============================================================
// FINMATRIX - Delivery Personnel List Screen (Admin)
// ============================================================
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, Typography, SAFE_TOP_PADDING } from '../../../theme';
import { ROUTES } from '../../../navigations-map/Base';
import { useAppSelector } from '../../../hooks/useReduxHooks';
import { DeliveryPerson } from '../../../dummy-data/deliveryPersonnel';

// ── Filter type ─────────────────────────────────────────────
type PersonnelFilter = 'all' | 'available' | 'busy' | 'on_leave';

const FILTERS: { key: PersonnelFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'busy', label: 'Busy' },
  { key: 'on_leave', label: 'On Leave' },
];

// ── Helpers ─────────────────────────────────────────────────
const getInitials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const avatarColor = (p: DeliveryPerson) => {
  if (p.status === 'on_leave') return Colors.textTertiary;
  if (!p.isAvailable || p.currentLoad >= p.maxLoad) return Colors.warning;
  return Colors.success;
};

const loadPercent = (p: DeliveryPerson) =>
  Math.round((p.currentLoad / p.maxLoad) * 100);

const loadColor = (pct: number) => {
  if (pct < 50) return Colors.success;
  if (pct <= 80) return Colors.warning;
  return Colors.danger;
};

const vehicleIcon = (type: string) => {
  switch (type) {
    case 'motorcycle': return '🏍️';
    case 'van': return '🚐';
    case 'truck': return '🚛';
    default: return '🚗';
  }
};

// ── Component ───────────────────────────────────────────────
const DeliveryPersonnelListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const personnel = useAppSelector((s) => s.delivery.deliveryPersonnel);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<PersonnelFilter>('all');

  // ── Derived counts ────────────────────────────────────
  const counts = useMemo(() => {
    const total = personnel.length;
    const active = personnel.filter((p) => p.status === 'active').length;
    const onLeave = personnel.filter((p) => p.status === 'on_leave').length;
    const available = personnel.filter(
      (p) => p.isAvailable && p.currentLoad < p.maxLoad && p.status === 'active',
    ).length;
    return { total, active, onLeave, available };
  }, [personnel]);

  // ── Filtered list ─────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...personnel];

    // text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.displayName.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q),
      );
    }

    // filter
    switch (filter) {
      case 'available':
        list = list.filter(
          (p) => p.isAvailable && p.currentLoad < p.maxLoad && p.status === 'active',
        );
        break;
      case 'busy':
        list = list.filter(
          (p) => p.status === 'active' && (!p.isAvailable || p.currentLoad >= p.maxLoad),
        );
        break;
      case 'on_leave':
        list = list.filter((p) => p.status === 'on_leave');
        break;
    }

    return list;
  }, [personnel, searchQuery, filter]);

  // ── Render ────────────────────────────────────────────
  const renderCard = ({ item }: { item: DeliveryPerson }) => {
    const pct = loadPercent(item);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate(ROUTES.DELIVERY_PERSONNEL_DETAIL, { userId: item.userId })
        }
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarColor(item) + '20' }]}>
          <Text style={[styles.avatarText, { color: avatarColor(item) }]}>
            {getInitials(item.displayName)}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.cardBody}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.displayName}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status === 'active'
                      ? Colors.success + '18'
                      : item.status === 'on_leave'
                      ? Colors.warning + '18'
                      : Colors.textTertiary + '18',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      item.status === 'active'
                        ? Colors.success
                        : item.status === 'on_leave'
                        ? Colors.warning
                        : Colors.textTertiary,
                  },
                ]}
              >
                {item.status === 'on_leave' ? 'On Leave' : item.status === 'active' ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* Vehicle */}
          <Text style={styles.vehicleText}>
            {vehicleIcon(item.vehicleType)} {item.vehicleNumber}
          </Text>

          {/* Load bar */}
          <View style={styles.loadRow}>
            <Text style={styles.loadLabel}>
              {item.currentLoad}/{item.maxLoad} deliveries
            </Text>
            <View style={styles.loadBarBg}>
              <View
                style={[
                  styles.loadBarFill,
                  { width: `${pct}%`, backgroundColor: loadColor(pct) },
                ]}
              />
            </View>
          </View>

          {/* Rating + Zones */}
          <View style={styles.bottomRow}>
            <Text style={styles.ratingText}>
              {'★'.repeat(Math.round(item.rating))} {item.rating.toFixed(1)}
            </Text>
            <View style={styles.zonesRow}>
              {item.zones.map((z) => (
                <View key={z} style={styles.zonePill}>
                  <Text style={styles.zoneText}>{z}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Delivery Team</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate(ROUTES.ADD_DELIVERY_PERSONNEL)}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <SummaryItem label="Total" value={counts.total} color={Colors.primary} />
        <SummaryItem label="Active" value={counts.active} color={Colors.success} />
        <SummaryItem label="On Leave" value={counts.onLeave} color={Colors.warning} />
        <SummaryItem label="Available" value={counts.available} color={Colors.info} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor={Colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.userId}
        renderItem={renderCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No personnel found</Text>
          </View>
        }
      />
    </View>
  );
};

// ── Summary Item ────────────────────────────────────────────
const SummaryItem: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <View style={styles.summaryItem}>
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white,
    paddingTop: SAFE_TOP_PADDING,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  backText: { fontSize: 20, color: Colors.textPrimary },
  title: {
    fontSize: Typography.fontSize.h3,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addBtn: {
    backgroundColor: Colors.deliveryAccent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: Typography.fontSize.caption,
    fontWeight: '600',
  },

  // Summary
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    ...Shadows.sm,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: Typography.fontSize.h3,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Search
  searchContainer: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.sm,
    fontSize: Typography.fontSize.bodySmall,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary + '14',
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // List
  list: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
  },
  cardBody: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: '600',
  },
  vehicleText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  loadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  loadLabel: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.textTertiary,
    width: 90,
  },
  loadBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  loadBarFill: {
    height: 6,
    borderRadius: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.warning,
  },
  zonesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  zonePill: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
  },
  zoneText: {
    fontSize: 9,
    color: Colors.primary,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 22,
    color: Colors.textTertiary,
    marginLeft: Spacing.sm,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.huge,
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
  },
});

export default DeliveryPersonnelListScreen;
