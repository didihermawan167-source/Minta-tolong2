app/home.tsx
import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { getItem } from "../lib/storage";

export default function Home() {
const [loc, setLoc] = useState<Location.LocationObject | null>(null);
const [user, setUser] = useState<any>({});

useEffect(() => {
getItem("user").then((v) => {
if (v) setUser(JSON.parse(v));
});

Location.requestForegroundPermissionsAsync().then(async (p) => {
  if (p.status === "granted") {
    try {
      setLoc(
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
      );
    } catch {
      Alert.alert("Lokasi", "Lokasi belum bisa didapatkan.");
    }
  }
});

}, []);

return (
<View style={s.wrap}>
<View style={s.head}>
<View>
<Text style={s.small}>Halo 👋</Text>
<Text style={s.name}>{user.name || "Pengguna"}</Text>
</View>
<Pressable onPress={() => router.push("/profile")}>
<Text style={s.avatar}>👤</Text>
</Pressable>
</View>

  <View style={s.card}>
    <Text style={s.ct}>📍 Lokasi</Text>
    <Text style={s.muted}>
      {loc ? "Lokasi GPS aktif" : "Lokasi belum aktif"}
    </Text>
    <Text style={s.radius}>
      Radius bantuan: <Text style={{ fontWeight: "800" }}>200 m – 2 km</Text>
    </Text>
  </View>

  <Pressable style={s.help} onPress={() => router.push("/request")}>
    <Text style={s.helpIcon}>🆘</Text>
    <Text style={s.helpText}>MINTA TOLONG</Text>
    <Text style={s.helpSub}>Kirim permintaan ke orang di sekitar</Text>
  </Pressable>

  <Pressable style={s.secondary} onPress={() => router.push("/nearby")}>
    <Text style={s.secT}>🔎 Lihat permintaan di sekitar</Text>
  </Pressable>

  <View style={s.row}>
    <Pressable style={s.tile} onPress={() => router.push("/history")}>
      <Text style={s.ti}>📋</Text>
      <Text>Riwayat</Text>
    </Pressable>
    <Pressable style={s.tile} onPress={() => router.push("/profile")}>
      <Text style={s.ti}>⭐</Text>
      <Text>Profil & Rating</Text>
    </Pressable>
  </View>
</View>

);
}

const s = StyleSheet.create({
wrap: { flex: 1, padding: 20, backgroundColor: "#f7f7f7" },
head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
small: { color: "#777" },
name: { fontSize: 23, fontWeight: "800" },
avatar: { fontSize: 28 },
card: { backgroundColor: "#fff", borderRadius: 16, padding: 17, marginBottom: 16 },
ct: { fontWeight: "700", fontSize: 16 },
muted: { color: "#666", marginTop: 5 },
radius: { marginTop: 12 },
help: { backgroundColor: "#e53935", borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 14 },
helpIcon: { fontSize: 40 },
helpText: { fontSize: 22, color: "#fff", fontWeight: "900", marginTop: 6 },
helpSub: { color: "#ffecec", marginTop: 5 },
secondary: { backgroundColor: "#fff", padding: 17, borderRadius: 14, alignItems: "center" },
secT: { fontWeight: "700" },
row: { flexDirection: "row", gap: 12, marginTop: 14 },
tile: { flex: 1, backgroundColor: "#fff", padding: 18, borderRadius: 14, alignItems: "center" },
ti: { fontSize: 26, marginBottom: 5 },
});
