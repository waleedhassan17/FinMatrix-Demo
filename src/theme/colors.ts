// FinMatrix Design System - Color Palette
export const Colors = {
  // Brand Colors
  primary: '#0A2540',        // Trust Blue - headers, primary actions
  secondary: '#00B87C',      // Financial Green - success, revenue
  accent: '#F05A28',         // Logistics Orange - delivery actions, alerts

  // Neutrals
  dark: '#1A1A2E',
  slate: '#4F566B',
  gray: '#6B7280',
  lightGray: '#9CA3AF',
  border: '#E5E7EB',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  white: '#FFFFFF',

  // Status Colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Gradient pairs
  gradientPrimary: ['#0A2540', '#051829'] as const,
  gradientSecondary: ['#00B87C', '#0EA5E9'] as const,
  gradientAccent: ['#F05A28', '#FF8A65'] as const,
  gradientOrange: ['#F05A28', '#FFA07A'] as const,

  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textLink: '#3B82F6',

  // Shadows
  shadowLight: 'rgba(0, 0, 0, 0.04)',
  shadowMedium: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.16)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export default Colors;
