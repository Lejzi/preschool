import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";

const CONVERSATIONS = [
  {
    id: "c1",
    kidName: "Anna Kowalska",
    teacher: "Nauczycielka Magdalena",
    last: "Czy mogłaby Pani przekazać...",
    time: "14:32",
    unread: 2,
  },
  {
    id: "c2",
    kidName: "Marek Nowak",
    teacher: "Nauczyciel Paweł",
    last: "Dziękuję za informację!",
    time: "Wczoraj",
    unread: 0,
  },
];

const MESSAGES = [
  {
    id: "m1",
    me: false,
    text: "Dzień dobry! Anna świetnie radziła sobie dziś z zajęciami 🎨",
    time: "10:03",
  },
  {
    id: "m2",
    me: true,
    text: "Bardzo dziękuję! Cieszymy się. Czy jutro będą szczególne zajęcia?",
    time: "10:15",
  },
  {
    id: "m3",
    me: false,
    text: "Jutro mamy spacer i czytanie bajek. Proszę o fartuszek roboczy!",
    time: "10:22",
  },
];

export default function MessagesScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState(MESSAGES);

  if (selected) {
    const conv = CONVERSATIONS.find((c) => c.id === selected)!;
    const now = new Date();
    const send = () => {
      if (!text.trim()) return;
      setMsgs((prev) => [
        ...prev,
        {
          id: `m${Date.now()}`,
          me: true,
          text: text.trim(),
          time: `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`,
        },
      ]);
      setText("");
    };

    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#f8fafc" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            onPress={() => setSelected(null)}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>‹ Wróć</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.chatHeaderName}>{conv.kidName}</Text>
            <Text style={styles.chatHeaderSub}>{conv.teacher}</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 14, gap: 10 }}
        >
          {msgs.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubble,
                m.me ? styles.bubbleMe : styles.bubbleThem,
              ]}
            >
              <Text style={[styles.bubbleText, m.me && { color: "#fff" }]}>
                {m.text}
              </Text>
              <Text style={[styles.bubbleTime, m.me && { color: "#a5b4fc" }]}>
                {m.time}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.msgInput}
            placeholder="Napisz wiadomość..."
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={send}>
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {CONVERSATIONS.map((conv) => (
        <TouchableOpacity
          key={conv.id}
          style={styles.convRow}
          onPress={() => setSelected(conv.id)}
        >
          <View style={styles.convAvatar}>
            <Text style={styles.convAvatarText}>
              {conv.kidName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.convName}>{conv.kidName}</Text>
            <Text style={styles.convTeacher}>{conv.teacher}</Text>
            <Text style={styles.convLast} numberOfLines={1}>
              {conv.last}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.convTime}>{conv.time}</Text>
            {conv.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{conv.unread}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 12, gap: 8 },
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  convAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  convAvatarText: { fontWeight: "700", color: "#4f46e5", fontSize: 13 },
  convName: { fontWeight: "700", fontSize: 14, color: "#0f172a" },
  convTeacher: { fontSize: 12, color: "#64748b" },
  convLast: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  convTime: { fontSize: 11, color: "#94a3b8" },
  unreadBadge: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 4,
  },
  unreadText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    padding: 14,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  backBtn: { paddingRight: 4 },
  backText: { color: "#4f46e5", fontSize: 18, fontWeight: "600" },
  chatHeaderName: { fontWeight: "700", fontSize: 15, color: "#0f172a" },
  chatHeaderSub: { fontSize: 12, color: "#94a3b8" },
  bubble: { maxWidth: "78%", borderRadius: 16, padding: 12 },
  bubbleMe: {
    backgroundColor: "#4f46e5",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: "#fff",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  bubbleText: { fontSize: 14, color: "#0f172a", lineHeight: 20 },
  bubbleTime: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  inputBar: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "flex-end",
  },
  msgInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#4f46e5",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnText: { color: "#fff", fontSize: 18 },
});
