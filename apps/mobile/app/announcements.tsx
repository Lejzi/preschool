import { Stack } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Megaphone, Pin } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { useAnnouncements } from "@/hooks/usePreschoolData";

export default function AnnouncementsScreen() {
  const preschoolId = useAuthStore((state) => state.preschoolId) ?? "";
  const { data = [], isLoading, isRefetching, refetch } = useAnnouncements(preschoolId);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Ogłoszenia", headerBackTitle: "Wróć" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4f46e5" />}
      >
        {isLoading ? (
          <ActivityIndicator color="#4f46e5" size="large" style={styles.loader} />
        ) : data.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Megaphone color="#4f46e5" size={28} /></View>
            <Text style={styles.emptyTitle}>Wszystko przeczytane</Text>
            <Text style={styles.emptyText}>Nowe informacje od przedszkola pojawią się tutaj.</Text>
          </View>
        ) : (
          data.map((announcement) => (
            <View key={announcement.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.title}>{announcement.title}</Text>
                {announcement.isPinned && <Pin color="#4f46e5" fill="#4f46e5" size={16} />}
              </View>
              <Text style={styles.body}>{announcement.body}</Text>
              <Text style={styles.meta}>{announcement.authorName}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, gap: 12, flexGrow: 1 },
  loader: { marginTop: 72 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  emptyTitle: { marginTop: 18, fontSize: 19, fontWeight: "700", color: "#0f172a" },
  emptyText: { marginTop: 6, textAlign: "center", fontSize: 14, lineHeight: 20, color: "#64748b" },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#e2e8f0" },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { flex: 1, fontSize: 16, fontWeight: "700", color: "#0f172a" },
  body: { marginTop: 9, fontSize: 14, lineHeight: 21, color: "#475569" },
  meta: { marginTop: 14, fontSize: 12, fontWeight: "600", color: "#94a3b8" },
});
