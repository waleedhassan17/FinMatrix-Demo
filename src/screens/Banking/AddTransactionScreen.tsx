// ============================================================
// FINMATRIX - Add Transaction Screen
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppSelector, useAppDispatch } from '../../hooks/useReduxHooks';
import { createBankTransaction } from './bankingSlice';
import { BankTxType } from '../../dummy-data/bankTransactions';
import { getNextRefNumberAPI } from '../../network/bankingNetwork';
import CustomDropdown from '../../Custom-Components/CustomDropdown';

// ─── Type Selector ──────────────────────────────────────────
const TX_TYPES: { key: BankTxType; label: string; icon: string }[] = [
  { key: 'check', label: 'Check', icon: '📝' },
  { key: 'deposit', label: 'Deposit', icon: '💰' },
  { key: 'transfer', label: 'Transfer', icon: '🔄' },
  { key: 'card_charge', label: 'Expense', icon: '💳' },
  { key: 'fee', label: 'Fee', icon: '🏦' },
];

// ─── Main Component ─────────────────────────────────────────
const AddTransactionScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { bankAccountId } = route.params;
  const dispatch = useAppDispatch();
  const accounts = useAppSelector((s) => s.banking.accounts);
  const coaAccounts = useAppSelector((s) => s.coa.accounts);
  const account = accounts.find((a) => a.accountId === bankAccountId);

  const [txType, setTxType] = useState<BankTxType>('check');
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState('');
  const [memo, setMemo] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-generate ref number on type change
  useEffect(() => {
    getNextRefNumberAPI(txType).then(setRefNumber);
  }, [txType]);

  // COA dropdown options
  const coaOptions = useMemo(
    () =>
      coaAccounts
        .filter((a) => a.isActive)
        .map((a) => ({
          label: `${a.accountNumber} – ${a.name}`,
          value: a.accountId,
        })),
    [coaAccounts],
  );

  const isPaymentType =
    txType === 'check' || txType === 'card_charge' || txType === 'fee';

  const handleSave = async () => {
    if (!payee.trim()) return Alert.alert('Error', 'Payee is required');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return Alert.alert('Error', 'Enter a valid amount');
    if (!accountId) return Alert.alert('Error', 'Select an account (COA)');

    setIsSaving(true);
    const numAmount = Number(amount);
    const finalAmount = isPaymentType ? -numAmount : numAmount;

    try {
      await dispatch(
        createBankTransaction({
          bankAccountId,
          date,
          payee: payee.trim(),
          description: memo.trim() || payee.trim(),
          type: txType,
          amount: finalAmount,
          checkNumber: txType === 'check' ? checkNumber || null : null,
          category: coaAccounts.find((a) => a.accountId === accountId)?.name || '',
          accountId,
          isCleared: false,
          isReconciled: false,
          referenceNumber: refNumber,
        }),
      ).unwrap();

      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>‹ Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Transaction</Text>
        <Text style={styles.subtitle}>
          {account?.name} · {account?.accountNumberMasked}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type Selector */}
        <Text style={styles.sectionLabel}>TRANSACTION TYPE</Text>
        <View style={styles.typeRow}>
          {TX_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.typeChip,
                txType === t.key && styles.typeChipActive,
              ]}
              onPress={() => setTxType(t.key)}
            >
              <Text style={styles.typeIcon}>{t.icon}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  txType === t.key && styles.typeLabelActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form Fields */}
        <View style={styles.formCard}>
          {/* Payee */}
          <Text style={styles.fieldLabel}>Payee *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter payee name"
            placeholderTextColor={Colors.placeholder}
            value={payee}
            onChangeText={setPayee}
          />

          {/* Amount */}
          <Text style={styles.fieldLabel}>Amount *</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountPrefix}>$</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="0.00"
              placeholderTextColor={Colors.placeholder}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <View
              style={[
                styles.amountBadge,
                {
                  backgroundColor: isPaymentType
                    ? Colors.dangerLight
                    : Colors.successLight,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isPaymentType ? Colors.danger : Colors.success,
                }}
              >
                {isPaymentType ? 'PAYMENT' : 'DEPOSIT'}
              </Text>
            </View>
          </View>

          {/* Date */}
          <Text style={styles.fieldLabel}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.placeholder}
            value={date}
            onChangeText={setDate}
          />

          {/* Account (COA) */}
          <CustomDropdown
            label="Account (COA) *"
            options={coaOptions}
            value={accountId}
            onChange={setAccountId}
            placeholder="Select account"
            searchable
          />

          {/* Memo */}
          <Text style={styles.fieldLabel}>Memo</Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
            placeholder="Description or memo"
            placeholderTextColor={Colors.placeholder}
            value={memo}
            onChangeText={setMemo}
            multiline
          />

          {/* Check Number (if check) */}
          {txType === 'check' && (
            <>
              <Text style={styles.fieldLabel}>Check #</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter check number"
                placeholderTextColor={Colors.placeholder}
                value={checkNumber}
                onChangeText={setCheckNumber}
                keyboardType="number-pad"
              />
            </>
          )}

          {/* Reference Number (auto) */}
          <Text style={styles.fieldLabel}>Reference #</Text>
          <TextInput
            style={[styles.input, styles.readonlyInput]}
            value={refNumber}
            editable={false}
          />
        </View>
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveBtnText}>
            {isSaving ? 'Saving...' : 'Save Transaction'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
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
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  // Type selector
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  typeChipActive: {
    backgroundColor: Colors.primary + '12',
    borderColor: Colors.primary,
  },
  typeIcon: { fontSize: 16, marginRight: Spacing.xs },
  typeLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  typeLabelActive: { color: Colors.primary },
  // Form
  formCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
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
  readonlyInput: {
    backgroundColor: Colors.background,
    color: Colors.textTertiary,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  amountBadge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  // Action bar
  actionBar: {
    flexDirection: 'row',
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.md,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: {
    flex: 2,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});

export default AddTransactionScreen;
