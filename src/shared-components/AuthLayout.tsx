// ============================================================
// FINMATRIX - Shared Auth Layout Component
// Provides consistent structure across all auth screens:
// safe-area handling, back nav, keyboard avoidance, scroll,
// pinned bottom content.
// ============================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography, SAFE_TOP_PADDING } from '../theme';

interface AuthLayoutProps {
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  scrollable?: boolean;
  topBarRight?: React.ReactNode;
  topBarTitle?: string;
  bottomContent?: React.ReactNode;
  contentStyle?: ViewStyle;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  showBack = true,
  onBack,
  scrollable = true,
  topBarRight,
  topBarTitle,
  bottomContent,
  contentStyle,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) onBack();
    else if (navigation.canGoBack()) navigation.goBack();
  };

  const ContentWrapper = scrollable ? ScrollView : View;
  const contentWrapperProps = scrollable
    ? {
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: 'handled' as const,
        contentContainerStyle: { flexGrow: 1 },
      }
    : {};

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
        {/* ─── Top Bar ─── */}
        <View style={styles.topBar}>
          {showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
          {topBarTitle ? (
            <Text style={styles.topBarTitle} numberOfLines={1}>{topBarTitle}</Text>
          ) : (
            <View />
          )}
          {topBarRight || <View style={styles.placeholder} />}
        </View>

        {/* ─── Main Content ─── */}
        <ContentWrapper style={[styles.content, contentStyle]} {...contentWrapperProps}>
          {children}
        </ContentWrapper>

        {/* ─── Bottom Pinned ─── */}
        {bottomContent && (
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {bottomContent}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  placeholder: { width: 40, height: 40 },
  topBarTitle: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
});

export default AuthLayout;
