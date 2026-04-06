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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Recipe } from "@przedszkole/shared";

export const recipeKeys = {
  all: (preschoolId: string) => ["recipes", preschoolId] as const,
};

export function useRecipes(preschoolId: string) {
  return useQuery({
    queryKey: recipeKeys.all(preschoolId),
    queryFn: async (): Promise<Recipe[]> => {
      if (!preschoolId) return [];

      const q = query(
        collection(db, "recipes"),
        where("preschoolId", "==", preschoolId),
      );
      const snap = await getDocs(q);

      return snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Recipe[];
    },
    enabled: !!preschoolId,
  });
}

export function useSaveRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Recipe> & { preschoolId: string }) => {
      const isNew = !data.id;
      const ref = isNew ? doc(collection(db, "recipes")) : doc(db, "recipes", data.id!);

      const payload = {
        ...data,
        id: ref.id,
        updatedAt: serverTimestamp(),
        ingredients: data.ingredients || [],
      };

      if (isNew) {
        payload.createdAt = serverTimestamp() as any;
      }

      await setDoc(ref, payload, { merge: true });
      return payload;
    },
    onSuccess: (savedDoc) => {
      queryClient.invalidateQueries({
        queryKey: recipeKeys.all(savedDoc.preschoolId as string),
      });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ preschoolId, id }: { preschoolId: string; id: string }) => {
      await deleteDoc(doc(db, "recipes", id));
      return { preschoolId, id };
    },
    onSuccess: ({ preschoolId }) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.all(preschoolId) });
    },
  });
}
