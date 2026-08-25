import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Conversation, Message } from "@przedszkole/shared";

export const messageKeys = {
  conversations: (preschoolId: string, userId: string) =>
    ["conversations", preschoolId, userId] as const,
  messages: (conversationId: string) => ["messages", conversationId] as const,
};

// Hook to get all conversations for a user in a preschool
export function useConversations(preschoolId: string, userId: string) {
  return useQuery({
    queryKey: messageKeys.conversations(preschoolId, userId),
    queryFn: async (): Promise<Conversation[]> => {
      if (!preschoolId || !userId) return [];

      const q = query(
        collection(db, "conversations"),
        where("preschoolId", "==", preschoolId),
        where("participantIds", "array-contains", userId)
        // orderBy("updatedAt", "desc") // Requires index, skipping for now
      );
      
      const snap = await getDocs(q);
      const convs = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Conversation[];

      // Sort locally by last message time
      return convs.sort((a, b) => {
        const timeA = a.lastMessage?.createdAt?.seconds || a.createdAt?.seconds || 0;
        const timeB = b.lastMessage?.createdAt?.seconds || b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
    },
    enabled: !!preschoolId && !!userId,
  });
}

// Hook to get single conversation details
export function useConversation(conversationId: string) {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async (): Promise<Conversation | null> => {
      const snap = await getDoc(doc(db, "conversations", conversationId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Conversation;
    },
    enabled: !!conversationId,
  });
}

// Hook to get messages for a conversation
export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: messageKeys.messages(conversationId),
    queryFn: async (): Promise<Message[]> => {
      if (!conversationId) return [];

      const q = query(
        collection(db, "conversations", conversationId, "messages"),
        // orderBy("createdAt", "asc") // Needs index if we combine, but we only have parent relation here so it's fine
      );

      const snap = await getDocs(q);
      const msgs = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      // Sort locally
      return msgs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });
    },
    enabled: !!conversationId,
  });
}

// Hook to send a message
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      preschoolId,
      senderId,
      senderName,
      text,
      participantIds, // Needed to invalidate queries for both users if they are currently logged in
    }: {
      conversationId: string;
      preschoolId: string;
      senderId: string;
      senderName: string;
      text: string;
      participantIds: string[];
    }) => {
      // 1. Add message
      const msgRef = collection(db, "conversations", conversationId, "messages");
      const msgPayload: Partial<Message> = {
        conversationId,
        senderId,
        senderName,
        text,
        read: false,
        readAt: null,
        createdAt: serverTimestamp() as unknown as import("firebase/firestore").Timestamp,
      };
      const newMsgDoc = await addDoc(msgRef, msgPayload);

      // 2. Update conversation's lastMessage
      const convRef = doc(db, "conversations", conversationId);
      await updateDoc(convRef, {
        lastMessage: {
          text,
          senderId,
          createdAt: serverTimestamp(),
          read: false,
        },
        updatedAt: serverTimestamp(),
      });

      return { ...msgPayload, id: newMsgDoc.id, preschoolId, participantIds };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: messageKeys.messages(data.conversationId!),
      });
      // Invalidate conversation list for all participants to show the unread/latest
      data.participantIds.forEach((pid) => {
        queryClient.invalidateQueries({
          queryKey: messageKeys.conversations(data.preschoolId, pid),
        });
      });
    },
  });
}

// Hook to start a new conversation
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      preschoolId,
      participantIds,
      type,
      kidId,
      kidName,
      groupId,
      groupName,
    }: {
      preschoolId: string;
      participantIds: string[];
      type: "kid" | "group";
      kidId?: string;
      kidName?: string;
      groupId?: string;
      groupName?: string;
    }) => {
      const conversationField = type === "group" ? "groupId" : "kidId";
      const conversationValue = type === "group" ? groupId : kidId;
      if (!conversationValue) {
        throw new Error("Missing conversation target");
      }

      const q = query(
        collection(db, "conversations"),
        where("preschoolId", "==", preschoolId),
        where(conversationField, "==", conversationValue),
      );
      const snap = await getDocs(q);
      
      const existing = snap.docs.find(d => {
        const pIds = d.data().participantIds || [];
        const existingType = d.data().type || "kid";
        if (existingType !== type) return false;
        return participantIds.every(pid => pIds.includes(pid));
      });

      if (existing) {
        return { id: existing.id, preschoolId, participantIds };
      }

      // Create new
      const payload: Partial<Conversation> = {
        preschoolId,
        participantIds,
        type,
        kidId: type === "kid" ? kidId || null : null,
        kidName: type === "kid" ? kidName || null : null,
        groupId: type === "group" ? groupId || null : null,
        groupName: type === "group" ? groupName || null : null,
        lastMessage: null,
        createdAt: serverTimestamp() as unknown as import("firebase/firestore").Timestamp,
      };

      const newRef = doc(collection(db, "conversations"));
      await setDoc(newRef, { id: newRef.id, ...payload });

      return { id: newRef.id, preschoolId, participantIds };
    },
    onSuccess: (data) => {
      data.participantIds.forEach((pid) => {
        queryClient.invalidateQueries({
          queryKey: messageKeys.conversations(data.preschoolId, pid),
        });
      });
    },
  });
}
