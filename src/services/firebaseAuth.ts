import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { syncOrMigrateUserOnAuth } from './userProfileService';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account'
});
// Request Google Tasks scopes
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/tasks.readonly');

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory.
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        await syncOrMigrateUserOnAuth(user);
      } catch (err) {
        console.warn('Profile sync note on auth state change:', err);
      }
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    try {
      await syncOrMigrateUserOnAuth(result.user);
    } catch (err) {
      console.error('Error syncing profile on Google sign-in:', err);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const ADMIN_CREDENTIALS = {
  email: 'theorangesnowman@gmail.com',
  password: 'Lucas26!',
  name: 'Federico Sandoval (Admin)',
  role: 'ADMIN',
  id: 'ADMIN-VOYAGER-001'
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const verifyAdminCredentials = (emailInput: string, passwordInput: string): boolean => {
  const normEmail = emailInput.trim().toLowerCase();
  return (normEmail === ADMIN_CREDENTIALS.email || normEmail === 'theorangesnowman') && passwordInput === ADMIN_CREDENTIALS.password;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
