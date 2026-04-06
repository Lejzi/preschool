import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const DAYS = ["Pon", "Wt", "Śr", "Czw", "Pt"];
const MEALS = ["Śniadanie", "II Śniadanie", "Obiad", "Deser", "Podwieczorek"];

const MENU: string[][] = [
  [
    "Owsianka z owocami",
    "Jogurt z granolą",
    "Zupa pomidorowa, makaron",
    "Kisiel",
    "Jabłko",
  ],
  ["Chleb z serem", "Banan", "Rosół, kotlet, ziemniaki", "Budyń", "Marchew"],
  [
    "Jajecznica, pieczywo",
    "Koktajl owocowy",
    "Krem brokułowy, pierogi",
    "Galaretka",
    "Kanapka",
  ],
  [
    "Płatki z mlekiem",
    "Gruszka, krakersy",
    "Żurek, naleśniki szpinakowe",
    "Lody",
    "Twarożek",
  ],
  ["Tost z serem", "Smoothie", "Zupa rybna, dorsz, ryż", "Kompot", "Muffinka"],
];

export default function MenuScreen() {
  const [selectedDay, setSelectedDay] = useState(0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Day picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayRow}
      >
        {DAYS.map((day, i) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayBtn, selectedDay === i && styles.dayBtnActive]}
            onPress={() => setSelectedDay(i)}
          >
            <Text
              style={[
                styles.dayText,
                selectedDay === i && styles.dayTextActive,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Meals */}
      <View style={styles.mealList}>
        {MEALS.map((meal, mi) => (
          <View key={meal} style={styles.mealCard}>
            <Text style={styles.mealLabel}>{meal}</Text>
            <Text style={styles.mealText}>{MENU[selectedDay][mi]}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40 },
  dayRow: { marginBottom: 20 },
  dayBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
  },
  dayBtnActive: { backgroundColor: "#4f46e5" },
  dayText: { fontWeight: "700", color: "#64748b" },
  dayTextActive: { color: "#fff" },
  mealList: { gap: 10 },
  mealCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  mealLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  mealText: { fontSize: 15, color: "#0f172a", fontWeight: "500" },
});
