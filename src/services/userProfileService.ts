import { doc, getDoc, setDoc, disableNetwork } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, auth } from './firebaseAuth';

let isQuotaExceeded = false;
try {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('voyager_firestore_quota_exceeded') === 'true') {
    isQuotaExceeded = true;
    if (db) {
      disableNetwork(db).catch(() => {});
    }
  }
} catch (e) {}

export function isFirestoreQuotaExceeded(): boolean {
  return isQuotaExceeded;
}

export function handleFirestoreWriteError(err: any, contextName: string) {
  const msg = err?.message || String(err);
  if (msg.includes('resource-exhausted') || msg.includes('Quota limit exceeded') || err?.code === 'resource-exhausted') {
    if (!isQuotaExceeded) {
      isQuotaExceeded = true;
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('voyager_firestore_quota_exceeded', 'true');
        }
      } catch (e) {}
      if (db) {
        disableNetwork(db).catch(() => {});
      }
      console.warn(`[Firestore Quota Warning] ${contextName}: Free daily write quota reached. App falling back seamlessly to local storage cache.`);
    }
  } else {
    console.warn(`Could not save ${contextName} to Firestore (offline/error):`, msg);
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number = 3000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Firestore operation timed out (${ms}ms)`));
    }, ms);
    promise
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export interface UserProfileData {
  uid?: string;
  studentId?: string;
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN' | string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  photoURL?: string;
  provider?: 'Google' | 'Apple' | 'Email' | 'Guest' | string;
  category?: string;
  education?: string;
  goal?: string;
  levelEstimate?: string;
  timePerWeek?: string;
  interests?: string;
  country?: string;
  usState?: string;
  state?: string;
  age?: number;
  completedDays?: number[];
  plan?: 'FREE' | 'PRO' | string;
  avatarUrl?: string;
  avatarType?: string;
  onboardingCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

const LOCAL_STORAGE_KEY = 'voyager_user_account';

/**
 * Gets cached profile from localStorage
 */
export function getLocalProfileCache(): UserProfileData | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Saves profile to localStorage cache and triggers sync event
 */
export function setLocalProfileCache(profile: UserProfileData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event('voyager_profile_updated'));
  } catch (e) {}
}

/**
 * Fetches user profile document directly from Firestore: users/{uid}
 */
export async function getFirestoreProfile(uid: string): Promise<UserProfileData | null> {
  if (!uid) return null;
  if (isQuotaExceeded) return getLocalProfileCache();
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await withTimeout(getDoc(docRef), 3000);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfileData;
    }
    return null;
  } catch (err: any) {
    handleFirestoreWriteError(err, 'fetch profile');
    const isOffline = err?.message?.includes('offline') || err?.code === 'unavailable' || err?.message?.includes('timed out');
    if (isOffline) {
      console.warn('Firestore is offline/slow, returning local profile cache for uid:', uid);
    } else if (!isQuotaExceeded) {
      console.warn('Could not fetch Firestore profile for uid:', uid, err?.message || err);
    }
    return getLocalProfileCache();
  }
}

/**
 * Merges existing Firestore data with new or local data safely.
 * Rule: Never overwrite valid/non-empty Firestore data with blank/incomplete local data.
 */
export function mergeProfiles(
  existing: UserProfileData,
  incoming: Partial<UserProfileData>
): UserProfileData {
  const merged: UserProfileData = { ...existing };

  Object.keys(incoming).forEach(key => {
    const val = incoming[key];
    if (val !== undefined && val !== null && val !== '') {
      merged[key] = val;
    } else if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
      if (val !== undefined && val !== null) {
        merged[key] = val;
      }
    }
  });

  return merged;
}

/**
 * Saves user profile to Firestore users/{uid} and updates localStorage cache.
 * Uses merge: true so existing subcollections or fields are preserved.
 */
export async function saveUserProfile(
  uid: string,
  dataToSave: Partial<UserProfileData>
): Promise<UserProfileData> {
  const now = new Date().toISOString();
  
  // Clean undefined keys
  const cleanedData: Record<string, any> = {};
  Object.keys(dataToSave).forEach(key => {
    if (dataToSave[key] !== undefined) {
      cleanedData[key] = dataToSave[key];
    }
  });

  const payload: Partial<UserProfileData> = {
    ...cleanedData,
    uid,
    updatedAt: now
  };

  if (!payload.createdAt) {
    payload.createdAt = now;
  }

  const localCache = getLocalProfileCache() || {};
  const mergedWithCache = mergeProfiles(localCache, payload);

  // Save to Firestore if uid is available or current authenticated user exists
  const currentUid = uid || auth.currentUser?.uid;
  if (currentUid && !isQuotaExceeded) {
    try {
      const docRef = doc(db, 'users', currentUid);
      await setDoc(docRef, payload, { merge: true });
    } catch (err: any) {
      handleFirestoreWriteError(err, 'user profile');
    }
  }

  setLocalProfileCache(mergedWithCache);
  return mergedWithCache;
}

/**
 * Specifically saves onboarding answers to Firestore users/{uid}
 */
export async function saveOnboardingToFirestore(
  onboardingData: Partial<UserProfileData>
): Promise<UserProfileData> {
  const currentUser = auth.currentUser;
  const localCache = getLocalProfileCache() || {};
  const merged = mergeProfiles(localCache, onboardingData);
  merged.onboardingCompleted = true;

  if (currentUser?.uid) {
    return await saveUserProfile(currentUser.uid, {
      ...merged,
      onboardingCompleted: true
    });
  } else {
    // Save to local cache until authenticated
    setLocalProfileCache(merged);
    return merged;
  }
}

/**
 * Synchronizes user profile upon login or auth state change:
 * 1. Checks Firestore users/{uid}
 * 2. If present in Firestore:
 *    - Preserves photoURL from Google user if available.
 *    - Merges local non-empty fields into Firestore only if Firestore field is missing/empty.
 *    - Updates local cache from Firestore.
 * 3. If NOT present in Firestore:
 *    - Migrates local cached profile (voyager_user_account) to users/{uid} in Firestore.
 *    - If no local cached profile, initializes default user document in users/{uid}.
 */
export async function syncOrMigrateUserOnAuth(firebaseUser: User): Promise<UserProfileData> {
  const uid = firebaseUser.uid;
  const now = new Date().toISOString();
  const localCache = getLocalProfileCache() || {};

  // Try fetching Firestore profile
  let firestoreProfile = await getFirestoreProfile(uid);

  if (firestoreProfile) {
    // Firestore document EXISTS
    let needsUpdate = false;
    const updatePayload: Partial<UserProfileData> = {};

    // Preserve photoURL if available
    if (firebaseUser?.photoURL && firestoreProfile?.photoURL !== firebaseUser.photoURL) {
      updatePayload.photoURL = firebaseUser.photoURL;
      if (!firestoreProfile?.avatarUrl || firestoreProfile?.avatarType === 'user') {
        updatePayload.avatarUrl = firebaseUser.photoURL;
        updatePayload.avatarType = 'custom';
      }
      needsUpdate = true;
    }

    if (!firestoreProfile?.uid) {
      updatePayload.uid = uid;
      needsUpdate = true;
    }

    if (firebaseUser?.email && (!firestoreProfile?.email || firestoreProfile?.email === 'learner@usavoyager.com')) {
      updatePayload.email = firebaseUser.email;
      needsUpdate = true;
    }

    // Merge any updated non-empty fields from localCache into Firestore
    const checkFields: (keyof UserProfileData)[] = [
      'role', 'name', 'firstName', 'lastName', 'age', 'country', 'usState', 'state', 'category', 'education', 
      'goal', 'levelEstimate', 'timePerWeek', 'interests', 'avatarType', 'avatarUrl', 'onboardingCompleted', 'onboardingResponses'
    ];

    checkFields.forEach(field => {
      const localVal = localCache?.[field];
      const firestoreVal = firestoreProfile?.[field];
      // Only copy from localCache if Firestore is MISSING the field value
      if ((firestoreVal === undefined || firestoreVal === null || firestoreVal === '') && 
          localVal !== undefined && localVal !== null && localVal !== '') {
        updatePayload[field] = localVal;
        needsUpdate = true;
      }
    });

    // Special safeguard for Federico / theorangesnowman@gmail.com or missing defaults:
    const isBaseAdmin = firebaseUser.email?.toLowerCase() === 'theorangesnowman@gmail.com' ||
                        firestoreProfile.email?.toLowerCase() === 'theorangesnowman@gmail.com' ||
                        localCache.email?.toLowerCase() === 'theorangesnowman@gmail.com';

    if (isBaseAdmin) {
      if (!firestoreProfile.country || firestoreProfile.country === 'Costa Rica' || firestoreProfile.country === 'No especificado' || firestoreProfile.country === 'Not specified') {
        updatePayload.country = 'Guatemala';
        needsUpdate = true;
      }
      if (!firestoreProfile.age || firestoreProfile.age === 21) {
        updatePayload.age = 63;
        needsUpdate = true;
      }
      if (!firestoreProfile.name || firestoreProfile.name === 'Estudiante' || firestoreProfile.name === 'Invitado' || firestoreProfile.name === 'Guest') {
        updatePayload.name = 'Federico Sandoval';
        updatePayload.firstName = 'Federico';
        updatePayload.lastName = 'Sandoval';
        needsUpdate = true;
      }
      if (!firestoreProfile.firstName || firestoreProfile.firstName === 'Invitado' || firestoreProfile.firstName === 'Guest' || firestoreProfile.firstName === 'Estudiante') {
        updatePayload.firstName = 'Federico';
        updatePayload.lastName = 'Sandoval';
        needsUpdate = true;
      }
    } else {
      // General user name splitting if firstName is missing or guest placeholder
      const currentFirst = firestoreProfile.firstName || '';
      const isPlaceholderFirst = !currentFirst || currentFirst === 'Invitado' || currentFirst === 'Guest' || currentFirst === 'Estudiante';
      const effectiveFullName = firestoreProfile.name || firebaseUser.displayName || '';
      if (isPlaceholderFirst && effectiveFullName && !effectiveFullName.toLowerCase().includes('invitado') && !effectiveFullName.toLowerCase().includes('guest')) {
        const parts = effectiveFullName.trim().split(/\s+/).filter(Boolean);
        if (parts.length > 0) {
          updatePayload.firstName = parts[0];
          updatePayload.lastName = parts.slice(1).join(' ');
          needsUpdate = true;
        }
      }
      if (firestoreProfile.country === 'No especificado' || firestoreProfile.country === 'Not specified' || !firestoreProfile.country) {
        updatePayload.country = 'Guatemala';
        needsUpdate = true;
      }
    }

    if (!firestoreProfile?.onboardingCompleted) {
      updatePayload.onboardingCompleted = true;
      needsUpdate = true;
    }

    if (needsUpdate) {
      updatePayload.updatedAt = now;
      if (!isQuotaExceeded) {
        try {
          const docRef = doc(db, 'users', uid);
          await setDoc(docRef, updatePayload, { merge: true });
        } catch (err: any) {
          handleFirestoreWriteError(err, 'sync profile');
        }
      }
      firestoreProfile = { ...firestoreProfile, ...updatePayload };
    }

    setLocalProfileCache(firestoreProfile);
    return firestoreProfile;
  } else {
    // Firestore document DOES NOT EXIST -> Migrate local profile or create new
    const name = firebaseUser?.displayName || localCache?.name || (firebaseUser?.email ? firebaseUser.email.split('@')[0] : 'Federico Sandoval');
    const photoURL = firebaseUser?.photoURL || localCache?.avatarUrl || localCache?.photoURL || '';

    const hasOnboardingData = Boolean(localCache?.goal || localCache?.country || localCache?.category || localCache?.age);

    const userEmailVal = firebaseUser?.email || localCache?.email || '';
    const derivedRole = (userEmailVal.toLowerCase() === 'theorangesnowman@gmail.com' || localCache.isAdmin)
      ? 'ADMIN'
      : (localCache.role || (localCache.category === 'Docente' || localCache.category === 'Teacher' || localCache.goal?.includes('Teachers') ? 'TEACHER' : 'STUDENT'));

    const initialProfile: UserProfileData = {
      uid,
      studentId: localCache.studentId || 'STU-001',
      role: derivedRole,
      name,
      firstName: localCache.firstName || (firebaseUser.displayName ? firebaseUser.displayName.split(' ')[0] : name),
      lastName: localCache.lastName || (firebaseUser.displayName ? firebaseUser.displayName.split(' ').slice(1).join(' ') : ''),
      email: firebaseUser.email || localCache.email || 'learner@usavoyager.com',
      photoURL,
      provider: firebaseUser.providerData?.[0]?.providerId === 'google.com' ? 'Google' : (localCache.provider || 'Email'),
      category: localCache.category || 'Estudiante',
      education: localCache.education || 'Universidad',
      goal: localCache.goal || 'Éxito académico',
      levelEstimate: localCache.levelEstimate || 'Intermediate',
      timePerWeek: localCache.timePerWeek || '5 hr/wk',
      interests: localCache.interests || 'Viajes, tecnología, música',
      country: localCache.country || 'Guatemala',
      usState: localCache.usState || localCache.state || 'Florida',
      state: localCache.state || localCache.usState || 'Florida',
      age: localCache.age ?? 63,
      completedDays: localCache.completedDays || [1],
      plan: localCache.plan || 'FREE',
      avatarUrl: photoURL || localCache.avatarUrl || '',
      avatarType: localCache.avatarType || (photoURL ? 'custom' : 'user'),
      onboardingCompleted: true,
      createdAt: localCache.createdAt || now,
      updatedAt: now
    };

    if (!isQuotaExceeded) {
      try {
        const docRef = doc(db, 'users', uid);
        await setDoc(docRef, initialProfile, { merge: true });
      } catch (err: any) {
        handleFirestoreWriteError(err, 'create initial profile');
      }
    }
    setLocalProfileCache(initialProfile);
    return initialProfile;
  }
}

/**
 * Saves bookmarked/saved chats to Firestore under users/{uid}/savedChats/data
 */
export async function saveSavedChatsToFirestore(uid: string, chats: any[]): Promise<void> {
  if (!uid) return;
  if (isQuotaExceeded) return;
  try {
    const docRef = doc(db, 'users', uid, 'savedChats', 'data');
    await setDoc(docRef, {
      chats,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    handleFirestoreWriteError(e, 'save saved chats');
  }
}

/**
 * Loads bookmarked/saved chats from Firestore under users/{uid}/savedChats/data
 */
export async function getSavedChatsFromFirestore(uid: string): Promise<any[] | null> {
  if (!uid || isQuotaExceeded) return null;
  try {
    const docRef = doc(db, 'users', uid, 'savedChats', 'data');
    const snap = await withTimeout(getDoc(docRef), 3000);
    if (snap.exists()) {
      const data = snap.data();
      return data.chats || [];
    }
  } catch (e) {
    handleFirestoreWriteError(e, 'fetch saved chats');
  }
  return null;
}

export interface NavigationStateData {
  lastTab?: string;
  lastScenarioId?: string;
  citizenshipMode?: string;
  selectedLang?: 'EN' | 'ES';
  updatedAt?: string;
}

let navStateTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Saves last navigation state (tab, scenario, language, mode) to Firestore
 */
export async function saveNavigationStateToFirestore(uid: string, navData: NavigationStateData): Promise<void> {
  if (!uid) return;
  
  if (isQuotaExceeded) return;

  if (navStateTimer) clearTimeout(navStateTimer);
  navStateTimer = setTimeout(async () => {
    try {
      const docRef = doc(db, 'users', uid, 'navigationState', 'data');
      await withTimeout(setDoc(docRef, {
        ...navData,
        updatedAt: new Date().toISOString()
      }, { merge: true }), 3000);
    } catch (e) {
      handleFirestoreWriteError(e, 'navigation state');
    }
  }, 5000);
}

/**
 * Loads navigation state from Firestore
 */
export async function getNavigationStateFromFirestore(uid: string): Promise<NavigationStateData | null> {
  if (!uid || isQuotaExceeded) return null;
  try {
    const docRef = doc(db, 'users', uid, 'navigationState', 'data');
    const snap = await withTimeout(getDoc(docRef), 3000);
    if (snap.exists()) {
      return snap.data() as NavigationStateData;
    }
  } catch (e) {
    handleFirestoreWriteError(e, 'fetch navigation state');
  }
  return null;
}

let chatHistoryTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Saves recent chat history transcript to Firestore (Debounced by 10 seconds)
 */
export async function saveChatHistoryToFirestore(uid: string, messages: any[]): Promise<void> {
  if (!uid || !messages || messages.length === 0) return;
  
  // Local storage cache updated immediately
  try {
    localStorage.setItem('voyager_chat_history', JSON.stringify(messages.slice(-50)));
  } catch (e) {}

  if (isQuotaExceeded) return;

  if (chatHistoryTimer) clearTimeout(chatHistoryTimer);
  chatHistoryTimer = setTimeout(async () => {
    try {
      const docRef = doc(db, 'users', uid, 'chatHistory', 'data');
      const recentMessages = messages.slice(-50);
      await withTimeout(setDoc(docRef, {
        messages: recentMessages,
        updatedAt: new Date().toISOString()
      }, { merge: true }), 3000);
    } catch (e) {
      handleFirestoreWriteError(e, 'chat history');
    }
  }, 10000);
}

/**
 * Loads recent chat history transcript from Firestore
 */
export async function getChatHistoryFromFirestore(uid: string): Promise<any[] | null> {
  if (!uid || isQuotaExceeded) return null;
  try {
    const docRef = doc(db, 'users', uid, 'chatHistory', 'data');
    const snap = await withTimeout(getDoc(docRef), 3000);
    if (snap.exists()) {
      const data = snap.data();
      return data.messages || [];
    }
  } catch (e) {
    handleFirestoreWriteError(e, 'fetch chat history');
  }
  return null;
}

/**
 * Clears local profile cache and triggers sync event
 */
export function clearLocalProfileCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem('voyager_admin_photo_url');
    window.dispatchEvent(new Event('voyager_profile_updated'));
  } catch (e) {}
}

/**
 * Flushes all pending dirty user domain state to Firestore in a single consolidated batch operation.
 */
export async function flushAllPendingUserData(): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    const { learningProfile } = await import('../domain/LearningProfile');
    const { conversationMemory } = await import('../domain/ConversationMemory');
    const { CivicsProgressTracker } = await import('../domain/CivicsProgressTracker');

    await Promise.allSettled([
      learningProfile.flushToFirestore(),
      conversationMemory.flushToFirestore(),
      CivicsProgressTracker.flushToFirestore()
    ]);
  } catch (e) {
    console.warn('Error flushing user data to Firestore:', e);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushAllPendingUserData();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushAllPendingUserData();
    }
  });
}
