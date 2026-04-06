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
exports.createPreschool = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
function nameToCode(name) {
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
exports.createPreschool = (0, https_1.onCall)({ region: "europe-west1" }, async (request) => {
    const callerClaims = request.auth?.token;
    const callerUid = request.auth?.uid;
    if (!callerUid) {
        throw new https_1.HttpsError("unauthenticated", "Musisz być zalogowany, aby utworzyć przedszkole.");
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
        throw new https_1.HttpsError("permission-denied", "Tylko superadministrator moze tworzyc przedszkola.");
    }
    const { name, address, phone, email: preschoolEmail, customCode, } = request.data;
    if (!name || !address) {
        throw new https_1.HttpsError("invalid-argument", "Nazwa i adres przedszkola sa wymagane.");
    }
    const code = customCode || nameToCode(name);
    // Check code uniqueness
    const existing = await db
        .collection("preschools")
        .where("code", "==", code)
        .limit(1)
        .get();
    if (!existing.empty) {
        throw new https_1.HttpsError("already-exists", `Kod przedszkola "${code}" jest juz zajety.`);
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
});
//# sourceMappingURL=createPreschool.js.map