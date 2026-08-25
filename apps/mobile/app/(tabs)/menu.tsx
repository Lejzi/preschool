import React, { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { MealType, WeekDay } from "@przedszkole/shared";
import { useAuthStore } from "@/stores/authStore";
import { useWeeklyMenu } from "@/hooks/usePreschoolData";

const DAYS: Array<{ key: WeekDay; short: string; label: string }> = [
  { key: "monday", short: "Pon", label: "Poniedziałek" },
  { key: "tuesday", short: "Wt", label: "Wtorek" },
  { key: "wednesday", short: "Śr", label: "Środa" },
  { key: "thursday", short: "Czw", label: "Czwartek" },
  { key: "friday", short: "Pt", label: "Piątek" },
];
const MEALS: Array<{ key: MealType; label: string }> = [
  { key: "breakfast", label: "Śniadanie" },
  { key: "second_breakfast", label: "II śniadanie" },
  { key: "lunch", label: "Obiad" },
  { key: "dessert", label: "Deser" },
  { key: "snack", label: "Podwieczorek" },
];

export default function MenuScreen() {
  const preschoolId = useAuthStore((state) => state.preschoolId) ?? "";
  const [selectedDay, setSelectedDay] = useState(0);
  const { data: menu, isLoading, isRefetching, refetch } = useWeeklyMenu(preschoolId, new Date());
  const day = DAYS[selectedDay];
  const meals = menu?.days?.[day.key];

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4f46e5" />}
    >
      <Text style={styles.eyebrow}>JADŁOSPIS TYGODNIOWY</Text>
      <Text style={styles.heading}>{day.label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow}>
        {DAYS.map((item, index) => (
          <TouchableOpacity key={item.key} style={[styles.dayBtn, selectedDay === index && styles.dayBtnActive]} onPress={() => setSelectedDay(index)}>
            <Text style={[styles.dayText, selectedDay === index && styles.dayTextActive]}>{item.short}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!menu || !meals ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Menu nie zostało jeszcze opublikowane</Text>
          <Text style={styles.emptyText}>Gdy placówka udostępni jadłospis, zobaczysz go tutaj.</Text>
        </View>
      ) : (
        <View style={styles.mealList}>
          {MEALS.map(({ key, label }) => {
            const meal = meals[key];
            if (!meal) return null;
            return (
              <View key={key} style={styles.mealCard}>
                <Text style={styles.mealLabel}>{label}</Text>
                <Text style={styles.mealText}>{meal.name}</Text>
                {meal.description ? <Text style={styles.mealDescription}>{meal.description}</Text> : null}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  eyebrow: { fontSize: 11, fontWeight: "800", color: "#4f46e5", letterSpacing: 1 },
  heading: { marginTop: 4, fontSize: 24, fontWeight: "800", color: "#0f172a" },
  dayRow: { marginTop: 18, marginBottom: 20, flexGrow: 0 },
  dayBtn: { minWidth: 56, alignItems: "center", paddingHorizontal: 16, paddingVertical: 11, borderRadius: 20, backgroundColor: "#f1f5f9", marginRight: 8 },
  dayBtnActive: { backgroundColor: "#4f46e5" },
  dayText: { fontWeight: "700", color: "#64748b" },
  dayTextActive: { color: "#fff" },
  mealList: { gap: 10 },
  mealCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  mealLabel: { fontSize: 11, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", marginBottom: 5 },
  mealText: { fontSize: 15, color: "#0f172a", fontWeight: "600" },
  mealDescription: { marginTop: 4, fontSize: 13, lineHeight: 19, color: "#64748b" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", textAlign: "center" },
  emptyText: { marginTop: 7, textAlign: "center", color: "#64748b", lineHeight: 20 },
});
