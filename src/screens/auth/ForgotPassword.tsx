// ============================================================
// FINMATRIX - Forgot Password Screen (Redesigned)
// Improvements:
//  • Key icon replaces lock emoji
//  • Animated success state with mail-open icon
//  • Resend timer with countdown (30 s cooldown)
//  • InlineBanner for API errors (no Alert.alert)
//  • Centered, focused single-purpose layout
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { forgotPassword, clearError } from './authSlice';
import { validateForgotPassword } from '../../models/authModel';
import AuthLayout from '../../shared-components/AuthLayout';
import AuthInput from '../../shared-components/AuthInput';
import InlineBanner from '../../shared-components/InlineBanner';

const ForgotPasswordScreen = ({ navigation, route }: any) => {
  const role = route.params?.role || 'administrator';
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const [sent, setSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const accent = role === 'administrator' ? Colors.primary : Colors.deliveryAccent;

  useEffect(() => {
    if (resendTimer > 0) {
      const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
      return () => clearInterval(id);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (sent) {
      Animated.parallel([
        Animated.spring(successScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [sent]);

  const handleReset = () => {
    const v = validateForgotPassword({ email });
    if (v.email) { setError(v.email); return; }
    dispatch(forgotPassword({ email })).unwrap()
      .then(() => { setSent(true); setResendTimer(30); })
      .catch((err: string) => setApiError(err));
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    dispatch(forgotPassword({ email })).unwrap()
      .then(() => setResendTimer(30))
      .catch((err: string) => setApiError(err));
  };

  // ── Success State ──
  if (sent) {
    return (
      <AuthLayout showBack={false} scrollable={false}>
        <View style={s.successContainer}>
          <Animated.View style={[s.successIconCircle, { transform: [{ scale: successScale }], opacity: successOpacity }]}>
            <Ionicons name="mail-open-outline" size={36} color={Colors.success} />
          </Animated.View>
          <Animated.View style={{ opacity: successOpacity, alignItems: 'center' }}>
            <Text style={s.successTitle}>Check Your Email</Text>
            <Text style={s.successDesc}>
              We've sent password reset instructions to{'\n'}
              <Text style={s.emailHighlight}>{email}</Text>
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0} style={s.resendBtn}>
              <Text style={[s.resendText, resendTimer > 0 && s.resendTextDisabled]}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Didn't receive it? Resend"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: accent }]}
              onPress={() => navigation.navigate(ROUTES.SIGN_IN, { role })}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={16} color={Colors.white} />
              <Text style={s.primaryBtnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </AuthLayout>
    );
  }

  // ── Form State ──
  return (
    <AuthLayout scrollable={false}>
      <View style={s.centered}>
        <View style={[s.iconCircle, { backgroundColor: accent + '08' }]}>
          <Ionicons name="key-outline" size={28} color={accent} />
        </View>
        <Text style={s.title}>Forgot Password?</Text>
        <Text style={s.subtitle}>
          Enter the email address associated with your account and we'll send you a link to reset your password.
        </Text>

        <InlineBanner visible={!!apiError} message={apiError} variant="error" onDismiss={() => setApiError('')} />

        <AuthInput
          label="Email Address"
          leftIcon="mail-outline"
          placeholder="Enter your registered email"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); }}
          error={error}
          keyboardType="email-address"
          autoCapitalize="none"
          containerStyle={{ width: '100%' }}
        />

        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: accent }, isLoading && s.btnDisabled]}
          onPress={handleReset} disabled={isLoading} activeOpacity={0.85}
        >
          {isLoading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator size="small" color={Colors.white} />
              <Text style={s.primaryBtnText}>Sending...</Text>
            </View>
          ) : (
            <Text style={s.primaryBtnText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={s.signInLink} onPress={() => navigation.navigate(ROUTES.SIGN_IN, { role })}>
          <Text style={s.signInLinkText}>
            Remember your password? <Text style={[s.signInLinkBold, { color: accent }]}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: Spacing.xxl },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: Typography.fontSize.h3, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl, paddingHorizontal: Spacing.md },
  primaryBtn: { flexDirection: 'row', borderRadius: BorderRadius.sm, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', minHeight: 52, width: '100%', gap: Spacing.sm, ...Shadows.sm },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.white },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  signInLink: { marginTop: Spacing.xl },
  signInLinkText: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary },
  signInLinkBold: { fontFamily: Typography.fontFamily.semiBold },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  successIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.success + '10', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl },
  successTitle: { fontSize: Typography.fontSize.h2, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  successDesc: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emailHighlight: { fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary },
  resendBtn: { marginTop: Spacing.lg, marginBottom: Spacing.xxl, padding: Spacing.sm },
  resendText: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.primary },
  resendTextDisabled: { color: Colors.textTertiary },
});

export default ForgotPasswordScreen;