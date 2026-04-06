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
import { httpsCallable } from "firebase/functions";
import { db } from "@/lib/firebase";
import { functions } from "@/lib/firebase";
import type { Kid } from "@przedszkole/shared";

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefinedDeep(item))
      .filter((item) => item !== undefined) as T;
  }

  if (value instanceof Date) {
    return value;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => [key, stripUndefinedDeep(entryValue)]);

    return Object.fromEntries(entries) as T;
  }

  return value;
}

export const kidKeys = {
  all: (preschoolId: string) => ["kids", preschoolId] as const,
  detail: (preschoolId: string, kidId: string) =>
    [...kidKeys.all(preschoolId), kidId] as const,
};

export function useKids(preschoolId: string) {
  return useQuery({
    queryKey: kidKeys.all(preschoolId),
    queryFn: async (): Promise<Kid[]> => {
      if (!preschoolId) return [];

      const q = query(
        collection(db, "kids"),
        where("preschoolId", "==", preschoolId),
      );
      const snap = await getDocs(q);

      return snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Kid[];
    },
    enabled: !!preschoolId,
  });
}

export function useKid(preschoolId: string, kidId: string) {
  return useQuery({
    queryKey: kidKeys.detail(preschoolId, kidId),
    queryFn: async (): Promise<Kid | null> => {
      if (!kidId) return null;
      const ref = doc(db, "kids", kidId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Kid;
    },
    enabled: !!preschoolId && !!kidId,
  });
}

export function useSaveKid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Kid> & { preschoolId: string }) => {
      const isNew = !data.id;
      const docRef = isNew ? doc(collection(db, "kids")) : doc(db, "kids", data.id!);

      const payload = stripUndefinedDeep({
        ...data,
        id: docRef.id,
        isActive: data.isActive ?? true,
        updatedAt: serverTimestamp(),
      });

      if (isNew) {
        payload.createdAt = serverTimestamp() as any;
      }

      await setDoc(docRef, payload, { merge: true });
      return payload;
    },
    onSuccess: (savedDoc) => {
      queryClient.invalidateQueries({
        queryKey: kidKeys.all(savedDoc.preschoolId as string),
      });
      queryClient.invalidateQueries({
        queryKey: kidKeys.detail(savedDoc.preschoolId as string, savedDoc.id as string),
      });
    },
  });
}

export function useDeleteKid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ preschoolId, kidId }: { preschoolId: string; kidId: string }) => {
      await deleteDoc(doc(db, "kids", kidId));
      return { preschoolId, kidId };
    },
    onSuccess: ({ preschoolId }) => {
      queryClient.invalidateQueries({ queryKey: kidKeys.all(preschoolId) });
    },
  });
}

export function useLinkGuardianToKid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      preschoolId: string;
      kidId: string;
      guardianEmail: string;
      guardianName?: string;
      guardianPhone?: string;
      guardianRelation?: string;
    }) => {
      const callable = httpsCallable(functions, "linkGuardianToKid");
      const result = await callable(data);
      return {
        ...(result.data as { success: boolean; uid: string }),
        preschoolId: data.preschoolId,
        kidId: data.kidId,
      };
    },
    onSuccess: ({ preschoolId, kidId }) => {
      queryClient.invalidateQueries({ queryKey: kidKeys.all(preschoolId) });
      queryClient.invalidateQueries({ queryKey: kidKeys.detail(preschoolId, kidId) });
    },
  });
}
