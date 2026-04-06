import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

function nameToCode(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 30);
}

/**
 * createPreschool — creates a new preschool document.
 * Only callable by superadmin.
 */
export const createPreschool = onCall(
  { region: "europe-west1" },
  async (request) => {
    const callerClaims = request.auth?.token;
    const callerUid = request.auth?.uid;
    if (!callerUid) {
      throw new HttpsError(
        "unauthenticated",
        "Musisz być zalogowany, aby utworzyć przedszkole.",
      );
    }

    const db = admin.firestore();
    let isSuperAdmin = callerClaims?.role === "superadmin";

    // Compatibility fallback for existing accounts that have a Firestore role
    // set to superadmin but are still missing Firebase Auth custom claims.
    if (!isSuperAdmin) {
      const callerDoc = await db.collection("users").doc(callerUid).get();
      const callerRole = callerDoc.exists ? callerDoc.data()?.role : null;
      if (callerRole === "superadmin") {
        isSuperAdmin = true;
      }
    }

    if (!isSuperAdmin) {
      throw new HttpsError(
        "permission-denied",
        "Tylko superadministrator moze tworzyc przedszkola.",
      );
    }

    const {
      name,
      address,
      phone,
      email: preschoolEmail,
      customCode,
    } = request.data as {
      name: string;
      address: {
        street: string;
        city: string;
        postalCode: string;
        country: string;
      };
      phone?: string;
      email?: string;
      customCode?: string;
    };

    if (!name || !address) {
      throw new HttpsError(
        "invalid-argument",
        "Nazwa i adres przedszkola sa wymagane.",
      );
    }

    const code = customCode || nameToCode(name);

    // Check code uniqueness
    const existing = await db
      .collection("preschools")
      .where("code", "==", code)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new HttpsError(
        "already-exists",
        `Kod przedszkola "${code}" jest juz zajety.`,
      );
    }

    const docRef = db.collection("preschools").doc();
    await docRef.set({
      id: docRef.id,
      code,
      name,
      address,
      phone: phone || null,
      email: preschoolEmail || null,
      logoUrl: null,
      settings: {
        timezone: "Europe/Warsaw",
        workingHours: { open: "07:00", close: "17:00" },
        currency: "PLN",
        defaultLanguage: "pl",
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, preschoolId: docRef.id, code };
  },
);
