// ============================================================
// FINMATRIX - Inline Banner Component
// Replaces Alert.alert() with animated in-context banners.
// Variants: error · success · info · warning
// ============================================================
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../theme';

type BannerVariant = 'error' | 'success' | 'info' | 'warning';

interface InlineBannerProps {
  message: string;
  variant?: BannerVariant;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  autoDismissMs?: number;
  visible: boolean;
}

const CFG: Record<BannerVariant, { bg: string; border: string; text: string; icon: keyof typeof Ionicons.glyphMap }> = {
  error:   { bg: '#FEF2F2', border: Colors.danger,  text: '#991B1B', icon: 'alert-circle' },
  success: { bg: '#F0FDF4', border: Colors.success,  text: '#166534', icon: 'checkmark-circle' },
  info:    { bg: '#EFF6FF', border: Colors.info,     text: '#1E40AF', icon: 'information-circle' },
  warning: { bg: '#FFFBEB', border: '#F59E0B',       text: '#92400E', icon: 'warning' },
};

const InlineBanner: React.FC<InlineBannerProps> = ({
  message, variant = 'error', title, dismissible = true,
  onDismiss, autoDismissMs = 0, visible,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const c = CFG[variant];

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: visible ? 1 : 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  }, [visible]);

  useEffect(() => {
    if (visible && autoDismissMs > 0 && onDismiss) {
      const t = setTimeout(onDismiss, autoDismissMs);
      return () => clearTimeout(t);
    }
  }, [visible, autoDismissMs]);

  if (!visible && !message) return null;

  return (
    <Animated.View
      style={[
        s.container,
        { backgroundColor: c.bg, borderLeftColor: c.border, opacity: slideAnim,
          transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] },
      ]}
    >
      <Ionicons name={c.icon} size={18} color={c.border} style={s.icon} />
      <View style={s.textContainer}>
        {title && <Text style={[s.title, { color: c.text }]}>{title}</Text>}
        <Text style={[s.message, { color: c.text }]}>{message}</Text>
      </View>
      {dismissible && onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={s.dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color={c.text + '80'} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const s = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', borderLeftWidth: 3, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.base },
  icon: { marginRight: Spacing.sm, marginTop: 1 },
  textContainer: { flex: 1 },
  title: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.semiBold, marginBottom: 2 },
  message: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, lineHeight: 20 },
  dismiss: { marginLeft: Spacing.sm, padding: 2 },
});

export default InlineBanner;
