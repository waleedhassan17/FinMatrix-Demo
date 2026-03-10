// ============================================================
// FINMATRIX - Chart of Accounts Add/Edit Form Screen
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, Layout, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { createAccount, editAccount } from './coaSlice';
import CustomInput from '../../Custom-Components/CustomInput';
import CustomDropdown from '../../Custom-Components/CustomDropdown';
import {
  validateAccount,
  AccountFormData,
  ACCOUNT_TYPE_OPTIONS,
  SUB_TYPE_OPTIONS,
  suggestNextAccountNumber,
} from '../../models/coaModel';
import { Account } from '../../dummy-data/chartOfAccounts';

// ─── Types ──────────────────────────────────────────────────
interface RouteParams {
  accountId?: string;
}

// ─── Main Component ─────────────────────────────────────────
const COAFormScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const { accounts } = useAppSelector((s) => s.coa);

  const accountId = (route.params as RouteParams)?.accountId;
  const isEditMode = !!accountId;
  const existingAccount = useMemo(
    () => accounts.find((a) => a.accountId === accountId),
    [accounts, accountId]
  );

  // ─── Form State ────────────────────────────────────────
  const [accountNumber, setAccountNumber] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [subType, setSubType] = useState('');
  const [parentAccountId, setParentAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // ─── Pre-fill in edit mode ─────────────────────────────
  useEffect(() => {
    if (isEditMode && existingAccount) {
      setAccountNumber(existingAccount.accountNumber);
      setName(existingAccount.name);
      setType(existingAccount.type);
      setSubType(existingAccount.subType);
      setParentAccountId(existingAccount.parentAccountId || '');
      setDescription(existingAccount.description);
      setOpeningBalance(String(existingAccount.openingBalance));
      setIsActive(existingAccount.isActive);
    }
  }, [isEditMode, existingAccount]);

  // ─── Derived Data ──────────────────────────────────────
  const subTypeOptions = useMemo(() => {
    if (!type) return [];
    return SUB_TYPE_OPTIONS[type as Account['type']] || [];
  }, [type]);

  const parentAccountOptions = useMemo(() => {
    if (!type) return [];
    return accounts
      .filter(
        (a) => a.type === type && a.accountId !== accountId && a.isActive
      )
      .map((a) => ({
        label: `${a.accountNumber} - ${a.name}`,
        value: a.accountId,
      }));
  }, [type, accounts, accountId]);

  const suggestedNumber = useMemo(() => {
    if (!type) return '';
    return suggestNextAccountNumber(type as Account['type'], accounts);
  }, [type, accounts]);

  // ─── Auto-suggest account number when type changes ─────
  useEffect(() => {
    if (!isEditMode && type && !accountNumber) {
      setAccountNumber(suggestedNumber);
    }
  }, [type, suggestedNumber, isEditMode]);

  // ─── Handle type change (reset subType) ────────────────
  const handleTypeChange = (newType: string) => {
    setType(newType);
    setSubType('');
    setParentAccountId('');
    // Clear type/subType errors
    setErrors((prev) => {
      const next = { ...prev };
      delete next.type;
      delete next.subType;
      return next;
    });
  };

  // ─── Save ──────────────────────────────────────────────
  const handleSave = async () => {
    const formData: AccountFormData = {
      accountNumber: accountNumber.trim(),
      name: name.trim(),
      type,
      subType,
      parentAccountId: parentAccountId || null,
      description: description.trim(),
      openingBalance: parseFloat(openingBalance) || 0,
      isActive,
    };

    const validationErrors = validateAccount(
      formData,
      accounts,
      isEditMode ? accountId : undefined
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);

    try {
      if (isEditMode && accountId) {
        await dispatch(
          editAccount({
            id: accountId,
            data: {
              accountNumber: formData.accountNumber,
              name: formData.name,
              type: formData.type as Account['type'],
              subType: formData.subType,
              parentAccountId: formData.parentAccountId,
              description: formData.description,
              openingBalance: formData.openingBalance,
              isActive: formData.isActive,
            },
          })
        ).unwrap();
        Alert.alert('Success', 'Account updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await dispatch(
          createAccount({
            companyId: 'company_1',
            accountNumber: formData.accountNumber,
            name: formData.name,
            type: formData.type as Account['type'],
            subType: formData.subType,
            parentAccountId: formData.parentAccountId,
            description: formData.description,
            openingBalance: formData.openingBalance,
            currentBalance: formData.openingBalance,
            isActive: formData.isActive,
          })
        ).unwrap();
        Alert.alert('Success', 'Account created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

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
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Account' : 'Add Account'}
        </Text>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.7}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ─── Form ───────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Account Type */}
        <CustomDropdown
          label="Account Type *"
          options={ACCOUNT_TYPE_OPTIONS}
          value={type}
          onChange={handleTypeChange}
          placeholder="Select account type"
          error={errors.type}
        />

        {/* Sub Type */}
        <CustomDropdown
          label="Sub Type *"
          options={subTypeOptions}
          value={subType}
          onChange={(v) => {
            setSubType(v);
            setErrors((prev) => {
              const next = { ...prev };
              delete next.subType;
              return next;
            });
          }}
          placeholder={
            type ? 'Select sub type' : 'Select account type first'
          }
          error={errors.subType}
          disabled={!type}
        />

        {/* Account Number */}
        <CustomInput
          label="Account Number *"
          value={accountNumber}
          onChangeText={(text) => {
            setAccountNumber(text);
            if (errors.accountNumber) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.accountNumber;
                return next;
              });
            }
          }}
          placeholder={suggestedNumber ? `e.g., ${suggestedNumber}` : 'e.g., 1000'}
          keyboardType="number-pad"
          error={errors.accountNumber}
        />

        {/* Account Name */}
        <CustomInput
          label="Account Name *"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.name;
                return next;
              });
            }
          }}
          placeholder="e.g., Cash on Hand"
          error={errors.name}
        />

        {/* Parent Account */}
        <CustomDropdown
          label="Parent Account"
          options={[
            { label: 'None (Top Level)', value: '' },
            ...parentAccountOptions,
          ]}
          value={parentAccountId}
          onChange={setParentAccountId}
          placeholder="Optional - select parent"
          searchable={parentAccountOptions.length > 5}
          disabled={!type}
        />

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Description</Text>
          <View style={styles.textAreaContainer}>
            <CustomInput
              label=""
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of this account..."
              multiline
              numberOfLines={3}
              style={styles.textAreaInput}
            />
          </View>
        </View>

        {/* Opening Balance */}
        <CustomInput
          label="Opening Balance"
          value={openingBalance}
          onChangeText={setOpeningBalance}
          placeholder="0.00"
          keyboardType="decimal-pad"
          leftIcon={<Text style={styles.currencyPrefix}>$</Text>}
        />

        {/* Is Active Toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Active Account</Text>
            <Text style={styles.toggleSubtext}>
              Inactive accounts won't appear in transactions
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{
              false: Colors.border,
              true: Colors.success + '60',
            }}
            thumbColor={isActive ? Colors.success : Colors.textTertiary}
          />
        </View>

        {/* Spacer for scroll */}
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
  saveBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },

  // Form
  scrollView: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
  },

  // Description field override
  fieldContainer: {
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  textAreaContainer: {
    marginTop: -8,
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },

  // Currency prefix
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.base,
  },
  toggleInfo: {
    flex: 1,
    marginRight: Spacing.base,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  toggleSubtext: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});

export default COAFormScreen;
