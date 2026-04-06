import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

type Status = "present" | "absent" | "excused" | "late";

const MOCK_KIDS = [
  { id: "1", name: "Anna Kowalska", group: "Biedronki" },
  { id: "2", name: "Marek Nowak", group: "Biedronki" },
  { id: "3", name: "Zofia Wiśniewska", group: "Biedronki" },
  { id: "4", name: "Piotr Zając", group: "Biedronki" },
  { id: "5", name: "Natalia Kaczmarek", group: "Słoneczka" },
  { id: "6", name: "Jakub Lis", group: "Słoneczka" },
];

const STATUS_INFO: Record<
  Status,
  { label: string; color: string; bg: string }
> = {
  present: { label: "Obecny", color: "#16a34a", bg: "#dcfce7" },
  absent: { label: "Nieobecny", color: "#dc2626", bg: "#fee2e2" },
  excused: { label: "Usprawiedl.", color: "#64748b", bg: "#f1f5f9" },
  late: { label: "Spóźniony", color: "#d97706", bg: "#fef3c7" },
};
const STATUS_ORDER: Status[] = ["present", "absent", "excused", "late"];

export default function AttendanceScreen() {
  const [attendance, setAttendance] = useState<Record<string, Status>>(
    Object.fromEntries(MOCK_KIDS.map((k) => [k.id, "present" as Status])),
  );

  const cycle = (kidId: string) => {
    setAttendance((prev) => {
      const curr = prev[kidId];
      const next =
        STATUS_ORDER[(STATUS_ORDER.indexOf(curr) + 1) % STATUS_ORDER.length];
      return { ...prev, [kidId]: next };
    });
  };

  const groups = [...new Set(MOCK_KIDS.map((k) => k.group))];
  const presentCount = Object.values(attendance).filter(
    (s) => s === "present" || s === "late",
  ).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>
          ✅ {presentCount} z {MOCK_KIDS.length} dzieci obecnych
        </Text>
      </View>

      {groups.map((group) => (
        <View key={group} style={styles.groupSection}>
          <Text style={styles.groupLabel}>{group}</Text>
          {MOCK_KIDS.filter((k) => k.group === group).map((kid) => {
            const status = attendance[kid.id];
            const info = STATUS_INFO[status];
            return (
              <TouchableOpacity
                key={kid.id}
                style={[styles.kidRow, { backgroundColor: info.bg }]}
                onPress={() => cycle(kid.id)}
              >
                <View style={styles.kidAvatar}>
                  <Text style={styles.kidAvatarText}>
                    {kid.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </Text>
                </View>
                <Text style={styles.kidName}>{kid.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: info.color + "22" },
                  ]}
                >
                  <Text style={[styles.statusText, { color: info.color }]}>
                    {info.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <TouchableOpacity style={styles.saveBtn}>
        <Text style={styles.saveBtnText}>💾 Zapisz obecność</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    alignItems: "center",
  },
  summaryText: { color: "#16a34a", fontWeight: "700", fontSize: 14 },
  groupSection: { marginBottom: 20 },
  groupLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  kidRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  kidAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  kidAvatarText: { fontSize: 12, fontWeight: "700", color: "#4f46e5" },
  kidName: { flex: 1, fontSize: 14, fontWeight: "600", color: "#0f172a" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700" },
  saveBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
