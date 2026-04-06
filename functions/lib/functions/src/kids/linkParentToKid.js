"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkGuardianToKid = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
exports.linkGuardianToKid = (0, https_1.onCall)({ region: "europe-west1" }, async (request) => {
    const callerClaims = request.auth?.token;
    const callerUid = request.auth?.uid;
    if (!callerUid) {
        throw new https_1.HttpsError("unauthenticated", "Not authenticated");
    }
    const db = admin.firestore();
    const auth = admin.auth();
    const callerDoc = await db.collection("users").doc(callerUid).get();
    const callerData = callerDoc.exists ? callerDoc.data() : null;
    const callerRole = callerClaims?.role ||
        callerData?.role;
    const callerPreschoolId = callerClaims?.preschoolId ||
        callerData?.preschoolId;
    if (callerRole !== "superadmin" && callerRole !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Only admins can link guardians to kids");
    }
    const { preschoolId, kidId, guardianEmail, guardianName, guardianPhone, guardianRelation, } = request.data;
    if (!preschoolId || !kidId || !guardianEmail) {
        throw new https_1.HttpsError("invalid-argument", "Missing required fields");
    }
    if (callerRole === "admin" && preschoolId !== callerPreschoolId) {
        throw new https_1.HttpsError("permission-denied", "Cannot manage kids in another preschool");
    }
    const kidRef = db.collection("kids").doc(kidId);
    const kidSnap = await kidRef.get();
    if (!kidSnap.exists) {
        throw new https_1.HttpsError("not-found", "Kid not found");
    }
    const kidData = kidSnap.data();
    if (kidData?.preschoolId !== preschoolId) {
        throw new https_1.HttpsError("failed-precondition", "Kid does not belong to this preschool");
    }
    let uid;
    let existingRole = null;
    let existingPreschoolId = null;
    let existingDisplayName = "";
    try {
        const existingUser = await auth.getUserByEmail(guardianEmail);
        uid = existingUser.uid;
        const existingUserDoc = await db.collection("users").doc(uid).get();
        if (existingUserDoc.exists) {
            const userData = existingUserDoc.data();
            existingRole = userData?.role || null;
            existingPreschoolId =
                userData?.preschoolId ?? null;
            existingDisplayName =
                userData?.displayName ||
                    existingUser.displayName ||
                    "";
        }
        else {
            existingDisplayName = existingUser.displayName || "";
        }
    }
    catch {
        const tempPassword = Math.random().toString(36).slice(-12) + "Aa1!";
        const newUser = await auth.createUser({
            email: guardianEmail,
            displayName: guardianName || guardianEmail.split("@")[0],
            password: tempPassword,
        });
        uid = newUser.uid;
    }
    if (existingRole && existingRole !== "parent") {
        throw new https_1.HttpsError("failed-precondition", "This email already belongs to a non-parent account");
    }
    if (existingPreschoolId && existingPreschoolId !== preschoolId) {
        throw new https_1.HttpsError("failed-precondition", "This parent is already assigned to another preschool");
    }
    await auth.setCustomUserClaims(uid, {
        role: "parent",
        preschoolId,
    });
    await db.collection("users").doc(uid).set({
        email: guardianEmail,
        displayName: guardianName ||
            existingDisplayName ||
            guardianEmail.split("@")[0],
        role: "parent",
        preschoolId,
        phone: guardianPhone || null,
        linkedKidIds: admin.firestore.FieldValue.arrayUnion(kidId),
        fcmTokens: [],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    const existingGuardians = Array.isArray(kidData?.guardians)
        ? kidData?.guardians
        : [];
    const nextGuardians = existingGuardians.filter((guardian) => guardian.email?.toLowerCase() !== guardianEmail.toLowerCase() && guardian.uid !== uid);
    nextGuardians.push({
        uid,
        email: guardianEmail,
        phone: guardianPhone || null,
        name: guardianName || existingDisplayName || guardianEmail.split("@")[0],
        relation: guardianRelation || null,
    });
    await kidRef.set({
        parentIds: admin.firestore.FieldValue.arrayUnion(uid),
        guardians: nextGuardians,
        primaryParentEmail: guardianEmail,
        primaryParentName: guardianName || existingDisplayName || kidData?.primaryParentName || "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { success: true, uid };
});
//# sourceMappingURL=linkParentToKid.js.map