// FinMatrix Typography System
import { TextStyle } from 'react-native';

export const FontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  mono: 'IBMPlexMono-Regular',
  monoBold: 'IBMPlexMono-Bold',
};

export const Typography: Record<string, TextStyle> = {
  h1: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: FontFamily.semiBold,
    fontSize: 24,
    lineHeight: 32,
  },
  h3: {
    fontFamily: FontFamily.semiBold,
    fontSize: 20,
    lineHeight: 28,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  captionMedium: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  small: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  buttonSmall: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  // Financial numbers
  moneyLarge: {
    fontFamily: FontFamily.monoBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  moneyMedium: {
    fontFamily: FontFamily.mono,
    fontSize: 20,
    lineHeight: 28,
  },
  moneySmall: {
    fontFamily: FontFamily.mono,
    fontSize: 16,
    lineHeight: 24,
  },
};

export default Typography;
