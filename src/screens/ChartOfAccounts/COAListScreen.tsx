// ============================================================
// FINMATRIX - Chart of Accounts List Screen
// ============================================================

import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import {
  fetchAccounts,
  setSearchQuery,
  setActiveFilter,
  toggleAccount,
} from './coaSlice';
import { Account } from '../../dummy-data/chartOfAccounts';
import { ROUTES } from '../../navigations-map/Base';

// ─── Constants ──────────────────────────────────────────────
const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  asset: '#2E75B6',
  liability: '#E74C3C',
  equity: '#8E44AD',
  revenue: '#27AE60',
  expense: '#F39C12',
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expenses',
};

const FILTER_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'asset', label: 'Assets' },
  { key: 'liability', label: 'Liabilities' },
  { key: 'equity', label: 'Equity' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'expense', label: 'Expenses' },
];

// ─── Filter Chip ────────────────────────────────────────────
const FilterChip: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ label, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, isSelected && styles.chipSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Account Row ────────────────────────────────────────────
const AccountRow: React.FC<{
  account: Account;
  onPress: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onLongPress: () => void;
}> = React.memo(({ account, onPress, onEdit, onToggle, onLongPress }) => {
  const typeColor = ACCOUNT_TYPE_COLORS[account.type] || Colors.textSecondary;
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeOpen = useRef(false);

  const formatCurrency = (amount: number) => {
    const isNeg = amount < 0;
    const formatted =
      '$' + Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0 });
    return isNeg ? `-${formatted}` : formatted;
  };

  const handleSwipeStart = () => {
    if (swipeOpen.current) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      swipeOpen.current = false;
    } else {
      Animated.spring(translateX, {
        toValue: -80,
        useNativeDriver: true,
      }).start();
      swipeOpen.current = true;
    }
  };

  return (
    <View style={styles.rowWrapper}>
      {/* Swipe action behind */}
      <View style={styles.swipeAction}>
        <TouchableOpacity style={styles.editSwipeBtn} onPress={onEdit}>
          <Text style={styles.editSwipeBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.rowContainer, { transform: [{ translateX }] }]}
      >
        <TouchableOpacity
          style={[
            styles.accountRow,
            !account.isActive && styles.accountRowInactive,
          ]}
          activeOpacity={0.7}
          onPress={onPress}
          onLongPress={onLongPress}
        >
          {/* Left: Color indicator */}
          <View
            style={[styles.typeIndicator, { backgroundColor: typeColor }]}
          />

          {/* Center: Account info */}
          <View style={styles.accountInfo}>
            <View style={styles.accountTopRow}>
              <Text style={styles.accountNumber}>{account.accountNumber}</Text>
              {!account.isActive && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveBadgeText}>Inactive</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.accountName,
                !account.isActive && styles.accountNameInactive,
              ]}
              numberOfLines={1}
            >
              {account.name}
            </Text>
          </View>

          {/* Right: Balance */}
          <Text
            style={[
              styles.accountBalance,
              { color: typeColor },
              !account.isActive && styles.accountBalanceInactive,
            ]}
          >
            {formatCurrency(account.currentBalance)}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

// ─── Section Header ─────────────────────────────────────────
const SectionHeader: React.FC<{
  type: string;
  count: number;
  totalBalance: number;
}> = ({ type, count, totalBalance }) => {
  const color = ACCOUNT_TYPE_COLORS[type] || Colors.textSecondary;
  const label = ACCOUNT_TYPE_LABELS[type] || type;

  const formatCurrency = (amount: number) => {
    const isNeg = amount < 0;
    const formatted =
      '$' + Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0 });
    return isNeg ? `-${formatted}` : formatted;
  };

  return (
    <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
      <View style={styles.sectionHeaderLeft}>
        <View style={[styles.sectionDot, { backgroundColor: color }]} />
        <Text style={styles.sectionTitle}>{label}</Text>
        <View style={[styles.countBadge, { backgroundColor: color + '18' }]}>
          <Text style={[styles.countBadgeText, { color }]}>{count}</Text>
        </View>
      </View>
      <Text style={[styles.sectionBalance, { color }]}>
        {formatCurrency(totalBalance)}
      </Text>
    </View>
  );
};

// ─── Empty State ────────────────────────────────────────────
const EmptyState: React.FC = () => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIcon}>
      <Text style={styles.emptyIconText}>📋</Text>
    </View>
    <Text style={styles.emptyTitle}>No accounts found</Text>
    <Text style={styles.emptySubtitle}>
      Try adjusting your search or filter criteria
    </Text>
  </View>
);

