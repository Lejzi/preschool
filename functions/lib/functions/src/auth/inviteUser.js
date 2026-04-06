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
exports.inviteUser = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
/**
 * inviteUser — invite a staff member (teacher/parent) to a preschool.
 * Creates (or finds) a Firebase Auth user, sets custom claims, creates Firestore doc.
 * Only callable by preschool admin.
 */
exports.inviteUser = (0, https_1.onCall)({ region: "europe-west1" }, async (request) => {
    const callerClaims = request.auth?.token;
    const callerUid = request.auth?.uid;
    if (!callerUid)
        throw new https_1.HttpsError("unauthenticated", "Not authenticated");
    const db = admin.firestore();
    const callerDoc = await db.collection("users").doc(callerUid).get();
    const callerData = callerDoc.exists ? callerDoc.data() : null;
    const callerRole = callerClaims?.role ||
        callerData?.role;
    const callerPreschoolId = callerClaims?.preschoolId ||
        callerData?.preschoolId;
    if (callerRole !== "superadmin" && callerRole !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Only admins can invite users");
    }
    const { email, displayName, role, preschoolId } = request.data;
    // Admin can only invite to their own preschool
    if (callerRole === "admin" && preschoolId !== callerPreschoolId) {
        throw new https_1.HttpsError("permission-denied", "Cannot invite to another preschool");
    }
    const auth = admin.auth();
    let uid;
    try {
        // Try to get existing user
        const existingUser = await auth.getUserByEmail(email);
        uid = existingUser.uid;
    }
    catch {
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
    await db.collection("users").doc(uid).set({
        email,
        displayName,
        role,
        preschoolId,
        linkedKidIds: [],
        fcmTokens: [],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    // TODO: send welcome email via Firebase Extensions (Trigger Email)
    return { success: true, uid };
});
//# sourceMappingURL=inviteUser.js.map