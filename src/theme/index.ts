// ============================================================
// FINMATRIX - Design System & Theme
// ============================================================
import Constants from 'expo-constants';

/**
 * Safe top padding that accounts for the device status bar / notch.
 * expo-constants gives the most reliable value across Expo-managed devices.
 * We add a small buffer so the first row of header text never touches the bar.
 */
export const SAFE_TOP_PADDING: number = (Constants.statusBarHeight ?? 44) + 10;

export const Colors = {
  // Primary Palette
  primary: '#1B3A5C',
  primaryLight: '#2E5C8A',
  primaryDark: '#0F2440',
  
  // Secondary/Accent
  secondary: '#2E75B6',
  secondaryLight: '#5A9AD6',
  secondaryDark: '#1A5A94',
  
  // Semantic Colors
  success: '#27AE60',
  successLight: '#E8F5E9',
  warning: '#F39C12',
  warningLight: '#FFF8E1',
  danger: '#E74C3C',
  dangerLight: '#FFEBEE',
  info: '#3498DB',
  infoLight: '#E3F2FD',
  
  // Neutrals
  white: '#FFFFFF',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  border: '#E8ECF0',
  borderLight: '#F0F2F5',
  divider: '#EAEEF2',
  
  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',
  textDisabled: '#CCCCCC',
  placeholder: '#AABBCC',
  
  // Role-specific
  adminAccent: '#1B3A5C',
  deliveryAccent: '#E8532F',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.08)',
  
  // Gradient
  gradientStart: '#1B3A5C',
  gradientEnd: '#2E75B6',

  // Aliases (used across screens)
  accent: '#E8532F',
  gray: '#666666',
  lightGray: '#999999',
};

export const Typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  fontSize: {
    h1: 28,
    h2: 24,
    h3: 20,
    h4: 18,
    body: 16,
    bodySmall: 14,
    caption: 12,
    tiny: 10,
  },
  lineHeight: {
    heading: 1.3,
    body: 1.5,
    compact: 1.2,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Elevation = {
  level1: Shadows.sm,
  level2: Shadows.md,
  level3: Shadows.lg,
};

export const Layout = {
  screenPadding: Spacing.base,
  cardPadding: Spacing.base,
  inputHeight: 52,
  buttonHeight: 52,
  minTouchTarget: 48,
  iconSize: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
  },
};
