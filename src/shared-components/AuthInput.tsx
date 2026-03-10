// ============================================================
// FINMATRIX - Auth Input Component
// Left icon, right action (toggle password), focus / error /
// valid states, animated error messages, hint text.
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../theme';

interface AuthInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  isPassword?: boolean;
  hint?: string;
  containerStyle?: ViewStyle;
  showValidState?: boolean;
  isValid?: boolean;
}

const AuthInput: React.FC<AuthInputProps> = ({
  label,
  leftIcon,
  error,
  isPassword = false,
  hint,
  containerStyle,
  showValidState = false,
  isValid = false,
  ...inputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(isPassword);
  const errorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(errorAnim, {
      toValue: error ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [error]);

  const borderColor = error
    ? Colors.danger
    : isFocused
    ? Colors.primary
    : showValidState && isValid
    ? Colors.success
    : Colors.border;

  const labelColor = error
    ? Colors.danger
    : isFocused
    ? Colors.primary
    : Colors.textSecondary;

  const iconColor = error
    ? Colors.danger
    : isFocused
    ? Colors.primary
    : Colors.textTertiary;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>

      <View
        style={[
          styles.inputWrapper,
          { borderColor },
          isFocused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : null,
        ]}
      >
        {leftIcon && (
          <Ionicons name={leftIcon} size={18} color={iconColor} style={styles.leftIcon} />
        )}

        <TextInput
          style={[styles.input, !leftIcon && styles.inputNoIcon]}
          placeholderTextColor={Colors.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          autoCorrect={false}
          {...inputProps}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            style={styles.rightAction}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={Colors.textTertiary}
            />
          </TouchableOpacity>
        )}
        {!isPassword && showValidState && isValid && (
          <View style={styles.rightAction}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
          </View>
        )}
      </View>

      {error ? (
        <Animated.View
          style={[
            styles.errorContainer,
            {
              opacity: errorAnim,
              transform: [
                { translateY: errorAnim.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) },
              ],
            },
          ]}
        >
          <Ionicons name="alert-circle" size={12} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      ) : null}

      {hint && !error ? <Text style={styles.hintText}>{hint}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.base },
  label: {
    fontSize: Typography.fontSize.bodySmall,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
  },
  inputWrapperFocused: {
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.12, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  inputWrapperError: { backgroundColor: Colors.danger + '04' },
  leftIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.sm,
  },
  inputNoIcon: { paddingLeft: 2 },
  rightAction: { marginLeft: Spacing.sm, padding: 4 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingLeft: 2 },
  errorText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.danger,
    marginLeft: 4,
    flex: 1,
  },
  hintText: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
    marginTop: 4,
    paddingLeft: 2,
    lineHeight: 16,
  },
});

export default AuthInput;
