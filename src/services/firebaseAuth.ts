import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, updateProfile, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { syncOrMigrateUserOnAuth } from './userProfileService';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account'
});
// Request Google Workspace scopes
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/tasks.readonly');
provider.addScope('https://www.googleapis.com/auth/documents');

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
  name: 'Federico Sandoval',
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

export const emailSignUp = async (emailInput: string, passwordInput: string, displayName?: string): Promise<User | null> => {
  let email = emailInput.trim();
  if (!email.includes('@')) {
    email = email.toLowerCase().replace(/[^a-z0-9]/g, "") + "@usavoyager.com";
  }
  try {
    const safePassword = passwordInput.length >= 6 ? passwordInput : passwordInput.padEnd(6, "0");
    const userCredential = await createUserWithEmailAndPassword(auth, email, safePassword);
    if (displayName && userCredential.user) {
      try {
        await updateProfile(userCredential.user, { displayName });
      } catch (pErr) {}
    }
    if (userCredential.user && userCredential.user.email && userCredential.user.email.includes('@')) {
      try {
        await sendEmailVerification(userCredential.user);
        console.log('Verification email dispatched to:', userCredential.user.email);
      } catch (vErr) {
        console.warn('sendEmailVerification note:', vErr);
      }
    }
    try {
      await syncOrMigrateUserOnAuth(userCredential.user);
    } catch (sErr) {}
    return userCredential.user;
  } catch (error: any) {
    console.warn('Email sign up note:', error?.message || error);
    if (error?.code === 'auth/email-already-in-use') {
      return emailSignIn(emailInput, passwordInput);
    }
    return null;
  }
};

export const emailSignIn = async (emailInput: string, passwordInput: string): Promise<User | null> => {
  let email = emailInput.trim();
  if (!email.includes('@')) {
    email = email.toLowerCase().replace(/[^a-z0-9]/g, "") + "@usavoyager.com";
  }
  try {
    const safePassword = passwordInput.length >= 6 ? passwordInput : passwordInput.padEnd(6, "0");
    const userCredential = await signInWithEmailAndPassword(auth, email, safePassword);
    try {
      await syncOrMigrateUserOnAuth(userCredential.user);
    } catch (sErr) {}
    return userCredential.user;
  } catch (error: any) {
    console.warn('Email sign in note:', error?.message || error);
    return null;
  }
};
