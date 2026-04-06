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
exports.createUserDocument = exports.setUserRole = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
/**
 * setUserRole — callable by super-admin or preschool admin.
 * Sets Firebase Auth custom claims and updates the user Firestore doc.
 */
exports.setUserRole = (0, https_1.onCall)({ region: "europe-west1" }, async (request) => {
    // Verify caller is admin or superadmin
    const callerClaims = request.auth?.token;
    const callerUid = request.auth?.uid;
    if (!callerUid)
        throw new https_1.HttpsError("unauthenticated", "Not authenticated");
    const db = admin.firestore();
    const callerDoc = await db.collection("users").doc(callerUid).get();
    const callerData = callerDoc.exists ? callerDoc.data() : null;
    const role = callerClaims?.role ||
        callerData?.role;
    const preschoolId = callerClaims?.preschoolId ||
        callerData?.preschoolId;
    if (role !== "superadmin" && role !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Only admins can assign roles");
    }
    const { targetUserId, targetRole, targetPreschoolId } = request.data;
    // Admin can only assign roles within their own preschool
    if (role === "admin" && targetPreschoolId !== preschoolId) {
        throw new https_1.HttpsError("permission-denied", "Cannot assign roles outside your preschool");
    }
    // Superadmin can assign any role; admin can only assign teacher/parent
    if (role === "admin" &&
        (targetRole === "superadmin" || targetRole === "admin")) {
        throw new https_1.HttpsError("permission-denied", "Cannot assign admin or superadmin roles");
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
});
/**
 * onUserCreated — triggered when a new Firebase Auth user is created.
 * Creates the user document in Firestore with default 'parent' role.
 */
const firestore_1 = require("firebase-functions/v2/firestore");
exports.createUserDocument = (0, firestore_1.onDocumentCreated)({ document: "users/{userId}", region: "europe-west1" }, async (_event) => {
    // This is handled in inviteUser cloud function
    // Kept here as a fallback for self-registered users
});
//# sourceMappingURL=setUserRole.js.map