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
import type { DailyActivity, ActivityItem } from "@przedszkole/shared";

// Query keys
export const activityKeys = {
  all: (preschoolId: string) => ["activities", preschoolId] as const,
  day: (preschoolId: string, dateStr: string) =>
    [...activityKeys.all(preschoolId), dateStr] as const,
  range: (preschoolId: string, fromDateStr: string, toDateStr: string) =>
    [...activityKeys.all(preschoolId), fromDateStr, toDateStr] as const,
};

// Fetch activities for a specific day
export function useDailyActivity(preschoolId: string, dateStr: string) {
  return useQuery({
    queryKey: activityKeys.day(preschoolId, dateStr),
    queryFn: async (): Promise<DailyActivity | null> => {
      if (!preschoolId) return null;

      const q = query(
        collection(db, "activities"),
        where("preschoolId", "==", preschoolId),
        where("dateStr", "==", dateStr),
      );
      
      const snap = await getDocs(q);
      if (snap.empty) return null;
      
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as DailyActivity & { id: string };
    },
    enabled: !!preschoolId && !!dateStr,
  });
}

export function useActivitiesInRange(
  preschoolId: string,
  fromDateStr: string,
  toDateStr: string,
) {
  return useQuery({
    queryKey: activityKeys.range(preschoolId, fromDateStr, toDateStr),
    queryFn: async (): Promise<(DailyActivity & { id: string })[]> => {
      if (!preschoolId || !fromDateStr || !toDateStr) return [];

      const q = query(
        collection(db, "activities"),
        where("preschoolId", "==", preschoolId),
        where("dateStr", ">=", fromDateStr),
        where("dateStr", "<=", toDateStr),
      );

      const snap = await getDocs(q);
      return snap.docs.map((activityDoc) => ({
        id: activityDoc.id,
        ...activityDoc.data(),
      })) as (DailyActivity & { id: string })[];
    },
    enabled: !!preschoolId && !!fromDateStr && !!toDateStr,
  });
}

// Save/update global daily activity document (Upsert)
export function useSaveDailyActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      preschoolId,
      dateStr,
      items,
      createdBy,
    }: {
      preschoolId: string;
      dateStr: string;
      items: ActivityItem[];
      createdBy: string;
    }) => {
      // Find existing document for this date if it exists
      const q = query(
        collection(db, "activities"),
        where("preschoolId", "==", preschoolId),
        where("dateStr", "==", dateStr),
      );
      const snap = await getDocs(q);
      
      const docRef = snap.empty
        ? doc(collection(db, "activities")) // Create new
        : doc(db, "activities", snap.docs[0].id); // Update existing

      // Sort items by time before saving
      const sortedItems = [...items].sort((a, b) => a.time.localeCompare(b.time));

      const payload = {
        preschoolId,
        dateStr,
        items: sortedItems,
        createdBy,
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, payload, { merge: true });
      return { id: docRef.id, ...payload };
    },
    onSuccess: (savedDoc) => {
      // Invalidate the specific day's query cache to trigger a refetch
      queryClient.invalidateQueries({
        queryKey: activityKeys.day(savedDoc.preschoolId, savedDoc.dateStr),
      });
      queryClient.invalidateQueries({
        queryKey: activityKeys.all(savedDoc.preschoolId),
      });
    },
  });
}
