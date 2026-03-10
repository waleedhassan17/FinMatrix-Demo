// ============================================================
// FINMATRIX - Employee Form Screen  (Create / Edit)
// ============================================================
// Params: { employeeId? }
// Sections: Personal, Employment, Pay, Deductions, Banking
// Validate: first & last name required.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { createEmployee, updateEmployee } from './employeeSlice';
import { getEmployeeByIdAPI } from '../../network/employeeNetwork';
import { Employee, EmployeeDeduction } from '../../dummy-data/employees';
import {
  Department,
  PayType,
  DeductionType,
  DEPARTMENTS,
  DEDUCTION_TYPES,
  DEPARTMENT_COLORS,
  validateEmployee,
  EmployeeFormData,
} from '../../models/employeeModel';

// ─── Helpers ────────────────────────────────────────────────
const formatCurrency = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Reusable Sub-Components ────────────────────────────────
const SectionHeader: React.FC<{ title: string; icon: string }> = ({ title, icon }) => (
  <Text style={styles.sectionHeader}>
    {icon}  {title}
  </Text>
);

const FieldLabel: React.FC<{ label: string; required?: boolean }> = ({ label, required }) => (
  <Text style={styles.label}>
    {label}
    {required && <Text style={styles.required}> *</Text>}
  </Text>
);

