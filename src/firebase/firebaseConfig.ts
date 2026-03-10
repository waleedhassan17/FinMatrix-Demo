// ============================================================
// FINMATRIX - Firebase Configuration
// ============================================================
// NOTE: Replace with your actual Firebase project config
// This is a placeholder configuration for development

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'finmatrix-app.firebaseapp.com',
  projectId: 'finmatrix-app',
  storageBucket: 'finmatrix-app.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:000000000000',
  measurementId: 'G-XXXXXXXXXX',
};

// For development, we use dummy auth simulation
// In production, uncomment the Firebase imports below:
// import firebase from '@react-native-firebase/app';
// import '@react-native-firebase/auth';
// import '@react-native-firebase/firestore';
// import '@react-native-firebase/messaging';
// import '@react-native-firebase/storage';

// if (!firebase.apps.length) {
//   firebase.initializeApp(firebaseConfig);
// }

export default firebaseConfig;

// Simulated Firebase Auth for dummy data mode
export class DummyAuth {
  private static currentUser: any = null;

  static async signInWithEmailAndPassword(email: string, _password: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    DummyAuth.currentUser = {
      uid: 'user_' + Date.now(),
      email,
      displayName: email.split('@')[0],
      emailVerified: true,
    };
    return { user: DummyAuth.currentUser };
  }

  static async createUserWithEmailAndPassword(email: string, _password: string) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    DummyAuth.currentUser = {
      uid: 'user_' + Date.now(),
      email,
      displayName: email.split('@')[0],
      emailVerified: false,
    };
    return { user: DummyAuth.currentUser };
  }

  static async sendPasswordResetEmail(_email: string) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  }

  static async signOut() {
    await new Promise(resolve => setTimeout(resolve, 500));
    DummyAuth.currentUser = null;
    return true;
  }

  static getCurrentUser() {
    return DummyAuth.currentUser;
  }
}
