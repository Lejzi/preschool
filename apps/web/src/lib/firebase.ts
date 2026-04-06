import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getMessaging } from "firebase/messaging";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";

if (!apiKey && !useEmulators) {
  console.warn(
    "⚠️  Firebase env vars not set. Copy apps/web/.env.example to apps/web/.env.local and fill in your Firebase project credentials, or set VITE_USE_EMULATORS=true to use local emulators.",
  );
}

const firebaseConfig = {
  apiKey: apiKey || "demo-key",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:000000000000",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "europe-west1");
export const messaging =
  typeof window !== "undefined" ? getMessaging(app) : null;

// Connect to emulators in development
if (useEmulators) {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
  connectFunctionsEmulator(functions, "localhost", 5001);
  console.info("🔧 Connected to Firebase Emulators");
}

export default app;
