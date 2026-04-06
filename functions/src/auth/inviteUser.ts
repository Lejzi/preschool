import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { UserRole } from "@przedszkole/shared";

/**
 * inviteUser — invite a staff member (teacher/parent) to a preschool.
 * Creates (or finds) a Firebase Auth user, sets custom claims, creates Firestore doc.
 * Only callable by preschool admin.
 */
export const inviteUser = onCall(
  { region: "europe-west1" },
  async (request) => {
    const callerClaims = request.auth?.token;
    const callerUid = request.auth?.uid;
    if (!callerUid)
      throw new HttpsError("unauthenticated", "Not authenticated");

    const db = admin.firestore();
    const callerDoc = await db.collection("users").doc(callerUid).get();
    const callerData = callerDoc.exists ? callerDoc.data() : null;

    const callerRole =
      (callerClaims?.role as UserRole | undefined) ||
      (callerData?.role as UserRole | undefined);
    const callerPreschoolId =
      (callerClaims?.preschoolId as string | undefined) ||
      (callerData?.preschoolId as string | undefined);

    if (callerRole !== "superadmin" && callerRole !== "admin") {
      throw new HttpsError("permission-denied", "Only admins can invite users");
    }

    const { email, displayName, role, preschoolId } = request.data as {
      email: string;
      displayName: string;
      role: "teacher" | "parent" | "admin";
      preschoolId: string;
    };

    // Admin can only invite to their own preschool
    if (callerRole === "admin" && preschoolId !== callerPreschoolId) {
      throw new HttpsError(
        "permission-denied",
        "Cannot invite to another preschool",
      );
    }
    const auth = admin.auth();

    let uid: string;

    try {
      // Try to get existing user
      const existingUser = await auth.getUserByEmail(email);
      uid = existingUser.uid;
    } catch {
      // Create new Firebase Auth user with temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + "Aa1!";
      const newUser = await auth.createUser({
        email,
        displayName,
        password: tempPassword,
      });
      uid = newUser.uid;
    }

    // Set custom claims
    await auth.setCustomUserClaims(uid, { role, preschoolId });

    // Upsert Firestore user doc
    await db.collection("users").doc(uid).set(
      {
        email,
        displayName,
        role,
        preschoolId,
        linkedKidIds: [],
        fcmTokens: [],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // TODO: send welcome email via Firebase Extensions (Trigger Email)
    return { success: true, uid };
  },
);
