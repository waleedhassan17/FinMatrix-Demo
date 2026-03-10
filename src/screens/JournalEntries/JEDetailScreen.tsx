// ============================================================
// FINMATRIX - Journal Entry Detail Screen
// ============================================================
// Read-only view of a journal entry with:
//  - Full header display (reference, date, memo, status badge)
//  - Formatted lines table with account details
//  - Totals & balance indicator
//  - Actions: Edit (draft), Post (draft+balanced), Void (posted), Duplicate

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { getJournalEntryByIdAPI } from '../../network/jeNetwork';
import { JournalEntry, JournalLine } from '../../dummy-data/journalEntries';
import {
  postJournalEntry,
  voidJournalEntry,
  fetchJournalEntries,
} from './jeSlice';
import { ROUTES } from '../../navigations-map/Base';

// ─── Constants ──────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  draft: { bg: Colors.warningLight, text: Colors.warning, label: 'Draft' },
  posted: { bg: Colors.successLight, text: Colors.success, label: 'Posted' },
  void: { bg: Colors.dangerLight, text: Colors.danger, label: 'Void' },
};

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  asset: '#2E75B6',
  liability: '#E74C3C',
  equity: '#8E44AD',
  revenue: '#27AE60',
  expense: '#F39C12',
};

const formatCurrency = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const formatDate = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ─── Main Component ─────────────────────────────────────────
const JEDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const entryId: string = route.params?.entryId;

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Load Entry ─────────────────────────────────────────
  const loadEntry = async () => {
    setIsLoading(true);
    try {
      const data = await getJournalEntryByIdAPI(entryId);
      setEntry(data);
    } catch {
      Alert.alert('Error', 'Failed to load journal entry');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntry();
  }, [entryId]);

  // ─── Totals ─────────────────────────────────────────────
  const totals = useMemo(() => {
    if (!entry) return { debits: 0, credits: 0, isBalanced: false };
    let debits = 0;
    let credits = 0;
    entry.lines.forEach((l) => {
      debits += l.debit;
      credits += l.credit;
    });
    return {
      debits,
      credits,
      isBalanced: Math.abs(debits - credits) < 0.01 && debits > 0,
    };
  }, [entry]);

  // ─── Actions ────────────────────────────────────────────
  const handleEdit = () => {
    navigation.navigate(ROUTES.JE_FORM, { entryId });
  };

  const handlePost = () => {
    if (!entry) return;
    Alert.alert(
      'Post Entry',
      `Post ${entry.reference}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post',
          onPress: async () => {
            try {
              await dispatch(postJournalEntry(entryId)).unwrap();
              dispatch(fetchJournalEntries());
              loadEntry();
              Alert.alert('Success', 'Journal entry posted.');
            } catch (e: any) {
              Alert.alert('Error', e || 'Failed to post');
            }
          },
        },
      ]
    );
  };

  const handleVoid = () => {
    if (!entry) return;
    Alert.alert(
      'Void Entry',
      `Void ${entry.reference}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(voidJournalEntry(entryId)).unwrap();
              dispatch(fetchJournalEntries());
              loadEntry();
              Alert.alert('Success', 'Journal entry voided.');
            } catch (e: any) {
              Alert.alert('Error', e || 'Failed to void');
            }
          },
        },
      ]
    );
  };

  const handleDuplicate = () => {
    navigation.navigate(ROUTES.JE_FORM);
    // In a full implementation, we'd pass entry data to pre-fill the form
  };

  // ─── Loading ─────────────────────────────────────────────
  if (isLoading || !entry) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading entry...</Text>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[entry.status] || STATUS_CONFIG.draft;

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
        <Text style={styles.headerTitle}>Entry Detail</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Status Banner ──────────────────────────────── */}
        <View
          style={[styles.statusBanner, { backgroundColor: statusConfig.bg }]}
        >
          <Text style={[styles.statusBannerText, { color: statusConfig.text }]}>
            {statusConfig.label}
          </Text>
        </View>

        {/* ─── Entry Info Card ────────────────────────────── */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reference</Text>
            <Text style={styles.infoValue}>{entry.reference}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(entry.date)}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Memo</Text>
            <Text style={styles.infoValueMemo}>{entry.memo}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValueSmall}>
              {formatDateTime(entry.createdAt)} by {entry.createdBy}
            </Text>
          </View>
        </View>

        {/* ─── Lines Table ────────────────────────────────── */}
        <View style={styles.linesCard}>
          <Text style={styles.sectionLabel}>JOURNAL LINES</Text>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, { flex: 1 }]}>Account</Text>
            <Text style={[styles.thText, { width: 80, textAlign: 'right' }]}>
              Debit
            </Text>
            <Text style={[styles.thText, { width: 80, textAlign: 'right' }]}>
              Credit
            </Text>
          </View>

          {/* Table Rows */}
          {entry.lines.map((line, index) => (
            <View
              key={line.lineId}
              style={[
                styles.tableRow,
                index % 2 === 0 && styles.tableRowEven,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.lineAccount}>
                  {line.accountNumber} – {line.accountName}
                </Text>
                {line.description ? (
                  <Text style={styles.lineDesc}>{line.description}</Text>
                ) : null}
              </View>
              <Text
                style={[
                  styles.lineAmount,
                  { width: 80, textAlign: 'right' },
                  line.debit > 0 && styles.debitText,
                ]}
              >
                {line.debit > 0 ? formatCurrency(line.debit) : '–'}
              </Text>
              <Text
                style={[
                  styles.lineAmount,
                  { width: 80, textAlign: 'right' },
                  line.credit > 0 && styles.creditText,
                ]}
              >
                {line.credit > 0 ? formatCurrency(line.credit) : '–'}
              </Text>
            </View>
          ))}

          {/* Totals Row */}
          <View style={styles.totalsRow}>
            <Text style={[styles.totalLabel, { flex: 1 }]}>Totals</Text>
            <Text
              style={[
                styles.totalAmount,
                { width: 80, textAlign: 'right', color: '#27AE60' },
              ]}
            >
              {formatCurrency(totals.debits)}
            </Text>
            <Text
              style={[
                styles.totalAmount,
                { width: 80, textAlign: 'right', color: '#E74C3C' },
              ]}
            >
              {formatCurrency(totals.credits)}
            </Text>
          </View>

          {/* Balance Indicator */}
          <View
            style={[
              styles.balanceIndicator,
              totals.isBalanced
                ? styles.balanceBalanced
                : styles.balanceUnbalanced,
            ]}
          >
            <Text
              style={[
                styles.balanceText,
                { color: totals.isBalanced ? Colors.success : Colors.danger },
              ]}
            >
              {totals.isBalanced ? '✓ Balanced' : '✗ Unbalanced'}
            </Text>
          </View>
        </View>

        {/* ─── Actions ────────────────────────────────────── */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionLabel}>ACTIONS</Text>

          <View style={styles.actionsRow}>
            {entry.status === 'draft' && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.editBtn]}
                  onPress={handleEdit}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>

                {totals.isBalanced && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.postBtn]}
                    onPress={handlePost}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.postBtnText}>📤 Post</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {entry.status === 'posted' && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.voidBtn]}
                onPress={handleVoid}
                activeOpacity={0.7}
              >
                <Text style={styles.voidBtnText}>🚫 Void</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, styles.duplicateBtn]}
              onPress={handleDuplicate}
              activeOpacity={0.7}
            >
              <Text style={styles.duplicateBtnText}>📋 Duplicate</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.textSecondary,
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

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },

  // Status Banner
  statusBanner: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Info Card
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textTertiary,
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  infoValueMemo: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    lineHeight: 20,
  },
  infoValueSmall: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },

  // Lines Card
  linesCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  thText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: Colors.background + '80',
  },
  lineAccount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  lineDesc: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  lineAmount: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  debitText: {
    color: '#27AE60',
    fontWeight: '700',
  },
  creditText: {
    color: '#E74C3C',
    fontWeight: '700',
  },
  totalsRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderTopWidth: 2,
    borderTopColor: Colors.textPrimary,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  balanceIndicator: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  balanceBalanced: {
    backgroundColor: Colors.successLight,
  },
  balanceUnbalanced: {
    backgroundColor: Colors.dangerLight,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Actions Card
  actionsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: Colors.primary + '12',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  postBtn: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  postBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
  voidBtn: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  voidBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.danger,
  },
  duplicateBtn: {
    backgroundColor: Colors.infoLight,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  duplicateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.info,
  },
});

export default JEDetailScreen;
