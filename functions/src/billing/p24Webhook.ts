import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { P24 } from "@ingameltd/node-przelewy24";
import { defineString } from "firebase-functions/params";

const p24MerchantId = defineString("P24_MERCHANT_ID");
const p24PosId = defineString("P24_POS_ID");
const p24ApiKey = defineSecret("P24_API_KEY");
const p24CrcKey = defineSecret("P24_CRC_KEY");
const p24Sandbox = defineString("P24_SANDBOX", { default: "true" });

/**
 * p24Webhook — HTTP endpoint called by Przelewy24 IPN (Instant Payment Notification).
 * Verifies the transaction, then marks the invoice as paid.
 */
export const p24Webhook = onRequest(
  {
    region: "europe-west1",
    secrets: [p24ApiKey, p24CrcKey],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const {
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
    } = req.body;

    const isSandbox = p24Sandbox.value() === "true";
    const p24 = new P24(
      parseInt(p24MerchantId.value()),
      parseInt(p24PosId.value()),
      p24ApiKey.value(),
      p24CrcKey.value(),
      { sandbox: isSandbox },
    );

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
  },
);
