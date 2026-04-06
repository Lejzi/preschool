import { create } from "zustand";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User, UserRole } from "@przedszkole/shared";

interface AuthState {
  user: FirebaseUser | null;
  userProfile: User | null;
  role: UserRole | null;
  preschoolId: string | null;
  preschoolCode: string | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  userProfile: null,
  role: null,
  preschoolId: null,
  preschoolCode: null,
  loading: false,
  initialized: false,

  initialize: () => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const tokenResult = await firebaseUser.getIdTokenResult(true);
        const claims = tokenResult.claims as {
          role?: UserRole;
          preschoolId?: string;
        };

        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const userProfile = userDoc.exists()
          ? ({ id: firebaseUser.uid, ...userDoc.data() } as User)
          : null;

        const role = claims.role || userProfile?.role || null;
        const preschoolId =
          claims.preschoolId || userProfile?.preschoolId || null;

        let preschoolCode: string | null = null;
        if (preschoolId) {
          const preschoolDoc = await getDoc(doc(db, "preschools", preschoolId));
          if (preschoolDoc.exists()) preschoolCode = preschoolDoc.data().code;
        }

        set({
          user: firebaseUser,
          userProfile,
          role,
          preschoolId,
          preschoolCode,
          initialized: true,
        });
      } else {
        set({
          user: null,
          userProfile: null,
          role: null,
          preschoolId: null,
          preschoolCode: null,
          initialized: true,
        });
      }
    });
    return unsub;
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await signOut(auth);
    set({
      user: null,
      userProfile: null,
      role: null,
      preschoolId: null,
      preschoolCode: null,
    });
  },

  resetPassword: async (email) => {
    await sendPasswordResetEmail(auth, email);
  },
}));
