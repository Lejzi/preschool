import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AttendanceDay, AttendanceStatus } from "@przedszkole/shared";

export const attendanceKeys = {
  all: (preschoolId: string) => ["attendance", preschoolId] as const,
  day: (preschoolId: string, dateStr: string) =>
    [...attendanceKeys.all(preschoolId), dateStr] as const,
};

export function useAttendanceDay(preschoolId: string, dateStr: string) {
  return useQuery({
    queryKey: attendanceKeys.day(preschoolId, dateStr),
    queryFn: async (): Promise<AttendanceDay | null> => {
      if (!preschoolId || !dateStr) return null;

      const q = query(
        collection(db, "attendance"),
        where("preschoolId", "==", preschoolId),
        where("dateStr", "==", dateStr),
      );
      const snap = await getDocs(q);
      
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as AttendanceDay & { id: string };
    },
    enabled: !!preschoolId && !!dateStr,
  });
}

export function useSaveAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      preschoolId,
      dateStr,
      entries,
    }: {
      preschoolId: string;
      dateStr: string;
      entries: Record<string, { status: AttendanceStatus; recordedBy: string; kidId: string }>;
    }) => {
      const q = query(
        collection(db, "attendance"),
        where("preschoolId", "==", preschoolId),
        where("dateStr", "==", dateStr),
      );
      const snap = await getDocs(q);
      
      const docRef = snap.empty
        ? doc(collection(db, "attendance"))
        : doc(db, "attendance", snap.docs[0].id);

      // Create valid firestore entries
      const firestoreEntries: Record<string, { kidId: string; status: AttendanceStatus; recordedBy: string; updatedAt: import("firebase/firestore").FieldValue; checkInTime: import("firebase/firestore").FieldValue | null; checkOutTime: import("firebase/firestore").FieldValue | null }> = {};
      Object.entries(entries).forEach(([kidId, entry]) => {
        firestoreEntries[kidId] = {
          kidId,
          status: entry.status,
          recordedBy: entry.recordedBy,
          updatedAt: serverTimestamp(),
          checkInTime: null,
          checkOutTime: null,
        };
      });

      const payload = {
        preschoolId,
        dateStr,
        entries: firestoreEntries,
      };

      await setDoc(docRef, payload, { merge: true });
      return { id: docRef.id, ...payload };
    },
    onSuccess: (savedDoc) => {
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.day(savedDoc.preschoolId, savedDoc.dateStr),
      });
    },
  });
}
