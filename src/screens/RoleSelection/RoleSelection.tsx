// FinMatrix Role Selection Screen
// Shown after authentication - user selects Administrator or Delivery Personnel
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import AppContainer from '../../components/AppContainer';
import CustomButton from '../../Custom-Components/CustomButton';
import { Colors, Spacing, BorderRadius, Elevation } from '../../theme';
import { useAppDispatch, useAuth } from '../../hooks/useReduxHooks';
import { selectRole } from '../auth/authSlice';
import { UserRole } from '../../types/auth.types';

const { width } = Dimensions.get('window');

interface RoleSelectionProps {
  navigation: any;
}

const ROLES: Array<{
  id: UserRole;
  icon: string;
  title: string;
  description: string;
  color: string;
  colorLight: string;
  features: string[];
}> = [
  {
    id: 'administrator',
    icon: '🛡️',
    title: 'Administrator',
    description: 'Full access to dashboard, reports, approvals, and cloud export',
    color: Colors.secondary,
    colorLight: '#E6FAF2',
    features: [
      'Review daily transactions',
      'Generate financial reports',
      'Manage team & permissions',
      'Export to cloud storage',
      'Full inventory control',
      'Approve delivery updates',
    ],
  },
  {
    id: 'delivery_personnel',
    icon: '🚚',
    title: 'Delivery Personnel',
    description: 'Manage deliveries, update inventory, capture proof of delivery',
    color: Colors.accent,
    colorLight: '#FFF0EB',
    features: [
      'View assigned deliveries',
      'Scan & update inventory',
      'Capture delivery proof',
      'Digital signature collection',
      'GPS route tracking',
      'Real-time sync',
    ],
  },
];

const RoleSelection: React.FC<RoleSelectionProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleContinue = async () => {
    if (!selectedRole || !user) return;

    try {
      await dispatch(selectRole({ userId: user.uid, role: selectedRole })).unwrap();

      if (selectedRole === 'administrator') {
        navigation.replace('AdminTabs');
      } else {
        navigation.replace('DeliveryTabs');
      }
    } catch (error) {
      // Error handled by Redux
    }
  };

  return (
    <AppContainer scrollable backgroundColor={Colors.white}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Welcome back, <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
          </Text>
          <Text style={styles.subtitle}>Select your role to continue</Text>
        </View>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <TouchableOpacity
                key={role.id}
                activeOpacity={0.85}
                onPress={() => setSelectedRole(role.id)}
                style={[
                  styles.roleCard,
                  isSelected && {
                    borderColor: role.color,
                    borderWidth: 2.5,
                    backgroundColor: role.colorLight,
                  },
                ]}>
                {/* Selected Indicator */}
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: role.color }]}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}

                {/* Icon */}
                <View style={[styles.iconContainer, { backgroundColor: role.colorLight }]}>
                  <Text style={styles.roleIcon}>{role.icon}</Text>
                </View>

                {/* Title & Description */}
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>

                {/* Features */}
                <View style={styles.featuresContainer}>
                  {role.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <Text style={[styles.featureCheck, { color: role.color }]}>✓</Text>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Continue Button inside card */}
                <View style={styles.cardButtonContainer}>
                  <View
                    style={[
                      styles.cardButton,
                      {
                        backgroundColor: isSelected ? role.color : Colors.background,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.cardButtonText,
                        { color: isSelected ? Colors.white : Colors.gray },
                      ]}>
                      {isSelected ? `Selected` : `Continue as ${role.title.split(' ')[0]}`}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue Button */}
        <View style={styles.bottomSection}>
          <CustomButton
            title={
              selectedRole
                ? `Continue as ${selectedRole === 'administrator' ? 'Administrator' : 'Delivery Personnel'}`
                : 'Select a role to continue'
            }
            onPress={handleContinue}
            disabled={!selectedRole}
            loading={isLoading}
            size="large"
            style={styles.continueButton}
          />

          <Text style={styles.hintText}>
            You can switch roles later from Settings
          </Text>
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
  header: {
    paddingTop: 48,
    paddingBottom: 28,
  },
  greeting: {
    fontSize: 20,
    color: Colors.gray,
    marginBottom: 4,
  },
  userName: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  cardsContainer: {
    gap: 16,
  },
  roleCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
    ...Elevation.level2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  selectedBadgeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleIcon: {
    fontSize: 28,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  roleDescription: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 20,
    marginBottom: 16,
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  featureCheck: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 10,
    width: 18,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  cardButtonContainer: {
    marginTop: 4,
  },
  cardButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSection: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  continueButton: {
    marginBottom: 12,
  },
  hintText: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.lightGray,
  },
});

export default RoleSelection;
