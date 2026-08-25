import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  MessageCircle,
  CreditCard,
} from "lucide-react-native";

const BRAND = "#4f46e5";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { role } = useAuthStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND,
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: { borderTopColor: "#e2e8f0", backgroundColor: "#fff" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { color: "#0f172a", fontWeight: "700", fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("nav.dashboard"),
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: t("nav.attendance"),
          tabBarIcon: ({ color, size }) => (
            <CalendarDays color={color} size={size} />
          ),
          href: role === "admin" || role === "teacher" ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: t("nav.menu"),
          tabBarIcon: ({ color, size }) => (
            <UtensilsCrossed color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t("nav.messages"),
          tabBarIcon: ({ color, size }) => (
            <MessageCircle color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: t("nav.billing"),
          tabBarIcon: ({ color, size }) => (
            <CreditCard color={color} size={size} />
          ),
          href: role === "admin" || role === "parent" ? undefined : null,
        }}
      />
    </Tabs>
  );
}
