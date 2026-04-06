import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Group } from "@przedszkole/shared";

export const groupKeys = {
  all: (preschoolId: string) => ["groups", preschoolId] as const,
  detail: (preschoolId: string, groupId: string) =>
    [...groupKeys.all(preschoolId), groupId] as const,
};

export function useGroups(preschoolId: string) {
  return useQuery({
    queryKey: groupKeys.all(preschoolId),
    queryFn: async (): Promise<Group[]> => {
      if (!preschoolId) return [];

      const q = query(
        collection(db, "groups"),
        where("preschoolId", "==", preschoolId),
      );
      const snap = await getDocs(q);

      return snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Group[];
    },
    enabled: !!preschoolId,
  });
}

export function useGroup(preschoolId: string, groupId: string) {
  return useQuery({
    queryKey: groupKeys.detail(preschoolId, groupId),
    queryFn: async (): Promise<Group | null> => {
      if (!groupId) return null;
      const ref = doc(db, "groups", groupId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Group;
    },
    enabled: !!preschoolId && !!groupId,
  });
}

export function useSaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Group> & { preschoolId: string }) => {
      const isNew = !data.id;
      const docRef = isNew ? doc(collection(db, "groups")) : doc(db, "groups", data.id!);

      const payload = {
        ...data,
        id: docRef.id,
      };

      if (isNew) {
        payload.createdAt = serverTimestamp() as any;
      }

      await setDoc(docRef, payload, { merge: true });
      return payload;
    },
    onSuccess: (savedDoc) => {
      queryClient.invalidateQueries({
        queryKey: groupKeys.all(savedDoc.preschoolId as string),
      });
      if (savedDoc.id) {
        queryClient.invalidateQueries({
          queryKey: groupKeys.detail(savedDoc.preschoolId as string, savedDoc.id as string),
        });
      }
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ preschoolId, groupId }: { preschoolId: string; groupId: string }) => {
      await deleteDoc(doc(db, "groups", groupId));
      return { preschoolId, groupId };
    },
    onSuccess: ({ preschoolId }) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all(preschoolId) });
    },
  });
}
