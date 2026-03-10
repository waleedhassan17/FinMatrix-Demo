// ============================================================
// FINMATRIX - General Ledger Screen
// ============================================================

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { ROUTES } from '../../navigations-map/Base';
import {
  fetchLedgerEntries,
  setDateRange,
  setSelectedAccountId,
} from './glSlice';
import { LedgerEntry } from '../../dummy-data/generalLedger';
import DateRangePicker from '../../Custom-Components/DateRangePicker';
import CustomDropdown from '../../Custom-Components/CustomDropdown';

// ─── Helpers ────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2 });

const getPresets = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  // This Month
  const thisMonthFrom = fmt(new Date(y, m, 1));
  const thisMonthTo = fmt(now);

  // Last Month
  const lastMonthFrom = fmt(new Date(y, m - 1, 1));
  const lastMonthTo = fmt(new Date(y, m, 0));

  // This Quarter
  const qStart = Math.floor(m / 3) * 3;
  const thisQuarterFrom = fmt(new Date(y, qStart, 1));
  const thisQuarterTo = fmt(now);

  // This Year
  const thisYearFrom = fmt(new Date(y, 0, 1));
  const thisYearTo = fmt(now);

  return [
    { label: 'This Month', from: thisMonthFrom, to: thisMonthTo },
    { label: 'Last Month', from: lastMonthFrom, to: lastMonthTo },
    { label: 'This Quarter', from: thisQuarterFrom, to: thisQuarterTo },
    { label: 'This Year', from: thisYearFrom, to: thisYearTo },
  ];
};

// ─── Column Header ──────────────────────────────────────────
const ColumnHeaders: React.FC = () => (
  <View style={styles.colHeaderRow}>
    <Text style={[styles.colHeader, styles.colDate]}>Date</Text>
    <Text style={[styles.colHeader, styles.colRef]}>Ref #</Text>
    <Text style={[styles.colHeader, styles.colDesc]}>Description</Text>
    <Text style={[styles.colHeader, styles.colAccount]}>Account</Text>
    <Text style={[styles.colHeader, styles.colAmount]}>Debit</Text>
    <Text style={[styles.colHeader, styles.colAmount]}>Credit</Text>
    <Text style={[styles.colHeader, styles.colAmount]}>Balance</Text>
  </View>
);

