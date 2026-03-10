// ============================================================
// FINMATRIX - Payroll History Screen
// ============================================================
// Lists past payroll runs with period, pay date, totals, status.
// Tap → drill into individual pay stubs.

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { fetchPayrollRuns, setStatusFilter } from './payrollSlice';
import { PayrollRun, PayrollStatus } from '../../dummy-data/payrollRuns';
import { ROUTES } from '../../navigations-map/Base';

const fmt = (n: number) =>
  '$' +
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const STATUS_FILTERS: { label: string; value: 'all' | PayrollStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Processed', value: 'processed' },
  { label: 'Draft', value: 'draft' },
];

const PayrollHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { filteredRuns, statusFilter, isLoading } = useAppSelector(
    (s) => s.payroll,
  );

  useEffect(() => {
    dispatch(fetchPayrollRuns());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchPayrollRuns());
  }, [dispatch]);

  const renderRun = ({ item }: { item: PayrollRun }) => {
    const isDraft = item.status === 'draft';
    return (
      <TouchableOpacity
        style={styles.runCard}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate(ROUTES.PAY_STUB, {
            payrollId: item.payrollId,
          })
        }
      >
        <View style={styles.runHeader}>
          <View>
            <Text style={styles.runPeriod}>
              {formatDate(item.payPeriodStart)} – {formatDate(item.payPeriodEnd)}
            </Text>
            <Text style={styles.runPayDate}>
              Pay date: {formatDate(item.payDate)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isDraft ? styles.statusDraft : styles.statusProcessed,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isDraft ? styles.statusDraftText : styles.statusProcessedText,
              ]}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.runDivider} />

        <View style={styles.runFooter}>
          <View style={styles.runStat}>
            <Text style={styles.runStatLabel}>Employees</Text>
            <Text style={styles.runStatValue}>{item.entries.length}</Text>
          </View>
          <View style={styles.runStat}>
            <Text style={styles.runStatLabel}>Gross</Text>
            <Text style={styles.runStatValue}>{fmt(item.totalGross)}</Text>
          </View>
          <View style={styles.runStat}>
            <Text style={styles.runStatLabel}>Net</Text>
            <Text style={[styles.runStatValue, styles.netText]}>
              {fmt(item.totalNet)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payroll History</Text>
        <TouchableOpacity
          style={styles.newRunBtn}
          onPress={() => navigation.navigate(ROUTES.RUN_PAYROLL)}
        >
          <Text style={styles.newRunText}>+ New Run</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterBar}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterChip,
              statusFilter === f.value && styles.filterChipActive,
            ]}
            onPress={() => dispatch(setStatusFilter(f.value))}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === f.value && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {isLoading && filteredRuns.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredRuns}
          keyExtractor={(r) => r.payrollId}
          renderItem={renderRun}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No payroll runs found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  newRunBtn: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
  },
  newRunText: { color: Colors.white, fontSize: 13, fontWeight: '700' },

  // Filters
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.borderLight,
  },
  filterChipActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: Colors.white },

  // List
  list: { padding: Spacing.base },
  runCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  runPeriod: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  runPayDate: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  statusProcessed: { backgroundColor: '#E8F5E9' },
  statusDraft: { backgroundColor: '#FFF3E0' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusProcessedText: { color: Colors.success },
  statusDraftText: { color: Colors.warning },
  runDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  runFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  runStat: { alignItems: 'center' },
  runStatLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 2 },
  runStatValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  netText: { color: Colors.success },

  // Empty & loading
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.sm },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
});

export default PayrollHistoryScreen;
