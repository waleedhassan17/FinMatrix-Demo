// ============================================================
// FINMATRIX - Bank Reconciliation Screen (Multi-Step)
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppSelector, useAppDispatch } from '../../hooks/useReduxHooks';
import {
  fetchBankAccounts,
  fetchBankTransactions,
} from './bankingSlice';
import { BankTransaction } from '../../dummy-data/bankTransactions';
import { BankAccount } from '../../dummy-data/bankAccounts';
import CustomDropdown from '../../Custom-Components/CustomDropdown';

// ─── Helpers ────────────────────────────────────────────────
const fmt = (n: number) =>
  `$${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtSigned = (n: number) =>
  `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${m}/${day}/${y}`;
};

// ─── Reconciliation History Storage (in-memory) ─────────────
export interface ReconciliationRecord {
  id: string;
  bankAccountId: string;
  accountName: string;
  statementDate: string;
  statementBalance: number;
  beginningBalance: number;
  clearedBalance: number;
  reconciledAt: string;
  transactionCount: number;
}

let reconciliationHistory: ReconciliationRecord[] = [
  {
    id: 'rec_001',
    bankAccountId: 'bank_001',
    accountName: 'Business Checking',
    statementDate: '2025-12-31',
    statementBalance: 28500,
    beginningBalance: 22000,
    clearedBalance: 28500,
    reconciledAt: '2026-01-05T10:30:00Z',
    transactionCount: 18,
  },
  {
    id: 'rec_002',
    bankAccountId: 'bank_002',
    accountName: 'Business Savings',
    statementDate: '2025-12-31',
    statementBalance: 10000,
    beginningBalance: 9500,
    clearedBalance: 10000,
    reconciledAt: '2026-01-05T11:00:00Z',
    transactionCount: 5,
  },
];

export const getReconciliationHistory = () => [...reconciliationHistory];

export const getLastReconciliation = (
  bankAccountId: string,
): ReconciliationRecord | undefined =>
  reconciliationHistory
    .filter((r) => r.bankAccountId === bankAccountId)
    .sort((a, b) => b.statementDate.localeCompare(a.statementDate))[0];

const saveReconciliation = (record: ReconciliationRecord) => {
  reconciliationHistory.push(record);
};

// ─── Step Indicator ─────────────────────────────────────────
const StepIndicator: React.FC<{ current: number }> = ({ current }) => {
  const steps = ['Setup', 'Clear', 'Finish'];
  return (
    <View style={styles.stepBar}>
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <View key={label} style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                isActive && styles.stepCircleActive,
                isDone && styles.stepCircleDone,
              ]}
            >
              <Text
                style={[
                  styles.stepNum,
                  (isActive || isDone) && styles.stepNumActive,
                ]}
              >
                {isDone ? '✓' : stepNum}
              </Text>
            </View>
            <Text
              style={[styles.stepLabel, isActive && styles.stepLabelActive]}
            >
              {label}
            </Text>
            {i < steps.length - 1 && <View style={styles.stepLine} />}
          </View>
        );
      })}
    </View>
  );
};

// ─── Clearable Transaction Row ──────────────────────────────
const ClearRow: React.FC<{
  tx: BankTransaction;
  isChecked: boolean;
  onToggle: () => void;
}> = ({ tx, isChecked, onToggle }) => (
  <TouchableOpacity
    style={[styles.clearRow, isChecked && styles.clearRowChecked]}
    onPress={onToggle}
    activeOpacity={0.7}
  >
    <View
      style={[styles.checkbox, isChecked && styles.checkboxChecked]}
    >
      {isChecked && <Text style={styles.checkmark}>✓</Text>}
    </View>
    <Text style={styles.clearDate}>{formatDate(tx.date)}</Text>
    <Text style={styles.clearPayee} numberOfLines={1}>
      {tx.payee}
    </Text>
    <Text
      style={[
        styles.clearAmount,
        { color: tx.amount < 0 ? Colors.danger : Colors.success },
      ]}
    >
      {fmtSigned(tx.amount)}
    </Text>
  </TouchableOpacity>
);

// ─── Main Component ─────────────────────────────────────────
const ReconciliationScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const { accounts, transactions, isLoading } = useAppSelector(
    (s) => s.banking,
  );

  // Step state
  const [step, setStep] = useState(1);

  // Step 1 – Setup
  const preselectedId = route.params?.bankAccountId || '';
  const [selectedAccountId, setSelectedAccountId] = useState(preselectedId);
  const [statementDate, setStatementDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [statementBalance, setStatementBalance] = useState('');
  const [beginningBalance, setBeginningBalance] = useState(0);

  // Step 2 – Clear
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());

  // Load data
  useEffect(() => {
    if (!accounts.length) dispatch(fetchBankAccounts());
  }, [dispatch, accounts.length]);

  // When account selected, load its transactions & compute beginning balance
  useEffect(() => {
    if (selectedAccountId) {
      dispatch(fetchBankTransactions(selectedAccountId));
      const lastRec = getLastReconciliation(selectedAccountId);
      if (lastRec) {
        setBeginningBalance(lastRec.statementBalance);
      } else {
        // No prior reconciliation – use 0 (opening balance)
        const acct = accounts.find(
          (a) => a.accountId === selectedAccountId,
        );
        setBeginningBalance(acct ? 0 : 0);
      }
    }
  }, [selectedAccountId, dispatch, accounts]);

  const selectedAccount = accounts.find(
    (a) => a.accountId === selectedAccountId,
  );

  // Account options
  const accountOptions = accounts.map((a: BankAccount) => ({
    label: `${a.name} (${a.accountNumberMasked})`,
    value: a.accountId,
  }));

  // Uncleared transactions up to statement date
  const unclearedTxs = useMemo(() => {
    if (!selectedAccountId) return [];
    return transactions
      .filter(
        (t) =>
          t.bankAccountId === selectedAccountId &&
          !t.isReconciled &&
          t.date <= statementDate,
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, selectedAccountId, statementDate]);

  const payments = useMemo(
    () => unclearedTxs.filter((t) => t.amount < 0),
    [unclearedTxs],
  );
  const deposits = useMemo(
    () => unclearedTxs.filter((t) => t.amount >= 0),
    [unclearedTxs],
  );

  // Toggle cleared
  const toggleCleared = useCallback((txId: string) => {
    setClearedIds((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) next.delete(txId);
      else next.add(txId);
      return next;
    });
  }, []);

  // Calculations
  const clearedPayments = useMemo(
    () =>
      payments
        .filter((t) => clearedIds.has(t.txId))
        .reduce((s, t) => s + t.amount, 0),
    [payments, clearedIds],
  );

  const clearedDeposits = useMemo(
    () =>
      deposits
        .filter((t) => clearedIds.has(t.txId))
        .reduce((s, t) => s + t.amount, 0),
    [deposits, clearedIds],
  );

  const clearedBalance = beginningBalance + clearedDeposits + clearedPayments;
  const stmtBal = Number(statementBalance) || 0;
  const difference = clearedBalance - stmtBal;
  const isBalanced = Math.abs(difference) < 0.005;

  // Step 1 validation
  const canProceedToStep2 =
    selectedAccountId && statementDate && statementBalance !== '';

  // ─── Handlers ──────────────────────────────────────
  const handleReconcile = () => {
    Alert.alert(
      'Confirm Reconciliation',
      `Mark ${clearedIds.size} transaction(s) as reconciled for ${selectedAccount?.name}?\n\nStatement Date: ${formatDate(statementDate)}\nStatement Balance: ${fmt(stmtBal)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reconcile',
          style: 'default',
          onPress: () => doReconcile(),
        },
      ],
    );
  };

  const doReconcile = () => {
    // Mark transactions as reconciled (in-memory)
    unclearedTxs.forEach((tx) => {
      if (clearedIds.has(tx.txId)) {
        tx.isReconciled = true;
        tx.isCleared = true;
      }
    });

    // Save record
    const record: ReconciliationRecord = {
      id: `rec_${String(reconciliationHistory.length + 1).padStart(3, '0')}`,
      bankAccountId: selectedAccountId,
      accountName: selectedAccount?.name || '',
      statementDate,
      statementBalance: stmtBal,
      beginningBalance,
      clearedBalance,
      reconciledAt: new Date().toISOString(),
      transactionCount: clearedIds.size,
    };
    saveReconciliation(record);

    setStep(3);
  };

  const handleAddAdjustment = () => {
    Alert.alert(
      'Add Adjustment',
      `Create a journal entry for the ${fmtSigned(difference)} discrepancy?\n\nThis will post an adjustment to balance the reconciliation.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Adjustment',
          onPress: () => {
            // Auto-clear the difference
            // In a real app this would create a JE. Here we just zero it out.
            const adjustedBal =
              Number(statementBalance) + difference;
            setStatementBalance(String(adjustedBal.toFixed(2)));
            Alert.alert(
              'Adjustment Created',
              'A journal entry has been created. The reconciliation is now balanced.',
            );
          },
        },
      ],
    );
  };

  // ─── Render Step 1: Setup ──────────────────────────
  const renderSetup = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.setupCard}>
        <Text style={styles.cardTitle}>Reconciliation Setup</Text>
        <Text style={styles.cardDesc}>
          Enter your bank statement details to begin reconciling.
        </Text>

        <View style={{ marginTop: Spacing.md }}>
          <CustomDropdown
            label="Bank Account *"
            options={accountOptions}
            value={selectedAccountId}
            onChange={setSelectedAccountId}
            placeholder="Select bank account"
          />
        </View>

        <Text style={styles.fieldLabel}>Statement Date *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.placeholder}
          value={statementDate}
          onChangeText={setStatementDate}
        />

        <Text style={styles.fieldLabel}>Statement Ending Balance *</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountPrefix}>$</Text>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="0.00"
            placeholderTextColor={Colors.placeholder}
            value={statementBalance}
            onChangeText={setStatementBalance}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.beginBalBox}>
          <Text style={styles.beginBalLabel}>Beginning Balance</Text>
          <Text style={styles.beginBalValue}>{fmtSigned(beginningBalance)}</Text>
          <Text style={styles.beginBalNote}>
            {getLastReconciliation(selectedAccountId)
              ? `From last reconciliation (${formatDate(getLastReconciliation(selectedAccountId)!.statementDate)})`
              : 'No prior reconciliation – using $0.00'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.primaryBtn,
          !canProceedToStep2 && styles.primaryBtnDisabled,
        ]}
        onPress={() => {
          if (canProceedToStep2) setStep(2);
        }}
        disabled={!canProceedToStep2}
      >
        <Text style={styles.primaryBtnText}>Continue to Clear Items →</Text>
      </TouchableOpacity>

      {/* History link */}
      <TouchableOpacity
        style={styles.historyLink}
        onPress={() =>
          navigation.navigate(ROUTES.RECONCILIATION_HISTORY, {
            bankAccountId: selectedAccountId,
          })
        }
      >
        <Text style={styles.historyLinkText}>
          📋 View Reconciliation History
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ─── Render Step 2: Clear ──────────────────────────
  const renderClear = () => (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Checks & Payments Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Checks & Payments ({payments.length})
          </Text>
          <TouchableOpacity
            onPress={() => {
              const allPaymentIds = payments.map((t) => t.txId);
              setClearedIds((prev) => {
                const next = new Set(prev);
                const allChecked = allPaymentIds.every((id) => next.has(id));
                if (allChecked) {
                  allPaymentIds.forEach((id) => next.delete(id));
                } else {
                  allPaymentIds.forEach((id) => next.add(id));
                }
                return next;
              });
            }}
          >
            <Text style={styles.selectAllText}>
              {payments.every((t) => clearedIds.has(t.txId))
                ? 'Deselect All'
                : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>
        {payments.length === 0 ? (
          <Text style={styles.emptySection}>
            No uncleared payments found
          </Text>
        ) : (
          payments.map((tx) => (
            <ClearRow
              key={tx.txId}
              tx={tx}
              isChecked={clearedIds.has(tx.txId)}
              onToggle={() => toggleCleared(tx.txId)}
            />
          ))
        )}

        {/* Deposits & Credits Section */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.md }]}>
          <Text style={styles.sectionTitle}>
            Deposits & Credits ({deposits.length})
          </Text>
          <TouchableOpacity
            onPress={() => {
              const allDepositIds = deposits.map((t) => t.txId);
              setClearedIds((prev) => {
                const next = new Set(prev);
                const allChecked = allDepositIds.every((id) => next.has(id));
                if (allChecked) {
                  allDepositIds.forEach((id) => next.delete(id));
                } else {
                  allDepositIds.forEach((id) => next.add(id));
                }
                return next;
              });
            }}
          >
            <Text style={styles.selectAllText}>
              {deposits.every((t) => clearedIds.has(t.txId))
                ? 'Deselect All'
                : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>
        {deposits.length === 0 ? (
          <Text style={styles.emptySection}>
            No uncleared deposits found
          </Text>
        ) : (
          deposits.map((tx) => (
            <ClearRow
              key={tx.txId}
              tx={tx}
              isChecked={clearedIds.has(tx.txId)}
              onToggle={() => toggleCleared(tx.txId)}
            />
          ))
        )}

        <View style={{ height: 200 }} />
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.stickyFooter}>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Cleared Balance:</Text>
          <Text style={styles.footerValue}>{fmtSigned(clearedBalance)}</Text>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Statement Balance:</Text>
          <Text style={styles.footerValue}>{fmtSigned(stmtBal)}</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Difference:</Text>
          {isBalanced ? (
            <View style={styles.balancedBadge}>
              <Text style={styles.balancedText}>✓ Balanced!</Text>
            </View>
          ) : (
            <Text style={styles.differenceText}>{fmtSigned(difference)}</Text>
          )}
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.backStepBtn}
            onPress={() => setStep(1)}
          >
            <Text style={styles.backStepText}>← Back</Text>
          </TouchableOpacity>
          {!isBalanced && (
            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={handleAddAdjustment}
            >
              <Text style={styles.adjustBtnText}>Add Adjustment</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.reconcileBtn,
              !isBalanced && styles.reconcileBtnDisabled,
            ]}
            onPress={handleReconcile}
            disabled={!isBalanced}
          >
            <Text style={styles.reconcileBtnText}>Reconcile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // ─── Render Step 3: Finish (Success) ───────────────
  const renderFinish = () => (
    <View style={styles.finishContainer}>
      <View style={styles.successCard}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.successTitle}>Reconciliation Complete!</Text>
        <Text style={styles.successDesc}>
          {selectedAccount?.name} has been successfully reconciled.
        </Text>

        <View style={styles.successDetails}>
          <View style={styles.successRow}>
            <Text style={styles.successLabel}>Statement Date</Text>
            <Text style={styles.successValue}>
              {formatDate(statementDate)}
            </Text>
          </View>
          <View style={styles.successRow}>
            <Text style={styles.successLabel}>Statement Balance</Text>
            <Text style={styles.successValue}>{fmtSigned(stmtBal)}</Text>
          </View>
          <View style={styles.successRow}>
            <Text style={styles.successLabel}>Transactions Cleared</Text>
            <Text style={styles.successValue}>{clearedIds.size}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryBtnText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.historyLink, { marginTop: Spacing.md }]}
          onPress={() =>
            navigation.navigate(ROUTES.RECONCILIATION_HISTORY, {
              bankAccountId: selectedAccountId,
            })
          }
        >
          <Text style={styles.historyLinkText}>View History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Main Render ───────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bank Reconciliation</Text>
        {selectedAccount && (
          <Text style={styles.subtitle}>
            {selectedAccount.name} · {selectedAccount.accountNumberMasked}
          </Text>
        )}
      </View>

      {/* Step Indicator */}
      <StepIndicator current={step} />

      {/* Step Content */}
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: Spacing.xxl }}
        />
      ) : step === 1 ? (
        renderSetup()
      ) : step === 2 ? (
        renderClear()
      ) : (
        renderFinish()
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginBottom: Spacing.sm },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  // Step Indicator
  stepBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  stepCircleActive: { backgroundColor: Colors.primary },
  stepCircleDone: { backgroundColor: Colors.success },
  stepNum: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textTertiary,
  },
  stepNumActive: { color: Colors.white },
  stepLabel: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '500',
    marginRight: Spacing.sm,
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: Colors.borderLight,
    marginRight: Spacing.sm,
  },
  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxxl },
  // Setup Card
  setupCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  beginBalBox: {
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  beginBalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.info,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  beginBalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  beginBalNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  // Primary button
  primaryBtn: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.lg,
    height: 50,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  // History link
  historyLink: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  historyLinkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Clear step – section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptySection: {
    textAlign: 'center',
    color: Colors.textTertiary,
    fontSize: 13,
    paddingVertical: Spacing.md,
  },
  // Clear row
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  clearRowChecked: {
    backgroundColor: Colors.successLight,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  clearDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    width: 70,
    fontWeight: '500',
  },
  clearPayee: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  clearAmount: {
    fontSize: 14,
    fontWeight: '700',
    width: 90,
    textAlign: 'right',
  },
  // Sticky Footer
  stickyFooter: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
    ...Shadows.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  footerLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  footerDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  balancedBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  balancedText: {
    color: Colors.success,
    fontWeight: '800',
    fontSize: 14,
  },
  differenceText: {
    color: Colors.danger,
    fontWeight: '800',
    fontSize: 16,
  },
  footerActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  backStepBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
  },
  backStepText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  adjustBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.warningLight,
  },
  adjustBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
  },
  reconcileBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.sm,
  },
  reconcileBtnDisabled: { opacity: 0.35 },
  reconcileBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  // Finish / Success
  finishContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
  },
  successCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.md,
  },
  successIcon: { fontSize: 48, marginBottom: Spacing.md },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  successDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  successDetails: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  successLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  successValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});

export default ReconciliationScreen;
