// FinMatrix Auth Types
export type UserRole = 'administrator' | 'delivery_personnel';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole | null;
  agencyId: string;
  avatarUrl?: string;
  phone?: string;
  is2FAEnabled: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  selectedRole: UserRole | null;
  isOnboarded: boolean;
  requires2FA: boolean;
}

export interface SignInPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignUpPayload {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  agencyId: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface Verify2FAPayload {
  code: string;
  trustDevice: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface PasswordValidation {
  minLength: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  hasUpperCase: boolean;
  passwordsMatch: boolean;
}
