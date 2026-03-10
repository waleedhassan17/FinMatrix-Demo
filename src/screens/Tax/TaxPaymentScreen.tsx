// ============================================================
// FINMATRIX - Tax Payment Screen
// ============================================================
// Select tax, amount, date, bank account, reference. Save.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { fetchTaxRates, recordTaxPayment } from './taxSlice';

// Bank accounts for selection
const BANK_ACCOUNTS = [
  { id: 'acc_001', name: 'Cash' },
  { id: 'acc_002', name: 'Checking Account' },
  { id: 'acc_003', name: 'Savings Account' },
];

const TaxPaymentScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { rates } = useAppSelector((s) => s.tax);

  const [selectedTaxId, setSelectedTaxId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('2026-03-03');
  const [bankId, setBankId] = useState('acc_002');
  const [reference, setReference] = useState('');

  useEffect(() => {
    if (rates.length === 0) dispatch(fetchTaxRates());
  }, []);

  const selectedTax = rates.find((r) => r.taxId === selectedTaxId);
  const selectedBank = BANK_ACCOUNTS.find((b) => b.id === bankId);

  const handleSave = () => {
    if (!selectedTaxId) {
      Alert.alert('Validation', 'Please select a tax.');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Validation', 'Please enter a valid amount.');
      return;
    }
    if (!date) {
      Alert.alert('Validation', 'Please enter a date.');
      return;
    }

    dispatch(
      recordTaxPayment({
        taxId: selectedTaxId,
        taxName: selectedTax?.name ?? '',
        amount: amt,
        date,
        bankAccountId: bankId,
        bankAccountName: selectedBank?.name ?? '',
        reference: reference.trim() || `TAX-${Date.now()}`,
      }),
    );

    Alert.alert('Success', 'Tax payment recorded.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Record Tax Payment</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveHeaderText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Select Tax */}
        <Text style={styles.fieldLabel}>Select Tax *</Text>
        <View style={styles.chipRow}>
          {rates
            .filter((r) => r.isActive)
            .map((rate) => {
              const sel = selectedTaxId === rate.taxId;
              return (
                <TouchableOpacity
                  key={rate.taxId}
                  style={[
                    styles.chip,
                    sel && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                  ]}
                  onPress={() => setSelectedTaxId(rate.taxId)}
                >
                  <Text
                    style={[styles.chipText, sel && { color: Colors.white }]}
                  >
                    {rate.name} ({rate.rate}%)
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>

        {/* Amount */}
        <Text style={styles.fieldLabel}>Amount *</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={Colors.placeholder}
          keyboardType="numeric"
        />

        {/* Date */}
        <Text style={styles.fieldLabel}>Payment Date *</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.placeholder}
        />

        {/* Bank Account */}
        <Text style={styles.fieldLabel}>Bank Account</Text>
        <View style={styles.chipRow}>
          {BANK_ACCOUNTS.map((acct) => {
            const sel = bankId === acct.id;
            return (
              <TouchableOpacity
                key={acct.id}
                style={[
                  styles.chip,
                  sel && { backgroundColor: Colors.info, borderColor: Colors.info },
                ]}
                onPress={() => setBankId(acct.id)}
              >
                <Text
                  style={[styles.chipText, sel && { color: Colors.white }]}
                >
                  {acct.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Reference */}
        <Text style={styles.fieldLabel}>Reference / Memo</Text>
        <TextInput
          style={styles.input}
          value={reference}
          onChangeText={setReference}
          placeholder="e.g. TAX-2026-004"
          placeholderTextColor={Colors.placeholder}
        />

        {/* Preview card */}
        {selectedTax && amount && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Payment Summary</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Tax</Text>
              <Text style={styles.previewValue}>{selectedTax.name}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Amount</Text>
              <Text style={[styles.previewValue, { color: Colors.primary, fontWeight: '800' }]}>
                $
                {parseFloat(amount).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Date</Text>
              <Text style={styles.previewValue}>{date}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Account</Text>
              <Text style={styles.previewValue}>{selectedBank?.name}</Text>
            </View>
          </View>
        )}

        {/* Save button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>💳 Record Payment</Text>
        </TouchableOpacity>
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
  saveHeaderText: { fontSize: 15, color: Colors.success, fontWeight: '700' },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.huge },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  input: {
    height: 48,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    ...Shadows.sm,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },

  // Preview
  previewCard: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    ...Shadows.sm,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  previewLabel: { fontSize: 13, color: Colors.textSecondary },
  previewValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },

  // Save
  saveBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.md,
  },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});

export default TaxPaymentScreen;
