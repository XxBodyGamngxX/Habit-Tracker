import { db, doc, setDoc } from './firebase';

export function loadLocalData<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    return JSON.parse(saved) as T;
  } catch (err) {
    console.error(`Error loading key "${key}" from localStorage:`, err);
    return defaultValue;
  }
}

export function saveLocalData<T>(key: string, data: T, userUid?: string | null): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving key "${key}" to localStorage:`, err);
  }

  if (userUid && db) {
    try {
      const userRef = doc(db, 'users', userUid);
      setDoc(userRef, { [key]: data }, { merge: true }).catch((cloudErr) => {
        console.error(`Error syncing key "${key}" to Firestore:`, cloudErr);
      });
    } catch (err) {
      console.error(`Error initiating Firestore sync for "${key}":`, err);
    }
  }
}
