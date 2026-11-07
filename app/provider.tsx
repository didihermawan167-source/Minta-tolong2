import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";

export default function Provider() {
  return (
    <ScrollView style={s.page} contentContainerStyle={s.wrap}>
      <Text style={s.title}>Daftar Penyedia Jasa</Text>
      <View style={s.notice}>
        <Text style={s.noticeTitle}>Pendaftaran belum aktif</Text>
        <Text style={s.noticeText}>
          Aplikasi belum memiliki tabel penyedia jasa dan aturan penyimpanan yang
          terverifikasi. Karena itu, formulir pendaftaran belum menerima data dan
          belum ada profil penyedia yang dipublikasikan.
        </Text>
        <Text style={s.noticeText}>
          Fitur ini baru akan diaktifkan setelah sumber data, izin akses, dan
          penyimpanan profil diuji dengan aman.
        </Text>
      </View>
      <Pressable style={s.back} onPress={() => router.replace("/home")}>
        <Text style={s.backText}>← Kembali ke Beranda</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f5f7fb" },
  wrap: { padding: 20, paddingBottom: 35 },
  title: { fontSize: 25, fontWeight: "900", color: "#172033", marginTop: 18, marginBottom: 18 },
  notice: { backgroundColor: "#fff4df", padding: 16, borderRadius: 13, gap: 9 },
  noticeTitle: { fontWeight: "900", color: "#8a5200", fontSize: 16 },
  noticeText: { color: "#795b2a", fontSize: 13, lineHeight: 20 },
  back: { alignItems: "center", padding: 18, marginTop: 10 },
  backText: { color: "#344054", fontWeight: "700" },
});
