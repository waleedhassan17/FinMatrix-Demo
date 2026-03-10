// ============================================================
// FINMATRIX - Transfer Screen
// ============================================================

import React, { useState } from 'react';
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
import { createTransfer } from './bankingSlice';
import CustomDropdown from '../../Custom-Components/CustomDropdown';

// ─── Main Component ─────────────────────────────────────────
const TransferScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const accounts = useAppSelector((s) => s.banking.accounts);
  const preselectedFrom = route.params?.bankAccountId || '';

  const [fromAccountId, setFromAccountId] = useState(preselectedFrom);
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const accountOptions = accounts.map((a) => ({
    label: `${a.name} (${a.accountNumberMasked})`,
    value: a.accountId,
  }));

  const fromAccount = accounts.find((a) => a.accountId === fromAccountId);
  const toAccount = accounts.find((a) => a.accountId === toAccountId);

  const fmt = (n: number) =>
    `$${Math.abs(n).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleTransfer = async () => {
    if (!fromAccountId) return Alert.alert('Error', 'Select a source account');
    if (!toAccountId)
      return Alert.alert('Error', 'Select a destination account');
    if (fromAccountId === toAccountId)
      return Alert.alert('Error', 'From and To accounts must be different');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      return Alert.alert('Error', 'Enter a valid amount');

    setIsSaving(true);
    try {
      await dispatch(
        createTransfer({
          fromAccountId,
          toAccountId,
          amount: Number(amount),
          date,
          memo: memo.trim(),
        }),
      ).unwrap();

      Alert.alert('Success', 'Transfer completed', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Transfer failed');
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
        <Text style={styles.title}>Transfer Funds</Text>
        <Text style={styles.subtitle}>Move money between accounts</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Transfer Visual */}
        <View style={styles.transferVisual}>
          <View style={styles.visualAccount}>
            <Text style={styles.visualIcon}>🏦</Text>
            <Text style={styles.visualLabel}>From</Text>
            <Text style={styles.visualName} numberOfLines={1}>
              {fromAccount?.name || 'Select account'}
            </Text>
            {fromAccount && (
              <Text
                style={[
                  styles.visualBalance,
                  {
                    color:
                      fromAccount.currentBalance >= 0
                        ? Colors.success
                        : Colors.danger,
                  },
                ]}
              >
                {fmt(fromAccount.currentBalance)}
              </Text>
            )}
          </View>
          <View style={styles.visualArrow}>
            <Text style={styles.arrowText}>→</Text>
            {amount ? (
              <Text style={styles.arrowAmount}>{fmt(Number(amount))}</Text>
            ) : null}
          </View>
          <View style={styles.visualAccount}>
            <Text style={styles.visualIcon}>🏦</Text>
            <Text style={styles.visualLabel}>To</Text>
            <Text style={styles.visualName} numberOfLines={1}>
              {toAccount?.name || 'Select account'}
            </Text>
            {toAccount && (
              <Text
                style={[
                  styles.visualBalance,
                  {
                    color:
                      toAccount.currentBalance >= 0
                        ? Colors.success
                        : Colors.danger,
                  },
                ]}
              >
                {fmt(toAccount.currentBalance)}
              </Text>
            )}
          </View>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <CustomDropdown
            label="From Account *"
            options={accountOptions}
            value={fromAccountId}
            onChange={setFromAccountId}
            placeholder="Select source account"
          />

          <View style={{ height: Spacing.md }} />

          <CustomDropdown
            label="To Account *"
            options={accountOptions.filter((a) => a.value !== fromAccountId)}
            value={toAccountId}
            onChange={setToAccountId}
            placeholder="Select destination account"
          />

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
          </View>

          <Text style={styles.fieldLabel}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.placeholder}
            value={date}
            onChangeText={setDate}
          />

          <Text style={styles.fieldLabel}>Memo</Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
            placeholder="Transfer notes (optional)"
            placeholderTextColor={Colors.placeholder}
            value={memo}
            onChangeText={setMemo}
            multiline
          />
        </View>

        {/* Info Note */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            This transfer will create two matching transactions and a journal
            entry to keep your books balanced.
          </Text>
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
          style={[styles.transferBtn, isSaving && { opacity: 0.6 }]}
          onPress={handleTransfer}
          disabled={isSaving}
        >
          <Text style={styles.transferBtnText}>
            {isSaving ? 'Transferring...' : '🔄 Transfer Funds'}
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
  // Transfer visual
  transferVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  visualAccount: { flex: 1, alignItems: 'center' },
  visualIcon: { fontSize: 28, marginBottom: Spacing.xs },
  visualLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  visualName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  visualBalance: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  visualArrow: { paddingHorizontal: Spacing.md, alignItems: 'center' },
  arrowText: { fontSize: 24, color: Colors.primary, fontWeight: '700' },
  arrowAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
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
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  // Info
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.infoLight,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 16, marginRight: Spacing.sm },
  infoText: { flex: 1, fontSize: 13, color: Colors.info, lineHeight: 18 },
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
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  transferBtn: {
    flex: 2,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  transferBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});

export default TransferScreen;
