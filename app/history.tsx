import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";

type HelpRequest = {
  id: number;
  request_type: string;
  description: string;
  status: string | null;
  created_at: string;
};

export default function History() {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("help_requests")
        .select("id, request_type, description, status, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        Alert.alert("Gagal memuat riwayat", error.message);
        return;
      }
      setRequests(data ?? []);
    } catch (error) {
      Alert.alert(
        "Kesalahan koneksi",
        error instanceof Error ? error.message : "Riwayat belum dapat dimuat."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadHistory();
          }}
        />
      }
    >
      <Text style={s.title}>📋 Riwayat Bantuan</Text>
      <Text style={s.subtitle}>Permintaan bantuan yang tersimpan di akun Anda.</Text>

      {loading ? (
        <View style={s.empty}>
          <ActivityIndicator size="large" color="#e53935" />
          <Text style={s.subtitle}>Memuat riwayat...</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.icon}>📭</Text>
          <Text style={s.emptyTitle}>Belum ada riwayat</Text>
          <Text style={s.subtitle}>Permintaan yang dikirim akan muncul di sini.</Text>
        </View>
      ) : (
        requests.map((item) => (
          <View style={s.card} key={item.id}>
            <Text style={s.cardTitle}>🆘 {item.request_type}</Text>
            <Text style={s.description}>{item.description}</Text>
            <Text style={s.status}>Status: {item.status || "Menunggu bantuan"}</Text>
            <Text style={s.date}>
              {item.created_at ? new Date(item.created_at).toLocaleString("id-ID") : ""}
            </Text>
          </View>
        ))
      )}

      <Pressable style={s.button} onPress={() => router.replace("/home")}>
        <Text style={s.buttonText}>← Kembali ke Beranda</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f7f7f7" },
  container: { padding: 20, paddingBottom: 35 },
  title: { fontSize: 24, fontWeight: "800", marginTop: 20 },
  subtitle: { color: "#666", marginTop: 8, lineHeight: 21 },
  empty: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 16,
    marginTop: 22,
  },
  icon: { fontSize: 42, marginBottom: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 17,
    marginTop: 15,
  },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  description: { color: "#555", marginTop: 10, lineHeight: 21 },
  status: { color: "#e58a00", marginTop: 12, fontWeight: "700" },
  date: { color: "#888", marginTop: 8, fontSize: 12 },
  button: {
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 22,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
