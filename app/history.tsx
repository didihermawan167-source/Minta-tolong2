app/history.tsx
import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getItem } from "../lib/storage";

export default function History() {
  const [requests, setRequests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const data = await getItem("requests");
      setRequests(data ? JSON.parse(data) : []);
    } catch {
      setRequests([]);
    }
    setRefreshing(false);
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
      <Text style={s.subtitle}>
        Permintaan bantuan yang tersimpan di HP ini.
      </Text>

      {requests.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.icon}>📭</Text>
          <Text style={s.emptyTitle}>Belum ada riwayat</Text>
          <Text style={s.subtitle}>
            Permintaan yang kamu simpan akan muncul di sini.
          </Text>
        </View>
      ) : (
        requests.map((item) => (
          <View style={s.card} key={item.id}>
            <Text style={s.cardTitle}>🆘 {item.title}</Text>
            <Text style={s.description}>{item.description}</Text>
            <Text style={s.status}>
              Status: {item.status || "Menunggu bantuan"}
            </Text>
            <Text style={s.date}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleString("id-ID")
                : ""}
            </Text>
          </View>
        ))
      )}

      <Pressable
        style={s.button}
        onPress={() => router.replace("/home")}
      >
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
