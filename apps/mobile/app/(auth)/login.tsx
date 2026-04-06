import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login, resetPassword, loading } = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Błąd", "Proszę podać email i hasło.");
      return;
    }
    try {
      await login(email, password);
    } catch {
      Alert.alert("Błąd logowania", "Nieprawidłowy email lub hasło.");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(
        'Proszę wpisz swój email w polu powyżej, a następnie kliknij "Zapomniałem hasła".',
      );
      return;
    }
    try {
      await resetPassword(email);
      Alert.alert("Wysłano!", "Sprawdź swoją skrzynkę e-mail.");
    } catch {
      Alert.alert("Błąd", "Nie udało się wysłać e-maila resetu hasła.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Brand header */}
      <View style={styles.brandArea}>
        <Text style={styles.brandEmoji}>🏫</Text>
        <Text style={styles.brandTitle}>Przedszkole App</Text>
        <Text style={styles.brandSubtitle}>
          System zarządzania przedszkolem
        </Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("auth.login")}</Text>

        <Text style={styles.label}>{t("auth.email")}</Text>
        <TextInput
          style={styles.input}
          placeholder="jan@przyklad.pl"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <Text style={styles.label}>{t("auth.password")}</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
        />

        <TouchableOpacity
          onPress={handleForgotPassword}
          style={styles.forgotLink}
        >
          <Text style={styles.linkText}>{t("auth.forgotPassword")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>{t("auth.login")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4338ca",
    justifyContent: "center",
    padding: 20,
  },
  brandArea: { alignItems: "center", marginBottom: 32 },
  brandEmoji: { fontSize: 48, marginBottom: 8 },
  brandTitle: { fontSize: 24, fontWeight: "700", color: "#fff" },
  brandSubtitle: { fontSize: 13, color: "#a5b4fc", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 20,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a",
    marginBottom: 14,
    backgroundColor: "#f8fafc",
  },
  forgotLink: { alignSelf: "flex-end", marginBottom: 20 },
  linkText: { fontSize: 13, color: "#4f46e5", fontWeight: "500" },
  btnPrimary: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
