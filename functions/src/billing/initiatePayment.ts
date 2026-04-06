import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineString, defineSecret } from "firebase-functions/params";
import { P24, Currency, Country, Language } from "@ingameltd/node-przelewy24";

const p24MerchantId = defineString("P24_MERCHANT_ID");
const p24PosId = defineString("P24_POS_ID");
const p24ApiKey = defineSecret("P24_API_KEY");
const p24CrcKey = defineSecret("P24_CRC_KEY");
const p24Sandbox = defineString("P24_SANDBOX", { default: "true" });
const appBaseUrl = defineString("APP_BASE_URL");

/**
 * initiatePayment — creates a Przelewy24 transaction for an invoice.
 * Returns a redirect URL for the parent to complete payment.
 */
export const initiatePayment = onCall(
  {
    region: "europe-west1",
    secrets: [p24ApiKey, p24CrcKey],
  },
  async (request) => {
    const callerClaims = request.auth?.token;
    if (!callerClaims)
      throw new HttpsError("unauthenticated", "Not authenticated");

    const { invoiceId, preschoolId } = request.data as {
      invoiceId: string;
      preschoolId: string;
    };

    const db = admin.firestore();

    // Fetch invoice
    const invoiceDoc = await db
      .collection("preschools")
      .doc(preschoolId)
      .collection("invoices")
      .doc(invoiceId)
      .get();

    if (!invoiceDoc.exists)
      throw new HttpsError("not-found", "Invoice not found");
    const invoice = invoiceDoc.data()!;

    // Verify caller is the invoice's parent
    if (callerClaims.role !== "admin" && callerClaims.role !== "superadmin") {
      if (invoice.parentId !== request.auth?.uid) {
        throw new HttpsError("permission-denied", "Not your invoice");
      }
    }

    if (invoice.status === "paid") {
      throw new HttpsError("failed-precondition", "Invoice already paid");
    }

    // Fetch parent email
    const parentDoc = await db.collection("users").doc(invoice.parentId).get();
    const parent = parentDoc.data();

    const isSandbox = p24Sandbox.value() === "true";
    const p24 = new P24(
      parseInt(p24MerchantId.value()),
      parseInt(p24PosId.value()),
      p24ApiKey.value(),
      p24CrcKey.value(),
      { sandbox: isSandbox },
    );

    const sessionId = `${invoiceId}-${Date.now()}`;
    const baseUrl = appBaseUrl.value();

    const transaction = await p24.createTransaction({
      sessionId,
      amount: invoice.totalAmountGrosze,
      currency: Currency.PLN,
      description: `Przedszkole — ${invoice.kidName} — ${invoice.month}`,
      email: parent?.email || "",
      country: Country.Poland,
      language: Language.PL,
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
  },
);
