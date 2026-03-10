// ============================================================
// FINMATRIX - Journal Entry Form Screen
// ============================================================
// THE MOST IMPORTANT ACCOUNTING SCREEN
//
// Create or edit a journal entry with:
//  - Date picker, auto-generated reference, memo
//  - Dynamic lines table (JournalLineRow components)
//  - Debit / credit mutual exclusion per line
//  - Running totals & balance indicator
//  - Save as Draft (always), Post (only when balanced)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { chartOfAccounts } from '../../dummy-data/chartOfAccounts';
import JournalLineRow from '../../components/JournalLineRow';
import {
  JEFormLine,
  JEFormData,
  validateJournalEntry,
  generateNextReference,
  createBlankLine,
} from '../../models/jeModel';
import {
  createJournalEntry,
  updateJournalEntry,
  postJournalEntry,
  fetchJournalEntries,
} from './jeSlice';
import { getJournalEntryByIdAPI } from '../../network/jeNetwork';
import { JournalEntry, JournalLine } from '../../dummy-data/journalEntries';

// ─── Helpers ────────────────────────────────────────────────
const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const formatCurrency = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const formatDisplayDate = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
};

// ─── Account options for dropdown ───────────────────────────
const accountOptions = chartOfAccounts
  .filter((a) => a.isActive)
  .map((a) => ({
    label: `${a.accountNumber} – ${a.name}`,
    value: a.accountId,
  }));

