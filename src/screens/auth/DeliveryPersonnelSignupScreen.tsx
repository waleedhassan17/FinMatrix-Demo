// ============================================================
// FINMATRIX - Delivery Personnel Signup (Redesigned)
// Improvements:
//  • AuthInput for all fields (icons, focus states, errors)
//  • Section headers use Ionicons + colored bar (no gradients)
//  • Vehicle type as tappable cards with icons
//  • Zone pills are larger and more tappable
//  • Company code gets its own focused section
//  • InlineBanner replaces Alert.alert()
//  • Loading spinner in submit button
// ============================================================
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, Typography, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { signUp } from './authSlice';
import AuthInput from '../../shared-components/AuthInput';
import InlineBanner from '../../shared-components/InlineBanner';

const VEHICLE_OPTIONS = [
  { label: 'Motorcycle', value: 'motorcycle', icon: 'bicycle-outline' as const },
  { label: 'Van', value: 'van', icon: 'car-outline' as const },
  { label: 'Truck', value: 'truck', icon: 'bus-outline' as const },
];
const ZONE_OPTIONS = ['Zone A', 'Zone B', 'Zone C', 'Zone D'];
const ACCENT = Colors.deliveryAccent;

const DeliveryPersonnelSignupScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [companyCode, setCompanyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const toggleZone = (zone: string) => setSelectedZones((prev) => prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!displayName.trim()) e.displayName = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!phone.trim()) e.phone = 'Phone number is required';
    if (!vehicleType) e.vehicleType = 'Vehicle type is required';
    if (!vehicleNumber.trim()) e.vehicleNumber = 'Vehicle number is required';
    if (selectedZones.length === 0) e.selectedZones = 'Select at least one zone';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    if (!companyCode.trim()) { setErrors((prev) => ({ ...prev, companyCode: 'Company code is required' })); return; }
    if (companyCode.length !== 6) { setErrors((prev) => ({ ...prev, companyCode: 'Code must be 6 digits' })); return; }

    setIsLoading(true);
    setApiError('');
    try {
      await dispatch(signUp({ email: email.trim().toLowerCase(), password, displayName: displayName.trim(), phoneNumber: phone.trim(), companyName: '', role: 'delivery_personnel' })).unwrap();
      navigation.reset({ index: 0, routes: [{ name: ROUTES.DELIVERY_ONBOARDING }] });
    } catch (err: any) {
      setApiError(err || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const SectionHeader = ({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) => (
    <View style={s.sectionRow}>
      <View style={s.sectionIconBadge}>
        <Ionicons name={icon} size={16} color={Colors.white} />
      </View>
      <Text style={s.sectionLabel}>{title}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={s.titleRow}>
            <View style={s.roleBadge}><Text style={s.roleBadgeText}>DELIVERY</Text></View>
          </View>
          <Text style={s.title}>Create Your Account</Text>
          <Text style={s.subtitle}>Join a delivery team and start managing your routes</Text>
        </View>

        <InlineBanner visible={!!apiError} message={apiError} variant="error" onDismiss={() => setApiError('')} />

        {/* Basic Info */}
        <SectionHeader icon="person-outline" title="Basic Information" />
        <AuthInput label="Full Name" leftIcon="person-outline" value={displayName} onChangeText={setDisplayName} placeholder="e.g. Imran Sheikh" error={errors.displayName} autoCapitalize="words" />
        <AuthInput label="Email" leftIcon="mail-outline" value={email} onChangeText={setEmail} placeholder="you@example.com" error={errors.email} keyboardType="email-address" autoCapitalize="none" />
        <AuthInput label="Password" leftIcon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="Min 6 characters" error={errors.password} isPassword />
        <AuthInput label="Confirm Password" leftIcon="lock-closed-outline" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" error={errors.confirmPassword} isPassword />

        {/* Delivery Details */}
        <SectionHeader icon="car-outline" title="Delivery Details" />
        <AuthInput label="Phone Number" leftIcon="call-outline" value={phone} onChangeText={setPhone} placeholder="+92-3XX-XXXXXXX" error={errors.phone} keyboardType="phone-pad" />

        <Text style={s.fieldLabel}>Vehicle Type *</Text>
        {errors.vehicleType && <Text style={s.errorText}>{errors.vehicleType}</Text>}
        <View style={s.vehicleRow}>
          {VEHICLE_OPTIONS.map((v) => {
            const sel = vehicleType === v.value;
            return (
              <TouchableOpacity key={v.value} style={[s.vehicleCard, sel && s.vehicleCardSel]} onPress={() => { setVehicleType(v.value); if (errors.vehicleType) setErrors((p) => ({ ...p, vehicleType: '' })); }}>
                <Ionicons name={v.icon} size={22} color={sel ? ACCENT : Colors.textTertiary} />
                <Text style={[s.vehicleLabel, sel && { color: ACCENT, fontFamily: Typography.fontFamily.semiBold }]}>{v.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <AuthInput label="Vehicle Number" leftIcon="pricetag-outline" value={vehicleNumber} onChangeText={setVehicleNumber} placeholder="e.g. LHR-1234" error={errors.vehicleNumber} autoCapitalize="characters" />

        <Text style={s.fieldLabel}>Preferred Zones *</Text>
        <View style={s.zoneContainer}>
          {ZONE_OPTIONS.map((zone) => {
            const sel = selectedZones.includes(zone);
            return (
              <TouchableOpacity key={zone} style={[s.zonePill, sel && s.zonePillActive]} onPress={() => toggleZone(zone)} activeOpacity={0.7}>
                {sel && <Ionicons name="checkmark-circle" size={14} color={ACCENT} style={{ marginRight: 4 }} />}
                <Text style={[s.zonePillText, sel && s.zonePillTextActive]}>{zone}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.selectedZones ? <Text style={s.errorText}>{errors.selectedZones}</Text> : null}

        {/* Company Code */}
        <SectionHeader icon="link-outline" title="Company Association" />
        <AuthInput label="Company Code (6 digits)" leftIcon="keypad-outline" value={companyCode}
          onChangeText={(t) => { setCompanyCode(t.replace(/[^0-9]/g, '').slice(0, 6)); if (errors.companyCode) setErrors((p) => ({ ...p, companyCode: '' })); }}
          placeholder="Enter 6-digit code" error={errors.companyCode} keyboardType="number-pad" maxLength={6} />

        <View style={s.hintCard}>
          <Ionicons name="information-circle" size={16} color={ACCENT} style={{ marginRight: Spacing.sm, marginTop: 1 }} />
          <Text style={s.hintText}>Ask your company administrator for the invite code. You'll be added to their delivery team.</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity onPress={handleSignup} disabled={isLoading} activeOpacity={0.85}
          style={[s.submitBtn, isLoading && s.submitBtnDisabled]}>
          {isLoading ? (
            <View style={s.loadingRow}><ActivityIndicator size="small" color={Colors.white} /><Text style={s.submitBtnText}>Creating Account...</Text></View>
          ) : (
            <><Text style={s.submitBtnText}>Create Account</Text><Ionicons name="arrow-forward" size={16} color={Colors.white} /></>
          )}
        </TouchableOpacity>

        <View style={s.loginFooter}>
          <View style={s.loginDivider} />
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.SIGN_IN)}>
            <Text style={s.loginLinkText}>Already have an account? <Text style={s.loginLinkBold}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: SAFE_TOP_PADDING + Spacing.sm, paddingBottom: Spacing.xxl },
  header: { marginBottom: Spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.sm, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg, ...Shadows.sm },
  titleRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  roleBadge: { backgroundColor: ACCENT, paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: BorderRadius.full },
  roleBadgeText: { fontSize: Typography.fontSize.tiny, fontFamily: Typography.fontFamily.bold, color: Colors.white, letterSpacing: 1.5 },
  title: { fontSize: Typography.fontSize.h2, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, lineHeight: 22 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, marginTop: Spacing.lg },
  sectionIconBadge: { width: 32, height: 32, borderRadius: 10, backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  sectionLabel: { fontSize: Typography.fontSize.h4, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary },
  fieldLabel: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  errorText: { fontSize: 12, color: Colors.danger, fontFamily: Typography.fontFamily.regular, marginTop: 2, marginBottom: Spacing.xs },
  vehicleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  vehicleCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.sm, backgroundColor: Colors.white, gap: 6 },
  vehicleCardSel: { borderColor: ACCENT, backgroundColor: ACCENT + '08' },
  vehicleLabel: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary },
  zoneContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xs },
  zonePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  zonePillActive: { borderColor: ACCENT, backgroundColor: ACCENT + '08' },
  zonePillText: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary },
  zonePillTextActive: { color: ACCENT, fontFamily: Typography.fontFamily.semiBold },
  hintCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: ACCENT + '08', borderRadius: BorderRadius.sm, padding: Spacing.md, marginTop: Spacing.sm, borderLeftWidth: 3, borderLeftColor: ACCENT },
  hintText: { flex: 1, fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, lineHeight: 18 },
  submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, borderRadius: BorderRadius.sm, marginTop: Spacing.xl, backgroundColor: ACCENT, gap: Spacing.sm, ...Shadows.sm },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.white, fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  loginFooter: { alignItems: 'center', marginTop: Spacing.xl, paddingBottom: Spacing.xl },
  loginDivider: { width: 40, height: 3, borderRadius: 2, backgroundColor: Colors.border, marginBottom: Spacing.md },
  loginLinkText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary },
  loginLinkBold: { fontFamily: Typography.fontFamily.semiBold, color: ACCENT },
});

export default DeliveryPersonnelSignupScreen;