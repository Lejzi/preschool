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
exports.p24Webhook = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const node_przelewy24_1 = require("@ingameltd/node-przelewy24");
const params_2 = require("firebase-functions/params");
const p24MerchantId = (0, params_2.defineString)("P24_MERCHANT_ID");
const p24PosId = (0, params_2.defineString)("P24_POS_ID");
const p24ApiKey = (0, params_1.defineSecret)("P24_API_KEY");
const p24CrcKey = (0, params_1.defineSecret)("P24_CRC_KEY");
const p24Sandbox = (0, params_2.defineString)("P24_SANDBOX", { default: "true" });
/**
 * p24Webhook — HTTP endpoint called by Przelewy24 IPN (Instant Payment Notification).
 * Verifies the transaction, then marks the invoice as paid.
 */
exports.p24Webhook = (0, https_1.onRequest)({
    region: "europe-west1",
    secrets: [p24ApiKey, p24CrcKey],
}, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const { merchantId, posId, sessionId, amount, originAmount, currency, orderId, methodId, statement, sign, } = req.body;
    const isSandbox = p24Sandbox.value() === "true";
    const p24 = new node_przelewy24_1.P24(parseInt(p24MerchantId.value()), parseInt(p24PosId.value()), p24ApiKey.value(), p24CrcKey.value(), { sandbox: isSandbox });
    const isValid = p24.verifyNotification({
        merchantId,
        posId,
        sessionId,
        amount,
        originAmount,
        currency,
        orderId,
        methodId,
        statement,
        sign,
    });
    if (!isValid) {
        console.error("Invalid P24 IPN signature for sessionId:", sessionId);
        res.status(400).send("Invalid signature");
        return;
    }
    // Verify transaction with P24
    await p24.verifyTransaction({
        sessionId,
        orderId,
        amount,
        currency,
    });
    // sessionId format: "{invoiceId}-{timestamp}"
    const invoiceId = sessionId.split("-").slice(0, -1).join("-");
    // Find invoice across all preschools (search by p24TransactionId)
    const db = admin.firestore();
    const snap = await db
        .collectionGroup("invoices")
        .where("p24TransactionId", "==", sessionId)
        .limit(1)
        .get();
    if (snap.empty) {
        console.error("Invoice not found for sessionId:", sessionId);
        res.status(404).send("Invoice not found");
        return;
    }
    const invoiceRef = snap.docs[0].ref;
    const invoice = snap.docs[0].data();
    // Mark invoice as paid
    await invoiceRef.update({
        status: "paid",
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    // Send FCM notification to parent
    const parentDoc = await db.collection("users").doc(invoice.parentId).get();
    const parent = parentDoc.data();
    if (parent?.fcmTokens?.length) {
        await admin.messaging().sendEachForMulticast({
            tokens: parent.fcmTokens,
            notification: {
                title: "Płatność potwierdzona ✓",
                body: `Faktura za ${invoice.kidName} (${invoice.month}) opłacona.`,
            },
            data: { invoiceId, type: "payment_confirmed" },
        });
    }
    res.status(200).send("OK");
});
//# sourceMappingURL=p24Webhook.js.map