// ─── Main Component ─────────────────────────────────────────
const JEFormScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const entries = useAppSelector((s) => s.je.entries);

  const entryId: string | undefined = route.params?.entryId;
  const isEditing = !!entryId;

  // ─── Form State ─────────────────────────────────────────
  const [date, setDate] = useState(todayISO());
  const [reference, setReference] = useState('');
  const [memo, setMemo] = useState('');
  const [lines, setLines] = useState<JEFormLine[]>([
    createBlankLine(),
    createBlankLine(),
  ]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  const [validationResult, setValidationResult] = useState<ReturnType<
    typeof validateJournalEntry
  > | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // ─── Auto-generate reference for new entries ────────────
  useEffect(() => {
    if (!isEditing) {
      const existingRefs = entries.map((e) => e.reference);
      setReference(generateNextReference(existingRefs));
    }
  }, [isEditing, entries]);

  // ─── Load existing entry for editing ────────────────────
  useEffect(() => {
    if (isEditing && entryId) {
      setIsLoadingEntry(true);
      getJournalEntryByIdAPI(entryId)
        .then((entry) => {
          setDate(entry.date);
          setReference(entry.reference);
          setMemo(entry.memo);
          setLines(
            entry.lines.map((l: JournalLine) => ({
              lineId: l.lineId,
              accountId: l.accountId,
              description: l.description,
              debit: l.debit,
              credit: l.credit,
            }))
          );
        })
        .catch(() => {
          Alert.alert('Error', 'Failed to load journal entry');
          navigation.goBack();
        })
        .finally(() => setIsLoadingEntry(false));
    }
  }, [isEditing, entryId]);

  // ─── Live validation (rerun when form changes) ─────────
  useEffect(() => {
    const data: JEFormData = { date, reference, memo, lines };
    setValidationResult(validateJournalEntry(data));
  }, [date, reference, memo, lines]);

  // ─── Totals ─────────────────────────────────────────────
  const totals = useMemo(() => {
    let debits = 0;
    let credits = 0;
    lines.forEach((l) => {
      debits += l.debit > 0 ? l.debit : 0;
      credits += l.credit > 0 ? l.credit : 0;
    });
    const isBalanced = Math.abs(debits - credits) < 0.01 && debits > 0;
    return { debits, credits, isBalanced };
  }, [lines]);

  // ─── Line Handlers ─────────────────────────────────────
  const handleLineUpdate = useCallback(
    (index: number, field: keyof JEFormLine, value: string | number) => {
      setLines((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    []
  );

  const handleLineDelete = useCallback((index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddLine = () => {
    setLines((prev) => [...prev, createBlankLine()]);
  };

  // ─── Build payload ─────────────────────────────────────
  const buildPayload = (): Omit<JournalEntry, 'entryId' | 'createdAt'> => {
    const journalLines: JournalLine[] = lines.map((l) => {
      const account = chartOfAccounts.find((a) => a.accountId === l.accountId);
      return {
        lineId: l.lineId,
        accountId: l.accountId,
        accountName: account?.name || '',
        accountNumber: account?.accountNumber || '',
        description: l.description,
        debit: l.debit,
        credit: l.credit,
      };
    });

    return {
      companyId: 'company_1',
      date,
      reference,
      memo,
      lines: journalLines,
      status: 'draft',
      createdBy: 'admin',
    };
  };

  // ─── Save as Draft ─────────────────────────────────────
  const handleSaveAsDraft = async () => {
    setHasAttemptedSubmit(true);
    const data: JEFormData = { date, reference, memo, lines };
    const result = validateJournalEntry(data);

    if (!result.isValid) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildPayload();
      if (isEditing && entryId) {
        await dispatch(
          updateJournalEntry({ id: entryId, data: payload })
        ).unwrap();
      } else {
        await dispatch(createJournalEntry(payload)).unwrap();
      }
      dispatch(fetchJournalEntries());
      Alert.alert('Success', 'Journal entry saved as draft.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e || 'Failed to save journal entry');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Save & Post ───────────────────────────────────────
  const handleSaveAndPost = async () => {
    setHasAttemptedSubmit(true);
    const data: JEFormData = { date, reference, memo, lines };
    const result = validateJournalEntry(data);

    if (!result.canPost) {
      const msg = result.errors.balance || 'Entry must be balanced to post.';
      Alert.alert('Cannot Post', msg);
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildPayload();
      let createdEntry: JournalEntry;
      if (isEditing && entryId) {
        createdEntry = await dispatch(
          updateJournalEntry({ id: entryId, data: payload })
        ).unwrap();
      } else {
        createdEntry = await dispatch(createJournalEntry(payload)).unwrap();
      }
      await dispatch(postJournalEntry(createdEntry.entryId)).unwrap();
      dispatch(fetchJournalEntries());
      Alert.alert('Success', 'Journal entry posted successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e || 'Failed to post journal entry');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Date picker helpers ───────────────────────────────
  const handleDateSelect = (selectedDate: string) => {
    setDate(selectedDate);
    setShowDatePicker(false);
  };

  // ─── Render ─────────────────────────────────────────────
  if (isLoadingEntry) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading entry...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ─── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Entry' : 'New Journal Entry'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Entry Header Card ──────────────────────────── */}
        <View style={styles.headerCard}>
          <Text style={styles.sectionLabel}>ENTRY DETAILS</Text>

          {/* Date Field */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>Date *</Text>
              <TouchableOpacity
                style={[
                  styles.dateInput,
                  hasAttemptedSubmit &&
                    validationResult?.errors.date &&
                    styles.inputError,
                ]}
                onPress={() => setShowDatePicker(!showDatePicker)}
                activeOpacity={0.7}
              >
                <Text
                  style={
                    date ? styles.dateText : styles.datePlaceholder
                  }
                >
                  {date ? formatDisplayDate(date) : 'Select date'}
                </Text>
                <Text style={styles.dateIcon}>📅</Text>
              </TouchableOpacity>
              {hasAttemptedSubmit && validationResult?.errors.date && (
                <Text style={styles.errorText}>
                  {validationResult.errors.date}
                </Text>
              )}
            </View>

            {/* Reference */}
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>Reference *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  hasAttemptedSubmit &&
                    validationResult?.errors.reference &&
                    styles.inputError,
                ]}
                value={reference}
                onChangeText={setReference}
                placeholder="JE-001"
                placeholderTextColor={Colors.placeholder}
              />
              {hasAttemptedSubmit && validationResult?.errors.reference && (
                <Text style={styles.errorText}>
                  {validationResult.errors.reference}
                </Text>
              )}
            </View>
          </View>

          {/* Memo */}
          <View style={styles.fieldFull}>
            <Text style={styles.inputLabel}>Memo</Text>
            <TextInput
              style={styles.memoInput}
              value={memo}
              onChangeText={setMemo}
              placeholder="Describe this journal entry..."
              placeholderTextColor={Colors.placeholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* ─── Simple Date Picker ─────────────────────────── */}
        {showDatePicker && (
          <View style={styles.datePickerCard}>
            <Text style={styles.datePickerTitle}>Select Date</Text>
            <View style={styles.datePickerRow}>
              {/* Quick date buttons */}
              <TouchableOpacity
                style={styles.quickDateBtn}
                onPress={() => handleDateSelect(todayISO())}
              >
                <Text style={styles.quickDateBtnText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickDateBtn}
                onPress={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  handleDateSelect(d.toISOString().split('T')[0]);
                }}
              >
                <Text style={styles.quickDateBtnText}>Yesterday</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              value={date}
              onChangeText={(text) => {
                setDate(text);
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.placeholder}
              onSubmitEditing={() => setShowDatePicker(false)}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.datePickerDone}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Lines Section ──────────────────────────────── */}
        <View style={styles.linesSection}>
          <View style={styles.linesSectionHeader}>
            <Text style={styles.sectionLabel}>JOURNAL LINES</Text>
            {hasAttemptedSubmit && validationResult?.errors.lines && (
              <Text style={styles.errorText}>
                {validationResult.errors.lines}
              </Text>
            )}
          </View>

          {/* Column Headers */}
          <View style={styles.colHeaders}>
            <Text style={[styles.colHeader, { flex: 1 }]}>Account</Text>
            <Text style={[styles.colHeader, { width: 90, textAlign: 'right' }]}>
              Debit
            </Text>
            <Text style={[styles.colHeader, { width: 90, textAlign: 'right' }]}>
              Credit
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Line Rows */}
          {lines.map((line, index) => (
            <JournalLineRow
              key={line.lineId}
              line={line}
              index={index}
              accountOptions={accountOptions}
              onUpdate={handleLineUpdate}
              onDelete={handleLineDelete}
              canDelete={lines.length > 2}
              errors={
                hasAttemptedSubmit
                  ? validationResult?.lineErrors[index]
                  : undefined
              }
            />
          ))}

          {/* Add Line Button */}
          <TouchableOpacity
            style={styles.addLineBtn}
            onPress={handleAddLine}
            activeOpacity={0.7}
          >
            <Text style={styles.addLineBtnText}>+ Add Line</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Totals & Balance ───────────────────────────── */}
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Debits</Text>
            <Text style={[styles.totalValue, { color: '#27AE60' }]}>
              {formatCurrency(totals.debits)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Credits</Text>
            <Text style={[styles.totalValue, { color: '#E74C3C' }]}>
              {formatCurrency(totals.credits)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Difference</Text>
            <Text
              style={[
                styles.totalValue,
                {
                  color: totals.isBalanced
                    ? Colors.success
                    : Colors.danger,
                  fontWeight: '800',
                },
              ]}
            >
              {formatCurrency(Math.abs(totals.debits - totals.credits))}
            </Text>
          </View>

          {/* Balance indicator */}
          <View
            style={[
              styles.balanceIndicator,
              totals.isBalanced
                ? styles.balanceIndicatorBalanced
                : styles.balanceIndicatorUnbalanced,
            ]}
          >
            <Text
              style={[
                styles.balanceIndicatorText,
                totals.isBalanced
                  ? styles.balanceTextBalanced
                  : styles.balanceTextUnbalanced,
              ]}
            >
              {totals.isBalanced ? '✓ Balanced' : '✗ Unbalanced'}
            </Text>
          </View>
        </View>

        {/* ─── Action Buttons ─────────────────────────────── */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.draftBtn]}
            onPress={handleSaveAsDraft}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.draftBtnText}>
                {isEditing ? 'Update Draft' : 'Save as Draft'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.postBtn,
              !totals.isBalanced && styles.postBtnDisabled,
            ]}
            onPress={handleSaveAndPost}
            activeOpacity={totals.isBalanced ? 0.7 : 1}
            disabled={isSaving || !totals.isBalanced}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text
                style={[
                  styles.postBtnText,
                  !totals.isBalanced && styles.postBtnTextDisabled,
                ]}
              >
                {isEditing ? 'Update & Post' : 'Save & Post'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
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

  // Header Card
  headerCard: {
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
  fieldRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldFull: {
    marginBottom: Spacing.xs,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  memoInput: {
    height: 72,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  errorText: {
    fontSize: 11,
    color: Colors.danger,
    marginTop: 2,
    fontWeight: '500',
  },

  // Date input
  dateInput: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  datePlaceholder: {
    fontSize: 14,
    color: Colors.placeholder,
  },
  dateIcon: {
    fontSize: 16,
  },

  // Date picker
  datePickerCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  datePickerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickDateBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.primaryLight + '14',
    borderRadius: BorderRadius.full,
  },
  quickDateBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  datePickerDone: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  datePickerDoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Lines section
  linesSection: {
    marginBottom: Spacing.base,
  },
  linesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    marginBottom: Spacing.xs,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  addLineBtn: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderStyle: 'dashed',
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary + '08',
  },
  addLineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Totals
  totalsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  balanceIndicator: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  balanceIndicatorBalanced: {
    backgroundColor: Colors.successLight,
  },
  balanceIndicatorUnbalanced: {
    backgroundColor: Colors.dangerLight,
  },
  balanceIndicatorText: {
    fontSize: 14,
    fontWeight: '700',
  },
  balanceTextBalanced: {
    color: Colors.success,
  },
  balanceTextUnbalanced: {
    color: Colors.danger,
  },

  // Actions
  actionsSection: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftBtn: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  draftBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  postBtn: {
    backgroundColor: Colors.primary,
  },
  postBtnDisabled: {
    backgroundColor: Colors.textDisabled,
  },
  postBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  postBtnTextDisabled: {
    color: Colors.white + '80',
  },
});

export default JEFormScreen;
