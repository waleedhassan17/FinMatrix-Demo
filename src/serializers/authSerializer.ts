// ============================================================
// FINMATRIX - Auth Serializer (Data Transformation Layer)
// ============================================================
import { User, UserRole } from '../types';
import { SignInModel, SignUpModel } from '../models/authModel';

export const serializeSignInRequest = (data: SignInModel) => ({
  email: data.email.trim().toLowerCase(),
  password: data.password,
});

export const serializeSignUpRequest = (data: SignUpModel, role: UserRole) => ({
  email: data.email.trim().toLowerCase(),
  password: data.password,
  displayName: data.fullName.trim(),
  phoneNumber: data.phoneNumber?.trim() || '',
  companyName: data.companyName.trim(),
  role,
});

export const serializeUserResponse = (firebaseUser: any, role: UserRole, companyId?: string): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email || '',
  displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
  role,
  companyId: companyId || 'company_' + firebaseUser.uid,
  phoneNumber: firebaseUser.phoneNumber || '',
  photoURL: firebaseUser.photoURL || '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  isActive: true,
  fcmToken: '',
});
