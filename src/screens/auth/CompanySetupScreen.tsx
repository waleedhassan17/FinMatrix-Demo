// ============================================================
// FINMATRIX - Company Setup Screen (Redesigned)
// Improvements:
//  • Ionicons instead of letter badges
//  • Removed feature pills (marketing on utility screen)
//  • Cleaner card layout with chevron arrows
//  • Success micro-header for post-signup context
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, Typography, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';


const CompanySetupScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <View style={[s.container, { paddingTop: SAFE_TOP_PADDING }]}>
      <View style={s.header}>
        <Text style={s.title}>Welcome to FinMatrix</Text>
        <Text style={s.subtitle}>
          Set up your workspace to start managing finances, inventory, and operations.
        </Text>
      </View>

      <View style={s.cardsContainer}>
        {/* Create New Company */}
        <TouchableOpacity style={s.card} activeOpacity={0.7} onPress={() => navigation.navigate(ROUTES.CREATE_COMPANY)}>
          <View style={s.cardRow}>
            <View style={[s.iconCircle, { backgroundColor: Colors.primary + '10' }]}>
              <Ionicons name="business-outline" size={24} color={Colors.primary} />
            </View>
            <View style={s.cardTextBlock}>
              <Text style={s.cardTitle}>Create New Company</Text>
              <Text style={s.cardSubtitle}>Register your business and configure your accounting workspace</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </View>
        </TouchableOpacity>

        {/* Join Existing Company */}
        <TouchableOpacity style={s.card} activeOpacity={0.7} onPress={() => navigation.navigate(ROUTES.JOIN_COMPANY)}>
          <View style={s.cardRow}>
            <View style={[s.iconCircle, { backgroundColor: Colors.success + '10' }]}>
              <Ionicons name="enter-outline" size={24} color={Colors.success} />
            </View>
            <View style={s.cardTextBlock}>
              <Text style={s.cardTitle}>Join Existing Company</Text>
              <Text style={s.cardSubtitle}>Enter an invitation code from your company administrator</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={s.footer}>
        <View style={s.footerDivider} />
        <Text style={s.footerText}>You can create or join multiple companies later from Settings.</Text>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.xl },
  header: { marginTop: Spacing.xxl, marginBottom: Spacing.xxxl, alignItems: 'center' },
  title: { fontSize: Typography.fontSize.h2, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm, textAlign: 'center' },
  subtitle: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: Spacing.md },
  cardsContainer: { gap: Spacing.md },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: Spacing.lg, ...Shadows.md },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardTextBlock: { flex: 1, marginLeft: Spacing.base, marginRight: Spacing.sm },
  cardTitle: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary, marginBottom: 4 },
  cardSubtitle: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, lineHeight: 18 },
  footer: { marginTop: 'auto', paddingBottom: Spacing.xxl, alignItems: 'center' },
  footerDivider: { width: 40, height: 3, borderRadius: 2, backgroundColor: Colors.border, marginBottom: Spacing.md },
  footerText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary, textAlign: 'center' },
});

export default CompanySetupScreen;