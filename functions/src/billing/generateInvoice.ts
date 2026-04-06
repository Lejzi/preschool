import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { BillingItemType, countPresentDays } from "@przedszkole/shared";

/**
 * generateInvoice — generates an invoice for a kid for a given month.
 * Reads billing items + attendance, calculates total. Only callable by admin.
 */
export const generateInvoice = onCall(
  { region: "europe-west1" },
  async (request) => {
    const callerClaims = request.auth?.token;
    if (
      !callerClaims ||
      (callerClaims.role !== "admin" && callerClaims.role !== "superadmin")
    ) {
      throw new HttpsError(
        "permission-denied",
        "Only admins can generate invoices",
      );
    }

    const { preschoolId, kidId, parentId, month } = request.data as {
      preschoolId: string;
      kidId: string;
      parentId: string;
      month: string; // "2025-02"
    };

    const db = admin.firestore();

    // Get kid info
    const kidDoc = await db
      .collection("preschools")
      .doc(preschoolId)
      .collection("kids")
      .doc(kidId)
      .get();

    if (!kidDoc.exists) throw new HttpsError("not-found", "Kid not found");
    const kid = kidDoc.data()!;

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
    })) as Array<{
      id: string;
      name: string;
      type: BillingItemType;
      amountGrosze: number;
      description?: string;
    }>;

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
        const entry = attSnap.data()!;
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
        notes:
          item.type === "attendance_per_day"
            ? `${presentDays} days attended`
            : undefined,
      };
    });

    const totalAmountGrosze = lineItems.reduce(
      (sum, li) => sum + li.totalAmountGrosze,
      0,
    );

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
  },
);
