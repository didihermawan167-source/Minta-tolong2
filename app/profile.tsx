import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";

export default function Profile() {
  const [user, setUser] = useState<{ name?: string; email?: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data, error }) => {
        if (error) throw error;
        if (data.user) {
          setUser({
            name: String(data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Pengguna"),
            email: data.user.email || "",
          });
        }
      })
      .catch((error) => Alert.alert("Profil", error instanceof Error ? error.message : "Profil belum dapat dimuat."))
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    Alert.alert("Keluar", "Yakin ingin keluar dari akun?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) {
            Alert.alert("Gagal keluar", error.message);
            return;
          }
          router.replace("/login");
        },
      },
    ]);
  };

  if (loading) return <View style={s.loading}><ActivityIndicator size="large" color="#e53935" /></View>;

  return (
    <View style={s.wrap}>
      <Text style={s.avatar}>👤</Text>
      <Text style={s.name}>{user.name || "Pengguna"}</Text>
      <Text style={s.email}>{user.email || ""}</Text>
      <View style={s.card}><Text style={s.rating}>⭐ 5.0</Text><Text>Rating pengguna</Text></View>
      <Pressable style={s.btn} onPress={() => router.push("/history")}><Text>📋  Riwayat bantuan</Text></Pressable>
      <Pressable style={s.btn} onPress={() => router.replace("/home")}><Text>🏠  Kembali ke beranda</Text></Pressable>
      <Pressable style={s.out} onPress={logout}><Text style={{ color: "#e53935", fontWeight: "700" }}>Keluar</Text></Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 25, alignItems: "center", backgroundColor: "#fff" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  avatar: { fontSize: 70, marginTop: 40 }, name: { fontSize: 25, fontWeight: "800", marginTop: 10 },
  email: { color: "#777", marginTop: 5 },
  card: { width: "100%", backgroundColor: "#f7f7f7", padding: 20, borderRadius: 15, alignItems: "center", marginVertical: 25 },
  rating: { fontSize: 25, fontWeight: "800", marginBottom: 5 },
  btn: { width: "100%", padding: 17, borderWidth: 1, borderColor: "#ddd", borderRadius: 12, alignItems: "center", marginBottom: 10 },
  out: { marginTop: 15, padding: 15 },
});
