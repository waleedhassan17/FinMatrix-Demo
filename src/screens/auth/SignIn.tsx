// ============================================================
// FINMATRIX - Sign In Screen (Redesigned)
// Improvements:
//  • InlineBanner replaces Alert.alert() for errors
//  • AuthInput with left icons and focus states
//  • Role shown as subtle uppercase text, not gradient badge
//  • ActivityIndicator spinner in button loading state
//  • Demo credentials behind __DEV__ flag
//  • Clean footer with divider
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
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
import { signIn, clearError } from './authSlice';
import { validateSignIn, SignInModel } from '../../models/authModel';
import { UserRole } from '../../types';
import AuthLayout from '../../shared-components/AuthLayout';
import AuthInput from '../../shared-components/AuthInput';
import InlineBanner from '../../shared-components/InlineBanner';

const SignInScreen = ({ navigation, route }: any) => {
  const role: UserRole = route.params?.role || 'administrator';
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, user } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState<SignInModel>({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);

  const isAdmin = role === 'administrator';
  const accent = isAdmin ? Colors.primary : Colors.deliveryAccent;

  // ── Navigate on auth ──
  useEffect(() => {
    if (isAuthenticated && user) {
      navigation.replace(user.role === 'administrator' ? ROUTES.ADMIN_MAIN : ROUTES.DELIVERY_MAIN);
    }
  }, [isAuthenticated, user]);

  // ── Show inline error ──
  useEffect(() => {
    if (error) setShowError(true);
  }, [error]);

  const dismissError = useCallback(() => {
    setShowError(false);
    dispatch(clearError());
  }, [dispatch]);

  const updateField = (field: keyof SignInModel, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSignIn = () => {
    const v = validateSignIn(form);
    setErrors(v);
    if (Object.keys(v).length === 0) {
      dispatch(signIn({ email: form.email, password: form.password, role }));
    }
  };

  return (
    <AuthLayout scrollable>
      <View style={s.header}>
        <Text style={[s.roleText, { color: accent }]}>
          {isAdmin ? 'Administrator' : 'Delivery Personnel'}
        </Text>
        <Text style={s.title}>Welcome back</Text>
        <Text style={s.subtitle}>Sign in to your account to continue</Text>
      </View>

      {/* Error Banner */}
      <InlineBanner
        visible={showError}
        message={error || 'Something went wrong. Please try again.'}
        variant="error"
        onDismiss={dismissError}
      />

      {/* Form */}
      <View style={s.form}>
        <AuthInput
          label="Email Address"
          leftIcon="mail-outline"
          placeholder="you@company.com"
          value={form.email}
          onChangeText={(t) => updateField('email', t)}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="next"
        />
        <AuthInput
          label="Password"
          leftIcon="lock-closed-outline"
          placeholder="Enter your password"
          value={form.password}
          onChangeText={(t) => updateField('password', t)}
          error={errors.password}
          isPassword
          autoComplete="password"
          returnKeyType="done"
          onSubmitEditing={handleSignIn}
        />

        <TouchableOpacity
          style={s.forgotRow}
          onPress={() => navigation.navigate(ROUTES.FORGOT_PASSWORD, { role })}
        >
          <Text style={[s.forgotText, { color: accent }]}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: accent }, isLoading && s.btnDisabled]}
          onPress={handleSignIn}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator size="small" color={Colors.white} />
              <Text style={s.primaryBtnText}>Signing in...</Text>
            </View>
          ) : (
            <Text style={s.primaryBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Demo Credentials */}
      {__DEV__ && (
        <View style={s.demoCard}>
          <View style={s.demoHeader}>
            <Ionicons name="information-circle" size={14} color={Colors.info} />
            <Text style={s.demoTitle}>Demo Credentials</Text>
          </View>
          <Text style={s.demoText}>
            {isAdmin ? 'admin@finmatrix.com / Admin@123' : 'delivery@finmatrix.com / Delivery@123'}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={s.footer}>
        <View style={s.footerDivider} />
        <View style={s.footerRow}>
          <Text style={s.footerLabel}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.SIGN_UP, { role })}>
            <Text style={[s.footerLink, { color: accent }]}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthLayout>
  );
};

const s = StyleSheet.create({
  header: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  roleText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: Spacing.md,
  },
  title: { fontSize: Typography.fontSize.h2, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginTop: Spacing.sm },
  subtitle: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, marginTop: 4 },
  form: { paddingTop: Spacing.sm },
  forgotRow: { alignSelf: 'flex-end', marginTop: -Spacing.sm, marginBottom: Spacing.lg },
  forgotText: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.semiBold },
  primaryBtn: { borderRadius: BorderRadius.sm, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', minHeight: 52, ...Shadows.sm },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.white },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  demoCard: { marginTop: Spacing.xl, padding: Spacing.md, backgroundColor: Colors.infoLight, borderRadius: BorderRadius.sm, borderLeftWidth: 3, borderLeftColor: Colors.info },
  demoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  demoTitle: { fontSize: 11, fontFamily: Typography.fontFamily.semiBold, color: Colors.info, textTransform: 'uppercase', letterSpacing: 0.5 },
  demoText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, marginLeft: 20, lineHeight: 18 },
  footer: { alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.xl },
  footerDivider: { width: 40, height: 2, borderRadius: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  footerLabel: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary },
  footerLink: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.semiBold },
});

export default SignInScreen;