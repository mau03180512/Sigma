import { create } from 'zustand';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  onAuthStateChanged(auth, (user) => {
    set({ user, isLoading: false, isAuthenticated: !!user });
  });

  return {
    user: null,
    isLoading: true,
    isAuthenticated: false,

    signInWithGoogle: async () => {
      await signInWithPopup(auth, googleProvider);
    },

    signInWithEmail: async (email: string, password: string) => {
      await signInWithEmailAndPassword(auth, email, password);
    },

    signUp: async (email: string, password: string) => {
      await createUserWithEmailAndPassword(auth, email, password);
    },

    signOut: async () => {
      await firebaseSignOut(auth);
      set({ user: null, isAuthenticated: false });
    },
  };
});