// ─── Main Component ─────────────────────────────────────────
const COAListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { filteredAccounts, searchQuery, activeFilter, isLoading } =
    useAppSelector((s) => s.coa);

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  // Build section data from filtered accounts
  const sectionData = React.useMemo(() => {
    const typeOrder: Account['type'][] = [
      'asset',
      'liability',
      'equity',
      'revenue',
      'expense',
    ];
    const grouped: Record<string, Account[]> = {};

    filteredAccounts.forEach((acc) => {
      if (!grouped[acc.type]) grouped[acc.type] = [];
      grouped[acc.type].push(acc);
    });

    return typeOrder
      .filter((type) => grouped[type] && grouped[type].length > 0)
      .map((type) => {
        const accounts = grouped[type].sort((a, b) =>
          a.accountNumber.localeCompare(b.accountNumber)
        );
        const totalBalance = accounts.reduce(
          (sum, a) => sum + a.currentBalance,
          0
        );
        return {
          type,
          count: accounts.length,
          totalBalance,
          data: accounts,
        };
      });
  }, [filteredAccounts]);

  const handleLongPress = (account: Account) => {
    Alert.alert(account.name, `Account #${account.accountNumber}`, [
      {
        text: 'Edit',
        onPress: () =>
          navigation.navigate(ROUTES.COA_FORM, { accountId: account.accountId }),
      },
      {
        text: account.isActive ? 'Deactivate' : 'Activate',
        onPress: () => dispatch(toggleAccount(account.accountId)),
        style: account.isActive ? 'destructive' : 'default',
      },
      {
        text: 'View Detail',
        onPress: () =>
          navigation.navigate(ROUTES.COA_DETAIL, { accountId: account.accountId }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleEdit = (account: Account) => {
    navigation.navigate(ROUTES.COA_FORM, { accountId: account.accountId });
  };

  if (isLoading && filteredAccounts.length === 0) {
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
        <Text style={styles.headerTitle}>Chart of Accounts</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate(ROUTES.COA_FORM)}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Search Bar ─────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or number..."
            placeholderTextColor={Colors.placeholder}
            value={searchQuery}
            onChangeText={(text) => dispatch(setSearchQuery(text))}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => dispatch(setSearchQuery(''))}
              activeOpacity={0.7}
            >
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── Filter Chips ───────────────────────────────── */}
      <View style={styles.filterRow}>
        {FILTER_CHIPS.map((chip) => (
          <FilterChip
            key={chip.key}
            label={chip.label}
            isSelected={activeFilter === chip.key}
            onPress={() => dispatch(setActiveFilter(chip.key))}
          />
        ))}
      </View>

      {/* ─── Section List ───────────────────────────────── */}
      <SectionList
        sections={sectionData}
        keyExtractor={(item) => item.accountId}
        renderSectionHeader={({ section }) => (
          <SectionHeader
            type={section.type}
            count={section.count}
            totalBalance={section.totalBalance}
          />
        )}
        renderItem={({ item }) => (
          <AccountRow
            account={item}
            onPress={() => navigation.navigate(ROUTES.COA_DETAIL, { accountId: item.accountId })}
            onEdit={() => handleEdit(item)}
            onToggle={() => dispatch(toggleAccount(item.accountId))}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        stickySectionHeadersEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },

  // Search
  searchContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    fontSize: 16,
    color: Colors.textTertiary,
    paddingLeft: Spacing.sm,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  chipTextSelected: {
    color: Colors.white,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderLeftWidth: 3,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionBalance: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Account Row
  rowWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  swipeAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editSwipeBtn: {
    width: 72,
    height: '85%',
    backgroundColor: Colors.info,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editSwipeBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  rowContainer: {
    backgroundColor: Colors.white,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.white,
  },
  accountRowInactive: {
    opacity: 0.5,
  },
  typeIndicator: {
    width: 3,
    height: 36,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  accountInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  accountTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textTertiary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  inactiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.xs,
  },
  inactiveBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.danger,
    textTransform: 'uppercase',
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  accountNameInactive: {
    color: Colors.textTertiary,
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  accountBalanceInactive: {
    opacity: 0.6,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.base + 3 + Spacing.md,
  },
  listContent: {
    paddingBottom: Spacing.xxxl,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.huge,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default COAListScreen;
