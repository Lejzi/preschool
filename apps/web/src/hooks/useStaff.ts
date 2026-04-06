import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import type { User } from "@przedszkole/shared";

export const staffKeys = {
  all: (preschoolId: string) => ["staff", preschoolId] as const,
};

export function useStaff(preschoolId: string) {
  return useQuery({
    queryKey: staffKeys.all(preschoolId),
    queryFn: async (): Promise<User[]> => {
      if (!preschoolId) return [];

      // Query users collection for this preschool where role is 'admin' or 'teacher'
      // Note: Firestore requires a composite index if doing 'in' + '=='
      // For now, fetch all users for the preschool and filter in memory since preschool staff lists are small.
      const q = query(
        collection(db, "users"),
        where("preschoolId", "==", preschoolId),
      );
      
      const snap = await getDocs(q);
      const allUsers = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      return allUsers.filter(u => u.role === "admin" || u.role === "teacher");
    },
    enabled: !!preschoolId,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      displayName: string;
      role: "teacher" | "parent" | "admin";
      preschoolId: string;
    }) => {
      const callable = httpsCallable(functions, "inviteUser");
      const result = await callable(data);
      return { ...(result.data as { success: boolean; uid: string }), preschoolId: data.preschoolId };
    },
    onSuccess: ({ preschoolId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all(preschoolId) });
    },
  });
}

export function useUpdateStaffMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      targetUserId: string;
      displayName: string;
      role: "teacher" | "admin";
      preschoolId: string;
    }) => {
      const callable = httpsCallable(functions, "updateStaffMember");
      await callable(data);
      return { preschoolId: data.preschoolId };
    },
    onSuccess: ({ preschoolId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all(preschoolId) });
    },
  });
}

export function useRemoveStaffMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { targetUserId: string; preschoolId: string }) => {
      const callable = httpsCallable(functions, "removeStaffMember");
      await callable(data);
      return { preschoolId: data.preschoolId };
    },
    onSuccess: ({ preschoolId }) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all(preschoolId) });
    },
  });
}
