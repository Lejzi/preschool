const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const rootDir = path.resolve(__dirname, "../..");
const firebaseRcPath = path.join(rootDir, ".firebaserc");

function getProjectId() {
  if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
  if (process.env.GOOGLE_CLOUD_PROJECT) return process.env.GOOGLE_CLOUD_PROJECT;
  if (process.env.FIREBASE_PROJECT) return process.env.FIREBASE_PROJECT;

  try {
    const firebaseRc = JSON.parse(fs.readFileSync(firebaseRcPath, "utf8"));
    return firebaseRc.projects?.default || firebaseRc.projects?.przedszkole;
  } catch {
    return undefined;
  }
}

const projectId = getProjectId();
const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (serviceAccountPath) {
  const resolvedServiceAccountPath = path.resolve(serviceAccountPath);
  const serviceAccount = require(resolvedServiceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || projectId,
  });
} else {
  admin.initializeApp({
    projectId,
  });
}

const auth = admin.auth();
const db = admin.firestore();
const password = process.env.TEST_USER_PASSWORD;
const isUsingEmulators =
  Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST) ||
  Boolean(process.env.FIRESTORE_EMULATOR_HOST);

const TEST_USERS = [
  {
    email: "test.superadmin@przedszkole.app",
    displayName: "Test Superadmin",
    role: "superadmin",
    preschoolId: null,
  },
  {
    email: "test.admin@przedszkole.app",
    displayName: "Test Administrator",
    role: "admin",
  },
  {
    email: "test.teacher@przedszkole.app",
    displayName: "Test Nauczyciel",
    role: "teacher",
  },
  {
    email: "test.parent@przedszkole.app",
    displayName: "Test Rodzic",
    role: "parent",
  },
];

async function findPreschool() {
  const explicitId = process.env.TEST_PRESCHOOL_ID;
  if (explicitId) {
    const snap = await db.collection("preschools").doc(explicitId).get();
    if (!snap.exists) {
      throw new Error(`TEST_PRESCHOOL_ID does not exist: ${explicitId}`);
    }
    return { id: snap.id, ...snap.data() };
  }

  const explicitCode = process.env.TEST_PRESCHOOL_CODE;
  if (explicitCode) {
    const snap = await db
      .collection("preschools")
      .where("code", "==", explicitCode)
      .limit(1)
      .get();

    if (snap.empty) {
      throw new Error(`TEST_PRESCHOOL_CODE does not exist: ${explicitCode}`);
    }

    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  const existing = await db.collection("preschools").limit(1).get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  const ref = db.collection("preschools").doc();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const preschool = {
    id: ref.id,
    code: "demo",
    name: "Demo Przedszkole",
    address: {
      street: "Testowa 1",
      city: "Warszawa",
      postalCode: "00-001",
      country: "Polska",
    },
    phone: "+48 000 000 000",
    email: "demo@przedszkole.app",
    settings: {
      timezone: "Europe/Warsaw",
      workingHours: { open: "07:00", close: "17:00" },
      currency: "PLN",
      defaultLanguage: "pl",
    },
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(preschool);
  return preschool;
}

async function upsertAuthUser({ email, displayName }) {
  try {
    const existingUser = await auth.getUserByEmail(email);
    await auth.updateUser(existingUser.uid, {
      displayName,
      password,
      disabled: false,
    });
    return existingUser.uid;
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }

    const createdUser = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
      disabled: false,
    });
    return createdUser.uid;
  }
}

async function upsertUserProfile({ uid, email, displayName, role, preschoolId }) {
  const ref = db.collection("users").doc(uid);
  const existing = await ref.get();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await ref.set(
    {
      id: uid,
      email,
      displayName,
      role,
      preschoolId,
      linkedKidIds: existing.data()?.linkedKidIds || [],
      fcmTokens: existing.data()?.fcmTokens || [],
      createdAt: existing.exists ? existing.data()?.createdAt || now : now,
      updatedAt: now,
    },
    { merge: true },
  );
}

async function seed() {
  if (!password) {
    throw new Error(
      "TEST_USER_PASSWORD is required. Choose a strong, temporary password for seeded users.",
    );
  }

  if (!projectId) {
    throw new Error(
      "Firebase project id was not found. Set FIREBASE_PROJECT or configure .firebaserc.",
    );
  }

  const preschool = await findPreschool();
  const seededUsers = [];

  for (const testUser of TEST_USERS) {
    const preschoolId =
      testUser.role === "superadmin" ? null : testUser.preschoolId || preschool.id;
    const uid = await upsertAuthUser(testUser);

    await auth.setCustomUserClaims(uid, {
      role: testUser.role,
      preschoolId,
    });

    await upsertUserProfile({
      uid,
      email: testUser.email,
      displayName: testUser.displayName,
      role: testUser.role,
      preschoolId,
    });

    seededUsers.push({
      role: testUser.role,
      email: testUser.email,
    });
  }

  console.log("");
  console.log(`Seeded test users for Firebase project: ${projectId}`);
  console.log(`Preschool for non-superadmin users: ${preschool.name} (${preschool.code})`);
  console.log("");
  console.table(seededUsers);
  console.log("");
  console.log("If a user was already logged in, sign out and sign back in to refresh custom claims.");
}

seed().catch((error) => {
  if (
    !isUsingEmulators &&
    /Could not load the default credentials/i.test(error.message || "")
  ) {
    console.error("");
    console.error("Firebase Admin credentials are missing.");
    console.error("");
    console.error("For local testing, run the emulators first:");
    console.error("  npm run emulate");
    console.error("");
    console.error("Then seed the emulator data in another terminal:");
    console.error("  npm run seed:test-users:emulator");
    console.error("");
    console.error("To seed the real Firebase project instead, authenticate Application Default Credentials:");
    console.error("  gcloud auth application-default login");
    console.error("");
    console.error("If you do not have gcloud installed, use a Firebase service account JSON instead:");
    console.error("  FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/service-account.json npm run seed:test-users");
    console.error("");
    console.error("Then run:");
    console.error("  npm run seed:test-users");
    console.error("");
    process.exitCode = 1;
    return;
  }

  console.error(error);
  process.exitCode = 1;
});
