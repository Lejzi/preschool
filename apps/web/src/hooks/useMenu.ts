import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { WeeklyMenu } from "@przedszkole/shared";
import { getISOWeek, getYear } from "date-fns";

export const menuKeys = {
  all: (preschoolId: string) => ["menu", preschoolId] as const,
  weekly: (preschoolId: string, year: number, week: number) =>
    [...menuKeys.all(preschoolId), year, week] as const,
};

export function getWeeklyMenuId(year: number, week: number) {
  return `${year}-W${week.toString().padStart(2, "0")}`;
}

export function useWeeklyMenu(preschoolId: string, dateStart: Date) {
  const year = getYear(dateStart);
  const week = getISOWeek(dateStart);

  return useQuery({
    queryKey: menuKeys.weekly(preschoolId, year, week),
    queryFn: async (): Promise<WeeklyMenu | null> => {
      if (!preschoolId) return null;

      const menuId = getWeeklyMenuId(year, week);
      const ref = doc(db, "preschools", preschoolId, "menus", menuId);

      const snap = await getDoc(ref);
      if (!snap.exists()) return null;

      return { id: snap.id, ...snap.data() } as WeeklyMenu;
    },
    enabled: !!preschoolId,
  });
}

export function useSaveWeeklyMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      preschoolId,
      year,
      week,
      days,
      publishedBy,
    }: {
      preschoolId: string;
      year: number;
      week: number;
      days: WeeklyMenu["days"];
      publishedBy?: string;
    }) => {
      const menuId = getWeeklyMenuId(year, week);
      const ref = doc(db, "preschools", preschoolId, "menus", menuId);

      const payload: Partial<WeeklyMenu> = {
        preschoolId,
        year,
        week,
        days,
        updatedAt: serverTimestamp() as any,
      };

      if (publishedBy) {
        payload.publishedBy = publishedBy;
        payload.publishedAt = serverTimestamp() as any;
      }

      await setDoc(ref, payload, { merge: true });
      return { id: menuId, preschoolId, year, week, ...payload };
    },
    onSuccess: (savedDoc) => {
      queryClient.invalidateQueries({
        queryKey: menuKeys.weekly(savedDoc.preschoolId as string, savedDoc.year as number, savedDoc.week as number),
      });
    },
  });
}
