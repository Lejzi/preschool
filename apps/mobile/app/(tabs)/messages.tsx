import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Send } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { useConversations, useMessages, useSendMessage } from "@/hooks/usePreschoolData";

function conversationTitle(conversation: { kidName?: string | null; groupName?: string | null }) {
  return conversation.kidName || conversation.groupName || "Rozmowa";
}

export default function MessagesScreen() {
  const { user, userProfile, preschoolId } = useAuthStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const { data: conversations = [], isLoading, isRefetching, refetch } = useConversations(preschoolId ?? "", user?.uid ?? "");
  const selected = conversations.find((item) => item.id === selectedId) ?? null;
  const { data: messages = [], isLoading: messagesLoading, isRefetching: messagesRefreshing, refetch: refetchMessages } = useMessages(selectedId ?? "");
  const sendMessage = useSendMessage();

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !selected || !user) return;
    try {
      await sendMessage.mutateAsync({
        conversation: selected,
        senderId: user.uid,
        senderName: userProfile?.displayName || user.email || "Użytkownik",
        text: trimmed,
      });
      setText("");
    } catch {
      Alert.alert("Nie wysłano", "Sprawdź połączenie i spróbuj ponownie.");
    }
  };

  if (selected) {
    return (
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={88}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedId(null)} style={styles.backBtn}><Text style={styles.backText}>‹ Wróć</Text></TouchableOpacity>
          <View style={styles.headerText}><Text style={styles.chatHeaderName}>{conversationTitle(selected)}</Text><Text style={styles.chatHeaderSub}>{selected.type === "group" ? "Rozmowa grupowa" : "Rozmowa o dziecku"}</Text></View>
        </View>

        {messagesLoading ? <View style={styles.center}><ActivityIndicator color="#4f46e5" /></View> : (
          <ScrollView
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            refreshControl={<RefreshControl refreshing={messagesRefreshing} onRefresh={refetchMessages} tintColor="#4f46e5" />}
          >
            {messages.length === 0 ? <Text style={styles.noMessages}>To początek rozmowy. Napisz pierwszą wiadomość.</Text> : messages.map((message) => {
              const mine = message.senderId === user?.uid;
              return (
                <View key={message.id} style={[styles.bubble, mine ? styles.bubbleMe : styles.bubbleThem]}>
                  {!mine && <Text style={styles.senderName}>{message.senderName}</Text>}
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMe]}>{message.text}</Text>
                </View>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.inputBar}>
          <TextInput style={styles.msgInput} placeholder="Napisz wiadomość..." placeholderTextColor="#94a3b8" value={text} onChangeText={setText} multiline maxLength={2000} />
          <TouchableOpacity style={[styles.sendBtn, (!text.trim() || sendMessage.isPending) && styles.sendDisabled]} onPress={send} disabled={!text.trim() || sendMessage.isPending} accessibilityLabel="Wyślij wiadomość">
            {sendMessage.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Send color="#fff" size={18} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.listContent} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4f46e5" />}>
      {conversations.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyTitle}>Brak wiadomości</Text><Text style={styles.emptyText}>Rozmowy utworzone przez placówkę pojawią się tutaj.</Text></View>
      ) : conversations.map((conversation) => (
        <TouchableOpacity key={conversation.id} style={styles.convRow} onPress={() => setSelectedId(conversation.id)}>
          <View style={styles.convAvatar}><Text style={styles.convAvatarText}>{conversationTitle(conversation).slice(0, 2).toUpperCase()}</Text></View>
          <View style={styles.convBody}>
            <Text style={styles.convName}>{conversationTitle(conversation)}</Text>
            <Text style={styles.convLast} numberOfLines={1}>{conversation.lastMessage?.text || "Brak wiadomości"}</Text>
          </View>
          {conversation.lastMessage && !conversation.lastMessage.read && conversation.lastMessage.senderId !== user?.uid ? <View style={styles.unreadDot} /> : null}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  listContent: { padding: 12, gap: 8, flexGrow: 1 },
  convRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  convAvatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  convAvatarText: { fontWeight: "800", color: "#4f46e5", fontSize: 12 },
  convBody: { flex: 1 },
  convName: { fontWeight: "700", fontSize: 14, color: "#0f172a" },
  convLast: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#4f46e5" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 19, fontWeight: "700", color: "#0f172a" },
  emptyText: { marginTop: 6, textAlign: "center", color: "#64748b", fontSize: 14 },
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", padding: 14, borderBottomWidth: 1, borderColor: "#e2e8f0" },
  backBtn: { paddingVertical: 6, paddingRight: 2 },
  backText: { color: "#4f46e5", fontSize: 17, fontWeight: "600" },
  headerText: { flex: 1 },
  chatHeaderName: { fontWeight: "700", fontSize: 15, color: "#0f172a" },
  chatHeaderSub: { fontSize: 12, color: "#94a3b8", marginTop: 1 },
  messages: { flex: 1 },
  messagesContent: { padding: 14, gap: 10, flexGrow: 1, justifyContent: "flex-end" },
  noMessages: { textAlign: "center", color: "#94a3b8", fontSize: 13, marginVertical: 24 },
  bubble: { maxWidth: "82%", borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10 },
  bubbleMe: { backgroundColor: "#4f46e5", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: "#fff", alignSelf: "flex-start", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#e2e8f0" },
  senderName: { fontSize: 11, fontWeight: "700", color: "#4f46e5", marginBottom: 3 },
  bubbleText: { fontSize: 14, color: "#0f172a", lineHeight: 20 },
  bubbleTextMe: { color: "#fff" },
  inputBar: { flexDirection: "row", gap: 10, padding: 12, backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#e2e8f0", alignItems: "flex-end" },
  msgInput: { flex: 1, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, maxHeight: 110, color: "#0f172a" },
  sendBtn: { width: 46, height: 46, backgroundColor: "#4f46e5", borderRadius: 15, alignItems: "center", justifyContent: "center" },
  sendDisabled: { opacity: 0.5 },
});
