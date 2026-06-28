import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, isConfigured } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    if (!isConfigured) throw new Error('Firebase not configured');
    return signInWithPopup(auth, googleProvider);
  };

  const loginWithEmail = async (email, password) => {
    if (!isConfigured) throw new Error('Firebase not configured');
    return signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (email, password, displayName) => {
    if (!isConfigured) throw new Error('Firebase not configured');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    return result;
  };

  const logout = async () => {
    if (!isConfigured || !auth) return;
    return signOut(auth);
  };

  // Demo mode login (when Firebase not configured)
  const loginDemo = () => {
    setUser({
      uid: 'demo-user-123',
      email: 'demo@safetext.ai',
      displayName: 'Demo User',
      photoURL: null,
      isDemo: true,
    });
  };

  const value = {
    user,
    loading,
    isConfigured,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    loginDemo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
