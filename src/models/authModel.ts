// ============================================================
// FINMATRIX - Auth Data Models & Validation
// ============================================================

export interface SignInModel {
  email: string;
  password: string;
}

export interface SignUpModel {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  companyName: string;
  agreeToTerms: boolean;
}

export interface ForgotPasswordModel {
  email: string;
}

// Validation Functions
export const validateEmail = (email: string): string | null => {
  if (!email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[!@#$%^&*]/.test(password)) return 'Password must contain at least one special character (!@#$%^&*)';
  return null;
};

export const validateSignIn = (data: SignInModel): Record<string, string> => {
  const errors: Record<string, string> = {};
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  if (!data.password) errors.password = 'Password is required';
  return errors;
};

export const validateSignUp = (data: SignUpModel): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!data.fullName.trim()) errors.fullName = 'Full name is required';
  if (data.fullName.trim().length < 2) errors.fullName = 'Name must be at least 2 characters';
  
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;
  
  if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords do not match';
  if (!data.companyName.trim()) errors.companyName = 'Company name is required';
  if (!data.agreeToTerms) errors.agreeToTerms = 'You must agree to the Terms of Service';
  
  return errors;
};

export const validateForgotPassword = (data: ForgotPasswordModel): Record<string, string> => {
  const errors: Record<string, string> = {};
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  return errors;
};
