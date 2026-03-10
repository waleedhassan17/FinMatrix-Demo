// ============================================================
// FINMATRIX - Employee List Screen
// ============================================================
// Header: "Employees" + "+" button.
// Search by name. Filter by department dropdown. Sort: Name, Department.
// Cards: full name (bold), department badge, position, pay type + rate, status dot.
// Tap → detail.

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
  fetchEmployees,
  setSearchQuery,
  setDepartmentFilter,
  setSortKey,
} from './employeeSlice';
import { Employee } from '../../dummy-data/employees';
import { DEPARTMENTS, DEPARTMENT_COLORS, Department } from '../../models/employeeModel';
import { ROUTES } from '../../navigations-map/Base';

// ─── Constants ──────────────────────────────────────────────
type DeptFilter = 'all' | Department;

const DEPT_CHIPS: { key: DeptFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  ...DEPARTMENTS.map((d) => ({ key: d as DeptFilter, label: d })),
];

const SORT_OPTIONS: { key: 'name' | 'department'; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'department', label: 'Dept' },
];

const formatCurrency = (amount: number) =>
  '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{label}</Text>
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
    <Text style={[styles.sortChipText, isSelected && styles.sortChipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Employee Card ──────────────────────────────────────────
const EmployeeCard: React.FC<{
  employee: Employee;
  onPress: () => void;
}> = React.memo(({ employee, onPress }) => {
  const deptColor = DEPARTMENT_COLORS[employee.department] ?? Colors.primary;
  const rateLabel =
    employee.payType === 'salary'
      ? `${formatCurrency(employee.payRate)}/yr`
      : `${formatCurrency(employee.payRate)}/hr`;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.cardLeft}>
        <View
          style={[
            styles.activeDot,
            { backgroundColor: employee.isActive ? Colors.success : Colors.textDisabled },
          ]}
        />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>
            {employee.firstName} {employee.lastName}
          </Text>
          <View style={styles.cardRow}>
            <View style={[styles.deptBadge, { backgroundColor: deptColor + '18' }]}>
              <Text style={[styles.deptBadgeText, { color: deptColor }]}>
                {employee.department}
              </Text>
            </View>
            <Text style={styles.cardPosition}>{employee.position}</Text>
          </View>
          <Text style={styles.cardPay}>
            {employee.payType === 'salary' ? '💼 Salary' : '⏰ Hourly'} · {rateLabel}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Empty State ────────────────────────────────────────────
const EmptyState: React.FC = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>👤</Text>
    <Text style={styles.emptyTitle}>No Employees Found</Text>
    <Text style={styles.emptySubtitle}>Tap "+" to add your first employee</Text>
  </View>
);

// ─── Main Component ─────────────────────────────────────────
const EmployeeListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const {
    filteredEmployees,
    searchQuery,
    departmentFilter,
    sortKey,
    isLoading,
  } = useAppSelector((s) => s.employees);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const renderItem = useCallback(
    ({ item }: { item: Employee }) => (
      <EmployeeCard
        employee={item}
        onPress={() =>
          navigation.navigate(ROUTES.EMPLOYEE_DETAIL, { employeeId: item.employeeId })
        }
      />
    ),
    [navigation],
  );

  const keyExtractor = useCallback((item: Employee) => item.employeeId, []);

  if (isLoading && filteredEmployees.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Employees</Text>
          <Text style={styles.subtitle}>{filteredEmployees.length} records</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate(ROUTES.EMPLOYEE_FORM)}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search ─────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name…"
          placeholderTextColor={Colors.placeholder}
          value={searchQuery}
          onChangeText={(t) => dispatch(setSearchQuery(t))}
        />
      </View>

      {/* ── Department Filter ──────────────────────────── */}
      <View style={styles.filterRow}>
        {DEPT_CHIPS.map((c) => (
          <FilterChip
            key={c.key}
            label={c.label}
            isSelected={departmentFilter === c.key}
            onPress={() => dispatch(setDepartmentFilter(c.key))}
          />
        ))}
      </View>

      {/* ── Sort ───────────────────────────────────────── */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort:</Text>
        {SORT_OPTIONS.map((o) => (
          <SortChip
            key={o.key}
            label={o.label}
            isSelected={sortKey === o.key}
            onPress={() => dispatch(setSortKey(o.key))}
          />
        ))}
      </View>

      {/* ── List ───────────────────────────────────────── */}
      <FlatList<Employee>
        data={filteredEmployees}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={<EmptyState />}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  addBtnText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
    marginTop: -2,
  },

  // Search
  searchRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
  },
  searchInput: {
    height: 40,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.borderLight,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },

  // Sort
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
    marginRight: Spacing.xs,
  },
  sortChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sortChipTextActive: {
    color: Colors.primary,
  },

  // List
  list: {
    padding: Spacing.base,
    paddingBottom: 40,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: Spacing.sm,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  deptBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  deptBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardPosition: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cardPay: {
    fontSize: 12,
    color: Colors.textTertiary,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

export default EmployeeListScreen;
