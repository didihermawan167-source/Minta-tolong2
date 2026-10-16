app/request.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { getItem, setItem } from "../lib/storage";

export default function Request() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const sendRequest = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Belum lengkap", "Isi jenis bantuan dan keterangannya.");
      return;
    }

    setLoading(true);
    try {
      const oldData = await getItem("requests");
      const requests = oldData ? JSON.parse(oldData) : [];

      requests.unshift({
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        status: "Menunggu bantuan",
        createdAt: new Date().toISOString(),
      });

      await setItem("requests", JSON.stringify(requests));

      Alert.alert(
        "Tersimpan",
        "Permintaan tersimpan di HP ini. Belum terkirim ke pengguna lain.",
        [{ text: "OK", onPress: () => router.replace("/home") }]
      );
    } catch {
      Alert.alert("Gagal", "Permintaan belum berhasil disimpan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>🆘 Minta Tolong</Text>
      <Text style={s.subtitle}>
        Jelaskan bantuan yang sedang kamu butuhkan.
      </Text>

      <Text style={s.label}>Jenis bantuan</Text>
      <TextInput
        style={s.input}
        placeholder="Contoh: motor mogok"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={s.label}>Keterangan</Text>
      <TextInput
        style={[s.input, s.multiline]}
        placeholder="Ceritakan bantuan yang diperlukan..."
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
      />

      <Text style={s.note}>
        Permintaan ini disimpan di HP untuk demo, belum terlihat oleh orang lain.
      </Text>

      <Pressable
        style={s.button}
        onPress={sendRequest}
        disabled={loading}
      >
        <Text style={s.buttonText}>
          {loading ? "Menyimpan..." : "SIMPAN PERMINTAAN"}
        </Text>
      </Pressable>

      <Pressable style={s.back} onPress={() => router.back()}>
        <Text>← Kembali</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 22, backgroundColor: "#f7f7f7" },
  title: { fontSize: 26, fontWeight: "800", marginTop: 25 },
  subtitle: { color: "#666", marginTop: 8, marginBottom: 25 },
  label: { fontWeight: "700", marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  multiline: { height: 130 },
  note: { color: "#777", marginTop: 15, lineHeight: 20 },
  button: {
    backgroundColor: "#e53935",
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 22,
  },
  buttonText: { color: "#fff", fontWeight: "800" },
  back: { alignItems: "center", padding: 18 },
});
