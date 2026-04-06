import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { UserRole } from "@przedszkole/shared";

function assertAdminAccess(callerRole?: UserRole, callerUid?: string) {
  if (!callerUid) {
    throw new HttpsError("unauthenticated", "Not authenticated");
  }

  if (callerRole !== "superadmin" && callerRole !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can manage staff");
  }
}

export const updateStaffMember = onCall(
  { region: "europe-west1" },
  async (request) => {
    const callerClaims = request.auth?.token;
    const callerUid = request.auth?.uid;
    const db = admin.firestore();

    const callerDoc = await db.collection("users").doc(callerUid || "").get();
    const callerData = callerDoc.exists ? callerDoc.data() : null;
    const callerRole =
      (callerClaims?.role as UserRole | undefined) ||
      (callerData?.role as UserRole | undefined);
    const callerPreschoolId =
      (callerClaims?.preschoolId as string | undefined) ||
      (callerData?.preschoolId as string | undefined);

    assertAdminAccess(callerRole, callerUid);

    const { targetUserId, displayName, role, preschoolId } = request.data as {
      targetUserId: string;
      displayName: string;
      role: "teacher" | "admin";
      preschoolId: string;
    };

    if (!targetUserId || !displayName || !role || !preschoolId) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    if (callerRole === "admin" && preschoolId !== callerPreschoolId) {
      throw new HttpsError(
        "permission-denied",
        "Cannot manage staff outside your preschool",
      );
    }

    const targetDoc = await db.collection("users").doc(targetUserId).get();
    if (!targetDoc.exists) {
      throw new HttpsError("not-found", "Staff member not found");
    }

    const targetData = targetDoc.data();
    if (
      callerRole === "admin" &&
      targetData?.preschoolId !== callerPreschoolId
    ) {
      throw new HttpsError(
        "permission-denied",
        "Cannot manage staff outside your preschool",
      );
    }

    const auth = admin.auth();
    await auth.updateUser(targetUserId, { displayName });
    await auth.setCustomUserClaims(targetUserId, {
      role,
      preschoolId,
    });

    await db.collection("users").doc(targetUserId).set(
      {
        displayName,
        role,
        preschoolId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { success: true };
  },
);

export const removeStaffMember = onCall(
  { region: "europe-west1" },
  async (request) => {
    const callerClaims = request.auth?.token;
    const callerUid = request.auth?.uid;
    const db = admin.firestore();

    const callerDoc = await db.collection("users").doc(callerUid || "").get();
    const callerData = callerDoc.exists ? callerDoc.data() : null;
    const callerRole =
      (callerClaims?.role as UserRole | undefined) ||
      (callerData?.role as UserRole | undefined);
    const callerPreschoolId =
      (callerClaims?.preschoolId as string | undefined) ||
      (callerData?.preschoolId as string | undefined);

    assertAdminAccess(callerRole, callerUid);

    const { targetUserId, preschoolId } = request.data as {
      targetUserId: string;
      preschoolId: string;
    };

    if (!targetUserId || !preschoolId) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    if (callerUid === targetUserId) {
      throw new HttpsError("failed-precondition", "Cannot remove yourself");
    }

    if (callerRole === "admin" && preschoolId !== callerPreschoolId) {
      throw new HttpsError(
        "permission-denied",
        "Cannot manage staff outside your preschool",
      );
    }

    const targetDoc = await db.collection("users").doc(targetUserId).get();
    if (!targetDoc.exists) {
      throw new HttpsError("not-found", "Staff member not found");
    }

    const targetData = targetDoc.data();
    if (targetData?.preschoolId !== preschoolId) {
      throw new HttpsError(
        "failed-precondition",
        "Staff member does not belong to this preschool",
      );
    }

    const auth = admin.auth();
    await auth.setCustomUserClaims(targetUserId, {
      role: "parent",
      preschoolId: null,
    });

    await db.collection("users").doc(targetUserId).set(
      {
        role: "parent",
        preschoolId: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { success: true };
  },
);
