import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "expo-router";

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { userProfile, role, preschoolCode, logout } = useAuthStore();
  const router = useRouter();
  const firstName = userProfile?.displayName?.split(" ")[0] ?? "";

  const today = new Date().toLocaleDateString("pl-PL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const parentCards = [
    {
      emoji: "🥗",
      label: "Jadłospis tygodnia",
      sub: "Co dziś na obiad?",
      route: "/(tabs)/menu",
    },
    {
      emoji: "💬",
      label: "Wiadomości",
      sub: "Napisz do nauczyciela",
      route: "/(tabs)/messages",
    },
    {
      emoji: "💳",
      label: "Płatności",
      sub: "Stan rozliczeń",
      route: "/(tabs)/billing",
    },
    {
      emoji: "📢",
      label: "Ogłoszenia",
      sub: "Aktualności z przedszkola",
      route: "/announcements",
    },
  ];

  const staffCards = [
    {
      emoji: "✅",
      label: "Lista obecności",
      sub: "Zaznacz obecność",
      route: "/(tabs)/attendance",
    },
    {
      emoji: "🥗",
      label: "Jadłospis",
      sub: "Podgląd i edycja",
      route: "/(tabs)/menu",
    },
    {
      emoji: "💬",
      label: "Wiadomości",
      sub: "Skrzynka odbiorcza",
      route: "/(tabs)/messages",
    },
    {
      emoji: "📢",
      label: "Nowe ogłoszenie",
      sub: "Opublikuj dla rodziców",
      route: "/announcements",
    },
  ];

  const cards =
    role === "admin" || role === "teacher" ? staffCards : parentCards;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeGreeting}>
          Dzień dobry{firstName ? `, ${firstName}` : ""} 👋
        </Text>
        <Text style={styles.welcomeDate} numberOfLines={1}>
          {today}
        </Text>
      </View>

      {/* Staff quick stats */}
      {(role === "admin" || role === "teacher") && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#dcfce7" }]}>
            <Text style={[styles.statNum, { color: "#16a34a" }]}>18</Text>
            <Text style={[styles.statLabel, { color: "#16a34a" }]}>
              Obecnych
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#fee2e2" }]}>
            <Text style={[styles.statNum, { color: "#dc2626" }]}>4</Text>
            <Text style={[styles.statLabel, { color: "#dc2626" }]}>
              Nieobecnych
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#dbeafe" }]}>
            <Text style={[styles.statNum, { color: "#2563eb" }]}>3</Text>
            <Text style={[styles.statLabel, { color: "#2563eb" }]}>
              Wiadomości
            </Text>
          </View>
        </View>
      )}

      {/* Quick links */}
      <Text style={styles.sectionTitle}>Szybki dostęp</Text>
      <View style={styles.grid}>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.route}
            style={styles.gridCard}
            onPress={() => router.push(card.route as any)}
          >
            <Text style={styles.gridEmoji}>{card.emoji}</Text>
            <Text style={styles.gridLabel}>{card.label}</Text>
            <Text style={styles.gridSub} numberOfLines={1}>
              {card.sub}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
        <Text style={styles.logoutText}>Wyloguj się</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const BRAND = "#4f46e5";
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40 },
  welcomeCard: {
    backgroundColor: BRAND,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  welcomeGreeting: { fontSize: 20, fontWeight: "700", color: "#fff" },
  welcomeDate: {
    fontSize: 12,
    color: "#a5b4fc",
    marginTop: 4,
    textTransform: "capitalize",
  },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: "center" },
  statNum: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  gridCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  gridEmoji: { fontSize: 28, marginBottom: 8 },
  gridLabel: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  gridSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  logoutBtn: { padding: 16, alignItems: "center" },
  logoutText: { color: "#ef4444", fontWeight: "600" },
});
