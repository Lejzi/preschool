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
exports.generateInvoice = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
/**
 * generateInvoice — generates an invoice for a kid for a given month.
 * Reads billing items + attendance, calculates total. Only callable by admin.
 */
exports.generateInvoice = (0, https_1.onCall)({ region: "europe-west1" }, async (request) => {
    const callerClaims = request.auth?.token;
    if (!callerClaims ||
        (callerClaims.role !== "admin" && callerClaims.role !== "superadmin")) {
        throw new https_1.HttpsError("permission-denied", "Only admins can generate invoices");
    }
    const { preschoolId, kidId, parentId, month } = request.data;
    const db = admin.firestore();
    // Get kid info
    const kidDoc = await db
        .collection("preschools")
        .doc(preschoolId)
        .collection("kids")
        .doc(kidId)
        .get();
    if (!kidDoc.exists)
        throw new https_1.HttpsError("not-found", "Kid not found");
    const kid = kidDoc.data();
    // Get active billing items
    const billingItemsSnap = await db
        .collection("preschools")
        .doc(preschoolId)
        .collection("billingItems")
        .where("isActive", "==", true)
        .get();
    const billingItems = billingItemsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    }));
    // Get attendance for the month
    const [year, monthNum] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    let presentDays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const attSnap = await db
            .collection("preschools")
            .doc(preschoolId)
            .collection("attendance")
            .doc(dateStr)
            .collection("entries")
            .doc(kidId)
            .get();
        if (attSnap.exists) {
            const entry = attSnap.data();
            if (entry.status === "present" || entry.status === "late") {
                presentDays++;
            }
        }
    }
    // Build line items
    const lineItems = billingItems.map((item) => {
        let quantity = 1;
        if (item.type === "attendance_per_day") {
            quantity = presentDays;
        }
        return {
            billingItemId: item.id,
            name: item.name,
            quantity,
            unitAmountGrosze: item.amountGrosze,
            totalAmountGrosze: item.amountGrosze * quantity,
            notes: item.type === "attendance_per_day"
                ? `${presentDays} days attended`
                : undefined,
        };
    });
    const totalAmountGrosze = lineItems.reduce((sum, li) => sum + li.totalAmountGrosze, 0);
    // Due date = 10th of next month
    const dueDate = new Date(year, monthNum, 10); // month is 0-indexed, so monthNum works as "next month"
    const invoiceRef = db
        .collection("preschools")
        .doc(preschoolId)
        .collection("invoices")
        .doc();
    await invoiceRef.set({
        id: invoiceRef.id,
        preschoolId,
        kidId,
        kidName: `${kid.firstName} ${kid.lastName}`,
        parentId,
        month,
        lineItems,
        totalAmountGrosze,
        status: "draft",
        p24TransactionId: null,
        p24PaymentUrl: null,
        paidAt: null,
        dueDate: admin.firestore.Timestamp.fromDate(dueDate),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, invoiceId: invoiceRef.id, totalAmountGrosze };
});
//# sourceMappingURL=generateInvoice.js.map