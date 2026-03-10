// ============================================================
// FINMATRIX - Auth Network Service
// ============================================================
import { DummyAuth } from '../firebase/firebaseConfig';
import { UserRole, User } from '../types';
import { serializeUserResponse } from '../serializers/authSerializer';
import { dummyDelay as delay } from '../utils/dummyApiConfig';
import { deliveryPersonnel, DeliveryPerson } from '../dummy-data/deliveryPersonnel';

// Dummy user database for development
const dummyUsers: Record<string, { password: string; role: UserRole; displayName: string }> = {
  'admin@finmatrix.com': { password: 'Admin@123', role: 'administrator', displayName: 'John Admin' },
  'delivery@finmatrix.com': { password: 'Delivery@123', role: 'delivery_personnel', displayName: 'Mike Driver' },
};

// Build lookup from delivery personnel dummy data
const deliveryLookup: Record<string, DeliveryPerson> = {};
for (const dp of deliveryPersonnel) {
  deliveryLookup[dp.email.toLowerCase()] = dp;
}

export const signInAPI = async (
  email: string,
  password: string,
  role: UserRole
): Promise<User> => {
  try {
    // Simulate API call
    await delay(1200);
    
    const normalizedEmail = email.toLowerCase().trim();

    // ── Check delivery personnel credentials first ────────
    const dpUser = deliveryLookup[normalizedEmail];
    if (dpUser) {
      if (dpUser.password !== password) {
        throw new Error('Invalid email or password');
      }
      if (role !== 'delivery_personnel') {
        throw new Error('This account is registered as delivery personnel. Please select the correct role.');
      }
      // Return User object directly for delivery personnel
      return {
        uid: dpUser.userId,
        email: dpUser.email,
        displayName: dpUser.displayName,
        role: 'delivery_personnel',
        companyId: dpUser.companyId,
        phoneNumber: dpUser.phone,
        photoURL: dpUser.photoUrl || '',
        createdAt: dpUser.joinedAt,
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: dpUser.status === 'active',
        fcmToken: '',
      };
    }
    
    // ── Check admin / other dummy users ───────────────────
    const dummyUser = dummyUsers[normalizedEmail];
    
    if (dummyUser && dummyUser.password !== password) {
      throw new Error('Invalid email or password');
    }
    
    if (dummyUser && dummyUser.role !== role) {
      throw new Error(`This account is registered as ${dummyUser.role.replace('_', ' ')}. Please select the correct role.`);
    }

    const firebaseResult = await DummyAuth.signInWithEmailAndPassword(email, password);
    
    return serializeUserResponse(
      { ...firebaseResult.user, displayName: dummyUser?.displayName || email.split('@')[0] },
      role
    );
  } catch (error: any) {
    throw new Error(error.message || 'Sign in failed. Please try again.');
  }
};

export const signUpAPI = async (
  email: string,
  password: string,
  displayName: string,
  phoneNumber: string,
  companyName: string,
  role: UserRole
): Promise<User> => {
  try {
    await delay(1500);
    
    const firebaseResult = await DummyAuth.createUserWithEmailAndPassword(email, password);
    
    return serializeUserResponse(
      { ...firebaseResult.user, displayName },
      role,
      'company_' + Date.now()
    );
  } catch (error: any) {
    throw new Error(error.message || 'Sign up failed. Please try again.');
  }
};

export const forgotPasswordAPI = async (email: string): Promise<boolean> => {
  try {
    await DummyAuth.sendPasswordResetEmail(email);
    return true;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send reset email. Please try again.');
  }
};

export const signOutAPI = async (): Promise<boolean> => {
  try {
    await DummyAuth.signOut();
    return true;
  } catch (error: any) {
    throw new Error(error.message || 'Sign out failed.');
  }
};
