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
status: string;
created_at: string;
};

export default function Nearby() {
const [requests, setRequests] = useState<HelpRequest[]>([]);
const [refreshing, setRefreshing] = useState(false);
const [loading, setLoading] = useState(true);

const loadRequests = async () => {
try {
const { data, error } = await supabase
.from("help_requests")
.select("id, request_type, description, status, created_at")
.order("created_at", { ascending: false });

  if (error) {
    Alert.alert("Gagal memuat permintaan", error.message);
    return;
  }

  setRequests(data ?? []);
} catch (error) {
  Alert.alert(
    "Kesalahan koneksi",
    error instanceof Error
      ? error.message
      : "Periksa koneksi internet Anda."
  );
} finally {
  setRefreshing(false);
  setLoading(false);
}

};

useFocusEffect(
useCallback(() => {
loadRequests();
}, [])
);

const refreshRequests = () => {
setRefreshing(true);
loadRequests();
};

return (
<ScrollView
style={s.page}
contentContainerStyle={s.container}
refreshControl={
<RefreshControl
refreshing={refreshing}
onRefresh={refreshRequests}
/>
}
>
<Text style={s.title}>🔎 Permintaan Bantuan</Text>
<Text style={s.subtitle}>
Daftar permintaan bantuan dari server.
</Text>

  {loading ? (
    <View style={s.empty}>
      <ActivityIndicator size="large" color="#e53935" />
      <Text style={s.subtitle}>Memuat permintaan...</Text>
    </View>
  ) : requests.length === 0 ? (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>📭</Text>
      <Text style={s.emptyTitle}>Belum ada permintaan</Text>
      <Text style={s.subtitle}>
        Permintaan yang dikirim akan muncul di sini.
      </Text>
    </View>
  ) : (
    requests.map((item) => (
      <View key={item.id} style={s.card}>
        <Text style={s.cardTitle}>🆘 {item.request_type}</Text>
        <Text style={s.description}>{item.description}</Text>
        <Text style={s.status}>
          ● {item.status || "Menunggu"}
        </Text>
        <Text style={s.date}>
          {new Date(item.created_at).toLocaleString("id-ID")}
        </Text>
      </View>
    ))
  )}

  <Pressable
    style={s.button}
    onPress={() => router.push("/request")}
  >
    <Text style={s.buttonText}>+ Buat Permintaan</Text>
  </Pressable>

  <Pressable
    style={s.back}
    onPress={() => router.replace("/home")}
  >
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
empty: {
alignItems: "center",
backgroundColor: "#fff",
padding: 25,
borderRadius: 16,
marginTop: 20,
},
emptyIcon: { fontSize: 42, marginBottom: 10 },
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
date: { color: "#888", fontSize: 12, marginTop: 8 },
button: {
backgroundColor: "#e53935",
padding: 16,
borderRadius: 12,
alignItems: "center",
marginTop: 20,
},
buttonText: { color: "#fff", fontWeight: "800" },
back: { padding: 18, alignItems: "center" },
});
