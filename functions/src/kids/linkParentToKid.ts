import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { UserRole } from "@przedszkole/shared";

export const linkGuardianToKid = onCall(
  { region: "europe-west1" },
  async (request) => {
    const callerClaims = request.auth?.token;
    const callerUid = request.auth?.uid;

    if (!callerUid) {
      throw new HttpsError("unauthenticated", "Not authenticated");
    }

    const db = admin.firestore();
    const auth = admin.auth();

    const callerDoc = await db.collection("users").doc(callerUid).get();
    const callerData = callerDoc.exists ? callerDoc.data() : null;

    const callerRole =
      (callerClaims?.role as UserRole | undefined) ||
      (callerData?.role as UserRole | undefined);
    const callerPreschoolId =
      (callerClaims?.preschoolId as string | undefined) ||
      (callerData?.preschoolId as string | undefined);

    if (callerRole !== "superadmin" && callerRole !== "admin") {
      throw new HttpsError(
        "permission-denied",
        "Only admins can link guardians to kids",
      );
    }

    const {
      preschoolId,
      kidId,
      guardianEmail,
      guardianName,
      guardianPhone,
      guardianRelation,
    } = request.data as {
      preschoolId: string;
      kidId: string;
      guardianEmail: string;
      guardianName?: string;
      guardianPhone?: string;
      guardianRelation?: string;
    };

    if (!preschoolId || !kidId || !guardianEmail) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    if (callerRole === "admin" && preschoolId !== callerPreschoolId) {
      throw new HttpsError(
        "permission-denied",
        "Cannot manage kids in another preschool",
      );
    }

    const kidRef = db.collection("kids").doc(kidId);
    const kidSnap = await kidRef.get();

    if (!kidSnap.exists) {
      throw new HttpsError("not-found", "Kid not found");
    }

    const kidData = kidSnap.data();
    if (kidData?.preschoolId !== preschoolId) {
      throw new HttpsError(
        "failed-precondition",
        "Kid does not belong to this preschool",
      );
    }

    let uid: string;
    let existingRole: UserRole | null = null;
    let existingPreschoolId: string | null = null;
    let existingDisplayName = "";

    try {
      const existingUser = await auth.getUserByEmail(guardianEmail);
      uid = existingUser.uid;

      const existingUserDoc = await db.collection("users").doc(uid).get();
      if (existingUserDoc.exists) {
        const userData = existingUserDoc.data();
        existingRole = (userData?.role as UserRole | undefined) || null;
        existingPreschoolId =
          (userData?.preschoolId as string | undefined | null) ?? null;
        existingDisplayName =
          (userData?.displayName as string | undefined) ||
          existingUser.displayName ||
          "";
      } else {
        existingDisplayName = existingUser.displayName || "";
      }
    } catch {
      const tempPassword = Math.random().toString(36).slice(-12) + "Aa1!";
      const newUser = await auth.createUser({
        email: guardianEmail,
        displayName: guardianName || guardianEmail.split("@")[0],
        password: tempPassword,
      });
      uid = newUser.uid;
    }

    if (existingRole && existingRole !== "parent") {
      throw new HttpsError(
        "failed-precondition",
        "This email already belongs to a non-parent account",
      );
    }

    if (existingPreschoolId && existingPreschoolId !== preschoolId) {
      throw new HttpsError(
        "failed-precondition",
        "This parent is already assigned to another preschool",
      );
    }

    await auth.setCustomUserClaims(uid, {
      role: "parent",
      preschoolId,
    });

    await db.collection("users").doc(uid).set(
      {
        email: guardianEmail,
        displayName:
          guardianName ||
          existingDisplayName ||
          guardianEmail.split("@")[0],
        role: "parent",
        preschoolId,
        phone: guardianPhone || null,
        linkedKidIds: admin.firestore.FieldValue.arrayUnion(kidId),
        fcmTokens: [],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const existingGuardians = Array.isArray(kidData?.guardians)
      ? kidData?.guardians
      : [];
    const nextGuardians = existingGuardians.filter(
      (guardian: { email?: string; uid?: string }) =>
        guardian.email?.toLowerCase() !== guardianEmail.toLowerCase() && guardian.uid !== uid,
    );
    nextGuardians.push({
      uid,
      email: guardianEmail,
      phone: guardianPhone || null,
      name:
        guardianName || existingDisplayName || guardianEmail.split("@")[0],
      relation: guardianRelation || null,
    });

    await kidRef.set(
      {
        parentIds: admin.firestore.FieldValue.arrayUnion(uid),
        guardians: nextGuardians,
        primaryParentEmail: guardianEmail,
        primaryParentName:
          guardianName || existingDisplayName || kidData?.primaryParentName || "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { success: true, uid };
  },
);
