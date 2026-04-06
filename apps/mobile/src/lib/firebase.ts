import { initializeApp, getApps } from "firebase/app";
import { getAuth, initializeAuth, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "demo-key",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "demo-project.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "demo-project.appspot.com",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    "1:000000000000:web:000000000000",
};

// Prevent duplicate initialization in fast-refresh
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth =
  getApps().length === 1
    ? initializeAuth(app, {
        // This Firebase SDK version does not expose the React Native
        // persistence helper, so keep auth usable with in-memory storage.
        persistence: inMemoryPersistence,
      })
    : getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
