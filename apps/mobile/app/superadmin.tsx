import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';

export default function SuperAdminScreen() {
  const { logout } = useAuthStore();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel Super-Admina</Text>
      <Text style={styles.subtitle}>
        Zarządzanie przedszkolami jest dostępne z poziomu aplikacji webowej.
      </Text>
      
      <TouchableOpacity style={styles.btn} onPress={() => logout()}>
        <Text style={styles.btnText}>Wyloguj się</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 32 },
  btn: { backgroundColor: '#ef4444', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
