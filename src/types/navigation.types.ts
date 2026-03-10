// FinMatrix Navigation Types
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { UserRole } from './auth.types';

// Auth Stack
export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  Verify2FA: undefined;
  RoleSelection: undefined;
};

// Admin Tab Navigator
export type AdminTabParamList = {
  Home: undefined;
  Dashboard: undefined;
  Reports: undefined;
  Settings: undefined;
};

// Delivery Tab Navigator
export type DeliveryTabParamList = {
  MyRoute: undefined;
  Inventory: undefined;
  History: undefined;
  More: undefined;
};

// Root Stack
export type RootStackParamList = {
  Auth: undefined;
  AdminTabs: undefined;
  DeliveryTabs: undefined;
};

// Screen Props
export type SplashScreenProps = NativeStackScreenProps<AuthStackParamList, 'Splash'>;
export type OnboardingScreenProps = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;
export type SignInScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;
export type SignUpScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;
export type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;
export type RoleSelectionScreenProps = NativeStackScreenProps<AuthStackParamList, 'RoleSelection'>;
export type Verify2FAScreenProps = NativeStackScreenProps<AuthStackParamList, 'Verify2FA'>;
