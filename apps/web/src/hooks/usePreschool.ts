import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import type { Preschool } from "@przedszkole/shared";

export const preschoolKeys = {
  all: ["preschools"] as const,
  detail: (id: string) => ["preschool", id] as const,
  byCode: (code: string) => ["preschoolByCode", code] as const,
};

export interface PreschoolListItem extends Preschool {
  kidCount: number;
  staffCount: number;
}

export function usePreschools() {
  return useQuery({
    queryKey: preschoolKeys.all,
    queryFn: async (): Promise<PreschoolListItem[]> => {
      const snap = await getDocs(collection(db, "preschools"));
      const preschools = snap.docs.map((preschoolDoc) => ({
        id: preschoolDoc.id,
        ...preschoolDoc.data(),
      })) as Preschool[];

      const rows = await Promise.all(
        preschools.map(async (preschool) => {
          const [kidsCount, staffCount] = await Promise.all([
            getCountFromServer(
              query(
                collection(db, "kids"),
                where("preschoolId", "==", preschool.id),
                where("isActive", "==", true),
              ),
            ),
            getCountFromServer(
              query(
                collection(db, "users"),
                where("preschoolId", "==", preschool.id),
              ),
            ),
          ]);

          return {
            ...preschool,
            kidCount: kidsCount.data().count,
            staffCount: staffCount.data().count,
          };
        }),
      );

      return rows.sort((a, b) => a.name.localeCompare(b.name, "pl"));
    },
  });
}

export function usePreschool(id: string) {
  return useQuery({
    queryKey: preschoolKeys.detail(id),
    queryFn: async (): Promise<Preschool | null> => {
      if (!id) return null;
      const snap = await getDoc(doc(db, "preschools", id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Preschool;
    },
    enabled: !!id,
  });
}

export function usePreschoolByCode(code: string) {
  return useQuery({
    queryKey: preschoolKeys.byCode(code),
    queryFn: async (): Promise<Preschool | null> => {
      if (!code) return null;
      const snap = await getDocs(
        query(collection(db, "preschools"), where("code", "==", code)),
      );
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as Preschool;
    },
    enabled: !!code,
  });
}

export function useActivePreschoolContext() {
  const { preschoolCode: routePreschoolCode } = useParams();
  const { preschoolId: authPreschoolId, preschoolCode: authPreschoolCode, role } =
    useAuthStore();
  const effectiveCode = routePreschoolCode || authPreschoolCode || "";
  const shouldResolveByCode = !authPreschoolId && !!effectiveCode;
  const { data: routePreschool, isLoading } = usePreschoolByCode(
    shouldResolveByCode ? effectiveCode : "",
  );

  return {
    preschoolId: authPreschoolId || routePreschool?.id || null,
    preschoolCode: effectiveCode || routePreschool?.code || null,
    preschool: routePreschool || null,
    role,
    isResolvingPreschool: shouldResolveByCode ? isLoading : false,
  };
}

export function useSavePreschool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Preschool> }) => {
      const ref = doc(db, "preschools", id);
      await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return { id, data };
    },
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: preschoolKeys.all });
      queryClient.invalidateQueries({ queryKey: preschoolKeys.detail(id) });
    },
  });
}

export function useCreatePreschool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      address: {
        street: string;
        city: string;
        postalCode: string;
        country: string;
      };
      phone?: string;
      email?: string;
      customCode?: string;
    }) => {
      const callable = httpsCallable(functions, "createPreschool");
      const result = await callable(data);
      return result.data as { success: boolean; preschoolId: string; code: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preschoolKeys.all });
    },
  });
}