// ─── Main Component ─────────────────────────────────────────
const GLScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { filteredEntries, dateRange, selectedAccountId, isLoading } =
    useAppSelector((s) => s.gl);
  const { accounts } = useAppSelector((s) => s.coa);

  const [showExport, setShowExport] = useState(false);

  const presets = useMemo(() => getPresets(), []);

  // ─── Fetch on mount and when filters change ────────────
  const loadEntries = useCallback(() => {
    dispatch(
      fetchLedgerEntries({
        from: dateRange.from,
        to: dateRange.to,
        accountId: selectedAccountId || undefined,
      })
    );
  }, [dispatch, dateRange, selectedAccountId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // ─── Account dropdown options ──────────────────────────
  const accountOptions = useMemo(() => {
    const active = accounts
      .filter((a) => a.isActive)
      .sort((a, b) => a.accountNumber.localeCompare(b.accountNumber))
      .map((a) => ({
        label: `${a.accountNumber} - ${a.name}`,
        value: a.accountId,
      }));
    return [{ label: 'All Accounts', value: '' }, ...active];
  }, [accounts]);

  // ─── Running balance computation ───────────────────────
  const entriesWithBalance = useMemo(() => {
    let running = 0;
    return filteredEntries.map((entry) => {
      running += entry.debit - entry.credit;
      return { ...entry, runningBalance: running };
    });
  }, [filteredEntries]);

  // ─── Totals ────────────────────────────────────────────
  const totals = useMemo(() => {
    const totalDebit = filteredEntries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = filteredEntries.reduce((s, e) => s + e.credit, 0);
    return { totalDebit, totalCredit, balanced: totalDebit === totalCredit };
  }, [filteredEntries]);

  // ─── Export CSV to clipboard ───────────────────────────
  const handleExportCSV = async () => {
    const header = 'Date,Reference,Description,Account,Debit,Credit,Balance';
    const rows = entriesWithBalance.map((e) =>
      [
        e.date,
        e.referenceNumber,
        `"${e.description.replace(/"/g, '""')}"`,
        e.accountName,
        e.debit.toFixed(2),
        e.credit.toFixed(2),
        e.runningBalance.toFixed(2),
      ].join(','),
    );
    const csv = [header, ...rows].join('\n');
    await Clipboard.setStringAsync(csv);
    setShowExport(false);
    Alert.alert(
      'Copied',
      `${filteredEntries.length} ledger entries copied to clipboard as CSV.`,
    );
  };

  // ─── Handlers ──────────────────────────────────────────
  const handleFromChange = (date: string) => {
    dispatch(setDateRange({ from: date, to: dateRange.to }));
  };
  const handleToChange = (date: string) => {
    dispatch(setDateRange({ from: dateRange.from, to: date }));
  };
  const handleAccountChange = (val: string) => {
    dispatch(setSelectedAccountId(val));
  };

  const handleRowPress = (_entry: LedgerEntry & { runningBalance: number }) => {
    navigation.navigate(ROUTES.JE_DETAIL, {
      entryId: _entry.id,
    });
  };

  // ─── Row Renderer ──────────────────────────────────────
  const renderRow = ({
    item,
    index,
  }: {
    item: LedgerEntry & { runningBalance: number };
    index: number;
  }) => {
    const isEven = index % 2 === 0;
    return (
      <TouchableOpacity
        style={[styles.row, { backgroundColor: isEven ? Colors.white : '#F8F9FA' }]}
        activeOpacity={0.6}
        onPress={() => handleRowPress(item)}
      >
        <Text style={[styles.cell, styles.colDate]} numberOfLines={1}>
          {item.date.slice(5)}
        </Text>
        <Text style={[styles.cell, styles.colRef]} numberOfLines={1}>
          {item.referenceNumber}
        </Text>
        <Text style={[styles.cell, styles.colDesc]} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={[styles.cell, styles.colAccount]} numberOfLines={1}>
          {item.accountNumber}
        </Text>
        <Text
          style={[
            styles.cell,
            styles.colAmount,
            styles.amountText,
            item.debit > 0 && styles.debitText,
          ]}
        >
          {item.debit > 0 ? formatCurrency(item.debit) : ''}
        </Text>
        <Text
          style={[
            styles.cell,
            styles.colAmount,
            styles.amountText,
            item.credit > 0 && styles.creditText,
          ]}
        >
          {item.credit > 0 ? formatCurrency(item.credit) : ''}
        </Text>
        <Text style={[styles.cell, styles.colAmount, styles.amountText]}>
          {formatCurrency(item.runningBalance)}
        </Text>
      </TouchableOpacity>
    );
  };

  // ─── Footer ────────────────────────────────────────────
  const FooterRow = () => (
    <View style={styles.footerRow}>
      <Text style={[styles.footerLabel, styles.colDate]} />
      <Text style={[styles.footerLabel, styles.colRef]} />
      <Text style={[styles.footerLabel, styles.colDesc]}>Totals</Text>
      <Text style={[styles.footerLabel, styles.colAccount]} />
      <Text style={[styles.footerValue, styles.colAmount, styles.debitText]}>
        {formatCurrency(totals.totalDebit)}
      </Text>
      <Text style={[styles.footerValue, styles.colAmount, styles.creditText]}>
        {formatCurrency(totals.totalCredit)}
      </Text>
      <Text style={[styles.footerValue, styles.colAmount]} />
      {!totals.balanced && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠ Debits and credits do not balance!
          </Text>
        </View>
      )}
    </View>
  );

  if (isLoading && filteredEntries.length === 0) {
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
        <Text style={styles.headerTitle}>General Ledger</Text>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() => setShowExport(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.exportBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Controls ───────────────────────────────────── */}
      <View style={styles.controls}>
        <DateRangePicker
          fromDate={dateRange.from}
          toDate={dateRange.to}
          onFromChange={handleFromChange}
          onToChange={handleToChange}
          presets={presets}
        />
        <CustomDropdown
          label="Account Filter"
          options={accountOptions}
          value={selectedAccountId}
          onChange={handleAccountChange}
          placeholder="All Accounts"
          searchable={accountOptions.length > 8}
        />
      </View>

      {/* ─── Summary Strip ──────────────────────────────── */}
      <View style={styles.summaryStrip}>
        <Text style={styles.summaryText}>
          {filteredEntries.length} entries
        </Text>
        <View style={styles.summaryRight}>
          <Text style={[styles.summaryText, styles.debitText]}>
            DR {formatCurrency(totals.totalDebit)}
          </Text>
          <Text style={styles.summarySep}>|</Text>
          <Text style={[styles.summaryText, styles.creditText]}>
            CR {formatCurrency(totals.totalCredit)}
          </Text>
        </View>
      </View>

      {/* ─── Column Headers (Sticky) ────────────────────── */}
      <ColumnHeaders />

      {/* ─── Ledger Rows ────────────────────────────────── */}
      <FlatList
        data={entriesWithBalance}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        ListFooterComponent={filteredEntries.length > 0 ? <FooterRow /> : null}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Entries Found</Text>
              <Text style={styles.emptySubtitle}>
                Adjust date range or account filter
              </Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadEntries} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* ─── Export Modal ───────────────────────────────── */}
      <Modal
        visible={showExport}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExport(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowExport(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Export Ledger</Text>
            <Text style={styles.modalSubtitle}>
              {filteredEntries.length} entries · {dateRange.from} to {dateRange.to}
            </Text>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={handleExportCSV}
              activeOpacity={0.7}
            >
              <Text style={styles.modalBtnIcon}>📋</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalBtnLabel}>Copy as CSV</Text>
                <Text style={styles.modalBtnHint}>Paste into Excel or Google Sheets</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowExport(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const COL_DATE_W = 52;
const COL_REF_W = 56;
const COL_ACCOUNT_W = 44;
const COL_AMOUNT_W = 72;

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
  exportBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.sm,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },

  // Controls
  controls: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.xs,
  },

  // Summary strip
  summaryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary + '08',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summarySep: {
    marginHorizontal: Spacing.sm,
    color: Colors.border,
  },

  // Column Headers
  colHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  colDate: { width: COL_DATE_W },
  colRef: { width: COL_REF_W },
  colDesc: { flex: 1 },
  colAccount: { width: COL_ACCOUNT_W },
  colAmount: { width: COL_AMOUNT_W, textAlign: 'right' },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
    minHeight: 42,
  },
  cell: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  amountText: {
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
  debitText: {
    color: '#27AE60',
  },
  creditText: {
    color: '#E74C3C',
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary + '0C',
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  footerValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  warningBanner: {
    position: 'absolute',
    bottom: -24,
    left: 0,
    right: 0,
    backgroundColor: Colors.dangerLight,
    paddingVertical: 4,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.danger,
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
  },

  // List
  listContent: {
    paddingBottom: Spacing.xxxl,
  },

  // Export Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '0C',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  modalBtnIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  modalBtnLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalBtnHint: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
});

export default GLScreen;
