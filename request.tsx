
import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, Alert
} from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import { supabase } from "../lib/supabase";

const radii = [200, 500, 1000, 2000];

export default function Request() {
  const [type, setType] = useState("Bantuan umum");
  const [desc, setDesc] = useState("");
  const [r, setR] = useState(500);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!desc.trim()) {
      Alert.alert("Isi bantuan", "Jelaskan bantuan yang Anda butuhkan.");
      return;
    }

    setSending(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert("Lokasi diperlukan", "Izinkan akses lokasi.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { error } = await supabase.from("help_requests").insert({
        description: desc.trim(),
        request_type: type,
        radius_m: r,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        status: "Menunggu",
      });

      if (error) throw error;

      Alert.alert(
        "Terkirim",
        "Permintaan bantuan sudah dikirim secara online.",
        [{ text: "OK", onPress: () => router.replace("/home") }]
      );
      setDesc("");
    } catch (error) {
      Alert.alert(
        "Belum berhasil",
        error instanceof Error ? error.message : "Periksa koneksi internet."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>🆘 Minta Tolong</Text>
      <Text style={s.label}>Jenis bantuan</Text>

      <View style={s.chips}>
        {["Bantuan umum", "Antar/ambil", "Darurat ringan", "Lainnya"].map(x => (
          <Pressable
            key={x}
            onPress={() => setType(x)}
            style={[s.chip, type === x && s.sel]}
          >
            <Text>{x}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Jarak pencarian</Text>
      <View style={s.chips}>
        {radii.map(x => (
          <Pressable
            key={x}
            onPress={() => setR(x)}
            style={[s.chip, r === x && s.sel]}
          >
            <Text>{x >= 1000 ? x / 1000 + " km" : x + " m"}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>Apa yang Anda butuhkan?</Text>
      <TextInput
        multiline
        value={desc}
        onChangeText={setDesc}
        placeholder="Contoh: Tolong bantu ambil paket..."
        style={s.area}
      />

      <Pressable
        style={[s.btn, sending && { opacity: 0.6 }]}
        onPress={send}
        disabled={sending}
      >
        <Text style={s.bt}>
          {sending ? "MENGIRIM..." : "KIRIM PERMINTAAN"}
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 24 },
  label: { fontWeight: "700", marginTop: 10, marginBottom: 9 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1, borderColor: "#ddd",
    paddingVertical: 10, paddingHorizontal: 13, borderRadius: 20
  },
  sel: { backgroundColor: "#ffe3e3", borderColor: "#e53935" },
  area: {
    height: 130, borderWidth: 1, borderColor: "#ddd",
    borderRadius: 14, padding: 14, textAlignVertical: "top",
    marginBottom: 20
  },
  btn: {
    backgroundColor: "#e53935", padding: 16,
    borderRadius: 13, alignItems: "center"
  },
  bt: { color: "#fff", fontWeight: "800" },
});
