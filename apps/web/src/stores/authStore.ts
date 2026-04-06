import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User as FirebaseUser,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { User, UserRole } from "@przedszkole/shared";

interface AuthState {
  user: FirebaseUser | null;
  userProfile: User | null;
  preschoolId: string | null;
  role: UserRole | null;
  preschoolCode: string | null;
  loading: boolean;
  initialized: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setUserProfile: (profile: User) => void;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      userProfile: null,
      preschoolId: null,
      role: null,
      preschoolCode: null,
      loading: false,
      initialized: false,

      initialize: () => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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

            // Prefer custom claims, fall back to Firestore profile
            const role = claims.role || userProfile?.role || null;
            const preschoolId =
              claims.preschoolId || userProfile?.preschoolId || null;

            let preschoolCode: string | null = null;
            if (preschoolId) {
              const preschoolDoc = await getDoc(
                doc(db, "preschools", preschoolId),
              );
              if (preschoolDoc.exists()) {
                preschoolCode = preschoolDoc.data().code;
              }
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
        return unsubscribe;
      },

      login: async (email, password) => {
        set({ loading: true });
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } finally {
          set({ loading: false });
        }
      },

      loginWithGoogle: async () => {
        set({ loading: true });
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });
          const cred = await signInWithPopup(auth, provider);

          const userRef = doc(db, "users", cred.user.uid);
          const existingUser = await getDoc(userRef);
          if (!existingUser.exists()) {
            await setDoc(userRef, {
              id: cred.user.uid,
              email: cred.user.email || "",
              displayName: cred.user.displayName || "Google User",
              photoUrl: cred.user.photoURL || null,
              role: "parent",
              preschoolId: null,
              linkedKidIds: [],
              fcmTokens: [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await setDoc(
              userRef,
              {
                email: cred.user.email || existingUser.data().email || "",
                displayName:
                  cred.user.displayName ||
                  existingUser.data().displayName ||
                  "Google User",
                photoUrl: cred.user.photoURL || existingUser.data().photoUrl || null,
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            );
          }
        } finally {
          set({ loading: false });
        }
      },

      register: async (email, password, displayName) => {
        set({ loading: true });
        try {
          const cred = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );
          await updateProfile(cred.user, { displayName });
          // Create user doc in Firestore
          await setDoc(doc(db, "users", cred.user.uid), {
            id: cred.user.uid,
            email,
            displayName,
            role: "parent",
            preschoolId: null,
            linkedKidIds: [],
            fcmTokens: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
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

      setUserProfile: (profile) => set({ userProfile: profile }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ preschoolCode: state.preschoolCode }),
    },
  ),
);