// ─── Picker Row (simulated dropdown) ────────────────────────
const PickerRow: React.FC<{
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  colors?: Record<string, string>;
}> = ({ options, selected, onSelect, colors }) => (
  <View style={styles.pickerRow}>
    {options.map((o) => {
      const isActive = selected === o;
      const accent = colors?.[o] ?? Colors.primary;
      return (
        <TouchableOpacity
          key={o}
          style={[
            styles.pickerChip,
            isActive && { backgroundColor: accent + '18', borderColor: accent },
          ]}
          onPress={() => onSelect(o)}
          activeOpacity={0.7}
        >
          <Text style={[styles.pickerChipText, isActive && { color: accent, fontWeight: '700' }]}>
            {o}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Main Component ─────────────────────────────────────────
const EmployeeFormScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const employeeId: string | undefined = route.params?.employeeId;
  const isEdit = !!employeeId;

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Form state ────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState<Department>('Sales');
  const [position, setPosition] = useState('');
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [payType, setPayType] = useState<PayType>('salary');
  const [payRate, setPayRate] = useState('');
  const [overtimeRate, setOvertimeRate] = useState('');
  const [deductions, setDeductions] = useState<EmployeeDeduction[]>([
    { type: 'Federal Tax', rate: 0.22 },
    { type: 'Social Security', rate: 0.062 },
    { type: 'Medicare', rate: 0.0145 },
  ]);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [isActive, setIsActive] = useState(true);

  // ── Load existing ─────────────────────────────────
  useEffect(() => {
    if (!employeeId) return;
    (async () => {
      try {
        const emp = await getEmployeeByIdAPI(employeeId);
        setFirstName(emp.firstName);
        setLastName(emp.lastName);
        setEmail(emp.email);
        setPhone(emp.phone);
        setDepartment(emp.department);
        setPosition(emp.position);
        setHireDate(emp.hireDate);
        setPayType(emp.payType);
        setPayRate(emp.payType === 'salary' ? String(emp.payRate) : String(emp.payRate));
        setOvertimeRate(emp.overtimeRate != null ? String(emp.overtimeRate) : '');
        setDeductions(emp.deductions.map((d) => ({ ...d })));
        setBankName(emp.bankAccount.bankName);
        setAccountNumber('');
        setRoutingNumber('');
        setIsActive(emp.isActive);
      } catch {
        Alert.alert('Error', 'Could not load employee data.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [employeeId, navigation]);

  // ── Deduction helpers ─────────────────────────────
  const addDeduction = useCallback(() => {
    const used = new Set(deductions.map((d) => d.type));
    const next = DEDUCTION_TYPES.find((t) => !used.has(t));
    if (!next) {
      Alert.alert('All types added', 'All deduction types are already in the list.');
      return;
    }
    setDeductions((prev) => [...prev, { type: next, rate: 0 }]);
  }, [deductions]);

  const removeDeduction = useCallback((index: number) => {
    setDeductions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateDeductionType = useCallback((index: number, type: DeductionType) => {
    setDeductions((prev) => prev.map((d, i) => (i === index ? { ...d, type } : d)));
  }, []);

  const updateDeductionRate = useCallback((index: number, rate: string) => {
    const parsed = parseFloat(rate) || 0;
    setDeductions((prev) =>
      prev.map((d, i) => (i === index ? { ...d, rate: parsed } : d)),
    );
  }, []);

  // ── Available deduction types for a given index ───
  const availableTypes = useMemo(() => {
    const usedTypes = new Set(deductions.map((d) => d.type));
    return (index: number) => {
      const currentType = deductions[index]?.type;
      return DEDUCTION_TYPES.filter((t) => t === currentType || !usedTypes.has(t));
    };
  }, [deductions]);

  // ── Save ──────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const formData: EmployeeFormData = {
      firstName,
      lastName,
      email,
      phone,
      department,
      position,
      hireDate,
      payType,
      payRate: parseFloat(payRate) || 0,
      overtimeRate: payType === 'hourly' && overtimeRate ? parseFloat(overtimeRate) : null,
      deductions,
      bankName,
      accountNumber,
      routingNumber,
      isActive,
    };

    const validation = validateEmployee(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert('Validation Error', Object.values(validation.errors)[0]);
      return;
    }
    setErrors({});

    const employeeData: Omit<Employee, 'employeeId'> = {
      companyId: 'comp_001',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      department,
      position: position.trim(),
      hireDate,
      payType,
      payRate: parseFloat(payRate) || 0,
      overtimeRate: payType === 'hourly' && overtimeRate ? parseFloat(overtimeRate) : null,
      deductions,
      bankAccount: {
        bankName: bankName.trim(),
        accountNumberMasked: accountNumber ? `****${accountNumber.slice(-4)}` : '****0000',
        routingNumberMasked: routingNumber ? `****${routingNumber.slice(-4)}` : '****0000',
      },
      isActive,
      ytdGross: 0,
      ytdDeductions: 0,
      ytdNet: 0,
    };

    setIsSaving(true);
    try {
      if (isEdit && employeeId) {
        await dispatch(updateEmployee({ id: employeeId, data: employeeData })).unwrap();
      } else {
        await dispatch(createEmployee(employeeData)).unwrap();
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e || 'Failed to save employee.');
    } finally {
      setIsSaving(false);
    }
  }, [
    firstName, lastName, email, phone, department, position, hireDate,
    payType, payRate, overtimeRate, deductions, bankName, accountNumber,
    routingNumber, isActive, isEdit, employeeId, dispatch, navigation,
  ]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.headerBack}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Employee' : 'New Employee'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* ── Personal ───────────────────────────────────── */}
        <SectionHeader title="Personal Information" icon="👤" />
        <View style={styles.section}>
          <FieldLabel label="First Name" required />
          <TextInput
            style={[styles.input, errors.firstName && styles.inputError]}
            placeholder="First name"
            placeholderTextColor={Colors.placeholder}
            value={firstName}
            onChangeText={setFirstName}
          />

          <FieldLabel label="Last Name" required />
          <TextInput
            style={[styles.input, errors.lastName && styles.inputError]}
            placeholder="Last name"
            placeholderTextColor={Colors.placeholder}
            value={lastName}
            onChangeText={setLastName}
          />

          <FieldLabel label="Email" />
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="email@example.com"
            placeholderTextColor={Colors.placeholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <FieldLabel label="Phone" />
          <TextInput
            style={styles.input}
            placeholder="(555) 000-0000"
            placeholderTextColor={Colors.placeholder}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* ── Employment ─────────────────────────────────── */}
        <SectionHeader title="Employment" icon="🏢" />
        <View style={styles.section}>
          <FieldLabel label="Department" />
          <PickerRow
            options={DEPARTMENTS}
            selected={department}
            onSelect={(v) => setDepartment(v as Department)}
            colors={DEPARTMENT_COLORS}
          />

          <FieldLabel label="Position" />
          <TextInput
            style={styles.input}
            placeholder="Job title"
            placeholderTextColor={Colors.placeholder}
            value={position}
            onChangeText={setPosition}
          />

          <FieldLabel label="Hire Date" />
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.placeholder}
            value={hireDate}
            onChangeText={setHireDate}
          />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Active</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: Colors.border, true: Colors.success }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* ── Pay ────────────────────────────────────────── */}
        <SectionHeader title="Pay" icon="💰" />
        <View style={styles.section}>
          <FieldLabel label="Pay Type" />
          <View style={styles.payToggle}>
            <TouchableOpacity
              style={[styles.payToggleBtn, payType === 'salary' && styles.payToggleBtnActive]}
              onPress={() => setPayType('salary')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.payToggleBtnText,
                  payType === 'salary' && styles.payToggleBtnTextActive,
                ]}
              >
                💼 Salary
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.payToggleBtn, payType === 'hourly' && styles.payToggleBtnActive]}
              onPress={() => setPayType('hourly')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.payToggleBtnText,
                  payType === 'hourly' && styles.payToggleBtnTextActive,
                ]}
              >
                ⏰ Hourly
              </Text>
            </TouchableOpacity>
          </View>

          <FieldLabel label={payType === 'salary' ? 'Annual Salary ($)' : 'Hourly Rate ($)'} />
          <TextInput
            style={[styles.input, errors.payRate && styles.inputError]}
            placeholder={payType === 'salary' ? '75000' : '25'}
            placeholderTextColor={Colors.placeholder}
            value={payRate}
            onChangeText={setPayRate}
            keyboardType="numeric"
          />

          {payType === 'hourly' && (
            <>
              <FieldLabel label="Overtime Rate ($)" />
              <TextInput
                style={[styles.input, errors.overtimeRate && styles.inputError]}
                placeholder="37.50"
                placeholderTextColor={Colors.placeholder}
                value={overtimeRate}
                onChangeText={setOvertimeRate}
                keyboardType="numeric"
              />
            </>
          )}
        </View>

        {/* ── Deductions ─────────────────────────────────── */}
        <SectionHeader title="Deductions" icon="📋" />
        <View style={styles.section}>
          {deductions.map((d, idx) => (
            <View key={`ded-${idx}`} style={styles.deductionRow}>
              <View style={styles.deductionLeft}>
                <TouchableOpacity
                  style={styles.deductionTypeBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    const types = availableTypes(idx);
                    const currentIdx = types.indexOf(d.type);
                    const next = types[(currentIdx + 1) % types.length];
                    updateDeductionType(idx, next);
                  }}
                >
                  <Text style={styles.deductionTypeText} numberOfLines={1}>
                    {d.type}
                  </Text>
                  <Text style={styles.deductionTypeArrow}>▾</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.deductionRateInput}
                  placeholder="0.00"
                  placeholderTextColor={Colors.placeholder}
                  value={String(d.rate)}
                  onChangeText={(v) => updateDeductionRate(idx, v)}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity
                style={styles.deductionRemoveBtn}
                onPress={() => removeDeduction(idx)}
                activeOpacity={0.7}
              >
                <Text style={styles.deductionRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addDeductionBtn} onPress={addDeduction} activeOpacity={0.7}>
            <Text style={styles.addDeductionText}>+ Add Deduction</Text>
          </TouchableOpacity>
        </View>

        {/* ── Banking ────────────────────────────────────── */}
        <SectionHeader title="Banking" icon="🏦" />
        <View style={styles.section}>
          <FieldLabel label="Bank Name" />
          <TextInput
            style={styles.input}
            placeholder="Chase Bank"
            placeholderTextColor={Colors.placeholder}
            value={bankName}
            onChangeText={setBankName}
          />

          <FieldLabel label="Account Number" />
          <TextInput
            style={styles.input}
            placeholder="Enter account number"
            placeholderTextColor={Colors.placeholder}
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="number-pad"
            secureTextEntry
          />

          <FieldLabel label="Routing Number" />
          <TextInput
            style={styles.input}
            placeholder="Enter routing number"
            placeholderTextColor={Colors.placeholder}
            value={routingNumber}
            onChangeText={setRoutingNumber}
            keyboardType="number-pad"
            secureTextEntry
          />
        </View>
      </ScrollView>

      {/* ── Save Button ──────────────────────────────────── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>{isEdit ? 'Update Employee' : 'Create Employee'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBack: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },

  // Body
  body: { flex: 1 },
  bodyContent: { padding: Spacing.base, paddingBottom: 100 },

  // Section
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
    marginBottom: Spacing.sm,
  },

  // Fields
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, marginTop: Spacing.sm },
  required: { color: Colors.danger },
  input: {
    height: 44,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  inputError: { borderWidth: 1, borderColor: Colors.danger },

  // Picker row
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.xs },
  pickerChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.borderLight,
  },
  pickerChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },

  // Pay toggle
  payToggle: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  payToggleBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
  },
  payToggleBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  payToggleBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  payToggleBtnTextActive: { color: Colors.primary, fontWeight: '700' },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  // Deductions
  deductionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  deductionLeft: { flex: 1, flexDirection: 'row', gap: Spacing.sm },
  deductionTypeBtn: {
    flex: 2,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  deductionTypeText: { flex: 1, fontSize: 12, color: Colors.textPrimary },
  deductionTypeArrow: { fontSize: 10, color: Colors.textTertiary },
  deductionRateInput: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm,
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  deductionRemoveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deductionRemoveText: { fontSize: 14, color: Colors.danger, fontWeight: '700' },
  addDeductionBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  addDeductionText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // Bottom bar
  bottomBar: {
    padding: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.base,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});

export default EmployeeFormScreen;
