// ============================================================
// FINMATRIX - Sign Up Screen (Redesigned)
// Improvements:
//  • Sectioned form with divider headers
//  • Custom checkbox for terms (replaces Switch)
//  • Live password strength meter (5-segment bar)
//  • InlineBanner for errors and success (no Alert.alert)
//  • Auto-navigate to SignIn on success after brief delay
//  • Consistent use of AuthInput with icons
// ============================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { signUp, clearError, clearSignUpSuccess } from './authSlice';
import { validateSignUp, SignUpModel } from '../../models/authModel';
import { UserRole } from '../../types';
import AuthLayout from '../../shared-components/AuthLayout';
import AuthInput from '../../shared-components/AuthInput';
import InlineBanner from '../../shared-components/InlineBanner';

const SignUpScreen = ({ navigation, route }: any) => {
  const role: UserRole = route.params?.role || 'administrator';
  const dispatch = useAppDispatch();
  const { isLoading, error, signUpSuccess } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState<SignUpModel>({
    fullName: '', email: '', password: '', confirmPassword: '',
    phoneNumber: '', companyName: '', agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showApiError, setShowApiError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isAdmin = role === 'administrator';
  const accent = isAdmin ? Colors.primary : Colors.deliveryAccent;

  useEffect(() => {
    if (signUpSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        dispatch(clearSignUpSuccess());
        navigation.replace(ROUTES.SIGN_IN, { role });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [signUpSuccess]);

  useEffect(() => {
    if (error) setShowApiError(true);
  }, [error]);

  const dismissError = useCallback(() => {
    setShowApiError(false);
    dispatch(clearError());
  }, [dispatch]);

  const update = (field: keyof SignUpModel, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSignUp = () => {
    const v = validateSignUp(form);
    setErrors(v);
    if (Object.keys(v).length === 0) {
      dispatch(signUp({
        email: form.email, password: form.password, displayName: form.fullName,
        phoneNumber: form.phoneNumber, companyName: form.companyName, role,
      }));
    }
  };

  const pwStrength = useMemo(() => {
    const pw = form.password;
    if (!pw) return { level: 0, label: '', color: Colors.border };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++;
    if (score <= 2) return { level: score, label: 'Weak', color: Colors.danger };
    if (score <= 3) return { level: score, label: 'Fair', color: '#F59E0B' };
    if (score <= 4) return { level: score, label: 'Good', color: Colors.info };
    return { level: score, label: 'Strong', color: Colors.success };
  }, [form.password]);

  const SectionHeader = ({ title }: { title: string }) => (
    <View style={s.sectionHeader}>
      <View style={s.sectionLine} />
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionLine} />
    </View>
  );

  return (
    <AuthLayout scrollable topBarTitle="Create Account">
      <View style={s.header}>
        <Text style={[s.roleText, { color: accent }]}>
          {isAdmin ? 'Administrator' : 'Delivery Personnel'}
        </Text>
        <Text style={s.title}>Set up your account</Text>
        <Text style={s.subtitle}>Fill in your details to get started with FinMatrix</Text>
      </View>

      <InlineBanner visible={showApiError} message={error || 'Something went wrong.'} variant="error" onDismiss={dismissError} />
      <InlineBanner visible={showSuccess} message="Account created successfully! Redirecting..." variant="success" dismissible={false} />

      <SectionHeader title="Personal Information" />

      <AuthInput label="Full Name" leftIcon="person-outline" placeholder="Enter your full name"
        value={form.fullName} onChangeText={(t) => update('fullName', t)} error={errors.fullName} autoCapitalize="words" />
      <AuthInput label="Email Address" leftIcon="mail-outline" placeholder="you@company.com"
        value={form.email} onChangeText={(t) => update('email', t)} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
      <AuthInput label="Phone Number" leftIcon="call-outline" placeholder="+92-3XX-XXXXXXX"
        value={form.phoneNumber} onChangeText={(t) => update('phoneNumber', t)} keyboardType="phone-pad" hint="Optional — used for account recovery" />

      {isAdmin && (
        <>
          <SectionHeader title="Company Details" />
          <AuthInput label="Company Name" leftIcon="business-outline" placeholder="Your company name"
            value={form.companyName} onChangeText={(t) => update('companyName', t)} error={errors.companyName} />
        </>
      )}

      <SectionHeader title="Create Password" />

      <AuthInput label="Password" leftIcon="lock-closed-outline" placeholder="Create a strong password"
        value={form.password} onChangeText={(t) => update('password', t)} error={errors.password} isPassword />

      {form.password.length > 0 && (
        <View style={s.strengthRow}>
          <View style={s.strengthTrack}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={[s.strengthSeg, { backgroundColor: i <= pwStrength.level ? pwStrength.color : Colors.border }]} />
            ))}
          </View>
          <Text style={[s.strengthLabel, { color: pwStrength.color }]}>{pwStrength.label}</Text>
        </View>
      )}

      <AuthInput label="Confirm Password" leftIcon="lock-closed-outline" placeholder="Re-enter your password"
        value={form.confirmPassword} onChangeText={(t) => update('confirmPassword', t)} error={errors.confirmPassword} isPassword />

      {/* Terms Checkbox */}
      <TouchableOpacity style={s.termsRow} onPress={() => update('agreeToTerms', !form.agreeToTerms)} activeOpacity={0.7}>
        <View style={[s.checkbox, form.agreeToTerms && [s.checkboxActive, { backgroundColor: accent, borderColor: accent }]]}>
          {form.agreeToTerms && <Ionicons name="checkmark" size={14} color={Colors.white} />}
        </View>
        <Text style={s.termsText}>
          I agree to the <Text style={[s.termsLink, { color: accent }]}>Terms of Service</Text> and{' '}
          <Text style={[s.termsLink, { color: accent }]}>Privacy Policy</Text>
        </Text>
      </TouchableOpacity>
      {errors.agreeToTerms && <Text style={s.termsError}>{errors.agreeToTerms}</Text>}

      <TouchableOpacity
        style={[s.primaryBtn, { backgroundColor: accent }, isLoading && s.btnDisabled]}
        onPress={handleSignUp} disabled={isLoading} activeOpacity={0.85}
      >
        {isLoading ? (
          <View style={s.loadingRow}>
            <ActivityIndicator size="small" color={Colors.white} />
            <Text style={s.primaryBtnText}>Creating account...</Text>
          </View>
        ) : (
          <Text style={s.primaryBtnText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <View style={s.footer}>
        <View style={s.footerDivider} />
        <View style={s.footerRow}>
          <Text style={s.footerLabel}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.SIGN_IN, { role })}>
            <Text style={[s.footerLink, { color: accent }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthLayout>
  );
};

const s = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: Spacing.md, paddingBottom: Spacing.base },
  roleText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.semiBold, letterSpacing: 0.5, textTransform: 'uppercase' },
  title: { fontSize: Typography.fontSize.h3, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginTop: Spacing.xs },
  subtitle: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, marginTop: 3, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.sm },
  sectionLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  sectionTitle: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.semiBold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginHorizontal: Spacing.md },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: -Spacing.sm, marginBottom: Spacing.sm, paddingHorizontal: 2 },
  strengthTrack: { flexDirection: 'row', flex: 1, gap: 3, marginRight: Spacing.sm },
  strengthSeg: { flex: 1, height: 3, borderRadius: 1.5 },
  strengthLabel: { fontSize: 11, fontFamily: Typography.fontFamily.semiBold, minWidth: 40, textAlign: 'right' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: Spacing.base, marginBottom: Spacing.xs },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm, marginTop: 1 },
  checkboxActive: {},
  termsText: { flex: 1, fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, lineHeight: 18 },
  termsLink: { fontFamily: Typography.fontFamily.semiBold },
  termsError: { fontSize: 12, fontFamily: Typography.fontFamily.regular, color: Colors.danger, marginLeft: 30, marginTop: 2 },
  primaryBtn: { borderRadius: BorderRadius.sm, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', minHeight: 52, marginTop: Spacing.lg, ...Shadows.sm },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.white },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  footer: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.xxl },
  footerDivider: { width: 40, height: 2, borderRadius: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  footerLabel: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary },
  footerLink: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.semiBold },
});

export default SignUpScreen;