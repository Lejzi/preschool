import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Invoice } from "@przedszkole/shared";

export const billingKeys = {
  all: (preschoolId: string) => ["invoices", preschoolId] as const,
  byKids: (preschoolId: string, kidIds: string[]) => ["invoices", preschoolId, { kidIds }] as const,
};

// Hook to get invoices. If kidIds is provided, filters by those kids (for parents).
export function useInvoices(preschoolId: string, kidIds?: string[]) {
  return useQuery({
    queryKey: kidIds?.length ? billingKeys.byKids(preschoolId, kidIds) : billingKeys.all(preschoolId),
    queryFn: async (): Promise<Invoice[]> => {
      if (!preschoolId || (kidIds && kidIds.length === 0)) return [];

      const constraints = [where("preschoolId", "==", preschoolId)];
      if (kidIds && kidIds.length > 0) {
        // Firestore 'in' has a limit of 10, should be fine for parents
        constraints.push(where("kidId", "in", kidIds.slice(0, 10)));
      }

      const q = query(collection(db, "invoices"), ...constraints);
      const snap = await getDocs(q);

      const invs = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Invoice[];

      // Sort by month desc
      return invs.sort((a, b) => b.month.localeCompare(a.month));
    },
    enabled: !!preschoolId,
  });
}

// Admin hook to create/update an invoice
export function useSaveInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Invoice> & { preschoolId: string; kidId: string }) => {
      const isNew = !data.id;
      const ref = isNew ? doc(collection(db, "invoices")) : doc(db, "invoices", data.id!);

      const payload = {
        ...data,
        id: ref.id,
        updatedAt: serverTimestamp(),
      };

      if (isNew) {
        payload.createdAt = serverTimestamp() as unknown as import("firebase/firestore").Timestamp;
        if (!payload.status) payload.status = "sent";
      }

      await setDoc(ref, payload, { merge: true });
      return payload as unknown as Invoice;
    },
    onSuccess: (savedDoc) => {
      queryClient.invalidateQueries({
        queryKey: billingKeys.all(savedDoc.preschoolId),
      });
      queryClient.invalidateQueries({
        queryKey: billingKeys.byKids(savedDoc.preschoolId, [savedDoc.kidId]),
      });
    },
  });
}

// Parent/Admin hook to mark as paid
export function useMarkInvoicePaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ preschoolId, kidId, invoiceId, paidAt }: { preschoolId: string; kidId: string; invoiceId: string; paidAt: string }) => {
      const ref = doc(db, "invoices", invoiceId);
      await updateDoc(ref, {
        status: "paid",
        paidAt,
        updatedAt: serverTimestamp(),
      });
      return { preschoolId, kidId };
    },
    onSuccess: ({ preschoolId, kidId }) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.all(preschoolId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.byKids(preschoolId, [kidId]) });
    },
  });
}
