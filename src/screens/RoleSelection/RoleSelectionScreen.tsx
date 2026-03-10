// ============================================================
// FINMATRIX - Role Selection Screen (Professional)
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppContainer from '../../components/AppContainer';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { setSelectedRole } from '../auth/authSlice';
import { UserRole } from '../../types';

interface RoleCardProps {
  title: string;
  subtitle: string;
  description: string;
  iconLetter: string;
  gradient: readonly [string, string];
  features: string[];
  onPress: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({
  title, subtitle, description, iconLetter, gradient, features, onPress,
}) => (
  <TouchableOpacity
    style={styles.card}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={styles.cardContent}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardIcon}
      >
        <Text style={styles.cardIconText}>{iconLetter}</Text>
      </LinearGradient>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
    </View>
    <View style={styles.featuresRow}>
      {features.map((f) => (
        <View key={f} style={styles.featureChip}>
          <View style={[styles.featureDot, { backgroundColor: gradient[0] }]} />
          <Text style={styles.featureText}>{f}</Text>
        </View>
      ))}
    </View>
    <View style={styles.cardArrowRow}>
      <Text style={styles.cardArrowLabel}>Continue</Text>
      <View style={[styles.cardArrowCircle, { backgroundColor: gradient[0] + '12' }]}>
        <Text style={[styles.arrowText, { color: gradient[0] }]}>→</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const RoleSelectionScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();

  const handleRoleSelect = (role: UserRole) => {
    dispatch(setSelectedRole(role));
    navigation.navigate(ROUTES.SIGN_IN, { role });
  };

  return (
    <AppContainer>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <Text style={styles.brandName}>Fin<Text style={styles.brandAccent}>Matrix</Text></Text>
        </View>

        <View style={styles.middleSection}>
          <Text style={styles.sectionTitle}>Select Your Role</Text>
          <Text style={styles.sectionSubtitle}>
            Choose how you want to access FinMatrix
          </Text>

          <View style={styles.cardsContainer}>
            <RoleCard
              title="Administrator"
              subtitle="Full Access"
              description="Complete control over accounting, inventory, payroll, reports, and delivery management."
              iconLetter="A"
              gradient={[Colors.primary, '#1e4976'] as const}
              features={['Accounting', 'Inventory', 'Reports']}
              onPress={() => handleRoleSelect('administrator')}
            />

            <RoleCard
              title="Delivery Personnel"
              subtitle="Delivery Operations"
              description="View and manage assigned deliveries, capture signatures, and sync inventory."
              iconLetter="D"
              gradient={[Colors.deliveryAccent, '#FF7043'] as const}
              features={['Deliveries', 'Signatures', 'Tracking']}
              onPress={() => handleRoleSelect('delivery_personnel')}
            />
          </View>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Back to options</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 16,
  },
  brandName: {
    fontSize: Typography.fontSize.h1,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  brandAccent: {
    color: Colors.secondary,
  },
  middleSection: {
    flex: 1,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h2,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.bodySmall,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  cardsContainer: {
    gap: Spacing.base,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.base,
  },
  cardIconText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.fontSize.h4,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardDesc: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  cardArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cardArrowLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textTertiary,
    marginRight: 8,
  },
  cardArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 28,
    paddingTop: 12,
  },
  backLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
  },
});

export default RoleSelectionScreen;
