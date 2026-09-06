import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
  doc,
  getDoc,
  setDoc,
  runTransaction,
  type User,
} from '@/lib/firebase';
import type { UserDoc, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  userDoc: UserDoc | null;
  userRole: UserRole;
  userNumber: number | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (username: string, email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [userNumber, setUserNumber] = useState<number | null>(() => {
    const cached = localStorage.getItem('userNumber');
    return cached ? parseInt(cached, 10) : null;
  });
  const [loading, setLoading] = useState(true);

  // Backfill or assign sequential user number
  const assignSequentialUserNumber = async (firebaseUser: User, username: string, email: string): Promise<number> => {
    let assigned = 1;
    try {
      const counterRef = doc(db, 'metadata', 'userCounter');
      assigned = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        const currentCount = counterSnap.exists() ? (counterSnap.data().lastAssignedNumber || 0) : 0;
        const nextNumber = currentCount + 1;
        transaction.set(counterRef, {
          lastAssignedNumber: nextNumber,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        const userRef = doc(db, 'users', firebaseUser.uid);
        transaction.set(userRef, {
          userNumber: nextNumber,
          email,
          displayName: username || '',
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        return nextNumber;
      });
    } catch (err) {
      console.warn('Sequential user number transaction error, falling back:', err);
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, { userNumber: assigned, email, displayName: username }, { merge: true });
    }
    return assigned;
  };

  const fetchUserData = async (firebaseUser: User) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as UserDoc;
        setUserDoc(data);

        // Check if soft deleted
        if (data.status === 'deleted') {
          await fbSignOut(auth);
          setUser(null);
          setUserDoc(null);
          return;
        }

        // Determine Role (original logic: if username/displayName is 'Bishr', grant admin)
        const isBishr = firebaseUser.displayName?.toLowerCase() === 'bishr';
        const role = data.role || (isBishr ? 'admin' : 'user');
        setUserRole(role);

        // Sequential Number
        if (data.userNumber !== undefined && data.userNumber !== null) {
          setUserNumber(data.userNumber);
          localStorage.setItem('userNumber', data.userNumber.toString());
        } else {
          const newNumber = await assignSequentialUserNumber(
            firebaseUser,
            firebaseUser.displayName || '',
            firebaseUser.email || ''
          );
          setUserNumber(newNumber);
          localStorage.setItem('userNumber', newNumber.toString());
        }
      } else {
        // First-time user creation in Firestore
        const isBishr = firebaseUser.displayName?.toLowerCase() === 'bishr';
        const role: UserRole = isBishr ? 'admin' : 'user';
        const newNumber = await assignSequentialUserNumber(
          firebaseUser,
          firebaseUser.displayName || '',
          firebaseUser.email || ''
        );
        setUserNumber(newNumber);
        localStorage.setItem('userNumber', newNumber.toString());
        setUserRole(role);

        const newDoc: UserDoc = {
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          userNumber: newNumber,
          role,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newDoc, { merge: true });
        setUserDoc(newDoc);
      }
    } catch (err) {
      console.error('Error fetching user data from Firestore:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setUserDoc(null);
        setUserRole('user');
        setUserNumber(null);
        localStorage.removeItem('userNumber');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUp = async (username: string, email: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await fbUpdateProfile(cred.user, { displayName: username });
      await fetchUserData(cred.user);
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
    setUserDoc(null);
    setUserRole('user');
    setUserNumber(null);
    localStorage.clear();
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    if (!user) return;
    await fbUpdateProfile(user, { displayName, photoURL: photoURL || user.photoURL });
    if (db) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { displayName, profilePicUrl: photoURL || null }, { merge: true });
    }
    await refreshUserData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userDoc,
        userRole,
        userNumber,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateUserProfile,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
