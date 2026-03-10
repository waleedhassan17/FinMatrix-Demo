// ============================================================
// FINMATRIX - Join Company Screen (Redesigned)
// Improvements:
//  • Ionicons instead of letter badge
//  • Consistent button styles (always styled, disabled when incomplete)
//  • Grouped code boxes with dash separator (XXX – XXX)
//  • Ionicons for error indicator
//  • Cleaner help section
// ============================================================
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, Typography, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { joinCompany } from '../../store/companySlice';

const CODE_LENGTH = 6;

const JoinCompanyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { companies } = useAppSelector((s) => s.company);

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      const digits = value.replace(/[^0-9]/g, '').split('').slice(0, CODE_LENGTH);
      const newCode = [...code];
      digits.forEach((d, i) => { if (index + i < CODE_LENGTH) newCode[index + i] = d; });
      setCode(newCode);
      inputRefs.current[Math.min(index + digits.length, CODE_LENGTH - 1)]?.focus();
      setError('');
      return;
    }
    const digit = value.replace(/[^0-9]/g, '');
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError('');
    if (digit && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleJoin = () => {
    const inviteCode = code.join('');
    if (inviteCode.length !== CODE_LENGTH) { setError('Please enter the complete 6-digit code'); return; }
    const company = companies.find((c) => c.inviteCode === inviteCode);
    if (!company) { setError('Invalid invite code. Please check and try again.'); return; }
    dispatch(joinCompany({ inviteCode, userId: user?.uid || '', userRole: (user?.role as 'administrator' | 'delivery_personnel') || 'delivery_personnel' }));
  };

  const isComplete = code.every((d) => d !== '');

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.inner, { paddingTop: SAFE_TOP_PADDING }]}>
        {/* Top Bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.topBarTitle}>Join Company</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={s.content}>
          <View style={s.iconCircle}>
            <Ionicons name="enter-outline" size={32} color={Colors.success} />
          </View>

          <Text style={s.title}>Enter Invitation Code</Text>
          <Text style={s.subtitle}>Your company administrator should have shared a 6-digit code with you.</Text>

          {/* Code Input — grouped as XXX – XXX */}
          <View style={s.codeContainer}>
            {code.map((digit, index) => (
              <React.Fragment key={index}>
                <TextInput
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[s.codeBox, digit ? s.codeBoxFilled : null, error ? s.codeBoxError : null]}
                  value={digit}
                  onChangeText={(v) => handleCodeChange(v, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={index === 0 ? CODE_LENGTH : 1}
                  selectTextOnFocus
                  textContentType="oneTimeCode"
                />
                {index === 2 && <Text style={s.codeDash}>–</Text>}
              </React.Fragment>
            ))}
          </View>

          {error ? (
            <View style={s.errorRow}>
              <Ionicons name="alert-circle" size={14} color={Colors.danger} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Join Button */}
          <TouchableOpacity
            onPress={handleJoin}
            disabled={!isComplete}
            activeOpacity={0.85}
            style={[s.joinBtn, !isComplete && s.joinBtnDisabled]}
          >
            <Text style={[s.joinBtnText, !isComplete && s.joinBtnTextDisabled]}>Join Company</Text>
            <Ionicons name="arrow-forward" size={16} color={isComplete ? Colors.white : Colors.textTertiary} />
          </TouchableOpacity>

          {/* Help */}
          <View style={s.helpSection}>
            <View style={s.helpDivider} />
            <Text style={s.helpText}>
              Don't have a code? Ask your company administrator to send you an invitation from the Settings panel.
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.sm, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  topBarTitle: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary },
  content: { flex: 1, paddingHorizontal: Spacing.xxl, justifyContent: 'center', marginTop: -Spacing.xxxl },
  iconCircle: { width: 72, height: 72, borderRadius: 22, backgroundColor: Colors.success + '10', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: Spacing.xl },
  title: { fontSize: Typography.fontSize.h2, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xxl },
  codeContainer: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.base, alignItems: 'center' },
  codeBox: {
    width: 46, height: 56, borderWidth: 2, borderColor: Colors.border, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.white, textAlign: 'center', fontSize: Typography.fontSize.h2,
    fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, ...Shadows.sm,
  },
  codeBoxFilled: { borderColor: Colors.success, backgroundColor: Colors.success + '04' },
  codeBoxError: { borderColor: Colors.danger, backgroundColor: Colors.danger + '04' },
  codeDash: { fontSize: 20, color: Colors.textTertiary, marginHorizontal: 2 },
  errorRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.base, gap: 4 },
  errorText: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.danger },
  joinBtn: {
    flexDirection: 'row', borderRadius: BorderRadius.sm, paddingVertical: Spacing.base,
    justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md,
    backgroundColor: Colors.success, gap: Spacing.sm, ...Shadows.sm,
  },
  joinBtnDisabled: { backgroundColor: Colors.border, opacity: 0.6 },
  joinBtnText: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.white },
  joinBtnTextDisabled: { color: Colors.textTertiary },
  helpSection: { alignItems: 'center', marginTop: Spacing.xxl },
  helpDivider: { width: 40, height: 3, borderRadius: 2, backgroundColor: Colors.border, marginBottom: Spacing.md },
  helpText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary, textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.md },
});

export default JoinCompanyScreen;