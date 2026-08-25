import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Announcement,
  AttendanceDay,
  AttendanceStatus,
  Conversation,
  Invoice,
  Kid,
  Message,
  WeeklyMenu,
} from "@przedszkole/shared";
import { getISOWeek, getYear } from "date-fns";

export function useKids(preschoolId: string) {
  return useQuery({
    queryKey: ["mobile", "kids", preschoolId],
    enabled: Boolean(preschoolId),
    queryFn: async (): Promise<Kid[]> => {
      const snap = await getDocs(
        query(
          collection(db, "kids"),
          where("preschoolId", "==", preschoolId),
          where("isActive", "==", true),
        ),
      );
      return snap.docs.map((item) => ({ id: item.id, ...item.data() })) as Kid[];
    },
  });
}

export function useAttendanceDay(preschoolId: string, dateStr: string) {
  return useQuery({
    queryKey: ["mobile", "attendance", preschoolId, dateStr],
    enabled: Boolean(preschoolId && dateStr),
    queryFn: async (): Promise<AttendanceDay | null> => {
      const snap = await getDocs(
        query(
          collection(db, "attendance"),
          where("preschoolId", "==", preschoolId),
          where("dateStr", "==", dateStr),
        ),
      );
      if (snap.empty) return null;
      return snap.docs[0].data() as AttendanceDay;
    },
  });
}

export function useSaveAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      preschoolId,
      dateStr,
      recordedBy,
      entries,
    }: {
      preschoolId: string;
      dateStr: string;
      recordedBy: string;
      entries: Record<string, AttendanceStatus>;
    }) => {
      const existing = await getDocs(
        query(
          collection(db, "attendance"),
          where("preschoolId", "==", preschoolId),
          where("dateStr", "==", dateStr),
        ),
      );
      const ref = existing.empty
        ? doc(collection(db, "attendance"))
        : doc(db, "attendance", existing.docs[0].id);
      const savedEntries = Object.fromEntries(
        Object.entries(entries).map(([kidId, status]) => [
          kidId,
          {
            kidId,
            status,
            recordedBy,
            checkInTime: null,
            checkOutTime: null,
            updatedAt: serverTimestamp(),
          },
        ]),
      );
      await setDoc(ref, { preschoolId, dateStr, entries: savedEntries }, { merge: true });
      return { preschoolId, dateStr };
    },
    onSuccess: ({ preschoolId, dateStr }) =>
      queryClient.invalidateQueries({
        queryKey: ["mobile", "attendance", preschoolId, dateStr],
      }),
  });
}

export function useAnnouncements(preschoolId: string) {
  return useQuery({
    queryKey: ["mobile", "announcements", preschoolId],
    enabled: Boolean(preschoolId),
    queryFn: async (): Promise<Announcement[]> => {
      const snap = await getDocs(
        query(
          collection(db, "announcements"),
          where("preschoolId", "==", preschoolId),
        ),
      );
      return (snap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Announcement[]).sort(
        (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0),
      );
    },
  });
}

export function useWeeklyMenu(preschoolId: string, date: Date) {
  const year = getYear(date);
  const week = getISOWeek(date);
  return useQuery({
    queryKey: ["mobile", "menu", preschoolId, year, week],
    enabled: Boolean(preschoolId),
    queryFn: async (): Promise<WeeklyMenu | null> => {
      const menuId = `${year}-W${String(week).padStart(2, "0")}`;
      const snap = await getDoc(doc(db, "preschools", preschoolId, "menus", menuId));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as WeeklyMenu) : null;
    },
  });
}

export function useInvoices(preschoolId: string, parentId?: string) {
  return useQuery({
    queryKey: ["mobile", "invoices", preschoolId, parentId ?? "all"],
    enabled: Boolean(preschoolId),
    queryFn: async (): Promise<Invoice[]> => {
      const constraint = parentId
        ? where("parentId", "==", parentId)
        : where("preschoolId", "==", preschoolId);
      const snap = await getDocs(query(collection(db, "invoices"), constraint));
      return (snap.docs.map((item) => ({ id: item.id, ...item.data() })) as Invoice[])
        .filter((invoice) => invoice.preschoolId === preschoolId)
        .sort((a, b) => b.month.localeCompare(a.month));
    },
  });
}

export function useConversations(preschoolId: string, userId: string) {
  return useQuery({
    queryKey: ["mobile", "conversations", preschoolId, userId],
    enabled: Boolean(preschoolId && userId),
    queryFn: async (): Promise<Conversation[]> => {
      const snap = await getDocs(query(
        collection(db, "conversations"),
        where("preschoolId", "==", preschoolId),
        where("participantIds", "array-contains", userId),
      ));
      return (snap.docs.map((item) => ({ id: item.id, ...item.data() })) as Conversation[])
        .sort((a, b) => (b.lastMessage?.createdAt?.seconds ?? b.createdAt?.seconds ?? 0) - (a.lastMessage?.createdAt?.seconds ?? a.createdAt?.seconds ?? 0));
    },
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ["mobile", "messages", conversationId],
    enabled: Boolean(conversationId),
    queryFn: async (): Promise<Message[]> => {
      const snap = await getDocs(collection(db, "conversations", conversationId, "messages"));
      return (snap.docs.map((item) => ({ id: item.id, ...item.data() })) as Message[])
        .sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0));
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversation, senderId, senderName, text }: {
      conversation: Conversation;
      senderId: string;
      senderName: string;
      text: string;
    }) => {
      await addDoc(collection(db, "conversations", conversation.id, "messages"), {
        conversationId: conversation.id,
        senderId,
        senderName,
        text,
        read: false,
        readAt: null,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "conversations", conversation.id), {
        lastMessage: { text, senderId, read: false, createdAt: serverTimestamp() },
        updatedAt: serverTimestamp(),
      });
      return conversation;
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["mobile", "messages", conversation.id] });
      conversation.participantIds.forEach((participantId) => {
        queryClient.invalidateQueries({ queryKey: ["mobile", "conversations", conversation.preschoolId, participantId] });
      });
    },
  });
}
