// ============================================================
// FINMATRIX - Vendor List Screen
// ============================================================

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import {
  fetchVendors,
  setVendorSearch,
  setVendorActiveFilter,
  setVendorSortKey,
} from './vendorSlice';
import { Vendor } from '../../dummy-data/vendors';
import { ROUTES } from '../../navigations-map/Base';

// ─── Constants ──────────────────────────────────────────────
const FILTER_CHIPS = [
  { key: 'all' as const, label: 'All' },
  { key: 'active' as const, label: 'Active' },
  { key: 'inactive' as const, label: 'Inactive' },
];

const SORT_OPTIONS = [
  { key: 'name' as const, label: 'A-Z' },
  { key: 'balance' as const, label: 'Balance' },
];

const formatCurrency = (amount: number) =>
  '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2 });

const getBalanceColor = (balance: number) => {
  if (balance === 0) return Colors.success;
  if (balance > 2000) return Colors.warning;
  return Colors.textPrimary;
};

// ─── Filter Chip ────────────────────────────────────────────
const FilterChip: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ label, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, isSelected && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Sort Chip ──────────────────────────────────────────────
const SortChip: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ label, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.sortChip, isSelected && styles.sortChipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.sortChipText, isSelected && styles.sortChipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Vendor Card ────────────────────────────────────────────
const VendorCard: React.FC<{
  vendor: Vendor;
  onPress: () => void;
}> = React.memo(({ vendor, onPress }) => {
  const balanceColor = getBalanceColor(vendor.balance);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.cardLeft}>
        {/* Active dot */}
        <View
          style={[
            styles.activeDot,
            {
              backgroundColor: vendor.isActive
                ? Colors.success
                : Colors.textDisabled,
            },
          ]}
        />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{vendor.companyName}</Text>
          <Text style={styles.cardContact}>{vendor.contactPerson}</Text>
          <Text style={styles.cardEmail}>{vendor.email}</Text>
          <Text style={styles.cardPhone}>{vendor.phone}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.cardBalance, { color: balanceColor }]}>
          {formatCurrency(vendor.balance)}
        </Text>
        {vendor.balance === 0 && (
          <Text style={styles.cardPaidLabel}>Paid up</Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

// ─── Empty State ────────────────────────────────────────────
const EmptyState: React.FC = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>🏢</Text>
    <Text style={styles.emptyTitle}>No Vendors Found</Text>
    <Text style={styles.emptySubtitle}>
      Tap "+" to add your first vendor
    </Text>
  </View>
);

// ─── Main Component ─────────────────────────────────────────
const VendorListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const {
    filteredVendors,
    searchQuery,
    activeFilter,
    sortKey,
    isLoading,
  } = useAppSelector((s) => s.vendors);

  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchVendors());
  }, [dispatch]);

  if (isLoading && filteredVendors.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ─── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendors</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate(ROUTES.VENDOR_FORM)}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Search ─────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(text) => dispatch(setVendorSearch(text))}
          placeholder="Search company, contact, or email..."
          placeholderTextColor={Colors.placeholder}
        />
      </View>

      {/* ─── Filter + Sort Row ──────────────────────────── */}
      <View style={styles.filterSortRow}>
        <View style={styles.chipRow}>
          {FILTER_CHIPS.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              isSelected={activeFilter === chip.key}
              onPress={() => dispatch(setVendorActiveFilter(chip.key))}
            />
          ))}
        </View>
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <SortChip
              key={opt.key}
              label={opt.label}
              isSelected={sortKey === opt.key}
              onPress={() => dispatch(setVendorSortKey(opt.key))}
            />
          ))}
        </View>
      </View>

      {/* ─── List ───────────────────────────────────────── */}
      <FlatList
        data={filteredVendors}
        keyExtractor={(item) => item.vendorId}
        renderItem={({ item }) => (
          <VendorCard
            vendor={item}
            onPress={() =>
              navigation.navigate(ROUTES.VENDOR_DETAIL, {
                vendorId: item.vendorId,
              })
            }
          />
        )}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />

      {/* ─── FAB ────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate(ROUTES.VENDOR_FORM)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.white,
    marginTop: -1,
  },

  // Search
  searchContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    height: 40,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // Filter + Sort
  filterSortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  sortRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  sortChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.background,
  },
  sortChipActive: {
    backgroundColor: Colors.secondary + '20',
  },
  sortChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  sortChipTextActive: {
    color: Colors.secondary,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    ...Shadows.sm,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardContact: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  cardEmail: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  cardPhone: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 80,
  },
  cardBalance: {
    fontSize: 18,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  cardPaidLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
    marginTop: 2,
    textTransform: 'uppercase',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
  },

  // List
  listContent: {
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: Spacing.xxl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  fabText: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.white,
    marginTop: -2,
  },
});

export default VendorListScreen;
