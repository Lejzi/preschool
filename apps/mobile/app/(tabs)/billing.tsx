import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

type InvoiceStatus = "paid" | "sent" | "overdue";

const INVOICES = [
  {
    id: "i1",
    kidName: "Anna Kowalska",
    month: "Luty 2025",
    amount: "650,00 zł",
    status: "paid" as InvoiceStatus,
    due: "2025-02-10",
  },
  {
    id: "i2",
    kidName: "Anna Kowalska",
    month: "Styczeń 2025",
    amount: "720,00 zł",
    status: "overdue" as InvoiceStatus,
    due: "2025-01-10",
  },
];

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; color: string; bg: string }
> = {
  paid: { label: "✅ Opłacona", color: "#16a34a", bg: "#dcfce7" },
  sent: { label: "⏳ Oczekuje", color: "#d97706", bg: "#fef3c7" },
  overdue: { label: "❌ Zaległa", color: "#dc2626", bg: "#fee2e2" },
};

export default function BillingScreen() {
  const hasOverdue = INVOICES.some((i) => i.status === "overdue");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {hasOverdue && (
        <View style={styles.alertCard}>
          <Text style={styles.alertText}>
            ⚠️ Masz zaległe płatności. Prosimy o uregulowanie salda.
          </Text>
        </View>
      )}

      {INVOICES.map((inv) => {
        const cfg = STATUS_CONFIG[inv.status];
        return (
          <View key={inv.id} style={styles.invoiceCard}>
            <View style={styles.invoiceTop}>
              <View>
                <Text style={styles.invKidName}>{inv.kidName}</Text>
                <Text style={styles.invMonth}>
                  {inv.month} · Termin: {inv.due}
                </Text>
              </View>
              <Text style={styles.invAmount}>{inv.amount}</Text>
            </View>
            <View style={styles.invoiceBottom}>
              <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.statusText, { color: cfg.color }]}>
                  {cfg.label}
                </Text>
              </View>
              {inv.status !== "paid" && (
                <TouchableOpacity style={styles.payBtn}>
                  <Text style={styles.payBtnText}>Zapłać teraz →</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  alertCard: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  alertText: { color: "#dc2626", fontSize: 13, fontWeight: "600" },
  invoiceCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  invoiceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  invKidName: { fontWeight: "700", fontSize: 15, color: "#0f172a" },
  invMonth: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  invAmount: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  invoiceBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700" },
  payBtn: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  payBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
