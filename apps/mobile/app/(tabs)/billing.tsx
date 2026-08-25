import React from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { InvoiceStatus } from "@przedszkole/shared";
import { useAuthStore } from "@/stores/authStore";
import { useInvoices } from "@/hooks/usePreschoolData";

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Szkic", color: "#64748b", bg: "#f1f5f9" },
  sent: { label: "Do zapłaty", color: "#b45309", bg: "#fef3c7" },
  paid: { label: "Opłacona", color: "#15803d", bg: "#dcfce7" },
  overdue: { label: "Zaległa", color: "#dc2626", bg: "#fee2e2" },
  cancelled: { label: "Anulowana", color: "#64748b", bg: "#f1f5f9" },
};

function formatAmount(grosze: number) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(grosze / 100);
}

export default function BillingScreen() {
  const { preschoolId, role, user } = useAuthStore();
  const { data: invoices = [], isLoading, isRefetching, refetch } = useInvoices(
    preschoolId ?? "",
    role === "parent" ? user?.uid : undefined,
  );
  const hasOverdue = invoices.some((invoice) => invoice.status === "overdue");

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4f46e5" />}
    >
      {hasOverdue && <View style={styles.alertCard}><Text style={styles.alertText}>Masz zaległe płatności. Skontaktuj się z placówką, aby potwierdzić sposób rozliczenia.</Text></View>}

      {invoices.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Brak rozliczeń</Text>
          <Text style={styles.emptyText}>Nowe faktury i ich statusy pojawią się tutaj.</Text>
        </View>
      ) : invoices.map((invoice) => {
        const config = STATUS_CONFIG[invoice.status];
        return (
          <View key={invoice.id} style={styles.invoiceCard}>
            <View style={styles.invoiceTop}>
              <View style={styles.invoiceInfo}>
                <Text style={styles.invKidName}>{invoice.kidName}</Text>
                <Text style={styles.invMonth}>{invoice.month}</Text>
              </View>
              <Text style={styles.invAmount}>{formatAmount(invoice.totalAmountGrosze)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}><Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text></View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, gap: 12, paddingBottom: 40, flexGrow: 1 },
  alertCard: { backgroundColor: "#fef2f2", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#fecaca" },
  alertText: { color: "#b91c1c", fontSize: 13, lineHeight: 19, fontWeight: "600" },
  invoiceCard: { backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  invoiceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 12 },
  invoiceInfo: { flex: 1 },
  invKidName: { fontWeight: "700", fontSize: 15, color: "#0f172a" },
  invMonth: { fontSize: 12, color: "#94a3b8", marginTop: 3 },
  invAmount: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 19, fontWeight: "700", color: "#0f172a" },
  emptyText: { marginTop: 6, textAlign: "center", color: "#64748b", fontSize: 14 },
});
