// ============================================================
// FINMATRIX - Custom Input Component
// ============================================================
import React, { useState, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Pressable, TextInputProps } from 'react-native';
import { Colors, BorderRadius, Layout, Shadows, Spacing } from '../theme';

interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

const CustomInput: React.FC<CustomInputProps> = ({
  label, error, leftIcon, rightIcon, isPassword, style, ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, isFocused && styles.labelFocused, error && styles.labelError]}>
        {label}
      </Text>
      <Pressable
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
        onPress={() => inputRef.current?.focus()}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          ref={inputRef}
          style={[styles.input, leftIcon ? { paddingLeft: 0 } : undefined, style]}
          placeholderTextColor={Colors.placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          editable={true}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.showHideText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        )}
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.base },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  labelFocused: { color: Colors.secondary },
  labelError: { color: Colors.danger },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.inputHeight,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
  },
  inputFocused: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: '#FFF5F5',
  },
  input: {
    flex: 1,
    height: Layout.inputHeight,
    fontSize: 16,
    color: Colors.textPrimary,
    textAlignVertical: 'center',
  },
  leftIcon: { marginRight: 12 },
  rightIcon: { marginLeft: 12 },
  showHideText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 6,
    marginLeft: 4,
  },
});

export default CustomInput;
