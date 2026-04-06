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
exports.initiatePayment = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const node_przelewy24_1 = require("@ingameltd/node-przelewy24");
const p24MerchantId = (0, params_1.defineString)("P24_MERCHANT_ID");
const p24PosId = (0, params_1.defineString)("P24_POS_ID");
const p24ApiKey = (0, params_1.defineSecret)("P24_API_KEY");
const p24CrcKey = (0, params_1.defineSecret)("P24_CRC_KEY");
const p24Sandbox = (0, params_1.defineString)("P24_SANDBOX", { default: "true" });
const appBaseUrl = (0, params_1.defineString)("APP_BASE_URL");
/**
 * initiatePayment — creates a Przelewy24 transaction for an invoice.
 * Returns a redirect URL for the parent to complete payment.
 */
exports.initiatePayment = (0, https_1.onCall)({
    region: "europe-west1",
    secrets: [p24ApiKey, p24CrcKey],
}, async (request) => {
    const callerClaims = request.auth?.token;
    if (!callerClaims)
        throw new https_1.HttpsError("unauthenticated", "Not authenticated");
    const { invoiceId, preschoolId } = request.data;
    const db = admin.firestore();
    // Fetch invoice
    const invoiceDoc = await db
        .collection("preschools")
        .doc(preschoolId)
        .collection("invoices")
        .doc(invoiceId)
        .get();
    if (!invoiceDoc.exists)
        throw new https_1.HttpsError("not-found", "Invoice not found");
    const invoice = invoiceDoc.data();
    // Verify caller is the invoice's parent
    if (callerClaims.role !== "admin" && callerClaims.role !== "superadmin") {
        if (invoice.parentId !== request.auth?.uid) {
            throw new https_1.HttpsError("permission-denied", "Not your invoice");
        }
    }
    if (invoice.status === "paid") {
        throw new https_1.HttpsError("failed-precondition", "Invoice already paid");
    }
    // Fetch parent email
    const parentDoc = await db.collection("users").doc(invoice.parentId).get();
    const parent = parentDoc.data();
    const isSandbox = p24Sandbox.value() === "true";
    const p24 = new node_przelewy24_1.P24(parseInt(p24MerchantId.value()), parseInt(p24PosId.value()), p24ApiKey.value(), p24CrcKey.value(), { sandbox: isSandbox });
    const sessionId = `${invoiceId}-${Date.now()}`;
    const baseUrl = appBaseUrl.value();
    const transaction = await p24.createTransaction({
        sessionId,
        amount: invoice.totalAmountGrosze,
        currency: node_przelewy24_1.Currency.PLN,
        description: `Przedszkole — ${invoice.kidName} — ${invoice.month}`,
        email: parent?.email || "",
        country: node_przelewy24_1.Country.Poland,
        language: node_przelewy24_1.Language.PL,
        urlReturn: `${baseUrl}/${preschoolId}/billing/payment-result?invoiceId=${invoiceId}&status=success`,
        urlStatus: `https://europe-west1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/p24Webhook`,
    });
    const paymentUrl = transaction.link;
    // Save transaction info to invoice
    await invoiceDoc.ref.update({
        status: "sent",
        p24TransactionId: sessionId,
        p24PaymentUrl: paymentUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, paymentUrl };
});
//# sourceMappingURL=initiatePayment.js.map