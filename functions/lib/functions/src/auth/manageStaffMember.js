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
exports.removeStaffMember = exports.updateStaffMember = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
function assertAdminAccess(callerRole, callerUid) {
    if (!callerUid) {
        throw new https_1.HttpsError("unauthenticated", "Not authenticated");
    }
    if (callerRole !== "superadmin" && callerRole !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Only admins can manage staff");
    }
}
exports.updateStaffMember = (0, https_1.onCall)({ region: "europe-west1" }, async (request) => {
    const callerClaims = request.auth?.token;
    const callerUid = request.auth?.uid;
    const db = admin.firestore();
    const callerDoc = await db.collection("users").doc(callerUid || "").get();
    const callerData = callerDoc.exists ? callerDoc.data() : null;
    const callerRole = callerClaims?.role ||
        callerData?.role;
    const callerPreschoolId = callerClaims?.preschoolId ||
        callerData?.preschoolId;
    assertAdminAccess(callerRole, callerUid);
    const { targetUserId, displayName, role, preschoolId } = request.data;
    if (!targetUserId || !displayName || !role || !preschoolId) {
        throw new https_1.HttpsError("invalid-argument", "Missing required fields");
    }
    if (callerRole === "admin" && preschoolId !== callerPreschoolId) {
        throw new https_1.HttpsError("permission-denied", "Cannot manage staff outside your preschool");
    }
    const targetDoc = await db.collection("users").doc(targetUserId).get();
    if (!targetDoc.exists) {
        throw new https_1.HttpsError("not-found", "Staff member not found");
    }
    const targetData = targetDoc.data();
    if (callerRole === "admin" &&
        targetData?.preschoolId !== callerPreschoolId) {
        throw new https_1.HttpsError("permission-denied", "Cannot manage staff outside your preschool");
    }
    const auth = admin.auth();
    await auth.updateUser(targetUserId, { displayName });
    await auth.setCustomUserClaims(targetUserId, {
        role,
        preschoolId,
    });
    await db.collection("users").doc(targetUserId).set({
        displayName,
        role,
        preschoolId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { success: true };
});
exports.removeStaffMember = (0, https_1.onCall)({ region: "europe-west1" }, async (request) => {
    const callerClaims = request.auth?.token;
    const callerUid = request.auth?.uid;
    const db = admin.firestore();
    const callerDoc = await db.collection("users").doc(callerUid || "").get();
    const callerData = callerDoc.exists ? callerDoc.data() : null;
    const callerRole = callerClaims?.role ||
        callerData?.role;
    const callerPreschoolId = callerClaims?.preschoolId ||
        callerData?.preschoolId;
    assertAdminAccess(callerRole, callerUid);
    const { targetUserId, preschoolId } = request.data;
    if (!targetUserId || !preschoolId) {
        throw new https_1.HttpsError("invalid-argument", "Missing required fields");
    }
    if (callerUid === targetUserId) {
        throw new https_1.HttpsError("failed-precondition", "Cannot remove yourself");
    }
    if (callerRole === "admin" && preschoolId !== callerPreschoolId) {
        throw new https_1.HttpsError("permission-denied", "Cannot manage staff outside your preschool");
    }
    const targetDoc = await db.collection("users").doc(targetUserId).get();
    if (!targetDoc.exists) {
        throw new https_1.HttpsError("not-found", "Staff member not found");
    }
    const targetData = targetDoc.data();
    if (targetData?.preschoolId !== preschoolId) {
        throw new https_1.HttpsError("failed-precondition", "Staff member does not belong to this preschool");
    }
    const auth = admin.auth();
    await auth.setCustomUserClaims(targetUserId, {
        role: "parent",
        preschoolId: null,
    });
    await db.collection("users").doc(targetUserId).set({
        role: "parent",
        preschoolId: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { success: true };
});
//# sourceMappingURL=manageStaffMember.js.map