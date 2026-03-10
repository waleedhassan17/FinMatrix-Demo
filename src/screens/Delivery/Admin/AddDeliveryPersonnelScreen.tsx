// ============================================================
// FINMATRIX - Add Delivery Personnel Screen (Admin)
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors, Spacing, BorderRadius, Shadows, Typography, SAFE_TOP_PADDING } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import { addPersonnel } from '../../../store/deliverySlice';
import { DeliveryPerson } from '../../../dummy-data/deliveryPersonnel';
import CustomInput from '../../../Custom-Components/CustomInput';
import CustomDropdown from '../../../Custom-Components/CustomDropdown';

// ── Constants ───────────────────────────────────────────────
const VEHICLE_OPTIONS = [
  { label: 'Motorcycle', value: 'motorcycle' },
  { label: 'Van', value: 'van' },
  { label: 'Truck', value: 'truck' },
];
const ZONE_OPTIONS = ['Zone A', 'Zone B', 'Zone C', 'Zone D'];

type MethodTab = 'invite' | 'quick';

// ── Component ───────────────────────────────────────────────
const AddDeliveryPersonnelScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const company = useAppSelector((s) => {
    const id = s.company.activeCompanyId;
    return s.company.companies.find((c) => c.companyId === id);
  });

  const [method, setMethod] = useState<MethodTab>('invite');

  // Quick add form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const inviteCode = company?.inviteCode ?? '------';

  // ── Copy code ─────────────────────────────────────────
  const copyCode = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert('Copied!', 'Invite code copied to clipboard.');
    } catch {
      Alert.alert('Code', inviteCode);
    }
  };

  // ── Toggle zone ───────────────────────────────────────
  const toggleZone = (z: string) => {
    setSelectedZones((prev) =>
      prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z],
    );
  };

  // ── Generate password ─────────────────────────────────
  const generatedPassword = 'dp' + Math.random().toString(36).slice(2, 8);

  // ── Validate ──────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!phone.trim()) e.phone = 'Phone is required';
    if (!vehicleType) e.vehicleType = 'Vehicle type is required';
    if (!vehicleNumber.trim()) e.vehicleNumber = 'Vehicle number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ──────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const record: DeliveryPerson = {
        userId: 'dp_' + Date.now(),
        displayName: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: generatedPassword,
        role: 'delivery',
        companyId: company?.companyId ?? 'company_1',
        isAvailable: true,
        currentLoad: 0,
        maxLoad: 15,
        rating: 0,
        totalDeliveries: 0,
        onTimeRate: 0,
        photoUrl: null,
        status: 'active',
        vehicleType: vehicleType as DeliveryPerson['vehicleType'],
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        zones: selectedZones,
        joinedAt: new Date().toISOString(),
      };
      dispatch(addPersonnel(record));
      Alert.alert(
        'Personnel Added',
        `${name} can login with:\nEmail: ${email}\nPassword: ${generatedPassword}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Personnel</Text>
        </View>

        {/* Method Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, method === 'invite' && styles.tabActive]}
            onPress={() => setMethod('invite')}
          >
            <Text style={[styles.tabText, method === 'invite' && styles.tabTextActive]}>
              Invite by Code
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, method === 'quick' && styles.tabActive]}
            onPress={() => setMethod('quick')}
          >
            <Text style={[styles.tabText, method === 'quick' && styles.tabTextActive]}>
              Quick Add
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {method === 'invite' ? (
            /* ── INVITE BY CODE ────────────────────────── */
            <View style={styles.inviteContainer}>
              <Text style={styles.inviteTitle}>Company Invite Code</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{inviteCode}</Text>
              </View>
              <TouchableOpacity style={styles.shareBtn} onPress={copyCode} activeOpacity={0.8}>
                <Text style={styles.shareBtnText}>📋 Copy Code</Text>
              </TouchableOpacity>
              <View style={styles.instructionBox}>
                <Text style={styles.instructionTitle}>How it works:</Text>
                <Text style={styles.instructionStep}>
                  1. Share this code with your delivery personnel
                </Text>
                <Text style={styles.instructionStep}>
                  2. They select "Delivery" role during signup
                </Text>
                <Text style={styles.instructionStep}>
                  3. They enter this code in the "Company Code" field
                </Text>
                <Text style={styles.instructionStep}>
                  4. They'll automatically join your company's delivery team
                </Text>
              </View>
            </View>
          ) : (
            /* ── QUICK ADD FORM ────────────────────────── */
            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>Pre-register a delivery person</Text>

              <CustomInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Ahmed Khan"
                error={errors.name}
                autoCapitalize="words"
              />
              <CustomInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <CustomInput
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="+92-3XX-XXXXXXX"
                error={errors.phone}
                keyboardType="phone-pad"
              />
              <CustomDropdown
                label="Vehicle Type"
                options={VEHICLE_OPTIONS}
                value={vehicleType}
                onChange={setVehicleType}
                placeholder="Select vehicle type"
                error={errors.vehicleType}
              />
              <CustomInput
                label="Vehicle Number"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                placeholder="e.g. LHR-1234"
                error={errors.vehicleNumber}
                autoCapitalize="characters"
              />

              {/* Zones Multi-Select */}
              <Text style={styles.fieldLabel}>Zones</Text>
              <View style={styles.zonesRow}>
                {ZONE_OPTIONS.map((z) => {
                  const sel = selectedZones.includes(z);
                  return (
                    <TouchableOpacity
                      key={z}
                      style={[styles.zonePill, sel && styles.zonePillActive]}
                      onPress={() => toggleZone(z)}
                    >
                      <Text style={[styles.zoneText, sel && styles.zoneTextActive]}>
                        {z}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Auto-generated password */}
              <View style={styles.passBox}>
                <Text style={styles.passLabel}>Initial Password (auto-generated)</Text>
                <Text style={styles.passValue}>{generatedPassword}</Text>
                <Text style={styles.passHint}>
                  Share these credentials with the delivery person
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>
                  {isSaving ? 'Adding...' : 'Add Personnel'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    paddingTop: SAFE_TOP_PADDING, paddingHorizontal: Spacing.base, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: BorderRadius.full,
    backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  backText: { fontSize: 20, color: Colors.textPrimary },
  headerTitle: { fontSize: Typography.fontSize.h4, fontWeight: '700', color: Colors.textPrimary },

  // Tabs
  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base, paddingBottom: Spacing.md, gap: Spacing.sm,
  },
  tab: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight, alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.deliveryAccent },
  tabText: { fontSize: Typography.fontSize.bodySmall, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },

  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.lg, paddingBottom: Spacing.xxxl },

  // Invite
  inviteContainer: { alignItems: 'center' },
  inviteTitle: { fontSize: Typography.fontSize.h4, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  codeBox: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl, paddingHorizontal: Spacing.xxxl,
    borderWidth: 2, borderColor: Colors.deliveryAccent, borderStyle: 'dashed',
    ...Shadows.md,
  },
  codeText: {
    fontSize: 36, fontWeight: '800', color: Colors.deliveryAccent,
    letterSpacing: 8, textAlign: 'center',
  },
  shareBtn: {
    backgroundColor: Colors.deliveryAccent, borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, marginTop: Spacing.lg,
  },
  shareBtnText: { color: Colors.white, fontSize: Typography.fontSize.body, fontWeight: '600' },
  instructionBox: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.base, marginTop: Spacing.xl, width: '100%', ...Shadows.sm,
  },
  instructionTitle: { fontSize: Typography.fontSize.body, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  instructionStep: { fontSize: Typography.fontSize.bodySmall, color: Colors.textSecondary, lineHeight: 22, marginBottom: 4 },

  // Quick Add Form
  formContainer: {},
  formLabel: { fontSize: Typography.fontSize.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.md },
  fieldLabel: { fontSize: Typography.fontSize.bodySmall, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.sm },
  zonesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  zonePill: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  zonePillActive: { borderColor: Colors.deliveryAccent, backgroundColor: Colors.deliveryAccent + '14' },
  zoneText: { fontSize: Typography.fontSize.caption, fontWeight: '500', color: Colors.textSecondary },
  zoneTextActive: { color: Colors.deliveryAccent, fontWeight: '600' },
  passBox: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.base, marginTop: Spacing.lg, ...Shadows.sm,
  },
  passLabel: { fontSize: Typography.fontSize.caption, color: Colors.textTertiary, marginBottom: Spacing.sm },
  passValue: { fontSize: Typography.fontSize.h3, fontWeight: '700', color: Colors.primary, letterSpacing: 2 },
  passHint: { fontSize: Typography.fontSize.tiny, color: Colors.textTertiary, marginTop: Spacing.sm },
  saveBtn: {
    backgroundColor: Colors.deliveryAccent, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2, alignItems: 'center', marginTop: Spacing.xl, ...Shadows.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontSize: Typography.fontSize.body, fontWeight: '600' },
});

export default AddDeliveryPersonnelScreen;
