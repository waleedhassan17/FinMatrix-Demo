// ============================================================
// FINMATRIX - Welcome Screen (Redesigned)
// Improvements:
//  • Ionicons instead of letter badges
//  • Clean CTA hierarchy: primary card + two secondary rows
//  • Removed "RECOMMENDED" badge — unnecessary for B2B
//  • Security trust indicators in footer
//  • Proper chevron arrows instead of › character
// ============================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppContainer from '../../components/AppContainer';

import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { setSelectedRole } from '../auth/authSlice';

const WelcomeScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();

  const handleRegisterCompany = () => {
    dispatch(setSelectedRole('administrator'));
    navigation.navigate(ROUTES.COMPANY_REGISTRATION);
  };

  const handleSignIn = () => {
    navigation.navigate(ROUTES.ROLE_SELECTION);
  };

  const handleDeliveryJoin = () => {
    dispatch(setSelectedRole('delivery_personnel'));
    navigation.navigate(ROUTES.DELIVERY_SIGNUP);
  };

  return (
    <AppContainer>
      <View style={s.container}>
        {/* ── Brand ── */}
        <View style={s.topSection}>
          <Text style={s.brandName}>Fin<Text style={s.brandAccent}>Matrix</Text></Text>
          <Text style={s.brandTagline}>Enterprise Accounting & Delivery Platform</Text>
        </View>

        {/* ── Actions ── */}
        <View style={s.actionsSection}>
          <Text style={s.heading}>Get Started</Text>

          {/* Primary CTA — Register Company */}
          <TouchableOpacity onPress={handleRegisterCompany} activeOpacity={0.85} style={s.primaryCard}>
            <View style={s.primaryCardInner}>
              <View style={[s.iconCircle, { backgroundColor: Colors.primary + '12' }]}>
                <Ionicons name="business-outline" size={22} color={Colors.primary} />
              </View>
              <View style={s.primaryCardText}>
                <Text style={s.primaryCardTitle}>Register Your Company</Text>
                <Text style={s.primaryCardDesc}>
                  Set up your business with accounting, inventory, and admin tools
                </Text>
              </View>
            </View>
            <View style={[s.ctaBar, { backgroundColor: Colors.primary }]}>
              <Text style={s.ctaBarText}>Start Registration</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>

          {/* Secondary — Sign In */}
          <ActionRow
            icon="log-in-outline"
            iconBg={Colors.secondary + '12'}
            iconColor={Colors.secondary}
            title="Sign In"
            subtitle="Already have an account? Continue where you left off"
            onPress={handleSignIn}
          />

          {/* Secondary — Delivery Personnel */}
          <ActionRow
            icon="car-outline"
            iconBg={Colors.deliveryAccent + '12'}
            iconColor={Colors.deliveryAccent}
            title="Join as Delivery Personnel"
            subtitle="Register with your company's invitation code"
            onPress={handleDeliveryJoin}
          />
        </View>

        {/* ── Footer ── */}
        <View style={s.bottomSection}>
          <View style={s.securityRow}>
            <Ionicons name="shield-checkmark-outline" size={13} color={Colors.textTertiary} />
            <Text style={s.securityText}>256-bit encrypted  ·  SOC 2 compliant</Text>
          </View>
          <Text style={s.versionText}>v1.0.0</Text>
        </View>
      </View>
    </AppContainer>
  );
};

// ── Reusable Action Row ──────────────────────────────────
interface ActionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

const ActionRow: React.FC<ActionRowProps> = ({ icon, iconBg, iconColor, title, subtitle, onPress }) => (
  <TouchableOpacity style={s.secondaryCard} onPress={onPress} activeOpacity={0.7}>
    <View style={[s.iconCircleSmall, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <View style={s.secondaryText}>
      <Text style={s.secondaryTitle}>{title}</Text>
      <Text style={s.secondarySubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
  </TouchableOpacity>
);

// ── Styles ──────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  topSection: { alignItems: 'center', paddingTop: 40, paddingBottom: Spacing.md },
  brandName: { fontSize: Typography.fontSize.h1, fontWeight: '700', color: Colors.primary, letterSpacing: 0.5 },
  brandAccent: { color: Colors.secondary },
  brandTagline: { fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: Colors.textSecondary, marginTop: 6 },
  actionsSection: { flex: 1, paddingTop: Spacing.base },
  heading: {
    fontSize: Typography.fontSize.h3,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },

  // Primary Card
  primaryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
    ...Shadows.md,
  },
  primaryCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.base,
    paddingBottom: Spacing.md,
  },
  primaryCardText: { flex: 1, marginLeft: Spacing.md },
  primaryCardTitle: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  primaryCardDesc: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  ctaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: Spacing.sm,
  },
  ctaBarText: {
    fontSize: Typography.fontSize.bodySmall,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.white,
  },

  // Icon Circles
  iconCircle: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  iconCircleSmall: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  // Secondary Cards
  secondaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  secondaryText: { flex: 1, marginHorizontal: Spacing.md },
  secondaryTitle: {
    fontSize: Typography.fontSize.bodySmall,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  secondarySubtitle: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  // Footer
  bottomSection: { alignItems: 'center', paddingBottom: 24, paddingTop: Spacing.md },
  securityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  securityText: { fontSize: 11, fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary },
  versionText: { fontSize: 11, fontFamily: Typography.fontFamily.regular, color: Colors.textDisabled },
});

export default WelcomeScreen;