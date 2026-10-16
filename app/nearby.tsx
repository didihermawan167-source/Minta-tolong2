app/nearby.tsx
import { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getItem } from "../lib/storage";

export default function Nearby() {
  const [requests, setRequests] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = async () => {
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
      loadRequests();
    }, [])
  );

  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          loadRequests();
        }} />
      }
    >
      <Text style={s.title}>🔎 Permintaan Bantuan</Text>
      <Text style={s.subtitle}>
        Daftar permintaan yang tersimpan di HP ini.
      </Text>

      <View style={s.notice}>
        <Text style={s.noticeText}>
          ℹ️ Mode demo: daftar ini belum mengambil permintaan dari pengguna lain atau memfilter jarak GPS.
        </Text>
      </View>

      {requests.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📭</Text>
          <Text style={s.emptyTitle}>Belum ada permintaan</Text>
          <Text style={s.subtitle}>
            Permintaan yang dibuat di HP ini akan muncul di sini.
          </Text>
        </View>
      ) : (
        requests.map((item) => (
          <View key={item.id} style={s.card}>
            <Text style={s.cardTitle}>🆘 {item.title}</Text>
            <Text style={s.description}>{item.description}</Text>
            <Text style={s.status}>● {item.status || "Menunggu bantuan"}</Text>
          </View>
        ))
      )}

      <Pressable style={s.button} onPress={() => router.push("/request")}>
        <Text style={s.buttonText}>+ Buat Permintaan</Text>
      </Pressable>

      <Pressable style={s.back} onPress={() => router.replace("/home")}>
        <Text>← Kembali ke Beranda</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f7f7f7" },
  container: { padding: 20, paddingBottom: 35 },
  title: { fontSize: 24, fontWeight: "800", marginTop: 20 },
  subtitle: { color: "#666", marginTop: 8, lineHeight: 21 },
  notice: { backgroundColor: "#fff4d6", padding: 14, borderRadius: 12, marginTop: 18 },
  noticeText: { color: "#795b13", lineHeight: 20 },
  empty: { alignItems: "center", backgroundColor: "#fff", padding: 25, borderRadius: 16, marginTop: 20 },
  emptyIcon: { fontSize: 42, marginBottom: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 17, marginTop: 15 },
  cardTitle: { fontSize: 18, fontWeight: "800" },
  description: { color: "#555", marginTop: 10, lineHeight: 21 },
  status: { color: "#e58a00", marginTop: 12, fontWeight: "700" },
  button: { backgroundColor: "#e53935", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "800" },
  back: { padding: 18, alignItems: "center" },
});
