// ============================================================
// FINMATRIX - Custom Button Component
// ============================================================
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Layout, Shadows, Spacing } from '../theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title, onPress, variant = 'primary', size = 'medium', loading, disabled, icon, style, fullWidth = true,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyles = {
    primary: { bg: Colors.primary, text: Colors.white, border: Colors.primary },
    secondary: { bg: Colors.secondary, text: Colors.white, border: Colors.secondary },
    outline: { bg: 'transparent', text: Colors.primary, border: Colors.primary },
    text: { bg: 'transparent', text: Colors.secondary, border: 'transparent' },
    danger: { bg: Colors.danger, text: Colors.white, border: Colors.danger },
  };

  const sizeStyles = {
    small: { height: 38, fontSize: 14, paddingH: 16 },
    medium: { height: Layout.buttonHeight, fontSize: 16, paddingH: 24 },
    large: { height: 56, fontSize: 18, paddingH: 32 },
  };

  const bs = buttonStyles[variant];
  const ss = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: bs.bg,
          borderColor: bs.border,
          height: ss.height,
          paddingHorizontal: ss.paddingH,
          opacity: isDisabled ? 0.6 : 1,
        },
        variant !== 'text' && Shadows.sm,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={bs.text} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: bs.text, fontSize: ss.fontSize, marginLeft: icon ? 8 : 0 }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  fullWidth: { width: '100%' },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default CustomButton;
