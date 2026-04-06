import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Announcement } from "@przedszkole/shared";

export const announcementKeys = {
  all: (preschoolId: string) => ["announcements", preschoolId] as const,
};

export function useAnnouncements(preschoolId: string, limitCount = 50) {
  return useQuery({
    queryKey: announcementKeys.all(preschoolId),
    queryFn: async (): Promise<(Announcement & { id: string })[]> => {
      if (!preschoolId) return [];

      const q = query(
        collection(db, "announcements"),
        where("preschoolId", "==", preschoolId),
        // orderBy("createdAt", "desc") // requires index if we combine with where
      );
      const snap = await getDocs(q);

      const items = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (Announcement & { id: string })[];

      // Sort in memory to avoid needing immediate composite index setup for MVP
      return items.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA; 
      }).slice(0, limitCount);
    },
    enabled: !!preschoolId,
  });
}

export function useSaveAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Announcement> & { preschoolId: string }) => {
      const isNew = !data.id;
      const ref = isNew ? doc(collection(db, "announcements")) : doc(db, "announcements", data.id!);

      const payload = {
        ...data,
        id: ref.id,
        updatedAt: serverTimestamp(),
        comments: data.comments || [],
      };

      if (isNew) {
        payload.createdAt = serverTimestamp() as any;
      }

      await setDoc(ref, payload, { merge: true });
      return payload;
    },
    onSuccess: (savedDoc) => {
      queryClient.invalidateQueries({
        queryKey: announcementKeys.all(savedDoc.preschoolId as string),
      });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ preschoolId, id }: { preschoolId: string; id: string }) => {
      await deleteDoc(doc(db, "announcements", id));
      return { preschoolId, id };
    },
    onSuccess: ({ preschoolId }) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all(preschoolId) });
    },
  });
}
