import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { format } from "date-fns";
import type { AttendanceStatus } from "@przedszkole/shared";
import { useAuthStore } from "@/stores/authStore";
import { useAttendanceDay, useKids, useSaveAttendance } from "@/hooks/usePreschoolData";

const STATUS_INFO: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  present: { label: "Obecny", color: "#15803d", bg: "#dcfce7" },
  absent: { label: "Nieobecny", color: "#dc2626", bg: "#fee2e2" },
  excused: { label: "Usprawiedl.", color: "#475569", bg: "#f1f5f9" },
  late: { label: "Spóźniony", color: "#b45309", bg: "#fef3c7" },
};
const STATUS_ORDER: AttendanceStatus[] = ["present", "absent", "excused", "late"];

export default function AttendanceScreen() {
  const { preschoolId, user } = useAuthStore();
  const dateStr = format(new Date(), "yyyy-MM-dd");
  const { data: kids = [], isLoading: kidsLoading, isRefetching, refetch } = useKids(preschoolId ?? "");
  const { data: day, isLoading: dayLoading, refetch: refetchDay } = useAttendanceDay(preschoolId ?? "", dateStr);
  const saveAttendance = useSaveAttendance();
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});

  useEffect(() => {
    if (kids.length === 0) return;
    setAttendance(
      Object.fromEntries(
        kids.map((kid) => [kid.id, day?.entries?.[kid.id]?.status ?? "present"]),
      ),
    );
  }, [day, kids]);

  const groups = useMemo(() => {
    const grouped = new Map<string, typeof kids>();
    kids.forEach((kid) => {
      const key = kid.groupId || "Bez grupy";
      grouped.set(key, [...(grouped.get(key) ?? []), kid]);
    });
    return [...grouped.entries()];
  }, [kids]);

  const presentCount = Object.values(attendance).filter(
    (status) => status === "present" || status === "late",
  ).length;
  const loading = kidsLoading || dayLoading;

  const cycle = (kidId: string) => {
    setAttendance((current) => {
      const status = current[kidId] ?? "present";
      return {
        ...current,
        [kidId]: STATUS_ORDER[(STATUS_ORDER.indexOf(status) + 1) % STATUS_ORDER.length],
      };
    });
  };

  const save = async () => {
    if (!preschoolId || !user) return;
    try {
      await saveAttendance.mutateAsync({ preschoolId, dateStr, recordedBy: user.uid, entries: attendance });
      Alert.alert("Zapisano", "Lista obecności jest aktualna.");
    } catch {
      Alert.alert("Nie udało się zapisać", "Sprawdź połączenie i spróbuj ponownie.");
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void Promise.all([refetch(), refetchDay()])} tintColor="#4f46e5" />}
    >
      {kids.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Brak dzieci na liście</Text>
          <Text style={styles.emptyText}>Dodaj dzieci i przypisz je do grup w aplikacji webowej.</Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{presentCount}</Text>
            <Text style={styles.summaryText}>z {kids.length} dzieci obecnych</Text>
          </View>

          {groups.map(([groupId, groupKids]) => (
            <View key={groupId} style={styles.groupSection}>
              <Text style={styles.groupLabel}>{groupId}</Text>
              {groupKids.map((kid) => {
                const info = STATUS_INFO[attendance[kid.id] ?? "present"];
                return (
                  <TouchableOpacity key={kid.id} style={styles.kidRow} onPress={() => cycle(kid.id)} activeOpacity={0.72} accessibilityRole="button" accessibilityLabel={`Zmień obecność: ${kid.firstName} ${kid.lastName}, ${info.label}`}>
                    <View style={styles.kidAvatar}><Text style={styles.kidAvatarText}>{kid.firstName[0]}{kid.lastName[0]}</Text></View>
                    <Text style={styles.kidName}>{kid.firstName} {kid.lastName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: info.bg }]}><Text style={[styles.statusText, { color: info.color }]}>{info.label}</Text></View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <TouchableOpacity style={[styles.saveBtn, saveAttendance.isPending && styles.disabled]} onPress={save} disabled={saveAttendance.isPending}>
            {saveAttendance.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Zapisz obecność</Text>}
          </TouchableOpacity>
          <Text style={styles.hint}>Dotknij dziecka, aby zmienić status.</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  summaryCard: { backgroundColor: "#ecfdf5", borderRadius: 16, padding: 18, marginBottom: 24, flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "#bbf7d0" },
  summaryNumber: { color: "#15803d", fontWeight: "800", fontSize: 26 },
  summaryText: { color: "#15803d", fontWeight: "600", fontSize: 14 },
  groupSection: { marginBottom: 20 },
  groupLabel: { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  kidRow: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 12, marginBottom: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0" },
  kidAvatar: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center", marginRight: 12 },
  kidAvatarText: { fontSize: 12, fontWeight: "800", color: "#4f46e5" },
  kidName: { flex: 1, fontSize: 14, fontWeight: "600", color: "#0f172a" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  saveBtn: { backgroundColor: "#4f46e5", borderRadius: 12, minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: 4 },
  disabled: { opacity: 0.65 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  hint: { textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 10 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 19, fontWeight: "700", color: "#0f172a" },
  emptyText: { marginTop: 6, textAlign: "center", color: "#64748b", fontSize: 14, lineHeight: 20 },
});
