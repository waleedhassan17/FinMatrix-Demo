// ============================================================
// FINMATRIX - Customer Form Screen
// ============================================================
// Create or edit a customer with:
//  - Basic: Name*, Company, Email*, Phone
//  - Billing Address: Street*, City*, State*, ZIP*, Country dropdown
//  - Shipping: "Same as Billing" toggle
//  - Credit: Limit, Payment Terms dropdown
//  - Notes section

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import CustomDropdown from '../../Custom-Components/CustomDropdown';
import {
  validateCustomer,
  CustomerFormData,
  PAYMENT_TERMS_OPTIONS,
  COUNTRY_OPTIONS,
  blankAddress,
} from '../../models/customerModel';
import { createCustomer, updateCustomer, fetchCustomers } from './customerSlice';
import { getCustomerByIdAPI } from '../../network/customerNetwork';
import { Address, Customer } from '../../dummy-data/customers';

// ─── Main Component ─────────────────────────────────────────
const CustomerFormScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const customerId: string | undefined = route.params?.customerId;
  const isEditing = !!customerId;

  // ─── Form State ─────────────────────────────────────────
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [billingAddress, setBillingAddress] = useState<Address>(blankAddress());
  const [shippingAddress, setShippingAddress] = useState<Address>(blankAddress());
  const [sameAsBilling, setSameAsBilling] = useState(true);

  const [creditLimit, setCreditLimit] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('net_30');
  const [notes, setNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Load existing customer for editing ─────────────────
  useEffect(() => {
    if (isEditing && customerId) {
      setIsLoadingEntry(true);
      getCustomerByIdAPI(customerId)
        .then((c) => {
          setName(c.name);
          setCompany(c.company);
          setEmail(c.email);
          setPhone(c.phone);
          setBillingAddress(c.billingAddress);
          setShippingAddress(c.shippingAddress);
          setCreditLimit(String(c.creditLimit));
          setPaymentTerms(c.paymentTerms);
          // Check if addresses are identical
          const isSame =
            JSON.stringify(c.billingAddress) ===
            JSON.stringify(c.shippingAddress);
          setSameAsBilling(isSame);
        })
        .catch(() => {
          Alert.alert('Error', 'Failed to load customer');
          navigation.goBack();
        })
        .finally(() => setIsLoadingEntry(false));
    }
  }, [isEditing, customerId]);

  // ─── Billing address updater ────────────────────────────
  const updateBillingField = (field: keyof Address, value: string) => {
    setBillingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const updateShippingField = (field: keyof Address, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Save ───────────────────────────────────────────────
  const handleSave = async () => {
    setHasAttemptedSubmit(true);

    const formData: CustomerFormData = {
      name,
      company,
      email,
      phone,
      billingAddress,
      shippingAddress: sameAsBilling ? { ...billingAddress } : shippingAddress,
      sameAsShipping: sameAsBilling,
      creditLimit: parseFloat(creditLimit) || 0,
      paymentTerms: paymentTerms as CustomerFormData['paymentTerms'],
      notes,
    };

    const result = validateCustomer(formData);
    setErrors(result.errors);

    if (!result.isValid) {
      Alert.alert('Validation Error', 'Please fix the highlighted fields.');
      return;
    }

    setIsSaving(true);
    try {
      const customerData: Omit<Customer, 'customerId' | 'createdAt'> = {
        companyId: 'company_1',
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: { ...billingAddress },
        billingAddress: { ...billingAddress },
        shippingAddress: sameAsBilling
          ? { ...billingAddress }
          : { ...shippingAddress },
        creditLimit: parseFloat(creditLimit) || 0,
        paymentTerms: paymentTerms as Customer['paymentTerms'],
        balance: 0,
        totalPurchases: 0,
        isActive: true,
      };

      if (isEditing && customerId) {
        await dispatch(
          updateCustomer({ id: customerId, data: customerData })
        ).unwrap();
      } else {
        await dispatch(createCustomer(customerData)).unwrap();
      }
      dispatch(fetchCustomers());
      Alert.alert('Success', `Customer ${isEditing ? 'updated' : 'created'}.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e || 'Failed to save customer');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────
  if (isLoadingEntry) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading customer...</Text>
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
          {isEditing ? 'Edit Customer' : 'New Customer'}
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
            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={[
                styles.textInput,
                hasAttemptedSubmit && errors.name && styles.inputError,
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={Colors.placeholder}
            />
            {hasAttemptedSubmit && errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>

          <View style={styles.fieldFull}>
            <Text style={styles.inputLabel}>Company</Text>
            <TextInput
              style={styles.textInput}
              value={company}
              onChangeText={setCompany}
              placeholder="Company name"
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

        {/* ─── Billing Address ─────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>BILLING ADDRESS</Text>

          <View style={styles.fieldFull}>
            <Text style={styles.inputLabel}>Street *</Text>
            <TextInput
              style={[
                styles.textInput,
                hasAttemptedSubmit && errors.billingStreet && styles.inputError,
              ]}
              value={billingAddress.street}
              onChangeText={(v) => updateBillingField('street', v)}
              placeholder="123 Main St"
              placeholderTextColor={Colors.placeholder}
            />
            {hasAttemptedSubmit && errors.billingStreet && (
              <Text style={styles.errorText}>{errors.billingStreet}</Text>
            )}
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  hasAttemptedSubmit &&
                    errors.billingCity &&
                    styles.inputError,
                ]}
                value={billingAddress.city}
                onChangeText={(v) => updateBillingField('city', v)}
                placeholder="City"
                placeholderTextColor={Colors.placeholder}
              />
              {hasAttemptedSubmit && errors.billingCity && (
                <Text style={styles.errorText}>{errors.billingCity}</Text>
              )}
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>State *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  hasAttemptedSubmit &&
                    errors.billingState &&
                    styles.inputError,
                ]}
                value={billingAddress.state}
                onChangeText={(v) => updateBillingField('state', v)}
                placeholder="State"
                placeholderTextColor={Colors.placeholder}
              />
              {hasAttemptedSubmit && errors.billingState && (
                <Text style={styles.errorText}>{errors.billingState}</Text>
              )}
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>ZIP Code *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  hasAttemptedSubmit &&
                    errors.billingZip &&
                    styles.inputError,
                ]}
                value={billingAddress.zipCode}
                onChangeText={(v) => updateBillingField('zipCode', v)}
                placeholder="00000"
                placeholderTextColor={Colors.placeholder}
                keyboardType="number-pad"
              />
              {hasAttemptedSubmit && errors.billingZip && (
                <Text style={styles.errorText}>{errors.billingZip}</Text>
              )}
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>Country *</Text>
              <CustomDropdown
                label=""
                options={COUNTRY_OPTIONS}
                value={billingAddress.country}
                onChange={(v) => updateBillingField('country', v)}
                placeholder="Select country"
                error={
                  hasAttemptedSubmit ? errors.billingCountry : undefined
                }
              />
            </View>
          </View>
        </View>

        {/* ─── Shipping Address ────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.shippingHeader}>
            <Text style={styles.sectionLabel}>SHIPPING ADDRESS</Text>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Same as Billing</Text>
              <Switch
                value={sameAsBilling}
                onValueChange={setSameAsBilling}
                trackColor={{
                  false: Colors.border,
                  true: Colors.success + '60',
                }}
                thumbColor={sameAsBilling ? Colors.success : Colors.textDisabled}
              />
            </View>
          </View>

          {!sameAsBilling && (
            <>
              <View style={styles.fieldFull}>
                <Text style={styles.inputLabel}>Street</Text>
                <TextInput
                  style={styles.textInput}
                  value={shippingAddress.street}
                  onChangeText={(v) => updateShippingField('street', v)}
                  placeholder="123 Main St"
                  placeholderTextColor={Colors.placeholder}
                />
              </View>
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.textInput}
                    value={shippingAddress.city}
                    onChangeText={(v) => updateShippingField('city', v)}
                    placeholder="City"
                    placeholderTextColor={Colors.placeholder}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.inputLabel}>State</Text>
                  <TextInput
                    style={styles.textInput}
                    value={shippingAddress.state}
                    onChangeText={(v) => updateShippingField('state', v)}
                    placeholder="State"
                    placeholderTextColor={Colors.placeholder}
                  />
                </View>
              </View>
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Text style={styles.inputLabel}>ZIP Code</Text>
                  <TextInput
                    style={styles.textInput}
                    value={shippingAddress.zipCode}
                    onChangeText={(v) => updateShippingField('zipCode', v)}
                    placeholder="00000"
                    placeholderTextColor={Colors.placeholder}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <Text style={styles.inputLabel}>Country</Text>
                  <CustomDropdown
                    label=""
                    options={COUNTRY_OPTIONS}
                    value={shippingAddress.country}
                    onChange={(v) => updateShippingField('country', v)}
                    placeholder="Select country"
                  />
                </View>
              </View>
            </>
          )}
        </View>

        {/* ─── Credit & Terms ──────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>CREDIT & TERMS</Text>

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>Credit Limit</Text>
              <TextInput
                style={[
                  styles.textInput,
                  hasAttemptedSubmit &&
                    errors.creditLimit &&
                    styles.inputError,
                ]}
                value={creditLimit}
                onChangeText={setCreditLimit}
                placeholder="0.00"
                placeholderTextColor={Colors.placeholder}
                keyboardType="decimal-pad"
              />
              {hasAttemptedSubmit && errors.creditLimit && (
                <Text style={styles.errorText}>{errors.creditLimit}</Text>
              )}
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.inputLabel}>Payment Terms</Text>
              <CustomDropdown
                label=""
                options={PAYMENT_TERMS_OPTIONS}
                value={paymentTerms}
                onChange={setPaymentTerms}
                placeholder="Select terms"
              />
            </View>
          </View>
        </View>

        {/* ─── Notes ───────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>NOTES</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Internal notes about this customer..."
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
              {isEditing ? 'Update Customer' : 'Create Customer'}
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

  // Shipping toggle
  shippingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
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

export default CustomerFormScreen;
