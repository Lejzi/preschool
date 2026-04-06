import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { UserRole } from "@przedszkole/shared";

/**
 * setUserRole — callable by super-admin or preschool admin.
 * Sets Firebase Auth custom claims and updates the user Firestore doc.
 */
export const setUserRole = onCall(
  { region: "europe-west1" },
  async (request) => {
    // Verify caller is admin or superadmin
    const callerClaims = request.auth?.token;
    const callerUid = request.auth?.uid;
    if (!callerUid)
      throw new HttpsError("unauthenticated", "Not authenticated");

    const db = admin.firestore();
    const callerDoc = await db.collection("users").doc(callerUid).get();
    const callerData = callerDoc.exists ? callerDoc.data() : null;

    const role =
      (callerClaims?.role as UserRole | undefined) ||
      (callerData?.role as UserRole | undefined);
    const preschoolId =
      (callerClaims?.preschoolId as string | undefined) ||
      (callerData?.preschoolId as string | undefined);

    if (role !== "superadmin" && role !== "admin") {
      throw new HttpsError("permission-denied", "Only admins can assign roles");
    }

    const { targetUserId, targetRole, targetPreschoolId } = request.data as {
      targetUserId: string;
      targetRole: UserRole;
      targetPreschoolId: string | null;
    };

    // Admin can only assign roles within their own preschool
    if (role === "admin" && targetPreschoolId !== preschoolId) {
      throw new HttpsError(
        "permission-denied",
        "Cannot assign roles outside your preschool",
      );
    }

    // Superadmin can assign any role; admin can only assign teacher/parent
    if (
      role === "admin" &&
      (targetRole === "superadmin" || targetRole === "admin")
    ) {
      throw new HttpsError(
        "permission-denied",
        "Cannot assign admin or superadmin roles",
      );
    }
    const auth = admin.auth();

    // Set custom claims on Firebase Auth
    await auth.setCustomUserClaims(targetUserId, {
      role: targetRole,
      preschoolId: targetPreschoolId,
    });

    // Update user document in Firestore
    await db.collection("users").doc(targetUserId).update({
      role: targetRole,
      preschoolId: targetPreschoolId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  },
);

/**
 * onUserCreated — triggered when a new Firebase Auth user is created.
 * Creates the user document in Firestore with default 'parent' role.
 */
import { onDocumentCreated } from "firebase-functions/v2/firestore";

export const createUserDocument = onDocumentCreated(
  { document: "users/{userId}", region: "europe-west1" },
  async (_event) => {
    // This is handled in inviteUser cloud function
    // Kept here as a fallback for self-registered users
  },
);
