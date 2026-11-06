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
          setLoc(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
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
          <Text style={s.small}>Halo 👋 Selamat datang</Text>
          <Text style={s.name}>{user.name || "Pengguna"}</Text>
        </View>
        <Pressable style={s.avatarBox} onPress={() => router.push("/profile")}>
          <Text style={s.avatar}>👤</Text>
          <Text style={s.avatarLabel}>Profil</Text>
        </Pressable>
      </View>

      <View style={s.card}>
        <View style={s.cardHeading}>
          <View style={s.locationIcon}><Text style={s.locationEmoji}>📍</Text></View>
          <View style={s.locationText}>
            <Text style={s.ct}>Lokasi Anda</Text>
            <Text style={s.muted}>{loc ? "🟢 GPS aktif" : "⚪ GPS belum aktif"}</Text>
          </View>
          <Text style={s.compass}>🧭</Text>
        </View>
        <Text style={s.radius}>Lokasi membantu menemukan pertolongan di sekitar Anda.</Text>
      </View>

      <Pressable style={s.help} onPress={() => router.push("/request")}>
        <View style={s.sosBadge}><Text style={s.helpIcon}>🆘</Text></View>
        <Text style={s.helpText}>MINTA TOLONG</Text>
        <Text style={s.helpSub}>Kirim permintaan bantuan</Text>
        <View style={s.helpHint}><Text style={s.helpHintText}>Tekan di sini jika membutuhkan bantuan  →</Text></View>
      </Pressable>

      <Pressable style={s.secondary} onPress={() => router.push("/nearby")}>
        <View style={s.secondaryIcon}><Text style={s.secondaryEmoji}>🔎</Text></View>
        <View style={s.secondaryCopy}>
          <Text style={s.secT}>Lihat permintaan bantuan</Text>
          <Text style={s.secSub}>Temukan orang yang membutuhkan pertolongan</Text>
        </View>
        <Text style={s.chevron}>›</Text>
      </Pressable>

      <View style={s.row}>
        <Pressable style={s.tile} onPress={() => router.push("/history")}>
          <View style={[s.tileIcon, s.historyIcon]}><Text style={s.ti}>📋</Text></View>
          <Text style={s.tileTitle}>Riwayat</Text>
          <Text style={s.tileSub}>Aktivitas bantuan</Text>
        </Pressable>
        <Pressable style={s.tile} onPress={() => router.push("/profile")}>
          <View style={[s.tileIcon, s.ratingIcon]}><Text style={s.ti}>⭐</Text></View>
          <Text style={s.tileTitle}>Profil & Rating</Text>
          <Text style={s.tileSub}>Akun dan penilaian</Text>
        </Pressable>
      </View>
      <View style={s.marketplace}>
        <Text style={s.marketTitle}>Marketplace Jasa</Text>
        <Pressable style={s.marketItem} onPress={() => router.push("/services")}>
          <Text style={s.marketEmoji}>🧰</Text><Text style={s.marketText}>Cari Jasa</Text><Text style={s.marketArrow}>›</Text>
        </Pressable>
        <Pressable style={s.marketItem} onPress={() => router.push("/provider")}>
          <Text style={s.marketEmoji}>🧑‍🔧</Text><Text style={s.marketText}>Daftar Penyedia Jasa</Text><Text style={s.marketArrow}>›</Text>
        </Pressable>
        <Pressable style={s.marketItem} onPress={() => router.push("/payments")}>
          <Text style={s.marketEmoji}>💳</Text><Text style={s.marketText}>Pembayaran & Komisi</Text><Text style={s.marketArrow}>›</Text>
        </Pressable>
      </View>
      <View style={s.footer}><Text style={s.footerText}>🤝 Bersama, saling membantu</Text></View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: "#f5f7fb" },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  small: { color: "#77808d", fontSize: 14 },
  name: { fontSize: 25, fontWeight: "800", color: "#172033", marginTop: 2 },
  avatarBox: { alignItems: "center", justifyContent: "center", backgroundColor: "#e8f1ff", width: 58, height: 58, borderRadius: 18 },
  avatar: { fontSize: 25 },
  avatarLabel: { fontSize: 9, color: "#2367b7", fontWeight: "700", marginTop: 1 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 17, marginBottom: 16, borderWidth: 1, borderColor: "#edf0f5" },
  cardHeading: { flexDirection: "row", alignItems: "center" },
  locationIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#eaf3ff", alignItems: "center", justifyContent: "center" },
  locationEmoji: { fontSize: 21 },
  locationText: { flex: 1, marginLeft: 11 },
  ct: { fontWeight: "800", fontSize: 16, color: "#172033" },
  muted: { color: "#667085", marginTop: 4, fontSize: 13 },
  compass: { fontSize: 25 },
  radius: { marginTop: 13, color: "#667085", lineHeight: 20, fontSize: 13 },
  help: { backgroundColor: "#e53935", borderRadius: 21, padding: 22, alignItems: "center", marginBottom: 14, shadowColor: "#b42318", shadowOpacity: 0.18, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  sosBadge: { width: 58, height: 58, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  helpIcon: { fontSize: 34 },
  helpText: { fontSize: 22, color: "#fff", fontWeight: "900", marginTop: 8 },
  helpSub: { color: "#ffecec", marginTop: 4, fontSize: 14 },
  helpHint: { marginTop: 14, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: "rgba(255,255,255,0.16)" },
  helpHintText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  secondary: { backgroundColor: "#fff", padding: 14, borderRadius: 16, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#edf0f5" },
  secondaryIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: "#fff4df", alignItems: "center", justifyContent: "center" },
  secondaryEmoji: { fontSize: 22 },
  secondaryCopy: { flex: 1, marginLeft: 12 },
  secT: { fontWeight: "800", color: "#172033", fontSize: 14 },
  secSub: { color: "#87909e", fontSize: 11, marginTop: 3 },
  chevron: { fontSize: 27, color: "#98a2b3", marginLeft: 5 },
  row: { flexDirection: "row", gap: 12, marginTop: 14 },
  tile: { flex: 1, backgroundColor: "#fff", padding: 16, borderRadius: 17, alignItems: "center", borderWidth: 1, borderColor: "#edf0f5" },
  tileIcon: { width: 52, height: 52, borderRadius: 17, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  historyIcon: { backgroundColor: "#eaf3ff" },
  ratingIcon: { backgroundColor: "#fff5d9" },
  ti: { fontSize: 26 },
  tileTitle: { color: "#172033", fontWeight: "800", fontSize: 13 },
  tileSub: { color: "#87909e", fontSize: 10, marginTop: 4 },
  marketplace: { marginTop: 15, backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#edf0f5" },
  marketTitle: { fontSize: 16, fontWeight: "800", color: "#172033", marginBottom: 5 },
  marketItem: { flexDirection: "row", alignItems: "center", paddingVertical: 11, borderTopWidth: 1, borderTopColor: "#f0f2f5" },
  marketEmoji: { fontSize: 21, width: 38 },
  marketText: { flex: 1, fontSize: 13, fontWeight: "700", color: "#344054" },
  marketArrow: { fontSize: 23, color: "#98a2b3" },
  footer: { alignItems: "center", marginTop: 22 },
  footerText: { color: "#98a2b3", fontSize: 12 }
});
