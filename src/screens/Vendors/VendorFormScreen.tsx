// ============================================================
// FINMATRIX - Vendor Form Screen
// ============================================================
// Create or edit a vendor with:
//  - Basic: Company Name*, Contact Person, Email*, Phone
//  - Address: Street*, City*, State*, ZIP*, Country dropdown
//  - Vendor Terms: Payment Terms dropdown, Tax ID
//  - Notes section

import React, { useState, useEffect } from 'react';
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
import { useAppDispatch } from '../../hooks/useReduxHooks';
import CustomDropdown from '../../Custom-Components/CustomDropdown';
import {
  validateVendor,
  VendorFormData,
  VENDOR_PAYMENT_TERMS_OPTIONS,
  COUNTRY_OPTIONS,
  blankVendorAddress,
} from '../../models/vendorModel';
import { createVendor, updateVendor, fetchVendors } from './vendorSlice';
import { getVendorByIdAPI } from '../../network/vendorNetwork';
import { Vendor, VendorAddress } from '../../dummy-data/vendors';

// ─── Main Component ─────────────────────────────────────────
const VendorFormScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const vendorId: string | undefined = route.params?.vendorId;
  const isEditing = !!vendorId;

  // ─── Form State ─────────────────────────────────────────
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [address, setAddress] = useState<VendorAddress>(blankVendorAddress());

  const [paymentTerms, setPaymentTerms] = useState('net_30');
  const [taxId, setTaxId] = useState('');
  const [defaultExpenseAccountId, setDefaultExpenseAccountId] = useState('');
  const [notes, setNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Load existing vendor for editing ───────────────────
  useEffect(() => {
    if (isEditing && vendorId) {
      setIsLoadingEntry(true);
      getVendorByIdAPI(vendorId)
        .then((v) => {
          setCompanyName(v.companyName);
          setContactPerson(v.contactPerson);
          setEmail(v.email);
          setPhone(v.phone);
          setAddress({ ...v.address });
          setPaymentTerms(v.paymentTerms);
          setTaxId(v.taxId || '');
          setDefaultExpenseAccountId(v.defaultExpenseAccountId || '');
        })
        .catch(() => {
          Alert.alert('Error', 'Failed to load vendor');
          navigation.goBack();
        })
        .finally(() => setIsLoadingEntry(false));
    }
  }, [isEditing, vendorId]);

  // ─── Address updater ────────────────────────────────────
  const updateAddressField = (field: keyof VendorAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Save ───────────────────────────────────────────────
  const handleSave = async () => {
    setHasAttemptedSubmit(true);

    const formData: VendorFormData = {
      companyName,
      contactPerson,
      email,
      phone,
      address,
      paymentTerms,
      taxId,
      defaultExpenseAccountId,
    };

    const result = validateVendor(formData);
    setErrors(result.errors);

    if (!result.isValid) {
      Alert.alert('Validation Error', 'Please fix the highlighted fields.');
      return;
    }

    setIsSaving(true);
    try {
      const vendorData: Omit<Vendor, 'vendorId' | 'createdAt'> = {
        companyId: 'company_1',
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: { ...address },
        paymentTerms: paymentTerms as Vendor['paymentTerms'],
        taxId: taxId.trim() || null,
        defaultExpenseAccountId: defaultExpenseAccountId.trim() || null,
        balance: 0,
        totalPurchases: 0,
        isActive: true,
      };

      if (isEditing && vendorId) {
        await dispatch(
          updateVendor({ id: vendorId, data: vendorData })
        ).unwrap();
      } else {
        await dispatch(createVendor(vendorData)).unwrap();
      }
      dispatch(fetchVendors());
      Alert.alert('Success', `Vendor ${isEditing ? 'updated' : 'created'}.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e || 'Failed to save vendor');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────
  if (isLoadingEntry) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading vendor...</Text>
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
          {isEditing ? 'Edit Vendor' : 'New Vendor'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Basic Info ──────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>BASIC INFORMATION</Text>

          <View style={styles.fieldFull}>
            <Text style={styles.inputLabel}>Company Name *</Text>
            <TextInput
              style={[
                styles.textInput,
                hasAttemptedSubmit && errors.companyName && styles.inputError,
              ]}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Company name"
              placeholderTextColor={Colors.placeholder}
            />
            {hasAttemptedSubmit && errors.companyName && (
              <Text style={styles.errorText}>{errors.companyName}</Text>
            )}
          </View>

          <View style={styles.fieldFull}>
            <Text style={styles.inputLabel}>Contact Person</Text>
            <TextInput
              style={styles.textInput}
              value={contactPerson}
              onChangeText={setContactPerson}
              placeholder="Primary contact name"
              placeholderTextColor={Colors.placeholder}
            />
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  hasAttemptedSubmit && errors.email && styles.inputError,
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={Colors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {hasAttemptedSubmit && errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="(555) 000-0000"
                placeholderTextColor={Colors.placeholder}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* ─── Address ─────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>ADDRESS</Text>

          <View style={styles.fieldFull}>
            <Text style={styles.inputLabel}>Street *</Text>
            <TextInput
              style={[
                styles.textInput,
                hasAttemptedSubmit && errors.street && styles.inputError,
              ]}
              value={address.street}
              onChangeText={(v) => updateAddressField('street', v)}
              placeholder="123 Main St"
              placeholderTextColor={Colors.placeholder}
            />
            {hasAttemptedSubmit && errors.street && (
              <Text style={styles.errorText}>{errors.street}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  hasAttemptedSubmit && errors.city && styles.inputError,
                ]}
                value={address.city}
                onChangeText={(v) => updateAddressField('city', v)}
                placeholder="City"
                placeholderTextColor={Colors.placeholder}
              />
              {hasAttemptedSubmit && errors.city && (
                <Text style={styles.errorText}>{errors.city}</Text>
              )}
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>State *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  hasAttemptedSubmit && errors.state && styles.inputError,
                ]}
                value={address.state}
                onChangeText={(v) => updateAddressField('state', v)}
                placeholder="State"
                placeholderTextColor={Colors.placeholder}
              />
              {hasAttemptedSubmit && errors.state && (
                <Text style={styles.errorText}>{errors.state}</Text>
              )}
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>ZIP Code *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  hasAttemptedSubmit && errors.zipCode && styles.inputError,
                ]}
                value={address.zipCode}
                onChangeText={(v) => updateAddressField('zipCode', v)}
                placeholder="00000"
                placeholderTextColor={Colors.placeholder}
                keyboardType="number-pad"
              />
              {hasAttemptedSubmit && errors.zipCode && (
                <Text style={styles.errorText}>{errors.zipCode}</Text>
              )}
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>Country *</Text>
              <CustomDropdown
                label=""
                options={COUNTRY_OPTIONS}
                value={address.country}
                onChange={(v) => updateAddressField('country', v)}
                placeholder="Select country"
                error={hasAttemptedSubmit ? errors.country : undefined}
              />
            </View>
          </View>
        </View>

        {/* ─── Vendor Terms ────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>VENDOR TERMS</Text>

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>Payment Terms</Text>
              <CustomDropdown
                label=""
                options={VENDOR_PAYMENT_TERMS_OPTIONS}
                value={paymentTerms}
                onChange={setPaymentTerms}
                placeholder="Select terms"
              />
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>Tax ID</Text>
              <TextInput
                style={styles.textInput}
                value={taxId}
                onChangeText={setTaxId}
                placeholder="XX-XXXXXXX"
                placeholderTextColor={Colors.placeholder}
              />
            </View>
          </View>

          <View style={styles.fieldFull}>
            <Text style={styles.inputLabel}>Default Expense Account</Text>
            <TextInput
              style={styles.textInput}
              value={defaultExpenseAccountId}
              onChangeText={setDefaultExpenseAccountId}
              placeholder="e.g. acct_office_supplies"
              placeholderTextColor={Colors.placeholder}
            />
          </View>
        </View>

        {/* ─── Notes ───────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>NOTES</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Internal notes about this vendor..."
            placeholderTextColor={Colors.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* ─── Save Button ─────────────────────────────────── */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.7}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEditing ? 'Update Vendor' : 'Create Vendor'}
            </Text>
          )}
        </TouchableOpacity>

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
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.base },

  // Section Card
  sectionCard: {
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
  fieldFull: {
    marginBottom: Spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  fieldHalf: {
    flex: 1,
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
  errorText: {
    fontSize: 11,
    color: Colors.danger,
    marginTop: 2,
    fontWeight: '500',
  },
  notesInput: {
    height: 90,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },

  // Save button
  saveBtn: {
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default VendorFormScreen;
